<p align="center">
  <img src="public/icons/icon-192.png" alt="DailyLog logo" width="128" />
</p>

## DailyLog Webapp (PWA)

Local web app for tracking daily work with a monthly calendar view.

### Purpose

- Track daily activities and tasks.
- Count workdays per client at the end of the month.
- Keep operational notes (blockers, next steps, activity log).

### Key Features

- Monthly calendar (Mon-Sun) with highlighted weekends.
- Each day has two time slots: `AM` and `PM`.
- Daily editor with tasks valued at `0.5` or `1` day.
- Task types: `internal`, `client`, `vacation`, `event`.
- Monthly summary (totals and clients).
- Local-first persistence using `localStorage`.
- Export/Import JSON for all `dailylog:v1:*` keys.
- Installable PWA mode with `manifest` + `service worker`.

### Project Structure

- `index.html` -> web entry point
- `src/renderer/main.jsx` -> React bootstrap
- `src/renderer/App.jsx` -> main application
- `src/renderer/components/*`
- `src/renderer/services/*`
- `src/renderer/domain/*`
- `src/renderer/utils/*`
- `public/manifest.webmanifest`
- `public/sw.js`
- `dailylog.html` -> legacy entry point (redirects to `index.html`)

### Requirements

- Node.js 20+
- npm

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open `http://localhost:5173`.

### Build and Preview

```bash
npm run build
npm run preview
```

### Deploy to GitHub Pages

The repository includes a workflow:

- `.github/workflows/deploy-pages.yml`

One-time setup on GitHub:

1. Open `Settings > Pages`.
2. In `Build and deployment`, select `Source: GitHub Actions`.
3. Push to `main` (or `master`): the workflow builds `dist/` and publishes to Pages.

Typical final URL:

- `https://<username>.github.io/<repo>/`

### Install as Web App

After deploying to HTTPS (or on `localhost`), use `Install app` in Chrome/Edge.

### Data Notes

- Data stays in the browser/device (localStorage).
- Use `Export`/`Import` JSON for backup and migration.
