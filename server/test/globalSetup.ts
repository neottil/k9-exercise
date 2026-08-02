// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.
//
// Avvia UN SOLO container MongoDB (replica set a singolo nodo, richiesto dalle
// transazioni usate nelle route di approvazione) per l'intera run di test:
// ogni file di test si connette allo stesso container ma su un database
// dedicato (vedi test/helpers/db.ts), quindi i test restano isolati pur
// condividendo il costo di avvio del container.
//
// Richiede Docker: gira in CI (GitHub Actions ubuntu-latest ce l'ha di
// default). In locale, `npm run test` fallisce se Docker non è installato —
// vedi DEVELOPER_README.md, sezione Test.

import type { TestProject } from "vitest/node";
import { MongoDBContainer } from "@testcontainers/mongodb";

declare module "vitest" {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export default async function setup(project: TestProject) {
  const container = await new MongoDBContainer("mongo:8.0").start();
  project.provide("mongoUri", container.getConnectionString());

  return async () => {
    await container.stop();
  };
}
