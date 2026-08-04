// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Numero di esercizi NUOVI creati da ciascun utente a partire da una data.
//
// "Creato" = data di inserimento del documento Exercise (createdAt), a
// prescindere dallo stato attuale (APPROVED, TO_APPROVE, REJECTED...): conta
// chi ha PROPOSTO l'esercizio, non solo quelli poi approvati. Se invece si
// vogliono contare solo gli esercizi effettivamente approvati, aggiungere
// `state: "APPROVED"` al $match (vedi commento sotto).
//
// Il campo `user` su Exercise viene scritto una sola volta, alla creazione
// (POST /api/exercises), e non viene mai sovrascritto in seguito — è quindi
// una fonte affidabile per "chi ha inserito l'esercizio", indipendentemente
// da eventuali modifiche/approvazioni successive (che toccano solo il campo
// separato `userUpdate`).
//
// Uso (mongosh):
//   mongosh "mongodb://localhost:27017/k9-exercise?replicaSet=rs0" query/esercizi_creati_per_utente.js
// oppure, dentro una sessione mongosh già connessa al DB giusto:
//   load("query/esercizi_creati_per_utente.js")

// ── Parametro: data di inizio (inclusa) ─────────────────────────────────────
const FROM_DATE = new Date("2026-01-01T00:00:00Z");

const result = db.exercises.aggregate([
  {
    $match: {
      createdAt: { $gte: FROM_DATE },
      // Decommentare per contare solo gli esercizi approvati:
      // state: "APPROVED",
    },
  },
  {
    $group: {
      _id: "$user",
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1 } },
  {
    $project: {
      _id: 0,
      user: "$_id",
      exercisesCreated: "$count",
    },
  },
]);

printjson(result.toArray());
