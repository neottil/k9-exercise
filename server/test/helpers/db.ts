// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { randomUUID } from "crypto";
import mongoose from "mongoose";
import { inject } from "vitest";

/**
 * Connette mongoose (connessione di default, quella usata dai model) a un
 * database dedicato sul container Mongo condiviso (vedi test/globalSetup.ts).
 * Un database per file di test: isola gli indici unique e i dati tra file
 * diversi anche se girano in parallelo, senza pagare il costo di un
 * container per file.
 *
 * directConnection=true: il container esegue `rs.initiate()` senza indicare
 * un host esplicito, quindi il replica set si registra con l'hostname
 * interno del container (es. il suo ID, tipo "1161d0059d48") — irraggiungibile
 * da fuori Docker. Senza questo flag il driver Mongo, dopo la connessione
 * iniziale, fa discovery della topologia e prova a seguire quell'hostname,
 * fallendo con "getaddrinfo EAI_AGAIN <id container>". directConnection
 * disabilita la discovery e parla solo con l'host:porta esposti da
 * Testcontainers — le transazioni funzionano comunque, il nodo resta un
 * membro di un replica set a tutti gli effetti.
 * Va nell'URI restituita (non solo passata a mongoose.connect qui sotto):
 * la stessa URI viene riusata per la connessione separata di connect-mongo
 * (store delle sessioni in app.ts), che avrebbe lo stesso problema.
 */
export const connectTestDb = async (): Promise<string> => {
  const baseUri = inject("mongoUri");
  const dbName = `test_${randomUUID().replace(/-/g, "")}`;
  const uri = `${baseUri}/${dbName}?directConnection=true`;
  await mongoose.connect(uri);
  return uri;
};

export const disconnectTestDb = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

// connect-mongo (lo store delle sessioni in app.ts) scrive qui. Esclusa da
// clearCollections: i test che fanno login una sola volta in beforeAll e
// riusano l'agent su più `it()` si aspettano che la sessione sopravviva tra
// un test e l'altro.
const SESSIONS_COLLECTION = "sessions";

/** Svuota le collection applicative tra un test e l'altro, senza ricreare gli indici. */
export const clearCollections = async (): Promise<void> => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.entries(collections)
      .filter(([name]) => name !== SESSIONS_COLLECTION)
      .map(([, c]) => c.deleteMany({}))
  );
};
