// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

/**
 * Configurazione risolta a RUNTIME, non compilata nel bundle.
 *
 * PERCHÉ: le variabili `VITE_*` vengono compilate da Vite dentro il bundle al
 * momento della build. Il flusso di rilascio di questo progetto builda UNA
 * SOLA volta (in staging) e poi ri-tagga la stessa identica immagine per la
 * produzione (vedi tag.yml/promote.yml: `docker buildx imagetools create`,
 * nessun rebuild) — quindi qualunque valore compilato nel bundle resterebbe
 * per sempre quello di staging, anche in produzione.
 *
 * COME: l'immagine del client è neutra rispetto all'ambiente. Ogni ambiente
 * monta la propria ConfigMap `k9-client-config` come file statico servito da
 * nginx su `/config/config.json` (vedi client/k8s/configmap.yaml), che viene
 * letto qui una volta sola all'avvio, PRIMA del primo render (vedi main.tsx).
 *
 * In sviluppo locale quel file non esiste: si ricade sulle `VITE_*` del `.env`
 * alla root del monorepo, che restano il meccanismo di configurazione per
 * `npm run dev`.
 */

export interface RuntimeConfig {
  /** URL del sito esterno che genera il token di accesso */
  loginSiteUrl: string;
  /** Feature flag del filtro "con operatività" */
  enableWithOperationFilter: boolean;
}

const CONFIG_URL = "/config/config.json";

/**
 * Un URL senza schema (`www.esempio.it`) messo in un `href` viene interpretato
 * dal browser come path RELATIVO, producendo `https://app.dominio.it/www.esempio.it`.
 * Si normalizza qui, in un punto solo, invece che in ogni punto d'uso.
 */
const normalizeUrl = (raw: unknown): string => {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
};

const fromViteEnv = (): RuntimeConfig => ({
  loginSiteUrl: normalizeUrl(import.meta.env.VITE_LOGIN_SITE_URL),
  enableWithOperationFilter: import.meta.env.VITE_ENABLE_WITH_OPERATION_FILTER === "true",
});

const fromJson = (raw: Record<string, unknown>): RuntimeConfig => ({
  loginSiteUrl: normalizeUrl(raw.loginSiteUrl),
  // Stringa e non booleano JSON: la ConfigMap è renderizzata con envsubst, e
  // una variabile non valorizzata produrrebbe JSON non valido (`: ,`).
  enableWithOperationFilter: raw.enableWithOperationFilter === "true" || raw.enableWithOperationFilter === true,
});

let config: RuntimeConfig | null = null;

/**
 * Da invocare UNA volta all'avvio, prima di montare React (vedi main.tsx):
 * i componenti leggono la config in modo sincrono con `getConfig()`.
 */
export const loadRuntimeConfig = async (): Promise<void> => {
  try {
    const res = await fetch(CONFIG_URL, { cache: "no-store" });
    if (res.ok) {
      config = fromJson(await res.json());
      return;
    }
  } catch {
    // Ignorato di proposito: vedi sotto.
  }

  // File assente o non parsabile. Caso normale in sviluppo locale (il dev
  // server di Vite non serve /config/config.json e fa fallback su index.html,
  // che non è JSON); in un ambiente deployato indica invece una ConfigMap non
  // montata — si ricade sui default del build, che potrebbero non essere
  // quelli di questo ambiente.
  config = fromViteEnv();
};

/** Config già risolta. Va usata solo dopo `loadRuntimeConfig()`. */
export const getConfig = (): RuntimeConfig => config ?? fromViteEnv();
