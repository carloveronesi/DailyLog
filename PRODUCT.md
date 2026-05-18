# Product

## Register

product

## Users

Consulenti e professionisti del team Reply che devono registrare ogni giorno come hanno speso il tempo: ore su cliente, attività interne, eventi, ferie. Contesto d'uso tipico: fine giornata o fine settimana, davanti a un monitor grande, dopo aver già lavorato 8 ore — quindi tolleranza zero per friction inutile. Conoscono già le convenzioni interne (nomi clienti, tipologie task, codici), quindi non serve nessun onboarding o guida passo-passo. L'app è uno strumento ripetitivo, non un percorso da scoprire.

Il "job to be done" primario è duplice:

1. **Compilare un giorno** in pochi secondi senza staccare le mani dalla tastiera.
2. **Verificare a colpo d'occhio** che la settimana o il mese sia coerente — niente buchi, distribuzione clienti sensata, totali ore in linea.

## Product Purpose

DailyLog sostituisce il classico foglio Excel o il timesheet aziendale per il tracking giornaliero. Esiste perché gli strumenti enterprise sono lenti, brutti e pensati per chi inserisce i dati una volta al mese sotto deadline; DailyLog assume invece che l'utente apra l'app **ogni giorno**, e ottimizza per quel rituale.

Successo significa: l'utente compila il giorno in <30 secondi, vede subito se il mese è in linea, non perde mai dati, e non sente mai il bisogno di "controllare due volte" perché l'interfaccia stessa rende evidenti le incongruenze (slot mancanti, clienti non normalizzati, settimane sotto le ore).

## Brand Personality

**Power-tool, denso, silenzioso.**

Lo stesso registro di Linear, Raycast, Things 3: l'interfaccia non si mette mai in mezzo, non spiega, non festeggia. Premia la familiarità con scorciatoie da tastiera, default intelligenti, gerarchia tipografica che lascia respirare le informazioni importanti senza sprecare spazio. Il tono dei microcopy è asciutto, in italiano, indicativo presente — istruzioni, non conversazione.

L'app deve dare la stessa sensazione di un buon editor di codice: chi la usa ogni giorno sviluppa muscle memory, e quella muscle memory non viene mai tradita da redesign cosmetici.

## Anti-references

- **Tool enterprise legacy (SAP, Oracle, sistemi timesheet aziendali).** Tabelle dense grigie, dropdown infiniti, label criptiche, look anni 2000. DailyLog rifiuta esplicitamente la sensazione di "modulo da compilare per HR".
- **App consumer giocosa.** Mascotte, animazioni rimbalzanti, emoji come decorazione, palette pastello sgargianti, celebrazioni per "hai completato 5 giorni di fila!". DailyLog è uno strumento di lavoro, non un compagno motivazionale.
- **SaaS B2B template.** Hero con gradient, card identiche ripetute, blu navy + accent arancione, dashboard generico tipo Toggl/Harvest landing. Da evitare anche se l'app non è marketing — quel linguaggio visivo si infila ovunque per default.

## Design Principles

1. **Velocità prima di tutto.** Ogni interazione si misura in tasti, non in click. Default intelligenti (cliente più usato del mese, orario corrente, tipo task ricorrente) battono sempre form vuoti. Se un campo può essere inferito, è inferito.

2. **Riepilogo a colpo d'occhio.** Aprire l'app dà subito un quadro chiaro del mese: totali per cliente, giorni compilati, anomalie. Niente "click per vedere", niente tab da esplorare — i numeri che contano sono già lì.

3. **L'interfaccia rende evidenti gli errori, non li nasconde.** Un giorno con buchi, un cliente scritto in due varianti, una settimana sotto le ore: l'UI lo segnala in modo silenzioso ma immediato. Mai pop-up di validazione; sempre segnale visivo passivo.

4. **Densità con respiro.** Molta informazione per pixel, ma con gerarchia tipografica chiara. La densità è quella di Linear o di un buon foglio di calcolo, non quella di un ERP. Spaziatura ridotta dove serve, generosa dove l'occhio deve trovare un appiglio.

5. **Continuità di sessione.** L'utente lavora per mesi sullo stesso strumento. Nessun redesign gratuito, nessuna rimozione di feature usate, nessun cambio di scorciatoie. Le convenzioni sono un patto.

## Accessibility & Inclusion

Nessun requisito formale (WCAG o certificazioni). Si applicano le buone pratiche di base:

- Contrasto sufficiente per lettura prolungata su monitor (almeno AA su testo e UI critica).
- Focus visibile su tutti gli elementi interattivi — la navigazione da tastiera è centrale alla velocità di compilazione, non un'opzione di accessibilità.
- Nessuna informazione veicolata solo dal colore (i colori cliente sono un *aiuto*, non l'unico segnale).
- `prefers-reduced-motion` rispettato dove ci sono transizioni non essenziali.
