# Brief — "Peek under" reveal animation

## Source plan

[01-plan/plans/peek-reveal-plan-final.md](../../../01-plan/plans/peek-reveal-plan-final.md)
(approved plan; this feature has no reference screenshot — it is defined by this brief and
its spec.)

## What to build

A **fifth role-reveal style — "Peek under"** — alongside the existing **Original**
(tap to flip), **Envelope** (hold to open), **Wheel of Fate** (hold to spin & stop), and
**Choose a Card** (tap one of nine to flip). It is selected from the **same "Reveal
animation" dropdown** in Settings.

Today each player's role is decided at round setup (`gameState.roles[]`) and shown by
whichever reveal style is selected; the role *content* (word / hint / fellow imposters /
goal text) is identical across styles — only the entrance differs. After this build:

- The dropdown gains a **"Peek under"** option. When selected, each player's turn shows a
  **rectangular cover** (a plain "box") sitting over their role, with the prompt
  **"Hold & swipe up to peek"**.
- The player **presses near the bottom, swipes up and keeps holding**. The cover **rises
  with the finger** (proportional to drag distance — a true "lift the lid"), revealing a
  **minimal** role line underneath. **Letting go drops the cover straight back down**,
  hiding the role again. Peeking is **repeatable**.
- After the player has peeked **at least once**, a **full role-detail card** appears
  statically below the cover — the **same** content the other styles show (crewmate + word /
  imposter + hint + fellow imposters / jester + word + get-voted-out goal) — followed by the
  existing **advance** button.
- Nothing about the role is in the visible area at rest — the cover hides it — so there is
  **no pre-peek leak** on hand-off; the only exposure is the player's own deliberate lift.

## Why this is being built now

1. **It's a near-direct clone of the Choose-a-Card / Wheel integration.** The reveal screen
   already branches per style and passes a fixed prop set; a fifth branch + a self-contained
   component is the established, low-risk pattern (`wheel` and `card-grid` were added exactly
   this way).
2. **The seams already exist.** The reveal-style list is a single source of truth
   (`reveal-styles.js`) read by both the Settings `<Select>` and `RevealScreen`; adding one
   entry wires the dropdown automatically. The role/word/hint/fellow-imposter data is already
   derived once in `RevealScreen` and passed down — the new component consumes the **same**
   prop contract as `CardGridReveal` / `WheelReveal`, so no `game-state.js` change is needed.
3. **Most parts are already solved elsewhere.** The detail-card markup and the reduced-motion
   handling are lifted verbatim from `CardGridReveal`; the press-and-hold + `setPointerCapture`
   + keyboard-parity pattern (used for the keyboard fallback) comes from the envelope logic in
   `RevealScreen` and `WheelReveal`. The only genuinely new code is the pointer-drag "lift".

## How the lift works (the core interaction)

The player's true role is derived as a single tag, exactly like the other styles:

```js
$: kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate';
```

A fixed-height **window** (`overflow: hidden`) stacks two layers: a **role layer**
underneath (the minimal role line, anchored toward the **bottom** of the window so even a
small peek reveals the key word/role first) and a **cover layer** on top (a neutral
rectangle that fully hides the role layer at rest).

On `pointerdown` the start Y is recorded; on `pointermove` the lift is
`clamp(startY - currentY, 0, maxLift)` and the cover is translated up by that amount
(`transform: translateY(-lift)`), exposing the bottom strip of the role layer. `maxLift` is
the window height, so a full drag exposes everything. On release
(`pointerup` / `pointerleave` / `pointercancel`) the cover animates back to `translateY(0)`
(~250ms ease) and the role is hidden again.

The **first** time `lift` crosses a small threshold (~24px), `hasPeeked` is set, which
renders the full **detail card** (reusing `CardGridReveal`'s `.result` block) and the advance
button below — they then stay put so the player can read everything without holding.

## Scope

**In scope:**

- **Register the style** — [src/lib/reveal-styles.js](../03-builds/imposter-game-app/src/lib/reveal-styles.js):
  add one entry to `REVEAL_STYLES`, `{ id: 'peek', label: 'Peek under — swipe up & hold' }`.
  No new persisted setting — `revealStyle` already stores the choice, and unknown/legacy
  values already fall back to Original. `DEFAULT_REVEAL_STYLE` stays `'original'`. The
  Settings `<Select>` populates from this list, so the Settings screen is **not** touched.
- **New component** — `src/components/PeekReveal.svelte`: self-contained, with the **same
  prop contract as `CardGridReveal.svelte`** —
  `isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`.
  - A fixed-height **window** with a **role layer** (minimal line, bottom-anchored) and a
    **cover layer** (neutral rectangle, grip/chevron hint + "Hold & swipe up to peek").
  - **Minimal peek line** by `kind`: `"{word}"` for crewmate/jester; `IMPOSTER` + hint (only
    when `showHint`) for the imposter.
  - **Pointer-drag lift**: finger-controlled height as above; snap-back on release; `hasPeeked`
    latches on the first peek past the threshold.
  - **Detail card** (shown after first peek): the jester / imposter (+ hint when `showHint` +
    fellow imposters when non-empty) / crewmate branches copied from `CardGridReveal`'s
    `.result` block, plus the `.advance-btn` calling `onDone`.
  - **Colour tokens only** (`--accent` / `--error` / `--jester`) so **Grayscale** collapses
    the roles to one gray — no new tell.
  - **Keyboard / focus parity**: real `<button>` cover target with `aria-label`; **Space/Enter
    press-and-hold** animates the cover fully open and release drops it (reusing the existing
    hold pattern); this path also latches `hasPeeked`.
  - **Pointer hardening**: `touch-action: none; user-select: none; -webkit-user-select: none;
    -webkit-touch-callout: none;`, `setPointerCapture`, `on:contextmenu|preventDefault`,
    `:focus-visible` outline, and `onDestroy` cleanup of any snap-back / hold timer.
  - **Reduced motion** (`prefers-reduced-motion`): drag is direct manipulation (unaffected);
    only the **snap-back** transition and the **keyboard auto-lift** become instant, matching
    `CardGridReveal`'s handling.
- **Wire it in** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  import `PeekReveal`; add **one** branch (`{:else if revealStyle === 'peek'}`) alongside the
  wheel / card-grid branches, passing the already-derived
  `isImpostor / isJester / hasJester / word / hint / showHint / fellowImposters / advanceLabel`
  and `onDone={revealDone}` — identical to the existing `<CardGridReveal>` call.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS,
  **no new dependencies**, a brief comment on each new block, user-facing spelling
  **"imposter(s)"**, tap targets ≥ 44px, no horizontal scroll at 375px.

**Out of scope (do NOT build here):**

- **Any change to role assignment, word/hint generation, fellow-imposter gating, or the
  other four reveal styles** — this is an additive fifth style only.
- **A new persisted setting or any Settings-screen markup change** — the dropdown
  auto-populates from `REVEAL_STYLES`.
- **Locking the cover after the first peek** — it stays peekable (the full detail simply also
  appears below); no extra state for "used up" peeks.
- **Velocity / fling / inertia physics** — the lift is a direct 1:1 follow of the finger with
  a simple snap-back; no momentum.
- **Themed cover art / illustrations** — that's a later `03-design` concern; this build uses
  the existing token palette only.
- **Changes to `game-state.js`, the pass/discussion/results screens, routing, Capacitor, or
  the service worker.**

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/reveal-styles.js` | Add the `{ id: 'peek', … }` entry to `REVEAL_STYLES`. |
| `src/components/PeekReveal.svelte` | **New.** Two-layer window, pointer-drag lift, minimal peek line, detail card + advance after first peek. |
| `src/screens/RevealScreen.svelte` | Import + one `{:else if revealStyle === 'peek'}` branch passing the existing props. |

## Constraints worth highlighting

- **Finger controls height.** The cover rises *proportionally* to drag distance (clamped to
  the window height) and snaps straight back on release — not a triggered open/close.
- **No pre-peek leak.** Nothing role-specific is visible at rest; the cover fully hides the
  role layer, so a stray tap on hand-off reveals nothing.
- **Minimal while peeking, full after first peek.** During the lift only the core role/word
  line shows; the full detail (incl. fellow imposters and sub-text) appears statically once
  `hasPeeked` latches.
- **Jester branch checked first.** The jester has `isImpostor: false`; both the minimal line
  and the detail card must check `isJester` **before** the imposter/crewmate split or they
  render as a crewmate.
- **Same prop contract as `CardGridReveal`.** Consume the props `RevealScreen` already derives;
  do **not** re-derive `fellowImposters`, the hint, or `showHint` inside the component.
- **Grayscale parity + reduced motion.** Tokens only for colour; honour
  `prefers-reduced-motion` (instant snap-back and keyboard auto-lift; still revealed; still no
  leak).
- **Keyboard parity is required.** Drag isn't keyboard-reachable, so Space/Enter hold must
  open the cover and release must drop it, and the hold must latch `hasPeeked`.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥ 44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Setting present & persists:** Settings → **Reveal animation** lists **"Peek under"**;
   select it and **reload** → still selected.
2. **Cover at rest:** start a round → each player's turn shows the **cover** over the role and
   the **"Hold & swipe up to peek"** prompt, with **nothing** revealed at rest.
3. **Proportional lift:** press-drag up → the cover **rises with the finger** and the minimal
   role line peeks from underneath (more drag = more visible).
4. **Snap-back:** release → the cover **drops straight back down** and the role is hidden
   again; repeating the peek works each time.
5. **Full detail after first peek:** once peeked, the **detail card** (correct word / hint /
   fellow imposters / goal text — **identical wording** to the other styles) and the **advance
   button** appear below and **stay**.
6. **Roles:** crewmate shows the word; imposter shows the hint (or **"An error occurred."** when
   the hint is blank); imposter with **hints off** shows the role only; the **jester** shows
   **"🃏 YOU ARE THE JESTER!"** with the real word + get-voted-out goal (jester checked first).
7. **Multi-imposter round:** with 2+ imposters and "Reveal fellow imposters" on, an imposter's
   detail card lists the fellow imposters (and is suppressed on a **Troll** round).
8. **Keyboard:** Space/Enter **hold** lifts the cover, **release** drops it, and the hold
   **unlocks** the detail card + advance button.
9. **Grayscale:** with Grayscale on, the imposter / crewmate / jester reveals are
   indistinguishable by colour.
10. **Reduced motion:** with reduced motion on, the **snap-back** and **keyboard auto-lift** are
    instant; the role is still revealed correctly and there is still no pre-peek leak.
11. **Advance:** the advance button passes to the next player, or continues to discussion for
    the last player.
12. **Regression + build:** the other four styles are unchanged; `npm run build` succeeds; no
    console errors; no horizontal scroll at 375px; tap targets ≥ 44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/peek-reveal-spec.md](../02-specs/peek-reveal-spec.md),
which converts it into an acceptance-criteria contract for the build.
