# Plan: "Peek under" role-reveal animation — *final*

## Context

The app offers four role-reveal styles, picked in Settings: **Original** (tap to flip),
**Envelope** (hold to open), **Wheel of Fate** (hold to spin & stop), and **Choose a Card**
(tap one of nine to flip). Each is pure theatre over a role decided at round setup — the
animation just makes the pass-and-play hand-off feel interactive.

This plan adds a **fifth style, "Peek under"**, with a more physical feel:

> A big rectangular **cover** sits over the role. The player **presses near the bottom,
> swipes up and keeps holding** to *lift the cover* — it rises with the finger so they can
> glance underneath at their role. **Letting go drops the cover straight back down**, hiding
> the role again. Peeking is repeatable.

Minimal role info shows *while peeking*; once the player has peeked at least once, the
**full** role detail appears statically alongside the advance button so they can read
everything (word / hint / fellow imposters) without holding.

### Decisions locked
- **Lift mechanic:** finger controls height — the cover rises *proportionally* to drag
  distance (true "lift the lid and peek"), and snaps back down on release.
- **Advancing:** after the **first** peek, a "Hide & pass to next player" advance button
  fades in (matches the other styles' advance pattern).
- **Peek content:** **minimal** while peeking (core role/word only). After the first peek,
  the **full** content (role title, word or imposter hint, fellow imposters, sub-text) is
  shown statically next to the advance button.

## Approach

A near-direct clone of how Wheel of Fate / Choose a Card were added — three touch points,
mirroring the existing integration exactly. The only genuinely new code is the pointer-drag
"lift" interaction. App root: `02-development/workflow/03-builds/imposter-game-app/`.

### 1. Register the style — `src/lib/reveal-styles.js`
Add one entry to `REVEAL_STYLES` (single source of truth read by the Settings `<Select>` and
`RevealScreen`):
```js
{ id: 'peek', label: 'Peek under — swipe up & hold' }
```
No Settings UI change (dropdown auto-populates). No new persisted setting — `revealStyle`
already stores the choice and unknown values fall back to Original. Leave
`DEFAULT_REVEAL_STYLE` as `'original'`.

### 2. New component — `src/components/PeekReveal.svelte`
Self-contained, with the **same prop contract as `CardGridReveal.svelte` / `WheelReveal.svelte`**:
`isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`.

- A fixed-height **window** (`overflow: hidden`) holds two stacked layers:
  - **Role layer** (underneath): the *minimal* role line, anchored toward the **bottom** of
    the window so even a small peek reveals the key word/role first.
  - **Cover layer** (on top): a plain rectangle in `--bg-surface` with a `--text-muted`
    border, a grip/chevron hint and the label "Hold & swipe up to peek". Fully covers the
    role layer at rest.
- Player's true role as a single tag, exactly like the other styles:
  `kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate'`. Minimal label =
  `"{word}"` for crewmate/jester; `IMPOSTER` + hint (when `showHint`) for the imposter.
- **Drag:** on `pointerdown` record start Y; on `pointermove` compute
  `lift = clamp(startY - currentY, 0, maxLift)` and translate the cover up
  (`transform: translateY(-lift)`). As it rises, the bottom strip of the role layer shows.
  `maxLift` = window height, so a full drag exposes everything.
- **Release** (`pointerup` / `pointerleave` / `pointercancel`): cover animates back to
  `translateY(0)` (~250ms ease) — role hidden again.
- **First peek:** once `lift` crosses a small threshold (~24px) the first time, set
  `hasPeeked = true` → the full **detail card** + **advance button** appear below and stay.
- **Detail card** = full role detail copied verbatim from `CardGridReveal`'s `.result` block
  (jester / imposter+hint+fellowImposters / crewmate+word) plus the `.advance-btn` calling
  `onDone`. Keeps wording identical across all five styles.
- **Tokens only** for colour (`--accent` / `--error` / `--jester`) so Grayscale collapses
  roles together.
- **Keyboard parity:** drag isn't keyboard-friendly, so Space/Enter **press-and-hold**
  animates the cover fully open and releasing drops it (same press-and-hold pattern as the
  envelope/wheel); this also sets `hasPeeked`.
- Pointer hardening lifted from the existing styles: `touch-action: none; user-select: none;
  -webkit-user-select: none; -webkit-touch-callout: none;`, `setPointerCapture`,
  `on:contextmenu|preventDefault`, real `<button>` target, `:focus-visible` outline, and
  `onDestroy` cleanup of any in-flight snap-back/hold timer.
- **Reduced motion:** drag is direct manipulation (fine as-is); only the snap-back transition
  and the keyboard auto-lift become instant, reusing the `reduced` flag + `@media` pattern
  from `CardGridReveal`.

### 3. Wire it in — `src/screens/RevealScreen.svelte`
Import `PeekReveal`; add one branch alongside the wheel/card-grid branches:
```svelte
{:else if revealStyle === 'peek'}
  <PeekReveal
    {isImpostor} {isJester}
    hasJester={$gameState.hasJester}
    word={$gameState.word}
    {hint} {showHint} {fellowImposters} {advanceLabel}
    onDone={revealDone}
  />
```
All round/role data is already derived in `RevealScreen` and passed through unchanged — no
`game-state.js`, `settings.js`, or `SettingsScreen.svelte` changes.

### Reuse
- Prop contract, `kind` derivation, detail-card markup, advance button, reduced-motion
  handling: lifted from **`CardGridReveal.svelte`**.
- Press-and-hold + `setPointerCapture` + keyboard parity: pattern from the envelope logic in
  **`RevealScreen.svelte`** and **`WheelReveal.svelte`**.
- Registration + branching: identical to the `card-grid` / `wheel` wiring.

## Verification (build stage)
Rehaan runs `npm run dev` (he drives the app; this is the smoke checklist):
1. Settings → Reveal animation → "Peek under" persists across reload.
2. On the reveal screen the cover hides the role at rest (nothing leaks before a deliberate peek).
3. Press-drag up: cover rises with the finger, minimal role peeks from underneath.
4. Release: cover drops straight back, role hidden again; repeatable.
5. After the first peek: full detail (word OR imposter hint + fellow imposters + sub-text)
   and the advance button appear and stay.
6. Advance button passes to next player / continues to discussion for the last player.
7. Roles: crewmate (word), imposter (hint, or "An error occurred." when hint blank), imposter
   with `showHint` off (role only), jester (word + get-voted-out goal), 2+ imposters with the
   fellow-imposters setting on, Troll Mode (no fellow-imposters leak).
8. Keyboard: Space/Enter hold lifts the cover, release drops it, and unlocks the advance.
9. Grayscale: imposter / crewmate / jester indistinguishable. Reduced-motion: snap-back and
   keyboard auto-lift are instant.

## Out of scope
- Brief, spec, and build artifacts (separate later stages).
- Any change to role assignment, word/hint generation, or other reveal styles.
- Locking the cover after first peek (default: keep it peekable).

## Next steps (pipeline)
1. **Review** this plan.
2. Promote to a brief in `02-development/workflow/01-brief/peek-reveal-brief.md`.
3. Spec → `02-development/workflow/02-specs/peek-reveal-spec.md`.
4. Build → `src/components/PeekReveal.svelte` + the two wiring edits.
