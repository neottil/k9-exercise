// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.
//
// Esercita il percorso PUT → change doc → approve-change, che nel codice
// reale gira dentro una transazione Mongo (mongoose.startSession()). Le
// transazioni richiedono un replica set: è la ragione per cui i test API
// usano @testcontainers/mongodb (che configura un replica set a singolo
// nodo) invece di un mongod standalone.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { createExercise } from "../helpers/fixtures.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;
let agent: Awaited<ReturnType<typeof loginAs>>["agent"];
let adminAgent: Awaited<ReturnType<typeof loginAs>>["agent"];

// Login una sola volta per l'intero file (non per singolo test): /api/auth/login
// è dietro un rate limiter (max 5 tentativi/15min per IP, vedi authClient.ts).
// I documenti sessione sopravvivono a clearCollections (vedi test/helpers/db.ts),
// quindi i due agent restano autenticati per tutta la durata del file.
beforeAll(async () => {
  const uri = await connectTestDb();
  app = createApp({ mongoUri: uri });
  ({ agent } = await loginAs(app));
  ({ agent: adminAgent } = await loginAs(app, { role: "admin" }));
});

afterEach(clearCollections);
afterAll(disconnectTestDb);

const putPayloadFrom = (exercise: { type: string; variant?: string | null; instructorLevel: string; difficultyLevel?: number | null }, changes: Record<string, unknown>) => ({
  type: exercise.type,
  variant: exercise.variant,
  instructorLevel: exercise.instructorLevel,
  difficultyLevel: exercise.difficultyLevel,
  ...changes,
});

describe("Flusso di modifica su esercizio approvato", () => {
  it("PUT su un esercizio APPROVED crea un change doc e sposta lo stato a PENDING_UPDATE", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    const res = await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    expect(res.status).toBe(200);

    const pending = await adminAgent.get("/api/exercises/pending");

    expect(pending.status).toBe(200);
    expect(pending.body).toHaveLength(1);
    expect(pending.body[0].exercise.state).toBe("PENDING_UPDATE");
    expect(pending.body[0].change.fields.description).toBe("modificata");
  });

  it("approve-change applica i soli campi selezionati e ripristina APPROVED", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata", setup: "setup modificato" }));

    // L'admin approva solo "description", rigetta implicitamente "setup".
    const res = await adminAgent
      .post(`/api/exercises/${exercise._id}/approve-change`)
      .send({ fieldsToApply: { description: "modificata" } });
    expect(res.status).toBe(200);

    const check = await adminAgent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("APPROVED");
    expect(check.body.description).toBe("modificata");
    expect(check.body.setup).toBe("setup originale");
  });

  it("reject-change scarta le modifiche e ripristina APPROVED senza applicarle", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));

    const res = await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});
    expect(res.status).toBe(200);

    const check = await adminAgent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("APPROVED");
    expect(check.body.description).toBe("originale");
  });
});
