# Spec — Initial Project Scaffold

## Source brief

[02-development/workflow/01-brief/project-scaffold-brief.md](../01-brief/project-scaffold-brief.md)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It says WHAT must be true once the scaffold is built. It does NOT dictate exact commands, file content, or library versions — the builder makes those calls within the constraints below.

## What must exist (deliverables)

The build must result in a self-contained Vite + Svelte PWA project at:

```
02-development/workflow/03-builds/imposter-game-app/
```

With the following structure present (files may be empty stubs unless otherwise noted):

```
imposter-game-app/
├── public/
│   ├── manifest.webmanifest        ← valid PWA manifest (see acceptance criteria)
│   ├── icons/                      ← at least placeholder icons at 192px and 512px
│   └── data/                       ← empty for now (word lists come later)
├── src/
│   ├── main.js                     ← Vite entry point
│   ├── App.svelte                  ← renders the placeholder home screen
│   ├── app.css                     ← baseline global styles (see criteria below)
│   ├── lib/
│   │   ├── game-state.js           ← stub (empty Svelte store is fine)
│   │   ├── word-source.js          ← stub
│   │   └── shuffle.js              ← stub
│   ├── screens/
│   │   ├── SetupScreen.svelte      ← stub: renders a placeholder label only
│   │   ├── RevealScreen.svelte     ← stub
│   │   ├── PassScreen.svelte       ← stub
│   │   ├── DiscussionScreen.svelte ← stub
│   │   └── ResultsScreen.svelte    ← stub
│   ├── components/                 ← empty or stub
│   └── service-worker.js           ← minimal offline-capable worker
├── index.html                      ← valid HTML5 entry
├── package.json
├── vite.config.js
├── .gitignore                      ← at minimum excludes node_modules/ and dist/
└── README.md                       ← run/build instructions
```

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Runs and builds

1. **Install succeeds.** Running the project's install command (e.g. `npm install`) from inside `imposter-game-app/` completes with no errors.
2. **Dev server runs.** Running the dev command (e.g. `npm run dev`) starts a local server, opens a port, and serves the app. Visiting the URL in a modern browser shows the placeholder home screen without console errors.
3. **Production build succeeds.** Running the build command (e.g. `npm run build`) produces a `dist/` folder containing static assets. No build errors or warnings about missing files.
4. **Built output is servable.** Serving the `dist/` folder with any static file server renders the same placeholder home screen.

### PWA-readiness

5. **Manifest is valid.** `public/manifest.webmanifest` parses as JSON and includes at minimum: `name`, `short_name`, `start_url`, `display` (set to `standalone` or `fullscreen`), `background_color`, `theme_color`, and an `icons` array referencing the placeholder icons.
6. **Manifest is linked.** `index.html` references the manifest via `<link rel="manifest" ...>`.
7. **Service worker registers.** When the app loads in production mode, a service worker registers successfully (verifiable in browser DevTools → Application → Service Workers).
8. **Install prompt appears.** Loading the production build in Chrome shows the browser's "Install" affordance (address-bar install icon) — confirming the manifest is interpreted correctly.

### Look and feel (baseline only — design comes later)

9. **Font.** Body text uses Inter (or system sans-serif fallback if Inter isn't loaded yet).
10. **Theme default.** Default theme is dark (per [design-system.md](../../../03-design/references/design-system.md)) — i.e. dark background, light text, on first load.
11. **Body text size.** Minimum 16px body text.
12. **Container padding.** Main container has at least 24px of padding.
13. **Responsive.** The page renders without horizontal scroll on a 375px-wide viewport (typical phone). `<meta name="viewport" content="width=device-width, initial-scale=1">` is present.
14. **Max content width.** Main content is constrained to at most 1200px wide on desktop.

### Code quality

15. **Plain and simple.** No dependencies beyond what Vite/Svelte/PWA support actually require. No utility libraries (lodash, etc.). No CSS frameworks. No state-management libraries beyond Svelte's built-in stores.
16. **Commented on new blocks.** Per technical-standards.md, new code blocks have a brief explanatory comment.
17. **Stub files compile.** Empty `.svelte` and `.js` stub files don't break the build — they exist, even if they render or export nothing meaningful yet.
18. **No console errors or warnings** when the dev server is running and the placeholder page is loaded.

### Documentation

19. **README exists.** `imposter-game-app/README.md` exists and includes:
    - One-line description ("Scaffold for the Imposter Game web app — see project-scaffold-spec.md for what's in scope")
    - How to install dependencies
    - How to run the dev server
    - How to produce a production build
    - Where each subfolder belongs (one-line each for `src/lib/`, `src/screens/`, `src/components/`, `public/data/`, `public/icons/`)

## What is NOT acceptance criteria (deferred)

These are explicitly **not** required for this build to be considered done. Each will get its own brief later:

- Actual game logic in screens or `lib/` files
- Real word lists in `public/data/`
- Final app icons (placeholders are fine)
- Deployment to GitHub Pages / Netlify / Vercel
- Capacitor mobile wrap
- Theme switching (light/dark toggle)
- TypeScript
- Test framework setup
- CI / lint / format config

## Verification

The builder (or a reviewer) should be able to walk through criteria 1–19 in order, ticking each off. If any one fails, the build is not yet done. No "mostly works."

A reasonable smoke-test sequence:
1. `cd 02-development/workflow/03-builds/imposter-game-app`
2. Run install command — no errors
3. Run dev command — open browser, see placeholder, no console errors
4. Stop dev server, run build command — `dist/` appears, no errors
5. Serve `dist/` (any static server), reload browser, confirm placeholder + service worker registers + install icon shows in Chrome address bar
6. Resize browser to 375px width — no horizontal scroll
7. Open the `README.md` — confirm it answers the questions in criterion 19

## Open questions for the builder

- Vite has community PWA plugins (e.g. `vite-plugin-pwa`) that handle the manifest and service worker. Using one is acceptable if it doesn't pull in heavy unrelated dependencies — the builder decides whether to use it or hand-roll the manifest + a minimal service worker.
- Icons: placeholder PNGs (solid color with a letter "I") are fine. No design effort needed here.
