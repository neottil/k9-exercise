// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Wrapper su console.log/warn/error che antepone un timestamp ISO a ogni
// riga. Senza timestamp, i log di route chiamate periodicamente (CronJob
// notify/gc-images, retry di connessione DB) o di run distinte sono
// impossibili da correlare tra loro nello stream del pod.
//
// Firma identica a console.*: sostituzione diretta, nessun altro cambiamento
// richiesto nei chiamanti oltre a `console.` → `logger.`.

const timestamp = (): string => new Date().toISOString();

export const logger = {
  log: (...args: unknown[]): void => {
    console.log(`[${timestamp()}]`, ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(`[${timestamp()}]`, ...args);
  },
  error: (...args: unknown[]): void => {
    console.error(`[${timestamp()}]`, ...args);
  },
};
