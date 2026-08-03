// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./test/globalSetup.ts"],
    // Il container Mongo (globalSetup) e l'elezione del replica set a singolo
    // nodo possono richiedere fino a una trentina di secondi in CI.
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
