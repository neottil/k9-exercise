// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema } from "mongoose";

const ExerciseChangeSchema = new Schema(
  {
    exerciseId: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, required: true },
    user: { type: String },
    userUpdate: { type: String },
    // PENDING: modifica in attesa di revisione admin (al più una per esercizio,
    // vedi indice sotto). APPROVED/REJECTED: risolta, mantenuta come storico
    // invece di essere cancellata — vedi analisi/storico_modifiche_esercizi.md.
    // Il caso "l'utente annulla la propria modifica tornando ai valori
    // originali" resta invece un deleteOne vero e proprio (PUT /:id in
    // exercises.ts): non è mai stata una proposta arrivata a un admin.
    state: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Al più UN change doc PENDING per esercizio (non più un unique globale su
// exerciseId): con lo storico, più documenti risolti possono legittimamente
// condividere lo stesso exerciseId nel tempo, purché al più uno sia attivo.
// Stesso pattern già usato su Exercise per type+variant (Exercise.ts).
ExerciseChangeSchema.index(
  { exerciseId: 1 },
  { unique: true, partialFilterExpression: { state: "PENDING" } }
);

export default mongoose.model("ExerciseChange", ExerciseChangeSchema);
