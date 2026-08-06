// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response, NextFunction } from "express";
import Exercise from "../models/Exercise.js";
import { requireDbReady } from "../middleware/requireDbReady.js";
import { logger } from "../utils/logger.js";

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Accesso riservato agli amministratori" });
    return;
  }
  next();
};

// Numero massimo di utenti restituiti dalla classifica: vedi query/esercizi_creati_per_utente.js,
// stessa logica riportata qui in forma di API.
const TOP_USERS_LIMIT = 5;

// GET /created-by-user?from=YYYY-MM-DD&to=YYYY-MM-DD — classifica utenti per
// numero di esercizi creati (Exercise.user, impostato una sola volta alla
// creazione, mai sovrascritto) nell'intervallo indicato. "to" è opzionale e
// inclusivo dell'intera giornata.
router.get("/created-by-user", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const fromDate = new Date(from as string);

  if (!from || isNaN(fromDate.getTime())) {
    res.status(400).json({ error: "Parametro 'from' mancante o non valido" });
    return;
  }

  const createdAtFilter: Record<string, Date> = { $gte: fromDate };

  if (to) {
    const toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) {
      res.status(400).json({ error: "Parametro 'to' non valido" });
      return;
    }
    // Limite superiore esclusivo = inizio del giorno successivo, per includere
    // l'intera giornata "to" (il parametro arriva come data pura, senza ora).
    toDate.setDate(toDate.getDate() + 1);
    createdAtFilter.$lt = toDate;
  }

  try {
    const result = await Exercise.aggregate([
      { $match: { createdAt: createdAtFilter } },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: TOP_USERS_LIMIT },
      { $project: { _id: 0, user: "$_id", exercisesCreated: "$count" } },
    ]);
    res.json(result);
  } catch (err) {
    logger.error("[GET /audit/created-by-user]", err);
    res.status(500).json({ error: "Errore nel calcolo della classifica" });
  }
});

export default router;
