// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema } from "mongoose";

const ExerciseChangeSchema = new Schema(
  {
    exerciseId: { type: String, required: true },
    fields: { type: Schema.Types.Mixed, required: true },
    user: { type: String },
    userUpdate: { type: String },
    // PENDING    → in attesa di revisione admin (al più una per esercizio, vedi indice sotto)
    // SUPERSEDED → un ALTRO utente ha proposto una modifica successiva sullo
    //              stesso esercizio: questa resta come contributo tracciato, ma
    //              non è più quella attiva
    // APPROVED / REJECTED → risolta dall'admin, conservata come storico invece
    //              di essere cancellata
    //
    // La catena aperta di un esercizio = la sua PENDING + tutte le sue
    // SUPERSEDED. Alla risoluzione l'intera catena riceve lo stato finale, così
    // ogni utente che vi ha contribuito viene conteggiato (o scartato, se
    // REJECTED) in modo coerente.
    //
    // Se qualcuno riporta l'esercizio ai valori originali, l'intera catena
    // aperta viene invece CANCELLATA (vedi PUT /:id in exercises.ts): la
    // proposta è stata ritenuta sbagliata e non deve entrare nei conteggi.
    state: {
      type: String,
      enum: ["PENDING", "SUPERSEDED", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    // Traccia di audit: la change che ha scavalcato questa. La logica di
    // propagazione non ne dipende (usa exerciseId + state), serve solo a
    // ricostruire l'ordine della catena a posteriori.
    supersededBy: { type: Schema.Types.ObjectId },
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
