// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import type { Express } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";

// Segreto fisso per i test: firma qui i JWT come farebbe il sito WordPress
// esterno, e requireDbReady/wp-callback lo leggono da process.env allo stesso
// modo che in produzione. Impostato al primo import di questo modulo, prima
// di qualunque richiesta a /wp-callback.
const TEST_JWT_SECRET = "test-jwt-secret";
process.env.K9_JWT_SECRET ??= TEST_JWT_SECRET;

interface LoginOverrides {
  email?: string;
  username?: string;
  role?: "viewer" | "admin";
  instructorLevel?: "BSS" | "CTS";
}

/**
 * Autentica un agent supertest passando per il vero flusso di login
 * (GET /api/auth/wp-callback), firmando un JWT come farebbe il sito esterno —
 * stesso path della produzione, "token" è l'unica modalità di accesso.
 */
export const loginAs = async (app: Express, overrides: LoginOverrides = {}) => {
  const user = {
    email: overrides.email ?? `user-${randomUUID()}@test.local`,
    username: overrides.username ?? "tester",
    role: overrides.role ?? "viewer",
    instructorLevel: overrides.instructorLevel ?? "BSS",
  };

  const token = jwt.sign(
    { email: user.email, username: user.username, role: user.role, instructor_level: user.instructorLevel },
    process.env.K9_JWT_SECRET!,
    { expiresIn: "5m" }
  );

  const agent: request.Agent = request.agent(app);
  const res = await agent.get(`/api/auth/wp-callback?token=${encodeURIComponent(token)}`);
  if (res.status !== 302) {
    throw new Error(`Login fallito in test: ${res.status} ${res.text}`);
  }
  return { agent, user };
};
