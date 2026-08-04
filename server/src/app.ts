// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import express, { type Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import exerciseRoutes from "./routes/exercises.js";
import authRoutes from "./routes/auth.js";
import notifyRoutes from "./routes/notify.js";
import gcImagesRoutes from "./routes/adminImages.js";
import auditRoutes from "./routes/audit.js";
import { requireAuth } from "./middleware/requireAuth.js";

export interface CreateAppOptions {
  /** URI Mongo per lo store delle sessioni (connect-mongo apre una connessione propria). */
  mongoUri: string;
}

/**
 * Costruisce l'app Express senza avviarla (niente app.listen, niente
 * connessione mongoose ai model). Separato da index.ts per essere importabile
 * dai test (supertest) e per iniettare un mongoUri diverso da quello di
 * produzione — es. il container Mongo effimero usato nei test API.
 */
export const createApp = ({ mongoUri }: CreateAppOptions): Express => {
  const app = express();

  // Traefik termina TLS e parla HTTP con Express internamente.
  // Senza trust proxy, req.secure = false e express-session salta Set-Cookie
  // quando cookie.secure = true. Con trust proxy = 1, Express legge
  // X-Forwarded-Proto: https da Traefik e req.secure diventa true.
  app.set("trust proxy", 1);

  // ── Middleware ─────────────────────────────────────────────────────────────

  app.use(cors());
  app.use(express.json());

  const SESSION_MAX_AGE = 1000 * 60 * 60 * 2; // 2 ore

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      store: MongoStore.create({ mongoUrl: mongoUri, ttl: SESSION_MAX_AGE / 1000 }),
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
      },
    })
  );

  // ── Route ──────────────────────────────────────────────────────────────────

  app.use("/api/auth", authRoutes);
  app.use("/api/exercises", requireAuth, exerciseRoutes);
  app.use("/api/admin/notify", notifyRoutes);
  app.use("/api/admin/gc-images", gcImagesRoutes);
  app.use("/api/admin/audit", requireAuth, auditRoutes);

  app.get("/health", (_req, res) => {
    const stateLabel = ["disconnected", "connected", "connecting", "disconnecting"];
    res.json({
      status: "ok",
      db: stateLabel[mongoose.connection.readyState] ?? "unknown",
    });
  });

  return app;
};
