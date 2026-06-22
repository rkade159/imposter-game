# Spec — "Peek under" reveal animation

## Source brief

[02-development/workflow/01-brief/peek-reveal-brief.md](../01-brief/peek-reveal-brief.md)
(approved plan:
[01-plan/plans/peek-reveal-plan-final.md](../../../01-plan/plans/peek-reveal-plan-final.md))

> "Peek under" appears in **no** reference screenshot; it is defined by this spec and its
> brief alone. This document is the acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not exact DOM, class names, CSS, animation timings, cover
art, or prompt copy, which are the builder's call within the constraints below.

The mandated essentials, because they are the explicit goals of the feature:
(a) a **fifth reveal style**, `peek`, selectable from the **existing** Settings "Reveal
animation" dropdown, **persisted** like the other four (criteria 1–3);
(b) when selected, a **cover** hides the role and reveals **nothing** at rest; a **swipe-up
hold** lifts the cover **proportionally to the drag** to expose a **minimal** role line, and
**releasing drops it back**, hiding the role again (criteria 4–9);
(c) after the **first** peek, the **full role-detail card** (same content as the other styles)
and a working **advance** action appear and persist (criteria 10–13);
(d) **keyboard parity** via press-and-hold (criteria 14–15);
(e) **Grayscale**, **reduced-motion**, and **mobile/quality** parity (criteria 16–19);
(f) the other four styles and all game logic are **unchanged** (criteria 20–22).
Everything else — cover look, grip/handle affordance, lift threshold, snap-back timing,
exact prompt wording — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/reveal-styles.js` | `REVEAL_STYLES` gains **one** entry with `id: 'peek'` and a user-facing `label` (e.g. `'Peek under — swipe up & hold'`). The existing four entries, `DEFAULT_REVEAL_STYLE`, and exports are otherwise unchanged. |
| `src/components/PeekReveal.svelte` | **New.** Self-contained reveal component accepting the **same prop contract as `CardGridReveal.svelte`**: `isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`. Renders the two-layer cover/role window, the pointer-drag lift + snap-back, the minimal peek line, and (after the first peek) the detail card + advance button. |
| `src/screens/RevealScreen.svelte` | Imports `PeekReveal`; adds **one** branch `{:else if revealStyle === 'peek'}` alongside the wheel / card-grid branches, passing the already-derived `isImpostor`, `isJester`, `hasJester` (`$gameState.hasJester`), `word` (`$gameState.word`), `hint`, `showHint`, `fellowImposters`, `advanceLabel`, and `onDone={revealDone}` — mirroring the existing `<CardGridReveal>` call. No other change. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`,
`src/lib/settings.js`, `src/lib/roles-config.js`, `src/lib/session-settings.js`,
`src/lib/troll-mode.js`, `src/lib/troll-state.js`, `src/lib/shuffle.js`,
`src/lib/word-source.js`, `src/lib/config.js`, `src/screens/SettingsScreen.svelte`,
`src/screens/SetupScreen.svelte`, `src/screens/RolesScreen.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte`, `src/components/WheelReveal.svelte`,
`src/components/CardGridReveal.svelte`, `src/components/Toggle.svelte`,
`src/components/Select.svelte`, `src/components/Stepper.svelte`, `src/components/Modal.svelte`,
`src/app.css` (no new tokens needed), `src/App.svelte`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Style registration + selection (`reveal-styles.js` + Settings)

1. `REVEAL_STYLES` contains a fifth entry whose `id` is `'peek'` and whose `label` is a
   readable, user-facing name. `DEFAULT_REVEAL_STYLE` and the other four entries are unchanged.
2. The Settings "Reveal animation" `<Select>` shows the new option **automatically** (because
   it renders from `REVEAL_STYLES`) — **`SettingsScreen.svelte` is not modified**, and **no new
   persisted setting** is added (`settings.js` unchanged). Selecting it sets
   `$settings.revealStyle = 'peek'`.
3. The selection **persists across a reload** (it rides the existing `revealStyle`
   persistence). An unknown/legacy stored value still falls back to the Original style as today.

### Cover presentation + no pre-peek leak (`PeekReveal.svelte` via `RevealScreen.svelte`)

4. With `peek` selected, each player's reveal turn shows a **cover** (a rectangular "box")
   over the role area, with a prompt indicating the swipe-up-and-hold gesture (e.g.
   **"Hold & swipe up to peek"**). The existing player tag and the jester banner (when
   `hasJester`) still render around it.
5. **No pre-peek leak:** at rest, before any lift, the role area is **fully covered** —
   nothing in the visible rendered output reveals the player's role. A stray tap that does not
   drag past the peek threshold reveals nothing.
6. The component is recreated per player (as the other styles are), so the cover resets to
   fully closed and `hasPeeked` resets at the start of each player's turn — no state leaks
   between players.

### The lift: finger-controlled peek (`PeekReveal.svelte`)

7. Pressing on the cover and **dragging upward** lifts the cover **proportionally** to the
   drag distance (more upward drag = more of the role exposed), clamped so it cannot exceed the
   covered area. The lift **follows the finger** — it is not a fixed/triggered open.
8. While lifted, a **minimal** role line is exposed underneath, derived as
   `kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate'`:
   - **Crewmate / Jester:** the real `word`.
   - **Imposter:** an imposter indication plus the **hint only when `showHint`** (and a
     graceful fallback when `showHint` is true but the hint is blank).
   The minimal line is positioned so even a **partial** peek surfaces the key word/role first.
9. **Releasing** the press (pointer up / leave / cancel) returns the cover to fully closed, so
   the role is hidden again. The peek is **repeatable** any number of times.

### First peek → full detail + advance (`PeekReveal.svelte`)

10. The **first** time the lift crosses a small peek threshold, a latch (`hasPeeked`) is set.
    Once set, a **role-detail card** appears (and **persists**, independent of the cover
    position) with content **equivalent to the other reveal styles**:
    - **Jester** (checked **before** the imposter/crewmate split, since `isImpostor` is false):
      identifies them as the JESTER, shows the **real `word`**, and conveys the get-voted-out
      goal.
    - **Imposter:** identifies them as the imposter; shows the **hint only when `showHint`**
      (graceful fallback when `showHint` is true but the hint is blank); lists
      **`fellowImposters`** when that array is non-empty.
    - **Crewmate:** shows the **real `word`**.
    This content matches `CardGridReveal`'s detail card; the jester is **never** shown a hint
    and **never** rendered as a crewmate or imposter.
11. An **advance** button labelled with the passed `advanceLabel` appears with the detail card
    (after the first peek) and calls `onDone` (i.e. `revealDone`), advancing to the pass
    screen, or to discussion for the last player — identical to the other styles.
12. Before the first peek, **neither** the detail card **nor** the advance button is present —
    the only way to surface them is a deliberate peek (or the keyboard hold of criterion 14).
13. The component **consumes the props `RevealScreen` already derives** (`hint`, `showHint`,
    `fellowImposters`, etc.) and does **not** re-derive role/hint/fellow-imposter logic or read
    `gameState` directly.

### Keyboard parity (`PeekReveal.svelte`)

14. The cover is a real, focusable control. **Holding Space/Enter** lifts the cover open and
    **releasing** drops it back — mirroring the pointer peek. Auto-repeat keydown must not
    restart/jitter the lift, and Space must not scroll the page.
15. The keyboard hold **also latches `hasPeeked`**, so a keyboard-only player can surface the
    detail card and advance button.

### Grayscale, reduced motion, look & feel

16. **Grayscale parity:** the component uses the existing colour tokens
    (`--accent` / `--error` / `--jester`) only — **no new tokens, no `app.css` change**. With
    Grayscale on, the imposter / crewmate / jester reveals are **indistinguishable by colour**.
17. **Reduced motion:** under `prefers-reduced-motion: reduce`, the **snap-back** transition and
    the **keyboard auto-lift** are **instant** (no animated motion). Direct finger-drag tracking
    may remain (it is manipulation, not animation); the result is still **correct** and there is
    still **no pre-peek leak**.
18. **Mobile/quality:** the cover/press target is **≥ 44px**; **no horizontal scroll** at a
    375px-wide viewport; the component fits within the existing reveal `.screen` card. The drag
    gesture must **not** scroll the page, select text, or pop the long-press context menu
    (`touch-action: none`, `user-select: none`, `-webkit-touch-callout: none`, pointer capture).
19. The press target carries an appropriate `aria-label`, and has a visible `:focus-visible`
    outline.

### Isolation (the rest of the app is unchanged)

20. The **Original**, **Envelope**, **Wheel of Fate**, and **Choose a Card** styles are
    **byte-for-byte unchanged** in behaviour. `CardGridReveal.svelte`, `WheelReveal.svelte`,
    and the existing branches in `RevealScreen.svelte` are not altered beyond adding the one new
    `{:else if}`.
21. **No game-logic change:** role assignment, word/hint generation, fellow-imposter gating,
    Troll Mode, and the jester role are untouched. `game-state.js` is **not** modified. (On a
    Troll round every player is an imposter, so every peek reveals the imposter content with
    that player's own hint — this falls out of the props, no special-casing.)
22. **Single source of truth + standards:** the style id/label lives **only** in
    `reveal-styles.js`; the new component is wired in **one** place. Each new block carries a
    **brief explanatory comment** per technical-standards; user-facing text spells
    **"imposter(s)"**.

### Build

23. **No new dependencies** (`package.json` unchanged) and **no console errors/warnings** in dev
    or the built preview. **`npm run build` succeeds** with no new errors/warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Locking the cover after the first peek** — it stays peekable; the detail simply also
  appears below. No "used up" state is required or forbidden beyond keeping the role hidden by
  the cover at rest.
- **Velocity / fling / inertia physics** — the lift is a direct 1:1 follow of the finger with a
  simple snap-back; momentum is out of scope.
- **Themed cover art / illustrations / a redesign** — a later `03-design` concern; this build
  uses the existing token palette only.
- **Any change to the other four styles, role assignment, `game-state.js`, `word-source.js`,
  the pass/discussion/results screens, Settings markup, routing, Capacitor, or the service
  worker.**

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder **writes**
this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the app** and
verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. **Setting present & persists:** Settings → **Reveal animation** lists **"Peek under"**;
   select it and **reload** → still selected.
3. **Cover & no leak:** start a round → each player's turn shows the **cover** over the role
   and the swipe-up prompt; nothing about the role is visible at rest, and a tap that doesn't
   drag reveals nothing.
4. **Proportional lift + snap-back:** press-drag up → the cover **rises with the finger** and
   the minimal role line peeks out (more drag = more visible); **release** → cover drops back,
   role hidden; repeat works.
5. **Full detail after first peek:** once peeked, the **detail card** (correct word / hint /
   fellow imposters / jester goal — **identical wording** to the other styles) and the
   **advance button** appear and **persist**.
6. **Roles across turns/restarts:** crewmate shows the word; imposter shows the hint (or the
   blank-hint fallback); imposter with **hints off** shows the role only; the **jester** shows
   the JESTER with the **real word** + get-voted-out goal (checked before the crewmate branch).
7. **Multi-imposter round:** with 2+ imposters and "Reveal fellow imposters" on, the imposter's
   detail card lists fellow imposters; on a **Troll** round it does **not** (and every player
   sees the imposter content with their own hint).
8. **Keyboard:** Tab to the cover, **hold Space/Enter** → cover lifts; **release** → drops;
   the hold **unlocks** the detail card + advance button.
9. **Grayscale:** with Grayscale on, imposter / crewmate / jester reveals are indistinguishable
   by colour.
10. **Reduced motion:** with reduced motion on, the **snap-back** and **keyboard auto-lift** are
    **instant**; the role is still revealed correctly, still no pre-peek leak.
11. **Advance:** the advance button passes to the next player, or continues to discussion for
    the last player.
12. **Regression:** the **Original / Envelope / Wheel / Choose a Card** styles are unchanged.
    Re-check at 375px (no horizontal scroll, tap targets ≥ 44px).
13. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–23 fails, the build is not done.

## Open questions for the builder

- **Cover look & affordance.** The cover design, the grip/handle/chevron hint, and the prompt
  wording are the builder's call, provided the cover fully hides the role at rest and clearly
  invites the upward hold (criteria 4, 5).
- **Lift threshold & snap-back timing.** The peek threshold that latches `hasPeeked`, the
  `maxLift` clamp, and the snap-back duration/easing are tunable by feel, provided reduced
  motion makes snap-back/keyboard-lift instant (criteria 7, 10, 17).
- **Keyboard auto-lift amount.** Whether Space/Enter opens the cover fully or to a fixed peek
  height is the builder's call, as long as it exposes the minimal line and latches `hasPeeked`
  (criteria 14, 15).
- **Detail-card reuse.** Copying `CardGridReveal`'s `.result` markup vs factoring a shared
  snippet is the builder's call, as long as wording stays consistent with the other styles
  (criterion 10).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/` — a new
`src/components/PeekReveal.svelte` plus the two small wiring edits.
