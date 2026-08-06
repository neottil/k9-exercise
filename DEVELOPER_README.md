# K9 Exercise — Developer Guide

Guida tecnica per chi lavora sul codice o deve rimettere in piedi l'infrastruttura.
Per la descrizione del progetto e il setup produzione completo vedere [README.md](README.md).

---

## Indice

1. [Setup locale](#setup-locale)
2. [Struttura progetto](#struttura-progetto)
3. [Indici del database](#indici-del-database)
4. [Test](#test)
5. [Conventional commits e versioning automatico](#conventional-commits-e-versioning-automatico)
6. [CI/CD pipeline](#cicd-pipeline)
7. [Infrastruttura in produzione](#infrastruttura-in-produzione)
8. [Sistema di notifiche](#sistema-di-notifiche)
9. [Storico modifiche e audit](#storico-modifiche-e-audit)
10. [Gestione immagini esercizi (minIO)](#gestione-immagini-esercizi-minio)
11. [Comandi pulizia registry git](#Comandi-pulizia-registry-git)
12. [Integrazione con WordPress](#integrazione-con-wordpress)

---

## Setup locale

**Prerequisiti**: Node.js 24+, Docker

```bash
# 1. Copia le variabili d'ambiente
cp .env.example .env
# Modifica MONGODB_URI, SESSION_SECRET ecc. nel file .env

# 2. Avvia MongoDB (replica set) e minIO locali
docker compose -f local/docker-compose.yml up -d
# minIO: API http://localhost:9000 · console http://localhost:9001 (minioadmin/minioadmin)

# 3. Server (porta 3001)
cd server && npm install && npm run dev

# 4. Client (porta 5173) — in un altro terminale
cd client && npm install && npm run dev
```

### Testare il login

Il login è sempre e solo tramite token JWT emesso da un sito esterno (WordPress). Per simularlo localmente senza un sito WP reale:

**1. Configurare il `.env`:**

```env
K9_JWT_SECRET=dev-jwt-secret-change-in-prod
```

**2. Avviare server e client** come sopra (il client mostra la pagina "accedi da WordPress").

**3. Generare un token di test** modificando le variabili in cima allo script secondo lo scenario da simulare:

```bash
# scripts/generate-wp-token.mjs — configurare in cima al file:
# EMAIL = "test@esempio.com"
# ROLE  = "viewer"   oppure   "admin"

node scripts/generate-wp-token.mjs
```

Lo script stampa l'URL completo da aprire nel browser:

```
http://localhost:3001/api/auth/wp-callback?token=eyJhbGci...
```

Aprendo quell'URL con server e client in esecuzione, la sessione viene creata e l'app fa redirect a `/` come farebbe con un redirect reale da WordPress.

---

## Struttura progetto

```
k9-exercise/
├── client/             # React + Vite (SPA)
│   ├── src/
│   │   ├── components/ # Componenti UI (Admin, AppBar, ExerciseTable, Insert, View…)
│   │   ├── config/
│   │   │   ├── runtime.ts  # Config per-ambiente letta a runtime (non nel bundle)
│   │   │   └── versions.ts # Versioni deployate lette da /versions/ (ConfigMap k9-versions)
│   │   └── ...
│   └── k8s/            # Manifest k8s specifici del client (colocati col codice)
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml # Config per-ambiente servita su /config/config.json
│       └── ingress.yaml   # Path "/", porta l'annotation cert-manager (TLS)
├── server/             # Express + TypeScript
│   ├── src/
│   │   ├── models/     # Schema Mongoose (Exercise, ExerciseChange, User)
│   │   │               # Exercise ha il campo lastNotifiedAt (Date)
│   │   ├── routes/     # API REST: exercises (incl. /to-approve, /approve-new, /reject-new), auth, notify
│   │   └── middleware/ # requireAuth, requireDbReady
│   └── k8s/            # Manifest k8s specifici del server (colocati col codice)
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── hso.yaml       # HTTPScaledObject KEDA
│       └── ingress.yaml   # Path "/api", nessuna annotation cert-manager (vedi sotto)
├── k3s/                # Infrastruttura condivisa — applicata SOLO da infra.yml
│   ├── namespace.yaml
│   ├── traefik-config.yaml
│   ├── keda-interceptor-svc.yaml
│   ├── cert-manager/
│   │   └── clusterissuer.yaml
│   ├── minio/          # StatefulSet + Service (storage immagini esercizi)
│   ├── notify/         # CronJob notifiche (curlimages/curl)
│   └── images-gc/      # CronJob garbage collection immagini
├── bruno/              # Collezione Bruno per test API
│   ├── environments/   # development.bru, production.bru
│   └── notify/         # trigger notify.bru
├── scripts/
│   ├── cloud-init.sh   # Inizializzazione VPS (k3s, KEDA, dashboard) — manuale
│   └── docker-lock.sh  # Rigenera package-lock.json su linux/amd64
├── local/
│   └── docker-compose.yml  # MongoDB locale con replica set
└── .github/
    ├── README.md                 # Pattern architetturali dei workflow CI/CD
    └── workflows/
        ├── infra.yml              # Manuale: provisiona k3s/ per un ambiente
        ├── build-deploy.yml       # Push su main: build+deploy condizionale client/server
        ├── deploy-client.yml      # Riutilizzabile (workflow_call): deploy client
        ├── deploy-server.yml      # Riutilizzabile (workflow_call): deploy server
        ├── tag.yml                # Manuale: promozione a versione reale (SOLO versioning)
        ├── promote.yml            # Manuale: deploy in produzione (SOLO deploy, input espliciti)
        └── cleanup-build-tags.yml # Manuale/auto: pulizia tag di build superati
```

---

## Indici del database

Gli indici **non** si creano con uno script manuale: sono dichiarati negli schema Mongoose e vengono creati automaticamente alla connessione, grazie a `autoIndex` (attivo di default). Al primo avvio del server contro un database nuovo (o dopo aver aggiunto un indice), Mongoose esegue `createIndex` per ogni indice mancante; quelli già presenti vengono ignorati.

### Indici definiti

| Collection | Indice | Tipo | Dove | Serve a |
|---|---|---|---|---|
| `exercises` | `{ state: 1, lastNotifiedAt: 1 }` | composto | [Exercise.ts](server/src/models/Exercise.ts) | Query admin `GET /pending` e `GET /to-approve` (prefisso `state`) e le `updateMany` del job notify (`state` + range su `lastNotifiedAt`) |
| `exercises` | `{ type: 1, variant: 1 }` | `unique` parziale | [Exercise.ts](server/src/models/Exercise.ts) | Impedisce due esercizi con stessa tipologia + variante. `partialFilterExpression` su `state ∈ {TO_APPROVE, APPROVED, PENDING_UPDATE}`: i `REJECTED` sono esclusi e non bloccano la ri-creazione dello stesso combo |
| `exercisechanges` | `{ exerciseId: 1 }` | `unique` parziale | [ExerciseChange.ts](server/src/models/ExerciseChange.ts) | Tutte le lookup sul change doc (`findOne`/`findOneAndUpdate` per `exerciseId`). `partialFilterExpression` su `state: "PENDING"`: garantisce **una sola modifica in attesa** per esercizio, senza impedire che restino i documenti già risolti (storico, vedi sotto) |
| `k9_users` | `{ email: 1 }` | `unique` | [User.ts](server/src/models/User.ts) | Login per email (creato implicitamente da `unique: true`) |
| tutte | `{ _id: 1 }` | default | — | Creato automaticamente da MongoDB |

### Note di progettazione

- **Unicità tipologia + variante.** L'indice `unique` parziale `{ type, variant }` è la garanzia *hard* contro i duplicati: è il DB a rifiutare la scrittura, indipendentemente da bug applicativi o race condition. Tutti gli handler che scrivono `type`/`variant` (`POST /`, `PUT /:id`, `POST /:id/approve`, `POST /:id/approve-change`) intercettano l'errore di chiave duplicata (`E11000`) e restituiscono un **409** con messaggio specifico invece di un 500 generico.

  *Caso limite — modifica di variante in attesa di approvazione.* Una modifica di `variant` resta nel change doc (`exercisechanges`) finché non viene approvata, quindi l'indice **non la vede**: controlla solo i valori salvati sull'esercizio. Se nel frattempo viene inserito un altro esercizio con lo stesso `type`+`variant`, il conflitto **non** emerge all'inserimento ma al momento dell'`approve-change`, quando il diff viene applicato: l'update fallisce con `E11000` e l'admin riceve un 409 con messaggio dedicato ("…inserito nel frattempo"). Questo copre anche il caso di due modifiche pending che puntano allo stesso combo. Scelta progettuale: l'errore emerge all'approvazione, non si fanno controlli cross-collection all'inserimento.

  > **Requisito versione**: `partialFilterExpression` con `$in` richiede MongoDB recente (Atlas ≥ 6.0). Se la creazione dell'indice fallisce all'avvio (errore loggato), verificare la versione del cluster.

- **`GET /` (lista esercizi) non è indicizzata di proposito.** Filtra `state ∈ {APPROVED, PENDING_UPDATE}`, predicato poco selettivo (la maggior parte degli esercizi è `APPROVED`), e applica filtri opzionali su `workingArea.*`/`bodyTarget.*` con il pattern `$or: [{campo: null}, …]` che è di fatto non indicizzabile. Su un volume atteso di **400-1000 esercizi** il `COLLSCAN` è nell'ordine del sotto-millisecondo: indicizzarla non darebbe alcun beneficio. Se il dataset crescesse di un ordine di grandezza, andrebbe rivisto il pattern `$or-null` per renderla indicizzabile.

### Aggiungere o modificare un indice

1. Dichiararlo nello schema corrispondente in `server/src/models/` (`Schema.index({...})` oppure `unique: true` sul campo).
2. Riavviare il server: Mongoose crea il nuovo indice in automatico.

> **Indici `unique` su collection con dati esistenti**: se ci sono già documenti che violano il vincolo (es. `exerciseId` duplicati), la creazione dell'indice fallisce e l'errore viene loggato all'avvio. Bonificare i duplicati prima di introdurre un indice `unique`.

> **Produzione su dataset grandi**: `autoIndex` è comodo ma con collection molto grandi la creazione di un indice all'avvio può essere costosa. Alla scala attuale non è un problema; qualora lo diventasse, disabilitare `autoIndex` nella connessione e creare gli indici in una finestra di manutenzione.

---

## Test

Solo il server ha una suite di test (`server/test/`), runner [Vitest](https://vitest.dev/).

```bash
cd server
npm run test          # esegue la suite una volta (usato anche in CI)
npm run test:watch    # modalità watch, per lo sviluppo
npm run typecheck:test # type-check di src/ + test/ insieme (tsc -p tsconfig.test.json)
```

### Requisito: Docker

I test API (`server/test/api/`) avviano un vero container MongoDB via
[Testcontainers](https://node.testcontainers.org/) (`@testcontainers/mongodb`),
configurato come replica set a singolo nodo — necessario perché le route di
approvazione (`approve-change`, `reject-change`, `PUT /:id` su un esercizio
`APPROVED`) usano transazioni Mongo, che un `mongod` standalone non supporta.
**Serve Docker installato e in esecuzione.** Senza Docker, `npm run test`
fallisce all'avvio (il container non parte) — i test API non girano in un
ambiente senza Docker, inclusa questa entry se stai leggendo da una macchina
senza Docker Desktop. In compenso, funzionano identici sia in locale (una
volta installato Docker) sia in CI (GitHub Actions `ubuntu-latest` ha Docker
di default, nessun setup aggiuntivo richiesto).

I test unitari (`server/test/unit/`) non toccano il DB e girano sempre, anche
senza Docker.

### Struttura

```
server/test/
├── globalSetup.ts       # UN SOLO container Mongo per l'intera run (Vitest globalSetup)
├── helpers/
│   ├── db.ts             # connette mongoose a un DB dedicato per file di test, pulizia tra i test
│   ├── fixtures.ts        # createExercise()
│   └── authClient.ts      # loginAs(app, overrides) — vero login via GET /api/auth/wp-callback (JWT firmato con K9_JWT_SECRET)
├── unit/                  # requireAuth, requireDbReady, buildMongoFilter, computeDiff
└── api/                   # supertest contro createApp() — liste/filtri, create+409, approve/reject, PUT+transazioni, storico modifiche, audit, auth
```

Un solo container Mongo per l'intera suite (avviato una volta in
`globalSetup.ts`), ma ogni **file** di test si connette a un database Mongo
dedicato (nome random) sullo stesso container: isolamento tra file senza
pagare il costo di avviare un container per file. `createApp()` (in
`server/src/app.ts`) è la stessa factory usata da `index.ts` in produzione,
parametrizzata sul `mongoUri` — i test non duplicano la configurazione
dell'app, la riusano con un database diverso.

### CI

`build-deploy.yml` esegue `test-server` prima di `build-server`, solo se lo
scope server è cambiato in quella run (`has_server`). Un test fallito blocca
`build-server` (e quindi il deploy) — non degrada silenziosamente a
riutilizzare l'immagine precedente: vedi il commento su `resolve-server-image`
nel workflow per il motivo (senza quel controllo esplicito, "build-server
skipped per test fallito" sarebbe indistinguibile da "build-server skipped
perché nessun codice è cambiato").

---

## Versioning e tag Git

Client e server sono due **scope indipendenti**, ognuno con i propri manifest k8s
colocati nella propria cartella (`client/k8s/`, `server/k8s/`) e il proprio ciclo
di tag Git. Il versioning è disaccoppiato dal build: `build-deploy.yml` crea solo
tag **effimeri** di data. Assegnare la versione **reale** (semver) e farla girare
in produzione sono **due passaggi manuali separati** — `tag.yml` (assegna la
versione) e `promote.yml` (la deploya) — vedi sotto.

### Tag effimeri `<scope>-<branch>-<data>`

Ad ogni push su `main`, `feature/*` o `fix/*`, per ciascuno scope (`client`,
`server`) che ha subito modifiche, `build-deploy.yml` crea **sempre un tag
nuovo** `<scope>-<branch-slug>-<data>` (es. `client-main-20260703_2130`, o
`client-feature-40-anteprima-20260703_2130` per un push su
`feature/40-anteprima`) sul commit appena deployato con successo in staging —
mai uno spostato. Questo tag serve a due scopi:
- **baseline per il diff** della prossima run su quel branch (cosa è cambiato da
  allora sotto `<scope>/`)
- **riferimento** che `tag.yml` userà per sapere cosa promuovere

Stesso nome del tag Docker pushato su GHCR (`k9-client:main-20260703_2130`) — nessun
`run_id` o artifact da tenere sincronizzato, il nome del tag Git *è* il tag Docker.

- Se il codice dello scope è cambiato → build nuovo + tag Git nuovo.
- Se è cambiato **solo** `<scope>/k8s/` (manifest, non codice) → nessun rebuild
  (l'immagine resta quella già esistente), ma il tag Git è comunque **nuovo**: ogni
  deploy, anche solo-manifest, lascia una propria voce nello storico invece di
  sparire dentro il tag della run precedente. Il tag effimero è basato su
  data/ora quindi è comunque univoco, senza bisogno di bump di versione per
  questo — il bump serve solo più avanti, quando si vuole **promuovere** quel
  commit (vedi sotto).
- Se nessuno dei due → il job di deploy di quello scope non gira affatto, il
  Deployment k8s resta esattamente com'era.

Poiché ogni deploy crea un tag nuovo, i tag `<scope>-main-*` si accumulano nel
tempo: la pulizia è compito di `cleanup-build-tags.yml` (triggerato da `tag.yml`
dopo ogni promozione, o lanciabile a mano), che mantiene solo il più recente per
scope/branch.

### Assegnare la versione reale (`tag.yml`, manuale — SOLO versioning)

Quando si decide di rilasciare, si lancia manualmente il workflow **Tag**. Per
ciascuno scope: trova l'ultimo tag `<scope>-main-*`, e se il suo commit non è
già coperto da un tag `<scope>-vX.Y.Z`, legge la versione da
`<scope>/package.json` **a quel commit** (bump manuale del `package.json` prima
di lanciare Tag), crea il tag reale (mai spostato: se esiste già su un commit
diverso, il job si ferma con un errore — vedi la gotcha "insidie note" in
`.github/README.md`), e ri-tagga l'immagine Docker già esistente **senza
rebuild** (`docker buildx imagetools create`). Se uno scope è già stato
promosso in precedenza, viene saltato (nessuna modifica).

Una GitHub Release viene creata/aggiornata qui, sul tag reale — non ad ogni deploy
in staging. **Questo workflow non deploya nulla**: si ferma dopo aver taggato.

### Deploy in produzione (`promote.yml`, manuale — SOLO deploy)

Riceve `client_version`/`server_version` come **input espliciti** (uno solo,
entrambi, o rilanciato più volte con lo stesso valore per risincronizzare la
produzione dopo un deploy fallito). Verifica che il tag `<scope>-v<versione>`
esista davvero (fallisce subito con un errore chiaro altrimenti), poi deploya
tramite gli stessi workflow riutilizzabili usati da `build-deploy.yml`
(`deploy-client.yml`/`deploy-server.yml`, con `environment: production`).
**Questo workflow non tagga né crea Release**: si limita a far girare in
produzione la versione indicata.

Tag e Promote sono deliberatamente disaccoppiati nel tempo: puoi taggare `1.6.0`
oggi e promuoverla in produzione solo la settimana prossima, o ripetere
`promote.yml` più volte con la stessa versione senza dover ripassare da `tag.yml`.

### Pulizia (`cleanup-build-tags.yml`)

Elimina i tag `<scope>-<branch>-<data>` (Git + immagini Docker corrispondenti su
GHCR) superati, mantenendo sempre il più recente per (scope, branch) se
`preserve_latest=true` (default) — sicuro da lanciare anche su un branch ancora
attivo come `main`, dato che dopo la pulizia resta comunque un tag da cui
calcolare il prossimo diff. Triggerato automaticamente (fire-and-forget) a fine
di ogni `tag.yml` che promuove almeno uno scope. Non tocca mai i tag di versione
reale (`client-v*`/`server-v*`).

---

## CI/CD pipeline

Sette workflow con responsabilità separate (vedi anche la sezione precedente per la
logica di versioning, e [`.github/README.md`](.github/README.md) per i pattern
architetturali completi):

| Workflow | Trigger | Scopo |
|---|---|---|
| `infra.yml` | Manuale | Provisiona/aggiorna l'infrastruttura condivisa (`k3s/`) per un Environment, incluso Headlamp (opzionale, input `install_headlamp`). Da lanciare una tantum per ambiente, prima del primo deploy applicativo. |
| `build-deploy.yml` | Push su `main`, `feature/*`, `fix/*`, o manuale (input `force_all`) | Builda le immagini Docker cambiate e le deploya in **staging**, in modo condizionale e indipendente per scope (client/server). Con `force_all` ribuilda e rideploya tutto, ignorando il diff — utile es. dopo aver ricreato il namespace da zero. |
| `deploy-client.yml` / `deploy-server.yml` | Solo `workflow_call` (riutilizzabile) | Applicano i manifest `<scope>/k8s/*`, verificano il rollout, aggiornano `k9-versions`. Chiamati sia da `build-deploy.yml` (staging) sia da `promote.yml` (produzione) — nessuna logica di deploy duplicata. |
| `tag.yml` | Manuale | Assegna la versione reale allo stato deployato su `main`, senza rebuild: tag Git, ri-tag Docker, GitHub Release. **Non deploya.** |
| `promote.yml` | Manuale, input `client_version`/`server_version` | Deploya in **produzione** la versione indicata richiamando `deploy-client.yml`/`deploy-server.yml`. **Non tagga né rilascia.** |
| `cleanup-build-tags.yml` | Manuale, o automatico dopo `tag.yml` | Ripulisce i tag Git e le immagini Docker dei build superati. |

> **Staging è un solo ambiente condiviso, non uno per branch.** `feature/*`/`fix/*`
> deployano davvero su staging (deploy automatico intenzionale, per testare senza
> passare da `main`), ma è lo stesso Deployment/VPS usato da `main` e da qualunque
> altro branch feature/fix in corso: chi pusha per ultimo sovrascrive quello che
> c'era prima, a prescindere dal branch. Non c'è isolamento per branch
> sull'ambiente reale — solo i tag Git (`<scope>-<branch>-<data>`) restano separati
> per branch. `tag.yml`/`promote.yml` (produzione) continuano a considerare
> **solo** i tag `<scope>-main-*`: un push da un branch feature non tocca mai,
> nemmeno indirettamente, cosa può essere promosso in produzione.

> **Riepilogo per-step**: ogni step che decide/calcola qualcosa di rilevante
> (versioni, se serve un rebuild, quale immagine verrà deployata e perché, esito
> del rollout) scrive subito il proprio pezzo nel Job Summary della run, non solo
> il job `summary` finale — così anche se un job successivo fallisce, il Summary
> mostra comunque tutto ciò che era stato deciso fino a quel punto. Vedi pattern 8
> in [`.github/README.md`](.github/README.md).

```
push su main / feature/* / fix/*
    │
    ▼
versions            — per client e server: diff dall'ultimo tag <scope>-<branch>-*
    │                  (solo codice → rebuild; solo <scope>/k8s/ → deploy senza
    │                  rebuild; niente → il job di deploy non gira)
    ▼
build-client / build-server           ←─ condizionale, in parallelo
    │  docker/build-push-action → ghcr.io/<owner>/k9-{client,server}:<data>
    ▼
resolve-client-image / resolve-server-image
    │  determina quale tag deployare (quello appena buildato, o l'ultimo
    │  già deployato con successo se era solo un cambio manifest)
    ▼
deploy-client / deploy-server         ←─ chiama deploy-client.yml/deploy-server.yml
    │  (environment: staging) — render manifest, scp, ssh kubectl apply, rollout,
    │  patch ConfigMap k9-versions (ogni scope solo la propria chiave)
    ▼
register-client-tag / register-server-tag
    │  crea (sempre nuovo, mai spostato) il tag <scope>-main-<data>
    ▼
cleanup-registry     — tiene le 3 immagini più recenti per repository
    ▼
summary              — sempre (anche se step precedenti falliscono)
```

`tag.yml` (manuale, separato) legge `<scope>/package.json` al commit dell'ultimo tag
`<scope>-main-*`, assegna la versione reale, ri-tagga l'immagine Docker senza
rebuild e crea la GitHub Release. **Non deploya nulla.** `promote.yml` (manuale,
separato) riceve `client_version`/`server_version` come input, verifica che i tag
esistano, e deploya in produzione richiamando **gli stessi**
`deploy-client.yml`/`deploy-server.yml` usati in staging (con
`environment: production` e la versione come `image_tag`) — vedi sezione
[Versioning e tag Git](#versioning-e-tag-git) sopra per i dettagli.

**Aggiornamento versioni**: la versione promuovibile è quella nel `package.json`
dello scope. Modificalo manualmente quando decidi cosa deve finire nella
prossima release, poi lancia `tag.yml` — non serve farlo ad ogni commit, solo
prima di un rilascio. Il deploy in produzione (`promote.yml`) è un passo
separato, da eseguire quando decidi di far girare quella versione.

**Dove si vedono le versioni deployate**: nella pagina **Info** dell'app. Il client
non interroga il backend per ottenerle: la ConfigMap `k9-versions` è montata come
volume nel pod del client e nginx la serve su `/versions/<CHIAVE>`
(`CLIENT_VERSION`, `SERVER_VERSION`, `INFRA_VERSION`), letta da
`client/src/config/versions.ts`. Così la pagina resta consultabile anche quando
KEDA ha scalato il server a zero, e i valori si aggiornano da soli — kubelet
propaga le modifiche alla ConfigMap nel volume — anche quando a deployare è uno
scope diverso dal client. In sviluppo locale quei file non esistono e la pagina
mostra `N/A`.

### Aggiornamento dipendenze e package-lock.json

I Dockerfile usano `npm ci` che installa **esattamente** le versioni nel `package-lock.json`. Il problema è che un lockfile generato su Windows non include i pacchetti nativi linux/amd64 (es. `@emnapi/core`, varianti esbuild per Linux), causando un errore di build in CI.

**Ogni volta che aggiorni le dipendenze** (`npm install <pacchetto>`, `npm audit fix`, ecc.) devi rigenerare il lockfile su Linux prima di committare:

```bash
# Da eseguire in WSL nella directory root del progetto
npm run lock:docker
```

Lo script (`scripts/docker-lock.sh`) avvia un container `node:24-alpine` per ciascun package (`client/`, `server/`) e rigenera il relativo `package-lock.json` con i pacchetti corretti per linux/amd64 usando `npm install --package-lock-only`: aggiorna **solo il lockfile**, senza toccare `node_modules`, quindi il dev su Windows continua a funzionare normalmente. Al termine committa i lockfile aggiornati.

> **Prerequisito**: Docker deve essere disponibile nella sessione WSL (`docker --version` deve rispondere). Se si usa Docker Desktop su Windows con integrazione WSL2, è sufficiente che Docker Desktop sia avviato.

### Secrets e Variables richiesti

Configurare in **GitHub → Settings → Secrets and variables → Actions**.

#### Secrets

I secret sono configurati **per environment** (staging / production) in GitHub → Settings → Environments.

| Nome | Descrizione | Usato da |
|------|-------------|----------|
| `VPS_HOST` | IP del VPS | `infra`, `build-deploy`, `tag` |
| `VPS_SSH_KEY` | Chiave privata SSH (`~/.ssh/k9_deploy`) — non il `.pub` | `infra`, `build-deploy`, `tag` |
| `GHCR_PAT` | Personal Access Token GitHub con scope `read:packages` ¹ | `infra`, `build-deploy`, `tag` |
| `WORKFLOW_PAT` | Personal Access Token GitHub con scope `workflow` (repository secret, non per-environment) ⁵ | `tag` |
| `MONGODB_URI` | Stringa di connessione MongoDB Atlas | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `SESSION_SECRET` | Stringa random — `openssl rand -hex 32` | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `K9_JWT_SECRET` | Segreto condiviso con WordPress per firmare/verificare il JWT — `openssl rand -base64 32` ⁴ | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `API_KEY` | Token per autenticare il CronJob sulla route `/api/admin/notify` ² | `infra` |
| `SMTP_PASS` | Password SMTP / App Password Gmail ³ | `infra` |
| `MINIO_ROOT_PASSWORD` | Password root minIO — `openssl rand -hex 32` | `infra` |

> ¹ Serve al VPS per fare `imagePullSecrets` da GHCR. Crearlo in: profilo GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → `read:packages`.
>
> ² Generarlo con uno di questi comandi:
> ```bash
> # bash / macOS / Linux
> openssl rand -hex 32
> ```
> ```powershell
> # PowerShell / Windows
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
>
> ³ Gmail richiede un **App Password** (non la password dell'account). Abilitare prima la verifica in due passaggi, poi: Google Account → Sicurezza → Verifica in 2 passaggi → App password.
>
> ⁴ Deve coincidere esattamente con `K9_JWT_SECRET` definito in `wp-config.php`. Usare valori diversi per staging e production. Non riutilizzare lo stesso valore di `SESSION_SECRET`.
>
> ⁵ Necessario perché `tag.yml` tagga un commit "vecchio" (l'ultimo `<scope>-main-*` deployato, non la punta attuale di `main`): il `GITHUB_TOKEN` di default rifiuta il push di un tag se il contenuto di `.github/workflows/` in quel commit non è identico a quello dell'ultimo commit di un branch — condizione quasi certa una volta che i workflow evolvono nel tempo. Crearlo in: profilo GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic o fine-grained scoped a questo repo) → permesso "Workflows: Read and write" (`workflow` per i classic token). **Non riusare `GHCR_PAT`** per questo: quel token finisce in un Secret Kubernetes persistito sul cluster (per l'`imagePullSecret`), mentre `WORKFLOW_PAT` deve restare confinato ai secret di GitHub Actions — dargli anche scope `workflow` esporrebbe la possibilità di modificare i workflow CI/CD a chiunque legga quel Secret k8s.

#### Variables

| Nome | Valore esempio | Descrizione | Usato da |
|------|---------------|-------------|----------|
| `VPS_USER` | `deploy` | Utente SSH sul VPS (creato da cloud-init) | `infra`, `build-deploy`, `tag` |
| `DOMAIN` | `k9.tuodominio.com` | Dominio per ingress e KEDA HTTPScaledObject; letto anche a runtime dal server (env `DOMAIN` del Deployment) per il link nella mail di notifica — lo schema (`http`/`https`) è deciso dal server in base a `NODE_ENV`, non fa parte di questa variabile | `build-deploy`, `tag` (render di `client/k8s/ingress.yaml`, `server/k8s/{ingress,hso,deployment}.yaml`) |
| `LETSENCRYPT_EMAIL` | `tua@email.com` | Email per la registrazione ACME Let's Encrypt (riceve avvisi di scadenza) | `infra` (render di `k3s/cert-manager/clusterissuer.yaml`) |
| `ENABLE_WITH_OPERATION_FILTER` | `false` | Feature flag del filtro "con operatività", letto a runtime dal client ⁶ | `build-deploy` / `promote` (deploy-client) |
| `LOGIN_SITE_URL` | `https://www.k9crosstraining.com` | URL del sito esterno che genera il token di accesso (modalità `token`), letto a runtime dal client ⁶. Includere lo schema `https://` (se manca viene aggiunto automaticamente) | `build-deploy` / `promote` (deploy-client) |
| `SMTP_HOST` | `smtp.gmail.com` | Host SMTP per le notifiche email | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `SMTP_PORT` | `587` | Porta SMTP | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `SMTP_USER` | `tuagmail@gmail.com` | Indirizzo email mittente | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `NOTIFY_RECIPIENTS` | `a@esempio.com,b@esempio.com` | Destinatari notifiche, separati da virgola | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `LOG_LEVEL` | `debug` | Attiva l'access log per-richiesta (metodo/path/status/durata) quando vale `debug`; default `info` (silenzioso) se assente. Impostarla solo sull'environment `staging`, mai su `production` | `build-deploy` (deploy-server), `tag` (deploy-production-server) |
| `MINIO_ROOT_USER` | | Utente root minIO (storage immagini) | `infra` |

> ⁶ **Configurazione del client risolta a runtime, non compilata nel bundle.** L'immagine Docker del client viene costruita **una sola volta** (in staging) e poi promossa in produzione **ri-taggando la stessa immagine senza rebuild** (vedi `tag.yml`). Se queste variabili fossero passate come build-arg `VITE_*`, Vite le compilerebbe nel bundle e la produzione mostrerebbe per sempre i valori di staging. Vengono invece scritte nella ConfigMap `k9-client-config` (`client/k8s/configmap.yaml`) da `deploy-client.yml`, con le Variables dell'ambiente di destinazione; la ConfigMap è montata come file servito da nginx su `/config/config.json` e letta all'avvio da `client/src/config/runtime.ts`, prima del primo render. In sviluppo locale quel file non esiste e si ricade sulle `VITE_*` del `.env` alla root del monorepo.

---

## Infrastruttura in produzione

### Architettura

```
Browser
   │
   ▼
Traefik  (ingress controller incluso in k3s)
   │
   ├─ /api/*  ──▶  KEDA HTTP Interceptor
   │                      │  conta richieste in coda
   │                      │  scala automaticamente 1 → 4 pod
   │                      ▼
   │               k9-server pods (Express + Node.js)
   │                      │
   │                      ▼
   │               MongoDB Atlas
   │
   └─ /*     ──▶  k9-client pod (nginx — serve React SPA)
```

### Configurazione VPS (Hetzner Cloud)

#### 1. Generazione chiave SSH

La stessa coppia di chiavi serve per due cose:
- La chiave **pubblica** → Hetzner (per autenticarti sul VPS)
- La chiave **privata** → GitHub Secret `VPS_SSH_KEY` (per permettere alla Action di fare SSH sul VPS)

**Su Windows** (PowerShell o Git Bash):

```powershell
# Lascia la passphrase vuota: la Action non può inserirla
ssh-keygen -t ed25519 -C "k9-deploy" -f "$env:USERPROFILE\.ssh\k9_deploy"

Get-Content "$env:USERPROFILE\.ssh\k9_deploy.pub"  # → Hetzner
Get-Content "$env:USERPROFILE\.ssh\k9_deploy"       # → GitHub Secret VPS_SSH_KEY
```

**Su macOS / Linux:**

```bash
ssh-keygen -t ed25519 -C "k9-deploy" -f ~/.ssh/k9_deploy

cat ~/.ssh/k9_deploy.pub   # → Hetzner
cat ~/.ssh/k9_deploy        # → GitHub Secret VPS_SSH_KEY
```

| File | Contenuto | Dove va |
|------|-----------|---------|
| `k9_deploy.pub` | Chiave pubblica | Hetzner → Security → SSH Keys |
| `k9_deploy` | Chiave privata | GitHub → Secrets → `VPS_SSH_KEY` |

> **Importante**: la chiave privata non va mai condivisa né committata nel repository.
> Lascia la passphrase vuota durante la generazione: la GitHub Action non può
> inserire password interattive.

#### 2. Creazione VPS

1. Crea account su [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. Aggiungi la chiave pubblica: **Security → SSH Keys → Add SSH Key**
   → incolla il contenuto di `k9_deploy.pub`
3. Crea un server:
   - **Location**: Nuremberg o Helsinki
   - **Image**: Ubuntu 24.04
   - **Type**: `CAX11` — ARM, 2 vCPU, 4 GB RAM, €4.15/mese *(consigliato)*
     oppure `CX22` — x86, 2 vCPU, 4 GB RAM, €4.85/mese
4. Annota l'IP del server
5. Crea un **Firewall** con solo queste regole inbound:

   | Porta | Protocollo | Sorgente | Scopo |
   |-------|------------|----------|-------|
   | 22 | TCP | Il tuo IP | SSH |
   | 80 | TCP | Any | HTTP |
   | 443 | TCP | Any | HTTPS |

6. **MongoDB Atlas — IP Access List**: aggiungi l'IP del VPS alla whitelist altrimenti il server non si connette al database:
   - [cloud.mongodb.com](https://cloud.mongodb.com) → **Network Access → Add IP Address**
   - Inserisci l'IP del VPS Hetzner → **Confirm**

#### 3. Inizializzazione automatica con cloud-init

Hetzner permette di incollare uno script nel campo **"User data"** durante la creazione del server. Viene eseguito automaticamente al primo avvio.

Lo script si trova in [`scripts/cloud-init.sh`](scripts/cloud-init.sh). Copiane il contenuto e incollalo nel campo "User data" su Hetzner.

**Cosa fa lo script:**

| Step | Operazione |
|------|-----------|
| 1 | Aggiornamento sistema + installazione `curl`, `gettext-base`, CLI `helm` (system-wide, in `/usr/local/bin`) |
| 2 | Creazione utente `deploy` (SSH e kubectl senza root) |
| 3 | Installazione k3s (Kubernetes + Traefik + CoreDNS) |
| 4 | Installazione KEDA (controller autoscaling) |
| 5 | Installazione KEDA HTTP Add-on (scaling su richieste HTTP) |
| 6 | Installazione cert-manager |

Headlamp (UI Kubernetes) **non** è installato da questo script: è opzionale e
parametrizzato tramite l'input `install_headlamp` del workflow **Infra** (vedi
sezione [CI/CD pipeline](#cicd-pipeline)).

Al termine scrive `/opt/k9/.init-complete` come marker e log in `/var/log/k9-init.log`.

**Verifica dopo il primo avvio** (attendi 3-5 minuti):

```bash
ssh root@<IP_VPS>
cat /opt/k9/.init-complete   # deve esistere
kubectl get nodes             # STATUS: Ready
kubectl get pods -A           # tutti i pod Running
```

#### 4. Configurazione dominio

Aggiungi un record DNS sul tuo provider:

| Tipo | Nome | Valore |
|------|------|--------|
| `A` | `k9` (o il sottodominio preferito) | IP del VPS Hetzner |

Poi imposta la Variable `DOMAIN` su GitHub con il sottodominio completo (es. `k9.tuodominio.com`). Viene applicata da `deploy-client.yml`/`deploy-server.yml` (richiamati sia da `build-deploy.yml` in staging sia da `promote.yml` in produzione) tramite `envsubst` in `client/k8s/ingress.yaml` e `server/k8s/{ingress,hso}.yaml`.

#### 5. HTTPS con cert-manager

cert-manager è già incluso in `cloud-init.sh` — viene installato automaticamente su nuovi VPS.

**Su un VPS già esistente** (senza cloud-init), installalo manualmente:

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.0/cert-manager.yaml
kubectl wait --for=condition=available deployment --all -n cert-manager --timeout=300s
```

Poi configura le GitHub Variables richieste:

| Variable | Valore |
|----------|--------|
| `LETSENCRYPT_EMAIL` | La tua email (riceve avvisi di scadenza da Let's Encrypt) |
| `COOKIE_SECURE` | `true` |

Il `ClusterIssuer` (`k3s/cert-manager/clusterissuer.yaml`) è infrastruttura condivisa: viene applicato da **`infra.yml`** (manuale), non da un push. Al primo deploy applicativo (`build-deploy.yml`), l'Ingress del client (unico dei due a portare l'annotation `cert-manager.io/cluster-issuer`, vedi commento in `client/k8s/ingress.yaml`) richiede il Certificate.

Il certificato viene emesso da cert-manager in ~1-2 minuti tramite sfida HTTP-01. Puoi monitorare:

```bash
kubectl get certificate -n k9         # Ready: True quando il cert è emesso
kubectl describe certificate k9-tls -n k9   # dettaglio eventi
```

#### 6. Ordine di primo avvio per un nuovo ambiente

1. `cloud-init.sh` (manuale, User data Hetzner o SSH) — bootstrap VPS: k3s, KEDA, cert-manager.
2. Workflow **Infra** (manuale, Environment del nuovo ambiente) — namespace, ghcr-secret, ConfigMap `k9-versions`, minio, k9-notify-secret, traefik-config, ClusterIssuer, CronJob notify/images-gc, Headlamp (opzionale, input `install_headlamp`).
3. Push su `main` → **Build & Deploy** esegue il primo deploy di client e server in staging.
4. Quando pronto per il rilascio: workflow **Tag** (manuale) → assegna la versione reale (tag Git, ri-tag Docker, GitHub Release), senza deployare nulla.
5. Workflow **Promote** (manuale, input `client_version`/`server_version`) → deploya quella versione in produzione (richiede che anche l'Environment `production` abbia già eseguito il passo 2).

**HTTP → HTTPS redirect** (opzionale, dopo che il certificato è attivo):

Aggiorna `k3s/traefik-config.yaml` aggiungendo:
```yaml
    ports:
      web:
        redirectTo:
          port: websecure
```
Poi rilancia il workflow **Infra** per quell'ambiente (`k3s/` è applicato solo da lì, non da `build-deploy.yml`).

---

### Rollback

```bash
# Torna al deploy precedente
kubectl rollout undo deployment/k9-server -n k9
kubectl rollout undo deployment/k9-client -n k9

# Torna a una revisione specifica
kubectl rollout history deployment/k9-server -n k9
kubectl rollout undo deployment/k9-server -n k9 --to-revision=2

# Rollback a un'immagine specifica
kubectl set image deployment/k9-server \
  server=ghcr.io/<owner>/k9-server:1.0.0 -n k9
```

### Headlamp Dashboard (accesso locale)

Opzionale — installato dal workflow **Infra** solo se `install_headlamp=true`
(default). Il token di accesso viene stampato nei log dello step "Applica
l'infrastruttura condivisa" di quella run (non ristampato se non cambia).

```bash
# 1. Sul VPS — avvia proxy (lascialo girare)
ssh -i ~/.ssh/k9_deploy deploy@<IP_VPS>
kubectl port-forward -n headlamp svc/my-headlamp --address='127.0.0.1' 8001:80 &

# 2. Sul tuo PC — apri tunnel SSH
ssh -i ~/.ssh/k9_deploy -L 8001:localhost:8001 -N deploy@<IP_VPS>

# 4. Browser
# http://localhost:8001
```

### Comandi kubectl utili

```bash
kubectl get pods -n k9
kubectl get hso -n k9                            # stato scaling KEDA
kubectl logs -f deployment/k9-server -n k9       # log server live
kubectl get events -n k9 --sort-by='.lastTimestamp'
kubectl describe hso k9-server -n k9             # eventi scaling dettaglio
```

---

## Sistema di notifiche

Un Kubernetes CronJob chiama periodicamente l'endpoint `POST /api/admin/notify`, che controlla se ci sono elementi in attesa di approvazione e invia una email riassuntiva agli amministratori.

### Flusso

```
CronJob (k3s/notify/cronjob.yaml)
    │  ogni ora dalle 6:00 alle 21:00
    ▼
POST /api/admin/notify
    │  Authorization: Bearer $API_KEY
    │
    ▼
Server controlla (find, non ancora una scrittura):
  • Exercise con state=TO_APPROVE     e lastNotifiedAt < oggi
  • Exercise con state=PENDING_UPDATE e lastNotifiedAt < oggi
    │
    ├─ nessun nuovo elemento → risposta { sent: false }, nessuna email
    │
    └─ elementi nuovi → invia email via SMTP ai NOTIFY_RECIPIENTS
                      → SOLO se l'invio riesce, segna lastNotifiedAt=now
                        sui documenti trovati
```

**Ordine importante**: `lastNotifiedAt` viene aggiornato **dopo** l'invio riuscito, non prima. Se l'invio SMTP fallisce (endpoint risponde 500), nessun documento viene marcato: gli stessi elementi restano eleggibili al prossimo tentativo del CronJob, invece di sparire in silenzio dalla notifica del giorno perché già segnati come "notificati" senza che l'email sia mai partita.

Ogni run logga (con timestamp, utile per riconciliare con `kubectl logs` su un CronJob che gira più volte al giorno):
```
[notify] Trovati N elementi da notificare (esercizi nuovi=…, modifiche=…) | 2026-08-02T...
[notify] Email inviata a … — N elementi in attesa | 2026-08-02T...
```
Un errore SMTP (es. `ECONNREFUSED`) produce comunque il primo log (quindi si vede sempre *cosa* c'era da notificare) ma non il secondo, e la risposta è 500 anziché 200.

### Campo `lastNotifiedAt`

Presente su `Exercise`. Viene:
- **Impostato** a `now` dal server solo dopo che l'elemento è stato incluso in una notifica **inviata con successo**
- **Azzerato** (`$unset`) quando un esercizio torna in stato `APPROVED` (approvazione o rifiuto modifica), in modo che una modifica successiva nella stessa giornata venga re-notificata

### Schedule

`0 6,9,12,15,18,21 * * *` — ogni 3 ore dalle 6:00 alle 21:00.

Per cambiare la frequenza modificare il campo `schedule` in `k3s/notify/cronjob.yaml` e rilanciare il workflow **Infra** per l'ambiente interessato (un push su `main` non lo applica: è infrastruttura condivisa, non gestita da `build-deploy.yml`).

### Variabili e secret richiesti

Già documentati nella sezione [Secrets e Variables richiesti](#secrets-e-variables-richiesti):
- Secret: `API_KEY`, `SMTP_PASS`
- Variable: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `NOTIFY_RECIPIENTS`, `DOMAIN` (usata anche qui per il link nella mail — vedi nota sulla riga `DOMAIN` della tabella)

### Test con Bruno

La collection Bruno in `bruno/` permette di chiamare l'endpoint manualmente:

1. Apri Bruno e importa la cartella `bruno/`
2. Seleziona l'ambiente (`development` o `production`)
3. Inserisci il valore di `notifyApiKey` nella colonna **Secret** dell'ambiente (non viene salvato su disco)
4. Esegui la request **trigger notify** nel folder `notify/`

---

## Storico modifiche e audit

Il tab **Audit** del pannello admin mostra, per un periodo scelto, i 5 utenti
che hanno contribuito di più: esercizi creati e modifiche proposte.

### Endpoint

| Endpoint | Sorgente | Campo di attribuzione |
|---|---|---|
| `GET /api/admin/audit/created-by-user?from=&to=` | `exercises` | `Exercise.user` |
| `GET /api/admin/audit/changes-by-user?from=&to=` | `exercisechanges` | `ExerciseChange.user` |

Entrambi: solo admin, `from` obbligatorio, `to` opzionale e **inclusivo
dell'intera giornata**, raggruppamento su `createdAt` (data della proposta,
non della risoluzione), limite alle prime 5 posizioni.

**Contano solo i contributi approvati**: le classifiche misurano ciò che un
admin ha validato, non ciò che è stato proposto. Restano quindi fuori sia i
rifiutati sia quelli ancora in attesa di revisione.

> Per gli esercizi "approvato" significa `state ∈ {APPROVED, PENDING_UPDATE}`,
> non il solo `APPROVED`: `PENDING_UPDATE` è comunque un esercizio approvato,
> segnala solo che c'è una modifica in attesa (è la stessa coppia di stati che
> `GET /api/exercises` considera "vivi"). Filtrando il solo `APPROVED`, un
> esercizio uscirebbe dalla classifica appena qualcuno propone una modifica,
> per rientrarci alla risoluzione.

> Le change `SUPERSEDED` non hanno bisogno di un filtro dedicato: alla
> risoluzione ricevono lo stato finale dell'intera catena, quindi quelle di una
> proposta approvata sono già `APPROVED` e vengono conteggiate — chi ha
> contribuito viene contato anche se non è stato l'ultimo a metterci mano.

Sia `Exercise.user` sia `ExerciseChange.user` sono scritti **una sola volta**,
alla creazione, e mai sovrascritti: restano il proponente originale anche se
un admin modifica i campi in fase di approvazione (quel percorso tocca solo
`userUpdate`). È ciò che rende affidabile l'attribuzione.

### Perché `ExerciseChange` ha uno stato

Per contare le modifiche proposte serve che i change doc **sopravvivano alla
risoluzione**. Prima `approve-change`/`reject-change` facevano `deleteOne`: una
volta gestita, la proposta spariva e non era più contabilizzabile.

Oggi il documento resta e cambia `state`:

| `state` | Quando | Conta nell'audit |
|---|---|---|
| `PENDING` | Modifica in attesa di revisione admin | No |
| `SUPERSEDED` | Un **altro** utente ha proposto una modifica successiva sullo stesso esercizio | Solo dopo che la catena è stata approvata (diventa `APPROVED`) |
| `APPROVED` | `POST /:id/approve-change` | Sì |
| `REJECTED` | `POST /:id/reject-change` | No |
| *(documento cancellato)* | Qualcuno riporta i valori a quelli originali prima della revisione (`PUT /:id` con diff vuoto) | No |

L'ultimo caso resta una cancellazione vera e propria: non è né un'approvazione
né un rifiuto, semplicemente nessuna proposta è arrivata a un admin —
conservarla gonfierebbe le statistiche. La cancellazione riguarda **l'intera
catena aperta** (vedi sotto), non solo l'ultima proposta.

### Proposte concorrenti: la catena

Il form di modifica carica la vista mergiata (`GET /:id/changes` = esercizio
approvato + campi della proposta in attesa). Quindi se A propone una modifica,
B che apre lo stesso esercizio **vede già i valori proposti da A** e, salvando,
li rinvia insieme ai propri.

Sovrascrivere il documento di A a nome di B falserebbe l'attribuzione. Invece:

```
A propone         → change#1 { user: A, state: PENDING }
B modifica        → change#1 { user: A, state: SUPERSEDED, supersededBy: #2 }
                    change#2 { user: B, state: PENDING }      ← unica proposta attiva
admin approva     → change#1 e #2 entrambe APPROVED           ← contano entrambi
admin rifiuta     → change#1 e #2 entrambe REJECTED           ← non conta nessuno
(finché è aperta) → nessuno conta: l'audit considera solo le APPROVED
qualcuno annulla  → change#1 e #2 cancellate
```

Dettagli che rendono il meccanismo corretto:

- **Il diff è sempre calcolato sull'esercizio approvato**, mai sulla vista
  mergiata (`computeDiff(exerciseData, …)` in `exercises.ts`): la proposta di B
  contiene quindi automaticamente anche le modifiche di A. Resta una sola
  proposta attiva, completa.
- **Si crea una nuova change solo se l'utente è diverso** dal proponente della
  PENDING. Lo stesso utente che raffina la propria proposta aggiorna il
  documento esistente, altrimenti verrebbe conteggiato più volte per un unico
  contributo.
- **La catena aperta si identifica come `{ exerciseId, state ∈ {PENDING, SUPERSEDED} }`** —
  non serve navigare `supersededBy`. L'invariante regge perché alla risoluzione
  l'intera catena riceve lo stato finale: le `SUPERSEDED` di un esercizio
  appartengono sempre e solo alla catena ancora aperta. `supersededBy` resta
  solo come traccia per ricostruire l'ordine.
- **L'ordine delle scritture è vincolato dall'indice**: la vecchia change va
  marcata `SUPERSEDED` *prima* di creare la nuova, altrimenti esisterebbero due
  `PENDING` sullo stesso esercizio e l'unique parziale fallirebbe con `E11000`.
  Per questo l'`_id` della nuova change è generato in anticipo (serve a
  valorizzare `supersededBy` prima che il documento esista). Tutto in una
  transazione.

> **Limite noto — approvazione parziale.** L'admin può applicare solo alcuni
> campi della proposta. La propagazione marca `APPROVED` l'intera catena anche
> se il campo specifico di un utente è stato scartato: il conteggio è alla
> granularità della *proposta*, non del singolo campo. È lo stesso livello di
> approssimazione già presente per le proposte a un solo autore.

> **Indice parziale, non globale.** L'unique su `exerciseId` è scoped a
> `state: "PENDING"` (vedi [Indici del database](#indici-del-database)): più
> documenti storici possono condividere lo stesso `exerciseId`, ma al più uno
> può essere in attesa. Con un unique globale, la seconda proposta di modifica
> sullo stesso esercizio fallirebbe con `E11000`.

> **Tutte le lookup filtrano per stato.** `ExerciseChange.findOne({ exerciseId })`
> compare in 5 punti di `exercises.ts` (immagini pending, `/pending`,
> `/:id/changes`, stream immagini, `approve-change`): tutti passano
> `state: "PENDING"`, altrimenti pescherebbero un documento storico al posto
> di quello attivo.

> **Attenzione alle scritture di massa su `exerciseId`.** Cancellazioni e
> aggiornamenti che riguardano la catena vanno sempre scoped agli stati aperti
> (`{ state: { $in: ["PENDING", "SUPERSEDED"] } }`): un `deleteMany({ exerciseId })`
> nudo distruggerebbe anche lo storico delle catene già risolte sullo stesso
> esercizio.

---

## Gestione immagini esercizi (minIO)

Ogni esercizio può avere fino a **3 immagini**. I binari **non** stanno su
MongoDB: vivono su un pod **minIO** (S3-compatibile) e a DB si salva solo il
riferimento (array `images[]` nel documento Exercise). Design completo in
[analisi/25_gestione_immagini.md](analisi/25_gestione_immagini.md).

### Architettura

```
Client ──(multipart: exercise JSON + file)──▶ POST/PUT /api/exercises
   │                                              │ comprime già lato client (WebP)
   │                                              ▼
   │                                  Server: valida (mime/size/max 3)
   │                                          → upload su minIO
   │                                          → salva images[] (key) a DB
   │
   └──(modale a carosello)──▶ GET /api/exercises/:id/images/:imageId
                                  └─ Server fa da proxy/stream verso minIO
```

- **Salvataggio e recupero passano sempre dal server**: minIO non è esposto al
  client (Service ClusterIP interno).
- **Immagini come content field**: le modifiche alle immagini su esercizi
  `APPROVED` passano per l'approvazione admin come ogni altro contenuto (sono in
  `CONTENT_FIELDS`, il riferimento sta nel change doc finché non è approvato).
- **Nessuna transazione minIO↔Mongo**: in caso di upload riuscito ma salvataggio
  fallito i file restano orfani e li raccoglie il job di GC (sotto).

### Endpoint

| Metodo | Path | Note |
|--------|------|------|
| `POST` | `/api/exercises` | multipart: campo `exercise` (JSON) + file `images` |
| `PUT`  | `/api/exercises/:id` | come sopra; `exercise.images` = immagini da mantenere |
| `GET`  | `/api/exercises/:id/images/:imageId` | stream del binario (proxy minIO, con cache) |
| `POST` | `/api/admin/gc-images` | garbage collection orfani (Bearer `API_KEY`) |

### Job di garbage collection

CronJob `k3s/images-gc/cronjob.yaml` ogni **domenica alle 3:00** (`0 3 * * 0`)
chiama `POST /api/admin/gc-images`. Cancella da minIO gli oggetti non referenziati
né dagli esercizi né dai change doc in attesa, **più vecchi di 2h** (grace period).
Due guardie di sicurezza:
- **errore di query DB** → l'handler va in catch e non cancella nulla;
- **cancellazione di massa anomala** → tetto di 50 oggetti per run, oltre il
  quale si abortisce (risposta 409) e si logga.

### Avviare il GC manualmente in locale

```bash
curl -s -X POST http://localhost:3001/api/admin/gc-images \
  -H "Authorization: Bearer <API_KEY dal .env>"
```

Risposta attesa (con o senza orfani):

```json
{ "scanned": 12, "referenced": 9, "deleted": 3 }
```

Risposta `409` se il numero di orfani supera il tetto di 50 per run (misura di sicurezza anti-cancellazione massiva):

```json
{ "error": "Troppi orfani da cancellare: abort per sicurezza", "candidates": 87 }
```

### Infrastruttura e variabili

Manifest in `k3s/minio/` (StatefulSet single-node con `volumeClaimTemplates` 20Gi,
service ClusterIP + headless). Lo StatefulSet è già predisposto per lo scaling:
ogni replica avrebbe il proprio PVC (`storage-minio-N`) e un DNS stabile.

minIO **non scala con HPA/KEDA**: `replicas` resta 1. Passare al distributed mode
(HA) **non è un semplice `replicas: 4`**: serve anche cambiare gli `args` alla
forma distribuita (`server http://minio-{0...3}.minio-headless…/data`) e
**migrare i dati**, perché il layout single-node non è convertibile on-disk in
erasure-coded. Lo StatefulSet evita però di cambiare Kind in futuro.

Secret `minio-secret` (`MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`) creato dal
workflow **Infra** (non da `build-deploy.yml`). Il server legge:
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_BUCKET`, `MINIO_ACCESS_KEY` (valori in chiaro)
- `MINIO_SECRET_KEY` (dal secret)

GitHub Secrets da impostare: `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`.

### Console minIO in locale

Il `docker compose -f local/docker-compose.yml up -d` avvia anche minIO
(API `:9000`, console web `:9001`, credenziali `minioadmin`/`minioadmin`).

### Console minIO in produzione (tunnel SSH)

La console non è esposta in Ingress. Per accederci dal browser locale:

```bash
# 1. Sul VPS: forward del pod MinIO verso localhost del VPS
kubectl port-forward -n k9 statefulset/minio 9001:9001 &

# 2. Dal tuo PC: tunnel SSH che fa arrivare il port-forward in locale
ssh -i ~/.ssh/k9_deploy -L 9001:localhost:9001 -N deploy@<IP_VPS>
```

Apri poi `http://localhost:9001` nel browser.

> **Attenzione — inizializzazione credenziali**: MinIO scrive le credenziali
> (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`) sul PersistentVolume **al primo
> avvio**. I riavvii successivi leggono dal disco, ignorando le env var.
> Se il pod è stato avviato prima che il secret `minio-secret` fosse popolato
> correttamente (es. GitHub Secret non ancora configurato), MinIO usa i valori
> di quel primo avvio (default `minioadmin`/`minioadmin` se le env erano vuote).
> Per riallineare le credenziali occorre eliminare il PVC e lasciare che MinIO
> si reinizializzi con i valori corretti del secret.

---

## Integrazione con WordPress

Permette di delegare l'autenticazione a WordPress: WP genera un JWT firmato e l'app Node lo valida per creare la sessione. È l'unica modalità di login supportata dall'app.

### Flusso

```
Utente → WordPress (login) → controlla k9_app_access
                                    │ accesso negato → pagina /no-access su WP
                                    │ accesso OK
                                    ▼
                             genera JWT (email + k9_app_role)
                             redirect /api/auth/wp-callback?token=...
                                    │
                                    ▼
                             App Node: valida JWT con segreto condiviso
                             crea sessione cookie { email, role }
                             redirect / (URL pulito)
                                    │
                                    ▼
                             App React: GET /api/auth/me → { email, role }
                             useAuth() disponibile in tutti i componenti
```

Il token nell'URL è **usa e getta**: serve solo per l'handshake iniziale (scadenza: 5 minuti).

---

### Variabili d'ambiente

Nel file `.env` alla root del monorepo:

```env
# Segreto condiviso tra WordPress e app — deve coincidere con wp-config.php
# Generare con: openssl rand -base64 32
K9_JWT_SECRET=stringa-lunga-e-casuale
```

---

### Parte 1 — Configurazione WordPress

#### 1.1 Controllo accesso e ruoli tramite user meta

Per ogni utente WP che deve accedere all'app, impostare due campi meta (gestibili dalla pagina **Utenti → Modifica** grazie al codice del §1.4):

| Meta key | Valori | Significato |
|---|---|---|
| `k9_app_access` | `1` / `0` | L'utente può accedere all'app |
| `k9_app_role` | `viewer` / `admin` | Ruolo all'interno dell'app |
| `k9_instructor_level` | `BSS` / `CTS` | Livello istruttore: BSS = Balance Safe and Sound, CTS = Cross Trainer Specialist (default: `BSS`) |

Il ruolo WP (administrator, editor, subscriber…) è indipendente dal ruolo app.

#### 1.2 Segreto condiviso in `wp-config.php`

Aprire `wp-config.php` (nella cartella principale di WordPress) e aggiungere queste due righe **prima** della riga `/* That's all, stop editing! */`:

```php
define( 'K9_JWT_SECRET', 'stringa-lunga-e-casuale-identica-a-quella-nel-env-app' );
define( 'K9_APP_URL',    'https://app.miodominio.com' );
```

#### 1.3 Codice PHP — plugin Code Snippets (consigliato)

Non è richiesta nessuna libreria esterna: il JWT HS256 viene generato con `hash_hmac`, funzione nativa di PHP.

Installare il plugin gratuito **Code Snippets** da WordPress → Plugin → Aggiungi nuovo, poi creare **due snippet separati**.

**Snippet A — Redirect con JWT** (obbligatorio):

```php
// Genera JWT HS256 senza librerie esterne
function k9_jwt_encode( array $payload, string $secret ): string {
    $b64 = fn( $s ) => rtrim( strtr( base64_encode( $s ), '+/', '-_' ), '=' );
    $header = $b64( json_encode( [ 'alg' => 'HS256', 'typ' => 'JWT' ] ) );
    $body   = $b64( json_encode( $payload ) );
    $sig    = $b64( hash_hmac( 'sha256', "$header.$body", $secret, true ) );
    return "$header.$body.$sig";
}

// Redirect verso l'app con JWT
function k9_redirect_to_app() {
    if ( ! is_user_logged_in() ) {
        wp_redirect( wp_login_url( add_query_arg( 'k9_redirect', '1', home_url( '/' ) ) ) );
        exit;
    }

    $user = wp_get_current_user();

    $has_access = get_user_meta( $user->ID, 'k9_app_access', true );
    if ( ! $has_access ) {
        wp_redirect( home_url( '/no-access' ) );
        exit;
    }

    if ( ! defined( 'K9_JWT_SECRET' ) || ! defined( 'K9_APP_URL' ) ) {
        wp_die( 'K9_JWT_SECRET o K9_APP_URL non definiti in wp-config.php' );
    }

    $now   = time();
    $token = k9_jwt_encode( [
        'iat'              => $now,
        'exp'              => $now + 300,
        'email'            => $user->user_email,
        'username'         => $user->user_login,
        'role'             => get_user_meta( $user->ID, 'k9_app_role', true ) ?: 'viewer',
        'instructor_level' => get_user_meta( $user->ID, 'k9_instructor_level', true ) ?: 'BSS',
    ], K9_JWT_SECRET );

    wp_redirect( K9_APP_URL . '/api/auth/wp-callback?token=' . urlencode( $token ) );
    exit;
}

add_action( 'template_redirect', function () {
    if ( isset( $_GET['k9_redirect'] ) ) {
        k9_redirect_to_app();
    }
} );
```

**Snippet B — Campi K9 App nel profilo utente** (consigliato per gestire gli utenti dall'admin WP):

```php
// Campi K9 App nella pagina profilo utente (visibili solo agli admin WP)
add_action( 'show_user_profile', 'k9_user_profile_fields' );
add_action( 'edit_user_profile', 'k9_user_profile_fields' );

function k9_user_profile_fields( WP_User $user ) {
    if ( ! current_user_can( 'edit_users' ) ) return;
    $has_access       = get_user_meta( $user->ID, 'k9_app_access', true );
    $role             = get_user_meta( $user->ID, 'k9_app_role', true ) ?: 'viewer';
    $instructor_level = get_user_meta( $user->ID, 'k9_instructor_level', true ) ?: 'BSS';
    ?>
    <h3>K9 Exercise App — Accesso</h3>
    <table class="form-table">
        <tr>
            <th>Abilita accesso app</th>
            <td>
                <input type="checkbox" name="k9_app_access" value="1"
                    <?php checked( $has_access, '1' ); ?> />
            </td>
        </tr>
        <tr>
            <th>Ruolo</th>
            <td>
                <select name="k9_app_role">
                    <option value="viewer" <?php selected( $role, 'viewer' ); ?>>Viewer</option>
                    <option value="admin"  <?php selected( $role, 'admin'  ); ?>>Admin</option>
                </select>
            </td>
        </tr>
        <tr>
            <th>Livello istruttore</th>
            <td>
                <select name="k9_instructor_level">
                    <option value="BSS" <?php selected( $instructor_level, 'BSS' ); ?>>BSS</option>
                    <option value="CTS" <?php selected( $instructor_level, 'CTS' ); ?>>CTS</option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

add_action( 'personal_options_update',  'k9_save_user_profile_fields' );
add_action( 'edit_user_profile_update', 'k9_save_user_profile_fields' );

function k9_save_user_profile_fields( int $user_id ) {
    if ( ! current_user_can( 'edit_user', $user_id ) ) return;
    update_user_meta( $user_id, 'k9_app_access', isset( $_POST['k9_app_access'] ) ? '1' : '0' );
    $allowed_roles = [ 'viewer', 'admin' ];
    $role = sanitize_text_field( $_POST['k9_app_role'] ?? 'viewer' );
    update_user_meta( $user_id, 'k9_app_role', in_array( $role, $allowed_roles ) ? $role : 'viewer' );
    $allowed_levels = [ 'BSS', 'CTS' ];
    $level = sanitize_text_field( $_POST['k9_instructor_level'] ?? 'BSS' );
    update_user_meta( $user_id, 'k9_instructor_level', in_array( $level, $allowed_levels ) ? $level : 'BSS' );
}
```

#### 1.4 Azioni di gruppo — Accesso e livello istruttore

Per gestire più utenti contemporaneamente dalla lista **Utenti → Tutti gli utenti**, aggiungere uno snippet in Code Snippets (snippet separato, esegui ovunque):

```php
// Aggiunge azioni di gruppo per accesso K9 App e livello istruttore
add_filter('bulk_actions-users', function($actions) {
    $actions['k9_enable_access']  = 'K9: Abilita accesso';
    $actions['k9_disable_access'] = 'K9: Disabilita accesso';
    $actions['k9_level_bss']      = 'K9: Livello → BSS';
    $actions['k9_level_cts']      = 'K9: Livello → CTS';
    return $actions;
});

add_filter('handle_bulk_actions-users', function($redirect_to, $action, $user_ids) {
    if ($action === 'k9_enable_access') {
        foreach ($user_ids as $uid) update_user_meta($uid, 'k9_app_access', '1');
        return add_query_arg('k9_bulk_updated', count($user_ids), $redirect_to);
    }
    if ($action === 'k9_disable_access') {
        foreach ($user_ids as $uid) update_user_meta($uid, 'k9_app_access', '0');
        return add_query_arg('k9_bulk_updated', count($user_ids), $redirect_to);
    }
    if ($action === 'k9_level_bss') {
        foreach ($user_ids as $uid) update_user_meta($uid, 'k9_instructor_level', 'BSS');
        return add_query_arg('k9_bulk_updated', count($user_ids), $redirect_to);
    }
    if ($action === 'k9_level_cts') {
        foreach ($user_ids as $uid) update_user_meta($uid, 'k9_instructor_level', 'CTS');
        return add_query_arg('k9_bulk_updated', count($user_ids), $redirect_to);
    }
    return $redirect_to;
}, 10, 3);

// Notifica di conferma dopo l'azione
add_action('admin_notices', function() {
    if (!empty($_REQUEST['k9_bulk_updated'])) {
        $n = intval($_REQUEST['k9_bulk_updated']);
        echo '<div class="notice notice-success is-dismissible"><p>' .
             esc_html(sprintf('%d utenti aggiornati.', $n)) .
             '</p></div>';
    }
});
```

Selezionare gli utenti dalla lista, scegliere l'azione dal menu a tendina "Azioni di gruppo" e cliccare **Applica**.

#### 1.5 Link di accesso all'app

L'URL da esporre agli utenti (nel menu WP o in una pagina dedicata):

```
https://miodominio-wp.com/?k9_redirect=1
```

Chiunque clicchi questo link viene autenticato su WP (se non lo è già) e poi rediretto all'app con il JWT. Gli utenti senza `k9_app_access = 1` finiscono sulla pagina `/no-access`.

---

### Parte 2 — App Node.js (già implementato)

Le seguenti modifiche sono già presenti nel codice:

- `jsonwebtoken` installato come dipendenza del server
- Route `GET /api/auth/wp-callback` in `server/src/routes/auth.ts`: valida il JWT, crea `req.session.user = { email, role }` e fa redirect a `/`
- La pagina `/login` lato client mostra sempre il messaggio informativo "accedi da WordPress" (nessun form email+password)

---

### Parte 3 — Test dell'integrazione in locale

#### 3.1 Script di generazione token

Lo script `scripts/generate-wp-token.mjs` simula il token che WordPress produrrebbe. Configurare le variabili in cima al file:

```js
const EMAIL           = "test@esempio.com";
const ROLE            = "viewer";   // "viewer" | "admin"
const EXPIRES_SECONDS = 300;
```

Eseguire:

```bash
node scripts/generate-wp-token.mjs
```

Output:

```
─────────────────────────────────────────────
  email  : test@esempio.com
  role   : viewer
  scade  : 14:35:22 (tra 300s)
─────────────────────────────────────────────

Token JWT:
eyJhbGci...

URL di test (apri nel browser con il server in esecuzione):
http://localhost:3001/api/auth/wp-callback?token=eyJhbGci...
```

Aprire l'URL nel browser: se il server è in esecuzione con `K9_JWT_SECRET` configurato, l'app crea la sessione e fa redirect a `/`.

#### 3.2 Verifica manuale

```bash
K9_JWT_SECRET=test-secret node scripts/generate-wp-token.mjs
# Copiare l'URL e aprirlo nel browser
```

2. **Produzione**: verificare che il dominio WP e quello dell'app usino HTTPS — il token viaggia nell'URL.

3. **Scadenza**: il token ha `exp` a 5 minuti. Se il redirect impiega troppo, aumentare il valore in WP (`$issued_at + 300`).

---

### Sicurezza checklist

| Punto | Dettaglio |
|-------|-----------|
| **Segreto JWT lungo** | Minimo 32 caratteri — `openssl rand -base64 32` |
| **Scadenza token breve** | 5 minuti (`exp: now + 300`) sono sufficienti per il redirect |
| **HTTPS obbligatorio** | Il token viaggia nell'URL: senza HTTPS è intercettabile |
| **`SESSION_SECRET` ≠ `K9_JWT_SECRET`** | Segreti con scopi diversi, non riutilizzare lo stesso valore |
| **Accesso per utente** | Solo gli utenti WP con `k9_app_access = 1` ricevono il JWT |
| **Ruolo separato dal ruolo WP** | `k9_app_role` è indipendente da administrator/editor/subscriber |
| **Rimuovere `ADMIN_SEED_*` dal `.env`** | Dopo il primo avvio eliminare o commentare le variabili di seed |
| **Token one-time (opzionale)** | WP salva il token in DB e lo invalida dopo il primo uso |

---

## Comandi pulizia registry git

> Per i tag di build effimeri (`client-<branch>-<data>`/`server-<branch>-<data>`)
> lo strumento primario è il workflow **`cleanup-build-tags.yml`** (vedi
> [Versioning e tag Git](#versioning-e-tag-git)), che ripulisce sia i tag Git sia
> le immagini Docker rispettando `preserve_latest`. Il comando sotto copre un
> caso diverso e più raro: immagini rimaste **senza nessun tag** (es. dopo un
> push fallito a metà, o un digest orfano).

Dopo aver installato gh ed eseguito la login con questo comando si eliminano tutte le immagini che non hanno tag

```bash
PAGER=cat; PACKAGE="k9-server"; gh api "/user/packages/container/$PACKAGE/versions" --paginate \
  | jq -r '.[] | select(.metadata.container.tags | length == 0) | .id' \
  | while read -r id; do
      echo "Deleting version $id"
      gh api -X DELETE "/user/packages/container/$PACKAGE/versions/$id"
    done
```
