# Migliorie
- possibilità di personalizzare unità minima degli slot: ora sono di mezz'ora, ma si potrebbe mettere di 15 minuti. magari anche inserire manualmente l'orario di inizio + durata
- gestione settimana lavorativa: per ora è default lunedì e venerdì, ma si potrebbe personalizzare

# Test automatizzati (Vitest)

Introdurre Vitest per testare la business logic pura — nessuna UI, solo `domain/` e `services/`.

## Moduli prioritari da coprire
- `domain/calendar.js` — `buildBlocks`, `matchesRecurringPattern` (logica ricorrenza biweekly/triweekly fragile)
- `domain/tasks.js` — `slotKey`, `slotMinutes`, `hasMorningHours`, `hasAfternoonHours`
- `services/storage/core.js` — round-trip serialize/deserialize dei mesi

## Setup minimo
```bash
npm install -D vitest
```
Aggiungere `"test": "vitest"` in `package.json`. Nessuna config extra necessaria con Vite 6.

## Effort stimato: ~3-4h
- Setup + prime smoke test (`slotKey`, `slotMinutes`) — 30min
- Test `buildBlocks` (casi: slot vuoti, slot consecutivi uguali, slot misti AM+hours) — 1-2h
- Test `matchesRecurringPattern` (daily/weekly/biweekly/triweekly/monthly con anchorYmd) — 1-2h

---

# Migrazione storage a IndexedDB (Dexie.js)

`localStorage` è sincrono e ha limite ~5MB. Con uso intensivo (note lunghe, molti mesi) rischio di blocco UI o saturazione.

## Piano di migrazione
1. Aggiungere `dexie` come dipendenza (`npm install dexie`)
2. Creare `services/storage/db.js` — schema Dexie con tabelle `months` (key: `YYYY-MM`) e `settings` e `todos`
3. Sostituire `load/saveMonth` in `storage/core.js` con operazioni async Dexie
4. Adattare `useCalendarData.js` e `useTodos.js` per `await` le chiamate storage
5. Migration automatica al primo avvio: leggere tutto da localStorage, scrivere in IndexedDB, marcare migrazione completata

## Rischi
- Tutti i custom hook diventano async → piccolo refactor diffuso
- Migration one-shot: testare bene prima di deploy

## Effort stimato: ~6-8h

---

# AI Insights

Analisi delle attività registrate tramite LLM esterno. L'utente inserisce una API key nei settings; l'app raccoglie tutte le entry in ordine cronologico e le manda al modello per una valutazione di come sta andando il lavoro.

## Flusso tecnico
1. `searchAllLogs` (già in `storage/search.js`) raccoglie tutti i mesi salvati
2. Le entry vengono serializzate in ordine cronologico: data, cliente, tipo, titolo (note opzionali)
3. Chiamata all'API del vendor scelto con prompt di analisi
4. Risposta mostrata in un modal o pannello dedicato

## Settings necessari
- Campo API key (testo, oscurato)
- Scelta vendor (Anthropic / OpenAI / altro)
- Limite mesi da analizzare (default: ultimi 3) — per contenere i token

## Nota sicurezza
La chiave API viene salvata in localStorage e viaggia nelle request dal browser. Accettabile per uso personale.

## Effort stimato: ~4-5h
- `settings`: campo API key + vendor (~1h)
- `services/aiInsights.js`: raccolta dati + chiamata API + streaming response (~2h)
- UI: bottone (Header o SummaryPanel) + modal con risposta in streaming (~1-2h)