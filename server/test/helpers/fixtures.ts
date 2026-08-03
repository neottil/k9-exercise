// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import Exercise from "../../src/models/Exercise.js";
import User, { type IUser } from "../../src/models/User.js";

// Password fissa per gli utenti di test: soddisfa passwordSchema in auth.ts
// (min 8, maiuscola, minuscola, cifra, simbolo, senza spazi).
export const TEST_PASSWORD = "Test1234!";

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

type UserOverrides = Partial<Pick<IUser, "email" | "username" | "role" | "state" | "instructorLevel">>;

/** Crea un utente form-mode con la password TEST_PASSWORD già hashata. */
export const createUser = async (overrides: UserOverrides = {}) => {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  return User.create({
    email: `user-${randomUUID()}@test.local`,
    username: "tester",
    passwordHash,
    role: "viewer",
    state: "APPROVED",
    instructorLevel: "BSS",
    ...overrides,
  });
};
