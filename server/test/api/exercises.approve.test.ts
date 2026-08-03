// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
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

describe("Approvazione nuovi esercizi", () => {
  it("un admin approva un esercizio TO_APPROVE", async () => {
    const exercise = await createExercise({ state: "TO_APPROVE" });
    const { agent } = await loginAs(app, { role: "admin" });

    const res = await agent.post(`/api/exercises/${exercise._id}/approve`).send({});
    expect(res.status).toBe(200);

    const check = await agent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("APPROVED");
  });

  it("un utente non admin non può approvare", async () => {
    const exercise = await createExercise({ state: "TO_APPROVE" });
    const { agent } = await loginAs(app, { role: "viewer" });

    const res = await agent.post(`/api/exercises/${exercise._id}/approve`).send({});
    expect(res.status).toBe(403);
  });

  it("un admin rifiuta un esercizio TO_APPROVE", async () => {
    const exercise = await createExercise({ state: "TO_APPROVE" });
    const { agent } = await loginAs(app, { role: "admin" });

    const res = await agent.post(`/api/exercises/${exercise._id}/reject`).send({});
    expect(res.status).toBe(200);

    const check = await agent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("REJECTED");
  });

  it("non può approvare due volte lo stesso esercizio", async () => {
    const exercise = await createExercise({ state: "TO_APPROVE" });
    const { agent } = await loginAs(app, { role: "admin" });

    const first = await agent.post(`/api/exercises/${exercise._id}/approve`).send({});
    expect(first.status).toBe(200);

    const second = await agent.post(`/api/exercises/${exercise._id}/approve`).send({});
    expect(second.status).toBe(409);
  });
});
