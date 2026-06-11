# K9 Exercise Database

Database di esercizi per il cross-training cinofilo. Permette di consultare, filtrare e gestire un catalogo strutturato di esercizi per cani, organizzati per tipologia, difficoltà, attrezzi necessari, area di lavoro e target corporeo.

**Stack**: React + Vite (client) · Express + TypeScript (server) · MongoDB Atlas

**Funzionalità principali**:
- Catalogo esercizi con filtri multipli e visualizzazione a tabella
- Pannello admin per aggiungere, modificare e approvare esercizi con diff visuale delle modifiche proposte
- Autenticazione nativa con ruoli `viewer` / `admin`, integrabile con WordPress via JWT
- Autoscaling automatico del server in base al traffico HTTP (KEDA su Kubernetes)

---

## TODO'S

- script batch schedulato per segnalare nuovi utenti e esercizi
- versione server su frontend. Spostare in una modale da menu info

## Set up local env

**Prerequisiti**: Node.js 22+, Docker

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

## Automatic versioning from github action

La action github configurata crea tag automaticamente in base al bump type (calcolato con conventional commit) allo scope della commit. Anche build e deploy seguono bump e scope.
```

---

## Deploy in produzione

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

Il client nginx è una replica fissa: gestisce 10.000+ connessioni concorrenti
con ~50 MB di RAM, non è mai il collo di bottiglia. Solo il server scala.

---

### Configurazione VPS (Hetzner Cloud)

#### 1. Generazione chiave SSH

La stessa coppia di chiavi serve per due cose:
- La chiave **pubblica** → Hetzner (per autenticarti sul VPS)
- La chiave **privata** → GitHub Secret `VPS_SSH_KEY` (per permettere alla Action di fare SSH sul VPS)

```
┌──────────────┐    chiave pubblica     ┌─────────────┐
│  Il tuo PC   │ ──────────────────────▶│   Hetzner   │
│              │                        │     VPS     │
│  chiave      │    chiave privata      │             │
│  privata     │ ──────────────────────▶│  GitHub     │
│              │    (GitHub Secret)     │  Action     │
└──────────────┘                        └─────────────┘
```

**Su Windows** (PowerShell o Git Bash):

```powershell
# Genera la coppia di chiavi — premi Invio a tutte le domande
# (lascia la passphrase vuota: la Action non può inserirla)
ssh-keygen -t ed25519 -C "k9-deploy" -f "$env:USERPROFILE\.ssh\k9_deploy"

# Mostra la chiave PUBBLICA (da copiare su Hetzner)
Get-Content "$env:USERPROFILE\.ssh\k9_deploy.pub"

# Mostra la chiave PRIVATA (da copiare nel segreto GitHub VPS_SSH_KEY)
Get-Content "$env:USERPROFILE\.ssh\k9_deploy"
```

**Su macOS / Linux:**

```bash
ssh-keygen -t ed25519 -C "k9-deploy" -f ~/.ssh/k9_deploy

cat ~/.ssh/k9_deploy.pub   # → Hetzner
cat ~/.ssh/k9_deploy        # → GitHub Secret VPS_SSH_KEY
```

Vengono creati due file:
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
5. Crea un **Firewall** e apri solo le regole **inbound**:

   | Porta | Protocollo | Sorgente | Scopo |
   |-------|------------|----------|-------|
   | 22 | TCP | Il tuo IP | SSH |
   | 80 | TCP | Any | HTTP |
   | 443 | TCP | Any | HTTPS |

   > Le regole **outbound non servono**: Hetzner non filtra il traffico in
   > uscita dal VPS. Il server può connettersi liberamente a MongoDB Atlas
   > e a qualsiasi altro servizio esterno.

6. **MongoDB Atlas — IP Access List**: Atlas ha il proprio firewall che blocca
   tutto di default. Aggiungi l'IP del VPS alla whitelist altrimenti il server
   non riuscirà a connettersi al database:
   - Apri il progetto su [cloud.mongodb.com](https://cloud.mongodb.com)
   - **Network Access → Add IP Address**
   - Inserisci l'IP del VPS Hetzner
   - Clicca **Confirm**

   > Se in futuro aggiungi un secondo nodo al cluster k3s, ricorda di aggiungere
   > anche il suo IP alla whitelist Atlas.

#### 2. Inizializzazione automatica con cloud-init

Hetzner permette di incollare uno script nel campo **"User data"** durante
la creazione del server. Lo script viene eseguito automaticamente al primo
avvio — nessun intervento manuale necessario.

Lo script si trova in `scripts/cloud-init.sh` nel repository.
Copiane il contenuto e incollalo nel campo "User data" su Hetzner.

**Cosa fa lo script:**

| Step | Operazione |
|------|-----------|
| 1 | Aggiornamento sistema + installazione `curl`, `gettext-base` |
| 2 | Creazione utente `deploy` (SSH e kubectl senza root) |
| 3 | Installazione k3s (Kubernetes + Traefik + CoreDNS) |
| 4 | Installazione KEDA (controller autoscaling) |
| 5 | Installazione KEDA HTTP Add-on (scaling su richieste HTTP) |
| 6 | Installazione Kubernetes Dashboard (UI per pod, risorse, log) |

Al termine, lo script scrive `/opt/k9/.init-complete` come marker di completamento
e stampa i prossimi passi nel log `/var/log/k9-init.log`.

**Verifica dopo il primo avvio** (attendi 3-5 minuti, poi):

```bash
ssh root@<IP_VPS>

# Controlla che lo script sia terminato
cat /opt/k9/.init-complete   # deve esistere

# Verifica il cluster
kubectl get nodes             # STATUS: Ready
kubectl get pods -A           # tutti i pod Running
```

> Se preferisci eseguire lo script manualmente su un server già avviato:
> ```bash
> bash scripts/cloud-init.sh
> ```

#### 3. Configurazione dominio

Il dominio è gestito tramite la GitHub Variable `DOMAIN` (vedere sezione successiva).
Non serve modificare i file YAML manualmente: la GitHub Action sostituisce
`${DOMAIN}` in `k8s/ingress.yaml` e `k8s/server/hso.yaml` ad ogni deploy.

Aggiungi un record DNS sul tuo provider (es. Route 53 su AWS):

| Tipo | Nome | Valore |
|------|------|--------|
| `A` | `k9` (o il sottodominio che preferisci) | IP del VPS Hetzner |

Poi imposta la Variable `DOMAIN` su GitHub con il sottodominio completo
(es. `k9.tuodominio.com`) e fai push — il deploy applica la modifica automaticamente.

#### 4. HTTPS con cert-manager (opzionale)

```bash
# Installa cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.16.0/cert-manager.yaml

# Crea ClusterIssuer per Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: tua@email.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: traefik
EOF
```

Poi aggiungi in `k8s/ingress.yaml`:
```yaml
annotations:
  cert-manager.io/cluster-issuer: letsencrypt-prod
  traefik.ingress.kubernetes.io/router.entrypoints: websecure
```

---

### GitHub Actions — Segreti e variabili

Vai su **GitHub → Settings → Secrets and variables → Actions**.

#### Secrets (valori sensibili — cifrati, non visibili nei log)

| Nome | Valore | Note |
|------|--------|------|
| `VPS_HOST` | `178.105.245.252` | IP del VPS Hetzner |
| `VPS_USER` | `deploy` | Utente SSH creato da cloud-init |
| `VPS_SSH_KEY` | Contenuto di `~/.ssh/k9_deploy` | Chiave **privata** — non il `.pub` |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/k9` | Stringa connessione Atlas |
| `SESSION_SECRET` | Output di `openssl rand -hex 32` | Stringa random per le sessioni |
| `GHCR_PAT` | Personal Access Token GitHub | Serve al VPS per fare pull delle immagini ¹ |

> ¹ **Come creare il GHCR_PAT**: GitHub → foto profilo → **Settings** (del profilo, non del repo)
> → in fondo a sinistra → **Developer settings** → **Personal access tokens → Tokens (classic)**
> → **Generate new token** → spunta solo `read:packages` → copia il token generato.
>
> `GITHUB_TOKEN` (usato per il push delle immagini nella Action) è automatico — non va configurato.

#### Variables (valori non sensibili — visibili nei log di build)

| Nome | Valore | Effetto |
|------|--------|---------|
| `DOMAIN` | `k9.tuodominio.com` | Dominio per ingress Traefik e KEDA HTTPScaledObject |
| `AUTH_ENABLED` | `true` | Abilita/disabilita autenticazione nel server Node.js |
| `VITE_ENABLE_WITH_OPERATION_FILTER` | `true` / `false` | Feature flag baked nel bundle React al momento del build |

> **Secrets vs Variables**: i Secrets sono cifrati e mascherati nei log.
> Le Variables sono in chiaro — usarle solo per valori non sensibili come feature flag e domini.

---

### Deploy e rollback

**Deploy automatico**: ogni push su `main` avvia la Action che:
1. Legge le versioni da `server/package.json` e `client/package.json`
2. Build immagini Docker (linux/amd64)
3. Push su `ghcr.io` con tag versione (es. `k9-server:1.1.0`)
4. Applica i manifest k8s sul VPS con `kubectl`
5. Attende il completamento del rollout

**Rollback**:
```bash
# Torna al deploy precedente (Kubernetes mantiene la history)
kubectl rollout undo deployment/k9-server -n k9
kubectl rollout undo deployment/k9-client -n k9

# Torna a una revisione specifica
kubectl rollout history deployment/k9-server -n k9   # vedi lista revisioni
kubectl rollout undo deployment/k9-server -n k9 --to-revision=2

# Rollback a un tag specifico
kubectl set image deployment/k9-server \
  server=ghcr.io/<owner>/k9-server:1.0.0 -n k9
```

---

### Scaling

#### Autoscaling server (KEDA HTTP)

Il server scala da 1 a 4 pod in base alle richieste `/api` in coda.
Parametri in `k8s/server/hso.yaml`:

| Parametro | Default | Significato |
|-----------|---------|-------------|
| `targetPendingRequests` | `100` | Richieste in attesa per replica che triggerano un nuovo pod |
| `scaledownPeriod` | `300` | Secondi di traffico basso prima di ridurre i pod |
| `replicas.min` | `1` | Pod sempre attivi — nessun cold start |
| `replicas.max` | `4` | Massimo 4 × 0.5 CPU = 2 vCPU totali (CAX11/CX22) |

#### Scaling verticale (resize VPS)

Da Hetzner Cloud Console: **Server → Rescale → piano superiore**.
Richiede reboot (~2 minuti di downtime).

#### Scaling orizzontale (secondo nodo)

```bash
# Sul VPS principale — recupera il token di join
cat /var/lib/rancher/k3s/server/node-token

# Sul nuovo VPS — entra nel cluster
curl -sfL https://get.k3s.io | \
  K3S_URL=https://<IP_VPS_PRINCIPALE>:6443 \
  K3S_TOKEN=<TOKEN> sh -

# Verifica dal VPS principale
kubectl get nodes   # mostra entrambi i nodi
```

KEDA distribuisce automaticamente i pod sui nodi disponibili.

---

### Kubernetes Dashboard

La dashboard è installata da `cloud-init.sh` e gira solo internamente al cluster — non è esposta su internet.
Per aprirla dal browser del tuo PC si usa un tunnel SSH che porta la porta 8001 dal VPS alla macchina locale.

#### Aprire il tunnel

**Step 1** — Sul VPS, avvia il proxy kubectl (lascialo girare in background):

```bash
ssh -i ~/.ssh/k9_deploy deploy@<IP_VPS>
kubectl proxy --address='127.0.0.1' --port=8001 &
```

**Step 2** — Sul tuo PC (in un altro terminale), apri il tunnel SSH e tienilo aperto:

```bash
ssh -i ~/.ssh/k9_deploy -L 8001:localhost:8001 -N deploy@<IP_VPS>
```

**Step 3** — Nel browser del tuo PC apri:

```
http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
```

**Step 4** — Nella schermata di login seleziona **Token** e generalo dal VPS:

```bash
kubectl create token dashboard-admin -n kubernetes-dashboard
```

Copia il token nel campo e clicca **Sign In**.

#### Comandi utili dalla dashboard (o da CLI)

```bash
# Stato pod e repliche
kubectl get pods -n k9
kubectl get hso -n k9                           # scaling KEDA

# Log del server in tempo reale
kubectl logs -f deployment/k9-server -n k9

# Tutti gli eventi del namespace (utile per debug scheduling)
kubectl get events -n k9 --sort-by='.lastTimestamp'

# Dettaglio eventi di scaling KEDA
kubectl describe hso k9-server -n k9
```

---

## Integrazione con WordPress

Questa sezione descrive come collegare l'app a un sito WordPress esistente, delegando interamente la gestione dell'autenticazione a WP e disabilitando la login nativa dell'app.

### Panoramica del flusso

```
Utente → WordPress (login) → genera JWT firmato → redirect verso l'app con ?token=...
                                                        │
                                                        ▼
                                              App Node (valida JWT)
                                              crea sessione cookie
                                              redirect interno (URL pulito)
                                                        │
                                                        ▼
                                              App React (usa sessione)
```

Il token nell'URL è **usa e getta**: serve solo per l'handshake iniziale. Una volta creata la sessione, l'app funziona esattamente come con la login nativa.

---

### Parte 1 — Configurazione WordPress

#### 1.1 Installare una libreria JWT per PHP

Aggiungere via Composer al tema o a un plugin custom:

```bash
composer require firebase/php-jwt
```

oppure includere il file singolo dalla release ufficiale: https://github.com/firebase/php-jwt

#### 1.2 Generare il JWT al momento del redirect

Creare una funzione (in `functions.php` o in un plugin custom) che intercetta il click sul link verso l'app, genera il token e fa il redirect:

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
        'role'  => k9_get_role( $user ), // vedere §1.3
    ];

    $token = JWT::encode( $payload, $secret, 'HS256' );

    wp_redirect( 'https://app.miodominio.com/api/auth/wp-callback?token=' . urlencode($token) );
    exit;
}

// Aggancio a una shortcode o a un endpoint WP
add_action( 'template_redirect', function() {
    if ( isset($_GET['k9_redirect']) ) {
        k9_redirect_to_app();
    }
});
```

Il link da mostrare agli utenti autorizzati nel menu/pagina WP diventa quindi:

```
https://miodominio.com/?k9_redirect=1
```

#### 1.3 Mappare i ruoli WordPress sui ruoli dell'app

L'app ha due ruoli: `viewer` e `admin`. La funzione di mapping va adattata ai ruoli WP del proprio sito:

```php
function k9_get_role( WP_User $user ): string {
    // Esempio: gli amministratori WP diventano admin dell'app
    if ( in_array('administrator', $user->roles) || in_array('editor', $user->roles) ) {
        return 'admin';
    }
    return 'viewer';
}
```

#### 1.4 Definire il segreto condiviso in `wp-config.php`

```php
// wp-config.php
define( 'K9_JWT_SECRET', 'una-stringa-lunga-e-casuale-identica-a-quella-nel-env-dellapp' );
```

Lo stesso valore va messo nella variabile `SESSION_SECRET` del `.env` dell'app Node (vedere §2.1).

---

### Parte 2 — Modifiche all'app Node.js

#### 2.1 Aggiungere la variabile d'ambiente

Nel file `.env`:

```
# Segreto condiviso con WordPress per validare i JWT in entrata
SESSION_SECRET=una-stringa-lunga-e-casuale-identica-a-quella-in-wp-config
```

Installare la libreria JWT per Node se non già presente:

```bash
npm install jsonwebtoken
npm install -D @types/jsonwebtoken
```

#### 2.2 Aggiungere la route `/api/auth/wp-callback`

In `server/src/routes/auth.ts`, aggiungere sotto le route esistenti:

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
            exp: number;
        };

        req.session.user = { email: payload.email, role: payload.role };

        // Redirect verso la SPA con URL pulito (niente token visibile)
        res.redirect("/");
    } catch (err) {
        console.error("[wp-callback] token non valido:", err);
        res.status(401).send("Token non valido o scaduto");
    }
});
```

#### 2.3 Disabilitare la login nativa

Una volta che l'integrazione WP è attiva e testata, nel `.env` dell'app impostare:

```
AUTH_ENABLED=false
```

Con questa impostazione:
- La pagina `/login` dell'app non viene mai raggiunta (l'utente arriva già autenticato via WP)
- `requireAuth` bypassa il controllo sessione in sviluppo locale
- La route `/api/auth/wp-callback` continua a funzionare indipendentemente da `AUTH_ENABLED`

---

### Parte 4 — Sicurezza checklist

| Punto | Dettaglio |
|---|---|
| **Segreto JWT lungo** | Usare almeno 32 caratteri casuali. Generare con `openssl rand -base64 32` |
| **Scadenza token breve** | 5 minuti (`exp: now + 300`) sono sufficienti per il redirect |
| **HTTPS obbligatorio** | Il token viaggia nell'URL: senza HTTPS è intercettabile |
| **`SESSION_SECRET` diverso da `K9_JWT_SECRET`** | Sono due segreti con scopi diversi, non riutilizzare lo stesso valore |
| **Rimuovere `ADMIN_SEED_*` dal `.env`** | Dopo il primo avvio, eliminare o commentare le variabili di seed |
| **Rate limiting su `/api/auth/login`** | Aggiungere `express-rate-limit` per prevenire brute-force sulla login nativa |
| **Token one-time (opzionale)** | Per massima sicurezza, WordPress può salvare il token in DB e invalidarlo dopo il primo uso; l'app chiama un endpoint WP per validarlo prima di creare la sessione |
