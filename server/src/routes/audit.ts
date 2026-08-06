// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response, NextFunction } from "express";
import type { PipelineStage } from "mongoose";
import Exercise from "../models/Exercise.js";
import ExerciseChange from "../models/ExerciseChange.js";
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

// Numero massimo di utenti restituiti dalle classifiche.
const TOP_USERS_LIMIT = 5;

/**
 * Traduce i query param `from`/`to` in un filtro su createdAt, o restituisce
 * il messaggio d'errore da mandare al client. `to` è opzionale e inclusivo
 * dell'intera giornata (i parametri arrivano come date pure, senza ora).
 */
const buildDateRangeFilter = (
  query: Request["query"]
): { filter: Record<string, Date> } | { error: string } => {
  const { from, to } = query;
  const fromDate = new Date(from as string);

  if (!from || isNaN(fromDate.getTime())) {
    return { error: "Parametro 'from' mancante o non valido" };
  }

  const filter: Record<string, Date> = { $gte: fromDate };

  if (to) {
    const toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) {
      return { error: "Parametro 'to' non valido" };
    }
    toDate.setDate(toDate.getDate() + 1);
    filter.$lt = toDate;
  }

  return { filter };
};

/** Group + sort + limit + project condivisi dalle due classifiche. */
const rankByUser = (countLabel: string): PipelineStage[] => [
  { $group: { _id: "$user", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: TOP_USERS_LIMIT },
  { $project: { _id: 0, user: "$_id", [countLabel]: "$count" } },
];

// GET /created-by-user?from=YYYY-MM-DD&to=YYYY-MM-DD — classifica utenti per
// numero di esercizi creati (Exercise.user, impostato una sola volta alla
// creazione, mai sovrascritto) nell'intervallo indicato.
router.get("/created-by-user", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const range = buildDateRangeFilter(req.query);
  if ("error" in range) {
    res.status(400).json({ error: range.error });
    return;
  }

  try {
    const result = await Exercise.aggregate([
      { $match: { createdAt: range.filter } },
      ...rankByUser("exercisesCreated"),
    ]);
    res.json(result);
  } catch (err) {
    logger.error("[GET /audit/created-by-user]", err);
    res.status(500).json({ error: "Errore nel calcolo della classifica" });
  }
});

// GET /changes-by-user?from=YYYY-MM-DD&to=YYYY-MM-DD — classifica utenti per
// numero di modifiche PROPOSTE nell'intervallo indicato.
//
// ExerciseChange.user è il proponente originale: scritto alla creazione del
// change doc e mai sovrascritto, nemmeno quando un admin altera i campi in
// fase di approvazione (quel percorso tocca solo userUpdate).
//
// Si raggruppa su createdAt (data della proposta) e non sulla data di
// risoluzione, per coerenza con /created-by-user: la domanda è "quante
// modifiche ha proposto un utente in quel periodo", non "quante ne sono state
// chiuse".
//
// Nessun filtro su state: contano tutte le proposte arrivate a un admin,
// indipendentemente dall'esito (APPROVED/REJECTED) o dal fatto che siano
// ancora PENDING. Le modifiche ritirate dall'utente prima della revisione non
// compaiono perché il loro documento viene cancellato (vedi PUT /:id in
// exercises.ts) — non sono mai state una proposta.
router.get("/changes-by-user", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const range = buildDateRangeFilter(req.query);
  if ("error" in range) {
    res.status(400).json({ error: range.error });
    return;
  }

  try {
    const result = await ExerciseChange.aggregate([
      { $match: { createdAt: range.filter } },
      ...rankByUser("changesProposed"),
    ]);
    res.json(result);
  } catch (err) {
    logger.error("[GET /audit/changes-by-user]", err);
    res.status(500).json({ error: "Errore nel calcolo della classifica" });
  }
});

export default router;
