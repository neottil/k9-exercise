import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import exerciseRoutes from "./routes/exercises";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/k9-exercise";

app.use(cors());
app.use(express.json());

app.use("/api/exercises", exerciseRoutes);

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
