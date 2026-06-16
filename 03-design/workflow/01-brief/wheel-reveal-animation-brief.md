# Brief — Wheel of Fate Reveal Animation

## Source plan

[01-plan/plans/wheel-reveal-animation-plan-final.md](../../../01-plan/plans/wheel-reveal-animation-plan-final.md)

## What to build

A **third selectable reveal animation** — a **"Wheel of Fate"**. When it's a
player's turn, they see a wheel of role names **already spinning**; they **press and
hold** to slow it down until it eases to a stop on their role. The wheel is **rigged**
— the role is already decided (`gameState.roles[revealIndex]`) — so the spin is pure
suspense. When it lands, a **detail card** slides in with the secret word (crewmate)
or the hint (imposter).

This is the third style alongside **Classic** (tap-to-reveal) and **Secret letter**
(envelope), chosen from the existing **"Reveal animation"** selector in Settings and
rendered by
[RevealScreen.svelte](../../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte).
It plugs into that infrastructure — it does **not** change game logic or the other
styles.

## Why this is being built now

1. **Different groups want different energy.** Classic is quick, Secret letter is
   intimate; the Wheel is the loud, game-show option. Giving players the choice (the
   selector already exists) makes the reveal feel like theirs.
2. **The reveal is the emotional peak** of a pass-and-play round — a spinning wheel
   that the player personally brings to rest squeezes the most suspense out of it.

## How it should behave

- **Idle:** a wheel of role-coded segments fills the reveal area, **spinning**. This is
  role-agnostic — identical for everyone, giving nothing away.
- **Hold to slow:** pressing and holding **decelerates** the wheel; it visibly eases
  toward a stop.
- **Release re-accelerates (reset):** letting go before it stops speeds the wheel back
  up to full spin; one continuous hold is needed to bring it to rest. *(Rehaan's
  choice — matches the envelope, and stops accidental hand-off reveals.)*
- **Rigged landing:** it always eases to a segment matching the player's real role.
  Multiple segments per role keep where it lands unpredictable.
- **Detail card after landing:** a card slides in leading with the unambiguous role
  (*"You're the IMPOSTER 🎭"* / *"You're a CREWMATE 📝"*) then the info the player
  needs — the **word** (crewmate) or **hint** (imposter, with the existing blank-hint
  "An error occurred." fallback). The existing **pass / continue** button follows and
  still calls `revealDone()`. *(Rehaan's choice — detail card after landing.)*

## The segments (first-cut content — Rehaan's to adjust)

Six segments, alternating role so each role has three landing spots. Labels are light
comedy; the **detail card** is what states the role unambiguously, so the wheel can be
playful:

| Role (`isImpostor`) | Segment labels |
|---|---|
| Crewmate (`false`) | `CREWMATE`, `Innocent 😇`, `Good Egg 🥚` |
| Imposter (`true`)  | `IMPOSTER`, `Sneaky 🕵️`, `Sus 😈` |

Kept in a small config so renaming/adding is a one-line edit.

## The hard rules (the heart of this build)

1. **Role-agnostic until it lands.** The idle spin and the slow-down look identical for
   imposter and crewmate; nothing role-specific (the detail card) appears until the
   wheel has stopped on the player's own hold.
2. **Grayscale mode still works, untouched.** Segment fills come from the existing
   **`--accent`** (crewmate) / **`--error`** (imposter) tokens — never hardcoded — so
   `:root.grayscale` collapses both to one gray and the colour tell vanishes; **neutral
   dividers** keep the wedges separable in gray. The detail card reuses the same token
   classes as the other styles. **Do not edit `app.css`.** See
   [grayscale-mode-spec.md](../../../02-development/workflow/02-specs/grayscale-mode-spec.md).
3. **`prefers-reduced-motion`:** **no constant spinning** (vestibular safety) — show the
   wheel static, **keep the hold** as the gameplay gate, and on completion highlight the
   role segment + show the detail card, with no large rotation animation.

## Scope

**In scope:**

- A **new `WheelReveal.svelte` component**: idle spin, press-and-hold deceleration with
  **re-accelerate on early release**, **rigged** landing on the player's role, the
  after-landing **detail card** (word/hint), and the reduced-motion path. Pure CSS +
  plain JS (e.g. `requestAnimationFrame`) — **no animation libraries** (per
  [technical-standards.md](../../../02-development/references/technical-standards.md)).
- **Both touch and mouse** via pointer events (with pointer capture); **keyboard** hold
  via Space/Enter; suppress the mobile long-press menu / selection / scroll-steal — the
  same robustness as the envelope.
- **Wire it into the selector:** one `REVEAL_STYLES` entry (`id: 'wheel'`) in
  [reveal-styles.js](../../../02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js)
  and one `{:else if}` branch in `RevealScreen.svelte`. Default stays `'original'`.
- **Mobile-responsive**; large tap target; works on modern browsers.

**Out of scope (do NOT build here):**

- **`game-state.js` and the flow** — `revealDone()`, `displayName()`, `gameState`,
  routing, and the pass/discussion/results screens are unchanged.
- **The other reveal styles** (Classic, Secret letter), the Settings/Select plumbing
  beyond the one new option, the app shell, or the palette.
- **Sound / haptics / confetti**, a spin-skip bypass, and per-segment custom
  colours/images — possible later polish.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/components/WheelReveal.svelte` | **New.** The whole wheel reveal (spin, hold-to-slow, rigged landing, detail card, reduced-motion). Token-coloured segments + neutral dividers. |
| `src/lib/reveal-styles.js` | Add one `REVEAL_STYLES` entry `{ id: 'wheel', label: … }`. (Segment list may live here or in the component.) |
| `src/screens/RevealScreen.svelte` | Add an `{:else if revealStyle === 'wheel'}` branch rendering `WheelReveal`, wired to the role/word/hint and `revealDone()`. |

## Constraints worth highlighting

- **The rig must be reliable.** It must land on the player's *actual* role every time —
  a wheel that ever contradicts the real role is a correctness bug, not a polish issue.
- **No role leak before landing.** The detail card (the only role-specific element) must
  not be visible — even faintly — until the wheel has come to rest.
- **One continuous angle value.** Idle spin, deceleration, and re-acceleration must share
  one tracked angle so cancelling a partial stop doesn't visibly jump the wheel.
- **Spelling is "imposter"** in any user-facing text. **No new dependencies.**
- Works on modern browsers; mobile-responsive — verify at 375px; tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Select it:** Settings → **Reveal animation** → **Wheel of Fate**; reload → sticks;
   new round → still selected. Default remains **Classic**.
2. **Idle spin:** the reveal shows a spinning wheel; nothing role-specific shown.
3. **Hold slows it:** holding visibly decelerates the wheel to an eased stop.
4. **Lands on the real role:** always stops on a segment matching the player's role
   (cross-check against the results screen / another style).
5. **Release re-accelerates:** releasing early speeds it back up; a fresh continuous
   hold is needed to land it.
6. **Detail card:** after landing, the card shows the role clearly + the word (crewmate)
   or hint (imposter); the pass/continue button then advances.
7. **Role-agnostic:** the spin + hold look identical for both roles until the card.
8. **Grayscale:** with Grayscale on, segments are matched grays (separable by dividers/
   labels), detail card shows no colour/brightness tell.
9. **Reduced motion + input:** OS "reduce motion" → no spinning, hold still required;
   works on touch, mouse, and keyboard hold.
10. **Build:** `npm run build` succeeds with no new warnings; no horizontal scroll at
    375px; copy reads "Imposter" everywhere.

## Next step

Feeds [wheel-reveal-animation-spec.md](../02-specs/wheel-reveal-animation-spec.md)
(the acceptance contract), then the build.
