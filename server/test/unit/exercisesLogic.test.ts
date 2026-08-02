// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { buildMongoFilter, computeDiff } from "../../src/routes/exercises.js";

const asQuery = (obj: Record<string, string>): Request["query"] =>
  obj as unknown as Request["query"];

describe("buildMongoFilter", () => {
  it("restituisce un filtro vuoto senza query param", () => {
    expect(buildMongoFilter(asQuery({}))).toEqual({});
  });

  it("ignora valori 0 in modalità gte (no-op: tutti i valori sono >= 0), negativi o non numerici", () => {
    expect(buildMongoFilter(asQuery({ "workingArea.mental.value": "0" }))).toEqual({});
    expect(buildMongoFilter(asQuery({ "workingArea.mental.value": "0", "workingArea.mental.operation": "gte" }))).toEqual({});
    expect(buildMongoFilter(asQuery({ "workingArea.mental.value": "-1" }))).toEqual({});
    expect(buildMongoFilter(asQuery({ "workingArea.mental.value": "abc" }))).toEqual({});
  });

  // Regressione: value=0 con operation=eq è un filtro attivo e significativo
  // ("esattamente 0"), non un filtro assente — va incluso, non scartato come
  // gli altri valori <= 0.
  it("include value=0 quando operation=eq", () => {
    const filter = buildMongoFilter(
      asQuery({ "workingArea.cardio.value": "0", "workingArea.cardio.operation": "eq" })
    ) as { $and: unknown[] };
    expect(filter.$and).toEqual([
      { $or: [{ "workingArea.cardio": null }, { "workingArea.cardio": 0 }] },
    ]);
  });

  it("costruisce $gte di default, includendo i documenti con valore null/mancante", () => {
    const filter = buildMongoFilter(asQuery({ "bodyTarget.core.value": "3" })) as { $and: unknown[] };
    expect(filter.$and).toEqual([
      { $or: [{ "bodyTarget.core": null }, { "bodyTarget.core": { $gte: 3 } }] },
    ]);
  });

  it("usa uguaglianza esatta quando operation=eq", () => {
    const filter = buildMongoFilter(
      asQuery({ "bodyTarget.core.value": "3", "bodyTarget.core.operation": "eq" })
    ) as { $and: unknown[] };
    expect(filter.$and).toEqual([
      { $or: [{ "bodyTarget.core": null }, { "bodyTarget.core": 3 }] },
    ]);
  });

  it("combina più filtri attivi in $and", () => {
    const filter = buildMongoFilter(
      asQuery({ "bodyTarget.core.value": "2", "workingArea.cardio.value": "4" })
    ) as { $and: unknown[] };
    expect(filter.$and).toHaveLength(2);
  });
});

describe("computeDiff", () => {
  it("non include campi invariati", () => {
    const original = { type: "A", description: "x" };
    const submitted = { type: "A", description: "x" };
    expect(computeDiff(original, submitted)).toEqual({});
  });

  it("include solo i campi di contenuto effettivamente cambiati", () => {
    const original = { type: "A", description: "x", setup: "s" };
    const submitted = { type: "B", description: "x", setup: "s2" };
    expect(computeDiff(original, submitted)).toEqual({ type: "B", setup: "s2" });
  });

  it("ignora campi che non sono di contenuto (es. state, user)", () => {
    const original = { type: "A", state: "APPROVED", user: "a" };
    const submitted = { type: "A", state: "PENDING_UPDATE", user: "b" };
    expect(computeDiff(original, submitted)).toEqual({});
  });

  it("rileva differenze annidate (workingArea/bodyTarget)", () => {
    const original = { workingArea: { mental: 1, cardio: 0 } };
    const submitted = { workingArea: { mental: 1, cardio: 3 } };
    expect(computeDiff(original, submitted)).toEqual({ workingArea: { mental: 1, cardio: 3 } });
  });
});
