# CI/CD — Workflow GitHub Actions

Documentazione dei workflow in questa cartella e dei pattern architetturali usati.

1. Il deploy vero e proprio è estratto in **workflow riutilizzabili per scope**
   (`deploy-client.yml`, `deploy-server.yml`), chiamati sia dal deploy automatico
   in staging sia dal deploy manuale in produzione — nessuna logica di deploy
   duplicata tra i due contesti.
2. Versioning e deploy in produzione sono **due workflow separati**: `tag.yml`
   decide quale versione esiste (crea/sposta il tag reale, ri-tagga l'immagine
   Docker, crea la GitHub Release) e basta — non deploya nulla. `promote.yml`
   riceve la versione da deployare come **input esplicito** e fa solo il deploy —
   non decide nulla, non tagga nulla. I due possono succedere in momenti diversi
   (tagga oggi, promuovi la settimana prossima) e `promote.yml` può essere
   rilanciato in ogni momento con la stessa versione per risincronizzare la
   produzione, senza dover ripassare da `tag.yml`.

Se stai portando questi pattern su ClubManager (o un altro progetto derivato), il
punto 1 in particolare è un miglioramento generale — vale la pena riportarlo anche
lì, anche se in quel progetto `Tag` non deploya da nessuna parte.

## Indice

- [CI/CD — Workflow GitHub Actions](#cicd--workflow-github-actions)
  - [Indice](#indice)
  - [Panoramica](#panoramica)
  - [Pattern architetturali](#pattern-architetturali)
    - [1. GitHub Environments come "ambiente target"](#1-github-environments-come-ambiente-target)
    - [2. Build/deploy condizionali via tag Git](#2-builddeploy-condizionali-via-tag-git)
    - [3. Ciclo di vita del tag `<scope>-<branch>-<data>`](#3-ciclo-di-vita-del-tag-scope-branch-data)
    - [4. Deploy come workflow riutilizzabile per scope](#4-deploy-come-workflow-riutilizzabile-per-scope)
    - [5. Tag e Promote separati](#5-tag-e-promote-separati)
    - [6. Pulizia dei tag superati](#6-pulizia-dei-tag-superati)
    - [7. Toggle opzionali per gli addon di infra](#7-toggle-opzionali-per-gli-addon-di-infra)
    - [8. Riepilogo incrementale, non solo un job finale](#8-riepilogo-incrementale-non-solo-un-job-finale)
  - [Insidie note (gotcha)](#insidie-note-gotcha)
  - [Workflow, uno per uno](#workflow-uno-per-uno)
    - [`infra.yml`](#infrayml)
    - [`build-deploy.yml`](#build-deployyml)
    - [`deploy-client.yml` / `deploy-server.yml`](#deploy-clientyml--deploy-serveryml)
    - [`tag.yml`](#tagyml)
    - [`promote.yml`](#promoteyml)
    - [`cleanup-build-tags.yml`](#cleanup-build-tagsyml)
  - [Come adattarlo a un altro progetto](#come-adattarlo-a-un-altro-progetto)

---

## Panoramica

| Workflow | Trigger | Scopo |
|---|---|---|
| [`infra.yml`](workflows/infra.yml) | Manuale (`workflow_dispatch`) | Provisiona/aggiorna infrastruttura condivisa e a lunga vita: namespace, minio, secrets comuni, cert-manager, Headlamp (opzionale). Da lanciare una tantum per ambiente. |
| [`build-deploy.yml`](workflows/build-deploy.yml) | Push su `main`, o manuale (input `force_all`) | Builda le immagini Docker cambiate e le deploya in **staging**, in modo condizionale e indipendente per scope (client/server). Con `force_all` ribuilda e rideploya tutto, ignorando il diff. |
| [`deploy-client.yml`](workflows/deploy-client.yml) | Solo `workflow_call` (riutilizzabile) | Applica i manifest `client/k8s/*`, verifica il rollout, aggiorna `k9-versions`. Chiamato da `build-deploy.yml` e `promote.yml`. |
| [`deploy-server.yml`](workflows/deploy-server.yml) | Solo `workflow_call` (riutilizzabile) | Gemello di `deploy-client.yml` per `server/k8s/*` (+ `k9-secrets`, `hso.yaml`). |
| [`tag.yml`](workflows/tag.yml) | Manuale | Promuove lo stato attualmente deployato su `main` a versione reale (senza rebuild): tag Git, ri-tag Docker, GitHub Release. **Non deploya nulla.** |
| [`promote.yml`](workflows/promote.yml) | Manuale (con input `client_version`/`server_version`) | Deploya in **produzione** la versione indicata (già taggata da `tag.yml`). **Non tagga né rilascia nulla.** |
| [`cleanup-build-tags.yml`](workflows/cleanup-build-tags.yml) | Manuale, o automatico dopo `tag.yml` | Ripulisce i tag Git e le immagini Docker dei build superati. |

Separazione di responsabilità: **Infra** gestisce ciò che ha un ciclo di vita lungo
e stato persistente (namespace, storage, secret condivisi) — va eseguito raramente,
quasi mai in automatico. **Build & Deploy** gestisce il ciclo di sviluppo continuo
in staging. **Tag** decide le versioni. **Promote** le porta in produzione. Quattro
responsabilità, quattro momenti diversi nel ciclo di vita di una release — non
mescolarle nello stesso workflow: un push innocuo sul codice applicativo non deve
mai rischiare di toccare lo storage, e taggare una versione non deve mai
comportare un deploy involontario in produzione.

## Pattern architetturali

### 1. GitHub Environments come "ambiente target"

Ogni [GitHub Environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
(`staging`, `production`) ha il proprio set di Variables/Secrets. Un job vi si
aggancia con:

```yaml
jobs:
  mio_job:
    environment: staging      # fisso: questo job usa sempre le Variables/Secrets di "staging"
```

oppure, per un workflow che deve poter agire su ambienti diversi a seconda di chi lo
lancia (qui: `infra.yml`):

```yaml
on:
  workflow_dispatch:
    inputs:
      env:
        type: environment      # GitHub mostra un menu a tendina con gli Environment
        required: true          # REALMENTE configurati sul repo
jobs:
  mio_job:
    environment: ${{ inputs.env }}
```

Non serve creare l'Environment a mano in anticipo: **GitHub lo crea automaticamente,
vuoto**, al primo run che lo referenzia — va solo popolato di Variables/Secrets dopo.

### 2. Build/deploy condizionali via tag Git

Client e server sono scope indipendenti, colocati con i propri manifest
(`client/k8s/`, `server/k8s/`). Il pattern usato in `build-deploy.yml`:

1. Ogni volta che uno scope viene **effettivamente deployato con successo** in
   staging, viene creato un tag Git **nuovo** `<scope>-main-<data>` sul commit
   deployato (vedi punto 3) — mai spostato uno esistente.
2. Alla run successiva, si cerca l'ultimo tag di quello scope **raggiungibile da
   `HEAD`** (`git tag --merged HEAD --sort=-creatordate -l "<scope>-main-*" | head -1`)
   e si fa `git diff --name-only <tag> HEAD -- <scope>/` per sapere cosa è cambiato
   **solo in quella cartella**.
3. Se non è cambiato nulla sotto quella cartella → il job di build/deploy di quello
   scope **non gira affatto** (non solo "salta il rebuild": non tocca proprio il
   Deployment k8s esistente).
4. Se non si trova nessun tag precedente (prima run in assoluto, o dopo una
   pulizia) → si builda/deploya tutto per quello scope, per sicurezza.

Requisiti perché funzioni: checkout con `fetch-depth: 0` (serve tutta la history e
i tag), e i manifest k8s **dentro** la cartella dello scope (`client/k8s/`,
`server/k8s/`), non in una cartella condivisa separata — così un singolo pattern di
diff intercetta sia i cambi di codice sia quelli di manifest, distinguendo i due
casi con un secondo grep mirato su `<scope>/k8s/`:

```bash
CHANGED=$(git diff --name-only "$PREV_TAG" HEAD -- "client/")
HAS_CODE=false; HAS_K8S=false
echo "$CHANGED" | grep -qE '^client/k8s/' && HAS_K8S=true || true
echo "$CHANGED" | grep -vE '^client/k8s/' | grep -qE '^client/' && HAS_CODE=true || true
# deploy se HAS_CODE o HAS_K8S; rebuild (nuova immagine) solo se HAS_CODE
```

Se il rebuild non serve (solo manifest cambiato) ma il deploy sì, si cerca l'ultimo
tag Git `<scope>-main-*`, che identifica senza ambiguità l'ultima immagine di quello
scope davvero deployata con successo.

### 3. Ciclo di vita del tag `<scope>-<branch>-<data>`

Un tag **nuovo** per ogni deploy riuscito di quello scope su quel branch — mai uno
spostato. Serve sia da baseline per il diff del punto precedente sia da
riferimento per `tag.yml` (punto 5). Creato **sempre a fine job, solo dopo un
deploy riuscito**, sia che ci sia stato un rebuild sia che sia stato un deploy
solo-manifest (nessuna nuova immagine): il nome del tag è comunque `<branch>-<data
di questa run>`, quindi univoco di suo, senza bisogno di distinguere i due casi.

Perché sempre un tag nuovo e mai uno spostato: primo, tracciabilità — anche un
deploy che ha toccato solo `<scope>/k8s/*` deve restare visibile come evento a sé
nello storico dei tag, non sparire dentro il tag della run precedente. Secondo,
un side-effect utile: forzare lo spostamento di un tag il cui commit tocca
`.github/workflows/` richiede permessi che `GITHUB_TOKEN` non ha (vedi
["Insidie note"](#insidie-note-gotcha)) — creare sempre un tag nuovo evita il
problema alla radice, senza bisogno di un PAT aggiuntivo.

Questo accumula più tag `<scope>-main-*` nel tempo (uno per ogni deploy, anche
solo-manifest): la pulizia non è compito di questo job, ma di
`cleanup-build-tags.yml` (punto 6), che mantiene solo il più recente per
(scope, branch).

Questo passo (job `register-client-tag`/`register-server-tag` in `build-deploy.yml`)
resta **fuori** dal workflow riutilizzabile di deploy (punto 4): dipende da logica
specifica di questa run (è stato fatto un rebuild o no), non è generico "deploya
questo tag su questo ambiente".

### 4. Deploy come workflow riutilizzabile per scope

`deploy-client.yml` e `deploy-server.yml` sono `workflow_call`: prendono in input
`environment` e `image_tag`, e fanno **solo** questo — render dei manifest
(`envsubst`), copia sulla VPS, `kubectl apply`, verifica rollout, patch della
ConfigMap `k9-versions`. Nessuna conoscenza di *perché* si sta deployando quel tag
né di *dove* venga da (data-tag effimero o versione semver reale).

Chi li chiama decide tutto il resto:

```yaml
# build-deploy.yml — staging, tag di data
deploy-client:
  needs: resolve-client-image
  uses: ./.github/workflows/deploy-client.yml
  with:
    environment: staging
    image_tag: ${{ needs.resolve-client-image.outputs.image_tag }}
  secrets: inherit
```

```yaml
# promote.yml — production, versione semver reale ricevuta come input
deploy-production-client:
  needs: validate
  if: inputs.client_version != ''
  uses: ./.github/workflows/deploy-client.yml
  with:
    environment: production
    image_tag: ${{ inputs.client_version }}
  secrets: inherit
```

Vantaggio: un cambiamento a *come* si deploya (nuovo step, nuova secret, nuovo
manifest da applicare) si scrive **una volta sola** e vale per entrambi gli
ambienti — prima di questo refactor la stessa sequenza scp+ssh+rollout+patch era
duplicata identica in due punti diversi, con il rischio concreto di aggiornarne uno
e dimenticare l'altro.

`secrets: inherit` passa tutti i secret disponibili al chiamante; l'`environment:`
dichiarato **dentro** il workflow riutilizzabile (`environment: ${{ inputs.environment }}`)
è quello che determina quali Variables/Secrets vengono effettivamente letti.

### 5. Tag e Promote separati

A differenza di un progetto con un solo ambiente (dove "promuovi" può fermarsi al
versioning), qui la promozione a versione reale e il deploy in produzione sono
**due workflow distinti**, non due fasi dello stesso workflow:

- **`tag.yml`** — per ciascuno scope, trova l'ultimo tag `<scope>-main-*`; se il
  suo commit ha già un tag `<scope>-vX.Y.Z`, è già stato promosso (salta);
  altrimenti legge la versione da `<scope>/package.json` **al commit di quel tag**
  (non da `HEAD`), crea/sposta il tag reale, ri-tagga l'immagine Docker esistente
  senza rebuild (`docker buildx imagetools create`), crea/aggiorna la GitHub
  Release. **Non deploya nulla.**
- **`promote.yml`** — riceve `client_version`/`server_version` come input
  espliciti (può valorizzare uno solo, entrambi, o rilanciarlo più volte con la
  stessa versione). Verifica che il tag `<scope>-v<versione>` esista davvero
  (altrimenti fallisce subito, con un errore chiaro, invece di deployare qualcosa
  di sbagliato), poi chiama `deploy-client.yml`/`deploy-server.yml` con
  `environment: production`. **Non tagga né crea Release.**

Perché separarli: taggare una versione (evento di "decisione", raro, revisionabile
via Release) e farla girare in produzione (evento operativo, che può servire
ripetere — es. dopo un deploy fallito, o per riallineare un ambiente dopo un
incidente) sono azioni con un ciclo di vita diverso. Fonderle in un solo workflow
costringerebbe a ritaggare (o a inventare logica ad hoc per evitarlo) ogni volta che
serve solo ri-eseguire il deploy.

Se **almeno uno** scope è stato promosso da `tag.yml`, quello stesso workflow
triggera (fire-and-forget) la pulizia (punto 6) scoped al branch di produzione con
`preserve_latest=true`, e con `scope` limitato al solo scope promosso se ne è stato
promosso uno solo.

### 6. Pulizia dei tag superati

`cleanup-build-tags.yml`. Poiché i tag non sono usa-e-getta (punto 3: servono anche
da baseline per il diff), **non si può cancellare alla cieca tutto ciò che matcha un
pattern** — si romperebbe il diff della prossima run su quel branch. Input
**`preserve_latest` (default `true`)**: raggruppa i tag trovati per (scope, branch)
e per ciascun gruppo **mantiene sempre il più recente**, eliminando solo quelli più
vecchi — sicuro da lanciare anche in automatico su un branch ancora attivo come
`main`.

`preserve_latest=false` è per un branch **concluso/mergiato**, i cui tag non
servono più a nessuno.

Per la pulizia delle immagini Docker, l'azione generica
`actions/delete-package-versions` non supporta un filtro "elimina solo le versioni
con questo tag": va usata direttamente l'API REST di GitHub Packages, filtrando
lato script. Salvaguardia sempre presente: **mai** eliminare una versione (=
digest) che ha anche un tag di versione reale (`X.Y.Z`) — l'API di GHCR cancella
per digest, non per singolo tag.

### 7. Toggle opzionali per gli addon di infra

`infra.yml` accetta input booleani per gli addon non strettamente necessari al
funzionamento dell'app (qui: `install_headlamp`, UI di amministrazione Kubernetes
con permessi cluster-admin). Motivazione: alcuni ambienti (tipicamente production)
potrebbero non volerlo per superficie di attacco ridotta, ma il default resta
`true` per non cambiare comportamento a chi già lo usa.

```yaml
inputs:
  install_headlamp:
    type: boolean
    default: true
```

```bash
if [ "$INSTALL_HEADLAMP" = "true" ]; then
  helm upgrade --install my-headlamp headlamp/headlamp --namespace headlamp --create-namespace
  # ...
else
  echo "install_headlamp=false: non installato/non toccato."
fi
```

Pattern generale: qualunque addon di infra "utile ma non essenziale" (dashboard,
tool di debug, componenti che aumentano la superficie di attacco) è un candidato
per un toggle così, invece di essere baked-in nello script di bootstrap del cluster
(che gira una sola volta, non è ri-eseguibile per ambiente).

### 8. Riepilogo incrementale, non solo un job finale

Ogni step che calcola o decide qualcosa di rilevante (versioni, se serve un
rebuild, quale immagine verrà deployata e perché, l'esito di un rollout) scrive
subito il proprio pezzo su `$GITHUB_STEP_SUMMARY`, invece di accumulare tutto in
un unico job `summary` a fine pipeline:

```bash
{
  echo "### Immagine da deployare"
  echo ""
  echo "- **client**: \`$IMAGE_TAG\` — $REASON"
} >> "$GITHUB_STEP_SUMMARY"
```

Motivazione: `$GITHUB_STEP_SUMMARY` è **cumulativo** all'interno di una run — ogni
`>>` di ogni step, in ogni job, si accoda allo stesso report finale — quindi non
c'è downside a scriverci lungo tutta la pipeline invece che in un solo posto. Il
vantaggio concreto è la diagnosi: se un job successivo fallisce (tipicamente
proprio un errore infrastrutturale come nel gotcha sul namespace `Terminating`
sotto), il summary mostra comunque tutto ciò che è stato **deciso e calcolato**
fino a quel punto — quali versioni, se client/server dovevano essere deployati,
quale immagine era stata risolta — senza dover aprire i log grezzi di ogni step
per ricostruirlo. Il job `summary` finale resta, ma come recap complessivo, non
come unica fonte di informazione.

## Insidie note (gotcha)

- **`kubectl` su k3s senza `KUBECONFIG` esplicito**: se `kubectl` è un symlink al
  binario di k3s, invocato senza `KUBECONFIG` risolve di default su
  `/etc/rancher/k3s/k3s.yaml` (proprietà `root:root`, `600`) — illeggibile da un
  utente non-root anche se `~/.kube/config` esiste ed è corretto per quell'utente.
  Fix: `export KUBECONFIG="$HOME/.kube/config"` esplicito all'inizio di ogni script
  che esegue `kubectl` via SSH.
- **Binari installati dallo script di bootstrap devono essere accessibili anche
  all'utente non-root usato dai workflow**: se lo script di bootstrap (qui
  `cloud-init.sh`) gira come root e installa un tool (qui: `helm`) in una directory
  utente (`~/bin`), quel tool non è visibile alle sessioni SSH successive che usano
  un utente diverso (qui: `deploy`, usato da tutti i workflow). Installarlo invece
  in un percorso di sistema (`/usr/local/bin`) risolve alla radice.
- **Immagini private su `ghcr.io`**: un package pushato per la prima volta da un
  workflow è **privato** di default. Senza un `imagePullSecrets` sul Deployment, i
  pod restano in `ImagePullBackOff`. Il Secret va creato con un **Personal Access
  Token dedicato** (`read:packages`), non con il `GITHUB_TOKEN` della run: quello è
  valido solo per la durata della pipeline, mentre i pod devono poter fare pull in
  qualunque momento futuro (restart, rischedulazione).
- **Due `Ingress` sullo stesso host/certificato**: client e server condividono lo
  stesso hostname pubblico mediante due `Ingress` k8s separati (uno per path). Solo
  **uno dei due** (`client/k8s/ingress.yaml`) porta l'annotation
  `cert-manager.io/cluster-issuer` — altrimenti cert-manager tenterebbe di gestire
  due `Certificate` per lo stesso secret e i due Ingress "litigherebbero". L'altro
  (`server/k8s/ingress.yaml`) referenzia lo stesso `secretName` TLS senza
  richiederlo lui stesso.
- **Nessun workflow sposta mai un tag Git esistente (niente `-f`/`--force`)**: sia
  `build-deploy.yml` (`register-client-tag`/`register-server-tag`) sia `tag.yml`
  creano sempre un tag **nuovo**, mai spostano quello vecchio — per tracciabilità:
  anche un deploy solo-manifest (nessun rebuild, solo `<scope>/k8s/*` cambiato)
  deve lasciare una propria voce nello storico, non sparire dentro il tag della
  run precedente — per questo il tag effimero `<scope>-main-*` è sempre nuovo
  (basato su data/ora, quindi univoco di suo), anche quando l'immagine Docker non
  cambia. Per lo stesso principio, `tag.yml` non sposta mai un tag di versione
  reale (`<scope>-vX.Y.Z`): se esiste già su un commit diverso da quello da
  promuovere, si ferma con un `::error::` esplicito (log + riga rossa nel job
  summary) — serve intervento umano: o si incrementa la versione in
  `<scope>/package.json` (nuovo tag, nessun conflitto — vale anche per un deploy
  solo-manifest: se cambi solo i manifest k8s e vuoi poi promuoverlo in
  produzione, la versione va comunque incrementata), o si cancella manualmente il
  tag vecchio (`git push origin :refs/tags/<tag> && git tag -d <tag>`) prima di
  rilanciare Tag.
- **`GITHUB_TOKEN` non può pushare un tag Git se `.github/workflows/` nel commit
  taggato non è identico all'ultimo commit di un branch**: non è una questione di
  `--force` (un tag **nuovo**, pushato senza `--force`, viene comunque rifiutato)
  né di "tag nuovo vs tag spostato" — GitHub rifiuta il push (`refusing to allow a
  GitHub App to create or update workflow ... without 'workflows' permission`, e
  nessuno scope `workflows` è assegnabile al token di default via `permissions:`)
  ogni volta che il contenuto di `.github/workflows/` nel commit di destinazione
  del tag differisce da quello della punta di un branch qualsiasi. `register-
  client-tag`/`register-server-tag` (in `build-deploy.yml`) non ci sbattono contro
  perché taggano sempre `HEAD` — cioè un commit che, per costruzione, coincide già
  con la punta di `main` in quel momento. `tag.yml` invece tagga l'ultimo
  `<scope>-main-*` **deployato**, che può essere un commit "vecchio": se nel
  frattempo `main` è avanzato e i file di workflow sono cambiati (comunissimo),
  il push del tag di versione reale fallisce sempre con `GITHUB_TOKEN`. Per
  questo `tag.yml` (solo lui) usa un PAT dedicato con scope `workflow`
  (`WORKFLOW_PAT`, non condiviso col PAT di GHCR — vedi sopra la gotcha sulle
  immagini private: quel token finisce in un Secret k8s persistito sul cluster,
  darne anche scope `workflow` esporrebbe la CI/CD a chi legge quel Secret).
- **Un workflow di deploy con input liberi rischia di deployare qualunque cosa**:
  `promote.yml` accetta `client_version`/`server_version` come stringhe libere —
  senza validazione, un typo o una versione mai taggata potrebbe fallire a metà
  deploy (o peggio, deployare un'immagine inesistente/sbagliata). Il job
  `validate` verifica che il tag `<scope>-v<versione>` esista davvero **prima** di
  chiamare i workflow di deploy.
- **`workflow_dispatch` non richiamabile finché il file del workflow non esiste sul
  branch di default**: GitHub registra un workflow (lo mostra nella tab Actions,
  abilita "Run workflow") solo quando il suo file YAML è presente sul branch di
  default del repo — anche se esiste già su un altro branch.
- **Un job che chiama un workflow riutilizzabile (`uses:`) non può avere anche
  `runs-on`/`steps` propri**: se serve uno step preliminare (qui: risolvere quale
  tag immagine deployare, o validare gli input), va in un job separato precedente
  (`resolve-client-image`/`resolve-server-image` in `build-deploy.yml`, `validate`
  in `promote.yml`), il cui output/risultato diventa la precondizione del job che
  chiama il workflow riutilizzabile.
- **`GITHUB_TOKEN` non triggera altri workflow** se usato per generare un evento
  `push` — per "restrizione anti ricorsione" di GitHub. Non si applica a un
  dispatch esplicito (`gh workflow run`), che funziona normalmente anche con il
  `GITHUB_TOKEN` della run (usato da `tag.yml` per triggerare
  `cleanup-build-tags.yml`).
- **Namespace bloccato in `Terminating` dopo un `kubectl delete namespace` manuale,
  e ripetere il delete non serve a nulla**: il namespace non è "in coda", è
  bloccato — una risorsa al suo interno ha un finalizer che non si completa mai
  (sospetti tipici: PVC il cui volume non si stacca, o una custom resource — es.
  `HTTPScaledObject` di KEDA — il cui controller non risponde più). Sintomo
  caratteristico: `infra.yml` non dà errore (sta solo aggiornando risorse
  **già esistenti**, un `apply`/update è permesso anche in un namespace
  Terminating), ma un deploy applicativo fallisce con
  `unable to create new content in namespace ... because it is being terminated`
  (creare un oggetto **nuovo**, tipicamente un Ingress già ripulito dal
  controller di terminazione, è invece bloccato). Fix: trova la risorsa con
  finalizer pendente (`kubectl get namespace k9 -o json | jq '.status.conditions'`,
  poi cerca `metadata.finalizers` non vuoto su PVC/CR nel namespace) e rimuovilo
  con `kubectl patch <kind> <nome> -n k9 --type=merge -p '{"metadata":{"finalizers":null}}'`.
  Se il namespace resta comunque bloccato, forza la rimozione del finalizer
  `kubernetes` sul namespace stesso via `/api/v1/namespaces/k9/finalize`.

## Workflow, uno per uno

### `infra.yml`

**Trigger**: manuale, con input `env` (tipo `environment`) e `install_headlamp`
(boolean, default `true`).

**Cosa fa**: applica in modo idempotente (`kubectl apply`, mai `create` puro)
l'infrastruttura di base: namespace, ghcr-secret, ConfigMap `k9-versions` (valori
iniziali), minio (storage immagini) + il suo secret, k9-notify-secret, CronJob
notify/images-gc, traefik-config, ClusterIssuer cert-manager, e opzionalmente
Headlamp. Non genera segreti casuali: i secret applicativi sono già GitHub Secrets
espliciti.

**Assunzioni**: presuppone che il cluster k8s di base (k3s + Traefik + cert-manager
+ KEDA) sia già stato provisionato **manualmente una volta** sulla VPS
(`scripts/cloud-init.sh`, non-CI, eseguito da un operatore con accesso root) —
questo workflow non crea il cluster, ci si appoggia sopra.

### `build-deploy.yml`

**Trigger**: push su `main`, o manuale con input `force_all` (booleano, default
`false`).

**`force_all`**: scavalca il diff e tratta entrambi gli scope come "codice +
manifest cambiati", quindi ribuilda e rideploya tutto. Serve quando lo stato del
cluster non è più deducibile dalla history dei commit — il caso tipico è un
namespace ricreato da zero: ConfigMap e Secret applicativi non esistono più, ma
per il diff "non è cambiato niente" e i job di deploy non girerebbero affatto.
Come ogni altra run che ribuilda, crea tag `<scope>-main-<data>` nuovi.

**Cosa fa**: per ciascuno scope (client, server) applica i pattern 2/3 — diff
condizionale, build solo se serve. Sequenza job: `versions` (diff + calcolo tag di
data) → `build-<scope>` (condizionale) → `resolve-<scope>-image` (determina quale
tag deployare) → `deploy-<scope>` (chiama il workflow riutilizzabile, pattern 4) →
`register-<scope>-tag` (ciclo di vita del tag, pattern 3) → `cleanup-registry`
(pulizia immagini Docker, mantiene le 3 più recenti per repository) → `summary`.

**Non tocca mai** l'infrastruttura di `infra.yml`, né la produzione.

### `deploy-client.yml` / `deploy-server.yml`

**Trigger**: solo `workflow_call` — non compaiono nella tab Actions come workflow
lanciabili direttamente.

**Cosa fanno**: vedi pattern 4. Input `environment` e `image_tag`; nessuna
conoscenza del chiamante.

### `tag.yml`

**Trigger**: manuale, nessun input.

**Cosa fa**: vedi pattern 5. Per ciascuno scope, risolve se serve una nuova
versione reale (o se è già stata assegnata), crea/sposta il tag e la GitHub
Release. **Non deploya.** Se almeno uno scope è stato promosso, triggera
`cleanup-build-tags.yml`.

### `promote.yml`

**Trigger**: manuale, con input `client_version`/`server_version` (entrambi
opzionali, ma almeno uno richiesto).

**Cosa fa**: vedi pattern 5. Valida che i tag di versione esistano, poi deploya in
produzione tramite `deploy-client.yml`/`deploy-server.yml`. **Non tagga, non crea
Release.** Sicuro da rilanciare più volte con lo stesso input.

### `cleanup-build-tags.yml`

**Trigger**: manuale, oppure automatico (fire-and-forget) a fine `tag.yml`. Input:
`scope` (opzionale: vuoto = entrambi, `client`/`server` per uno solo), `branch`
(opzionale: vuoto = tutti i branch), `preserve_latest` (default `true`) e
`dry_run` (default `true`).

**Cosa fa**: applica il pattern 6.

## Come adattarlo a un altro progetto

Checklist per portare questi pattern su un nuovo repo (o per riportare i pattern 4
e 5 su ClubManager):

1. Decidi gli **scope indipendenti** e colocaci dentro sia il codice sia i relativi
   manifest di deploy (pattern 2) — evita cartelle di manifest centralizzate
   condivise tra scope diversi.
2. Crea gli **Environment GitHub** che ti servono e decidi quali workflow vi si
   agganciano fissi e quali lo scelgono a runtime (pattern 1).
3. Estrai la logica di deploy (render manifest, copia, apply, rollout) in un
   **workflow riutilizzabile per scope** (`workflow_call` con input `environment` e
   `image_tag`, pattern 4) — anche se oggi hai un solo punto che deploya: nel
   momento in cui ne servirà un secondo (promozione, rollback manuale, un secondo
   ambiente), la duplicazione va evitata da subito.
4. Nel workflow di build/deploy, implementa il diff condizionale per scope
   (pattern 2) e lo schema di tag `<scope>-<branch>-<data>` sempre creato ex-novo
   ad ogni deploy riuscito, mai spostato (pattern 3), tenendo il ciclo di vita del
   tag **fuori** dal workflow riutilizzabile di deploy.
5. Se il progetto ha un ambiente di produzione fisico separato, **separa
   versioning e deploy in due workflow distinti** (pattern 5): uno decide/tagga la
   versione (nessun `run_id`/lookup di run specifica: legge sempre l'ultimo tag
   `<scope>-<branch-produzione>-*` per ciascuno scope indipendentemente), l'altro
   riceve la versione come input esplicito e deploya soltanto, validando che il
   tag esista prima di procedere.
6. Aggiungi un workflow di pulizia separato, mai auto-triggerato se i tag non sono
   usa-e-getta (pattern 6).
7. Per addon di infra opzionali (dashboard, tool di debug), usa un input booleano
   con default che preserva il comportamento attuale (pattern 7), invece di
   baked-in nello script di bootstrap del cluster.
8. Scrivi su `$GITHUB_STEP_SUMMARY` subito dopo ogni step che decide o calcola
   qualcosa di rilevante, non solo in un job `summary` finale (pattern 8) — è
   cumulativo, non c'è downside, e salva tempo di debug quando un job successivo
   fallisce.
9. Rivedi la lista delle [insidie note](#insidie-note-gotcha): quasi tutte si
   presentano identiche su qualunque stack k3s + GHCR + GitHub Actions,
   indipendentemente dal linguaggio/framework applicativo.
