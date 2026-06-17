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
6. [Integrazione con WordPress](#integrazione-con-wordpress)
7. [TODO](#todos)

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

---

## Struttura progetto

```
k9-exercise/
├── client/             # React + Vite (SPA)
│   └── src/
│       ├── components/ # Componenti UI
│       └── ...
├── server/             # Express + TypeScript
│   └── src/
│       ├── models/     # Schema Mongoose (Exercise, ExerciseChange, User)
│       ├── routes/     # API REST (exercises, auth)
│       └── middleware/ # requireAuth, requireDbReady
├── k8s/                # Manifest Kubernetes
│   ├── client/         # Deployment + Service nginx
│   ├── server/         # Deployment + Service + HTTPScaledObject KEDA
│   ├── namespace.yaml
│   ├── ingress.yaml    # Traefik ingress (usa ${DOMAIN})
│   └── keda-interceptor-svc.yaml
├── scripts/
│   └── cloud-init.sh   # Inizializzazione VPS (k3s, KEDA, dashboard)
├── local/
│   └── docker-compose.yml  # MongoDB locale con replica set
└── .github/workflows/
    └── deploy.yml      # CI/CD: build, versioning, deploy
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

#### Variables

| Nome | Valore esempio | Descrizione |
|------|---------------|-------------|
| `VPS_USER` | `deploy` | Utente SSH sul VPS (creato da cloud-init) |
| `DOMAIN` | `k9.tuodominio.com` | Dominio per ingress e KEDA HTTPScaledObject |
| `AUTH_ENABLED` | `true` | Abilita/disabilita autenticazione nel server |
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

## Integrazione con WordPress

Permette di delegare l'autenticazione a WordPress: WP genera un JWT firmato e l'app Node lo valida per creare la sessione. La login nativa dell'app può essere disabilitata completamente.

### Flusso

```
Utente → WordPress (login) → genera JWT → redirect ?token=...
                                                    │
                                                    ▼
                                          App Node: valida JWT
                                          crea sessione cookie
                                          redirect / (URL pulito)
                                                    │
                                                    ▼
                                          App React (usa sessione)
```

Il token nell'URL è **usa e getta**: serve solo per l'handshake iniziale.

---

### Parte 1 — Configurazione WordPress

#### 1.1 Libreria JWT per PHP

```bash
composer require firebase/php-jwt
```

Oppure includere il file singolo dalla release ufficiale: https://github.com/firebase/php-jwt

#### 1.2 Generare il JWT al redirect

In `functions.php` o in un plugin custom:

```php
use Firebase\JWT\JWT;

function k9_redirect_to_app() {
    if ( ! is_user_logged_in() ) {
        wp_redirect( wp_login_url( home_url('/k9-app') ) );
        exit;
    }

    $user      = wp_get_current_user();
    $secret    = defined('K9_JWT_SECRET') ? K9_JWT_SECRET : 'fallback-dev-secret';
    $issued_at = time();

    $payload = [
        'iat'   => $issued_at,
        'exp'   => $issued_at + 300, // token valido 5 minuti
        'email' => $user->user_email,
        'role'  => k9_get_role( $user ),
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

#### 1.3 Mapping ruoli WP → ruoli app

```php
function k9_get_role( WP_User $user ): string {
    if ( in_array('administrator', $user->roles) || in_array('editor', $user->roles) ) {
        return 'admin';
    }
    return 'viewer';
}
```

#### 1.4 Segreto condiviso in `wp-config.php`

```php
define( 'K9_JWT_SECRET', 'stringa-lunga-e-casuale-identica-a-quella-nel-env-app' );
```

---

### Parte 2 — Modifiche all'app Node.js

#### 2.1 Variabile d'ambiente

Nel file `.env`:

```
K9_JWT_SECRET=stringa-lunga-e-casuale-identica-a-quella-in-wp-config
```

Installa la libreria JWT:

```bash
cd server
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

#### 2.2 Route `/api/auth/wp-callback`

In `server/src/routes/auth.ts`:

```typescript
import jwt from "jsonwebtoken";

// GET /api/auth/wp-callback?token=<JWT>
router.get("/wp-callback", (req: Request, res: Response): void => {
    const { token } = req.query as { token?: string };

    if (!token) {
        res.status(400).send("Token mancante");
        return;
    }

    const secret = process.env.K9_JWT_SECRET;
    if (!secret) {
        console.error("[wp-callback] K9_JWT_SECRET non configurato");
        res.status(500).send("Configurazione server mancante");
        return;
    }

    try {
        const payload = jwt.verify(token, secret) as {
            email: string;
            role: string;
        };

        req.session.user = { email: payload.email, role: payload.role };
        res.redirect("/");
    } catch (err) {
        console.error("[wp-callback] token non valido:", err);
        res.status(401).send("Token non valido o scaduto");
    }
});
```

#### 2.3 Disabilitare la login nativa (opzionale)

```env
AUTH_ENABLED=false
```

Con questa impostazione la pagina `/login` non è raggiungibile. La route `/api/auth/wp-callback` funziona indipendentemente da `AUTH_ENABLED`.

---

### Parte 3 — Test dell'integrazione

1. **Locale**: avviare il server con `K9_JWT_SECRET` nel `.env` e generare un token di test:

```bash
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { email: 'test@esempio.com', role: 'admin' },
  process.env.K9_JWT_SECRET,
  { expiresIn: '5m' }
);
console.log('http://localhost:3001/api/auth/wp-callback?token=' + token);
" 
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
| **Rimuovere `ADMIN_SEED_*` dal `.env`** | Dopo il primo avvio eliminare o commentare le variabili di seed |
| **Rate limiting su `/api/auth/login`** | Aggiungere `express-rate-limit` per prevenire brute-force |
| **Token one-time (opzionale)** | WP salva il token in DB e lo invalida dopo il primo uso |

---

## TODOs

- redesign pagina admin per cell
- pannello admin per approvazione user (introdurre rejected)
- pannello admin per approve esercizi nuovi
- nome cognome alla registrazione?
- Rate limiting su `/api/auth/login` per prevenire brute-force
- indagare retention immagini docker. Idea: tag versione+latest-test ogni build. Nuova action che sposta tag production su versione portata in prod e mette prev-prod su quella che era prod.
