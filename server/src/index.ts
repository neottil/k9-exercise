import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import MongoStore from "connect-mongo";

import exerciseRoutes from "./routes/exercises";
import authRoutes from "./routes/auth";
import { requireAuth } from "./middleware/requireAuth";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/k9-exercise";

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
