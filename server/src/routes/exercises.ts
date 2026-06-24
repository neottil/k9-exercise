// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose from "mongoose";
import { Router, Request, Response, NextFunction } from "express";
import Exercise from "../models/Exercise.js";
import ExerciseChange from "../models/ExerciseChange.js";
import { requireDbReady } from "../middleware/requireDbReady.js";

// Middleware: solo admin — usato sulle route di approvazione
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Accesso riservato agli amministratori" });
    return;
  }
  next();
};

const router = Router();

// requireDbReady è applicato solo alle route di scrittura (POST / PUT).
// Le GET possono girare anche con DB in fase di riconnessione: Mongoose
// bufferizza la query e risponde non appena il DB torna disponibile.

const TO_APPROVE     = "TO_APPROVE"     as const;
const APPROVED       = "APPROVED"       as const;
const PENDING_UPDATE = "PENDING_UPDATE" as const;
const REJECTED       = "REJECTED"       as const;

// Campi filtrabili via query param
const FILTER_FIELDS = [
  "workingArea.mental",
  "workingArea.flexibility",
  "workingArea.strength",
  "workingArea.balance",
  "workingArea.cardio",
  "bodyTarget.ant",
  "bodyTarget.post",
  "bodyTarget.core",
  "bodyTarget.backbone",
  "bodyTarget.fullBody",
];

// Campi di contenuto: gli unici su cui calcolare il diff e salvare le changes
const CONTENT_FIELDS = [
  "instructorLevel", "type", "variant", "description",
  "workingArea", "bodyTarget",
  "movementPlan", "tools",
  "difficultyLevel", "setup",
];

/**
 * Costruisce la query MongoDB dai query param.
 * Ogni filtro attivo (value > 0) diventa un $or che passa sia i null/mancanti
 * sia i valori che soddisfano l'operazione (gte | eq).
 */
const buildMongoFilter = (query: Request["query"]): object => {
  const andConditions: object[] = [];

  for (const field of FILTER_FIELDS) {
    const rawValue = query[`${field}.value`];
    const operation = query[`${field}.operation`] as string | undefined;
    const value = parseFloat(rawValue as string);

    if (isNaN(value) || value <= 0) continue;

    const valueCondition =
      operation === "eq"
        ? { [field]: value }
        : { [field]: { $gte: value } };

    andConditions.push({
      $or: [{ [field]: null }, valueCondition],
    });
  }

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

/**
 * Calcola il diff tra i dati originali approvati e i dati inviati dal client.
 * Restituisce solo i campi di contenuto che sono effettivamente cambiati.
 */
const computeDiff = (
  original: Record<string, unknown>,
  submitted: Record<string, unknown>
): Record<string, unknown> => {
  const diff: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) {
    if (JSON.stringify(original[field]) !== JSON.stringify(submitted[field])) {
      diff[field] = submitted[field];
    }
  }
  return diff;
};

// GET / — lista esercizi (esclude TO_APPROVE, filtra per livello utente)
// CTS: vede tutto. BSS (o livello non impostato): solo esercizi BSS o senza livello.
router.get("/", async (req: Request, res: Response) => {
  try {
    const mongoFilter = buildMongoFilter(req.query);
    const isCTS = req.user?.instructorLevel === "CTS";
    const levelFilter = isCTS ? {} : { $or: [{ instructorLevel: "BSS" }, { instructorLevel: null }] };
    const filter = { ...mongoFilter, ...levelFilter, state: { $in: [ APPROVED, PENDING_UPDATE ] } };
    const exercises = await Exercise.find(filter);
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli esercizi" });
  }
});

// GET /types — tipi distinti (tutti, indipendentemente dallo stato)
router.get("/types", async (_req: Request, res: Response) => {
  try {
    const types = await Exercise.distinct("type");
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei tipi" });
  }
});

// GET /pending — esercizi in PENDING_UPDATE con i rispettivi change doc (solo admin)
router.get("/pending", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const exercises = await Exercise.find({ state: PENDING_UPDATE });
    const result = await Promise.all(
      exercises.map(async (ex) => {
        const change = await ExerciseChange.findOne({ exerciseId: ex._id });
        return { exercise: ex.toJSON(), change: change ? change.toJSON() : null };
      })
    );
    res.json(result);
  } catch (err) {
    console.error("[GET /exercises/pending]", err);
    res.status(500).json({ error: "Errore nel recupero delle modifiche in attesa" });
  }
});

// GET /to-approve — esercizi in TO_APPROVE (solo admin)
router.get("/to-approve", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const exercises = await Exercise.find({ state: TO_APPROVE });
    res.json(exercises);
  } catch (err) {
    console.error("[GET /exercises/to-approve]", err);
    res.status(500).json({ error: "Errore nel recupero degli esercizi da approvare" });
  }
});

// GET /:id/changes — restituisce l'esercizio con le eventuali changes applicate (per il form di modifica)
router.get("/:id/changes", async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    const change = await ExerciseChange.findOne({ exerciseId: req.params.id });
    if (!change) {
      res.json(exercise);
      return;
    }
    // Merge: campi approvati + campi modificati in attesa
    res.json({ ...exercise.toJSON(), ...(change.fields as object) });
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dell'esercizio con changes" });
  }
});

// GET /:id — restituisce l'esercizio originale (senza changes applicate)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dell'esercizio" });
  }
});

// POST / — crea nuovo esercizio, sempre in stato TO_APPROVE
router.post("/", requireDbReady, async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const exercise = new Exercise({
      _id: id,
      ...rest,
      state: TO_APPROVE,
      user: req.user?.username ?? req.user?.email,
      userUpdate: req.user?.username ?? req.user?.email,
    });
    await exercise.save();
    res.status(201).json(exercise);
  } catch (err) {
    console.error("[POST /exercises/]", err);
    res.status(500).json({ error: "Errore nel salvataggio dell'esercizio" });
  }
});

/**
 * PUT /:id — aggiornamento state-aware:
 *
 * TO_APPROVE (o senza stato) → aggiorna i campi direttamente sull'esercizio
 * APPROVED                   → crea change doc, imposta stato PENDING_UPDATE  (transazione)
 * PENDING_UPDATE             → aggiorna il change doc esistente                (transazione)
 *                              Se il diff è vuoto (tutte le modifiche annullate) → elimina
 *                              il change doc e ripristina APPROVED
 */
router.put("/:id", requireDbReady, async (req: Request, res: Response) => {
  const id = req.params.id;
  console.log(`[PUT /:id] id=${id}`);
  try {
    const { id: _id, state: _state, ...submittedFields } = req.body;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      console.warn(`[PUT /:id] esercizio non trovato id=${id}`);
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }

    const exerciseData = exercise.toJSON() as Record<string, unknown>;
    const currentState = exerciseData.state as string | undefined;
    console.log(`[PUT /:id] state corrente=${currentState}`);

    // TO_APPROVE o senza stato: aggiornamento diretto
    if (!currentState || currentState === TO_APPROVE) {
      console.log(`[PUT /:id] aggiornamento diretto (TO_APPROVE / no state)`);
      const updated = await Exercise.findByIdAndUpdate(
        id,
        { $set: { ...submittedFields, userUpdate: req.user?.username ?? req.user?.email } },
        { returnDocument: "after" }
      );
      res.json(updated);
      return;
    }

    // APPROVED / PENDING_UPDATE: gestione con change doc e transazione
    const diff = computeDiff(exerciseData, submittedFields);
    console.log(`[PUT /:id] diff keys=${Object.keys(diff).join(", ") || "(nessuno)"}`);

    const session = await mongoose.startSession();
    console.log(`[PUT /:id] sessione aperta, avvio transazione`);
    try {
      session.startTransaction();

      if (currentState === APPROVED) {
        if (Object.keys(diff).length === 0) {
          console.log(`[PUT /:id] nessuna modifica effettiva, niente da fare`);
          await session.commitTransaction();
          res.json(exercise);
          return;
        }
        console.log(`[PUT /:id] APPROVED → creo change doc + PENDING_UPDATE`);
        await ExerciseChange.create(
          [{ exerciseId: id as string, fields: diff, user: req.user?.username ?? req.user?.email, userUpdate: req.user?.username ?? req.user?.email }],
          { session }
        );
        await Exercise.findByIdAndUpdate(
          id,
          { $set: { state: PENDING_UPDATE, userUpdate: req.user?.username ?? req.user?.email } },
          { session }
        );
      } else {
        // PENDING_UPDATE
        if (Object.keys(diff).length === 0) {
          console.log(`[PUT /:id] PENDING_UPDATE → diff vuoto, ripristino APPROVED`);
          await ExerciseChange.deleteOne({ exerciseId: id }, { session });
          await Exercise.findByIdAndUpdate(
            id,
            { $set: { state: APPROVED, userUpdate: req.user?.username ?? req.user?.email }, $unset: { lastNotifiedAt: "" } },
            { session }
          );
        } else {
          console.log(`[PUT /:id] PENDING_UPDATE → aggiorno change doc`);
          await ExerciseChange.findOneAndUpdate(
            { exerciseId: id },
            { $set: { fields: diff, userUpdate: req.user?.username ?? req.user?.email } },
            { session, upsert: true, returnDocument: "after" }
          );
          await Exercise.findByIdAndUpdate(
            id,
            { $set: { userUpdate: req.user?.username ?? req.user?.email } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      console.log(`[PUT /:id] transazione completata con successo`);
      res.json(exercise);
    } catch (txErr) {
      console.error(`[PUT /:id] errore nella transazione:`, txErr);
      await session.abortTransaction();
      throw txErr;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    console.error(`[PUT /:id] errore:`, err);
    res.status(500).json({ error: "Errore nell'aggiornamento dell'esercizio" });
  }
});

// POST /:id/approve — approva un nuovo esercizio (TO_APPROVE → APPROVED, solo admin)
// Body opzionale: campi dell'esercizio modificati dall'admin prima di approvare.
router.post("/:id/approve", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      console.warn(`[POST /exercises/:id/approve] esercizio non trovato in DB: id=${id}`);
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    if (exercise.state !== TO_APPROVE) {
      console.warn(`[POST /exercises/:id/approve] stato non valido: state=${exercise.state}, id=${id}`);
      res.status(409).json({ error: `Impossibile approvare: stato corrente è "${exercise.state}"` });
      return;
    }

    // Estrai dal body solo i campi di contenuto noti, ignorando metadati
    const fieldsToApply: Record<string, unknown> = {};
    for (const field of CONTENT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        fieldsToApply[field] = req.body[field];
      }
    }

    await Exercise.findByIdAndUpdate(id, {
      $set: { ...fieldsToApply, state: APPROVED, userUpdate: req.user?.username ?? req.user?.email },
      $unset: { lastNotifiedAt: "" },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[POST /exercises/:id/approve]", err);
    res.status(500).json({ error: "Errore nell'approvazione dell'esercizio" });
  }
});

// POST /:id/reject — rifiuta un nuovo esercizio (TO_APPROVE → REJECTED, solo admin)
router.post("/:id/reject", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findById(id);
    if (!exercise || exercise.state !== TO_APPROVE) {
      res.status(404).json({ error: "Esercizio non trovato o non in attesa di approvazione" });
      return;
    }
    await Exercise.findByIdAndUpdate(id, {
      $set: { state: REJECTED, userUpdate: req.user?.username ?? req.user?.email },
      $unset: { lastNotifiedAt: "" },
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[POST /exercises/:id/reject]", err);
    res.status(500).json({ error: "Errore nel rifiuto dell'esercizio" });
  }
});

// POST /:id/approve-change — applica i campi selezionati sull'esercizio, lo riporta ad APPROVED (solo admin)
// Body: { fieldsToApply?: Record<string, unknown> }
// Se fieldsToApply è assente applica tutto il change doc (compatibilità backward).
router.post("/:id/approve-change", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldsToApply } = req.body as { fieldsToApply?: Record<string, unknown> };
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const change = await ExerciseChange.findOne({ exerciseId: id }).session(session);
    if (!change) {
      await session.abortTransaction();
      res.status(404).json({ error: "Nessuna modifica in attesa per questo esercizio" });
      return;
    }

    // Usa i campi inviati dal client; fallback all'intero change doc per compatibilità
    const toApply = fieldsToApply ?? (change.fields as Record<string, unknown>);

    await Exercise.findByIdAndUpdate(
      id,
      { $set: { ...toApply, state: APPROVED, userUpdate: req.user?.username ?? req.user?.email }, $unset: { lastNotifiedAt: "" } },
      { session }
    );
    await ExerciseChange.deleteOne({ exerciseId: id }, { session });

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    console.error("[POST /exercises/:id/approve-change]", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Errore nell'approvazione della modifica" });
  } finally {
    await session.endSession();
  }
});

// POST /:id/reject-change — elimina il change doc, riporta l'esercizio ad APPROVED (solo admin)
router.post("/:id/reject-change", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await ExerciseChange.deleteOne({ exerciseId: id }, { session });
    await Exercise.findByIdAndUpdate(
      id,
      { $set: { state: APPROVED, userUpdate: req.user?.username ?? req.user?.email }, $unset: { lastNotifiedAt: "" } },
      { session }
    );

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    console.error("[POST /exercises/:id/reject-change]", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Errore nel rifiuto della modifica" });
  } finally {
    await session.endSession();
  }
});

export default router;
