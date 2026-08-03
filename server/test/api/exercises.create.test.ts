// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
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

describe("POST /api/exercises", () => {
  it("crea un nuovo esercizio in stato TO_APPROVE", async () => {
    const { agent } = await loginAs(app);
    const payload = {
      id: randomUUID(), // come fa il client (uuid v4), vedi insert.tsx
      type: "Nose touch",
      variant: "Tocco",
      description: "descrizione",
      instructorLevel: "BSS",
      difficultyLevel: 1,
    };

    const res = await agent.post("/api/exercises").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.state).toBe("TO_APPROVE");
    expect(res.body.type).toBe("Nose touch");
  });

  it("rifiuta con 409 un duplicato sulla combinazione type+variant", async () => {
    const { agent } = await loginAs(app);
    const payload = {
      id: randomUUID(),
      type: "Nose touch",
      variant: "Tocco",
      description: "descrizione",
      instructorLevel: "BSS",
      difficultyLevel: 1,
    };

    const first = await agent.post("/api/exercises").send(payload);
    expect(first.status).toBe(201);

    const second = await agent
      .post("/api/exercises")
      .send({ ...payload, id: randomUUID(), description: "un'altra descrizione" });
    expect(second.status).toBe(409);
  });
});
