// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { AuthUser } from "../interfaces/authInterfaces";
import { apiError } from "./apiFetch";

const BASE_URL = "/api/auth";

export const getMe = async (): Promise<AuthUser | null> => {
  const res = await fetch(`${BASE_URL}/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Errore nel recupero utente");
  return res.json();
};

export const logout = async (): Promise<void> => {
  await fetch(`${BASE_URL}/logout`, { method: "POST" });
};

export const acceptTerms = async (): Promise<void> => {
  const res = await fetch(`${BASE_URL}/accept-terms`, { method: "POST" });
  if (!res.ok) throw await apiError(res, "Errore durante l'accettazione dei termini");
};
