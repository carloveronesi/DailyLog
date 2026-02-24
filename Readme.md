## Contesto progetto: DailyLog Webapp (single-file, local-first)

Ho una webapp minimale per tracciare il lavoro giornaliero, pensata come alternativa semplice a un Excel che era diventato complesso.

### Obiettivo

* Tenere traccia di cosa faccio ogni giorno a lavoro.
* A fine mese, contare velocemente quante giornate ho lavorato per cliente.
* Mantenere anche un “diario” di note, blockers e next steps.

### UX desiderata

* Vista principale: **calendario mensile** (lun-dom), weekend evidenziati.
* Ogni giorno è diviso in **due celle/slot**:

  * **Mattina (AM)**
  * **Pomeriggio (PM)**
* Click su un giorno apre un editor (modal).
* Inserimento task con durata:

  * **0.5 giornata**: compilo solo AM oppure PM
  * **1 giornata**: una sola voce, applicata a entrambi gli slot AM e PM

### Tipologie task supportate

1. **Task interni** (`internal`)
2. **Task per cliente** (`client`)
3. **Ferie** (`vacation`)
4. **Eventi** (`event`)

### Dati per ogni slot (schema)

Ogni slot può contenere `null` oppure un oggetto:

```json
{
  "type": "internal|client|vacation|event",
  "title": "string",
  "client": "string",
  "notes": "string"
}
```

Regole:

* Se `type === client`, mostrare e usare `client` come label principale nel calendario.
* Se `type === vacation`, label predefinita “Ferie”.
* Se `type === internal`, label predefinita “Internal”.
* Se `type === event`, label predefinita “Evento” o `title`.

### Persistenza (local-first)

* Niente backend.
* Persistenza in **localStorage** del browser.
* Salvataggio per mese: chiave tipo `dailylog:v1:YYYY-MM`.
* Struttura salvata:

```json
{
  "byDate": {
    "YYYY-MM-DD": {
      "AM": { ...entry } | null,
      "PM": { ...entry } | null
    }
  }
}
```

### Funzionalità già presenti

* Navigazione mesi (prev, next, today).
* Editor per giorno (modal) con:

  * toggle 0.5 vs 1 giornata
  * se 0.5: scelta slot AM/PM
  * tipo task, client/titolo, note
  * salva e cancella giorno
* Riepilogo mese:

  * somma slot (AM/PM) come 0.5 giornata
  * totale per cliente (days)
  * totali internal, ferie, eventi
* Export/Import JSON (backup) da localStorage:

  * export: scarica file json con tutte le chiavi `dailylog:v1:*`
  * import: ripristina/aggiorna localStorage dalle chiavi presenti nel json

### Stack e vincoli

* **Single-file HTML** (no build, no npm).
* UI moderna via **Tailwind CDN**.
* React via CDN (React 18 UMD), JSX con Babel standalone.
* Deve restare semplice da aprire con doppio click.
* Compatibilità: Chrome/Edge.

### File

Un solo file: `dailylog.html`.

### Miglioramenti futuri (backlog)

* Ricerca full-text sulle note (per mese o globale).
* Vista “lista” oltre al calendario.
* Campi aggiuntivi: categoria issue, blockers, outcome, next steps, link.
* Gestire più righe per lo stesso slot (es. due attività la mattina) con “stack” e somma 0.5 ripartita.
* Backup più robusto: esportazione automatica, o salvataggio su file locale (senza server) se possibile.
### Esecuzione desktop con Electron

1. Installa dipendenze:

```bash
npm install
```

2. Avvia l'app desktop in sviluppo:

```bash
npm run dev
```

3. Crea installer Windows (NSIS) in `release/`:

```bash
npm run dist
```

### Backup automatico desktop (Electron)

In versione desktop, ad ogni modifica viene scritto automaticamente un backup JSON.

Percorso predefinito:

`%USERPROFILE%\\Documents\\DailyLog\\backup\\dailylog_auto_backup.json`

Puoi cambiare la cartella da `Settings` nell'app. Se la cartella non esiste, viene creata automaticamente.

### Tray su minimize

In `Settings` puoi attivare l'opzione per minimizzare in tray.
Quando attiva, il click su minimizza nasconde la finestra e mostra l'icona tray con menu `Apri DailyLog` / `Esci`.

### Refactor struttura (Renderer modulare)

La UI non e piu nel file monolitico `dailylog.html`: ora il renderer e modulare con Vite + React.

Struttura principale:

- `src/renderer/App.jsx`
- `src/renderer/components/*`
- `src/renderer/services/*`
- `src/renderer/domain/*`
- `src/renderer/utils/*`

Entry point web:

- `index.html` -> `src/renderer/main.jsx`

`dailylog.html` resta come entry legacy che reindirizza a `index.html`.

Script utili:

- `npm run dev` avvia Vite + Electron
- `npm run build:web` build renderer (`dist/`)
- `npm run dist` build renderer + installer Windows
