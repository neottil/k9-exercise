import { Router, Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import Exercise from "../models/Exercise.js";

const router = Router();

const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  const key = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
  if (!key || key !== process.env.NOTIFY_API_KEY) {
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
      res.status(400).json({ error: "NOTIFY_RECIPIENTS non configurato" });
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date();

    // Documenti da notificare: in attesa E non ancora notificati oggi
    const newFilter = {
      $or: [{ lastNotifiedAt: null }, { lastNotifiedAt: { $lt: startOfToday } }],
    };

    const [usersResult, newExercisesResult, updatedExercisesResult] = await Promise.all([
      User.updateMany({ state: "TO_APPROVE", ...newFilter }, { $set: { lastNotifiedAt: now } }),
      Exercise.updateMany({ state: "TO_APPROVE", ...newFilter }, { $set: { lastNotifiedAt: now } }),
      Exercise.updateMany({ state: "PENDING_UPDATE", ...newFilter }, { $set: { lastNotifiedAt: now } }),
    ]);

    const pendingUsers = usersResult.modifiedCount;
    const pendingExercises = newExercisesResult.modifiedCount;
    const pendingUpdates = updatedExercisesResult.modifiedCount;
    const total = pendingUsers + pendingExercises + pendingUpdates;

    if (total === 0) {
      res.json({ users: 0, exercises_new: 0, exercises_update: 0, sent: false });
      return;
    }

    const lines: string[] = [];
    if (pendingUsers > 0)
      lines.push(`${pendingUsers} utent${pendingUsers === 1 ? "e" : "i"} in attesa di approvazione`);
    if (pendingExercises > 0)
      lines.push(`${pendingExercises} esercizi nuovi in attesa di approvazione`);
    if (pendingUpdates > 0)
      lines.push(`${pendingUpdates} modifiche a esercizi in attesa di approvazione`);

    const appUrl = process.env.APP_URL ?? "";
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

    console.log(`[notify] Email inviata a ${recipients.join(", ")} — ${total} elementi in attesa`);
    res.json({ users: pendingUsers, exercises_new: pendingExercises, exercises_update: pendingUpdates, sent: true });
  } catch (err) {
    console.error("[POST /api/admin/notify]", err);
    res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
