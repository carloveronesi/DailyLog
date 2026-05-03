# Migliorie
- possibilità di personalizzare unità minima degli slot: ora sono di mezz'ora, ma si potrebbe mettere di 15 minuti. magari anche inserire manualmente l'orario di inizio + durata
- gestione settimana lavorativa: per ora è default lunedì e venerdì, ma si potrebbe personalizzare

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