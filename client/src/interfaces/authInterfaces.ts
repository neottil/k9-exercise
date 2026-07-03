// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

export type UserRole = "viewer" | "admin";

export interface AuthUser {
  email: string;
  username?: string;
  role: UserRole;
  instructorLevel?: string;
  firstAccess?: boolean;
}
