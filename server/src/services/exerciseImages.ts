// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import { uploadImage } from "../config/minio.js";

// Limite immagini per esercizio. Imposto anche lato client (il form non
// permette di superarlo); qui è la validazione hard di sicurezza.
export const MAX_IMAGES = 3;

// Tipi accettati. Il client comprime in WebP, ma accettiamo anche i formati
// raster comuni per robustezza.
const ALLOWED_MIME = new Set(["image/webp", "image/jpeg", "image/png"]);

// Dimensione massima per file (dopo la compressione client). Guard contro
// upload abnormi: il client invia WebP molto più leggeri.
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/** Metadati immagine come salvati nel documento Exercise. */
export interface ImageMeta {
  id: string;
  key: string;
  filename?: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy?: string;
}

/** File così come fornito da multer (memory storage). */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class ImageValidationError extends Error {}

/** Valida i file in ingresso senza caricarli. Lancia ImageValidationError. */
export const validateFiles = (files: UploadedFile[]): void => {
  for (const file of files) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new ImageValidationError(
        `Formato non supportato: ${file.mimetype}. Ammessi: WebP, JPEG, PNG.`
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ImageValidationError(
        `Immagine troppo grande (max ${MAX_FILE_SIZE / (1024 * 1024)} MB).`
      );
    }
  }
};

/**
 * Carica i file su minIO e restituisce i metadati da salvare a DB.
 * Ogni immagine riceve un UUID e una key del tipo `{exerciseId}/{uuid}.{ext}`
 * relativa al bucket "exercises".
 */
export const uploadFiles = async (
  exerciseId: string,
  files: UploadedFile[],
  username?: string
): Promise<ImageMeta[]> => {
  const result: ImageMeta[] = [];
  for (const file of files) {
    const id = randomUUID();
    const ext = EXT_BY_MIME[file.mimetype] ?? "bin";
    // La key è relativa al bucket "exercises": una cartella per esercizio.
    const key = `${exerciseId}/${id}.${ext}`;
    await uploadImage(key, file.buffer, file.mimetype);
    result.push({
      id,
      key,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: username,
    });
  }
  return result;
};
