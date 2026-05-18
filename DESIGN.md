---
name: DailyLog
description: PWA per il tracking giornaliero delle ore — palette indigo su carta, densità da power-tool.
colors:
  bg: "#F4F3FB"
  surface: "#FFFFFF"
  muted: "#FAFAFD"
  weekend: "#EFEEF7"
  ink: "#1B1B2E"
  ink-soft: "#3F3F5A"
  gray: "#7676A0"
  gray-light: "#B0B0CC"
  border: "#E7E6F2"
  border-soft: "#EFEEF7"
  accent: "#6366F1"
  accent-dark: "#4F46E5"
  accent-bg: "#F0EFFD"
  accent-soft: "#E8E7FB"
  violet: "#8B5CF6"
  violet-soft: "#F1ECFE"
  rose: "#F43F5E"
  amber: "#F59E0B"
  amber-soft: "#FEF3C7"
  success: "#10B981"
  dark-bg: "#0E0E1A"
  dark-surface: "#17172B"
  dark-ink: "#E9E7FF"
  dark-border: "#2B2B44"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.ink-soft}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.gray}"
    rounded: "{rounded.sm}"
    padding: "8px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "20px"
  segmented-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  segmented-inactive:
    backgroundColor: "transparent"
    textColor: "{colors.gray}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: DailyLog

## 1. Overview

**Creative North Star: "The Quiet Spreadsheet"**

DailyLog è un foglio di calcolo che si è tolto la cravatta. La densità informativa è quella di Linear o di un buon spreadsheet — molte righe, molti numeri, molti totali — ma l'estetica è quella di una carta da lettera leggermente azzurrata: fondo lavanda chiarissimo (`#F4F3FB`), superfici bianche, inchiostro quasi-nero (`#1B1B2E`), e un solo accent indigo (`#6366F1`) usato con parsimonia. Niente celebra niente. L'app non sa che hai compilato 5 giorni di fila, e va benissimo così.

L'aesthetic philosophy è **power-tool silenzioso**: la UI non spiega, non guida, non fa pop-up. Premia la familiarità con scorciatoie da tastiera, default intelligenti, e gerarchia tipografica chiara. Geist (sans) + Geist Mono per i numeri delle ore: la coppia firma il registro "strumento tecnico curato", non "SaaS amichevole". Il dark mode esiste ed è onesto — nero-blu profondo (`#0E0E1A`), inchiostro lavanda chiaro — non un dark mode viola-neon da AI tool.

DailyLog **non è** un timesheet enterprise (niente tabelle grigie con dropdown infiniti, niente label criptiche, niente bordi pesanti); **non è** un'app consumer giocosa (zero mascotte, zero animazioni rimbalzanti, zero emoji decorative, zero pastelli sgargianti); **non è** un SaaS B2B template (niente hero gradient, niente card identiche ripetute, niente blu navy + arancione, niente "hero metric" cliché).

**Key Characteristics:**
- Palette tinted-neutral con un solo accent indigo, usato ≤15% della superficie
- Tipografia Geist + Geist Mono; numeri in mono, mai in sans
- Radius generosi sui contenitori (20px sulle card, pill sui controlli), zero su elementi tecnici
- Densità alta ma con respiro: spaziatura `gap-1` tra slot 30-min, `p-5` nei modal
- Bordi sottili (`#E7E6F2`, 1px) come segnale primario di separazione; le ombre sono ambientali, non strutturali
- Dark mode parallelo, non un afterthought

## 2. Colors

Palette tinted-neutral basata sull'hue indigo (~280°). Tutti i grigi e i bianchi sono leggermente tirati verso il viola/lavanda — mai grigi neutri puri, mai bianco assoluto.

### Primary
- **Indigo Voice** (`#6366F1`): l'unico colore con personalità. Stato attivo dei controlli di navigazione, link, focus ring, evidenziazione "oggi" nel calendario, CTA principali quando servono. Usato con parsimonia — la sua rarità è la fonte del suo significato.
- **Indigo Deep** (`#4F46E5`): stato hover/pressed dell'accent. Compare solo come reazione a un'azione.

### Secondary
- **Violet Companion** (`#8B5CF6`): tag, categorie secondarie, varianti di task. Non sostituisce mai l'accent — lo affianca quando serve un secondo segnale categoriale.

### Tertiary
- **Amber Signal** (`#F59E0B`): warning soft (giorni incompleti, slot senza note). Il suo fondo `#FEF3C7` è l'unica nota calda della palette.
- **Rose Alert** (`#F43F5E`): solo per errori distruttivi (delete, conflitti). Mai decorativo.
- **Success Mute** (`#10B981`): stato completato (todo fatti, giorni pieni). Non festeggia, conferma.

### Neutral
- **Lavanda di sfondo** (`#F4F3FB`): fondo dell'app. Lavanda chiarissima, mai grigio puro.
- **Bianco superficie** (`#FFFFFF`): card, modal, celle giorno attive.
- **Lavanda muted** (`#FAFAFD`): superfici secondarie, hover ghost, segmented inactive.
- **Lavanda weekend** (`#EFEEF7`): celle weekend nel calendario — un grado più scuro per distinguere senza urlare.
- **Inchiostro** (`#1B1B2E`): testo primario. Quasi-nero con punta di viola; mai `#000`.
- **Inchiostro morbido** (`#3F3F5A`): testo secondario.
- **Grigio** (`#7676A0`): testo terziario, label di sezione, placeholder.
- **Grigio chiaro** (`#B0B0CC`): testo disabilitato, icone passive.
- **Bordo** (`#E7E6F2`): 1px, sempre. È il separatore di default.
- **Bordo soft** (`#EFEEF7`): separatori interni dove il bordo standard sarebbe troppo forte.

### Dark Mode (parallel palette)
- **Notte** (`#0E0E1A`): fondo. Nero-blu profondo, non grigio scuro.
- **Superficie** (`#17172B`): card.
- **Inchiostro chiaro** (`#E9E7FF`): testo primario in dark.
- **Bordo dark** (`#2B2B44`): separatori in dark.

### Named Rules

**The One Voice Rule.** L'indigo `#6366F1` occupa al massimo il 15% di qualsiasi schermata. La sua rarità è il punto. Se serve un secondo "colore importante", non esiste — usa peso tipografico o densità.

**The No-Pure-Neutral Rule.** Nessun grigio è neutro puro. Tutti i bianchi, grigi e neri portano una traccia di hue indigo (~280°). `#FFFFFF` è ammesso solo come `surface` di card/modal; tutti gli altri "bianchi" sono lavanda-tinta.

**The Color-Is-Not-The-Signal Rule.** I colori cliente (palette hash + override manuale) sono un *aiuto* visivo, non l'unico segnale. Nome cliente + colore, mai solo colore. Il daltonismo non deve mai rompere la lettura del calendario.

## 3. Typography

**Display Font:** Geist (con fallback `system-ui, sans-serif`)
**Body Font:** Geist
**Mono Font:** Geist Mono (con fallback `ui-monospace, monospace`)

**Character:** Geist è la firma del registro "strumento tecnico contemporaneo curato" — la stessa famiglia usata da Vercel, Linear-adjacent, post-Inter. Pulita ma non sterile, ottima a tutti i pesi, ottima in mono. La presenza di Geist Mono per i numeri delle ore è una scelta esplicita: i numeri sono dati, non testo.

### Hierarchy
- **Display** (800, `text-3xl` ≈ 30px, line-height 1.1, tracking `-0.02em`): titoli pagina nei modal fullscreen ("DailyLog" header, titolo Settings, titolo Search). Usato solo nei punti di ingresso a un contesto.
- **Headline** (600, `text-base` ≈ 16px, line-height 1.3): titoli di card, nomi giorno nell'editor, sezioni grandi del SummaryPanel.
- **Title** (600, `text-sm` ≈ 14px): titoli di sotto-sezione, nomi cliente nelle liste totali.
- **Body** (400, `text-sm` ≈ 14px, line-height 1.5): testo standard di form, note, descrizioni. Max 65-75ch nei campi note prosa.
- **Label** (600, `text-xs` ≈ 12px, letter-spacing `0.05em`, UPPERCASE): label di sezione ("DailyLog" sopra ai titoli modal, "DA FARE" / "FATTI" nei todo, header colonne).
- **Mono** (500, `text-[13px]`): tutti i numeri di ore, totali, valori temporali. Mai sans per i numeri.

### Named Rules

**The Numbers-In-Mono Rule.** Qualunque cifra che rappresenti ore, minuti, totali o percentuali va in Geist Mono. Il sans è per il linguaggio, il mono è per i dati. Eccezione: cifre dentro a un titolo prosa ("3 task ricorrenti").

**The Uppercase-Is-A-Frame Rule.** L'uppercase è riservato alle label di sezione (12px, tracking allargato). Non usarlo mai su testo lungo, mai su CTA. Inquadra una sezione, non urla un'azione.

**The Weight-Carries-Hierarchy Rule.** La gerarchia tipografica vive nel contrasto di peso (400 → 600 → 800), non in una cascata di size. Tra body e headline c'è solo +2px, ma +200 di peso. Tra headline e display c'è il salto di scala.

## 4. Elevation

DailyLog è **flat-by-default**. I bordi (1px, `#E7E6F2`) sono il segnale primario di separazione tra superfici. Le ombre esistono ma sono ambientali, non strutturali — fanno galleggiare un modal sopra al fondo, non "alzano" una card sopra a un'altra.

### Shadow Vocabulary
- **si** (`0 1px 2px rgba(40,40,80,0.04), 0 4px 12px rgba(40,40,80,0.04)`): ombra di default per controlli attivi (segmented active, dropdown aperti). Quasi invisibile, dichiara solo lo stato.
- **si-lg** (`0 4px 24px rgba(40,40,80,0.08)`): ombra dei modal non-fullscreen. Galleggiamento, non altitudine.
- **soft** (`0 16px 35px rgba(15, 23, 42, 0.12)`): ombra per overlay rari (popover ricchi). Usata con cautela.

### Named Rules

**The Border-Before-Shadow Rule.** Se una superficie deve essere distinta dalla vicina, prima si prova con un bordo `border-si-border` (1px). L'ombra è solo per stati (attivo, hover di chip, modal galleggiante), mai per gerarchia statica.

**The Flat-Cards Rule.** Le card del SummaryPanel, le celle del calendario, i blocchi del WeekView sono *flat*. Niente ombra a riposo. L'ombra appare solo su hover di elementi interattivi e su modal.

## 5. Components

### Buttons
- **Shape:** pill (`rounded-full`, 9999px) per CTA, `rounded-lg` (12px) per ghost icon-only.
- **Primary:** background `si-ink` (`#1B1B2E`), testo `si-surface` bianco, `px-4 py-2 text-sm font-semibold tracking-tight`. È la voce dell'app — usata per l'azione singola principale di un contesto.
- **Hover/Focus:** transizione `all 200ms`; hover scurisce il background verso `si-ink-soft`. Focus ring usa l'accent indigo (`#6366F1`), `outline: 2px solid` con offset.
- **Secondary:** background `si-surface`, bordo `si-border`, testo `si-ink`.
- **Ghost (icon button):** background trasparente, `text-si-gray`; hover: `bg-si-muted` + `text-si-ink`. Padding `p-2`, `rounded-xl`.

### Segmented (toggle group)
- **Shape:** `rounded-full` container con `bg-si-muted` + bordo `si-border` + padding 1px.
- **Active item:** background bianco, `text-si-ink`, shadow `si`. La superficie bianca esce dalla scanalatura lavanda.
- **Inactive item:** background trasparente, `text-si-gray`, hover → `text-si-ink`.
- **Tipografia:** label 12px semibold.

### Cards (SummaryPanel, ProjectView item)
- **Corner Style:** `rounded-[20px]` (xl).
- **Background:** `si-surface` (bianco) su fondo lavanda — il contrasto della superficie è il segnale.
- **Shadow:** nessuna a riposo (Flat-Cards Rule). Bordo `si-border` 1px se serve definire il confine.
- **Internal Padding:** `p-5` (20px) standard; `p-4` per card dense; `p-6` per hero del SummaryPanel.

### Calendar Cell (DayCell)
- **Shape:** rettangoli quadri, `rounded-md` (12px) sull'esterno della cella.
- **Background:** `si-surface` per giorni feriali, `si-weekend` (`#EFEEF7`) per sabato/domenica.
- **Bordo:** 1px `si-border`. Hover/today: bordo passa ad accent indigo.
- **Slot blocks interni:** strisce 30-min con colore cliente (hash-derived) su superficie semi-trasparente; gap `1px` tra slot.

### Inputs (text, select, combobox)
- **Style:** background `si-surface`, bordo `si-border` 1px, `rounded-lg` (12px), padding `px-3 py-2`, font 14px.
- **Focus:** bordo passa ad `si-accent` (`#6366F1`), shadow ambient `0 0 0 3px rgba(99,102,241,0.15)`. Mai un focus ring esterno spesso — il bordo cambia colore e si aggiunge un alone diffuso.
- **Disabled:** `opacity-50`, cursor `not-allowed`.

### Modal
- **Fullscreen** (Editor, Settings, Search): `fixed inset-0 lg:left-20` (lascia spazio alla sidebar), background `si-bg`. Close button in alto a destra, ghost. Header con label uppercase ("DailyLog") + titolo `text-3xl font-extrabold`.
- **Centered:** `max-w-2xl`, `rounded-[20px]`, background `si-surface`, shadow `si-lg`, backdrop `bg-si-ink/20` con `backdrop-blur-sm`.

### Navigation (Sidebar)
- **Style:** sidebar fissa `lg:w-20`, background `si-surface`, separatore destro `border-si-border`.
- **Item:** icona 20px + label 11px sotto, vertical stack. Default `text-si-gray`. Hover: `text-si-ink`. Active: `text-si-accent` + indicatore (bg `si-accent-bg`).

### Toast (slot lock, feedback rapido)
- **Style:** background `si-ink` (scuro su lavanda), testo bianco, `rounded-lg`, shadow `si-lg`. Compare in basso al centro, durata ~2s, transizione opacity + transform-y.

## 6. Do's and Don'ts

### Do:
- **Do** usare l'accent indigo (`#6366F1`) per **una sola** azione/stato per schermata. La One Voice Rule è il vincolo più importante della palette.
- **Do** usare Geist Mono per tutti i numeri di ore, minuti, totali, percentuali. Numeri in sans = dati confusi con prosa.
- **Do** scegliere un bordo `si-border` 1px prima di pensare a un'ombra. Border-Before-Shadow Rule.
- **Do** rispettare la densità: `gap-1` tra slot 30-min, `gap-2` tra giorni, `p-5` nei modal. La densità è il registro power-tool.
- **Do** tingere ogni grigio verso l'hue indigo. Il bianco di sfondo non esiste; esiste `si-bg #F4F3FB`.
- **Do** mantenere il dark mode reale e parallelo. Stesso schema, stesse regole, palette spostata. Non un afterthought.
- **Do** scrivere microcopy asciutto, in italiano, indicativo presente ("Salva", "Aggiungi attività", non "Vuoi salvare?").
- **Do** usare uppercase + tracking allargato solo per label di sezione 12px. Mai per CTA.

### Don't:
- **Don't** usare `#000` o `#fff` come neutri di interfaccia. Solo `si-ink` e `si-surface`.
- **Don't** mettere ombre sotto le card a riposo. Flat-Cards Rule.
- **Don't** usare border-left/right >1px come strisce colorate decorative su card o list item. Mai. Se serve segnalare uno stato categoriale, usa background tint o un dot a sinistra.
- **Don't** usare gradient text (`background-clip: text`). Mai. La gerarchia vive nel peso, non in un effetto.
- **Don't** introdurre glassmorphism (blur + trasparenza decorativa). L'unica eccezione è il backdrop del modal centrato, e basta.
- **Don't** disegnare un "hero metric" template (numero gigante + label piccola + accent gradient). È il template SaaS B2B per eccellenza, esplicitamente vietato.
- **Don't** ripetere card identiche con icona + heading + testo. Se servono N item ripetuti, devono variare in densità, peso o tipo.
- **Don't** evocare il look enterprise legacy: tabelle dense grigie, dropdown nidificati, label criptiche, bordi pesanti. Vietato.
- **Don't** evocare il look consumer giocoso: mascotte, animazioni rimbalzanti (bounce/elastic), emoji decorative nei microcopy, palette pastello sgargiante. Vietato.
- **Don't** scegliere il dark mode "perché tool". Light è il default; dark è una scelta esplicita dell'utente, e va trattata come prima cittadina, non come riskin.
- **Don't** animare proprietà di layout (width/height/top/left). Usa transform e opacity. Easing: ease-out-quart o simili, mai bounce, mai elastic.
- **Don't** usare em dash (—) nei microcopy. Virgola, due punti, parentesi, o punto.
