# Plan: "Choose a Card" role-reveal animation — *final*

## Context

The app offers three role-reveal styles, picked in Settings: **Original** (tap to flip),
**Envelope** (hold to open), and **Wheel of Fate** (hold to spin & stop). Each is pure
theatre over a role decided at round setup — the animation just makes the pass-and-play
hand-off feel interactive.

This plan adds a **fourth style, "Choose a Card."** The screen shows a **3×3 grid of nine
face-down cards** under a "Choose a card" prompt. The player taps any card; it flips to
reveal *their* predetermined role; the other eight flip to random decoy roles for spectacle;
and a full role-detail card appears below the grid. Like the Wheel, the outcome is rigged —
whichever card is tapped shows the real role — so this is interaction flavour only, not new
game logic.

### Decisions locked
- **Single tap** to pick (snappy "choose a card" feel). The grid shows nothing until a tap,
  so there's no pre-tap role leak — the only exposure is a deliberate tap, acceptable here.
- **Other 8 cards flip to random decoy roles** (crewmate/imposter/jester mix) for theatre.
- **Full role detail in a separate card below the grid**, reusing the Wheel's pattern.

## Approach

A near-direct clone of how the Wheel of Fate was added — three touch points, mirroring the
`wheel` integration exactly. App root: `02-development/workflow/03-builds/imposter-game-app/`.

### 1. Register the style — `src/lib/reveal-styles.js`
Add one entry to `REVEAL_STYLES` (single source of truth read by the Settings `<Select>` and
`RevealScreen`):
```js
{ id: 'card-grid', label: 'Choose a Card — tap one of nine to flip it' }
```
No Settings UI change (dropdown auto-populates). No new persisted setting — `revealStyle`
already stores the choice and unknown values fall back to Original.

### 2. New component — `src/components/CardGridReveal.svelte`
Self-contained, with the **same prop contract as `WheelReveal.svelte`**:
`isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`.

- 3×3 grid of nine face-down card `<button>`s under a "Choose a card" prompt.
- Player's true role as a single tag, exactly like the wheel:
  `kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate'`.
- **Rig:** the chosen card always shows the real `kind`; the other eight take random decoy
  `kind`s (include `jester` decoys only when `hasJester`, mirroring the wheel's segment logic
  so a jester card never appears on a non-jester round).
- **Flip:** CSS 3D flip reusing the envelope's approach — `perspective` on the grid,
  `transform-origin` + `rotateY(180deg)` per card, `backface-visibility: hidden` on both
  faces. On tap, chosen card flips to a short role label; the others flip to decoy labels
  (staggered).
- **Detail card** below the grid: full role detail copied verbatim from `WheelReveal`'s
  `.result` block (jester / imposter+hint+fellowImposters / crewmate+word) plus the
  `.advance-btn` calling `onDone`. Keeps wording identical across all four styles.
- **Tokens only** for colour (`--accent` / `--error` / `--jester`) so Grayscale collapses
  roles together.
- **Reduced motion:** drop the flip transition — card snaps to its face, detail appears (no
  motion, no leak), matching the envelope/wheel handling.
- Keyboard/focus parity: real `<button>`s with `aria-label`; Enter/Space picks.

### 3. Wire it in — `src/screens/RevealScreen.svelte`
Import `CardGridReveal`; add one branch before the Original `{:else}` fallback:
```svelte
{:else if revealStyle === 'card-grid'}
  <CardGridReveal
    {isImpostor} {isJester}
    hasJester={$gameState.hasJester}
    word={$gameState.word}
    {hint} {showHint} {fellowImposters} {advanceLabel}
    onDone={revealDone}
  />
```
All round/role data is already derived in `RevealScreen` and passed through unchanged — no
`game-state.js` changes.

### Reuse
- Prop contract, `kind` derivation, decoy jester gating, detail-card markup, advance button,
  reduced-motion handling: lifted from **`WheelReveal.svelte`**.
- 3D-flip CSS: pattern from the envelope flap in **`RevealScreen.svelte`**.
- Registration + branching: identical to the `wheel` wiring.

## Verification (build stage)
Rehaan runs `npm run dev` (he drives the app; this is the smoke checklist):
1. Settings → Reveal animation → "Choose a Card" persists across reload.
2. Start rounds (incl. a jester round and a multi-imposter round). Each player's turn shows a
   3×3 grid of nine face-down cards + "Choose a card".
3. Tapping **any** card flips it to the **correct** role; detail card shows the right
   word/hint/fellow imposters/goal text — same wording as other styles.
4. Decoys flip to a believable mix; no jester decoys on a non-jester round.
5. Grayscale: imposter and crewmate cards indistinguishable by colour.
6. Reduced-motion: no flip animation, role still correct, no pre-tap leak.
7. Advance button passes to next player / continues to discussion for the last player.

## Out of scope
- Brief, spec, and build artifacts (separate later stages).
- Any change to role assignment, word/hint generation, or other reveal styles.
- Configurable grid size (fixed 3×3 / nine cards).

## Next steps (pipeline)
1. **Review** this plan.
2. Promote to a brief in `02-development/workflow/01-brief/choose-a-card-reveal-brief.md`.
3. Spec → `02-development/workflow/02-specs/choose-a-card-reveal-spec.md`.
4. Build → `src/components/CardGridReveal.svelte` + the two wiring edits.
