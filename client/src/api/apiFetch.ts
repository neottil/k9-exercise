// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

export const SESSION_EXPIRED_EVENT = "session:expired";

export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const res = await fetch(url, options);
  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
  return res;
};

/**
 * Errore che trasporta il messaggio specifico restituito dal server
 * (campo `error` del body JSON) più i dettagli tecnici della risposta.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, res: Response, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = res.status;
    this.statusText = res.statusText;
    this.url = res.url;
    this.body = body;
  }

  /** Stringa multilinea con i dettagli tecnici, da mostrare sotto "Dettagli". */
  get details(): string {
    const parts = [`HTTP ${this.status}${this.statusText ? ` ${this.statusText}` : ""}`];
    if (this.url) parts.push(this.url);
    if (this.body !== undefined) {
      parts.push(typeof this.body === "string" ? this.body : JSON.stringify(this.body, null, 2));
    }
    return parts.join("\n");
  }
}

/**
 * Costruisce un ApiError da una Response non ok, estraendo il messaggio dal
 * campo `error` del body JSON (fallback al messaggio passato se il body non è
 * leggibile o non contiene `error`). Da usare dopo aver verificato `!res.ok`.
 */
export const apiError = async (res: Response, fallback: string): Promise<ApiError> => {
  let body: unknown;
  let serverMessage: string | undefined;
  try {
    body = await res.clone().json();
    if (body && typeof body === "object" && "error" in body) {
      serverMessage = String((body as { error: unknown }).error);
    }
  } catch {
    // body non JSON o vuoto: si resta sul fallback
  }
  return new ApiError(serverMessage || fallback, res, body);
};

/**
 * Normalizza un errore qualsiasi (ApiError, Error di rete, valore generico) in
 * { message, details } per le notifiche. Garantisce dettagli anche per gli
 * errori non-HTTP (es. "Failed to fetch").
 */
export const describeError = (
  err: unknown,
  fallback: string
): { message: string; details?: string } => {
  if (err instanceof ApiError) return { message: err.message, details: err.details };
  if (err instanceof Error) return { message: fallback, details: err.message };
  return { message: fallback };
};
