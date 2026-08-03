// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { createExercise } from "../helpers/fixtures.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;

beforeAll(async () => {
  const uri = await connectTestDb();
  app = createApp({ mongoUri: uri });
});

afterEach(clearCollections);
afterAll(disconnectTestDb);

describe("GET /api/exercises", () => {
  it("ordina per tipologia, poi difficoltà, poi variante, e nasconde gli esercizi CTS a un utente BSS", async () => {
    await createExercise({ type: "Zeta", variant: "B", difficultyLevel: 1, instructorLevel: "BSS" });
    await createExercise({ type: "Alfa", variant: "B", difficultyLevel: 2, instructorLevel: "BSS" });
    await createExercise({ type: "Alfa", variant: "A", difficultyLevel: 2, instructorLevel: "BSS" });
    // Esercizio CTS: deve sparire per un utente BSS.
    await createExercise({ type: "Alfa", variant: "Zulu", difficultyLevel: 1, instructorLevel: "CTS" });
    // Non ancora approvato: non deve mai comparire nella lista pubblica.
    await createExercise({ type: "Alfa", variant: "Yankee", difficultyLevel: 1, instructorLevel: "BSS", state: "TO_APPROVE" });

    const { agent } = await loginAs(app, { instructorLevel: "BSS" });
    const res = await agent.get("/api/exercises");

    expect(res.status).toBe(200);
    expect(res.body.map((e: { type: string; difficultyLevel: number; variant: string }) => [e.type, e.difficultyLevel, e.variant])).toEqual([
      ["Alfa", 2, "A"],
      ["Alfa", 2, "B"],
      ["Zeta", 1, "B"],
    ]);
  });

  it("un utente CTS vede anche gli esercizi riservati a CTS", async () => {
    await createExercise({ type: "Alfa", variant: "A", difficultyLevel: 1, instructorLevel: "CTS" });
    await createExercise({ type: "Beta", variant: "B", difficultyLevel: 1, instructorLevel: "BSS" });

    const { agent } = await loginAs(app, { instructorLevel: "CTS" });
    const res = await agent.get("/api/exercises");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("richiede autenticazione", async () => {
    const res = await request(app).get("/api/exercises");
    expect(res.status).toBe(401);
  });
});
