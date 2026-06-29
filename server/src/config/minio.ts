// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { Client } from "minio";
import type { Readable } from "stream";

// Configurazione da variabili d'ambiente. In locale puntano al minIO del
// docker-compose; in produzione al Service ClusterIP del pod minIO su k3s
// (es. MINIO_ENDPOINT=minio.k9.svc.cluster.local).
//
// IMPORTANTE: client e bucket sono risolti in modo LAZY (al primo uso), non a
// livello di modulo. Gli import ES vengono valutati prima del corpo di index.ts,
// quindi prima di dotenv.config(): leggere process.env qui in cima darebbe
// credenziali vuote ("Valid and authorized credentials required").

const bucketName = (): string => process.env.MINIO_BUCKET ?? "exercises";

let client: Client | null = null;
const getClient = (): Client => {
  if (!client) {
    client = new Client({
      endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
      port: Number(process.env.MINIO_PORT ?? 9000),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY ?? "",
      secretKey: process.env.MINIO_SECRET_KEY ?? "",
    });
  }
  return client;
};

/** Oggetto minIO con i soli campi che servono al garbage collector. */
export interface StoredObject {
  name: string;
  lastModified: Date;
}

/**
 * Crea il bucket se non esiste. Idempotente: va chiamata all'avvio del server.
 * Non blocca l'avvio in caso di errore (es. minIO non ancora pronto): logga e
 * lascia che i singoli upload falliscano con un errore esplicito.
 */
export const ensureBucket = async (): Promise<void> => {
  const bucket = bucketName();
  try {
    const exists = await getClient().bucketExists(bucket);
    if (!exists) {
      await getClient().makeBucket(bucket);
      console.log(`[minio] bucket "${bucket}" creato`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[minio] impossibile verificare/creare il bucket "${bucket}": ${msg}`);
  }
};

/** Carica un'immagine. La key deve essere globalmente unica (contiene un UUID). */
export const uploadImage = async (
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<void> => {
  await getClient().putObject(bucketName(), key, buffer, buffer.length, {
    "Content-Type": mimeType,
  });
};

/** Restituisce lo stream di lettura di un oggetto (per il proxy verso il client). */
export const getImageStream = (key: string): Promise<Readable> =>
  getClient().getObject(bucketName(), key);

/** Rimuove un oggetto. Usato dal garbage collector. */
export const removeImage = (key: string): Promise<void> =>
  getClient().removeObject(bucketName(), key);

/**
 * Elenca tutti gli oggetti del bucket. minIO espone uno stream (EventEmitter);
 * qui lo si raccoglie in un array — accettabile alla scala attuale (≪ 100k
 * oggetti). Oltre quella soglia andrà paginato.
 */
export const listAllObjects = (): Promise<StoredObject[]> =>
  new Promise((resolve, reject) => {
    const objects: StoredObject[] = [];
    const stream = getClient().listObjectsV2(bucketName(), "", true);
    stream.on("data", (obj) => {
      if (obj.name && obj.lastModified) {
        objects.push({ name: obj.name, lastModified: obj.lastModified });
      }
    });
    stream.on("end", () => resolve(objects));
    stream.on("error", reject);
  });
