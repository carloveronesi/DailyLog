<p align="center">
  <img src="public/icons/icon-192.png" alt="DailyLog logo" width="128" />
</p>

<h1 align="center">DailyLog</h1>

<p align="center">
  PWA locale per il tracciamento giornaliero delle attività lavorative.<br/>
  Nessun backend, nessun account, tutti i dati restano nel browser.
</p>

---

## Funzionalità

### Viste calendario
- **Vista mensile** — griglia 7 colonne (lun–dom) con weekend evidenziati; click su una cella apre l'editor per quel giorno
- **Vista settimanale** — colonne per ogni giorno della settimana con slot da 30 minuti; supporta drag & drop per spostare e ridimensionare i task
- **Vista giornaliera** — timeline verticale con slot da 30 minuti; drag & drop e resize inline

### Task e slot
- Ogni giorno può avere:
  - Slot **AM** / **PM** (mezza giornata): mattina 09:00–12:30, pomeriggio 14:00–17:30
  - Slot da **30 minuti** (granularità fine, coesistono con AM/PM)
  - Blocco **giornata intera** (quando AM = PM)
- Tipi di task: `client`, `internal`, `vacation`, `event`
- Sottotipi personalizzabili per `client` e `internal` (configurabili nelle impostazioni)
- Campo **location** per ogni giorno: ufficio, remoto, cliente
- Campi per task: titolo, note, cosa è andato storto, prossimi passi, collaboratori, contatti cliente
- **Task ricorrenti** — definibili nelle impostazioni con frequenza giornaliera, settimanale, bisettimanale, trisettimanale o mensile; applicabili con un click su singolo giorno o "Riempi mese"

### Editor giornaliero
- Layout a due colonne: tipo/cliente/subtask/orari a sinistra, collaboratori/note/feedback a destra
- Autocompletamento clienti e persone dal database locale
- Sezione ricorrenza con anteprima dei giorni coinvolti

### Copia & incolla
- **Copia giorno** — copia l'intera configurazione di un giorno e incollala su un altro
- **Copia task/slot** — copia un singolo entry (con durata) e incollalo in qualsiasi slot libero

### Pannello riepilogo
- Totali per cliente e per tipo per il mese corrente
- Click o hover sulle voci filtra le celle del calendario per evidenziare i giorni corrispondenti

### Vista Progetti
- Aggregazione automatica di tutte le voci del calendario per cliente e per sottotipo interno
- Dettagli editabili per ogni progetto: stato, cliente, responsabile, persone coinvolte
- Lista cronologica delle attività registrate per ciascun progetto
- Export CSV dei dati progetto

### Todo list
- Sezioni **DA FARE** / **FATTI** con completamento automatico
- Sottotask per ogni todo
- Tag personalizzabili (configurabili nelle impostazioni)
- Data di scadenza opzionale
- Associazione a un progetto

### Ricerca
- Pannello fullscreen con ricerca full-text su tutti i mesi salvati
- Filtri per tipo, sottotipo, cliente, collaboratore, intervallo di date
- Risultati cliccabili: apre direttamente il giorno e lo slot corrispondente

### Undo / Redo
- Cronologia delle modifiche con etichetta descrittiva per ogni operazione
- Navigabile avanti e indietro

### Impostazioni
- **Aspetto**: tema chiaro / scuro, colori personalizzati per cliente e per sottotipo interno
- **Orari di lavoro**: configurazione degli slot mattina e pomeriggio
- **Sottotipi task**: aggiunta, rinomina, rimozione per tipo `client` e `internal`
- **Tag todo**: gestione dei tag globali per la todo list
- **Persone**: rubrica delle persone frequenti (collaboratori, contatti cliente)
- **Salvataggio**: export/import JSON con preview e selezione intervallo mesi; backup automatico su file (via File System Access API o bridge Electron)
- **Task ricorrenti**: definizione e gestione dei template ricorrenti

### PWA
- Installabile su desktop e mobile tramite Chrome/Edge
- Service worker per funzionamento offline
- `manifest.webmanifest` con icone e colori tema

---

## Stack tecnico

| Livello | Tecnologia |
|---|---|
| UI | React 18 + JSX |
| Build | Vite 6 |
| Stile | Tailwind CSS (classi inline, nessun file CSS separato) |
| Storage primario | `localStorage` — chiave `dailylog:v1:<YYYY-MM>` |
| Storage backup handle | IndexedDB (solo file handle per backup automatico) |
| Deploy | GitHub Pages (CI via GitHub Actions) |
| Nessun backend | — |
| Nessun TypeScript | — |
| Nessun test automatizzato | — |

---

## Struttura del progetto

```
src/renderer/
├── App.jsx                    # root: stato globale, layout, routing viste
├── contexts/
│   └── SettingsContext.jsx    # React context per le impostazioni
├── components/
│   ├── CalendarGrid.jsx       # griglia mensile
│   ├── DayCell.jsx            # singola cella giorno
│   ├── WeekView.jsx           # vista settimanale con drag & drop
│   ├── DayView.jsx            # vista giornaliera con drag & drop
│   ├── Editor.jsx             # modal editor per un giorno
│   ├── EntryForm.jsx          # form entry (usato da Editor)
│   ├── Header.jsx             # navigazione mese
│   ├── SearchModal.jsx        # ricerca full-text
│   ├── SettingsModal.jsx      # impostazioni + import/export
│   ├── SummaryPanel.jsx       # riepilogo totali
│   ├── TodoView.jsx           # todo list con sottotask e tag
│   ├── ProjectView.jsx        # vista progetti aggregata
│   ├── TaskBlock.jsx          # blocco task nelle viste settimana/giorno
│   ├── Combobox.jsx           # input con autocomplete
│   ├── ErrorBoundary.jsx      # error boundary React
│   └── ui.jsx                 # componenti base: Button, Icon, Modal, Segmented
├── domain/
│   ├── tasks.js               # costanti e helper puri (slot, colori, tipi)
│   └── calendar.js            # helper per viste (buildBlocks, matchesRecurringPattern)
├── hooks/
│   ├── useCalendarData.js     # stato calendario, upsertDay, undo/redo
│   ├── useBackupSync.js       # backup file automatico
│   ├── useCalendarDrag.js     # drag & drop
│   ├── useTaskOperations.js   # move, resize, delete slot
│   ├── useTodos.js            # stato todo list
│   └── useUIState.js          # stato UI (modal aperti, vista attiva, filtri)
├── services/storage/
│   ├── index.js               # re-export
│   ├── core.js                # load/save mese, import/export JSON
│   ├── calendar.js            # listStoredClients, operazioni calendario
│   ├── backup.js              # IndexedDB per file handle backup
│   ├── search.js              # searchAllLogs full-text
│   ├── settings.js            # loadSettings / saveSettings
│   ├── todo.js                # loadTodos / saveTodos
│   └── projects.js            # loadProjects / saveProjects
└── utils/
    └── date.js                # helper date (ymd, ymKey, monthNameIT, ...)
```

---

## Data model

**Chiave localStorage:** `dailylog:v1:<YYYY-MM>` → `{ byDate: { "YYYY-MM-DD": DayData } }`

```js
// DayData
{
  AM: Entry | null,       // task mezza giornata mattina
  PM: Entry | null,       // task mezza giornata pomeriggio
  location: "remote" | "office" | "client" | null,
  hours: {                // slot 30-min (coesistono con AM/PM)
    "09:00": Entry,
    "09:30": Entry,
    "14:00": Entry,
    // ...
  }
}

// Entry
{
  type: "internal" | "client" | "vacation" | "event",
  subtypeId: string | null,
  title: string,
  client: string,          // usato se type === "client"
  collaborators: string[],
  clientContacts: string[],
  notes: string,
  wentWrong: string,
  nextSteps: string,
}
```

Altre chiavi localStorage:
- `dailylog_todos` — array todo
- `dailylog:v1:__settings` — impostazioni applicazione

---

## Sviluppo locale

**Requisiti:** Node.js 20+

```bash
npm install
npm run dev        # dev server su http://localhost:5173
npm run build      # build produzione in dist/
npm run preview    # anteprima build produzione
```

---

## Deploy su GitHub Pages

Il repository include `.github/workflows/deploy-pages.yml` che fa build e pubblica su GitHub Pages ad ogni push su `main`.

Setup una tantum:
1. `Settings > Pages` → `Source: GitHub Actions`
2. Push su `main` — la CI compila `dist/` e pubblica automaticamente

URL finale: `https://<username>.github.io/<repo>/`

---

## Installazione come app

Su Chrome o Edge, con l'app aperta su HTTPS (o localhost), usa **Installa app** nella barra degli indirizzi.

---

## Dati e privacy

- Tutti i dati risiedono nel browser locale (`localStorage`)
- Nessuna telemetria, nessun server, nessun account
- Backup tramite export JSON; ripristino tramite import
- L'export selettivo per intervallo di mesi è disponibile nelle impostazioni
