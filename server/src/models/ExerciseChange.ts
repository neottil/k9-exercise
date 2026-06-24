// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema } from "mongoose";

const ExerciseChangeSchema = new Schema(
  {
    // unique: c'è al massimo un change doc per esercizio (upsert/deleteOne per exerciseId).
    // unique implica già la creazione dell'indice usato da tutte le lookup su questo campo.
    exerciseId: { type: String, required: true, unique: true },
    fields: { type: Schema.Types.Mixed, required: true },
    user: { type: String },
    userUpdate: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("ExerciseChange", ExerciseChangeSchema);
