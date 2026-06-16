# Spec — Wheel of Fate Reveal Animation

## Source brief

[03-design/workflow/01-brief/wheel-reveal-animation-brief.md](../01-brief/wheel-reveal-animation-brief.md)
(source plan:
[01-plan/plans/wheel-reveal-animation-plan-final.md](../../../01-plan/plans/wheel-reveal-animation-plan-final.md))

## Contract note

Per [technical-standards.md](../../../02-development/references/technical-standards.md),
this spec is a **contract, not a blueprint**. It says WHAT must be true — observable
behaviour and the rules other code depends on — not the exact spin speed, easing,
segment geometry, DOM, or class names, which are the builder's call within the
constraints below.

Five things *are* mandated because they are the explicit goals of this feature:
(a) the reveal is gated behind a **press-and-hold** that **re-accelerates the wheel on
early release** (criteria 2–5); (b) the wheel **always lands on the player's real,
predetermined role** (criterion 4) — a wheel that can contradict the role is a
correctness bug; (c) after it lands, a **detail card** shows the role clearly **plus
the word (crewmate) / hint (imposter)** (criterion 6); (d) the spin and hold are
**role-agnostic** and nothing role-specific shows until it lands (criterion 7), and the
role colours come from the existing **`--accent` / `--error` tokens** so **Grayscale
mode keeps working** unchanged (criterion 8); (e) a **`prefers-reduced-motion`** path
**drops the spinning** but keeps the hold (criterion 9). Everything else — segment
count and labels, spin speed, settle duration, the landing maths — is the builder's
call, provided the observable results hold.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/components/WheelReveal.svelte` | **New.** The wheel reveal: an idle spin, a press-and-hold deceleration that **re-accelerates on early release**, a **rigged** ease-to-stop on a segment matching the player's role, an after-landing **detail card** (role + word/hint, using `--accent` / `--error` token classes), and a reduced-motion path. Takes the role/word/hint (and the advance label) as props and signals when the player advances (e.g. an event or callback prop) so the parent can call `revealDone()`. Segment fills use role tokens; **neutral dividers** keep wedges separable. |
| `src/lib/reveal-styles.js` | Adds one `REVEAL_STYLES` entry, `{ id: 'wheel', label: <user-facing> }`. The wheel's segment list may live here or inside the component. `DEFAULT_REVEAL_STYLE` is **unchanged** (`'original'`). |
| `src/screens/RevealScreen.svelte` | Adds an `{:else if revealStyle === 'wheel'}` branch that renders `WheelReveal` wired to the existing `isImpostor` / `$gameState.word` / `hint` / `advanceLabel` values, with its advance signal calling **`revealDone()`**. The original tap-to-reveal stays the final `{:else}` fallback; the envelope branch is unchanged. |

Files that must **NOT** be modified: `src/lib/game-state.js`, `src/lib/settings.js`,
`src/lib/session-settings.js`, `src/lib/word-source.js`, `src/lib/config.js`,
`src/app.css`, `src/App.svelte`, the other screens, and the existing components
(`Toggle.svelte`, `Select.svelte`, `Stepper.svelte`, `Modal.svelte`). In particular
the **Grayscale** behaviour must come for free from reusing the role tokens — **no
`app.css` edits**.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Selection & wiring

1. A new **"Wheel of Fate"** option appears in the Settings **Reveal animation**
   selector (one `REVEAL_STYLES` entry). Choosing it makes the reveal screen render the
   wheel; the choice **persists across rounds and reloads**; the **default stays
   Classic** (`'original'`), and an unrecognised stored value still falls back to the
   original.

### Interaction & states

2. **Idle spin.** On the player's turn the wheel is **already spinning**; no role
   information (the detail card) is shown.
3. **Hold to slow.** Pressing and holding **visibly decelerates** the wheel until it
   eases to a stop. A press too short to bring it to rest does not reveal the role.
4. **Rigged landing (correctness).** The wheel **always** comes to rest on a segment
   matching the player's **predetermined** role (`gameState.roles[revealIndex]`). It
   must **never** land on a segment of the wrong role.
5. **Release re-accelerates (reset).** Releasing / the pointer leaving or being
   cancelled **before** the wheel stops makes it **speed back up** to the idle spin;
   landing it requires one continuous hold. The tracked angle stays continuous across
   idle → decelerate → re-accelerate (no visible jump).
6. **Detail card after landing.** Once stopped, a card shows the **unambiguous role**
   and then the **secret word** (crewmate) or the **hint** (imposter, with the blank/
   missing-hint **"An error occurred."** fallback). The existing **pass / continue**
   button (label per `isLastPlayer`) then appears and calls **`revealDone()`**. No
   other game-state function changes.

### The hard rules

7. **Role-agnostic until it lands.** The idle spin, the deceleration, and their timing
   are **indistinguishable** for imposter vs crewmate; the only role-specific element
   (the detail card) does not appear — even faintly — until the wheel has stopped.
8. **Grayscale mode still works, untouched.** Segment fills and the detail card draw
   their role colours from **`--accent`** / **`--error`** (never hardcoded), so
   `:root.grayscale` collapses both roles to identical grays with no brightness tell;
   **neutral dividers** keep wedges separable in gray. `src/app.css` is **not** edited.
9. **`prefers-reduced-motion: reduce`.** The **constant spinning is removed** (the wheel
   is shown static), but the **hold is still required** and re-engageable; on completion
   the role segment is indicated and the detail card shown, with no large rotation
   animation.

### Input & robustness

10. **Touch and mouse** both work via pointer events (with pointer capture);
    **keyboard** holds via **Space/Enter** (keydown holds, keyup before the stop
    re-accelerates). The control is focusable with an accessible label.
11. **No mobile long-press menu / text selection / scroll-steal** on the wheel.
12. **No leaks on teardown.** Any animation frame loop / timer is cancelled when the
    component is destroyed, so advancing mid-spin can't fire a stray reveal on the next
    mount. (The router remounts the reveal per player, so the wheel re-arms each turn.)

### Look, feel & code quality

13. **Spelling:** all user-facing copy reads **"imposter"** (never "impostor"). Segment
    labels and the detail card follow this.
14. New UI uses existing `app.css` **tokens**; large tap target (≥44px); **no horizontal
    scroll** at a 375px viewport; works on modern browsers.
15. **No console errors or warnings** in dev or the built preview; **no new
    dependencies**; **brief comments** on each new block per technical-standards;
    **`npm run build` succeeds** with no new warnings.

## What is NOT acceptance criteria (deferred)

- **Sound / haptics / confetti** on landing.
- A **spin-skip bypass** — the hold is the gameplay gate; reduced motion keeps the hold
  and only drops the spin.
- **Per-segment custom colours/images, configurable wheel size**, or more than the two
  role colours.
- Changes to the **other reveal styles**, other screens, or `game-state.js`.

## Verification

Per [technical-standards.md](../../../02-development/references/technical-standards.md),
the builder **writes** this checklist but does **NOT** run `npm run dev` — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Select:** Settings → Reveal animation → **Wheel of Fate**; reload → sticks; new
   round → still selected. Default remains Classic.
3. **Idle spin:** the reveal shows a spinning wheel; no role info yet.
4. **Hold slows it:** holding decelerates the wheel to an eased stop.
5. **Lands on the real role:** repeat across a full round — it always matches each
   player's role (cross-check the results screen).
6. **Release re-accelerates:** release early → speeds back up; a fresh hold lands it.
7. **Detail card:** after landing, role shown clearly + word (crewmate) / hint
   (imposter); pass/continue advances; finish a round into discussion → results.
8. **Role-agnostic:** the spin + hold look identical for both roles until the card.
9. **Grayscale:** Grayscale on → segments matched grays (separable by dividers/labels),
   detail card no colour/brightness tell.
10. **Reduced motion + input:** OS "reduce motion" → no spinning, hold still required;
    works on touch, mouse, and keyboard hold.
11. **Build:** stop dev; `npm run build` succeeds with no new warnings; no horizontal
    scroll at 375px.

If any one of criteria 1–15 fails, the build is not done.

## Open questions for the builder

- **Spin/settle feel.** Idle speed, `SETTLE_MS` (how long the hold takes to stop the
  wheel), and segment count are tuning constants — any values that read as a smooth
  decelerating spin and land cleanly on the role satisfy the contract.
- **Where the angle lives.** A single JS-tracked angle (rAF) shared by idle, decelerate,
  and re-accelerate is expected (so cancels don't jump); any approach with the same
  continuous, jump-free result is acceptable.
- **Component boundary.** `WheelReveal.svelte` is expected to own the spin + landing +
  detail card; exactly which props/events it exposes to `RevealScreen` is the builder's
  call, provided it ends by triggering `revealDone()`.

## Next step

This spec is the contract for the build at `src/components/WheelReveal.svelte`
(+ the two wiring edits: the `'wheel'` entry in `reveal-styles.js` and the
`{:else if}` branch in `RevealScreen.svelte`). **Built 2026-06-16** — compiles
clean; awaiting Rehaan's `npm run dev` smoke test against criteria 1–15.
