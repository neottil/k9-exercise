// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Request, Response, NextFunction } from "express";
import { DEV_USER } from "../config/devUser.js";

declare global {
  namespace Express {
    interface Request {
      user?: { email: string; role: string };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.LOGIN_TYPE === "disabled") {
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
