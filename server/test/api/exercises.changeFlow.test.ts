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
import ExerciseChange from "../../src/models/ExerciseChange.js";
import { connectTestDb, disconnectTestDb, clearCollections } from "../helpers/db.js";
import { createExercise } from "../helpers/fixtures.js";
import { loginAs } from "../helpers/authClient.js";

let app: Express;
let agent: Awaited<ReturnType<typeof loginAs>>["agent"];
let adminAgent: Awaited<ReturnType<typeof loginAs>>["agent"];

// Login una sola volta per l'intero file: i documenti sessione sopravvivono a
// clearCollections (vedi test/helpers/db.ts), quindi i due agent restano
// autenticati per tutta la durata del file.
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

// Le modifiche risolte non vengono più cancellate ma conservate come storico
// (vedi ExerciseChange.state) — è ciò che rende possibile la classifica
// "modifiche proposte per utente" in /api/admin/audit/changes-by-user.
describe("Storico delle modifiche risolte", () => {
  it("dopo approve-change il change doc resta come storico, in stato APPROVED", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    await adminAgent
      .post(`/api/exercises/${exercise._id}/approve-change`)
      .send({ fieldsToApply: { description: "modificata" } });

    const changes = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.state).toBe("APPROVED");
    // Il proponente originale resta tracciato: è il dato su cui si basa la
    // classifica delle modifiche proposte.
    expect(changes[0]?.user).toBeTruthy();
  });

  it("dopo reject-change il change doc resta come storico, in stato REJECTED", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});

    const changes = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.state).toBe("REJECTED");
  });

  it("una modifica ritirata dall'utente viene cancellata, non conservata", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    // L'utente ci ripensa e rimette il valore originale prima che un admin
    // valuti: non è mai stata una proposta, non deve finire nello storico.
    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "originale" }));

    expect(await ExerciseChange.countDocuments({ exerciseId: exercise._id })).toBe(0);
    const check = await adminAgent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("APPROVED");
  });

  it("lo stesso utente che raffina la propria proposta non crea un secondo documento", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "primo tentativo" }));
    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "ripensamento" }));

    // Una sola proposta, altrimenti l'utente verrebbe conteggiato due volte
    // nell'audit per un unico contributo.
    const changes = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(changes).toHaveLength(1);
    expect((changes[0]?.fields as { description: string }).description).toBe("ripensamento");
  });

  it("una modifica risolta non blocca una nuova proposta sullo stesso esercizio", async () => {
    const exercise = await createExercise({ state: "APPROVED", description: "originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "prima modifica" }));
    await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});

    // L'indice unique su exerciseId è parziale (solo su state=PENDING): con un
    // unique globale questa seconda proposta fallirebbe con E11000.
    const res = await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "seconda modifica" }));
    expect(res.status).toBe(200);

    expect(await ExerciseChange.countDocuments({ exerciseId: exercise._id })).toBe(2);
    expect(await ExerciseChange.countDocuments({ exerciseId: exercise._id, state: "PENDING" })).toBe(1);

    // Il pannello admin continua a vedere una sola modifica in attesa.
    const pending = await adminAgent.get("/api/exercises/pending");
    expect(pending.body).toHaveLength(1);
    expect(pending.body[0].change.fields.description).toBe("seconda modifica");
  });
});

// Quando un utente modifica la proposta di un altro, la proposta esistente non
// viene riscritta a suo nome: diventa SUPERSEDED e ne nasce una nuova. Entrambi
// i contributi restano tracciati, ma resta una sola proposta attiva.
describe("Proposte concorrenti sullo stesso esercizio", () => {
  it("la proposta di un altro utente diventa SUPERSEDED e ne nasce una nuova", async () => {
    const { agent: other } = await loginAs(app, { username: "altro-utente" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "proposta iniziale" }));

    const first = await ExerciseChange.findOne({ exerciseId: exercise._id });
    expect(first?.state).toBe("PENDING");

    // L'altro utente riparte da ciò che vede (la proposta esistente) e aggiunge
    // una modifica sua.
    await other
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "proposta iniziale", setup: "setup aggiornato" }));

    const superseded = await ExerciseChange.findById(first?._id);
    expect(superseded?.state).toBe("SUPERSEDED");

    const active = await ExerciseChange.findOne({ exerciseId: exercise._id, state: "PENDING" });
    expect(active?.user).toBe("altro-utente");
    // Il diff è sempre calcolato sull'esercizio approvato: la nuova proposta
    // porta con sé anche la modifica del proponente precedente.
    expect((active?.fields as { description: string; setup: string })).toMatchObject({
      description: "proposta iniziale",
      setup: "setup aggiornato",
    });
    // Traccia di audit: si può ricostruire chi ha scavalcato chi.
    expect(superseded?.supersededBy?.toString()).toBe(active?._id.toString());

    // L'admin continua a vedere una sola modifica in attesa.
    const pending = await adminAgent.get("/api/exercises/pending");
    expect(pending.body).toHaveLength(1);
  });

  it("l'approvazione propaga lo stato finale a tutta la catena", async () => {
    const { agent: other } = await loginAs(app, { username: "altro-utente" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    await other
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata", setup: "setup aggiornato" }));

    await adminAgent
      .post(`/api/exercises/${exercise._id}/approve-change`)
      .send({ fieldsToApply: { description: "modificata", setup: "setup aggiornato" } });

    const changes = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(changes).toHaveLength(2);
    expect(changes.every((c) => c.state === "APPROVED")).toBe(true);
  });

  it("il rifiuto propaga lo stato finale a tutta la catena", async () => {
    const { agent: other } = await loginAs(app, { username: "altro-utente" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata" }));
    await other
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "modificata", setup: "setup aggiornato" }));

    await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});

    const changes = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(changes).toHaveLength(2);
    expect(changes.every((c) => c.state === "REJECTED")).toBe(true);
  });

  it("l'annullamento cancella l'intera catena aperta ma non lo storico già risolto", async () => {
    const { agent: other } = await loginAs(app, { username: "altro-utente" });
    const exercise = await createExercise({ state: "APPROVED", description: "originale", setup: "setup originale" });

    // Prima catena, già risolta: è storico e non va toccato.
    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "vecchia proposta" }));
    await adminAgent.post(`/api/exercises/${exercise._id}/reject-change`).send({});

    // Seconda catena, aperta, a due mani.
    await agent
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "nuova proposta" }));
    await other
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "nuova proposta", setup: "setup aggiornato" }));
    expect(await ExerciseChange.countDocuments({ exerciseId: exercise._id })).toBe(3);

    // Un terzo utente riporta tutto ai valori originali.
    const { agent: third } = await loginAs(app, { username: "terzo-utente" });
    await third
      .put(`/api/exercises/${exercise._id}`)
      .send(putPayloadFrom(exercise, { description: "originale", setup: "setup originale" }));

    const remaining = await ExerciseChange.find({ exerciseId: exercise._id });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.state).toBe("REJECTED");

    const check = await adminAgent.get(`/api/exercises/${exercise._id}`);
    expect(check.body.state).toBe("APPROVED");
  });
});
