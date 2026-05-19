# Tech-Stack Plan — Imposter Game Web App (Final)

## Why this plan exists

Before any feature plans get drafted, the project needs a foundational decision on what to build the web app with. This document locks in the technologies, the general architecture, the deployment target, and the path to a future mobile app — so every feature plan downstream can assume the same foundation.

## The decision

**Stack:**
- **Svelte** (component framework)
- **Vite** (dev server + build tool)
- **Plain JavaScript** (not TypeScript — defer until comfortable with Svelte basics)
- **PWA** (Progressive Web App — manifest + service worker for installability and offline support)
- **Static hosting** on GitHub Pages, Vercel, or Netlify (all free, all trivial for Vite output)

**Long-term mobile path:** Wrap the finished PWA with **Capacitor** to ship to iOS App Store and Google Play Store using the same codebase. No rewrite required.

## Why Svelte + Vite + PWA

**Svelte (vs React / Vue / vanilla):**
- Least boilerplate of the popular frameworks — `.svelte` files look like enhanced HTML, which suits someone new to web dev.
- Reactivity is built in (no `useState`, no `setState`); writing `let count = 0` and updating it just works.
- Compiles to small, fast vanilla JS at build time — no large runtime shipped to users.
- Component model maps cleanly to the game's screens (Setup, Reveal, Pass, Discussion, Results).

**Vite:**
- Near-instant dev server with hot reload — edit a file, see the change immediately.
- Sensible defaults; very little config to learn upfront.
- Official Svelte starter template (`npm create vite@latest -- --template svelte`).

**PWA from day one:**
- Installable on phones and desktops directly from the browser — no app store needed for v1.
- Service worker enables offline play, which matters for a party game where Wi-Fi may be flaky.
- Provides the bridge to native app stores later via Capacitor without a rewrite.

**Plain JS, not TypeScript:**
- One less thing to learn while picking up Svelte fundamentals. Can migrate to TS later — Svelte supports it natively.

## High-level architecture

The game is essentially a **screen-based state machine**:

```
[Setup Screen]
     ↓ (Start Game)
[Reveal Screen] ←─ loop until all players seen ─┐
     ↓ (Hide & Pass)                            │
[Pass Screen] ───── (Next player taps) ─────────┘
     ↓ (last player)
[Discussion Screen]
     ↓ (Vote / Reveal)
[Results Screen]
     ↓ (New Game)
back to [Setup Screen]
```

State held in a single Svelte store (`game-state.js`) — current screen, player count, impostor count, assigned roles, current player index, chosen word, word source. Persistent settings (custom word lists, last config) saved to `localStorage`.

No backend. No accounts. No real-time networking. Word lists ship as static JSON files in `public/data/`.

## Proposed folder layout for the build

The actual code lives in `02-development/workflow/03-builds/` once the development pipeline picks this up. Proposed shape:

```
imposter-game-app/
├── public/
│   ├── manifest.webmanifest        ← PWA install metadata
│   ├── icons/                      ← App icons (192, 512, etc.)
│   └── data/
│       └── common-nouns.json       ← The 644 nouns from the example
├── src/
│   ├── main.js                     ← Vite entry point, mounts App
│   ├── App.svelte                  ← Root component (screen router)
│   ├── app.css                     ← Global styles
│   ├── lib/
│   │   ├── game-state.js           ← Svelte store: current state of a game
│   │   ├── word-source.js          ← Load word list, pick random word
│   │   └── shuffle.js              ← Assign impostor(s) randomly
│   ├── screens/
│   │   ├── SetupScreen.svelte
│   │   ├── RevealScreen.svelte
│   │   ├── PassScreen.svelte
│   │   ├── DiscussionScreen.svelte
│   │   └── ResultsScreen.svelte
│   ├── components/                 ← Reusable UI pieces (Button, Card, etc.)
│   └── service-worker.js           ← Offline caching
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## What's deferred (deliberately out of scope)

- **TypeScript** — adopt once comfortable with Svelte
- **Testing framework** (Vitest, Playwright) — add when the codebase is large enough to warrant it
- **Backend, accounts, multiplayer sync** — pass-and-play doesn't need them
- **Capacitor mobile wrap** — defer until web MVP is polished and stable
- **Theme switching (light/dark)** — design-system says dark default, light optional; revisit at design stage
- **Internationalization** — single-language for now

## What Rehaan will need to learn / install

Tooling (one-time setup):
- **Node.js** (LTS version) — runs the dev server and build
- **npm** (comes with Node) — installs Svelte, Vite, and dependencies
- A code editor (already on VSCode)

Concepts to get familiar with (in rough order):
1. Running terminal commands in the project folder (`npm install`, `npm run dev`)
2. Svelte component basics (the `<script>` / markup / `<style>` blocks in a `.svelte` file)
3. Svelte stores (for shared game state across screens)
4. PWA basics (manifest file, what a service worker does)
5. Static deployment (pushing the built `dist/` folder to GitHub Pages or similar)

Good starting resources: the official Svelte tutorial at svelte.dev/tutorial and the Vite getting-started guide.

## Risks / open questions

- **PWA polish takes effort.** Getting the install prompt, icons, and offline behaviour right is its own small project. Worth a dedicated plan later.
- **No clear answer yet on test strategy.** Probably fine to defer, but worth a separate plan when the game logic starts getting complex.
- **Word-list management UI** — built-in lists only, or custom user lists too? Will need its own feature plan.

## Status

Final. Approved by Rehaan. Brief and spec for the initial project scaffold derived from this plan live in `02-development/workflow/01-brief/project-scaffold-brief.md` and `02-development/workflow/02-specs/project-scaffold-spec.md`.
