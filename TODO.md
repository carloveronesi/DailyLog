# Todo integrata nella Vista Giorno

L'idea di mostrare i todo affiancati alla DayView di oggi è valida (quando apri la giornata corrente vuoi subito vedere cosa devi fare), ma l'implementazione attuale ha dei problemi da risolvere.

## Problemi attuali
- **Accessibilità zero da altri contesti**: la TodoView è raggiungibile *solo* in modalità "day" guardando oggi. Non esiste una voce sidebar dedicata; da qualsiasi altra vista i todo sono irraggiungibili.
- **Layout instabile**: il grid passa da `grid-cols-2` (oggi) a `grid-cols-1` (qualsiasi altro giorno) — l'interfaccia cambia forma in base alla data, disorientante. Vedi `App.jsx:305`.
- **Nessuna integrazione semantica**: i due pannelli sono affiancati ma non si parlano. Un Todo non diventa un Entry, non ha orario, non si lega a uno slot.
- **Mobile**: si impila sotto la DayView occupando pagina senza aggiungere contesto.

## Soluzione raccomandata
1. Aggiungere una voce **"Todo"** nella sidebar, accessibile da qualsiasi vista (affiancata a giorno/settimana/mese/progetti).
2. Opzionalmente mantenere il pannello affiancato nella vista di oggi, ma come scorciatoia — non come unico punto di accesso.
3. Valutare se un widget compatto nella header della DayView (pill con contatore todo aperti) sia più adatto rispetto al secondo pannello a piena altezza.

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