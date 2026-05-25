import { Router, Request, Response } from "express";
import Exercise from "../models/Exercise";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const exercises = await Exercise.find();
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli esercizi" });
  }
});

router.get("/types", async (_req: Request, res: Response) => {
  try {
    const types = await Exercise.distinct("type");
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei tipi" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dell'esercizio" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { id, ...rest } = req.body;
    const exercise = new Exercise({ _id: id, ...rest });
    await exercise.save();
    res.status(201).json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Errore nel salvataggio dell'esercizio" });
  }
});

router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id: _id, ...rest } = req.body;
    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      { $set: rest },
      { new: true }
    );
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: "Errore nell'aggiornamento dell'esercizio" });
  }
});

export default router;
