// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;

beforeAll(async () => {
  const uri = await connectTestDb();
  app = createApp({ mongoUri: uri });
});

afterEach(clearCollections);
afterAll(disconnectTestDb);

const signToken = (payload: Record<string, unknown>, secret = process.env.K9_JWT_SECRET!) =>
  jwt.sign(payload, secret, { expiresIn: "5m" });

describe("GET /api/auth/wp-callback", () => {
  it("crea la sessione con un token valido e reindirizza alla home", async () => {
    const token = signToken({ email: "utente@test.local", username: "utente", role: "viewer", instructor_level: "BSS" });
    const res = await request(app).get(`/api/auth/wp-callback?token=${token}`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/");
  });

  it("segnala firstAccess=true al primo accesso di un utente mai visto", async () => {
    const { agent } = await loginAs(app);
    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.firstAccess).toBe(true);
  });

  it("richiede il parametro token", async () => {
    const res = await request(app).get("/api/auth/wp-callback");
    expect(res.status).toBe(400);
  });

  it("rifiuta un token firmato con un segreto diverso", async () => {
    const token = signToken({ email: "utente@test.local", username: "utente", role: "viewer" }, "segreto-sbagliato");
    const res = await request(app).get(`/api/auth/wp-callback?token=${token}`);
    expect(res.status).toBe(401);
  });

  it("rifiuta un token privo dei campi richiesti (email, role)", async () => {
    const token = signToken({ username: "utente" });
    const res = await request(app).get(`/api/auth/wp-callback?token=${token}`);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/accept-terms", () => {
  it("richiede una sessione attiva", async () => {
    const res = await request(app).post("/api/auth/accept-terms");
    expect(res.status).toBe(401);
  });

  it("crea l'utente TOKEN_ACCESS e azzera firstAccess", async () => {
    const { agent } = await loginAs(app);
    const accepted = await agent.post("/api/auth/accept-terms");
    expect(accepted.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.body.firstAccess).toBe(false);
  });
});

describe("POST /api/auth/logout", () => {
  it("distrugge la sessione", async () => {
    const { agent } = await loginAs(app);
    const logout = await agent.post("/api/auth/logout");
    expect(logout.status).toBe(200);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(401);
  });
});
