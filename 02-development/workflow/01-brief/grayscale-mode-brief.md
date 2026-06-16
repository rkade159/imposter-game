# Brief — Grayscale Mode

## Source plan

[01-plan/plans/grayscale-mode-plan-final.md](../../../01-plan/plans/grayscale-mode-plan-final.md)

## What to build

A **Grayscale mode** — a toggle in a **new Settings screen** that strips colour
from the whole app, so no one can tell who the imposter is from the **red** reveal
card by glance or reflection.

Today the imposter's reveal card is red (`--error` drives its border + title in
[RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte)).
Players catch that red peripherally / in reflections and know the imposter without
reading the screen. After this build:

- A **"⚙ Settings"** button on the Setup screen opens a **Settings** screen with a
  **Grayscale mode** toggle.
- With it on, the **entire app is black-and-white**, and — critically — the imposter
  and crewmate reveal cards become **visually identical** except for their text.
- The setting is **remembered** across reloads (`localStorage`), and is **off by
  default**.

This is also the **first feature in the Settings area** — build the store and screen
so future toggles (hint on/off, discussion confirmation) slot in with one line.

## Why this is being built now

1. **It fixes a real cheat seen in playtests.** The red colour leak lets players
   read the imposter without reading the screen; grayscale removes the signal.
2. **A plain desaturate isn't enough.** Red and indigo desaturate to *different*
   grays — the brightness still gives it away. The cards must become identical.
3. **Settings needs a home.** Several earlier plans deferred toggles "to a future
   Settings menu"; this build stands that up.

## The anti-leak rule (the heart of this build)

A bare `filter: grayscale(1)` leaves the imposter card a *different* gray brightness
than the crewmate card — the tell survives. So:

1. In grayscale mode, set **`--accent` and `--error` to the same neutral gray** —
   this makes the two role cards identical (they already share `.card`; only the
   token differs). Neutralise `--success`/`--warning` too.
2. **Then** apply `filter: grayscale(1)` on the app shell as a catch-all for emoji
   and anything not driven by a token.

Layer 1 closes the tell; layer 2 finishes the black-and-white look.

## Scope

**In scope:**

- **Settings store** — new [src/lib/settings.js](../03-builds/imposter-game-app/src/lib/settings.js): a persisted `settings` writable mirroring the `gameState` pattern. Load from `localStorage` merged under a `defaults` object (future keys get defaults, legacy keys ignored); subscribe to write back; guard all storage access in `try/catch`. Start with `{ grayscale: false }`.
- **Toggle component** — new [src/components/Toggle.svelte](../03-builds/imposter-game-app/src/components/Toggle.svelte): a reusable labelled switch following the `Stepper.svelte` convention — `bind:value`, optional `description`, a real `<input type="checkbox" role="switch">` styled as a slider, using existing tokens (≥44px tap target).
- **Settings screen** — new [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte): a "Settings" title, a vertical list of rows (one `Toggle` for Grayscale mode, bound to `$settings.grayscale`, with a short description), and a "← Back to setup" button that calls an `onClose` prop. Lay it out so adding a future row is trivial.
- **Setup entry** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte): add a local `showSettings` flag, a "⚙ Settings" ghost button at the top of the form, and `{#if showSettings}<SettingsScreen onClose={…}/>{:else}…existing form…{/if}`. **Do not** convert this to a route — the local swap keeps the component mounted so the in-flight `players` / `impostors` / `names` / `selectedSource` state survives (see the remount note at `SetupScreen.svelte:30-31`).
- **Apply grayscale** — [src/App.svelte](../03-builds/imposter-game-app/src/App.svelte): import `settings`; reactively reflect `$settings.grayscale` as a `grayscale` class on `<html>` (`document.documentElement.classList.toggle(...)`), so the **whole screen** switches — the page background lives on `<body>`, outside the shell, so a class on `.app-shell` alone leaves the page edges coloured.
- **The grayscale rule** — [src/app.css](../03-builds/imposter-game-app/src/app.css): `:root.grayscale { --bg: <neutral>; --accent/--error: <one neutral>; }` (the root override reaches `<body>`'s page background) plus `:root.grayscale .app-shell { filter: grayscale(1); }` (catches emoji + every in-shell token).
- **Mobile-responsive** — tap targets ≥44px, no horizontal scroll at 375px. Reuse `app.css` tokens and the `.screen` / button patterns.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain and simple, no new dependencies, a brief comment on each new block.

**Out of scope (do NOT build here):**

- **Settings reachable from other screens / mid-round** — entry is the Setup flow only for now.
- **Matching the cards' emoji** (🎭 vs 📝) — grayscale removes the colour tell; the glyph shapes stay. A shared neutral icon is a possible later refinement.
- **A light theme / other palettes** — grayscale only; broader theming is a `03-design` concern.
- **Other settings** (hint on/off, discussion confirmation) — the store + screen are built ready, but those are their own features.
- **Edits to the reveal/results markup** — the token override does the work; no per-component colour edits.
- **`game-state.js`, `word-source.js`, routing, Capacitor, service worker** changes.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/settings.js` | **New.** Persisted `settings` store, default `{ grayscale: false }`. |
| `src/components/Toggle.svelte` | **New.** Reusable switch (`bind:value`, `description`). |
| `src/screens/SettingsScreen.svelte` | **New.** Settings surface; Grayscale row + Back button. |
| `src/screens/SetupScreen.svelte` | `showSettings` flag, "⚙ Settings" button, in-place swap. |
| `src/App.svelte` | Reflect `$settings.grayscale` as a `grayscale` class on `<html>`. |
| `src/app.css` | `:root.grayscale` token overrides (incl. `--bg`) + `:root.grayscale .app-shell { filter }`. |

## Constraints worth highlighting

- **Identical cards is the acceptance bar, not "looks gray."** If the imposter card
  is even slightly brighter than the crewmate card, the leak isn't fixed. Both role
  tokens must resolve to the **same** value.
- **Don't route to Settings.** A real screen change remounts SetupScreen and wipes
  the half-filled form. Render Settings in place of the form instead.
- **Settings live outside `gameState`.** Keep them in their own store so Play-again
  resets and screen changes never touch them.
- **Default OFF, and persisted.** Existing players see no change until they opt in;
  once on, it survives reloads.
- **Spelling is "imposter"** in any user-facing text. No new dependencies.
- Works on modern browsers; mobile-responsive — verify at 375px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Default off:** fresh load (cleared site data) looks exactly as today — red
   imposter card, indigo crewmate card.
2. **Reach Settings:** Setup → **⚙ Settings** opens Settings; **Back to setup**
   returns.
3. **Form preserved:** type names / change counts → open Settings → back → still
   there.
4. **Toggle on:** enabling Grayscale turns the whole screen black-and-white at once
   — buttons, chips, **and the page background around the content** (no navy edges).
5. **Identical cards (key test):** in a round, imposter and crewmate cards are
   indistinguishable except for their words — same shade, neither brighter.
6. **Results:** imposter names are neutral gray, not red.
7. **Persistence:** grayscale on → reload → still gray; off → reload → stays off.
8. **Regression + build:** full play-through works both modes; Play again preserves
   group settings; `npm run build` succeeds; no horizontal scroll at 375px.

## Next step

This brief feeds `02-development/workflow/02-specs/grayscale-mode-spec.md` if a
formal acceptance-criteria spec is wanted; otherwise it is buildable as-is (and was
built in the same session as this brief).
