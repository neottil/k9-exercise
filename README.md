# K9 Cross Training – Exercise Database
## Manuale utente

---

## Indice

1. [Introduzione](#1-introduzione)
2. [Accesso e registrazione](#2-accesso-e-registrazione)
3. [Interfaccia principale](#3-interfaccia-principale)
4. [Visualizzazione esercizi (Home)](#4-visualizzazione-esercizi-home)
5. [Filtri di ricerca](#5-filtri-di-ricerca)
6. [Inserimento nuovo esercizio](#6-inserimento-nuovo-esercizio)
7. [Modifica di un esercizio](#7-modifica-di-un-esercizio)
8. [Flusso di approvazione](#8-flusso-di-approvazione)
9. [Pannello Admin](#9-pannello-admin)
10. [Glossario dei campi](#10-glossario-dei-campi)

---

## 1. Introduzione

**K9 Cross Training – Exercise Database** è un'applicazione web per la gestione di una libreria di esercizi di k9 cross training. Permette di catalogare ogni esercizio con informazioni dettagliate sulle aree di lavoro coinvolte, i muscoli target, gli attrezzi necessari e il piano di movimento.

### Ruoli utente

| Ruolo | Cosa può fare |
|-------|---------------|
| **Utente** | Visualizzare, filtrare, inserire nuovi esercizi e proporre modifiche a quelli esistenti |
| **Admin** | Tutto quanto sopra, più approvare o rifiutare le modifiche proposte dagli utenti |

> Le modifiche agli esercizi già approvati non sono applicate immediatamente: rimangono in stato **"in attesa"** fino a quando un admin le approva o le rifiuta.

---

## 2. Accesso e registrazione

### 2.1 Login

All'apertura dell'applicazione viene mostrata la pagina di login.

```
┌─────────────────────────────┐
│        [Logo K9]            │
│  K9 Cross Training - Exercise│
│                             │
│  ┌───────────────────────┐  │
│  │ Email                 │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Password              │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │       ACCEDI          │  │
│  └───────────────────────┘  │
│                             │
│  Non hai un account?        │
│  Registrati                 │
└─────────────────────────────┘
```

1. Inserisci la tua **email** e **password**
2. Clicca **Accedi**
3. In caso di credenziali errate, viene mostrato un messaggio di errore rosso

> **Sessione scaduta** — Se la sessione è scaduta (dopo 2 ore di inattività), alla riapertura della pagina compare un avviso giallo: *"Sessione scaduta. Effettua nuovamente il login."*

### 2.2 Registrazione

Clicca su **Registrati** nella pagina di login per creare un nuovo account. Inserisci email e password, poi conferma.

> I nuovi account vengono creati con ruolo **utente** standard. Il ruolo admin deve essere assegnato manualmente da chi gestisce il database.

### 2.3 Logout

- **Desktop**: icona **→ (porta d'uscita)** in alto a destra nella barra di navigazione. Un tooltip mostra l'email dell'utente connesso.
- **Mobile / tablet**: la voce **Logout** è disponibile in fondo al menu ≡ (hamburger), separata da una riga divisoria.

---

## 3. Interfaccia principale

Dopo il login si accede alla schermata principale, strutturata in tre aree:

```
┌──────────────────────────────────────────────────────────┐
│ [≡ Menu]    K9 Cross Training Exercise Database    [→ ]  │  ← AppBar
├──────────────────────────────────────────────────────────┤
│                                                          │
│               CONTENUTO DELLA PAGINA                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.1 Menu burger (≡)

Cliccando l'icona **≡** in alto a sinistra si apre un menu a tendina con le voci di navigazione:

| Icona | Voce | Destinazione | Visibilità |
|-------|------|--------------|------------|
| 🏠 | **Home** | Torna alla lista degli esercizi | Tutti |
| ➕ | **Inserisci** | Apre il form per un nuovo esercizio | Tutti |
| 🛡️ | **Admin** | Pannello di gestione *(solo admin)* | Solo admin |
| ℹ️ | **Info** | Pagina informativa sull'applicazione | Tutti |
| → | **Logout** | Disconnette l'utente | Solo mobile/tablet |

> La voce **Admin** è visibile e accessibile solo agli utenti con ruolo amministratore.  
> La voce **Logout** appare nel menu solo su schermi piccoli (mobile/tablet); su desktop usa l'icona in alto a destra.

---

## 4. Visualizzazione esercizi (Home)

La pagina Home mostra la **tabella di tutti gli esercizi approvati** nel database.

```
┌─────────────────────────────────────────────────────────────────┐
│ [🔍 Area target ▼]  [🔍 Body target ▼]                         │  ← Filtri
├──────────┬──────────┬───────────────┬──────────┬───────────────┤
│ Tipologia│ Variante │ Descrizione   │ Attrezzi │ Difficoltà ... │  ← Header tabella
├──────────┼──────────┼───────────────┼──────────┼───────────────┤
│ Sit      │          │ Il cane ...   │          │ 2             │
│ [✎]      │          │               │          │               │
├──────────┼──────────┼───────────────┼──────────┼───────────────┤
│ Down     │ Su piano │ Il cane ...   │ [Tappeto]│ 1             │
│ [✎]      │ inclinato│               │          │               │
└──────────┴──────────┴───────────────┴──────────┴───────────────┘
```

### 4.1 Colonne della tabella

| Colonna | Contenuto |
|---------|-----------|
| **Tipologia** | Categoria dell'esercizio. Contiene il pulsante ✎ per modificare |
| **Variante** | Eventuale variante o sottotipo dell'esercizio |
| **Descrizione** | Testo descrittivo dell'esercizio |
| **Attrezzi** | Elenco degli attrezzi necessari, mostrati come chip colorati |
| **Setup** | Istruzioni di preparazione (spazio, posizione, ecc.) |
| **Aree Di Lavoro** | Istogramma visuale delle 5 aree cognitive/fisiche (0–5) |
| **Body Target** | Istogramma visuale delle 5 zone corporee (0–5) |
| **Piano di Movimento** | Chip con i piani di movimento attivi (Mediano/Trasverso/Dorsale) |
| **Difficoltà** | Valore numerico da 1 a 5, difficoltà della variante all'interno della tipologia |

### 4.2 Pulsante modifica (✎)

- **Desktop**: il pulsante ✎ appare automaticamente quando si passa il mouse sopra una riga
- **Mobile/tablet**: tocca la riga per selezionarla, poi clicca il pulsante ✎ che compare

Cliccando ✎ si apre il form di modifica precompilato con i dati dell'esercizio selezionato.

### 4.3 Ordinamento e filtri colonna

La tabella supporta ordinamento e filtraggio nativo:
- Clicca sull'intestazione di una colonna per **ordinare** (asc/desc)
- Usa i controlli nativi della tabella per **filtrare per testo** sulle colonne testuali

---

## 5. Filtri di ricerca

Nella parte superiore della Home sono presenti due pannelli di filtro collassabili.

### 5.1 Area target

Clicca **🔍 Area target ▼** per espandere il pannello.

```
┌─────────────────────────────────────────┐
│ 🔍 Area target  ▲                       │
│                                         │
│  Mentale      [1 ▼] [⊗]               │
│  Flessibilità [  ▼] [⊗]               │
│  Forza        [3 ▼] [⊗]               │
│  Equilibrio   [  ▼] [⊗]               │
│  Cardio       [  ▼] [⊗]               │
└─────────────────────────────────────────┘
```

Per ogni dimensione puoi impostare un **valore minimo** (1–5):
- Seleziona un valore dal menu a tendina per filtrare gli esercizi che hanno almeno quel punteggio in quell'area
- Clicca **⊗** (X) per resettare il singolo filtro
- Gli esercizi privi di valore in quella dimensione sono inclusi nei risultati

> La lista degli esercizi si aggiorna automaticamente ad ogni modifica del filtro, senza necessità di conferma.

### 5.2 Body target

Identico ad Area target, ma per le zone corporee: Anteriore, Posteriore, Core, Colonna, Fullbody.

---

## 6. Inserimento nuovo esercizio

Dal menu burger → **Inserisci** (oppure naviga su `/insert`).

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  Difficoltà*   Tipologia*                            │
│  [1  ▼]        [Select... ▼]  [ Nuova 🔘 ]          │
│                                                      │
│  Variante                                            │
│  [                                              ]    │
│                                                      │
│  Descrizione*                                        │
│  [                                              ]    │
│  [                                              ]    │
│                                                      │
│  Attrezzi                                            │
│  [                     ] [Aggiungi]                  │
│  [Tappeto ✕] [Cono ✕]                               │
│                                                      │
│  Setup (richiesto se ci sono attrezzi)               │
│  [                                              ]    │
│  [                                              ]    │
│                                                      │
│  Piano di movimento*                                 │
│  [Select... ▼] [Aggiungi]                            │
│  [Mediano ✕] [Trasverso ✕]                          │
│                                                      │
│  ╔══ Area target* ═══════════════════════════════╗   │
│  ║ Mentale[0▼] Flessib.[0▼] Forza[0▼] Equil.[0▼] Cardio[0▼] ║ │
│  ╚════════════════════════════════════════════════╝   │
│                                                      │
│  ╔══ Body target* ════════════════════════════════╗   │
│  ║ Anter.[0▼] Poster.[0▼] Core[0▼] Colonna[0▼] Fullbody[0▼] ║ │
│  ╚════════════════════════════════════════════════╝   │
│                                                      │
│  [ SALVA ]                                           │
└──────────────────────────────────────────────────────┘
```

### 6.1 Guida ai campi

#### Difficoltà *(obbligatorio)*
Seleziona un valore da **1** (facile) a **5** (molto difficile). La difficoltà non va intesa come assolua, ma della variante proposta rispetto alla tipologia di esercizio.

#### Tipologia *(obbligatorio)*
Indica la categoria dell'esercizio (es. *Sit*, *Down*, *Recall*…).

- **Tipologia esistente**: seleziona dal menu a tendina che mostra le tipologie già presenti nel database
- **Nuova tipologia**: attiva lo switch **"Nuova"** per passare a un campo di testo libero e digitare una categoria inedita

#### Variante *(facoltativo)*
Specifica una variante o sottotipo dell'esercizio base (es. *"con distrattore"*, *"su piano inclinato"*).

#### Descrizione *(obbligatorio)*
Testo libero che spiega come si esegue l'esercizio. Supporta testo su più righe.

#### Attrezzi *(facoltativo)*
Lista degli strumenti o materiali necessari.

1. Digita il nome dell'attrezzo nel campo di testo
2. Clicca **Aggiungi**
3. Il valore appare come chip con la **✕** per rimuoverlo
4. Ripeti per ogni attrezzo

#### Setup *(obbligatorio se sono presenti attrezzi)*
Descrizione di come posizionare gli attrezzi e preparare l'ambiente prima di iniziare l'esercizio.

#### Piano di movimento *(obbligatorio)*
Indica su quale piano anatomico si svolge il movimento. Seleziona dal menu e clicca **Aggiungi**. Puoi selezionare più piani.

| Valore | Significato |
|--------|-------------|
| **Mediano** | Piano sagittale (movimenti avanti/indietro) |
| **Dorsale** | Piano frontale (movimenti laterali) |
| **Trasverso** | Piano orizzontale (rotazioni) |

#### Area target *(obbligatorio — almeno uno > 0)*
Indica con un valore da **0 a 5** l'intensità di lavoro per ciascuna delle 5 dimensioni cognitive/fisiche.

| Dimensione | Descrizione |
|------------|-------------|
| **Mentale** | Concentrazione, attenzione, elaborazione cognitiva |
| **Flessibilità** | Ampiezza di movimento, stretching |
| **Forza** | Lavoro muscolare, resistenza |
| **Equilibrio** | Propriocezione, stabilità |
| **Cardio** | Frequenza cardiaca, resistenza cardiovascolare |

> **0** = dimensione non coinvolta · **5** = massima intensità

#### Body target *(obbligatorio — almeno uno > 0)*
Indica con un valore da **0 a 5** l'intensità di lavoro per ciascuna zona corporea.

| Zona | Descrizione |
|------|-------------|
| **Anteriore** | Arti anteriori, spalle, petto |
| **Posteriore** | Arti posteriori, posteriore |
| **Core** | Addome, stabilizzatori del tronco |
| **Colonna** | Rachide, muscolatura paravertebrale |
| **Fullbody** | Coinvolge tutto il corpo uniformemente |

### 6.2 Salvataggio

Clicca **SALVA**. Se la validazione ha successo:
- Compare un messaggio verde *"Esercizio salvato correttamente"*
- Dopo 1 secondo l'applicazione torna automaticamente alla Home

Se ci sono errori di validazione, compaiono avvisi rossi in alto a sinistra con il dettaglio del problema.

> **Nuovo esercizio**: viene salvato in stato **TO_APPROVE** (in attesa di approvazione admin). Non sarà visibile nella lista finché un admin non lo approva.

---

## 7. Modifica di un esercizio

Per modificare un esercizio esistente, clicca il pulsante **✎** sulla riga corrispondente nella tabella. Si apre lo stesso form di inserimento, precompilato con i dati attuali.

### 7.1 Comportamento in base allo stato

Il comportamento al salvataggio dipende dallo **stato corrente** dell'esercizio:

| Stato attuale | Cosa succede al salvataggio |
|---------------|------------------------------|
| **TO_APPROVE** | I campi vengono aggiornati direttamente (l'esercizio non era ancora pubblico) |
| **APPROVED** | Viene creata una **richiesta di modifica** in attesa di approvazione; l'esercizio rimane visibile con i valori originali finché l'admin non approva |
| **PENDING_UPDATE** | La richiesta di modifica esistente viene aggiornata con le nuove modifiche |

> **Annullare una modifica**: Se stai modificando un esercizio in stato PENDING_UPDATE e riporti tutti i valori a quelli originali, la richiesta di modifica viene automaticamente eliminata e l'esercizio torna ad APPROVED.

---

## 8. Flusso di approvazione

Gli esercizi transitano attraverso i seguenti stati:

```
                    Utente crea
                        │
                        ▼
                  ┌──────────┐
                  │TO_APPROVE│  ← Nuovo esercizio, non visibile in lista
                  └──────────┘
                        │
                 Admin approva
                        │
                        ▼
                  ┌──────────┐
              ┌──▶│ APPROVED │◀─────────────────────┐
              │   └──────────┘                       │
              │         │                            │
              │   Utente modifica                    │
              │         │                            │
              │         ▼                            │
              │   ┌─────────────┐   Admin approva    │
              │   │PENDING_UPDATE│──────────────────▶│
              │   └─────────────┘                    
              │         │                            
              └─────────┘                            
          Admin rifiuta                              
          (o utente annulla)                         
```

- **TO_APPROVE** → esercizio non compare nella Home
- **APPROVED** → esercizio visibile nella Home
- **PENDING_UPDATE** → esercizio visibile nella Home con i valori originali; la modifica proposta è visibile solo nell'area Admin

---

## 9. Pannello Admin

> Accessibile solo agli utenti con ruolo **admin**, dalla voce **Admin** nel menu burger.

Il pannello è organizzato a **tab**. Attualmente è presente il tab **Modifiche esercizi**.

### Layout desktop

Due aree affiancate all'interno del tab:

```
┌─────────────────────────────────────────────────────────────────────┐
│  MODIFICHE ESERCIZI                                                 │  ← Tab
├──────────────────────┬──────────────────────────────────────────────┤
│  Modifiche in attesa │  □  Campo         Valore                     │
│  3 esercizi          │  ─────────────────────────────────────────    │
│ ─────────────────────│     Tipologia     Sit              (grigio)  │
│ ┌──────────────────┐ │  ☑  Difficoltà   ┌────────────────────────┐ │
│ │ Sit              │ │                  │ 2  (rosso — attuale)   │ │
│ │ variante...      │ │                  │ 3  (verde — proposto)  │ │
│ │ Da: user@mail.it │ │                  └────────────────────────┘ │
│ │ Il 04/06/2026    │ │  ─────────────────────────────────────────    │
│ └──────────────────┘ │     Area target   ...                        │
│ ┌──────────────────┐ │                                              │
│ │ Down             │ │                                              │
│ │ Da: altro@x.it   │ │           [✕ RIFIUTA]  [✓ APPROVA]          │
│ └──────────────────┘ │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

### Layout mobile / tablet

La lista delle modifiche è **collassabile**: tocca l'intestazione "Modifiche in attesa" per espanderla o chiuderla. Selezionando un esercizio dalla lista, questa si chiude automaticamente lasciando tutto lo spazio al pannello di revisione.

```
┌─────────────────────────────────┐
│  MODIFICHE ESERCIZI             │  ← Tab
├─────────────────────────────────┤
│  Modifiche in attesa        [∨] │  ← tocca per espandere
├─────────────────────────────────┤
│  Stand a 2 stazioni — Instabile │
│  Modifica proposta da viewer@…  │
│  il 5 giu 2026, 20:49           │
│                                 │
│  □  Campo       Valore          │
│  ─────────────────────────────  │
│  ...                            │
│                                 │
│  [✕ RIFIUTA]     [✓ APPROVA]   │
└─────────────────────────────────┘
```

### 9.1 Lista modifiche

Mostra tutti gli esercizi che hanno una modifica in attesa (stato PENDING_UPDATE).

Per ogni voce vengono visualizzati:
- **Nome dell'esercizio** (Tipologia)
- **Variante** *(in corsivo, se presente)*
- **Utente** che ha proposto la modifica
- **Data** dell'ultima modifica

Clicca su una voce per visualizzare il dettaglio. La voce selezionata è evidenziata con un bordo colorato a sinistra.

### 9.2 Visualizzazione dell'esercizio

Il pannello mostra **tutti i campi dell'esercizio** in ordine fisso, in una tabella a due colonne (Campo · Valore).

- I campi **non modificati** sono visualizzati con opacità ridotta (grigi)
- I campi **modificati** mostrano i due valori impilati verticalmente:
  - **Riga rossa** — valore attuale dell'esercizio approvato
  - **Riga verde** — valore proposto dalla modifica

Per i campi **Area target** e **Body target** ogni dimensione (Mentale, Forza, ecc.) compare come sotto-riga distinta, con la stessa logica rosso/verde se modificata, oppure grigia se invariata.

### 9.3 Approvare una modifica (totale o parziale)

Ogni campo modificato ha una **checkbox** alla sua sinistra, spuntata di default.
L'admin può deselezionare singolarmente le modifiche che non vuole accettare prima di premere Approva.

| Stato checkbox | Effetto al click su Approva |
|---|---|
| ☑ spuntata | La modifica viene applicata all'esercizio |
| ☐ deselezionata | Il campo rimane con il valore originale |

Per i campi **Area target** e **Body target** la granularità è a livello di singola dimensione (es. si può accettare la modifica su *Forza* e rifiutare quella su *Mentale*).

Clicca il pulsante verde **✓ APPROVA** (abilitato solo se almeno una checkbox è spuntata):
- Solo i campi selezionati vengono applicati all'esercizio
- Il documento di modifica viene eliminato
- L'esercizio torna in stato **APPROVED**
- La voce sparisce dalla lista di sinistra

### 9.4 Rifiutare una modifica

Clicca il pulsante rosso **✕ RIFIUTA** per scartare l'intera modifica senza applicare nulla:
- Il documento di modifica viene eliminato
- L'esercizio rimane con i valori originali in stato **APPROVED**
- La voce sparisce dalla lista di sinistra

> Entrambe le azioni usano transazioni atomiche: non è possibile che l'operazione si completi parzialmente.

### 9.5 Notifiche automatiche

Il sistema invia automaticamente una **email di riepilogo** agli amministratori quando ci sono elementi in attesa di approvazione.

Le notifiche vengono inviate più volte al giorno (ogni 3 ore circa, dalle 6:00 alle 21:00). L'email riporta quanti e quali tipi di elementi sono in attesa:

- Nuovi esercizi inseriti dagli utenti
- Modifiche a esercizi esistenti proposte dagli utenti
- Nuovi account utente da approvare

**Logica di de-duplicazione**: ogni elemento genera al massimo **una notifica al giorno**. Se un esercizio in attesa viene già notificato alle 9:00 e alle 12:00 è ancora in attesa, non genera una seconda email. La notifica si azzera il giorno successivo oppure non appena l'admin gestisce l'elemento (approva o rifiuta): in questo modo, se un utente propone una nuova modifica allo stesso esercizio nella stessa giornata, l'admin riceve comunque la notifica.

---

## 10. Glossario dei campi

| Campo | Tipo | Obbligatorio | Note |
|-------|------|:---:|------|
| **Tipologia** | Testo | ✓ | Categoria principale dell'esercizio |
| **Variante** | Testo | — | Variante o sottotipo |
| **Descrizione** | Testo lungo | ✓ | Come si esegue l'esercizio |
| **Difficoltà** | Numero 1–5 | ✓ | Livello di difficoltà complessivo |
| **Attrezzi** | Lista di tag | — | Materiali necessari |
| **Setup** | Testo lungo | ✓ se attrezzi | Preparazione dell'ambiente |
| **Piano di movimento** | Lista | ✓ | Mediano / Trasverso / Dorsale |
| **Mentale** | Numero 0–5 | ✓¹ | Componente cognitiva |
| **Flessibilità** | Numero 0–5 | ✓¹ | Lavoro sulla mobilità |
| **Forza** | Numero 0–5 | ✓¹ | Lavoro muscolare |
| **Equilibrio** | Numero 0–5 | ✓¹ | Propriocezione e stabilità |
| **Cardio** | Numero 0–5 | ✓¹ | Componente cardiovascolare |
| **Anteriore** | Numero 0–5 | ✓² | Arti e muscolatura anteriore |
| **Posteriore** | Numero 0–5 | ✓² | Arti e muscolatura posteriore |
| **Core** | Numero 0–5 | ✓² | Stabilizzatori addominali |
| **Colonna** | Numero 0–5 | ✓² | Rachide e paravertebrali |
| **Fullbody** | Numero 0–5 | ✓² | Coinvolgimento totale |

> ¹ Almeno un campo di **Area target** deve essere > 0  
> ² Almeno un campo di **Body target** deve essere > 0

---

*Manuale aggiornato al 17/06/2026*
