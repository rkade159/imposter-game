# Imposter Game

A web app version of the party game **Imposter** (pass-and-play, similar to Spyfall). Players pass a single device around — most see a secret word, one or more imposters don't. Group discussion follows; the goal is to identify the imposter(s) without giving the word away.

## Status

**Playable start to finish** — a full round now runs Setup → Reveal → Pass → Discussion → **Results** → back to Setup. On Start, roles are assigned with a Fisher–Yates shuffle and the device passes player-to-player: each player privately taps to reveal whether they hold the secret word or are the imposter, then hands off through a neutral pass screen. After everyone has revealed, the discussion screen offers a **"Reveal the imposter(s)"** button (behind a confirmation guard); confirming opens the **Results** screen, which names the imposter(s) by player number and reveals the secret word. **"Play again"** returns to Setup with the previous round's settings pre-filled. **Screen routing** is a `screen` field on `gameState` driving an `{#if}` ladder in `App.svelte`. Production build is clean. Next up: real discussion mechanics (timer + voting) and a Settings menu (e.g. toggling the reveal confirmation).

## Features built

| Feature | Plan | Brief | Spec | Build |
|---|---|---|---|---|
| Project scaffold | [tech-stack-plan-final.md](01-plan/plans/tech-stack-plan-final.md) | [brief](02-development/workflow/01-brief/project-scaffold-brief.md) | [spec](02-development/workflow/02-specs/project-scaffold-spec.md) | [imposter-game-app/](02-development/workflow/03-builds/imposter-game-app/README.md) |
| Setup screen — player count + start | [setup-screen-plan-final.md](01-plan/plans/setup-screen-plan-final.md) | [brief](02-development/workflow/01-brief/setup-screen-brief.md) | [spec](02-development/workflow/02-specs/setup-screen-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) |
| Impostor count + word source | [impostor-count-and-word-source-plan-final.md](01-plan/plans/impostor-count-and-word-source-plan-final.md) | [brief](02-development/workflow/01-brief/impostor-count-and-word-source-brief.md) | [spec](02-development/workflow/02-specs/impostor-count-and-word-source-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) + [Stepper.svelte](02-development/workflow/03-builds/imposter-game-app/src/components/Stepper.svelte) |
| Reveal + pass gameplay loop | [reveal-pass-screens-plan-final.md](01-plan/plans/reveal-pass-screens-plan-final.md) | [brief](02-development/workflow/01-brief/reveal-pass-screens-brief.md) | [spec](02-development/workflow/02-specs/reveal-pass-screens-spec.md) | [RevealScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) + [PassScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/PassScreen.svelte) + [game-state.js](02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) |
| Results screen — reveal + play again | [results-screen-plan-final.md](01-plan/plans/results-screen-plan-final.md) | [brief](02-development/workflow/01-brief/results-screen-brief.md) | [spec](02-development/workflow/02-specs/results-screen-spec.md) | [ResultsScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) + [DiscussionScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte) + [game-state.js](02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) |

## Tech Stack

- **Svelte** + **Vite** + plain JavaScript
- **PWA** from day one (installable, offline-capable)
- Statically hosted (GitHub Pages, Vercel, or Netlify — TBD)
- **Capacitor** is the planned path for a future iOS / Android app store port

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

Full notes and folder map are in the scaffold's [README](02-development/workflow/03-builds/imposter-game-app/README.md).

## Long-Term Direction

Web app first. Once the web version is polished, wrap with Capacitor and ship to the iOS App Store and Google Play Store using the same codebase.
