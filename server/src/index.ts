import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";

import exerciseRoutes from "./routes/exercises";
import authRoutes from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";

// Il .env è alla root del monorepo (due livelli sopra server/src/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI non è configurata. Aggiungila nel file .env alla root del progetto (o impostala come variabile d'ambiente).");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

const SESSION_MAX_AGE = 1000 * 60 * 60 * 2; // 2 ore

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    rolling: true, // sliding window: la scadenza si azzera ad ogni richiesta
    store: MongoStore.create({ mongoUrl: MONGODB_URI, ttl: SESSION_MAX_AGE / 1000 }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/exercises", requireAuth, exerciseRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connesso a MongoDB");
    app.listen(PORT, () => {
      console.log(`Server avviato sulla porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Errore di connessione MongoDB:", err);
    process.exit(1);
  });
