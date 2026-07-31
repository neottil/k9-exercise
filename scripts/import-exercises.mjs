// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.
//
// Importa esercizi da un file Excel nella collection "exercises".
// Uso: node scripts/import-exercises.mjs
//
// Il file Excel deve avere, sul primo foglio, la struttura del template
// "Esercizi k9 per app.xlsx": riga 1 = intestazioni di gruppo (BODY TARGET /
// AREA TARGET), riga 2 = intestazioni di colonna, dati dalla riga 3. Colonne
// attese (in quest'ordine): TIPOLOGIA, VARIANTE, DESCRIZIONE, PIANO, ATTREZZI,
// SETUP, LIVELLO, DIFFICOLTA, ANT, POST, CORE, COLONNA, FULLBODY, MENTALE,
// FLESSIBILITA, FORZA, EQUILIBRIO, CARDIO.

// ── Configura qui per ambiente/file diversi ──────────────────────────────────
// Stessa MONGODB_URI usata dal server (secret GitHub / .env): il database è
// quello indicato nel path dell'URI stessa — server/src/index.ts si connette
// con `mongoose.connect(MONGODB_URI)` senza un dbName separato, quindi questo
// script fa lo stesso, per finire sullo stesso database che usa l'app.
// IMPORTANTE: se l'URI non contiene un path finale (.../database), Mongo si
// connette al database di default "test" — verifica che qui ci sia lo stesso
// valore esatto del secret MONGODB_URI su GitHub, path incluso.
// const MONGODB_URI = "<INCOLLA_QUI_LO_STESSO_PATH_DEL_SECRET_MONGODB_URI>";
const MONGODB_URI = "mongodb+srv://k9-exercise:pj7Imb62pq6xwuB8@cluster0.zbhhpcz.mongodb.net/k9-exercise-test";
const EXCEL_PATH  = "C:/Users/luca.neotti.PROFESIA/Downloads/Esercizi k9 per app.xlsx";
const IMPORT_USER = "default";     // valorizza user/userUpdate degli esercizi importati
// ─────────────────────────────────────────────────────────────────────────────

import mongoose from "mongoose";
import XLSX from "xlsx";
import { v4 as uuid } from "uuid";

const VALID_MOVEMENT_PLANS = ["Mediano", "Trasverso", "Dorsale"];
const VALID_INSTRUCTOR_LEVELS = ["BSS", "CTS"];

// Colonne del foglio, in ordine (0-based). I dati iniziano alla riga con
// indice 2 (0=intestazione di gruppo, 1=intestazione di colonna).
const COL = {
  type: 0, variant: 1, description: 2, movementPlan: 3, tools: 4, setup: 5,
  instructorLevel: 6, difficultyLevel: 7,
  ant: 8, post: 9, core: 10, backbone: 11, fullBody: 12,
  mental: 13, flexibility: 14, strength: 15, balance: 16, cardio: 17,
};

// Schema minimale, allineato a server/src/models/Exercise.ts. Duplicato qui
// (anziché importato) perché questo script gira standalone con `node`, senza
// passare dal build TypeScript del server. autoIndex:false: gli indici
// esistono già sulla collection, sincronizzarli richiederebbe permessi Atlas
// aggiuntivi che questo script non deve necessariamente avere.
const ExerciseSchema = new mongoose.Schema(
  {
    _id: { type: String },
    type: { type: String, required: true },
    variant: String,
    description: { type: String, required: true },
    workingArea: {
      mental: Number, flexibility: Number, strength: Number, balance: Number, cardio: Number,
    },
    bodyTarget: {
      ant: Number, post: Number, core: Number, backbone: Number, fullBody: Number,
    },
    movementPlan: [String],
    tools: [String],
    setup: String,
    difficultyLevel: Number,
    instructorLevel: { type: String, default: "BSS" },
    images: { type: [Object], default: [] },
    state: String,
    user: String,
    userUpdate: String,
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true, versionKey: false, autoIndex: false, collection: "exercises" }
);
const Exercise = mongoose.model("Exercise", ExerciseSchema);

const cell = (row, key) => {
  const v = row[COL[key]];
  return v === undefined || v === null ? null : v;
};

const toNumber = (v) => (v === null ? undefined : Number(v));

const toList = (v) =>
  v === null ? [] : String(v).split(",").map((s) => s.trim()).filter(Boolean);

const parseMovementPlan = (v, rowNum, warnings) => {
  const values = toList(v);
  const invalid = values.filter((p) => !VALID_MOVEMENT_PLANS.includes(p));
  if (invalid.length > 0) {
    warnings.push(`riga ${rowNum}: PIANO contiene valori non validi (${invalid.join(", ")}), ignorati`);
  }
  return values.filter((p) => VALID_MOVEMENT_PLANS.includes(p));
};

const parseInstructorLevel = (v, rowNum, warnings) => {
  const level = v === null ? "BSS" : String(v).trim();
  if (!VALID_INSTRUCTOR_LEVELS.includes(level)) {
    warnings.push(`riga ${rowNum}: LIVELLO "${level}" non valido, uso BSS`);
    return "BSS";
  }
  return level;
};

const rowToExercise = (row, rowNum, warnings) => ({
  _id: uuid(),
  type: String(cell(row, "type")).trim(),
  variant: cell(row, "variant") ? String(cell(row, "variant")).trim() : undefined,
  description: String(cell(row, "description")).trim(),
  movementPlan: parseMovementPlan(cell(row, "movementPlan"), rowNum, warnings),
  tools: toList(cell(row, "tools")),
  setup: cell(row, "setup") ? String(cell(row, "setup")).trim() : undefined,
  instructorLevel: parseInstructorLevel(cell(row, "instructorLevel"), rowNum, warnings),
  difficultyLevel: toNumber(cell(row, "difficultyLevel")),
  bodyTarget: {
    ant: toNumber(cell(row, "ant")) ?? 0,
    post: toNumber(cell(row, "post")) ?? 0,
    core: toNumber(cell(row, "core")) ?? 0,
    backbone: toNumber(cell(row, "backbone")) ?? 0,
    fullBody: toNumber(cell(row, "fullBody")) ?? 0,
  },
  workingArea: {
    mental: toNumber(cell(row, "mental")) ?? 0,
    flexibility: toNumber(cell(row, "flexibility")) ?? 0,
    strength: toNumber(cell(row, "strength")) ?? 0,
    balance: toNumber(cell(row, "balance")) ?? 0,
    cardio: toNumber(cell(row, "cardio")) ?? 0,
  },
  images: [],
  state: "APPROVED",
  user: IMPORT_USER,
  userUpdate: IMPORT_USER,
});

const readRows = (path) => {
  const wb = XLSX.readFile(path);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  // Riga 0 = intestazione di gruppo, riga 1 = intestazione di colonna, dati da riga 2 (0-based).
  return allRows
    .slice(2)
    .map((row, i) => ({ row, rowNum: i + 3 })) // numero riga Excel 1-based per i messaggi
    .filter(({ row }) => row[COL.type] !== null && String(row[COL.type]).trim() !== "");
};

const isDuplicateKeyError = (err) => err && typeof err === "object" && "code" in err && err.code === 11000;

async function main() {
  const warnings = [];
  const rows = readRows(EXCEL_PATH);
  console.log(`Lette ${rows.length} righe da "${EXCEL_PATH}".`);

  await mongoose.connect(MONGODB_URI);
  console.log(`Connesso a MongoDB (db "${mongoose.connection.name}").`);

  let inserted = 0;
  let skipped = 0;

  for (const { row, rowNum } of rows) {
    const doc = rowToExercise(row, rowNum, warnings);
    try {
      await Exercise.create(doc);
      inserted++;
      console.log(`✓ riga ${rowNum}: ${doc.type}${doc.variant ? ` / ${doc.variant}` : ""}`);
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        skipped++;
        console.warn(`⚠ riga ${rowNum}: saltata, esiste già un esercizio "vivo" con type="${doc.type}" variant="${doc.variant ?? ""}"`);
      } else {
        throw err;
      }
    }
  }

  await mongoose.disconnect();

  console.log("\n── Riepilogo ──────────────────────────────");
  console.log(`Inseriti: ${inserted}`);
  console.log(`Saltati (duplicati): ${skipped}`);
  if (warnings.length > 0) {
    console.log(`\nAvvisi (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  - ${w}`));
  }
}

main().catch((err) => {
  console.error("Import fallito:", err);
  process.exit(1);
});
