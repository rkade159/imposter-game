# Spec — Grayscale Mode

## Source brief

[02-development/workflow/01-brief/grayscale-mode-brief.md](../01-brief/grayscale-mode-brief.md)
(source plan:
[01-plan/plans/grayscale-mode-plan-final.md](../../../01-plan/plans/grayscale-mode-plan-final.md))

> 📝 **Process note.** This spec was written **after** the build, to complete the
> feature's paper trail (the `plan → brief → spec → build` order ran
> `plan → brief → build`, with the spec backfilled). The feature was built directly
> from the brief. The criteria below describe what the shipped build must satisfy,
> and it does.

> ⚠️ **Reference screenshots show the default *coloured* state.** The
> `examples-of-good-work` images (crewmate / imposter / main screens) predate this
> feature; if you open them, read
> [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md)
> first. The Settings screen and the grayscale **mode** appear in **no** screenshot
> and are defined by this spec and its brief.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It says WHAT must be true — observable behaviour and
the surfaces other code depends on — not exact gray hex values, DOM, class names, or
CSS, which are the builder's call within the constraints below.

Five things *are* mandated because they are the explicit goals of this feature:
(a) a **Grayscale toggle** in a **new Settings screen**, **off by default**
(criteria 5, 9); (b) it is **persisted** to `localStorage` (criterion 12); (c) when
on, the **whole screen** — including the page background outside the app shell — is
black-and-white (criterion 8); (d) **the two role cards become visually identical**,
not merely desaturated — this is the anti-leak goal, not a side effect (criterion 9);
(e) settings live in their **own store**, separate from `gameState`, and Settings is
reached **in place of** the setup form (not a route), preserving the in-flight form
(criteria 3, 6–7). Everything else — the exact neutral grays, the toggle's markup,
the precise mechanism — is the builder's call, provided the observable results hold.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/settings.js` | **New.** A persisted `settings` writable, default `{ grayscale: false }`. Loads from `localStorage` (key `imposter:settings`) **merged under a `defaults` object** (so a key added later still gets its default and unknown/legacy keys are ignored), and `subscribe`s to write back on every change. **All** storage access is guarded (try/catch) so private-mode / quota failures never throw into the app. |
| `src/components/Toggle.svelte` | **New.** A reusable labelled on/off switch following the `Stepper.svelte` convention — `bind:value` boolean, optional `description`, optional `id`. Uses a real `<input type="checkbox" role="switch">` (keyboard- and screen-reader-accessible) styled as a slider from existing tokens, with a ≥44px target. |
| `src/screens/SettingsScreen.svelte` | **New.** A "Settings" surface: a heading, a vertical list of rows (a `Toggle` for Grayscale mode bound to `$settings.grayscale`, with a short description), and a "← Back to setup" button that calls an `onClose` prop. Laid out so adding a future row is ~one line. |
| `src/screens/SetupScreen.svelte` | Adds a local `showSettings` flag, a "⚙ Settings" button, and `{#if showSettings}<SettingsScreen onClose=…/>{:else}…form…{/if}`. **Not** a route change — the in-flight form state stays mounted underneath. Rest of setup unchanged. |
| `src/App.svelte` | Imports `settings`; reactively reflects `$settings.grayscale` as a `grayscale` class on **`<html>`** (`document.documentElement.classList.toggle`), set on mount with the persisted value and on every change. |
| `src/app.css` | Adds `:root.grayscale { … }` token overrides (neutralised `--bg`, and `--accent` + `--error` pinned to the **same** neutral) plus `:root.grayscale .app-shell { filter: grayscale(1); }`. |

Files that must **NOT** be modified by this build (the token override does the work —
no per-component colour edits): `src/lib/game-state.js`, `src/lib/word-source.js`,
`src/lib/config.js`, `src/lib/shuffle.js`, `src/screens/RevealScreen.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte`, `src/components/Stepper.svelte`,
`public/data/*`, `src/service-worker.js`, `src/main.js`, `vite.config.js`,
`package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Settings store (`src/lib/settings.js`)

1. A persisted **`settings`** store is exported, default **`{ grayscale: false }`**.
2. It **loads from `localStorage`** merged under a `defaults` object (future keys get
   their default; unknown/legacy stored keys are ignored) and **writes back on every
   change**. All storage access is **guarded** so a storage failure (private mode,
   quota, corrupt JSON) falls back to defaults / is swallowed rather than throwing.
3. Settings live in **their own store, separate from `gameState`**: changing screens,
   `playAgain()`, and `resetGame()` do **not** alter `grayscale`.

### Toggle component (`src/components/Toggle.svelte`)

4. A reusable switch exists with a **`bind:value`** boolean, an optional
   **`description`**, and an optional `id`. It is a **real checkbox** with
   `role="switch"` (so it is keyboard-focusable and announced as a switch), visually
   a slider built from existing tokens, with a tap target **≥44px**.

### Settings screen (`src/screens/SettingsScreen.svelte`)

5. A Settings surface renders a heading, a **Grayscale mode** `Toggle` (bound to
   `$settings.grayscale`, with a one-line description) **off by default**, and a
   "← Back to setup" control that calls its `onClose` prop. The row layout is
   **extensible** — adding a future toggle is about one line.

### Setup entry (`src/screens/SetupScreen.svelte`)

6. A **"⚙ Settings"** control on Setup opens the Settings screen **in place of the
   setup form** via a local flag — **not** a route/screen change.
7. **The in-flight form survives the round trip:** typed player names, the player and
   imposter counts, and the selected word source are all **unchanged** after opening
   Settings and returning. (This is why it must be an in-place swap, not a route —
   SetupScreen stays mounted.)

### Grayscale application (`src/App.svelte` + `src/app.css`)

8. With Grayscale **on**, the **entire screen** is black-and-white — every screen,
   buttons, chips, **and the page background around the content** (no coloured page
   edges). The switch is driven by a class on the **root** (`<html>`) reflecting
   `$settings.grayscale`, applied on mount (with the persisted value) and on change.
9. **Identical role cards (the key criterion):** with Grayscale on, the **imposter**
   reveal card and a **crewmate** reveal card are **visually indistinguishable except
   for their text** — same border shade, same title colour, **neither brighter**. (A
   bare `filter: grayscale(1)` that maps red and indigo to *different* grays — leaving
   a brightness tell — does **not** satisfy this; the role colour tokens must resolve
   to the **same** value.)
10. On the **Results** screen in grayscale, imposter names render **neutral gray, not
    red**.
11. **Default off:** with Grayscale off (including a fresh load with cleared storage),
    the app looks exactly as before — **red** imposter card, **indigo** crewmate card.

### Persistence

12. Grayscale **persists** across reloads/launches via `localStorage`: on → reload →
    still on; off → reload → stays off.

### Spelling (whole app)

13. New user-facing text reads **"imposter"** (never "impostor").

### Look and feel + code quality

14. New UI uses existing `app.css` **tokens** (no new palette beyond the grayscale
    neutrals); tap targets **≥44px**; **no horizontal scroll** at a 375px viewport.
15. **No console errors or warnings** in dev or in the built preview.
16. **Untouched files stay untouched** — every file in the "must NOT be modified"
    list; in particular, **no per-component colour edits** to the reveal/results
    markup (the token override is what makes the cards identical).
17. **No new dependencies** (`package.json` unchanged); **brief comments** on each new
    block per technical-standards; **`npm run build` succeeds** with no new warnings.

## What is NOT acceptance criteria (deferred)

- **Settings reachable from other screens / mid-round** — entry is the Setup flow
  only for now.
- **Matching the two cards' emoji** (🎭 vs 📝) — grayscale removes the *colour* tell;
  the glyph shapes are only legible on a deliberate look and stay as-is.
- **A light theme / other palettes** — grayscale only; broader theming is a
  `03-design` concern.
- **Other settings** (hint on/off, discussion-confirmation toggle) — the store +
  screen are built ready, but those are their own features.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Default off:** fresh load (cleared site data) looks exactly as today — red
   imposter card, indigo crewmate card.
3. **Reach Settings:** Setup → **⚙ Settings** opens Settings; **← Back to setup**
   returns.
4. **Form preserved:** type names / change counts → open Settings → back → the names
   and counts are still there.
5. **Toggle on:** enabling Grayscale turns the whole screen black-and-white at once —
   buttons, chips, **and the page background around the content** (no navy edges).
6. **Identical cards (key test):** in a round, the imposter card and a crewmate card
   are indistinguishable except for their words — same shade, neither brighter.
7. **Results:** imposter names render neutral gray, not red.
8. **Persistence:** grayscale on → reload → still gray; off → reload → stays off.
9. **Regression:** a full play-through works in both modes; **Play again** still
   preserves group settings (and does not touch grayscale).
10. At 375px: no horizontal scroll; tap targets ≥44px. Stop the dev server; run
    `npm run build` → succeeds with no new errors/warnings.

If any one of criteria 1–17 fails, the build is not done.

## Open questions for the builder

- **The neutral gray values.** The exact grays (a near-black for `--bg`, one shared
  mid-gray for `--accent`/`--error`) are a judgement call — any values that (a) keep
  the page readable on the dark surface and (b) make the two cards **identical**
  satisfy the contract; they're a one-line tweak in `app.css`.
- **Where the class lives.** A class on `<html>` is expected (so `<body>`'s page
  background is covered); any approach that turns the **whole screen** gray — not just
  the content column — is acceptable (criterion 8).
- **Known interaction (not a defect):** the `filter` on `.app-shell` makes it the
  containing block for any `position: fixed` descendant. That is fine for this build
  (Settings renders inline; no fixed overlays here), but any **future** in-shell modal
  must account for it. *(The later Anti-Yusuf popup does, by portalling to `<body>`.)*

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. The build is **complete** and
satisfies criteria 1–17; this document backfills the contract it was verified against.
