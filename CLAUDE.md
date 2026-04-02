# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# DailyLog — Project Context for Claude

## Descrizione
PWA per il tracciamento giornaliero delle attività lavorative. Calendario mensile con celle per ogni giorno; ogni giorno può avere task a mezza giornata (AM/PM), giornata intera, o slot da 30 minuti. Vista settimanale e giornaliera con drag & drop. Pannello di riepilogo laterale con totali per cliente e tipo.

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
App.jsx                    # root: stato globale, modal editor, layout, routing viste
contexts/
  SettingsContext.jsx       # React context per settings; useSettings() nei componenti
components/
  CalendarGrid.jsx          # griglia mensile 7 colonne
  DayCell.jsx               # singola cella giorno (display AM/PM/slot)
  WeekView.jsx              # vista settimanale con drag & drop
  DayView.jsx               # vista giornaliera con drag & drop
  Editor.jsx                # modal editor per un giorno
  EntryForm.jsx             # form entry riutilizzabile (usato da Editor)
  Header.jsx                # navigazione mese prev/next/oggi
  SearchModal.jsx           # ricerca full-text su tutti i mesi
  SettingsModal.jsx         # impostazioni + import/export
  SummaryPanel.jsx          # riepilogo totali clienti/tipi
  TodoView.jsx              # lista todo con sottotask e tag
  ErrorBoundary.jsx         # error boundary React
  ui.jsx                    # componenti base: Button, Icon, Modal, Segmented
domain/
  tasks.js                  # costanti, helper puri per i task (nessuna UI)
  calendar.js               # helper per viste settimana/giorno (buildBlocks, slotIndex, isSameHourEntry)
hooks/
  useBackupSync.js          # sincronizzazione backup file/desktop
  useCalendarData.js        # stato calendario, upsertDay, deleteDay
  useCalendarDrag.js        # drag & drop slot nelle viste settimana/giorno
  useTaskOperations.js      # onMoveTask, onResizeTask, handleSlotDeletion, toast di blocco
  useTodos.js               # stato todo list
services/
  desktopBridge.js          # bridge Electron (se presente)
  storage/
    index.js                # re-export di tutti i submoduli
    core.js                 # load/save mese, import/export JSON
    calendar.js             # listStoredClients, operazioni calendari
    backup.js               # IndexedDB file handle per backup automatico
    search.js               # searchAllLogs (full-text su tutti i mesi)
    settings.js             # loadSettings/saveSettings
    todo.js                 # loadTodos/saveTodos (chiave: `dailylog_todos`)
utils/
  date.js                   # helper date (ymd, ymKey, monthNameIT, dowMon0...)
```

## Data model (localStorage)
Chiave: `dailylog:v1:<YYYY-MM>` → `{ byDate: { "YYYY-MM-DD": DayData } }`

```js
// DayData
{
  AM: Entry | null,   // task mezza giornata mattina (09:00-12:30)
  PM: Entry | null,   // task mezza giornata pomeriggio (14:00-17:30)
  hours: {            // task slot 30 min (opzionale, coesiste con AM/PM)
    "540": Entry,     // chiave = minuti dall'inizio giornata (es. 9*60=540)
    "570": Entry,
    "840": Entry,     // 14*60=840
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

**Importante:** la chiave in `hours` è in **minuti** (es. `540` = 09:00), non in formato "09".
I Todo hanno storage separato: `dailylog_todos` → array di todo object.
Settings: `dailylog:v1:__settings`.

## Logica display DayCell
- Se `hasMorningHours(dayData)` → strisce 30-min per 09:00-12:30
- Altrimenti AM → blocco mezza giornata mattina
- Se `hasAfternoonHours(dayData)` → strisce 30-min per 14:00-17:30
- Altrimenti PM → blocco mezza giornata pomeriggio
- Se AM === PM (e no ore) → unico blocco grande "giornata intera"

## Costanti chiave (tasks.js)
```js
SLOT_MINUTES    = 30
MORNING_SLOTS   = buildSlots(9*60, 13*60)  // minuti: 540, 570, ..., 750
AFTERNOON_SLOTS = buildSlots(14*60, 18*60) // minuti: 840, 870, ..., 1050
WORK_SLOTS      = [...MORNING_SLOTS, ...AFTERNOON_SLOTS]
HOURS_PER_DAY   = WORK_SLOTS.length / 2   // = 8
slotKey(m)      // → "540", "840" (stringa del valore minuti)
hourLabel(m)    // → "09:00", "14:00"
```

## Helper chiave (calendar.js)
```js
DAY_SLOTS       // MORNING_SLOTS + pausa pranzo + AFTERNOON_SLOTS
BREAK_START     // 13*60
BREAK_END       // 14*60
buildBlocks(dayData)   // raggruppa slot consecutivi identici in blocchi visivi
slotIndex(m)    // indice di uno slot in DAY_SLOTS
isSameHourEntry(a, b)  // deep equality per merge blocchi (include notes)
hasMissingNotes(entry) // true se entry non ha note (client/internal)
```

## Pattern e convenzioni
- Nessun CSS module, solo classi Tailwind inline nelle JSX
- Logica pura (nessuna dipendenza React) in `domain/tasks.js` e `domain/calendar.js`
- `upsertDay` in `useCalendarData.js` gestisce la normalizzazione + delete se vuoto
- `normalizeForType` in `Editor.jsx` pulisce i campi non pertinenti al tipo
- Colori clienti: palette hash automatica + override manuale in settings (`clientColors` map)
- `listStoredClients` in `storage/calendar.js` scansiona tutti i mesi per raccogliere i nomi clienti
- `topMonthClients` in `useCalendarData.js` → top 3 clienti del mese corrente per suggerimento rapido
- Filtro hover/click nel SummaryPanel evidenzia le celle del calendario corrispondenti
- `useCalendarDrag` gestisce drag su slot vuoti, move task e resize task nelle viste WeekView/DayView
- `useSettings()` (da `SettingsContext`) usato nei componenti per leggere `clientColors` e `taskSubtypes` senza prop drilling; il Provider è in App.jsx
- `useTaskOperations` (da `hooks/useTaskOperations.js`) incapsula tutta la logica di move/resize/delete slot e il toast di blocco

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
Il branch `main` è usato come base per le PR.
