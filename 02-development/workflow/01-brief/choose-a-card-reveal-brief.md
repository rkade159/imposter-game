# Brief — "Choose a Card" reveal animation

## Source plan

[01-plan/plans/choose-a-card-reveal-plan-final.md](../../../01-plan/plans/choose-a-card-reveal-plan-final.md)
(approved plan; this feature has no reference screenshot — it is defined by this brief and
its spec.)

## What to build

A **fourth role-reveal style — "Choose a Card"** — alongside the existing **Original**
(tap to flip), **Envelope** (hold to open), and **Wheel of Fate** (hold to spin & stop).
It is selected from the **same "Reveal animation" dropdown** in Settings.

Today each player's role is decided at round setup (`gameState.roles[]`) and shown by
whichever reveal style is selected; the role *content* (word / hint / fellow imposters /
goal text) is identical across styles — only the entrance differs. After this build:

- The dropdown gains a **"Choose a Card"** option. When selected, each player's turn shows
  a **3×3 grid of nine face-down cards** under a **"Choose a card"** prompt.
- The player **taps any one card** (single tap). That card **flips** to reveal **their**
  predetermined role; the **other eight flip to random decoy roles** (a crewmate/imposter —
  and, on a jester round, jester — mix) for spectacle.
- A **full role-detail card appears below the grid** — the **same** content the other
  styles show (crewmate + word / imposter + hint + fellow imposters / jester + word +
  get-voted-out goal) — followed by the existing **advance** button.
- Like the **Wheel of Fate**, the outcome is **rigged**: whichever card is tapped flips to
  the **real** role. The nine cards are pure theatre — no new game logic, no change to how
  roles are assigned.
- **Single tap is intentional** (snappy "pick a card" feel). The grid shows **nothing**
  about any role until a card is tapped, so there is **no pre-tap leak** on hand-off — the
  only exposure is a deliberate tap, which is acceptable for this style.

## Why this is being built now

1. **It's a near-direct clone of the Wheel of Fate integration.** The reveal screen already
   branches per style and passes a fixed prop set; a fourth branch + a self-contained
   component is the established, low-risk pattern (`wheel` was added exactly this way).
2. **The seams already exist.** The reveal-style list is a single source of truth
   (`reveal-styles.js`) read by both the Settings `<Select>` and `RevealScreen`; adding one
   entry wires the dropdown automatically. The role/word/hint/fellow-imposter data is already
   derived once in `RevealScreen` and passed down — the new component consumes the **same**
   prop contract as `WheelReveal`, so no `game-state.js` change is needed.
3. **The hard parts are already solved elsewhere.** The 3D-flip CSS reuses the envelope
   flap's proven `perspective` / `transform-origin` / `backface-visibility` approach; the
   detail-card markup and the jester-decoy gating are lifted verbatim from `WheelReveal`.

## How the rig works (the core logic)

The player's true role is derived as a single tag, exactly like the wheel:

```js
$: kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate';
```

Nine grid cells. The **chosen** cell (whichever is tapped) always resolves to `kind`. The
**other eight** take random decoy kinds drawn from a pool of `crewmate` / `impostor` — and
`jester` **only when `hasJester`** (mirroring the wheel's segment logic, so a jester card
never appears on a non-jester round; the jester is announced anyway, so this is no leak).
Because the chosen card is always the real role, the decoys are resolved **at tap time** for
the eight non-chosen cells — nothing role-specific is rendered before the tap.

On tap: the chosen card flips to a short role label and the other eight flip to their decoy
labels (staggered for spectacle); the full **detail card** then renders below the grid,
reusing `WheelReveal`'s `.result` block and advance button so wording stays identical across
all four styles.

## Scope

**In scope:**

- **Register the style** — [src/lib/reveal-styles.js](../03-builds/imposter-game-app/src/lib/reveal-styles.js):
  add one entry to `REVEAL_STYLES`,
  `{ id: 'card-grid', label: 'Choose a Card — tap one of nine to flip it' }`. No new
  persisted setting — `revealStyle` already stores the choice, and unknown/legacy values
  already fall back to Original. The Settings `<Select>` populates from this list, so the
  Settings screen is **not** touched.
- **New component** — `src/components/CardGridReveal.svelte`: self-contained, with the
  **same prop contract as `WheelReveal.svelte`** —
  `isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`.
  - A **3×3 grid of nine** face-down card `<button>`s under a **"Choose a card"** prompt.
  - Derived `kind` (as above); chosen card → real `kind`; other eight → random decoy kinds
    (jester only when `hasJester`).
  - **CSS 3D flip** reusing the envelope approach: `perspective` on the grid, `transform-
    origin` + `rotateY(180deg)` per card, `backface-visibility: hidden` on both faces.
  - **Detail card below the grid**: the jester / imposter (+ hint when `showHint` + fellow
    imposters when non-empty) / crewmate branches copied from `WheelReveal`'s `.result`
    block, plus the `.advance-btn` calling `onDone`.
  - **Colour tokens only** (`--accent` / `--error` / `--jester`) so **Grayscale** collapses
    the roles to one gray — no new tell.
  - **Reduced motion** (`prefers-reduced-motion`): drop the flip transition — the chosen
    card snaps to its face and the detail card appears (no motion, no leak), matching the
    envelope/wheel handling.
  - **Keyboard / focus parity**: real `<button>`s with `aria-label`; Enter/Space picks.
- **Wire it in** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  import `CardGridReveal`; add **one** branch (`{:else if revealStyle === 'card-grid'}`)
  **before** the Original `{:else}` fallback, passing the already-derived
  `isImpostor / isJester / hasJester / word / hint / showHint / fellowImposters / advanceLabel`
  and `onDone={revealDone}` — identical to the existing `<WheelReveal>` call.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS,
  **no new dependencies**, a brief comment on each new block, user-facing spelling
  **"imposter(s)"**, tap targets ≥ 44px, no horizontal scroll at 375px.

**Out of scope (do NOT build here):**

- **Any change to role assignment, word/hint generation, fellow-imposter gating, or the
  other three reveal styles** — this is an additive fourth style only.
- **A new persisted setting or any Settings-screen markup change** — the dropdown
  auto-populates from `REVEAL_STYLES`.
- **A configurable grid size** — fixed **3×3 / nine cards**.
- **Press-and-hold gating** — single tap is the agreed interaction for this style.
- **Themed card art / illustrations** — that's a later `03-design` concern; this build uses
  the existing token palette only.
- **Changes to `game-state.js`, the pass/discussion/results screens, routing, Capacitor, or
  the service worker.**

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/reveal-styles.js` | Add the `{ id: 'card-grid', … }` entry to `REVEAL_STYLES`. |
| `src/components/CardGridReveal.svelte` | **New.** 3×3 grid, single-tap flip, decoys, detail card below. |
| `src/screens/RevealScreen.svelte` | Import + one `{:else if revealStyle === 'card-grid'}` branch passing the existing props. |

## Constraints worth highlighting

- **Rigged like the wheel.** Whichever card is tapped flips to the **real** role; the player
  cannot pick a "wrong" role. Decoys are for the other eight cells only.
- **No pre-tap leak.** Nothing role-specific renders until a card is tapped — the grid is
  role-agnostic at rest, so single-tap is safe on hand-off.
- **Jester decoys only when `hasJester`.** Mirror the wheel: a jester card must never appear
  on a non-jester round.
- **Jester branch checked first.** The jester has `isImpostor: false`; the detail card must
  check `isJester` **before** the imposter/crewmate split or it renders as a crewmate.
- **Same prop contract as `WheelReveal`.** Consume the props `RevealScreen` already derives;
  do **not** re-derive `fellowImposters`, the hint, or `showHint` inside the component.
- **Grayscale parity + reduced motion.** Tokens only for colour; honour
  `prefers-reduced-motion` (no flip, still revealed, still no leak).
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥ 44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Setting present & persists:** Settings → **Reveal animation** lists **"Choose a Card"**;
   select it and **reload** → still selected.
2. **Grid & prompt:** start a round → each player's turn shows a **3×3 grid of nine
   face-down cards** and the **"Choose a card"** prompt, with nothing revealed until a tap.
3. **Correct role on any card:** tapping **any** of the nine flips it to the **correct**
   role for that player; the **detail card below** shows the right word / hint / fellow
   imposters / goal text — **identical wording** to the other styles.
4. **Decoys:** the other eight flip to a believable crewmate/imposter mix; on a **non-jester**
   round **no jester decoy** appears; on a **jester** round a jester decoy **may** appear.
5. **Jester round:** the jester's chosen card reveals **"🃏 YOU ARE THE JESTER!"** with the
   real word and the get-voted-out goal (jester branch checked before crewmate).
6. **Multi-imposter round:** with 2+ imposters and "Reveal fellow imposters" on, an
   imposter's detail card lists the fellow imposters (and is suppressed on a Troll round).
7. **Grayscale:** with Grayscale on, the imposter and crewmate reveals are indistinguishable
   by colour.
8. **Reduced motion:** with reduced motion on, there is **no flip animation** — the role is
   still revealed correctly and there is still no pre-tap leak.
9. **Advance:** the advance button passes to the next player, or continues to discussion for
   the last player.
10. **Regression + build:** the other three styles are unchanged; `npm run build` succeeds;
    no console errors; no horizontal scroll at 375px; tap targets ≥ 44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/choose-a-card-reveal-spec.md](../02-specs/choose-a-card-reveal-spec.md),
which converts it into an acceptance-criteria contract for the build.
