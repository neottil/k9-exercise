// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Wrapper su console.log/warn/error che antepone un timestamp ISO a ogni
// riga. Senza timestamp, i log di route chiamate periodicamente (CronJob
// notify/gc-images, retry di connessione DB) o di run distinte sono
// impossibili da correlare tra loro nello stream del pod.

const timestamp = (): string => new Date().toISOString();

export const logger = {
  info: (...args: unknown[]): void => {
    console.log(`[${timestamp()}]`, ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(`[${timestamp()}]`, ...args);
  },
  error: (...args: unknown[]): void => {
    console.error(`[${timestamp()}]`, ...args);
  },
  // Silenzioso a meno che LOG_LEVEL=debug (locale/staging, mai in produzione
  // — vedi server/k8s/deployment.yaml). Letto ad ogni chiamata, non in cima
  // al modulo: permette di attivarlo nei test senza riavviare il processo.
  debug: (...args: unknown[]): void => {
    if (process.env.LOG_LEVEL !== "debug") return;
    console.debug(`[${timestamp()}]`, ...args);
  },
};
