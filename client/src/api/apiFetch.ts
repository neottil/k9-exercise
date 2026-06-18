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
