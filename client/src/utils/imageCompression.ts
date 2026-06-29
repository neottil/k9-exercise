// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Compressione immagini lato client prima dell'upload: ridimensiona al lato
// lungo massimo e ri-codifica in WebP. Riduce banda e peso a DB/minIO. Il
// server applica comunque i limiti di sicurezza (mime/size/conteggio).

const MAX_EDGE = 1600; // lato lungo massimo in px
const WEBP_QUALITY = 0.82;

/**
 * Comprime un'immagine: ridimensiona se eccede MAX_EDGE e converte in WebP.
 * In caso di errore (formato non leggibile dal browser) restituisce il file
 * originale, lasciando al server la validazione.
 */
export const compressImage = async (file: File): Promise<File> => {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.webp`, { type: "image/webp" });
  } catch (err) {
    console.warn("Compressione immagine fallita, uso l'originale", err);
    return file;
  }
};
