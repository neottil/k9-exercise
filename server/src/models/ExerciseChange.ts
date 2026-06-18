// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose, { Schema } from "mongoose";

const ExerciseChangeSchema = new Schema(
  {
    exerciseId: { type: String, required: true, index: true },
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
