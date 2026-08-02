// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

import { createApp } from "./app.js";
import { ensureBucket } from "./config/minio.js";

// Il .env è alla root del monorepo (due livelli sopra server/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI non è configurata. Aggiungila nel file .env alla root del progetto (o impostala come variabile d'ambiente).");
  process.exit(1);
}

// Creazione dell'app separata in app.ts (vedi lì): permette ai test di
// importare createApp() con un mongoUri diverso (es. il container Mongo
// effimero dei test API) senza avviare un vero server né i retry di
// connessione qui sotto.
const app = createApp({ mongoUri: MONGODB_URI });

// ── Event listeners sulla connessione DB ──────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn(
    `[DB] Connessione persa` +
    ` | host: ${mongoose.connection.host ?? "n/a"}` +
    ` | ${new Date().toISOString()}`
  );
});

mongoose.connection.on("reconnected", () => {
  console.log(
    `[DB] Connessione ripristinata` +
    ` | host: ${mongoose.connection.host ?? "n/a"}` +
    ` | ${new Date().toISOString()}`
  );
});

mongoose.connection.on("error", (err) => {
  console.error(
    `[DB] Errore sulla connessione — ${err.message}` +
    ` | readyState: ${mongoose.connection.readyState}` +
    ` | ${new Date().toISOString()}`
  );
});

// ── Connessione a MongoDB con retry ───────────────────────────────────────────
// Non blocca l'avvio del server HTTP. Se il DB non è disponibile al primo
// tentativo, riprova ogni 5 secondi fino al successo. Le route sono già
// protette da requireDbReady che risponde 503 finché readyState !== 1.

const RETRY_DELAY_MS = 5000;

const connectWithRetry = async (): Promise<void> => {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      await mongoose.connect(MONGODB_URI);
      console.log(
        `[DB] Connesso a MongoDB (tentativo ${attempt})` +
        ` | ${new Date().toISOString()}`
      );
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[DB] Connessione fallita (tentativo ${attempt})` +
        ` — nuovo tentativo tra ${RETRY_DELAY_MS / 1000}s` +
        `\n  errore    : ${msg}` +
        `\n  timestamp : ${new Date().toISOString()}`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

// ── Avvio ─────────────────────────────────────────────────────────────────────
// Il server HTTP parte immediatamente. La connessione al DB avviene in
// background: durante il downtime tutte le route API restituiscono 503
// grazie al middleware requireDbReady.

app.listen(PORT, () => {
  console.log(`[SERVER] Avviato sulla porta ${PORT} | ${new Date().toISOString()}`);
  connectWithRetry();
  // Crea il bucket immagini se non esiste. Non blocca l'avvio: in caso di
  // errore (minIO non ancora pronto) logga e i singoli upload falliranno
  // con un errore esplicito.
  ensureBucket();
});
