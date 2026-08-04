// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Router, Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import Exercise from "../models/Exercise.js";
import { logger } from "../utils/logger.js";

const router = Router();

const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  const key = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!key || key !== process.env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

router.post("/", requireApiKey, async (_req: Request, res: Response): Promise<void> => {
  try {
    const recipients = (process.env.NOTIFY_RECIPIENTS ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      logger.error("[notify] NOTIFY_RECIPIENTS non configurato");
      res.status(400).json({ error: "NOTIFY_RECIPIENTS non configurato" });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    // Documenti da notificare: in attesa E non ancora notificati oggi.
    const newFilter = {
      $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lt: startOfToday } }],
    };

    // find (non updateMany): bisogna sapere COSA notificare prima di provare
    // a inviare la mail, e marcare lastNotifiedAt solo DOPO un invio
    // riuscito (vedi sotto). Con updateMany-prima-di-inviare (comportamento
    // precedente), un errore SMTP marcava comunque i documenti come "già
    // notificati oggi" — la mail non partiva mai, ma la run successiva non
    // li trovava più: la notifica andava persa in silenzio fino al giorno
    // dopo (o per sempre, se l'errore SMTP persisteva).
    const [pendingNewExercises, pendingUpdatedExercises] = await Promise.all([
      Exercise.find({ state: "TO_APPROVE", ...newFilter }, "_id"),
      Exercise.find({ state: "PENDING_UPDATE", ...newFilter }, "_id"),
    ]);

    const newExercisesCount    = pendingNewExercises.length;
    const updatedExercisesCount = pendingUpdatedExercises.length;
    const total = newExercisesCount + updatedExercisesCount;

    logger.log(
      `[notify] Trovati ${total} elementi da notificare` +
      ` (esercizi nuovi=${newExercisesCount}, modifiche=${updatedExercisesCount})`
    );

    if (total === 0) {
      res.json({ exercises_new: 0, exercises_update: 0, sent: false });
      return;
    }

    const lines: string[] = [];
    if (newExercisesCount > 0)
      lines.push(`${newExercisesCount} esercizi nuovi in attesa di approvazione`);
    if (updatedExercisesCount > 0)
      lines.push(`${updatedExercisesCount} modifiche a esercizi in attesa di approvazione`);

    // DOMAIN è il solo hostname (es. "app.k9crosstraining.it" oppure
    // "localhost:5173" in locale): lo schema si decide qui, non in CI, con lo
    // stesso criterio già usato per il flag "secure" del cookie di sessione
    // (app.ts) — https in staging/produzione (Traefik termina TLS), http in
    // locale dove non c'è TLS.
    const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
    const appUrl = process.env.DOMAIN ? `${scheme}://${process.env.DOMAIN}` : "";
    const listHtml = lines.map((l) => `<li>${l}</li>`).join("");
    const listText = lines.map((l) => `  • ${l}`).join("\n");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"k9-exercise-app" <${process.env.SMTP_USER}>`,
      to: recipients.join(", "),
      subject: `[K9-exercise] ${total} element${total === 1 ? "o" : "i"} in attesa di approvazione`,
      text: [
        "Ciao,",
        "",
        "Sono presenti i seguenti elementi in attesa di approvazione:",
        listText,
        "",
        `Accedi al pannello admin: ${appUrl}/admin`,
        "",
        "K9 Cross Training",
      ].join("\n"),
      html: [
        "<p>Ciao,</p>",
        "<p>Sono presenti i seguenti elementi in attesa di approvazione:</p>",
        `<ul>${listHtml}</ul>`,
        `<p>Accedi al <a href="${appUrl}/admin">pannello admin</a> per gestirli.</p>`,
        "<p>K9 Cross Training</p>",
      ].join(""),
    });

    logger.log(`[notify] Email inviata a ${recipients.join(", ")} — ${total} elementi in attesa`);

    // Marcati come notificati solo ora che l'invio è confermato riuscito.
    const ids = <T extends { _id: unknown }>(docs: T[]): T["_id"][] => docs.map((d) => d._id);
    await Promise.all([
      newExercisesCount > 0
        ? Exercise.updateMany({ _id: { $in: ids(pendingNewExercises) } }, { $set: { lastNotifiedAt: now } })
        : null,
      updatedExercisesCount > 0
        ? Exercise.updateMany({ _id: { $in: ids(pendingUpdatedExercises) } }, { $set: { lastNotifiedAt: now } })
        : null,
    ]);

    res.json({ exercises_new: newExercisesCount, exercises_update: updatedExercisesCount, sent: true });
  } catch (err) {
    logger.error("[POST /api/admin/notify]", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
