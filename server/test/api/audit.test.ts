// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { createExercise } from "../helpers/fixtures.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;
let adminAgent: Awaited<ReturnType<typeof loginAs>>["agent"];
let viewerAgent: Awaited<ReturnType<typeof loginAs>>["agent"];

beforeAll(async () => {
  const uri = await connectTestDb();
  app = createApp({ mongoUri: uri });
  ({ agent: adminAgent } = await loginAs(app, { role: "admin", username: "admin" }));
  ({ agent: viewerAgent } = await loginAs(app, { username: "viewer" }));
});

afterEach(clearCollections);
afterAll(disconnectTestDb);

// Intervallo che copre sicuramente "adesso", per i test in cui il filtro
// temporale non è l'oggetto della verifica.
const TODAY = new Date().toISOString().slice(0, 10);
const WIDE_RANGE = "?from=2000-01-01";

describe("GET /api/admin/audit/created-by-user", () => {
  it("è riservato agli admin", async () => {
    const res = await viewerAgent.get(`/api/admin/audit/created-by-user${WIDE_RANGE}`);
    expect(res.status).toBe(403);
  });

  it("rifiuta con 400 una richiesta senza 'from'", async () => {
    const res = await adminAgent.get("/api/admin/audit/created-by-user");
    expect(res.status).toBe(400);
  });

  it("rifiuta con 400 un 'from' non parsabile come data", async () => {
    const res = await adminAgent.get("/api/admin/audit/created-by-user?from=non-una-data");
    expect(res.status).toBe(400);
  });

  it("raggruppa per utente e ordina per numero di esercizi decrescente", async () => {
    await createExercise({ user: "alice", type: "A" });
    await createExercise({ user: "alice", type: "B" });
    await createExercise({ user: "bob", type: "C" });

    const res = await adminAgent.get(`/api/admin/audit/created-by-user${WIDE_RANGE}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { user: "alice", exercisesCreated: 2 },
      { user: "bob", exercisesCreated: 1 },
    ]);
  });

  it("restituisce al massimo le prime 5 posizioni", async () => {
    for (let i = 0; i < 7; i++) {
      await createExercise({ user: `user-${i}`, type: `Tipo ${i}` });
    }

    const res = await adminAgent.get(`/api/admin/audit/created-by-user${WIDE_RANGE}`);

    expect(res.body).toHaveLength(5);
  });

  it("esclude gli esercizi creati fuori dall'intervallo richiesto", async () => {
    await createExercise({ user: "alice" });

    // Intervallo interamente nel passato: l'esercizio appena creato non rientra.
    const res = await adminAgent.get("/api/admin/audit/created-by-user?from=2020-01-01&to=2020-12-31");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("include gli esercizi creati nel giorno indicato come 'to'", async () => {
    await createExercise({ user: "alice" });

    // "to" è inclusivo dell'intera giornata: un esercizio creato oggi deve
    // rientrare anche quando to=oggi (e non solo con to=domani).
    const res = await adminAgent.get(`/api/admin/audit/created-by-user?from=2000-01-01&to=${TODAY}`);

    expect(res.body).toEqual([{ user: "alice", exercisesCreated: 1 }]);
  });
});

describe("GET /api/admin/audit/changes-by-user", () => {
  const putPayloadFrom = (
    exercise: { type: string; variant?: string | null; instructorLevel: string; difficultyLevel?: number | null },
    changes: Record<string, unknown>
  ) => ({
    type: exercise.type,
    variant: exercise.variant,
    instructorLevel: exercise.instructorLevel,
    difficultyLevel: exercise.difficultyLevel,
    ...changes,
  });

  it("è riservato agli admin", async () => {
    const res = await viewerAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);
    expect(res.status).toBe(403);
  });

  it("rifiuta con 400 una richiesta senza 'from'", async () => {
    const res = await adminAgent.get("/api/admin/audit/changes-by-user");
    expect(res.status).toBe(400);
  });

  it("conta le modifiche proposte attribuendole all'utente proponente", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const { agent: bob } = await loginAs(app, { username: "bob" });

    const first = await createExercise({ state: "APPROVED", type: "A", description: "originale" });
    const second = await createExercise({ state: "APPROVED", type: "B", description: "originale" });
    const third = await createExercise({ state: "APPROVED", type: "C", description: "originale" });

    await alice.put(`/api/exercises/${first._id}`).send(putPayloadFrom(first, { description: "da alice" }));
    await alice.put(`/api/exercises/${second._id}`).send(putPayloadFrom(second, { description: "da alice" }));
    await bob.put(`/api/exercises/${third._id}`).send(putPayloadFrom(third, { description: "da bob" }));

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { user: "alice", changesProposed: 2 },
      { user: "bob", changesProposed: 1 },
    ]);
  });

  it("continua a contare le modifiche già risolte dall'admin", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });

    const approved = await createExercise({ state: "APPROVED", type: "A", description: "originale" });
    const rejected = await createExercise({ state: "APPROVED", type: "B", description: "originale" });

    await alice.put(`/api/exercises/${approved._id}`).send(putPayloadFrom(approved, { description: "modificata" }));
    await alice.put(`/api/exercises/${rejected._id}`).send(putPayloadFrom(rejected, { description: "modificata" }));

    await adminAgent
      .post(`/api/exercises/${approved._id}/approve-change`)
      .send({ fieldsToApply: { description: "modificata" } });
    await adminAgent.post(`/api/exercises/${rejected._id}/reject-change`).send({});

    // È il punto dell'intero lavoro sullo storico: prima le risoluzioni
    // cancellavano il change doc e queste due proposte sparivano dal conteggio.
    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([{ user: "alice", changesProposed: 2 }]);
  });

  it("non conta le modifiche ritirate dall'utente prima della revisione", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "modificata" }));
    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "originale" }));

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([]);
  });

  it("esclude le modifiche proposte fuori dall'intervallo richiesto", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "modificata" }));

    const res = await adminAgent.get("/api/admin/audit/changes-by-user?from=2020-01-01&to=2020-12-31");

    expect(res.body).toEqual([]);
  });
});
