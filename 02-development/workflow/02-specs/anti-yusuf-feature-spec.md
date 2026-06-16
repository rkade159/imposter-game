# Spec — Anti-Yusuf Feature

## Source brief

[02-development/workflow/01-brief/anti-yusuf-feature-brief.md](../01-brief/anti-yusuf-feature-brief.md)
(source plan:
[01-plan/plans/anti-yusuf-feature-plan-final.md](../../../01-plan/plans/anti-yusuf-feature-plan-final.md))

> 📝 **Process note.** This spec was written **after** the build, to complete the
> feature's paper trail (the `plan → brief → spec → build` order ran
> `plan → brief → build`, with the spec backfilled). The feature was built directly
> from the brief. Future features follow the pipeline in order. The criteria below
> describe what the shipped build must satisfy, and it does.

> The Anti-Yusuf Feature appears in **no** reference screenshot; it is defined by
> this spec and its brief alone.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It says WHAT must be true — observable behaviour and
the surfaces other code depends on — not exact DOM, class names, or CSS, which are
the builder's call within the constraints below.

Five things *are* mandated because they are the explicit goals of this feature:
(a) a Settings toggle labelled **"Anti-Yusuf Feature"** / **"No explanation needed
here..."**, **off by default** (criteria 3); (b) the toggle is **NOT persisted** —
it lives in a session-only store and resets to off on every launch, and `settings.js`
is **not** touched (criteria 1–2, 19); (c) while on, **Start is blocked for any last
player** and a popup shows the **verbatim** message naming the last player (criteria
5–6); (d) while off, Start is **exactly** as before (criterion 7); (e) the popup is
**correct under grayscale** — full-viewport and desaturated (criterion 11).
Everything else — popup markup/CSS, slot-vs-prop, the session store's name/shape — is
the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/session-settings.js` | **New.** Exports a `sessionSettings` writable store, default `{ antiYusuf: false }`, with **no** `localStorage` load and **no** `subscribe`-to-storage — so it is purely in-memory and resets to defaults on every fresh load. Mirrors the `settings.js` shape minus persistence. |
| `src/components/Modal.svelte` | **New.** A reusable popup: a full-viewport dim backdrop + a centred token-styled card + an **OK** button, with its message supplied via the default slot and an `onClose` callback. Dismisses on OK, backdrop click, and **Escape**. `role="dialog"`, `aria-modal="true"`, focus moved to OK on open. Rendered into `<body>` (escapes the `.app-shell` grayscale filter's containing block) and stays grayscale-correct. |
| `src/screens/SettingsScreen.svelte` | Imports `sessionSettings`; adds one `<Toggle>` row below the Grayscale row, bound to `$sessionSettings.antiYusuf`. Grayscale row unchanged. |
| `src/screens/SetupScreen.svelte` | Imports `sessionSettings`, `displayName`, and `Modal`; adds `showBlock`/`blockedName` locals; `start()` early-returns into the popup when the toggle is on; the popup renders the verbatim message. `canStart` and all other setup logic unchanged. |

Files that must **NOT** be modified by this build: `src/lib/settings.js` (the
persisted Grayscale store — staying out of it is the non-persistence contract),
`src/lib/game-state.js` (`displayName` is **reused**, not changed),
`src/components/Toggle.svelte` (reused as-is), `src/App.svelte`, `src/app.css`,
`src/lib/word-source.js`, `src/lib/config.js`, `src/lib/shuffle.js`,
`src/screens/RevealScreen.svelte`, `src/screens/PassScreen.svelte`,
`src/screens/DiscussionScreen.svelte`, `src/screens/ResultsScreen.svelte`,
`src/components/Stepper.svelte`, `public/data/*`, `src/service-worker.js`,
`src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Session store (`src/lib/session-settings.js`)

1. A **`sessionSettings`** store is exported with default **`{ antiYusuf: false }`**.
2. It is **not persisted**: nothing in this module reads from or writes to
   `localStorage`. Consequently the value **resets to `false` on every fresh app
   load / reload**, regardless of what it was set to in a prior session. **No
   `antiYusuf` key is added to `settings.js`**, and `settings.js` is not modified.

### Settings screen (`src/screens/SettingsScreen.svelte`)

3. A new toggle row exists with label **exactly** `Anti-Yusuf Feature` and
   description **exactly** `No explanation needed here...`, bound two-way to
   `$sessionSettings.antiYusuf`, and rendered as a peer of the Grayscale row using
   the existing `Toggle` component. It is **off by default** (follows from
   criterion 1).
4. The existing **Grayscale row is unchanged** and still bound to `$settings.grayscale`.

### Start gate (`src/screens/SetupScreen.svelte`)

5. **While `antiYusuf` is on**, pressing **Start Game** does **not** start a round:
   `startGame()` is **not** called, no word is picked, and the game stays on Setup.
   This holds for **any** last player — the feature does **not** inspect the name
   for "Yusuf".
6. Instead, a popup is shown containing **this exact text**, with `[NAME]`
   substituted:

   > Ha ha nice try, I'm not going to let [NAME] cheat by being last and seeing who the imposter is!

   `[NAME]` is **`displayName(names, playerCount − 1)`** — the last player's typed
   name, or the **`Player N`** fallback when that field is blank. The string is
   reproduced verbatim (the comma after "nice try", the apostrophe in "I'm", the
   trailing "!", and the "imposter" spelling).
7. **While `antiYusuf` is off**, pressing Start behaves **exactly as before** — the
   round starts (reveal screen) regardless of who is last; no popup appears.
8. The feature does **not** change the **Start-enabled** logic: `canStart` still
   depends only on valid counts + a loaded deck, and the block fires **on press**
   (the Start button is not disabled by this feature).
9. **Dismissing the popup returns to Setup with no round started** and **no game
   state mutated** — the form's in-flight values (counts, names, word source) are
   intact and Start can be pressed again.

### Popup component (`src/components/Modal.svelte`)

10. The popup is a **reusable** component driven by an `onClose` callback and slot
    content. It presents a dim full-viewport backdrop and a centred card, and is
    **dismissible by OK, by clicking the backdrop, and by pressing Escape** — each
    calls `onClose`. It is accessible: `role="dialog"`, `aria-modal="true"`, and
    focus moves to the OK control on open. Click-to-dismiss is implemented without a
    click handler on a static (non-interactive) element (no `svelte-ignore` needed).
11. **Grayscale correctness (key criterion):** with **both** Grayscale and
    Anti-Yusuf on, the popup (a) is rendered fully **black-and-white** — no residual
    navy/indigo on the card or button — **and** (b) its dim backdrop covers the
    **entire viewport** at desktop window widths, not merely the centred content
    column. (This requires the popup to escape `.app-shell`, whose grayscale
    `filter` would otherwise become the containing block for a fixed overlay.)

### Spelling (whole app)

12. New user-facing text reads **"imposter"** (never "impostor"). The message and
    toggle copy already comply.

### Look and feel (baseline only — design comes later)

13. The popup and toggle row use existing `app.css` **tokens** (no new palette
    colours; a translucent-black scrim for the backdrop is an overlay, not a palette
    colour, and is acceptable). Tap targets are **≥44px**; **no horizontal scroll**
    at a 375px-wide viewport.
14. **No console errors or warnings** in dev or in the built preview.

### Code quality

15. **No new dependencies.** `package.json` is unchanged.
16. **Brief explanatory comments** on each new block per technical-standards — the
    *why* on the session store's non-persistence, the `start()` gate, and the
    Modal's portal + grayscale handling.
17. **Untouched files stay untouched** — every file in the "must NOT be modified"
    list, especially `settings.js`, `game-state.js`, `App.svelte`, and `app.css`.
18. **Production build succeeds.** `npm run build` completes with no errors and no
    new warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Name-specific targeting.** Blocking only when the last player is literally
  "Yusuf" is **rejected** — it blocks for anyone while on.
- **A "play anyway" / override path.** None by design; turning the toggle off is the
  only way to start.
- **Persistence.** The toggle must **not** survive a reload/launch and must **not**
  be added to `settings.js` — this is the deliberate difference from Grayscale.
- **Reusing `Modal` elsewhere** (e.g. a results confirmation). Built reusable, but no
  other caller is in scope.
- **Popup motion / design polish** (animation, custom iconography) — a `03-design`
  concern later; functional styling only here.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No
   console errors.
2. **Settings → Anti-Yusuf Feature** row is present, **off** by default, with the
   description "No explanation needed here...".
3. Toggle **on** → back to setup → set the **last** name field to "Yusuf" →
   **Start Game** → popup reads **exactly** *"Ha ha nice try, I'm not going to let
   Yusuf cheat by being last and seeing who the imposter is!"*; **no round starts**.
4. **OK**, **backdrop click**, and **Esc** each dismiss back to setup; the form
   values are intact and no round has started.
5. Clear the **last** name field → Start → popup names **"Player N"** (N = player
   count).
6. Toggle **off** → **Start Game** → the round starts normally (reveal screen),
   regardless of who is last.
7. **Not persisted:** toggle on → **reload the app** → it is **off** again. (For
   contrast, Grayscale on + reload stays on.)
8. **Grayscale × popup:** enable **both** Grayscale and Anti-Yusuf, Start **at a
   desktop window width** → popup is fully black-and-white **and** its backdrop
   covers the whole viewport. Re-check at 375px (no horizontal scroll).
9. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–18 fails, the build is not done.

## Open questions for the builder

- **Message delivery.** Slot content vs a `message` prop on `Modal` is the builder's
  call, provided the rendered text is verbatim (criterion 6).
- **Escaping the filter.** A `<body>` portal is the expected technique, but any
  approach is acceptable so long as criterion 11 holds in both modes.
- **Session store name/shape.** `sessionSettings` in `session-settings.js` is
  expected; any equivalent in-memory, non-persisted store is acceptable as long as
  criteria 1–2 hold.
- **Dismiss affordances.** OK is mandatory; backdrop-click and Esc are expected
  niceties (criterion 10) — keep all three unless one proves problematic.

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. The build is **complete** and
satisfies criteria 1–18; this document backfills the contract it was verified
against.
