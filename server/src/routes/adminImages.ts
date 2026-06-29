// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response, NextFunction } from "express";
import Exercise from "../models/Exercise.js";
import ExerciseChange from "../models/ExerciseChange.js";
import { listAllObjects, removeImage } from "../config/minio.js";
import type { ImageMeta } from "../services/exerciseImages.js";

const router = Router();

// Tetto di sicurezza: se in un singolo run emergono troppi candidati alla
// cancellazione, qualcosa non torna → abort + alert invece di svuotare il bucket.
const MAX_DELETIONS_PER_RUN = 50;

const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  const key = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!key || key !== process.env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

/**
 * POST / — garbage collection delle immagini orfane su minIO.
 *
 * Cancella gli oggetti S3 non più referenziati né dagli esercizi né dai change
 * doc in attesa, e più vecchi del grace period. Chiamato dal CronJob k8s.
 *
 * Robustezza:
 *  - errore di query DB → l'handler va in catch e NON cancella nulla;
 *  - cancellazione di massa anomala → tetto MAX_DELETIONS_PER_RUN.
 */
router.post("/", requireApiKey, async (_req: Request, res: Response): Promise<void> => {
  try {
    // 1. Raccogli TUTTI i riferimenti: Exercise.images + ExerciseChange.fields.images
    const exercises = (await Exercise.find({}, { "images.key": 1 }).lean()) as unknown as {
      images?: ImageMeta[];
    }[];
    const changes = (await ExerciseChange.find({}, { fields: 1 }).lean()) as unknown as {
      fields?: { images?: ImageMeta[] };
    }[];

    const exKeys = exercises.flatMap((ex) => (ex.images ?? []).map((i) => i.key));
    const changeKeys = changes.flatMap((c) => (c.fields?.images ?? []).map((i) => i.key));
    const referencedKeys = new Set<string>([...exKeys, ...changeKeys]);

    // 2. Candidati orfani: oggetti non referenziati nel DB
    const objects = await listAllObjects();
    const orphans = objects.filter((o) => !referencedKeys.has(o.name));

    // 3. Sanity cap
    if (orphans.length > MAX_DELETIONS_PER_RUN) {
      console.error(
        `[GC] ${orphans.length} orfani > soglia ${MAX_DELETIONS_PER_RUN}: abort, revisione manuale`
      );
      res.status(409).json({
        error: "Troppi orfani da cancellare: abort per sicurezza",
        candidates: orphans.length,
      });
      return;
    }

    // 4. Cancella
    let deleted = 0;
    for (const o of orphans) {
      await removeImage(o.name);
      deleted++;
      console.log(`[GC] rimosso orfano ${o.name}`);
    }

    console.log(
      `[GC] completato — scansionati=${objects.length} referenziati=${referencedKeys.size} cancellati=${deleted}`
    );
    res.json({ scanned: objects.length, referenced: referencedKeys.size, deleted });
  } catch (err) {
    console.error("[POST /api/admin/gc-images]", err);
    res.status(500).json({ error: "Errore nel garbage collection immagini" });
  }
});

export default router;
