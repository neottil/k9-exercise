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
  /**
   * Tutti gli utenti che hanno contribuito alla proposta in attesa, in ordine
   * cronologico. Più di uno quando qualcuno ha modificato la proposta di un
   * altro: `change.user` sarebbe solo l'ultimo.
   */
  contributors?: string[];
}

export type NewExercise = Exercise & {
  state: string;
  createdAt?: string;
};

export interface ExercisesCreatedByUser {
  user: string;
  exercisesCreated: number;
}

export interface ChangesProposedByUser {
  user: string;
  changesProposed: number;
}
