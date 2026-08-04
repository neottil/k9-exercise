# Analisi: storico delle modifiche proposte per utente

## Obiettivo

Sapere quante modifiche a esercizi già approvati ha proposto ciascun utente in
un dato periodo — stesso tipo di report della route
[`GET /api/admin/audit/created-by-user`](../server/src/routes/audit.ts), ma
per le **modifiche** invece che per le creazioni.

## Perché oggi non è possibile

`ExerciseChange` ([server/src/models/ExerciseChange.ts](../server/src/models/ExerciseChange.ts))
ha un indice `unique` su `exerciseId`: esiste **al più un documento per
esercizio**, e viene cancellato (`deleteOne`) a ogni `approve-change`,
`reject-change`, o quando l'utente annulla la propria modifica tornando ai
valori originali (vedi `server/src/routes/exercises.ts`, handler `PUT /:id`
e `POST /:id/approve-change` / `POST /:id/reject-change`). Non esiste quindi
nessuno storico da interrogare: una volta risolta, la modifica sparisce.

## Cosa si può riusare

`ExerciseChange.user` è scritto **una sola volta**, alla creazione del change
doc (`ExerciseChange.create` in `PUT /:id`, ramo `APPROVED → PENDING_UPDATE`),
e non viene mai più toccato — nemmeno se l'admin altera i campi proposti
prima di approvare (quel percorso aggiorna solo `Exercise.userUpdate`, mai
`ExerciseChange.user`). È quindi una fonte affidabile per "chi ha proposto
la modifica", indipendente da cosa fa l'admin in approvazione.

## Proposta: cambiare da "cancella" a "stato"

Invece di `deleteOne` alla risoluzione, aggiungere un campo `state` a
`ExerciseChange` e non cancellare più il documento — solo marcarlo risolto.
Il ragionamento di base è corretto, ma da solo non basta: servono anche le
modifiche sotto.

### 1. L'indice unique su `exerciseId` va reso parziale

Oggi `unique: true` è globale: se i documenti storici restano, un secondo
giro di modifiche sullo stesso esercizio violerebbe l'unicità. Serve un
indice unique **parziale**, scoped allo stato "attivo" — stesso pattern già
usato su `Exercise` per `type+variant`
([Exercise.ts:88-96](../server/src/models/Exercise.ts)):

```js
ExerciseChangeSchema.index(
  { exerciseId: 1 },
  { unique: true, partialFilterExpression: { state: "PENDING" } }
);
```

### 2. Tutte le lookup vanno filtrate per stato

Oggi `ExerciseChange.findOne({ exerciseId: id })` funziona perché c'è al più
un documento. Con lo storico, compare in almeno 5 punti di
`server/src/routes/exercises.ts` (righe indicative: 104, 194, 224, 265, 535)
e va scoped a `{ exerciseId: id, state: "PENDING" }`, altrimenti pesca il
primo storico che trova. Stesso discorso per l'`upsert` che aggiorna il
change doc mentre è ancora PENDING (riga ~428-432).

### 3. Serve uno stato "ritirato", non solo APPROVED/REJECTED

Il caso "l'utente modifica e poi torna ai valori originali" (righe ~418-425)
oggi cancella il change doc silenziosamente — non è un'approvazione né un
rifiuto dell'admin, è un ritiro spontaneo. Mappare questo caso su APPROVED o
REJECTED falserebbe le statistiche. Serve un terzo stato, es. `CANCELLED` /
`WITHDRAWN`, da escludere (o contare a parte) dal conteggio "modifiche
proposte e valutate da un admin".

### 4. Data di raggruppamento del report

Raggruppare per `createdAt` del change doc (data di proposta), non per data
di risoluzione — coerente con `esercizi_creati_per_utente.js`, che conta "chi
ha proposto" e non "quando è stato chiuso".

### 5. Nota minore

Le immagini dentro `fields.images` di un change doc storico possono
riferirsi a file nel frattempo rimossi dal GC minIO. Irrilevante per il solo
conteggio; da tenere presente solo se in futuro si vuole anche *visualizzare*
lo storico di una modifica, non solo contarlo.

## Cosa NON cambia

`Exercise._id` resta stabile in ogni scenario: nessun impatto sulle immagini
già collegate.

## Stato

Solo analisi — nessuna implementazione. Le decisioni sui punti 3 e 4 vanno
prese esplicitamente prima di procedere.
