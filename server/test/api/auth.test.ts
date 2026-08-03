// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { createUser, TEST_PASSWORD } from "../helpers/fixtures.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;

beforeAll(async () => {
  const uri = await connectTestDb();
  app = createApp({ mongoUri: uri });
});

afterEach(clearCollections);
afterAll(disconnectTestDb);

// Solo 3 richieste a /api/auth/login in questo file (1 in loginAs + 2 dirette):
// resta sotto il limite del rate limiter (5/15min), vedi authClient.ts.
describe("POST /api/auth/login", () => {
  it("autentica un utente approvato con credenziali corrette", async () => {
    const { agent } = await loginAs(app, { role: "viewer" });
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
  });

  it("rifiuta credenziali sbagliate con 401", async () => {
    const user = await createUser();
    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: "password-sbagliata" });
    expect(res.status).toBe(401);
  });

  it("rifiuta un account non ancora approvato con 403", async () => {
    const user = await createUser({ state: "TO_APPROVE" });
    const res = await request(app).post("/api/auth/login").send({ email: user.email, password: TEST_PASSWORD });
    expect(res.status).toBe(403);
  });
});
