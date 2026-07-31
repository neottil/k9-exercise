// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

// Versioni dei tre scope deployati, lette staticamente da nginx invece che da
// un endpoint del server: la pagina Info non deve dipendere dal backend, che
// con KEDA può essere scalato a zero e farebbe pagare un cold start.
//
// La sorgente è la ConfigMap k9-versions montata come volume nel pod del
// client (vedi client/k8s/deployment.yaml). È la stessa ConfigMap che i
// workflow di deploy già patchano, ciascuno con la propria chiave: nessun
// valore viene duplicato e, essendo montata come directory, kubelet propaga
// gli aggiornamenti ai pod senza bisogno di un redeploy del client.

export interface Versions {
  client: string | null;
  server: string | null;
  infra: string | null;
}

const VERSIONS_PATH = "/versions";

// In sviluppo il path non esiste e il dev server risponde con index.html (200):
// senza questo controllo mostreremmo l'HTML come se fosse una versione.
const isPlausibleVersion = (value: string): boolean =>
  value.length > 0 && value.length < 64 && /^[A-Za-z0-9._-]+$/.test(value);

const readVersion = async (key: string): Promise<string | null> => {
  try {
    const res = await fetch(`${VERSIONS_PATH}/${key}`, { cache: "no-store" });
    if (!res.ok) return null;
    const value = (await res.text()).trim();
    return isPlausibleVersion(value) ? value : null;
  } catch {
    return null;
  }
};

export const fetchVersions = async (): Promise<Versions> => {
  const [client, server, infra] = await Promise.all([
    readVersion("CLIENT_VERSION"),
    readVersion("SERVER_VERSION"),
    readVersion("INFRA_VERSION"),
  ]);
  return { client, server, infra };
};
