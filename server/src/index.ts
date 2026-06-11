import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";

import exerciseRoutes from "./routes/exercises.js";
import authRoutes from "./routes/auth.js";
import { requireAuth } from "./middleware/requireAuth.js";

// Il .env è alla root del monorepo (due livelli sopra server/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();

// Traefik termina TLS e parla HTTP con Express internamente.
// Senza trust proxy, req.secure = false e express-session salta Set-Cookie
// quando cookie.secure = true. Con trust proxy = 1, Express legge
// X-Forwarded-Proto: https da Traefik e req.secure diventa true.
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI non è configurata. Aggiungila nel file .env alla root del progetto (o impostala come variabile d'ambiente).");
  process.exit(1);
}

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

const SESSION_MAX_AGE = 1000 * 60 * 60 * 2; // 2 ore

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({ mongoUrl: MONGODB_URI, ttl: SESSION_MAX_AGE / 1000 }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
    },
  })
);

// ── Route ─────────────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/exercises", requireAuth, exerciseRoutes);

app.get("/health", (_req, res) => {
  const stateLabel = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    db: stateLabel[mongoose.connection.readyState] ?? "unknown",
  });
});

// ── Event listeners sulla connessione DB ──────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn(
    `[DB] Connessione persa` +
    ` | host: ${mongoose.connection.host ?? "n/a"}` +
    ` | ${new Date().toISOString()}`
  );
});

mongoose.connection.on("reconnected", () => {
  console.log(
    `[DB] Connessione ripristinata` +
    ` | host: ${mongoose.connection.host ?? "n/a"}` +
    ` | ${new Date().toISOString()}`
  );
});

mongoose.connection.on("error", (err) => {
  console.error(
    `[DB] Errore sulla connessione — ${err.message}` +
    ` | readyState: ${mongoose.connection.readyState}` +
    ` | ${new Date().toISOString()}`
  );
});

// ── Connessione a MongoDB con retry ───────────────────────────────────────────
// Non blocca l'avvio del server HTTP. Se il DB non è disponibile al primo
// tentativo, riprova ogni 5 secondi fino al successo. Le route sono già
// protette da requireDbReady che risponde 503 finché readyState !== 1.

const RETRY_DELAY_MS = 5000;

const connectWithRetry = async (): Promise<void> => {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      await mongoose.connect(MONGODB_URI);
      console.log(
        `[DB] Connesso a MongoDB (tentativo ${attempt})` +
        ` | ${new Date().toISOString()}`
      );
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `[DB] Connessione fallita (tentativo ${attempt})` +
        ` — nuovo tentativo tra ${RETRY_DELAY_MS / 1000}s` +
        `\n  errore    : ${msg}` +
        `\n  timestamp : ${new Date().toISOString()}`
      );
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

// ── Avvio ─────────────────────────────────────────────────────────────────────
// Il server HTTP parte immediatamente. La connessione al DB avviene in
// background: durante il downtime tutte le route API restituiscono 503
// grazie al middleware requireDbReady.

app.listen(PORT, () => {
  console.log(`[SERVER] Avviato sulla porta ${PORT} | ${new Date().toISOString()}`);
  connectWithRetry();
});
