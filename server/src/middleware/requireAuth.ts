// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { email: string; role: string };
    }
  }
}

const DEV_USER = process.env.DEV_USER ? JSON.parse(process.env.DEV_USER) : { email: "dev@local", role: "viewer" };

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.AUTH_ENABLED === "false") {
    req.user = DEV_USER;
    return next();
  }

  if (!req.session.user) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  req.user = req.session.user;
  next();
};
