// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import type { Exercise } from "./exerciseInterfaces";

export interface ExerciseChangeDoc {
  _id: string;
  exerciseId: string;
  fields: Partial<Exercise>;
  user?: string;
  userUpdate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingItem {
  exercise: Exercise & {
    state: string;
    createdAt?: string;
    updatedAt?: string;
  };
  change: ExerciseChangeDoc | null;
}

export type NewExercise = Exercise & {
  state: string;
  createdAt?: string;
};
