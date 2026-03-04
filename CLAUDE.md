# DailyLog — Project Context for Claude

## Descrizione
PWA per il tracciamento giornaliero delle attività lavorative. Calendario mensile con celle per ogni giorno; ogni giorno può avere task a mezza giornata (AM/PM), giornata intera, o slot orari (1h per slot). Pannello di riepilogo laterale con totali per cliente e tipo.

## Stack
- **React 18** + **Vite 6** (no TypeScript)
- **Tailwind CSS** (classi JSX inline, nessun file CSS separato, no Tailwind config file visibile)
- **localStorage** come storage primario (chiave `dailylog:v1:<YYYY-MM>`)
- **IndexedDB** solo per persistere il file handle del backup automatico
- **Firebase Hosting** per il deploy (`npm run deploy:web`)
- Nessun backend, nessun test automatizzato

## Comandi
```bash
npm run dev        # dev server (Vite)
npm run build      # build produzione
npm run deploy:web # build + deploy Firebase
```

## Struttura src/renderer/
```
App.jsx                    # root: stato globale, modal editor, layout
components/
  CalendarGrid.jsx          # griglia mensile 7 colonne
  DayCell.jsx               # singola cella giorno (display AM/PM/ore)
  Editor.jsx                # modal editor per un giorno
  Header.jsx                # navigazione mese prev/next/oggi
  SettingsModal.jsx         # impostazioni + import/export
  SummaryPanel.jsx          # riepilogo totali clienti/tipi
  ui.jsx                    # componenti base: Button, Icon, Modal, Segmented
domain/
  tasks.js                  # costanti, helper puri (nessuna UI)
hooks/
  useBackupSync.js          # sincronizzazione backup file/desktop
  useCalendarData.js        # stato calendario, upsertDay, deleteDay
services/
  desktopBridge.js          # bridge Electron (se presente)
  storage.js                # load/save localStorage, import/export JSON
utils/
  date.js                   # helper date (ymd, ymKey, monthNameIT, dowMon0...)
```

## Data model (localStorage)
Chiave: `dailylog:v1:<YYYY-MM>` → `{ byDate: { "YYYY-MM-DD": DayData } }`

```js
// DayData
{
  AM: Entry | null,   // task mezza giornata mattina (9-12)
  PM: Entry | null,   // task mezza giornata pomeriggio (14-17)
  hours: {            // task orari (opzionale, coesiste con AM/PM)
    "09": Entry,      // MORNING_HOURS = [9,10,11,12]
    "10": Entry,
    "14": Entry,      // AFTERNOON_HOURS = [14,15,16,17]
    // ...
  }
}

// Entry
{
  type: "internal" | "client" | "vacation" | "event",
  title: string,
  client: string,   // usato solo se type === "client"
  notes: string,
}
```

## Logica display DayCell
- Se `hasMorningHours(dayData)` → 4 strisce orarie per H09-H12
- Altrimenti AM → blocco mezza giornata mattina
- Se `hasAfternoonHours(dayData)` → 4 strisce orarie per H14-H17
- Altrimenti PM → blocco mezza giornata pomeriggio
- Se AM === PM (e no ore) → unico blocco grande "giornata intera"

## Logica peso nel riepilogo
- AM o PM: 0.5 giorni ciascuno
- Ogni slot orario: `1 / HOURS_PER_DAY` = 0.125 giorni (8 ore = 1 giorno)
- MORNING e AFTERNOON sono esclusivi nella stessa metà (editor lo garantisce)

## Costanti chiave (tasks.js)
```js
MORNING_HOURS   = [9, 10, 11, 12]
AFTERNOON_HOURS = [14, 15, 16, 17]
WORK_HOURS      = [...MORNING_HOURS, ...AFTERNOON_HOURS]
HOURS_PER_DAY   = 8
hourKey(h)      // → "09", "14"
hourLabel(h)    // → "09:00", "14:00"
```

## Pattern e convenzioni
- Nessun CSS module, solo classi Tailwind inline nelle JSX
- Componenti puri in `domain/tasks.js` (nessuna dipendenza React)
- `upsertDay` in `useCalendarData.js` gestisce la normalizzazione + delete se vuoto
- `normalizeForType` in `Editor.jsx` pulisce i campi non pertinenti al tipo
- Colori clienti: palette hash automatica + override manuale in settings (`clientColors` map)
- `listStoredClients` in `storage.js` scansiona tutti i mesi per raccogliere i nomi clienti
- `topMonthClients` in `useCalendarData.js` → top 3 clienti del mese corrente per suggerimento rapido
- Filtro hover/click nel SummaryPanel evidenzia le celle del calendario corrispondenti

## Settings (localStorage `dailylog:v1:__settings`)
```js
{
  desktopBackupDir: string,
  minimizeToTrayOnMinimize: boolean,
  clientColors: { [normalizedClientName]: "#RRGGBB" },
  theme: "light" | "dark",
}
```

## Branch git attivo
`github-pages` — il branch `main` è usato come base per le PR.
