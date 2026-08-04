// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireDbReady } from "../middleware/requireDbReady.js";
import { logger } from "../utils/logger.js";

const router = Router();

// GET /api/auth/me
router.get("/me", (req: Request, res: Response): void => {
  if (!req.session.user) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  res.json({ ...req.session.user, firstAccess: req.session.firstAccess ?? false });
});

// GET /api/auth/wp-callback?token=<JWT>
// Riceve il JWT generato dal sito esterno (WordPress), lo valida con il
// segreto condiviso e crea la sessione utente senza richiedere password.
router.get("/wp-callback", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).send("Token mancante");
    return;
  }

  const secret = process.env.K9_JWT_SECRET;
  if (!secret) {
    logger.error("[wp-callback] K9_JWT_SECRET non configurato");
    res.status(500).send("Configurazione server mancante");
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { email: string; username?: string; role: string; instructor_level?: string };

    if (!payload.email || !payload.role) {
      res.status(400).send("Token mancante dei campi richiesti (email, role)");
      return;
    }

    req.session.user = {
      email: payload.email,
      username: payload.username,
      role: payload.role,
      instructorLevel: payload.instructor_level
    };

    const existing = await User.findOne({
      email: payload.email.toLowerCase(),
      username: payload.username,
    });

    if (!existing) {
      req.session.firstAccess = true;
    }

    res.redirect("/");
  } catch (err) {
    logger.error("[wp-callback] token non valido:", err);
    res.status(401).send("Token non valido o scaduto");
  }
});

// POST /api/auth/accept-terms
router.post("/accept-terms", requireDbReady, async (req: Request, res: Response): Promise<void> => {
  if (!req.session.user) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }

  const { email, username } = req.session.user;

  try {
    await User.create({
      email: email.toLowerCase(),
      username: username ?? undefined,
      acceptTerms: true,
    });

    req.session.firstAccess = false;
    res.json({ ok: true });
  } catch (err) {
    logger.error("[POST /auth/accept-terms] errore:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Errore durante il logout" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
