// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";

/** Etichette leggibili per mongoose.connection.readyState */
const STATE_LABEL: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

/**
 * Middleware da applicare alle route che usano transazioni MongoDB (startSession).
 *
 * Se la connessione non è in stato "connected" (readyState !== 1):
 *  - logga sul server un messaggio dettagliato con host, db, stato e route
 *  - risponde immediatamente con 503 senza avviare la sessione
 *    (evita il blocco silenzioso di 10s di startSession)
 */
export const requireDbReady = (req: Request, res: Response, next: NextFunction): void => {
  const conn = mongoose.connection;
  const state = conn.readyState;

  if (state === 1) {
    next();
    return;
  }

  const label    = STATE_LABEL[state] ?? `unknown(${state})`;
  const host     = conn.host  ?? "n/a";
  const port     = conn.port  ?? "n/a";
  const dbName   = conn.name  ?? "n/a";
  const route    = `${req.method} ${req.originalUrl}`;
  const ts       = new Date().toISOString();

  console.error(
    `[DB] Connessione non disponibile — operazione transazionale bloccata\n` +
    `  readyState : ${state} (${label})\n` +
    `  host       : ${host}:${port}/${dbName}\n` +
    `  route      : ${route}\n` +
    `  timestamp  : ${ts}`
  );

  res.status(503).json({
    error: "Database temporaneamente non raggiungibile. Riprova tra qualche istante.",
  });
};
