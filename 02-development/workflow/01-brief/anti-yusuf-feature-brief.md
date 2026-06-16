# Brief — Anti-Yusuf Feature

## Source plan

[01-plan/plans/anti-yusuf-feature-plan-final.md](../../../01-plan/plans/anti-yusuf-feature-plan-final.md)

## What to build

A gag **"Anti-Yusuf Feature"** toggle on the existing **Settings** screen. While
it's on, the game **refuses to start** and pops up a fixed message naming whoever
is last to receive the phone. It's a prank — there's no "play anyway" path; the
only way to start a round is to turn it back off.

Today, in playtests, one friend ("Yusuf") always grabs the **last** slot, then
cheats by skipping straight to the reveal to see who the imposter is. After this
build:

- The **Settings** screen has a new **"Anti-Yusuf Feature"** toggle (description:
  **"No explanation needed here..."**), **off by default**.
- **With it ON:** pressing **Start Game** does **not** start the round. A **popup
  dialog** appears, over a dimmed setup screen, reading **verbatim**:

  > Ha ha nice try, I'm not going to let **[NAME]** cheat by being last and seeing who the imposter is!

  where **[NAME]** is the **last player in the list** (the last person passed to).
  Dismiss with **OK** (or overlay-click / **Esc**) → back to setup, no round started.
- **With it OFF:** Start Game behaves exactly as today, regardless of who is last.
- **It does NOT persist.** Unlike Grayscale, it is **never** written to
  `localStorage` — a fresh app launch always starts with it **off**.

## Why this is being built now

1. **It fixes a recurring table annoyance.** The same player keeps exploiting the
   last slot; this gives the host a one-tap way to call it out and refuse to deal.
2. **It's small and self-contained.** It reuses the Settings plumbing (Toggle +
   Settings row), the existing `displayName()` and `startGame()`, and adds only a
   tiny session store + one reusable popup — low risk, no game-logic changes.
3. **The "last player" is already well-defined.** Turn order is fixed (only roles
   shuffle), so "last to pass to" is simply the last name field — no new ordering
   logic needed.

## The popup × Grayscale interaction (the heart of this build)

The Grayscale feature puts `filter: grayscale(1)` on `.app-shell`
([app.css](../03-builds/imposter-game-app/src/app.css), `:root.grayscale .app-shell`).
A CSS `filter` makes its element the **containing block for `position: fixed`
descendants**. SetupScreen renders **inside** `.app-shell`, so a naïve
`position: fixed` popup would be positioned relative to **`.app-shell` (a centred,
max-width, padded column) instead of the viewport — but only while Grayscale is
also on**. With Grayscale off it looks fine; with both on, the dim overlay would
**fail to cover the full screen** on desktop. This is the exact gotcha the
[Grayscale plan](../../../01-plan/plans/grayscale-mode-plan-final.md) flagged for "a
future modal".

**Required fix:** render the popup through a small **`portal` action that appends
its node to `document.body`** (outside `.app-shell`). Then:

- **Positioning** is always viewport-relative, in both modes. ✓
- **Colour** still desaturates correctly: the colour tokens are overridden at
  `:root.grayscale` (on `<html>`), which reaches a body-level node too. The popup
  uses only tokens and **no emoji**, so it needs nothing from the `.app-shell`
  catch-all filter. ✓

## Scope

**In scope:**

- **Session store** — new
  [src/lib/session-settings.js](../03-builds/imposter-game-app/src/lib/session-settings.js):
  a `sessionSettings` `writable({ antiYusuf: false })` that **mirrors the
  `settings.js` shape minus persistence** — i.e. **no `localStorage` load and no
  `subscribe` write**. Because nothing persists it, it resets to `false` on every
  fresh load. Add a short comment stating the non-persistence is **intentional**.
- **Settings row** —
  [src/screens/SettingsScreen.svelte](../03-builds/imposter-game-app/src/screens/SettingsScreen.svelte):
  import `sessionSettings`; add **one more `<Toggle>`** in `.rows` below the
  Grayscale row — `id="setting-anti-yusuf"`, `label="Anti-Yusuf Feature"`,
  `description="No explanation needed here..."`,
  `bind:value={$sessionSettings.antiYusuf}`. (Grayscale's row, bound to `$settings`,
  is unchanged.)
- **Start gate** —
  [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  import `sessionSettings` and `displayName` (from `game-state.js`); add locals
  `showBlock = false` and `blockedName = ''`. In the existing `start()`, **after the
  `canStart` guard and before `pickWord`/`startGame`**, add:
  ```js
  // Anti-Yusuf: while on, refuse to start and call out the last player to pass to.
  if ($sessionSettings.antiYusuf) {
    blockedName = displayName(names, players - 1);
    showBlock = true;
    return;
  }
  ```
  Render the popup when `showBlock` is true (see Modal below), passing the
  **verbatim** message with `blockedName` substituted, and `onClose` setting
  `showBlock = false`. `canStart` and the rest of `start()` are unchanged.
- **Popup component** — new
  [src/components/Modal.svelte](../03-builds/imposter-game-app/src/components/Modal.svelte):
  a reusable dialog following the `Toggle.svelte` / `Stepper.svelte` "drop-in"
  convention. A full-viewport **dim overlay** + a **centred card** built from
  existing tokens (`--bg-surface`, `--text`, `--accent`) + an **OK** button. Message
  supplied via **slot** (or a `message` prop) and an **`onClose`** callback. Closes
  on **OK, overlay-click, and Esc**. Accessible like Toggle: `role="dialog"`,
  `aria-modal="true"`, and move focus to the OK button on open. **Portalled to
  `document.body`** via a small `use:portal` action (see "the heart of this build").
- **Mobile-responsive** — tap targets ≥44px, no horizontal scroll at 375px; the
  popup card fits small screens. Reuse `app.css` tokens only — no new colour values.
- Code follows [technical-standards.md](../../references/technical-standards.md):
  plain and simple, no new dependencies, a brief comment on each new block.

**Out of scope (do NOT build here):**

- **Persistence.** This toggle must **not** be written to `localStorage` and must
  **not** be added to `settings.js`. A fresh launch always starts it off. (This is a
  deliberate difference from Grayscale.)
- **Name-specific targeting.** Do **not** only block when the last player is literally
  "Yusuf" — while on, it blocks for **any** last player; the message just names
  whoever is last.
- **A "play anyway" / override path.** None — turning the toggle off is the only way
  to start a round.
- **Edits to `settings.js`** (the Grayscale store), `game-state.js` logic,
  `word-source.js`, the reveal/pass/results/discussion screens, routing, Capacitor,
  or the service worker.
- **Reusing `Modal` elsewhere** (e.g. a results confirmation). It's built reusable,
  but no other caller is in scope here.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/session-settings.js` | **New.** `sessionSettings` writable `{ antiYusuf: false }`, **no** persistence (no load, no subscribe). Resets on every launch. |
| `src/components/Modal.svelte` | **New.** Reusable popup: dim overlay + centred token-styled card + OK; slot/`message` + `onClose`; closes on OK/overlay/Esc; `role="dialog"`/`aria-modal`; **portalled to `<body>`**. |
| `src/screens/SettingsScreen.svelte` | Import `sessionSettings`; add the "Anti-Yusuf Feature" `<Toggle>` row bound to `$sessionSettings.antiYusuf`. |
| `src/screens/SetupScreen.svelte` | Import `sessionSettings` + `displayName`; add `showBlock`/`blockedName`; early-return into the popup in `start()` when on; render `<Modal>` with the verbatim message. |

## Constraints worth highlighting

- **The message is verbatim.** Exact wording, the apostrophe in **"I'm"**, the comma
  after **"nice try"**, and the trailing **"!"**. Only `[NAME]` is substituted —
  with `displayName(names, players - 1)` (so a blank last field reads "Player N").
  Note it already uses the correct **"imposter"** spelling required by the standards.
- **NOT persisted.** Session store only; no `localStorage`, no entry in `settings.js`.
  This is the one explicit change from how Grayscale works.
- **Blocks for ANY last player while on.** It does not inspect the name for "Yusuf".
- **Popup must cover the whole viewport even with Grayscale on.** Portal it to
  `<body>`; verify the dim overlay reaches the screen edges at desktop width with
  **both** toggles on (the `position: fixed` containing-block case above).
- **Start button stays enabled** when the form is valid — the block fires **on
  press**, which is what produces the gag. Do not disable Start or alter `canStart`.
- **Spelling is "imposter"** in user-facing text. **No new dependencies** — pure
  Svelte + CSS. Works on modern browsers; verify at 375px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Toggle present:** Settings shows an **"Anti-Yusuf Feature"** row, **off by
   default**, description "No explanation needed here...".
2. **Blocks while on:** toggle ON → back to setup → set the last name field to
   "Yusuf" → **Start Game** → popup reads **exactly** *"Ha ha nice try, I'm not
   going to let Yusuf cheat by being last and seeing who the imposter is!"*; **no
   round starts**.
3. **Dismiss:** **OK**, **overlay-click**, and **Esc** each close the popup back to
   setup, still with no round started.
4. **Blank last name:** clear the last name field → Start → the popup names
   **"Player N"** (N = player count).
5. **Off = normal:** toggle OFF → **Start Game** → the round starts (reveal screen)
   regardless of who is last.
6. **NOT persisted (key test):** turn it ON, then **reload the app** → it's **off**
   again. (Contrast: Grayscale ON + reload stays on — only Anti-Yusuf resets.)
7. **Grayscale × popup (combined):** enable **both** Grayscale and Anti-Yusuf, Start
   **at desktop window width** → the popup is (a) fully **black-and-white** and (b)
   its dim overlay covers the **whole viewport**, not just the centred column.
   Re-check at 375px.
8. **Regression + build:** a full play-through still works with the toggle off;
   `npm run build` succeeds; no horizontal scroll at 375px; tap targets ≥44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/anti-yusuf-feature-spec.md](../02-specs/anti-yusuf-feature-spec.md),
which converts it into an acceptance-criteria contract for the build.
