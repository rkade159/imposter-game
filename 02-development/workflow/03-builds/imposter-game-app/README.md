# Imposter Game App

Scaffold for the Imposter Game web app — see `02-development/workflow/02-specs/project-scaffold-spec.md` for what's in scope.

## Install dependencies

```bash
npm install
```

## Run the dev server

```bash
npm run dev
```

Vite will print a local URL (typically <http://localhost:5173>). Open it in any modern browser: set up a game (player count, imposter count, word source, and optional per-player names) and press Start, then pass the device around — each player taps to reveal their role. Crewmates see the secret word; the imposter sees a deliberately vague hint to help them blend in. The reveal, pass, and results screens use the typed names (blank fields fall back to "Player N"). After everyone has revealed, the discussion screen leads to a results screen that names the imposter(s) and reveals both the word and the imposter's hint, with "Play again" to run another round (settings and names pre-filled). The service worker does **not** register in dev mode by design — see "PWA notes" below.

## Production build

```bash
npm run build
```

Static output is written to `dist/`. Preview the built bundle with:

```bash
npm run preview
```

Or serve `dist/` with any static file server.

## Folder map

| Path | What lives here |
| --- | --- |
| `src/lib/` | Shared logic modules (game state store, word source, shuffle helpers). |
| `src/screens/` | Top-level screen components driven by the screen state machine (setup, reveal, pass, discussion, results). |
| `src/components/` | Reusable UI building blocks shared across screens. |
| `public/data/` | Static `{ word, hint }` JSON decks shipped alongside the app, fetched at runtime. |
| `public/icons/` | App icons referenced from the PWA manifest. |
| `android/` | Generated Capacitor Android project (for the Play Store build). Don't hand-edit web code here — it's synced from `dist/`. |
| `resources/` | Placeholder source icon/splash for Android asset generation. |

## Android / Play Store

This app is wrapped with **Capacitor** for the Google Play Store. To build and run the
Android app, sync the latest web build into the native project:

```bash
npm run android:sync   # vite build + cap sync android
npm run android:open   # the above, then opens Android Studio
```

Full publishing and update instructions (Android Studio setup, signing, store listing,
the release loop) live in **[RUNBOOK.md](RUNBOOK.md)**.

## PWA notes

- The manifest lives at `public/manifest.webmanifest` and is linked from `index.html`.
- The service worker lives at `src/service-worker.js` and is copied to `dist/service-worker.js` by a small Vite plugin on build.
- Registration is gated on `import.meta.env.PROD`, so dev runs are SW-free (avoids the usual "stale dev cache" footguns).
- To verify the install affordance: run `npm run build && npm run preview`, open the preview URL in Chrome, and look for the install icon in the address bar.
