// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.
//
// Script per generare un JWT di test che simula il token prodotto da WordPress.
// Uso: node scripts/generate-wp-token.mjs
//
// Richiede K9_JWT_SECRET nel file .env alla root del monorepo
// (o come variabile d'ambiente nel terminale).

// ── Configura qui per simulare diversi scenari ───────────────────────────────
const EMAIL           = "test@esempio.com";
const ROLE            = "viewer";   // "viewer" | "admin"
const EXPIRES_SECONDS = 300;        // durata del token in secondi (default WP: 300 = 5 min)
// ─────────────────────────────────────────────────────────────────────────────

import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSecretFromEnv() {
  try {
    const envPath = resolve(__dirname, "../.env");
    const content = readFileSync(envPath, "utf8");
    const match = content.match(/^K9_JWT_SECRET=(.+)$/m);
    if (match) return match[1].trim();
  } catch {
    // .env non trovato, si usa la variabile d'ambiente
  }
  return process.env.K9_JWT_SECRET ?? "";
}

const secret = readSecretFromEnv();

if (!secret || secret === "your-jwt-secret-here") {
  console.error(
    "Errore: K9_JWT_SECRET non configurato o lasciato al valore di default.\n" +
    "Impostalo nel file .env alla root del progetto oppure come variabile d'ambiente."
  );
  process.exit(1);
}

function b64url(str) {
  return Buffer.from(str).toString("base64url");
}

const now     = Math.floor(Date.now() / 1000);
const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const payload = b64url(JSON.stringify({ iat: now, exp: now + EXPIRES_SECONDS, email: EMAIL, role: ROLE }));
const sig     = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
const token   = `${header}.${payload}.${sig}`;

const port = process.env.PORT ?? "3001";
const url  = `http://localhost:${port}/api/auth/wp-callback?token=${encodeURIComponent(token)}`;

const expDate = new Date((now + EXPIRES_SECONDS) * 1000).toLocaleTimeString("it-IT");

console.log("─────────────────────────────────────────────");
console.log(`  email  : ${EMAIL}`);
console.log(`  role   : ${ROLE}`);
console.log(`  scade  : ${expDate} (tra ${EXPIRES_SECONDS}s)`);
console.log("─────────────────────────────────────────────");
console.log("\nToken JWT:");
console.log(token);
console.log("\nURL di test (apri nel browser con il server in esecuzione):");
console.log(url);
console.log("");
