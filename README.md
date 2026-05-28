# K9-EXERCISE-APP

## Set up local env


## Check before push

Run "npm run build" before push to verify if build run correctly.

Update version with

```
# Incrementa la versione maggiore
npm version major

# Incrementa la versione minore
npm version minor

# Incrementa la patch
npm version patch
```

## TODO'S

- pagina di approvazione solo per admin
- script batch schedulato per segnalare nuovi utenti e esercizi

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
