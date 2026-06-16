# Imposter Game

A web app version of the party game **Imposter** (pass-and-play, similar to Spyfall). Players pass a single device around — most see a secret word, while one or more imposters instead get a deliberately vague hint. Group discussion follows; the goal is to identify the imposter(s) without giving the word away.

## Status

**Playable start to finish** — a full round now runs Setup → Reveal → Pass → Discussion → **Results** → back to Setup. On Setup the host picks the player and imposter counts, the word source, and can optionally **type a name for each player** (the list of name fields grows/shrinks with the player count; blank fields fall back to "Player N"). On Start, roles are assigned with a Fisher–Yates shuffle and the device passes player-to-player: each player privately reveals whether they hold the secret word or are the imposter — using the **reveal animation chosen in Settings** (see below) — imposters are shown a deliberately vague hint to help them blend in, then the device hands off through a neutral pass screen. The reveal, pass, and results screens all use the typed **names** (e.g. "Pass to Sam", "The imposter was Priya") in place of "Player N". After everyone has revealed, the discussion screen offers a **"Reveal the imposter(s)"** button (behind a confirmation guard); confirming opens the **Results** screen, which names the imposter(s) and reveals both the secret word and the imposter's hint. **"Play again"** returns to Setup with the previous round's settings **and names** pre-filled. **Screen routing** is a `screen` field on `gameState` driving an `{#if}` ladder in `App.svelte`. A **Settings screen** (reached from a Settings button on Setup, shown in place of the form so the half-filled setup survives) now hosts app preferences: **Grayscale mode**, which turns the whole app black-and-white so the imposter's red reveal card can't be read by glance or reflection, the **Anti-Yusuf Feature**, a gag toggle that refuses to start the round and instead calls out whoever is last to pass the phone, and a **Reveal animation** selector that switches how each player learns their role between **Classic** (the quick tap-to-reveal), **Secret letter** (a sealed envelope you press and hold to open, the flap swinging up as a note slides out) and **Wheel of Fate** (a rigged spinning wheel you hold to slow to a stop on your role) — the choice persists across rounds and defaults to Classic. Production build is clean. The app is also now **wrapped with Capacitor for Android** — the native project is generated and the build is ready to compile into an `.aab` and submit to the Google Play Store (web behaviour is unchanged; see the [runbook](02-development/workflow/03-builds/imposter-game-app/RUNBOOK.md)). Next up: real discussion mechanics (timer + voting), more Settings options (e.g. toggling the reveal confirmation or the imposter hint), design polish for the setup screen's names section, and replacing the placeholder app icon/splash with designed artwork.

## Features built

| Feature | Plan | Brief | Spec | Build |
|---|---|---|---|---|
| Project scaffold | [tech-stack-plan-final.md](01-plan/plans/tech-stack-plan-final.md) | [brief](02-development/workflow/01-brief/project-scaffold-brief.md) | [spec](02-development/workflow/02-specs/project-scaffold-spec.md) | [imposter-game-app/](02-development/workflow/03-builds/imposter-game-app/README.md) |
| Setup screen — player count + start | [setup-screen-plan-final.md](01-plan/plans/setup-screen-plan-final.md) | [brief](02-development/workflow/01-brief/setup-screen-brief.md) | [spec](02-development/workflow/02-specs/setup-screen-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) |
| Impostor count + word source | [impostor-count-and-word-source-plan-final.md](01-plan/plans/impostor-count-and-word-source-plan-final.md) | [brief](02-development/workflow/01-brief/impostor-count-and-word-source-brief.md) | [spec](02-development/workflow/02-specs/impostor-count-and-word-source-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) + [Stepper.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/Stepper.svelte) |
| Reveal + pass gameplay loop | [reveal-pass-screens-plan-final.md](01-plan/plans/reveal-pass-screens-plan-final.md) | [brief](02-development/workflow/01-brief/reveal-pass-screens-brief.md) | [spec](02-development/workflow/02-specs/reveal-pass-screens-spec.md) | [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) + [PassScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte) + [game-state.js](02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) |
| Results screen — reveal + play again | [results-screen-plan-final.md](01-plan/plans/results-screen-plan-final.md) | [brief](02-development/workflow/01-brief/results-screen-brief.md) | [spec](02-development/workflow/02-specs/results-screen-spec.md) | [ResultsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) + [DiscussionScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte) + [game-state.js](02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) |
| Imposter hint word | [imposter-hint-word-plan-final.md](01-plan/plans/imposter-hint-word-plan-final.md) | [brief](02-development/workflow/01-brief/imposter-hint-word-brief.md) | [spec](02-development/workflow/02-specs/imposter-hint-word-spec.md) | [common-nouns.json](02-development/workflow/03-builds/imposter-game-app/public/data/common-nouns.json) + [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) + [ResultsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) |
| Android Play Store port (Capacitor) | [android-play-store-port-plan-final.md](01-plan/plans/android-play-store-port-plan-final.md) | [brief](02-development/workflow/01-brief/android-play-store-port-brief.md) | [spec](02-development/workflow/02-specs/android-play-store-port-spec.md) | [RUNBOOK.md](02-development/workflow/03-builds/imposter-game-app/RUNBOOK.md) + [native.js](02-development/workflow/03-builds/imposter-game-app/src/lib/native.js) + [android/](02-development/workflow/03-builds/imposter-game-app/android/) |
| Editable player names | [editable-player-names-plan-final.md](01-plan/plans/editable-player-names-plan-final.md) | [brief](02-development/workflow/01-brief/editable-player-names-brief.md) | [spec](02-development/workflow/02-specs/editable-player-names-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) + [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) + [PassScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte) + [ResultsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) + [game-state.js](02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) |
| Grayscale mode | [grayscale-mode-plan-final.md](01-plan/plans/grayscale-mode-plan-final.md) | [brief](02-development/workflow/01-brief/grayscale-mode-brief.md) | [spec](02-development/workflow/02-specs/grayscale-mode-spec.md) | [settings.js](02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js) + [Toggle.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/Toggle.svelte) + [SettingsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) + [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) + [App.svelte](02-development/workflow/03-builds/imposter-game-app/src/App.svelte) + [app.css](02-development/workflow/03-builds/imposter-game-app/src/app.css) |
| Anti-Yusuf Feature | [anti-yusuf-feature-plan-final.md](01-plan/plans/anti-yusuf-feature-plan-final.md) | [brief](02-development/workflow/01-brief/anti-yusuf-feature-brief.md) | [spec](02-development/workflow/02-specs/anti-yusuf-feature-spec.md) | [session-settings.js](02-development/workflow/03-builds/imposter-game-app/src/lib/session-settings.js) + [Modal.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/Modal.svelte) + [SettingsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) + [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) |
| Reveal animation: Secret letter + style selector | [letter-reveal-animation-plan-final.md](01-plan/plans/letter-reveal-animation-plan-final.md) | [brief](03-design/workflow/01-brief/letter-reveal-animation-brief.md) | [spec](03-design/workflow/02-specs/letter-reveal-animation-spec.md) | [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) + [reveal-styles.js](02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js) + [Select.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/Select.svelte) + [settings.js](02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js) + [SettingsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) |
| Reveal animation: Wheel of Fate | [wheel-reveal-animation-plan-final.md](01-plan/plans/wheel-reveal-animation-plan-final.md) | [brief](03-design/workflow/01-brief/wheel-reveal-animation-brief.md) | [spec](03-design/workflow/02-specs/wheel-reveal-animation-spec.md) | [WheelReveal.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/WheelReveal.svelte) + [reveal-styles.js](02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js) + [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) |

## Tech Stack

- **Svelte** + **Vite** + plain JavaScript
- **PWA** from day one (installable, offline-capable)
- Statically hosted on **Netlify** (git-connected auto-deploy from `main`)
- **Capacitor** wraps the app for **Android** (Google Play) — done. iOS deferred (needs a Mac); the codebase stays compatible for later.

Full reasoning in [`01-plan/plans/tech-stack-plan-final.md`](01-plan/plans/tech-stack-plan-final.md).

## Repo Layout

This repo isn't a typical app codebase — it's a **workspace system** with three siloed pipelines (planning, development, design). Each silo owns one stage of the work and routes agents in via its own `CONTEXT.md`.

```
imposter-game/
├── CLAUDE.md          ← Always-loaded map of the repo
├── CONTEXT.md         ← Task router (which workspace to go to)
├── CHECKLIST.md       ← Per-session reminders
├── README.md          ← You are here
│
├── 01-plan/           ← Brainstorming → polished plans
├── 02-development/    ← Plans → briefs → specs → built code
└── 03-design/         ← Plans → briefs → specs → built designs
```

Each workspace has its own `CONTEXT.md` with full per-task load tables — read those before working in a workspace.

## Working in This Repo

Start at [`CONTEXT.md`](CONTEXT.md) — it routes you to the right workspace for your task. The naming and file-placement conventions are documented in [`CLAUDE.md`](CLAUDE.md).

## Running the App

The scaffold lives at [`02-development/workflow/03-builds/imposter-game-app/`](02-development/workflow/03-builds/imposter-game-app/). From inside that folder:

- `npm install` — install dependencies (one time)
- `npm run dev` — local dev server with hot reload
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally (use this to test PWA install)
- `npm run android:open` — build, sync, and open the Android project in Android Studio

Full notes and folder map are in the scaffold's [README](02-development/workflow/03-builds/imposter-game-app/README.md). Android build, signing, and Play Store submission steps are in the [RUNBOOK](02-development/workflow/03-builds/imposter-game-app/RUNBOOK.md).

## Long-Term Direction

Web app first, then native. The web version ships on Netlify and is now also wrapped with Capacitor for **Android** (Google Play) from the same codebase. **iOS** is deferred until a Mac is available — adding it is one command (`npx cap add ios`) on the existing project, no rewrite.
