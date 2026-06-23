// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import "express-session";

declare module "express-session" {
  interface SessionData {
    user: { email: string; username?: string; role: string; instructorLevel?: string } | undefined;
  }
}
