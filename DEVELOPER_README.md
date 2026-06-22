# K9 Exercise — Developer Guide

Guida tecnica per chi lavora sul codice o deve rimettere in piedi l'infrastruttura.
Per la descrizione del progetto e il setup produzione completo vedere [README.md](README.md).

---

## Indice

1. [Setup locale](#setup-locale)
2. [Struttura progetto](#struttura-progetto)
3. [Conventional commits e versioning automatico](#conventional-commits-e-versioning-automatico)
4. [CI/CD pipeline](#cicd-pipeline)
5. [Deploy in produzione](#deploy-in-produzione)
6. [Sistema di notifiche](#sistema-di-notifiche)
7. [Comandi pulizia registry git](#Comandi-pulizia-registry-git)
8. [Integrazione con WordPress](#integrazione-con-wordpress)

---

## Setup locale

**Prerequisiti**: Node.js 24+, Docker

```bash
# 1. Copia le variabili d'ambiente
cp .env.example .env
# Modifica MONGODB_URI, SESSION_SECRET ecc. nel file .env

# 2. Avvia MongoDB locale con replica set
docker compose -f local/docker-compose.yml up -d

# 3. Server (porta 3001)
cd server && npm install && npm run dev

# 4. Client (porta 5173) — in un altro terminale
cd client && npm install && npm run dev
```

### Testare la modalità `LOGIN_TYPE=token`

Per simulare localmente il flusso WordPress senza un sito WP reale:

**1. Configurare il `.env`:**

```env
LOGIN_TYPE=token
VITE_LOGIN_TYPE=token
K9_JWT_SECRET=dev-jwt-secret-change-in-prod
```

**2. Avviare server e client** come sopra (il client mostrerà la pagina "accedi da WordPress" al posto del form).

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
│   └── src/
│       ├── components/ # Componenti UI (Admin, AppBar, ExerciseTable, Insert, View…)
│       └── ...
├── server/             # Express + TypeScript
│   └── src/
│       ├── models/     # Schema Mongoose (Exercise, ExerciseChange, User)
│       │               # Exercise e User hanno il campo lastNotifiedAt (Date)
│       ├── routes/     # API REST: exercises (incl. /to-approve, /approve-new, /reject-new), auth, notify
│       └── middleware/ # requireAuth, requireDbReady
├── k8s/                # Manifest Kubernetes
│   ├── client/         # Deployment + Service nginx
│   ├── server/         # Deployment + Service + HTTPScaledObject KEDA
│   ├── notify/         # CronJob notifiche (curlimages/curl)
│   ├── namespace.yaml
│   ├── ingress.yaml    # Traefik ingress (usa ${DOMAIN})
│   └── keda-interceptor-svc.yaml
├── bruno/              # Collezione Bruno per test API
│   ├── environments/   # development.bru, production.bru
│   └── notify/         # trigger notify.bru
├── scripts/
│   ├── cloud-init.sh   # Inizializzazione VPS (k3s, KEDA, dashboard)
│   └── docker-lock.sh  # Rigenera package-lock.json su linux/amd64
├── local/
│   └── docker-compose.yml  # MongoDB locale con replica set
└── .github/workflows/
    ├── deploy.yml      # CI/CD: build, versioning, deploy
    └── promote.yml     # Promozione staging → production
```

---

## Conventional commits e versioning automatico

La GitHub Action calcola il tipo di bump dalla commit message e i tag vengono creati e pushati automaticamente.

### Formato commit

```
<tipo>(<scope>): <descrizione>

[body opzionale]
```

### Regole di bump

| Commit | Bump | Esempio |
|--------|------|---------|
| `tipo!:` oppure `BREAKING CHANGE` nel body | **major** | `feat!: nuovo schema autenticazione` |
| `feat:` | **minor** | `feat(client): filtro per difficoltà` |
| Tutto il resto (`fix`, `chore`, `docs`, ...) | **patch** | `fix(server): gestione errore 404` |

### Scope e tag generati

La action analizza quali cartelle sono cambiate nella commit e crea i tag di conseguenza:

| File modificati | Tag creato | Package.json bumped |
|----------------|------------|---------------------|
| `client/**` | `client-X.Y.Z` | `client/package.json` |
| `server/**` | `server-X.Y.Z` | `server/package.json` |
| `k8s/**` | `k8s-X.Y.Z` | `package.json` (root) |

Gli scope sono **indipendenti**: una commit che tocca `client/` e `k8s/` genera entrambi i tag.
Solo le modifiche a `client/` o `server/` triggerano un build Docker e deploy sul cluster.

---

## CI/CD pipeline

Ogni push su `main` esegue la GitHub Action `.github/workflows/deploy.yml`:

```
push su main
    │
    ▼
Analyze commit
    │  rileva scope (client/server/k8s) e bump type
    │
    ▼
Bump versions + tag
    │  aggiorna package.json, crea tag annotati, push con --follow-tags
    │
    ▼
Build Docker  ←─ solo se client o server sono cambiati
    │  docker/build-push-action → ghcr.io/<owner>/k9-{client,server}:<version>
    │
    ▼
Deploy su k3s  ←─ solo se client o server sono cambiati
    │  scp manifest → ssh kubectl apply → rollout status
    │
    ▼
Job summary  ←─ sempre (anche se step precedenti falliscono)
```

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

| Nome | Descrizione |
|------|-------------|
| `VPS_HOST` | IP del VPS |
| `VPS_SSH_KEY` | Chiave privata SSH (`~/.ssh/k9_deploy`) — non il `.pub` |
| `MONGODB_URI` | Stringa di connessione MongoDB Atlas |
| `SESSION_SECRET` | Stringa random — `openssl rand -hex 32` |
| `GHCR_PAT` | Personal Access Token GitHub con scope `read:packages` ¹ |
| `NOTIFY_API_KEY` | Token per autenticare il CronJob sulla route `/api/admin/notify` ² |
| `SMTP_PASS` | Password SMTP / App Password Gmail ³ |
| `K9_JWT_SECRET` | Segreto condiviso con WordPress per firmare/verificare il JWT — `openssl rand -base64 32` ⁴ |

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

#### Variables

| Nome | Valore esempio | Descrizione |
|------|---------------|-------------|
| `VPS_USER` | `deploy` | Utente SSH sul VPS (creato da cloud-init) |
| `DOMAIN` | `k9.tuodominio.com` | Dominio per ingress e KEDA HTTPScaledObject |
| `AUTH_ENABLED` | `true` | Abilita/disabilita autenticazione nel server |
| `LOGIN_TYPE` | `form` | Modalità di login: `form` (email+password) \| `token` (redirect JWT da WordPress). Usata dal server a runtime e passata dalla Action come build-arg `VITE_LOGIN_TYPE` al Dockerfile del client |
| `LETSENCRYPT_EMAIL` | `tua@email.com` | Email per la registrazione ACME Let's Encrypt (riceve avvisi di scadenza) |
| `VITE_ENABLE_WITH_OPERATION_FILTER` | `false` | Feature flag baked nel bundle React al build |
| `SMTP_HOST` | `smtp.gmail.com` | Host SMTP per le notifiche email |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | `tuagmail@gmail.com` | Indirizzo email mittente |
| `NOTIFY_RECIPIENTS` | `a@esempio.com,b@esempio.com` | Destinatari notifiche, separati da virgola |

---

## Deploy in produzione

Per il setup completo dell'infrastruttura (VPS Hetzner, DNS, HTTPS, scaling) vedere [README.md](README.md).

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
| 1 | Aggiornamento sistema + installazione `curl`, `gettext-base` |
| 2 | Creazione utente `deploy` (SSH e kubectl senza root) |
| 3 | Installazione k3s (Kubernetes + Traefik + CoreDNS) |
| 4 | Installazione KEDA (controller autoscaling) |
| 5 | Installazione KEDA HTTP Add-on (scaling su richieste HTTP) |
| 6 | Installazione Kubernetes Dashboard |

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

Poi imposta la Variable `DOMAIN` su GitHub con il sottodominio completo (es. `k9.tuodominio.com`) e fai push — il deploy applica la modifica automaticamente tramite `envsubst`.

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

Al prossimo push, la GitHub Action applica automaticamente:
- Il `ClusterIssuer` letsencrypt-prod (da `k8s/cert-manager/clusterissuer.yaml`)
- L'ingress aggiornato con TLS e entrypoint `web,websecure`

Il certificato viene emesso da cert-manager in ~1-2 minuti tramite sfida HTTP-01. Puoi monitorare:

```bash
kubectl get certificate -n k9         # Ready: True quando il cert è emesso
kubectl describe certificate k9-tls -n k9   # dettaglio eventi
```

**HTTP → HTTPS redirect** (opzionale, dopo che il certificato è attivo):

Aggiorna `k8s/traefik-config.yaml` aggiungendo:
```yaml
    ports:
      web:
        redirectTo:
          port: websecure
```

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

### Kubernetes Dashboard (accesso locale)

```bash
# 1. Sul VPS — avvia proxy (lascialo girare)
ssh -i ~/.ssh/k9_deploy deploy@<IP_VPS>
kubectl proxy --address='127.0.0.1' --port=8001 &

# 2. Sul tuo PC — apri tunnel SSH
ssh -i ~/.ssh/k9_deploy -L 8001:localhost:8001 -N deploy@<IP_VPS>

# 3. Browser
# http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

# 4. Genera il token di accesso (scade dopo 1h)
kubectl create token dashboard-admin -n kubernetes-dashboard
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
CronJob (k8s/notify/cronjob.yaml)
    │  ogni ora dalle 6:00 alle 21:00
    ▼
POST /api/admin/notify
    │  Authorization: Bearer $NOTIFY_API_KEY
    │
    ▼
Server controlla:
  • User  con state=TO_APPROVE     e lastNotifiedAt < oggi
  • Exercise con state=TO_APPROVE  e lastNotifiedAt < oggi
  • Exercise con state=PENDING_UPDATE e lastNotifiedAt < oggi
    │
    ├─ nessun nuovo elemento → risposta { sent: false }, nessuna email
    │
    └─ elementi nuovi → segna lastNotifiedAt=now su tutti i documenti trovati
                      → invia email via SMTP ai NOTIFY_RECIPIENTS
```

### Campo `lastNotifiedAt`

Presente sia su `User` che su `Exercise`. Viene:
- **Impostato** a `now` dal server quando l'elemento viene incluso in una notifica
- **Azzerato** (`$unset`) quando un esercizio torna in stato `APPROVED` (approvazione o rifiuto modifica), in modo che una modifica successiva nella stessa giornata venga re-notificata

### Schedule

`0 6,9,12,15,18,21 * * *` — ogni 3 ore dalle 6:00 alle 21:00.

Per cambiare la frequenza modificare il campo `schedule` in `k8s/notify/cronjob.yaml` e fare push.

### Variabili e secret richiesti

Già documentati nella sezione [Secrets e Variables richiesti](#secrets-e-variables-richiesti):
- Secret: `NOTIFY_API_KEY`, `SMTP_PASS`
- Variable: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `NOTIFY_RECIPIENTS`

### Test con Bruno

La collection Bruno in `bruno/` permette di chiamare l'endpoint manualmente:

1. Apri Bruno e importa la cartella `bruno/`
2. Seleziona l'ambiente (`development` o `production`)
3. Inserisci il valore di `notifyApiKey` nella colonna **Secret** dell'ambiente (non viene salvato su disco)
4. Esegui la request **trigger notify** nel folder `notify/`

---

## Integrazione con WordPress

Permette di delegare l'autenticazione a WordPress: WP genera un JWT firmato e l'app Node lo valida per creare la sessione. La modalità di login è selezionabile tramite variabile d'ambiente (`LOGIN_TYPE`).

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
# Modalità di login: "form" (email+password) | "token" (redirect JWT da WordPress)
LOGIN_TYPE=token
VITE_LOGIN_TYPE=token          # deve coincidere con LOGIN_TYPE

# Segreto condiviso tra WordPress e app — deve coincidere con wp-config.php
# Generare con: openssl rand -base64 32
K9_JWT_SECRET=stringa-lunga-e-casuale
```

| `LOGIN_TYPE` | Comportamento server | Comportamento client |
|---|---|---|
| `form` (default) | `/login` e `/register` abilitati, `/wp-callback` restituisce 404 | Pagina login con form email+password |
| `token` | `/wp-callback` abilitato, `/login` e `/register` restituiscono 404 | Pagina login con messaggio "accedi da WordPress" |

> `AUTH_ENABLED=false` bypassa tutto per uso in sviluppo locale, indipendentemente da `LOGIN_TYPE`.

---

### Parte 1 — Configurazione WordPress

#### 1.1 Libreria JWT per PHP

```bash
composer require firebase/php-jwt
```

Oppure includere il file singolo dalla release ufficiale: https://github.com/firebase/php-jwt

#### 1.2 Controllo accesso e ruoli tramite user meta

Per ogni utente WP che deve accedere all'app, impostare due campi meta (gestibili dalla pagina **Utenti → Modifica** grazie al codice del §1.4):

| Meta key | Valori | Significato |
|---|---|---|
| `k9_app_access` | `1` / `0` | L'utente può accedere all'app |
| `k9_app_role` | `viewer` / `admin` | Ruolo all'interno dell'app |

Il ruolo WP (administrator, editor, subscriber…) è indipendente dal ruolo app.

#### 1.3 Funzione di redirect con JWT

In `functions.php` o in un plugin custom:

```php
use Firebase\JWT\JWT;

function k9_redirect_to_app() {
    if ( ! is_user_logged_in() ) {
        wp_redirect( wp_login_url( home_url('/k9-app') ) );
        exit;
    }

    $user = wp_get_current_user();

    // Controlla se l'utente WP è abilitato all'accesso all'app
    $has_access = get_user_meta( $user->ID, 'k9_app_access', true );
    if ( ! $has_access ) {
        wp_redirect( home_url('/no-access') ); // pagina "non autorizzato" su WP
        exit;
    }

    $role      = get_user_meta( $user->ID, 'k9_app_role', true ) ?: 'viewer';
    $secret    = defined('K9_JWT_SECRET') ? K9_JWT_SECRET : 'fallback-dev-secret';
    $issued_at = time();

    $payload = [
        'iat'   => $issued_at,
        'exp'   => $issued_at + 300, // token valido 5 minuti
        'email' => $user->user_email,
        'role'  => $role,
    ];

    $token = JWT::encode( $payload, $secret, 'HS256' );

    wp_redirect( 'https://app.miodominio.com/api/auth/wp-callback?token=' . urlencode($token) );
    exit;
}

add_action( 'template_redirect', function() {
    if ( isset($_GET['k9_redirect']) ) {
        k9_redirect_to_app();
    }
});
```

Link da esporre agli utenti nel menu WP:

```
https://miodominio.com/?k9_redirect=1
```

#### 1.4 Campi meta nella pagina profilo utente WP

Aggiunge i controlli "Accesso K9 App" e "Ruolo nell'app" nella pagina **Utenti → Modifica** (visibili solo agli amministratori WP):

```php
add_action( 'show_user_profile', 'k9_user_profile_fields' );
add_action( 'edit_user_profile', 'k9_user_profile_fields' );

function k9_user_profile_fields( WP_User $user ) {
    if ( ! current_user_can('edit_users') ) return;
    $has_access = get_user_meta( $user->ID, 'k9_app_access', true );
    $role       = get_user_meta( $user->ID, 'k9_app_role', true ) ?: 'viewer';
    ?>
    <h3>K9 App — Accesso</h3>
    <table class="form-table">
        <tr>
            <th>Abilita accesso K9 App</th>
            <td>
                <input type="checkbox" name="k9_app_access" value="1"
                    <?php checked( $has_access, '1' ); ?> />
            </td>
        </tr>
        <tr>
            <th>Ruolo nell'app</th>
            <td>
                <select name="k9_app_role">
                    <option value="viewer" <?php selected( $role, 'viewer' ); ?>>Viewer</option>
                    <option value="admin"  <?php selected( $role, 'admin'  ); ?>>Admin</option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

add_action( 'personal_options_update',  'k9_save_user_profile_fields' );
add_action( 'edit_user_profile_update', 'k9_save_user_profile_fields' );

function k9_save_user_profile_fields( int $user_id ) {
    if ( ! current_user_can('edit_user', $user_id) ) return;
    update_user_meta( $user_id, 'k9_app_access', isset($_POST['k9_app_access']) ? '1' : '0' );
    update_user_meta( $user_id, 'k9_app_role', sanitize_text_field($_POST['k9_app_role'] ?? 'viewer') );
}
```

#### 1.5 Segreto condiviso in `wp-config.php`

```php
define( 'K9_JWT_SECRET', 'stringa-lunga-e-casuale-identica-a-quella-nel-env-app' );
```

---

### Parte 2 — App Node.js (già implementato)

Le seguenti modifiche sono già presenti nel codice:

- `jsonwebtoken` installato come dipendenza del server
- Route `GET /api/auth/wp-callback` in `server/src/routes/auth.ts`: valida il JWT, crea `req.session.user = { email, role }` e fa redirect a `/`
- Route `/login` e `/register` restituiscono 404 quando `LOGIN_TYPE=token`
- La pagina `/login` lato client mostra un messaggio informativo (niente form) quando `VITE_LOGIN_TYPE=token`

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

Aprire l'URL nel browser: se il server è in esecuzione con `LOGIN_TYPE=token` e `K9_JWT_SECRET` configurato, l'app crea la sessione e fa redirect a `/`.

#### 3.2 Verifica manuale

```bash
# Avviare il server con la configurazione token
LOGIN_TYPE=token K9_JWT_SECRET=test-secret node scripts/generate-wp-token.mjs
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

Dopo aver installato gh ed eseguito la login con questo comando si eliminano tutte le immagini che non hanno tag

```bash
PAGER=cat; PACKAGE="k9-server"; gh api "/user/packages/container/$PACKAGE/versions" --paginate \
  | jq -r '.[] | select(.metadata.container.tags | length == 0) | .id' \
  | while read -r id; do
      echo "Deleting version $id"
      gh api -X DELETE "/user/packages/container/$PACKAGE/versions/$id"
    done
```
