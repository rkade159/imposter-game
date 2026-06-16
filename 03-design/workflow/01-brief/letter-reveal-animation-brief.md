# Brief — Secret Letter Reveal Animation

## Source

No standalone plan doc — this design originates directly from Rehaan in the
2026-06-16 session. (If a plan is wanted later, it would live at
`01-plan/plans/letter-reveal-animation-plan-final.md`.)

## What to build

Replace the flat **"Tap to reveal your role"** button on the reveal screen with a
tactile **sealed-letter** interaction. Each player is handed a closed envelope and
must **press and hold** to break the seal; the flap swings open and a note slides
out reading either **"THE WORD IS: …"** (crewmate) or **"YOU ARE THE IMPOSTER!"** +
hint (imposter).

Today the reveal is the least interactive moment in the game — a single tap flips a
plain bordered card ([RevealScreen.svelte](../../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte)).
After this build, opening your role feels deliberate and suspenseful and mirrors
the physical act of opening a letter that's been passed to you.

This is **scoped to the reveal screen only** — no game-logic changes.

## Why this is being built now

1. **The reveal is the emotional peak of a pass-and-play round** and currently has
   no weight to it. A press-and-hold "open the letter" beat turns a tap into a
   moment.
2. **Press-and-hold is also a better anti-fumble gate** than a tap — it can't be
   triggered by an accidental brush as the phone changes hands.

## How it should behave

- **Sealed:** a closed envelope, the player's name/progress tag, and the prompt
  **"Press and hold to open your letter."** Nothing about the role is shown or hinted.
- **Opening (while held):** the flap lifts gradually over **~1.2s** of continuous
  holding — the lift *is* the progress indicator, building suspense.
- **Early release → re-seal (reset):** lifting the finger before the hold completes
  snaps the flap shut and restarts the hold from zero. Opening requires **one
  continuous hold**.
- **Opened (hold complete):** the flap locks open and the note **slides up out of
  the envelope** showing the role; release no longer matters. The existing
  **"Hide & pass to next player"** / **"Hide & continue to discussion"** button then
  appears and still calls `revealDone()`.

## The hard rules (the heart of this build)

1. **Role-agnostic envelope.** The envelope, the hold duration, and the opening
   motion are **identical for imposter and crewmate**. Only the *note content*
   differs. An onlooker glancing across the table must not be able to tell the role
   from the animation, timing, or shape.
2. **This must not break Grayscale mode.** The note's colours must come from the
   existing **`--accent` (crewmate) / `--error` (imposter)** tokens — never hardcoded
   — so `:root.grayscale` collapses them to the same gray and `filter: grayscale(1)`
   desaturates the rest, exactly as today. The envelope itself uses **neutral** tokens
   so it is role-identical even in colour mode. See
   [grayscale-mode-spec.md](../../../02-development/workflow/02-specs/grayscale-mode-spec.md).
3. **`prefers-reduced-motion`:** the hold is still required (it's the gameplay gate),
   but the flap/slide **transitions are disabled** — states snap rather than animate.

## Scope

**In scope:**

- **Rework the reveal interaction** in
  [RevealScreen.svelte](../../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  the sealed → opening → opened states, press-and-hold (pointer + keyboard), the
  envelope/flap/note markup, and the CSS animation. Pure CSS + plain JS — **no
  animation libraries** (per [technical-standards.md](../../../02-development/references/technical-standards.md)).
- The existing role content (crewmate word + sub-line; imposter title + hint +
  sub-line, with its missing-hint error fallback) is **preserved** — it just lives
  inside the note now, keeping its `--accent` / `--error` token classes.
- **Both touch and mouse** via pointer events; **keyboard** hold via Space/Enter;
  suppress the mobile long-press context menu.
- **Mobile-responsive**, tap target large; works on modern browsers.

**Out of scope (do NOT build here):**

- **`game-state.js` and the rest of the flow** — `revealDone()`, `displayName()`,
  `gameState`, routing, the pass/discussion/results screens are unchanged.
- **Restyling other screens** or the app shell / palette.
- **A no-hold accessibility bypass** — the deliberate hold is the point; reduced-motion
  keeps the hold and only drops the animation.
- **Sound / haptics** — possible later polish, not this build.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/screens/RevealScreen.svelte` | **Only file changed.** New sealed-letter markup + press-and-hold logic + animation CSS, replacing the tap-to-reveal button. Role content preserved inside the note. |

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Sealed on arrival:** start a round (e.g. 4 players, 1 imposter). First reveal
   shows a **sealed envelope** with the prompt — no role shown or hinted.
2. **Tap ≠ open:** a quick tap (no hold) reveals nothing.
3. **Hold opens:** holding ~1.2s opens the flap and slides out the note — the word
   (crewmate) or "YOU ARE THE IMPOSTER!" + hint (imposter).
4. **Early release re-seals:** holding then releasing early snaps it shut and hides
   the role; holding again from zero opens it.
5. **Advance gated:** the pass/continue button appears **only** after full open and
   passes to the next player.
6. **Role-agnostic:** an imposter turn and a crewmate turn look **identical** until
   the note shows — same envelope, timing, motion.
7. **Grayscale holds:** Settings → Grayscale on → the envelope and **both** note types
   render in matched grays (no brightness/colour tell).
8. **Cross-input + reduced motion:** works on touch (phone) and mouse (desktop); with
   the OS "reduce motion" setting on, states snap but the hold is still required.
9. **Spelling:** copy reads **"Imposter"** everywhere (never "impostor").
10. **Build:** `npm run build` succeeds with no new warnings; no console errors.

## Addendum (post-build) — reveal-style selector

After the envelope reveal shipped, Rehaan asked for it to be **optional** (some
players prefer the original snappy tap-to-reveal), and — with a third animation
planned — for it to be a **named selector** rather than an on/off toggle. So the
reveal style is now a persisted **"Reveal animation"** dropdown in Settings,
**defaulting to Classic (original)**, with the last-used style persisting across
rounds. The original reveal is kept in
[RevealScreen.svelte](../../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte)
(chosen by the setting). The styles live in a shared
[reveal-styles.js](../../../02-development/workflow/03-builds/imposter-game-app/src/lib/reveal-styles.js)
(so adding one is a single entry), surfaced via a reusable
[Select.svelte](../../../02-development/workflow/03-builds/imposter-game-app/src/components/Select.svelte)
row. See criterion 16 in the spec.

**The next animation theme is its own design** — a separate plan, brief, and spec —
that plugs into this selector (one `REVEAL_STYLES` entry + one `RevealScreen` branch).

## Next step

Feeds [letter-reveal-animation-spec.md](../02-specs/letter-reveal-animation-spec.md)
(the acceptance contract), then the build.
