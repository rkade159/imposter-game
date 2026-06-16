# Grayscale Mode Plan (Final)

## Why this plan exists

When the imposter's reveal card appears it is **red** — the `--error` token drives
the card border and the *"YOU ARE THE IMPOSTER!"* title
([RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte), imposter branch).
In playtesting, players exploit that colour: they catch the red from the corner of
their eye, or off a reflection (window, glasses, the person opposite), and know who
the imposter is without ever reading the screen. The colour leak undermines the
whole hidden-role mechanic.

This plan adds a **Grayscale mode** — a toggle, in a new **Settings** screen, that
strips colour from the entire app so role identity can't be inferred from colour or
brightness at a glance.

It also stands up the **Settings area itself** — the first home for the on/off
options that earlier plans deferred (e.g. the discussion-confirmation toggle noted
in `DiscussionScreen.svelte`, and the hint on/off toggle parked in the
[imposter-hint-word plan](imposter-hint-word-plan-final.md)). Grayscale is the first
tenant; the store + screen are built so later toggles drop in with one line.

**Intended outcome:** a group that keeps getting "read" by colour can flip on
Grayscale and play a clean round, with the setting remembered between sessions.

## The feature

1. **A Settings screen**, reached from a **"⚙ Settings" button on the Setup
   screen**. It renders *in place of* the setup form (not a route change), so the
   half-filled form — player count, imposter count, typed names, word source —
   survives opening and closing Settings.
2. **A Grayscale toggle** on that screen. Off by default.
3. **When on, the whole app goes black-and-white** — every screen, every button.
4. **The two role cards become identical.** This is the core requirement, not a
   side effect: a plain desaturate would leave the red and indigo cards at
   *different* gray brightnesses (still a tell). Instead the role tokens resolve to
   the **same** neutral value, so the imposter card and crewmate card differ only by
   their text — which a peeker has to actually read.
5. **The setting persists.** Saved to `localStorage`; flip it once and it stays
   across reloads and app launches.

## The anti-leak design (the heart of the feature)

A bare `filter: grayscale(1)` is **not enough**: it maps red (`#ef4444`) and indigo
(`#6366f1`) to two *different* grays, so "the brighter card" still gives the role
away. The fix is two-layer:

1. **Override the role colour tokens to one shared neutral.** In grayscale mode
   `--accent` and `--error` are set to the **same** gray. Because the crewmate card
   draws its border+title from `--accent` and the imposter card draws them from
   `--error`, they become pixel-identical (the card containers already share
   `.card`). `--success`/`--warning` are neutralised too, for consistency.
2. **Apply `filter: grayscale(1)` as a catch-all** on the app shell, to desaturate
   anything a token doesn't drive — chiefly the emoji (🎭 📝 ✓).

Layer 1 is what closes the tell; layer 2 is the belt-and-suspenders for the rest.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| How far grayscale goes | **Make the two role cards identical**, not just desaturate | A plain filter leaves a brightness tell; identical cards is the only version that actually fixes the leak. *(Rehaan's choice.)* |
| Where Settings is reached | **A button in the Setup flow** | Grayscale is decided before a round or between rounds — exactly where Setup lives. Keeps the control off the sensitive mid-round screens. *(Rehaan's choice.)* |
| Persistence & default | **Persist to localStorage, default OFF** | Nothing changes for existing players unless a group opts in; once on, it stays. *(Rehaan's choice.)* |
| Settings rendering | **In place of the setup form, same mounted component** (local flag, not a route) | SetupScreen remounts on every return to setup and re-reads its seed, so a real route trip would wipe the in-flight form. A local flag preserves it. |
| Where grayscale is applied | **A `grayscale` class on `<html>`** (set from App.svelte) — token overrides at the root + a filter on the shell | The page background lives on `<body>`, *outside* the shell, so the toggle must sit at the root to grayscale the whole screen, not just the content area. One rule still cascades everywhere — no per-screen edits. |
| Settings store shape | **Its own `settings` store**, separate from `gameState` | Settings outlive a round; keeping them out of `gameState` means screen/route changes and Play-again resets never touch them. |

## How it fits the architecture

No new routes — Settings is a local swap inside SetupScreen, and grayscale is a
single cascading class. A new `settings` store sits alongside `gameState`:

```
settings store  { grayscale }  ←→ localStorage 'imposter:settings'
   │ App.svelte: $: html.classList.toggle('grayscale', $settings.grayscale)
   │    └ app.css :root.grayscale { --bg + --accent/--error = one gray }   ← whole screen
   │             :root.grayscale .app-shell { filter: grayscale(1) }       ← emoji/content
   │         └ cascades to <body> bg, RevealScreen cards, ResultsScreen, buttons, chips
   │
SetupScreen  ──[⚙ Settings]──►  SettingsScreen (in place of the form)
   │  local showSettings flag — form state preserved underneath
   └  SettingsScreen → <Toggle bind:value={$settings.grayscale}>  (auto-persists)
```

## Files this affects

| File | Change |
|---|---|
| [src/lib/settings.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js) | **New.** Persisted `settings` writable. Loads from `localStorage` merged under `defaults` (so future keys get a default and legacy keys are ignored); subscribes to write back, guarded against storage failures. `{ grayscale: false }` to start. |
| [src/components/Toggle.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/Toggle.svelte) | **New.** Reusable labelled switch following the `Stepper.svelte` convention — `bind:value`, optional `description`, a real `<input type="checkbox" role="switch">` styled as a slider, using existing tokens. |
| [src/screens/SettingsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) | **New.** "Settings" surface: a vertical list of rows (one `Toggle` for Grayscale mode) + a "← Back to setup" button calling an `onClose` prop. Built so future toggles are one more row. |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | Add a local `showSettings` flag, a "⚙ Settings" ghost button, and `{#if showSettings}<SettingsScreen …/>{:else}…form…{/if}`. Form state untouched (stays mounted). |
| [src/App.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/App.svelte) | Import `settings`; reactively reflect `$settings.grayscale` as a `grayscale` class on `<html>` (`document.documentElement`), so the whole screen — page background included — switches. |
| [src/app.css](../../02-development/workflow/03-builds/imposter-game-app/src/app.css) | Add `:root.grayscale { --bg: <neutral>; --accent/--error: <one neutral>; }` (the root override reaches `<body>`'s page background) plus `:root.grayscale .app-shell { filter: grayscale(1); }` (catches emoji + every in-shell token). |

**Reused, not rebuilt:** the `gameState`-store pattern (mirrored for `settings`),
the `Stepper.svelte` component conventions (mirrored for `Toggle.svelte`), all
`app.css` colour tokens and `.screen`/`.card`/button styles, and the existing
reveal/results markup (no edits — the token override does the work).
`game-state.js`, `word-source.js`, routing, Capacitor, and the service worker are
untouched.

## Conventions to honor

- **User-facing text spells it "imposter"** (never "impostor"); internal
  identifiers like `isImpostor` stay as-is. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- Plain, simple, easy-to-extend code with a comment on each new block.
- No new dependencies — pure Svelte + CSS; mobile-responsive on modern browsers,
  tap targets ≥44px.

## What's deferred (out of scope)

- **Settings reachable from other screens / mid-round.** Entry is the Setup flow
  only for now; lifting the overlay to an app-level control later is a small change.
- **Matching the two cards' emoji/icon.** Grayscale removes the cards' *colour*
  tell; the 🎭 vs 📝 glyph shapes differ but are only legible on a deliberate look,
  so they're left as-is. A shared neutral icon is a possible later refinement.
- **A light theme / other palettes.** This is grayscale-only; broader theming is a
  separate design concern (`03-design`).
- **Other settings** (hint on/off, discussion-confirmation toggle). The store +
  screen are built ready; those toggles are their own features.

## Acceptance (what "done" looks like)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. **Default off:** fresh load (cleared site data) looks exactly as today — red
   imposter card, indigo crewmate card.
2. **Reach Settings:** Setup → **⚙ Settings** shows the Settings screen; **Back to
   setup** returns to the form.
3. **Form preserved:** type names / change counts → open Settings → back → the
   names and counts are still there.
4. **Toggle on:** enabling Grayscale mode turns the whole screen black-and-white
   immediately — buttons, chips, and the page background around the content (no
   navy edges left).
5. **Identical cards (key test):** in a round, the imposter card and a crewmate
   card are indistinguishable except for their words — same border shade, same
   title colour, neither brighter.
6. **Results:** imposter names render neutral gray, not red.
7. **Persistence:** with grayscale on, reload → still gray; turn off, reload →
   stays off.
8. **Regression:** a full play-through works in both modes; Play again still
   preserves group settings. `npm run build` succeeds; no horizontal scroll at
   375px.

Verification is **manual** — the build **writes the checklist; Rehaan runs
`npm run dev`** to verify (per the agreed split).

## Risks / open questions

- **Chosen gray is a judgement call.** `#a8a8b4` reads as a visible accent on the
  dark surface while staying neutral; it's a one-line tweak in `app.css` if it wants
  adjusting.
- **`filter` + future fixed overlays.** A CSS `filter` makes its element a
  containing block for `position: fixed` descendants. The filter is on `.app-shell`
  and Settings is rendered inline (no fixed overlay), so this is a non-issue now —
  but worth remembering before any future modal is layered inside `.app-shell` while
  grayscale is on.
- **Status-bar / browser chrome.** The `<meta name="theme-color">` (the mobile
  status-bar tint, `#0f0f1a`) is static and isn't affected by the toggle. It's
  near-neutral so it's not a real leak; left as-is.

## Status

`final` — approved by Rehaan (2026-06-16) via plan review. Routed to
`02-development/workflow/01-brief/grayscale-mode-brief.md` and built in the same
session.
