# Persistenza dati con deploy su Firebase

## Risposta breve

Se deployi questa app su Firebase Hosting, i dati restano nel browser dell'utente (localStorage), non sul server.

Per ridurre il rischio di perdita dati, puoi aggiungere persistenza cloud con Firebase (consigliato: Cloud Firestore + Firebase Auth).

## Stato attuale del progetto

L'app oggi e' local-first:

- Salva i dati in `localStorage` (chiavi `dailylog:v1:*`).
- Supporta `Export/Import` JSON.
- Ha un backup automatico su file locale nel browser compatibile.
- Non scrive su un database server-side.

In pratica, Firebase Hosting al momento pubblica solo file statici (`dist/`) e non cambia la logica di persistenza.

## Cosa succede ai dati dopo il deploy

I dati in `localStorage`:

- Restano disponibili finche' l'utente usa lo stesso browser/profilo/device e lo stesso dominio.
- Non vengono sincronizzati automaticamente tra dispositivi.
- Possono andare persi se:
  - l'utente cancella dati del sito/browser;
  - cambia browser o profilo;
  - usa un altro dispositivo;
  - ci sono policy aziendali o pulizie automatiche.

## Come salvarli anche "sul server"

### Opzione consigliata

Usare:

- Firebase Auth (anche anonima, per identificare ogni utente)
- Cloud Firestore (per salvare i dati nel cloud)

Struttura tipica:

- `users/{uid}/months/{yyyy-mm}` -> payload mensile (`byDate`, metadati, timestamp)
- `users/{uid}/settings/profile` -> impostazioni utente

### Strategia pratica (senza stravolgere l'app)

1. Tieni `localStorage` come cache locale (UX veloce/offline).
2. A ogni modifica, salva localmente e fai sync su Firestore.
3. All'avvio, carica da Firestore e fai merge con locale (ultima modifica vince, usando timestamp).
4. Mantieni `Export/Import` come backup manuale aggiuntivo.

## Benefici

- Dati recuperabili anche cambiando dispositivo.
- Minore rischio di perdita permanente.
- Possibilita' futura di cronologia/versioning e condivisione.

## Limiti/costi da considerare

- Serve gestione autenticazione e regole sicurezza Firestore.
- Ci sono costi variabili in base a letture/scritture/storage.
- Va gestita la risoluzione conflitti (se utente usa piu' device offline/online).

## Conclusione

Con il setup attuale, Firebase Hosting non rende i dati "server-side": li lascia nel browser.
Se vuoi affidabilita' maggiore, la strada corretta e' aggiungere Firestore (con Auth) e usare una sync local-first + cloud.
