<p align="center">
  <img src="public/icons/icon-192.png" alt="DailyLog logo" width="128" />
</p>

## DailyLog Webapp (PWA)

Web app locale per tracciare il lavoro giornaliero con calendario mensile.

### Obiettivo

- Tracciare attivita giornaliere.
- Contare a fine mese le giornate per cliente.
- Tenere note operative (blocker, next step, diario).

### Funzionalita principali

- Calendario mensile lun-dom con weekend evidenziati.
- Ogni giorno ha due slot: `AM` e `PM`.
- Editor giornaliero con task da `0.5` o `1` giornata.
- Tipi task: `internal`, `client`, `vacation`, `event`.
- Riepilogo mensile (totali e clienti).
- Persistenza local-first su `localStorage`.
- Export/Import JSON di tutte le chiavi `dailylog:v1:*`.
- Modalita PWA installabile con `manifest` + `service worker`.

### Struttura progetto

- `index.html` -> entry web
- `src/renderer/main.jsx` -> bootstrap React
- `src/renderer/App.jsx` -> app principale
- `src/renderer/components/*`
- `src/renderer/services/*`
- `src/renderer/domain/*`
- `src/renderer/utils/*`
- `public/manifest.webmanifest`
- `public/sw.js`
- `dailylog.html` -> entry legacy (redirect a `index.html`)

### Requisiti

- Node.js 20+
- npm

### Sviluppo locale

1. Installa dipendenze:

```bash
npm install
```

2. Avvia in sviluppo:

```bash
npm run dev
```

3. Apri `http://localhost:5173`.

### Build e preview

```bash
npm run build
npm run preview
```

### Deploy GitHub Pages

Il repository include il workflow:

- `.github/workflows/deploy-pages.yml`

Passi una tantum su GitHub:

1. Apri `Settings > Pages`.
2. In `Build and deployment`, seleziona `Source: GitHub Actions`.
3. Fai push su `main` (o `master`): il workflow builda `dist/` e pubblica su Pages.

URL finale tipico:

- `https://<utente>.github.io/<repo>/`

### Deploy Firebase Hosting (opzionale)

Se preferisci mantenere Firebase Hosting:

1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase use --add`
4. `npm run deploy:web`

La pubblicazione usa `firebase.json` e la cartella `dist/`.

### Installazione come web app

Dopo deploy HTTPS (o su `localhost`), in Chrome/Edge usa `Installa app`.

### Note dati

- I dati restano nel browser/dispositivo (localStorage).
- Per backup e migrazione usa `Export`/`Import` JSON.
