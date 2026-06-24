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

// Indice composto { state, lastNotifiedAt }.
// Copre le query admin selettive (GET /pending, GET /to-approve → prefisso state)
// e le updateMany del job notify (state + range su lastNotifiedAt).
// La GET / resta volutamente uno scan: filtra state ∈ {APPROVED, PENDING_UPDATE},
// poco selettivo (la maggior parte degli esercizi è APPROVED), quindi il planner
// preferisce comunque il COLLSCAN — trascurabile su 400-1000 documenti.
ExerciseSchema.index({ state: 1, lastNotifiedAt: 1 });

ExerciseSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});

export default mongoose.model("Exercise", ExerciseSchema);
