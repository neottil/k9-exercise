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

  it("conta solo gli esercizi approvati", async () => {
    await createExercise({ user: "alice", type: "A", state: "APPROVED" });
    // Approvato, ma con una modifica in attesa: resta un esercizio approvato.
    await createExercise({ user: "alice", type: "B", state: "PENDING_UPDATE" });
    await createExercise({ user: "alice", type: "C", state: "REJECTED" });
    await createExercise({ user: "alice", type: "D", state: "TO_APPROVE" });

    const res = await adminAgent.get(`/api/admin/audit/created-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([{ user: "alice", exercisesCreated: 2 }]);
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

  it("conta le modifiche approvate attribuendole all'utente proponente", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const { agent: bob } = await loginAs(app, { username: "bob" });

    const first = await createExercise({ state: "APPROVED", type: "A", description: "originale" });
    const second = await createExercise({ state: "APPROVED", type: "B", description: "originale" });
    const third = await createExercise({ state: "APPROVED", type: "C", description: "originale" });

    await alice.put(`/api/exercises/${first._id}`).send(putPayloadFrom(first, { description: "da alice" }));
    await alice.put(`/api/exercises/${second._id}`).send(putPayloadFrom(second, { description: "da alice" }));
    await bob.put(`/api/exercises/${third._id}`).send(putPayloadFrom(third, { description: "da bob" }));

    for (const ex of [first, second, third]) {
      await adminAgent
        .post(`/api/exercises/${ex._id}/approve-change`)
        .send({ fieldsToApply: { description: "approvata" } });
    }

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { user: "alice", changesProposed: 2 },
      { user: "bob", changesProposed: 1 },
    ]);
  });

  it("non conta le modifiche ancora in attesa di revisione", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "modificata" }));

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([]);
  });

  it("continua a contare le modifiche approvate, non quelle rifiutate", async () => {
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
    // cancellavano il change doc e la proposta approvata spariva dal conteggio.
    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([{ user: "alice", changesProposed: 1 }]);
  });

  it("conta entrambi gli utenti quando una proposta a due mani viene approvata", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const { agent: bob } = await loginAs(app, { username: "bob" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "da alice" }));
    // Bob riparte da ciò che vede (la proposta di alice) e aggiunge la sua.
    await bob
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "da alice", setup: "setup da bob" }));

    await adminAgent
      .post(`/api/exercises/${exercise._id}/approve-change`)
      .send({ fieldsToApply: { description: "da alice", setup: "setup da bob" } });

    // La SUPERSEDED di alice è diventata APPROVED con la propagazione: anche
    // chi non ha messo mano per ultimo viene conteggiato.
    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual(
      expect.arrayContaining([
        { user: "alice", changesProposed: 1 },
        { user: "bob", changesProposed: 1 },
      ])
    );
    expect(res.body).toHaveLength(2);
  });

  it("scarta l'intera catena quando la proposta finale viene rifiutata", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const { agent: bob } = await loginAs(app, { username: "bob" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "da alice" }));
    await bob
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "da alice", setup: "setup da bob" }));

    await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});

    // Anche il contributo di alice, su cui bob aveva costruito, esce dai conteggi.
    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([]);
  });

  it("non conta le modifiche ritirate dall'utente prima della revisione", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "modificata" }));
    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "originale" }));

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([]);
  });

  it("non conta nessuno della catena se un terzo utente annulla tutto", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const { agent: bob } = await loginAs(app, { username: "bob" });
    const { agent: carol } = await loginAs(app, { username: "carol" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "da alice" }));
    await bob
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "da alice", setup: "setup da bob" }));
    // Carol ritiene la proposta sbagliata e ripristina i valori originali.
    await carol
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "originale", setup: "setup originale" }));

    const res = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);

    expect(res.body).toEqual([]);
  });

  it("esclude le modifiche proposte fuori dall'intervallo richiesto", async () => {
    const { agent: alice } = await loginAs(app, { username: "alice" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await alice.put(`/api/exercises/${exercise._id}`).send(putPayloadFrom(exercise, { description: "modificata" }));
    // Approvata, così a escluderla è davvero il filtro sulle date e non lo stato.
    await adminAgent
      .post(`/api/exercises/${exercise._id}/approve-change`)
      .send({ fieldsToApply: { description: "modificata" } });

    const res = await adminAgent.get("/api/admin/audit/changes-by-user?from=2020-01-01&to=2020-12-31");

    expect(res.body).toEqual([]);

    // Controprova: nell'intervallo giusto c'è.
    const inRange = await adminAgent.get(`/api/admin/audit/changes-by-user${WIDE_RANGE}`);
    expect(inRange.body).toEqual([{ user: "alice", changesProposed: 1 }]);
  });
});
