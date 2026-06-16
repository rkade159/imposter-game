# Spec — Secret Letter Reveal Animation

## Source brief

[03-design/workflow/01-brief/letter-reveal-animation-brief.md](../01-brief/letter-reveal-animation-brief.md)

## Contract note

Per [technical-standards.md](../../../02-development/references/technical-standards.md),
this spec is a **contract, not a blueprint**. It says WHAT must be true — observable
behaviour and the rules other code depends on — not the exact transforms, durations
beyond the stated default, DOM shape, or class names, which are the builder's call
within the constraints below.

Four things *are* mandated because they are the explicit goals of this feature:
(a) the reveal is gated behind a **press-and-hold** that **re-seals on early release**
(criteria 2–4); (b) the envelope, hold duration, and opening motion are **identical
for both roles** (criterion 7) — this is the anti-tell goal, not a side effect;
(c) note colours come from the existing **`--accent` / `--error` tokens** so
**Grayscale mode keeps working** unchanged (criterion 8); (d) a
**`prefers-reduced-motion`** path keeps the hold but drops the animation (criterion 9).
Everything else — the precise envelope art, transforms, easing, exact hold feel — is
the builder's call.

## What must exist (deliverables)

The build modifies the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/screens/RevealScreen.svelte` | The sealed-letter interaction: a `sealed → opening → opened` state machine driven by press-and-hold (pointer + keyboard), envelope/flap/note markup, and pure-CSS flap+slide animation. The existing role content (crewmate word + sub-line; imposter title + hint + sub-line, including the blank-hint "An error occurred." fallback) is preserved inside the note with its `--accent` / `--error` token classes. The advance button still calls `revealDone()`. **The original tap-to-reveal is kept and shown when the envelope setting is off — see criterion 16.** |
| `src/lib/settings.js` | Adds a **`revealStyle`** string to `defaults`, default `DEFAULT_REVEAL_STYLE` (`'original'`). Persists with the rest of the `settings` store. |
| `src/lib/reveal-styles.js` | **New.** The list of reveal styles (`REVEAL_STYLES` — `{ id, label }[]`) + `DEFAULT_REVEAL_STYLE`, mirroring `word-source.js`. The single source the selector and the reveal screen both read, so adding a style is one entry here. |
| `src/components/Select.svelte` | **New.** A reusable labelled dropdown row (companion to `Toggle.svelte`): `bind:value`, `options`, optional `description`/`id`; a real `<select>` styled from existing tokens. |
| `src/screens/SettingsScreen.svelte` | Adds one **"Reveal animation"** `Select` row (options from `REVEAL_STYLES`) bound to `$settings.revealStyle`. |

Files that must **NOT** be modified: `src/lib/game-state.js`,
`src/lib/session-settings.js`, `src/lib/word-source.js`, `src/lib/config.js`,
`src/app.css`, `src/App.svelte`, the other screens, and `Toggle.svelte` /
`Stepper.svelte` (reused as-is).

## Acceptance criteria

A build is "done" when **every** item below is true.

### Interaction & states

1. **Sealed on mount.** Each reveal starts with a **closed envelope**, the player's
   name + "N of M" progress tag, and a prompt to **press and hold**. No role text,
   colour, or icon is shown or hinted in the sealed state.
2. **Hold to open.** Pressing and holding for **~1.2s** (a tunable constant) opens
   the flap and reveals the note. The flap visibly progresses during the hold so the
   player knows to keep holding.
3. **Tap ≠ open.** A press shorter than the hold duration reveals nothing.
4. **Early release re-seals (reset).** Releasing (or the pointer leaving / being
   cancelled) before the hold completes returns to the **sealed** state and the hold
   restarts from zero on the next press. Opening requires one continuous hold.
5. **Opened is sticky.** Once the hold completes, the note stays revealed regardless
   of release; the flap stays open.
6. **Advance gated & unchanged.** The **"Hide & pass to next player"** /
   **"Hide & continue to discussion"** button (label per `isLastPlayer`, as today)
   appears **only** in the opened state and still calls **`revealDone()`**. No other
   game-state function changes.

### The hard rules

7. **Role-agnostic reveal.** In the sealed and opening states, and in the opening
   motion and its timing, an **imposter** turn and a **crewmate** turn are
   **indistinguishable**. Only the *note content* (word vs "YOU ARE THE IMPOSTER!" +
   hint) differs, and only once opened. The envelope/flap use **neutral** tokens
   (e.g. `--bg-surface`, `--text-muted`), not role colours.
8. **Grayscale mode still works, untouched.** The note's role colours come from the
   existing **`--accent`** (crewmate) and **`--error`** (imposter) tokens — never
   hardcoded — so `:root.grayscale` (which pins both to one gray and applies
   `filter: grayscale(1)` on `.app-shell`) collapses them to identical grays with no
   brightness tell. `src/app.css` is **not** edited; this works by reusing the tokens.
9. **`prefers-reduced-motion: reduce`.** The flap/slide **transitions are disabled**
   (states snap), but the **hold is still required** and re-seal still works.

### Input & robustness

10. **Touch and mouse** both work via pointer events; **keyboard** opens via a held
    **Space/Enter** (keydown starts, keyup before completion re-seals). The control
    is focusable and has an accessible label.
11. **No mobile long-press menu / text selection / scroll-steal** on the envelope
    (e.g. `touch-action: none`, `user-select: none`, suppressed context menu).
12. **No leaks on teardown.** The hold timer is cleared so a player advancing
    mid-hold can't trigger a reveal on the next mount. (The router remounts this
    component per player, so `sealed` is the natural starting state each turn.)

### Look, feel & code quality

13. **Spelling:** all user-facing copy reads **"imposter"** (never "impostor").
14. New UI uses existing `app.css` **tokens**; large tap target; **no horizontal
    scroll** at a 375px viewport; works on modern browsers.
15. **No console errors or warnings** in dev or the built preview; **no new
    dependencies**; **brief comments** on each new block per technical-standards;
    **`npm run build` succeeds** with no new warnings.

### Reveal-style selector (added after the initial build)

16. The reveal style is chosen by a persisted **"Reveal animation"** selector in
    Settings, listing the entries from `REVEAL_STYLES` and **defaulting to
    `'original'`** (the tap-to-reveal). Selecting **Classic** makes the reveal
    screen behave exactly as it did before this feature; selecting **Secret
    letter** uses the envelope press-and-hold (criteria 1–12). Any unrecognised /
    legacy stored value **falls back to the original** (never a blank screen). The
    choice **persists across rounds and reloads** via the `settings` store, and the
    last-used style is what the next round shows. The selector is built to extend:
    a new style is one `REVEAL_STYLES` entry + one branch in `RevealScreen.svelte`.

## What is NOT acceptance criteria (deferred)

- A **no-hold accessibility bypass** — the deliberate hold is intentional; reduced
  motion keeps the hold and only drops animation.
- **Sound / haptics** on open.
- **Restyling other screens**, the app shell, or the palette.
- Changes to **pass / discussion / results** screens or `game-state.js`.

## Verification

Per [technical-standards.md](../../../02-development/references/technical-standards.md),
the builder **writes** this checklist but does **NOT** run `npm run dev` — **Rehaan
runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Sealed:** start a round (4 players, 1 imposter). First reveal shows a closed
   envelope + prompt; no role shown or hinted.
3. **Tap ≠ open:** a quick tap reveals nothing.
4. **Hold opens:** hold ~1.2s → flap opens, note slides out with the word (crewmate)
   or "YOU ARE THE IMPOSTER!" + hint (imposter).
5. **Early release re-seals:** hold then release early → flap shuts, role hidden;
   holding again from zero opens it.
6. **Advance gated:** the pass/continue button shows only after full open and passes
   to the next player; finish a full round into discussion → results.
7. **Role-agnostic:** an imposter turn and a crewmate turn look identical until the
   note shows.
8. **Grayscale:** Settings → Grayscale on → envelope and both note types render in
   matched grays, neither brighter.
9. **Cross-input + reduced motion:** works on touch and mouse; keyboard hold (Space/
   Enter) works; OS "reduce motion" on → states snap, hold still required.
10. **Build:** stop dev; `npm run build` succeeds with no new warnings; no horizontal
    scroll at 375px.
11. **Selector (criterion 16):** Setup → ⚙ Settings → **Reveal animation** defaults
    to **Classic** and the reveal screen uses the original tap-to-reveal. Switch to
    **Secret letter** → the envelope reveal is used. Change it, reload the page →
    the choice sticks; start a fresh round → the last-used style is what you get.

If any one of criteria 1–16 fails, the build is not done.

## Next step

This spec is the contract for the build at `src/screens/RevealScreen.svelte`.
