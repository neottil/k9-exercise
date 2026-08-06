// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import mongoose from "mongoose";
import multer from "multer";
import { Router, Request, Response, NextFunction } from "express";
import Exercise from "../models/Exercise.js";
import ExerciseChange from "../models/ExerciseChange.js";
import { requireDbReady } from "../middleware/requireDbReady.js";
import { getImageStream } from "../config/minio.js";
import { logger } from "../utils/logger.js";
import {
  MAX_IMAGES,
  validateFiles,
  uploadFiles,
  ImageValidationError,
  type ImageMeta,
  type UploadedFile,
} from "../services/exerciseImages.js";

// Upload in memoria: i file vengono passati a minIO senza toccare il disco.
const upload = multer({ storage: multer.memoryStorage() });

// Middleware: solo admin — usato sulle route di approvazione
const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Accesso riservato agli amministratori" });
    return;
  }
  next();
};

const router = Router();

// requireDbReady è applicato solo alle route di scrittura (POST / PUT).
// Le GET possono girare anche con DB in fase di riconnessione: Mongoose
// bufferizza la query e risponde non appena il DB torna disponibile.

const TO_APPROVE     = "TO_APPROVE"     as const;
const APPROVED       = "APPROVED"       as const;
const PENDING_UPDATE = "PENDING_UPDATE" as const;
const REJECTED       = "REJECTED"       as const;

// Stati di ExerciseChange (distinti da quelli di Exercise sopra, anche se
// alcuni valori coincidono come stringa).
const CHANGE_PENDING    = "PENDING"    as const;
const CHANGE_SUPERSEDED = "SUPERSEDED" as const;
const CHANGE_APPROVED   = "APPROVED"   as const;
const CHANGE_REJECTED   = "REJECTED"   as const;

// La "catena aperta" di un esercizio: la proposta attiva più tutte quelle che
// altri utenti hanno scavalcato. Si risolve o si cancella sempre per intero.
const OPEN_CHAIN_STATES = [CHANGE_PENDING, CHANGE_SUPERSEDED];

// Rileva l'errore di chiave duplicata MongoDB, sollevato dall'unique index
// { type, variant } quando si tenta di salvare/applicare un combo già esistente.
const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;

const DUPLICATE_MESSAGE =
  "Esiste già un esercizio con questa combinazione di tipologia e variante";

// Campi filtrabili via query param
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

// Campi di contenuto: gli unici su cui calcolare il diff e salvare le changes.
// `images` è incluso: le modifiche alle immagini passano per l'approvazione
// admin come ogni altro contenuto (vedi analisi/25_gestione_immagini.md).
const CONTENT_FIELDS = [
  "instructorLevel", "type", "variant", "description",
  "workingArea", "bodyTarget",
  "movementPlan", "tools",
  "difficultyLevel", "setup", "images",
];

/**
 * Estrae i dati dell'esercizio e i file dalla richiesta. Supporta sia
 * multipart/form-data (campo "exercise" come JSON string + file "images")
 * sia application/json (compatibilità con eventuali client non-multipart).
 */
const extractSubmission = (
  req: Request
): { data: Record<string, unknown>; files: UploadedFile[] } => {
  const files = (req.files as UploadedFile[] | undefined) ?? [];
  const raw = (req.body as { exercise?: unknown }).exercise;
  if (typeof raw === "string") {
    return { data: JSON.parse(raw) as Record<string, unknown>, files };
  }
  return { data: req.body as Record<string, unknown>, files };
};

/**
 * Raccoglie le immagini già legate a un esercizio (mappate per id): quelle
 * approvate sul documento più quelle in attesa nel change doc. Serve a
 * risolvere gli id che il client vuole mantenere usando i metadati autorevoli
 * del server, impedendo che un client inietti o alteri riferimenti.
 */
const collectExistingImages = async (
  id: string,
  exerciseData: Record<string, unknown>
): Promise<Map<string, ImageMeta>> => {
  const map = new Map<string, ImageMeta>();
  for (const img of (exerciseData.images as ImageMeta[] | undefined) ?? []) map.set(img.id, img);
  const change = await ExerciseChange.findOne({ exerciseId: id, state: CHANGE_PENDING });
  const pending = (change?.fields as { images?: ImageMeta[] } | undefined)?.images;
  for (const img of pending ?? []) map.set(img.id, img);
  return map;
};

/**
 * Costruisce la query MongoDB dai query param.
 * Ogni filtro attivo diventa un $or che passa sia i null/mancanti sia i
 * valori che soddisfano l'operazione (gte | eq). "value === 0" è un no-op
 * per "gte" (tutti i valori sono >= 0), ma è un filtro attivo e significativo
 * per "eq" (l'utente vuole esattamente 0) — va quindi passato solo in quel
 * caso, non scartato a prescindere come gli altri valori <= 0.
 */
export const buildMongoFilter = (query: Request["query"]): object => {
  const andConditions: object[] = [];

  for (const field of FILTER_FIELDS) {
    const rawValue = query[`${field}.value`];
    const operation = query[`${field}.operation`] as string | undefined;
    const value = parseFloat(rawValue as string);

    if (isNaN(value) || value < 0) continue;
    if (value === 0 && operation !== "eq") continue;

    const valueCondition =
      operation === "eq"
        ? { [field]: value }
        : { [field]: { $gte: value } };

    andConditions.push({
      $or: [{ [field]: null }, valueCondition],
    });
  }

  return andConditions.length > 0 ? { $and: andConditions } : {};
};

/**
 * Calcola il diff tra i dati originali approvati e i dati inviati dal client.
 * Restituisce solo i campi di contenuto che sono effettivamente cambiati.
 */
export const computeDiff = (
  original: Record<string, unknown>,
  submitted: Record<string, unknown>
): Record<string, unknown> => {
  const diff: Record<string, unknown> = {};
  for (const field of CONTENT_FIELDS) {
    if (JSON.stringify(original[field]) !== JSON.stringify(submitted[field])) {
      diff[field] = submitted[field];
    }
  }
  return diff;
};

// GET / — lista esercizi (esclude TO_APPROVE, filtra per livello utente)
// CTS: vede tutto. BSS (o livello non impostato): solo esercizi BSS o senza livello.
router.get("/", async (req: Request, res: Response) => {
  try {
    const mongoFilter = buildMongoFilter(req.query);
    const isCTS = req.user?.instructorLevel === "CTS";
    const levelFilter = isCTS ? {} : { $or: [{ instructorLevel: "BSS" }, { instructorLevel: null }] };
    const filter = { ...mongoFilter, ...levelFilter, state: { $in: [ APPROVED, PENDING_UPDATE ] } };
    // Tipologia e variante in ordine alfabetico italiano (collation: case-insensitive,
    // consapevole degli accenti), difficoltà crescente all'interno della stessa tipologia.
    const exercises = await Exercise.find(filter)
      .collation({ locale: "it", strength: 2 })
      .sort({ type: 1, difficultyLevel: 1, variant: 1 });
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero degli esercizi" });
  }
});

// GET /types — tipi distinti (tutti, indipendentemente dallo stato)
router.get("/types", async (_req: Request, res: Response) => {
  try {
    const types = await Exercise.distinct("type");
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dei tipi" });
  }
});

// GET /pending — esercizi in PENDING_UPDATE con i rispettivi change doc (solo admin)
router.get("/pending", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const exercises = await Exercise.find({ state: PENDING_UPDATE });
    const result = await Promise.all(
      exercises.map(async (ex) => {
        // Si legge l'intera catena aperta, non la sola PENDING: quando più
        // utenti hanno contribuito alla stessa proposta, l'admin deve sapere
        // di chi è il lavoro che sta valutando — non solo di chi ci ha messo
        // mano per ultimo.
        const chain = await ExerciseChange.find({
          exerciseId: ex._id,
          state: { $in: OPEN_CHAIN_STATES },
        }).sort({ createdAt: 1 });

        const change = chain.find((c) => c.state === CHANGE_PENDING) ?? null;
        const contributors = [
          ...new Set(chain.map((c) => c.user).filter((u): u is string => Boolean(u))),
        ];

        return { exercise: ex.toJSON(), change: change ? change.toJSON() : null, contributors };
      })
    );
    res.json(result);
  } catch (err) {
    logger.error("[GET /exercises/pending]", err);
    res.status(500).json({ error: "Errore nel recupero delle modifiche in attesa" });
  }
});

// GET /to-approve — esercizi in TO_APPROVE (solo admin)
router.get("/to-approve", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const exercises = await Exercise.find({ state: TO_APPROVE });
    res.json(exercises);
  } catch (err) {
    logger.error("[GET /exercises/to-approve]", err);
    res.status(500).json({ error: "Errore nel recupero degli esercizi da approvare" });
  }
});

// GET /:id/changes — restituisce l'esercizio con le eventuali changes applicate (per il form di modifica)
router.get("/:id/changes", async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    const change = await ExerciseChange.findOne({ exerciseId: req.params.id, state: CHANGE_PENDING });
    if (!change) {
      res.json(exercise);
      return;
    }
    // Merge: campi approvati + campi modificati in attesa
    res.json({ ...exercise.toJSON(), ...(change.fields as object) });
  } catch (err) {
    res.status(500).json({ error: "Errore nel recupero dell'esercizio con changes" });
  }
});

// GET /:id — restituisce l'esercizio originale (senza changes applicate)
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

// GET /:id/images/:imageId — stream del binario immagine (proxy verso minIO).
// I metadati (e quindi la presenza dell'immagine) arrivano già dalle GET
// dell'esercizio: qui si serve solo il file, con cache lato browser.
router.get("/:id/images/:imageId", async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    const exData = exercise.toJSON() as Record<string, unknown>;
    let image = ((exData.images as ImageMeta[] | undefined) ?? []).find((i) => i.id === imageId);
    // Fallback: immagine ancora solo nel change doc (modifica in attesa)
    if (!image) {
      const change = await ExerciseChange.findOne({ exerciseId: id, state: CHANGE_PENDING });
      image = (change?.fields as { images?: ImageMeta[] } | undefined)?.images?.find(
        (i) => i.id === imageId
      );
    }
    if (!image) {
      res.status(404).json({ error: "Immagine non trovata" });
      return;
    }

    const stream = await getImageStream(image.key);
    res.setHeader("Content-Type", image.mimeType || "application/octet-stream");
    res.setHeader("Cache-Control", "private, max-age=86400");
    stream.on("error", (e) => {
      logger.error("[GET /:id/images/:imageId] errore stream:", e);
      if (!res.headersSent) res.status(502).json({ error: "Errore nel recupero dell'immagine" });
    });
    stream.pipe(res);
  } catch (err) {
    logger.error("[GET /:id/images/:imageId]", err);
    if (!res.headersSent) res.status(500).json({ error: "Errore nel recupero dell'immagine" });
  }
});

// POST / — crea nuovo esercizio, sempre in stato TO_APPROVE.
// multipart/form-data: campo "exercise" (JSON) + file "images" (max MAX_IMAGES).
router.post("/", requireDbReady, upload.array("images", MAX_IMAGES), async (req: Request, res: Response) => {
  try {
    const { data, files } = extractSubmission(req);
    const { id, images: _clientImages, ...rest } = data;

    if (files.length > MAX_IMAGES) {
      res.status(400).json({ error: `Massimo ${MAX_IMAGES} immagini per esercizio` });
      return;
    }
    validateFiles(files);

    const username = req.user?.username ?? req.user?.email;
    const images = await uploadFiles(id as string, files, username);

    const exercise = new Exercise({
      _id: id,
      ...rest,
      images,
      state: TO_APPROVE,
      user: username,
      userUpdate: username,
    });
    await exercise.save();
    res.status(201).json(exercise);
  } catch (err) {
    logger.error("[POST /exercises/]", err);
    if (err instanceof ImageValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ error: DUPLICATE_MESSAGE });
      return;
    }
    res.status(500).json({ error: "Errore nel salvataggio dell'esercizio" });
  }
});

/**
 * PUT /:id — aggiornamento state-aware:
 *
 * TO_APPROVE (o senza stato) → aggiorna i campi direttamente sull'esercizio
 * APPROVED                   → crea change doc, imposta stato PENDING_UPDATE  (transazione)
 * PENDING_UPDATE             → aggiorna il change doc esistente                (transazione)
 *                              Se il diff è vuoto (tutte le modifiche annullate) → elimina
 *                              il change doc e ripristina APPROVED
 */
router.put("/:id", requireDbReady, upload.array("images", MAX_IMAGES), async (req: Request, res: Response) => {
  const id = req.params.id as string;
  logger.info(`[PUT /:id] id=${id}`);
  try {
    const { data, files } = extractSubmission(req);
    const { id: _id, state: _state, images: clientImages, ...rest } = data;

    const exercise = await Exercise.findById(id);
    if (!exercise) {
      logger.warn(`[PUT /:id] esercizio non trovato id=${id}`);
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }

    const exerciseData = exercise.toJSON() as Record<string, unknown>;
    const currentState = exerciseData.state as string | undefined;
    logger.info(`[PUT /:id] state corrente=${currentState}`);

    // ── Immagini ────────────────────────────────────────────────────────────
    // Si tengono solo le immagini già esistenti (integrità), si validano e
    // caricano i nuovi file, e si impone il limite PRIMA dell'upload per non
    // generare orfani inutili.
    validateFiles(files);
    const kept = Array.isArray(clientImages) ? (clientImages as ImageMeta[]) : [];
    const existing = await collectExistingImages(id, exerciseData);
    // Risolve gli id da mantenere sui metadati del server (non sugli oggetti
    // inviati dal client): scarta gli id sconosciuti e ignora eventuali key alterate.
    const keptImages = kept
      .map((img) => existing.get(img.id))
      .filter((img): img is ImageMeta => img !== undefined);
    if (keptImages.length + files.length > MAX_IMAGES) {
      res.status(400).json({ error: `Massimo ${MAX_IMAGES} immagini per esercizio` });
      return;
    }
    const newImages = await uploadFiles(id, files, req.user?.username ?? req.user?.email);
    const submittedFields: Record<string, unknown> = {
      ...rest,
      images: [...keptImages, ...newImages],
    };

    // TO_APPROVE o senza stato: aggiornamento diretto
    if (!currentState || currentState === TO_APPROVE) {
      logger.info(`[PUT /:id] aggiornamento diretto (TO_APPROVE / no state)`);
      const updated = await Exercise.findByIdAndUpdate(
        id,
        { $set: { ...submittedFields, userUpdate: req.user?.username ?? req.user?.email } },
        { returnDocument: "after" }
      );
      res.json(updated);
      return;
    }

    // APPROVED / PENDING_UPDATE: gestione con change doc e transazione
    const diff = computeDiff(exerciseData, submittedFields);
    logger.info(`[PUT /:id] diff keys=${Object.keys(diff).join(", ") || "(nessuno)"}`);

    const session = await mongoose.startSession();
    logger.info(`[PUT /:id] sessione aperta, avvio transazione`);
    try {
      session.startTransaction();

      if (currentState === APPROVED) {
        if (Object.keys(diff).length === 0) {
          logger.info(`[PUT /:id] nessuna modifica effettiva, niente da fare`);
          await session.commitTransaction();
          res.json(exercise);
          return;
        }
        logger.info(`[PUT /:id] APPROVED → creo change doc + PENDING_UPDATE`);
        await ExerciseChange.create(
          [{ exerciseId: id as string, fields: diff, user: req.user?.username ?? req.user?.email, userUpdate: req.user?.username ?? req.user?.email, state: CHANGE_PENDING }],
          { session }
        );
        await Exercise.findByIdAndUpdate(
          id,
          { $set: { state: PENDING_UPDATE, userUpdate: req.user?.username ?? req.user?.email } },
          { session }
        );
      } else {
        // PENDING_UPDATE
        const currentUser = req.user?.username ?? req.user?.email;

        if (Object.keys(diff).length === 0) {
          logger.info(`[PUT /:id] PENDING_UPDATE → diff vuoto, ripristino APPROVED`);
          // Qualcuno ha riportato l'esercizio ai valori originali: l'intera
          // catena aperta viene cancellata, non conservata. Che sia lo stesso
          // proponente a ripensarci o un altro utente a ritenere sbagliata la
          // proposta, il risultato è che nessuna modifica va all'admin — non
          // deve quindi entrare nei conteggi.
          // Filtro sugli stati aperti (non solo exerciseId): le change già
          // risolte in passato sullo stesso esercizio sono storico e non vanno
          // toccate.
          await ExerciseChange.deleteMany(
            { exerciseId: id, state: { $in: OPEN_CHAIN_STATES } },
            { session }
          );
          await Exercise.findByIdAndUpdate(
            id,
            { $set: { state: APPROVED, userUpdate: currentUser }, $unset: { lastNotifiedAt: "" } },
            { session }
          );
        } else {
          const pending = await ExerciseChange.findOne({ exerciseId: id, state: CHANGE_PENDING }).session(session);

          if (pending && pending.user !== currentUser) {
            // Un utente diverso dal proponente sta modificando la proposta
            // altrui. Non si sovrascrive `user` sul documento esistente (il
            // contributo di chi l'ha aperta resta suo): quella change diventa
            // SUPERSEDED e ne nasce una nuova a nome di chi sta scrivendo ora.
            // Il diff è comunque calcolato sull'esercizio APPROVATO, quindi la
            // nuova change contiene già anche le modifiche del proponente
            // precedente — resta una sola proposta attiva.
            logger.info(`[PUT /:id] PENDING_UPDATE → change di ${pending.user} scavalcata da ${currentUser}`);

            // _id generato in anticipo perché l'ordine è vincolato: l'indice
            // unique parziale ammette una sola change PENDING per esercizio,
            // quindi la vecchia va marcata SUPERSEDED PRIMA di creare la nuova
            // — e per valorizzare supersededBy serve già conoscerne l'id.
            const nextId = new mongoose.Types.ObjectId();
            await ExerciseChange.updateOne(
              { _id: pending._id },
              { $set: { state: CHANGE_SUPERSEDED, supersededBy: nextId } },
              { session }
            );
            await ExerciseChange.create(
              [{
                _id: nextId,
                exerciseId: id as string,
                fields: diff,
                user: currentUser,
                userUpdate: currentUser,
                state: CHANGE_PENDING,
              }],
              { session }
            );
          } else {
            // Stesso utente che raffina la propria proposta: un solo documento,
            // conteggiato una volta sola.
            logger.info(`[PUT /:id] PENDING_UPDATE → aggiorno change doc`);
            await ExerciseChange.findOneAndUpdate(
              { exerciseId: id, state: CHANGE_PENDING },
              {
                $set: { fields: diff, userUpdate: currentUser },
                // Difensivo: se la change non esistesse (esercizio in
                // PENDING_UPDATE senza proposta attiva), l'upsert la creerebbe
                // senza `user` e il contributo risulterebbe non attribuito.
                $setOnInsert: { user: currentUser },
              },
              { session, upsert: true, returnDocument: "after" }
            );
          }

          await Exercise.findByIdAndUpdate(
            id,
            { $set: { userUpdate: currentUser } },
            { session }
          );
        }
      }

      await session.commitTransaction();
      logger.info(`[PUT /:id] transazione completata con successo`);
      res.json(exercise);
    } catch (txErr) {
      logger.error(`[PUT /:id] errore nella transazione:`, txErr);
      await session.abortTransaction();
      throw txErr;
    } finally {
      await session.endSession();
    }
  } catch (err) {
    logger.error(`[PUT /:id] errore:`, err);
    if (err instanceof ImageValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ error: DUPLICATE_MESSAGE });
      return;
    }
    res.status(500).json({ error: "Errore nell'aggiornamento dell'esercizio" });
  }
});

// POST /:id/approve — approva un nuovo esercizio (TO_APPROVE → APPROVED, solo admin)
// Body opzionale: campi dell'esercizio modificati dall'admin prima di approvare.
router.post("/:id/approve", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findById(id);
    if (!exercise) {
      logger.warn(`[POST /exercises/:id/approve] esercizio non trovato in DB: id=${id}`);
      res.status(404).json({ error: "Esercizio non trovato" });
      return;
    }
    if (exercise.state !== TO_APPROVE) {
      logger.warn(`[POST /exercises/:id/approve] stato non valido: state=${exercise.state}, id=${id}`);
      res.status(409).json({ error: `Impossibile approvare: stato corrente è "${exercise.state}"` });
      return;
    }

    // Estrai dal body solo i campi di contenuto noti, ignorando metadati
    const fieldsToApply: Record<string, unknown> = {};
    for (const field of CONTENT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        fieldsToApply[field] = req.body[field];
      }
    }

    await Exercise.findByIdAndUpdate(id, {
      $set: { ...fieldsToApply, state: APPROVED, userUpdate: req.user?.username ?? req.user?.email },
      $unset: { lastNotifiedAt: "" },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error("[POST /exercises/:id/approve]", err);
    if (isDuplicateKeyError(err)) {
      res.status(409).json({ error: `Impossibile approvare: ${DUPLICATE_MESSAGE.toLowerCase()}` });
      return;
    }
    res.status(500).json({ error: "Errore nell'approvazione dell'esercizio" });
  }
});

// POST /:id/reject — rifiuta un nuovo esercizio (TO_APPROVE → REJECTED, solo admin)
router.post("/:id/reject", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const exercise = await Exercise.findById(id);
    if (!exercise || exercise.state !== TO_APPROVE) {
      res.status(404).json({ error: "Esercizio non trovato o non in attesa di approvazione" });
      return;
    }
    await Exercise.findByIdAndUpdate(id, {
      $set: { state: REJECTED, userUpdate: req.user?.username ?? req.user?.email },
      $unset: { lastNotifiedAt: "" },
    });
    res.json({ success: true });
  } catch (err) {
    logger.error("[POST /exercises/:id/reject]", err);
    res.status(500).json({ error: "Errore nel rifiuto dell'esercizio" });
  }
});

// POST /:id/approve-change — applica i campi selezionati sull'esercizio, lo riporta ad APPROVED (solo admin)
// Body: { fieldsToApply?: Record<string, unknown> }
// Se fieldsToApply è assente applica tutto il change doc (compatibilità backward).
router.post("/:id/approve-change", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fieldsToApply } = req.body as { fieldsToApply?: Record<string, unknown> };
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const change = await ExerciseChange.findOne({ exerciseId: id, state: CHANGE_PENDING }).session(session);
    if (!change) {
      await session.abortTransaction();
      res.status(404).json({ error: "Nessuna modifica in attesa per questo esercizio" });
      return;
    }

    // Usa i campi inviati dal client; fallback all'intero change doc per compatibilità
    const toApply = fieldsToApply ?? (change.fields as Record<string, unknown>);

    // Verifica che la selezione dell'admin non produca un array di immagini oltre il limite.
    // Può accadere se l'admin approva nuove aggiunte ma non approva la rimozione di quelle
    // già esistenti: il totale supererebbe MAX_IMAGES anche se la proposta dell'utente era valida.
    if (Array.isArray(toApply.images) && toApply.images.length > MAX_IMAGES) {
      await session.abortTransaction();
      const count = toApply.images.length;
      res.status(400).json({
        error: `La selezione produce ${count} immagini, il massimo consentito è ${MAX_IMAGES}. Approva almeno ${count - MAX_IMAGES} rimozione/i oppure deseleziona alcune immagini aggiunte.`,
      });
      return;
    }

    await Exercise.findByIdAndUpdate(
      id,
      { $set: { ...toApply, state: APPROVED, userUpdate: req.user?.username ?? req.user?.email }, $unset: { lastNotifiedAt: "" } },
      { session }
    );
    // Risolta: si tiene come storico invece di cancellarla. Lo stato finale va
    // sull'INTERA catena aperta (la PENDING più le SUPERSEDED), così ogni
    // utente che ha contribuito alla proposta approvata viene conteggiato.
    await ExerciseChange.updateMany(
      { exerciseId: id, state: { $in: OPEN_CHAIN_STATES } },
      { $set: { state: CHANGE_APPROVED } },
      { session }
    );

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    logger.error("[POST /exercises/:id/approve-change]", err);
    await session.abortTransaction();
    if (isDuplicateKeyError(err)) {
      res.status(409).json({
        error: `Impossibile approvare la modifica: ${DUPLICATE_MESSAGE.toLowerCase()}.`,
      });
      return;
    }
    res.status(500).json({ error: "Errore nell'approvazione della modifica" });
  } finally {
    await session.endSession();
  }
});

// POST /:id/reject-change — elimina il change doc, riporta l'esercizio ad APPROVED (solo admin)
router.post("/:id/reject-change", requireAdmin, requireDbReady, async (req: Request, res: Response) => {
  const { id } = req.params;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Rifiuto dell'intera catena aperta: se la proposta finale è respinta lo
    // sono anche i contributi su cui era costruita, che quindi escono dai
    // conteggi (l'audit ignora le change REJECTED).
    await ExerciseChange.updateMany(
      { exerciseId: id, state: { $in: OPEN_CHAIN_STATES } },
      { $set: { state: CHANGE_REJECTED } },
      { session }
    );
    await Exercise.findByIdAndUpdate(
      id,
      { $set: { state: APPROVED, userUpdate: req.user?.username ?? req.user?.email }, $unset: { lastNotifiedAt: "" } },
      { session }
    );

    await session.commitTransaction();
    res.json({ success: true });
  } catch (err) {
    logger.error("[POST /exercises/:id/reject-change]", err);
    await session.abortTransaction();
    res.status(500).json({ error: "Errore nel rifiuto della modifica" });
  } finally {
    await session.endSession();
  }
});

export default router;
