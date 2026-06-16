# Anti-Yusuf Feature Plan (Final)

## Why this plan exists

When Rehaan play-tests the app, one friend — "Yusuf" — always volunteers to go
**last**, then cheats by skipping straight ahead to the reveal so he sees who the
imposter is before anyone else. Going last is the exploitable slot, and the same
person keeps grabbing it.

This plan adds the **Anti-Yusuf Feature**: a Settings toggle that, while on, makes
the game **refuse to start** and call out whoever currently holds the last
pass-the-phone slot. It's a deliberate gag/prank feature — there's no "play
anyway" path; the only way to start a round is to turn it back off.

**Intended outcome:** Rehaan can flip on Anti-Yusuf, press Start, and the app
publicly names-and-shames the last player with a fixed message instead of starting
— a reliable, repeatable bit at the table.

## The feature

1. **A toggle on the existing Settings screen**, labelled **"Anti-Yusuf Feature"**
   with the description **"No explanation needed here..."**. Off by default.
2. **While ON:** pressing **Start Game** does **not** start the round. A **popup
   dialog** appears showing this message **verbatim**:

   > Ha ha nice try, I'm not going to let **[NAME]** cheat by being last and seeing who the imposter is!

   where **[NAME]** is the **last player in the list** — the last person the phone
   is passed to. The popup is dismissed with **OK** (and overlay-click / Esc),
   returning to setup with no round started.
3. **While OFF:** Start Game behaves exactly as today — the round starts normally,
   no matter who is last.
4. **The setting does NOT persist.** Unlike Grayscale, it is **not** written to
   `localStorage` — every fresh app launch starts with it **off**. It lives in a
   session-only store, separate from the persisted `settings` store (see below).

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Trigger scope | **Blocks for *any* last player while on** — does not check for the literal name "Yusuf" | Matches the stated mechanic ("whenever it's on, the game should not start"); simplest and predictable. The message just names whoever is last. *(Rehaan's choice.)* |
| Message presentation | **Popup dialog** over a dimmed setup screen, dismissed with OK | More dramatic for the gag than an inline note. *(Rehaan's choice.)* |
| Toggle label / description | **"Anti-Yusuf Feature"** / **"No explanation needed here..."** | Rehaan's exact copy. *(Rehaan's choice.)* |
| "Last player" = which player | **The last name field, index `playerCount - 1`** | Turn order is fixed (only roles shuffle), so the last person passed to is always the last name field. See below. |
| Blank last name | **Falls back to "Player N"** via existing `displayName()` | The message always has a usable name; consistent with the rest of the app. |
| Default & persistence | **Off by default, NOT persisted** — lives in a session-only store, separate from the persisted `settings` store | A gag toggle shouldn't linger; every fresh launch starts off. *(Rehaan's choice — deliberately differs from Grayscale.)* |

## Why "last player" = the last name field

Turn order is **fixed**: `startGame()` shuffles only the *roles* array, not the
pass order — players reveal in index order `0 … playerCount - 1`
([game-state.js:64-79](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js#L64-L79)).
So the last person to receive the phone is always **index `playerCount - 1`**, the
last name field on the setup form. Its label comes from the existing
`displayName(names, playerCount - 1)`
([game-state.js:28-31](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js#L28-L31)),
which already returns the typed name or a "Player N" fallback — so no new
name-resolution logic is needed.

## How it fits the architecture

No new routes and no game-state changes. It reuses the Grayscale Toggle + Settings
row, adds a **parallel session-only store** for the non-persisted state, and adds
one reusable popup component. The block is a single early-return inside the Setup
screen's existing `start()`:

```
settings store          { grayscale }   ←→ localStorage   (persisted — UNTOUCHED)
sessionSettings store   { antiYusuf }    (in-memory only — resets every launch)
   │
SettingsScreen  ──  one more <Toggle bind:value={$sessionSettings.antiYusuf}>  (NOT persisted)
   │
SetupScreen.start()  (Start Game pressed, form already valid)
   ├─ $sessionSettings.antiYusuf ?  →  blockedName = displayName(names, players-1); show popup ; RETURN
   └─ else                          →  startGame(...)   (unchanged)
   │
   └─ <Modal>  ← portalled to <body> (see grayscale interaction below)
                 renders the verbatim message + OK
```

## The grayscale × fixed-overlay interaction (don't skip this)

The Grayscale plan deliberately puts `filter: grayscale(1)` on `.app-shell`
([app.css](../../02-development/workflow/03-builds/imposter-game-app/src/app.css),
`:root.grayscale .app-shell`). A CSS `filter` makes its element the **containing
block for `position: fixed` descendants**. SetupScreen renders inside `.app-shell`,
so a naïve `position: fixed` popup would be positioned relative to **`.app-shell`
(a 1200px-max, centred, padded column), not the viewport** — but **only while
Grayscale is also on**. With Grayscale off it would look fine; with both on, the
dim overlay wouldn't cover the full screen on desktop. This is the exact gotcha the
Grayscale plan flagged for "a future modal".

**Recommended fix:** render the popup via a tiny **`portal` action that appends its
node to `document.body`** (outside `.app-shell`). Then:

- **Positioning** is always viewport-relative, regardless of Grayscale. ✓
- **Colour** still desaturates correctly: the role/colour tokens are overridden at
  `:root.grayscale` (on `<html>`), which reaches a body-level node too. The popup
  uses only tokens and **no emoji**, so it needs nothing from the `.app-shell`
  catch-all filter. ✓

*(Simpler alternative — inline `position: fixed` inside SetupScreen — is acceptable
**only** if the popup is accepted as shell-bounded under Grayscale. The portal is
recommended because it's correct in both modes and keeps the Modal reusable. The
spec/builder has final say, but this trade-off must be made consciously, not by
accident.)*

## Files this affects

| File | Change |
|---|---|
| `src/lib/session-settings.js` | **New.** A session-only `sessionSettings` writable, `{ antiYusuf: false }`, with **no** `localStorage` subscribe — so it resets to off on every fresh load. Mirrors the `settings.js` shape minus persistence. (`settings.js` itself is **not** touched.) |
| [src/screens/SettingsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SettingsScreen.svelte) | One more `<Toggle>` row in `.rows`, mirroring Grayscale: `id="setting-anti-yusuf"`, label "Anti-Yusuf Feature", description "No explanation needed here...", `bind:value={$sessionSettings.antiYusuf}` (imports `sessionSettings`, not `settings`). |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | Import `sessionSettings` and `displayName`; add `showBlock`/`blockedName` locals; in `start()` (after the `canStart` guard) early-return into the popup when `$sessionSettings.antiYusuf`; render `<Modal>` with the verbatim message when `showBlock`. |
| `src/components/Modal.svelte` | **New.** Small reusable dialog matching the Toggle/Stepper "drop-in" style: dim full-viewport overlay + centred card (using `--bg-surface` / `--text` / `--accent` tokens) + OK button; message via slot/prop, `onClose` callback. Closes on OK, overlay-click, and Esc. `role="dialog"`, `aria-modal="true"`, focus moved to OK (same a11y care as Toggle.svelte). Portalled to `<body>` per the section above. |

**Reused, not rebuilt:** the `settings.js` store *pattern* (mirrored — minus
persistence — in the new
[session store](../../02-development/workflow/03-builds/imposter-game-app/src/lib/settings.js);
`settings.js` itself is left untouched), the
[Toggle.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/components/Toggle.svelte)
component, `displayName()` and `startGame()`
([game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js)),
and all `app.css` colour tokens. `game-state.js` logic, `word-source.js`, the
reveal/pass/results screens, routing, Capacitor, and the service worker are
untouched.

## Conventions to honor

- **User-facing text spells it "imposter"** (the verbatim message already does);
  internal identifiers stay as-is. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- The popup message is **verbatim** — exact wording, the apostrophe in "I'm", the
  comma after "nice try", and the trailing "!". Only `[NAME]` is substituted.
- Plain, simple, easy-to-extend code with a comment on each new block. No new
  dependencies — pure Svelte + CSS; tap targets ≥44px, works at 375px.

## What's deferred (out of scope)

- **Name-specific targeting** (only blocking when the last player is literally
  "Yusuf"). Explicitly rejected — it blocks for anyone while on.
- **A "play anyway" / override path.** None by design; turning the toggle off is
  the only way to start.
- **Reusing Modal elsewhere** (confirm-before-results, etc.). The component is
  built reusable, but no other caller is in scope here.

## Acceptance (what "done" looks like)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. **Toggle present:** Settings shows an **"Anti-Yusuf Feature"** row, off by
   default, description "No explanation needed here...".
2. **Blocks while on:** toggle ON, set the last name to "Yusuf", press **Start
   Game** → popup reads **exactly** *"Ha ha nice try, I'm not going to let Yusuf
   cheat by being last and seeing who the imposter is!"*; no round starts.
3. **Dismiss:** OK, overlay-click, and **Esc** each close the popup back to setup,
   still no round started.
4. **Blank name:** clear the last name field, Start → popup names "Player N".
5. **Off = normal:** toggle OFF, Start → round starts (reveal screen) regardless of
   who is last.
6. **NOT persisted (the deliberate difference from Grayscale):** turn it on, then
   reload the app → it's **off** again. (For contrast: Grayscale on + reload stays
   on — only Anti-Yusuf resets.)
7. **Grayscale × popup (the key combined test):** enable **both** Grayscale and
   Anti-Yusuf, then Start **at a desktop window width** → the popup is (a) fully
   black-and-white **and** (b) its dim overlay covers the **whole viewport**, not
   just the centred content column. (This is the `position: fixed` containing-block
   case above.) Re-check at 375px.
8. **Regression / build:** a full play-through still works with the toggle off;
   `npm run build` succeeds; no horizontal scroll at 375px.

Verification is **manual** — the build **writes this checklist; Rehaan runs
`npm run dev`** to walk it (per the agreed split in technical-standards.md).

## Risks / open questions

- **Portal vs inline (decided above):** recommending a `body` portal for the popup
  so it's correct under Grayscale. If the spec instead keeps it inline, acceptance
  test 7 must be downgraded knowingly.
- **`filter` containing-block** is the one non-obvious interaction; it's documented
  here and in the Grayscale plan so the builder doesn't rediscover it the hard way.
- **Tone of the description** ("No explanation needed here...") is intentionally
  cryptic — Rehaan's call; trivially editable later.

## Status

`final` — approved by Rehaan (2026-06-16) via plan review (clarifying questions +
plan approval). **Revised 2026-06-16:** per Rehaan, Anti-Yusuf is **not** persisted
(session-only store) — differs from the first draft, reflected throughout above.
Next phase: route to
`02-development/workflow/01-brief/anti-yusuf-feature-brief.md` → spec → build. This
planning session ends at this document; no app code is changed yet.
