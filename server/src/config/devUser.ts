// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Utente simulato quando LOGIN_TYPE=disabled.
// Modifica i campi qui per cambiare il profilo durante lo sviluppo locale.
export const DEV_USER: { email: string; username: string; role: "admin" | "viewer"; instructorLevel: string } = {
  email: "dev@local",
  username: "dev",
  role: "admin",
  instructorLevel: "CTS",
};
