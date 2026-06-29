// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema } from "mongoose";

const WorkingAreaSchema = new Schema(
  {
    mental: Number,
    flexibility: Number,
    strength: Number,
    balance: Number,
    cardio: Number,
  },
  { _id: false }
);

const BodyTargetSchema = new Schema(
  {
    ant: Number,
    post: Number,
    core: Number,
    backbone: Number,
    fullBody: Number,
  },
  { _id: false }
);

// Metadati di un'immagine associata all'esercizio. Il binario vive su minIO:
// qui si salva solo il riferimento (key) più i metadati. Vedi
// analisi/25_gestione_immagini.md.
const ImageSchema = new Schema(
  {
    id: { type: String, required: true }, // UUID, identifica l'immagine
    key: { type: String, required: true }, // key S3 (contiene l'UUID)
    filename: String, // nome file originale
    mimeType: String, // es. "image/webp"
    size: Number, // byte (dopo compressione)
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: String, // username
  },
  { _id: false }
);

const ExerciseSchema = new Schema(
  {
    _id: { type: String },
    type: { type: String, required: true },
    variant: String,
    description: { type: String, required: true },
    workingArea: WorkingAreaSchema,
    bodyTarget: BodyTargetSchema,
    movementPlan: [String],
    tools: [String],
    setup: String,
    difficultyLevel: Number,
    instructorLevel: { type: String, default: "BSS" },
    images: { type: [ImageSchema], default: [] },
    state: String,
    user: String,
    userUpdate: String,
    lastNotifiedAt: { type: Date },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indici ───────────────────────────────────────────────────────────────────
// Ogni indice richiede la propria chiamata .index() (indici distinti non si
// possono accorpare in una sola). Raggruppati qui per leggibilità.

// { state, lastNotifiedAt }: copre le query admin selettive (GET /pending,
// GET /to-approve → prefisso state) e le updateMany del job notify (state +
// range su lastNotifiedAt). La GET / resta volutamente uno scan: filtra
// state ∈ {APPROVED, PENDING_UPDATE}, poco selettivo (la maggior parte degli
// esercizi è APPROVED), quindi il planner preferisce comunque il COLLSCAN —
// trascurabile su 400-1000 documenti.
ExerciseSchema.index({ state: 1, lastNotifiedAt: 1 });

// Unicità type+variant tra gli esercizi "vivi" (TO_APPROVE, APPROVED, PENDING_UPDATE).
// I REJECTED sono esclusi: restano nella collection ma non devono bloccare la
// ri-creazione dello stesso combo. È la garanzia hard contro i duplicati: insert
// o apply di una modifica che violano il vincolo falliscono con E11000, che gli
// handler intercettano restituendo un 409 con messaggio dedicato.
// NB: variant assente è trattato da MongoDB come un valore (null) → al più un
// esercizio per type senza variante.
ExerciseSchema.index(
  { type: 1, variant: 1 },
  {
    unique: true,
    partialFilterExpression: {
      state: { $in: ["TO_APPROVE", "APPROVED", "PENDING_UPDATE"] },
    },
  }
);

ExerciseSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.model("Exercise", ExerciseSchema);
