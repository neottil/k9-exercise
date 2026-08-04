// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import Exercise from "../../src/models/Exercise.js";

type ExerciseOverrides = Partial<Record<string, unknown>>;

export const buildExercise = (overrides: ExerciseOverrides = {}) => ({
  _id: randomUUID(),
  type: "Nose touch",
  variant: "Tocco",
  description: "Descrizione di test",
  instructorLevel: "BSS",
  difficultyLevel: 1,
  state: "APPROVED",
  user: "tester",
  userUpdate: "tester",
  images: [],
  ...overrides,
});

export const createExercise = (overrides: ExerciseOverrides = {}) =>
  Exercise.create(buildExercise(overrides));
