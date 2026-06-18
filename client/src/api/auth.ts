// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { AuthUser } from "../interfaces/authInterfaces";

const BASE_URL = "/api/auth";

export const getMe = async (): Promise<AuthUser | null> => {
  const res = await fetch(`${BASE_URL}/me`);
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Errore nel recupero utente");
  return res.json();
};

export const login = async (email: string, password: string): Promise<AuthUser> => {
  const res = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || "Credenziali non valide");
  }
  return res.json();
};

export const logout = async (): Promise<void> => {
  await fetch(`${BASE_URL}/logout`, { method: "POST" });
};

export const register = async (email: string, password: string): Promise<string> => {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({})) as { message?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Errore durante la registrazione");
  }
  return data.message ?? "Registrazione completata.";
};
