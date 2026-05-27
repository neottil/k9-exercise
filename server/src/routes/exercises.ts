import { Router, Request, Response } from "express";
import Exercise from "../models/Exercise";

const router = Router();

// Tutti i campi filtrabili con la loro path MongoDB
const FILTER_FIELDS = [
  "workingArea.mental",
  "workingArea.flexibility",
  "workingArea.strength",
  "workingArea.balance",
  "workingArea.cardio",
  "bodyTarget.ant",
  "bodyTarget.post",
  "bodyTarget.core",
  "bodyTarget.backbone",
  "bodyTarget.fullBody",
];

/**
 * Costruisce la query MongoDB dai query param.
 *
 * Il frontend invia per ogni filtro attivo (value > 0):
 *   ?workingArea.mental.value=3&workingArea.mental.operation=gt
 *
 * La query replica la logica frontend:
 *   - se il campo è null/mancante → passa sempre (come faceva applyNumericFilter)
 *   - altrimenti applica l'operazione: "gt" → $gte, "eq" → valore esatto
 *
 * Tutti i filtri attivi vengono combinati con $and.
 */
const buildMongoFilter = (query: Request["query"]): object => {
  const andConditions: object[] = [];

  for (const field of FILTER_FIELDS) {
    const rawValue = query[`${field}.value`];
    const operation = query[`${field}.operation`] as string | undefined;
    const value = parseFloat(rawValue as string);

    if (isNaN(value) || value <= 0) continue;

    const valueCondition =
      operation === "eq"
        ? { [field]: value }
        : { [field]: { $gte: value } }; // "gte" → $gte

    andConditions.push({
      $or: [
        { [field]: null }, // null o campo mancante → passa
        valueCondition,
      ],
    });
  }

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

router.get("/", async (req: Request, res: Response) => {
  try {
    const mongoFilter = buildMongoFilter(req.query);
    const exercises = await Exercise.find(mongoFilter);
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
