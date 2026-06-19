// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import PasswordValidator from "password-validator";
import User from "../models/User.js";
import { requireDbReady } from "../middleware/requireDbReady.js";

const router = Router();

const DEV_USER = { email: "dev@local", role: "admin" };

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppi tentativi di accesso. Riprova tra 15 minuti." },
});

const passwordSchema = new PasswordValidator();
passwordSchema
  .is().min(8)
  .has().uppercase()
  .has().lowercase()
  .has().digits(1)
  .has().symbols(1)
  .has().not().spaces();

const isPasswordValid = (pw: string): boolean =>
  passwordSchema.validate(pw) as boolean;

// GET /api/auth/me
router.get("/me", (req: Request, res: Response): void => {
  if (process.env.AUTH_ENABLED === "false") {
    res.json(DEV_USER);
    return;
  }
  if (!req.session.user) {
    res.status(401).json({ error: "Non autenticato" });
    return;
  }
  res.json(req.session.user);
});

// POST /api/auth/login
router.post("/login", loginLimiter, requireDbReady, async (req: Request, res: Response): Promise<void> => {
  if (process.env.AUTH_ENABLED === "false") {
    req.session.user = DEV_USER;
    res.json(DEV_USER);
    return;
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email e password obbligatori" });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Credenziali non valide" });
      return;
    }

    if (user.state !== "APPROVED") {
      res.status(403).json({ error: "Account in attesa di approvazione" });
      return;
    }

    const sessionUser = { email: user.email, role: user.role };
    req.session.user = sessionUser;
    res.json(sessionUser);
  } catch (err) {
    console.error("[POST /auth/login] errore:", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

// POST /api/auth/register
router.post("/register", requireDbReady, async (req: Request, res: Response): Promise<void> => {
  if (process.env.AUTH_ENABLED === "false") {
    res.status(403).json({ error: "Registrazione non disponibile in modalità dev" });
    return;
  }

  const { email, password, firstName, lastName } = req.body as { email?: string; password?: string; firstName?: string; lastName?: string };

  if (!email || !password) {
    res.status(400).json({ error: "Email e password obbligatori" });
    return;
  }

  if (!isPasswordValid(password)) {
    res.status(400).json({ error: "La password non soddisfa i requisiti di sicurezza" });
    return;
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ error: "Email già registrata" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "viewer",
      state: "TO_APPROVE",
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
    });

    res.status(201).json({ message: "Registrazione completata. Il tuo account è in attesa di approvazione." });
  } catch (err) {
    console.error("[POST /auth/register] errore:", err);
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
