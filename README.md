# Imposter Game

A web app version of the party game **Imposter** (pass-and-play, similar to Spyfall). Players pass a single device around — most see a secret word, one or more impostors don't. Group discussion follows; the goal is to identify the impostor(s) without giving the word away.

## Status

**Setup screen (player count + start) complete** — the first piece of real game logic shipped. The `gameState` store + `resetGame()` foundation is now in place, opening the app shows the real Setup screen instead of the scaffold placeholder, and the production build is clean. Next up: word source loading and the reveal screen.

## Features built

| Feature | Plan | Brief | Spec | Build |
|---|---|---|---|---|
| Project scaffold | [tech-stack-plan-final.md](01-plan/plans/tech-stack-plan-final.md) | [brief](02-development/workflow/01-brief/project-scaffold-brief.md) | [spec](02-development/workflow/02-specs/project-scaffold-spec.md) | [imposter-game-app/](02-development/workflow/03-builds/imposter-game-app/README.md) |
| Setup screen — player count + start | [setup-screen-plan-final.md](01-plan/plans/setup-screen-plan-final.md) | [brief](02-development/workflow/01-brief/setup-screen-brief.md) | [spec](02-development/workflow/02-specs/setup-screen-spec.md) | [SetupScreen.svelte](02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) |

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
