// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import type { Express } from "express";
import request from "supertest";
import { createUser, TEST_PASSWORD } from "./fixtures.js";

type LoginOverrides = Parameters<typeof createUser>[0];

/**
 * Crea un utente e fa un vero login (POST /api/auth/login), restituendo un
 * agent supertest con la sessione già attiva (cookie persistito tra le
 * richieste) — così i test esercitano lo stesso path di autenticazione
 * dell'app reale, non un bypass.
 *
 * ATTENZIONE: /api/auth/login è dietro un rate limiter (max 5 tentativi ogni
 * 15 minuti, per IP). Vitest isola il registro dei moduli per file di test,
 * quindi il limiter riparte per ogni file — ma non superare le 5 chiamate a
 * loginAs()/login falliti nello stesso file.
 */
export const loginAs = async (app: Express, overrides: LoginOverrides = {}) => {
  const user = await createUser(overrides);
  const agent: request.Agent = request.agent(app);
  const res = await agent.post("/api/auth/login").send({ email: user.email, password: TEST_PASSWORD });
  if (res.status !== 200) {
    throw new Error(`Login fallito in test: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, user };
};
