# Spec — "Choose a Card" reveal animation

## Source brief

[02-development/workflow/01-brief/choose-a-card-reveal-brief.md](../01-brief/choose-a-card-reveal-brief.md)
(approved plan:
[01-plan/plans/choose-a-card-reveal-plan-final.md](../../../01-plan/plans/choose-a-card-reveal-plan-final.md))

> "Choose a Card" appears in **no** reference screenshot; it is defined by this spec and its
> brief alone. This document is the acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not exact DOM, class names, CSS, animation timings, or card
copy, which are the builder's call within the constraints below.

The mandated essentials, because they are the explicit goals of the feature:
(a) a **fourth reveal style**, `card-grid`, selectable from the **existing** Settings "Reveal
animation" dropdown, **persisted** like the other three (criteria 1–3);
(b) when selected, each player's turn shows a **3×3 grid of nine face-down cards** that
reveals **nothing** about any role until a card is tapped, with a **single tap** flipping the
chosen card to **that player's real role** (criteria 4–8);
(c) the other eight cards flip to **random decoy roles**, with **jester decoys only on a
jester round** (criteria 9–10);
(d) a **full role-detail card** below the grid with the **same content** as the other styles,
and a working **advance** action (criteria 11–13);
(e) **Grayscale**, **reduced-motion**, and **mobile/quality** parity (criteria 14–17);
(f) the other three styles and all game logic are **unchanged** (criteria 18–20).
Everything else — exact card faces, flip timing, stagger, decoy distribution, prompt
wording — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/reveal-styles.js` | `REVEAL_STYLES` gains **one** entry with `id: 'card-grid'` and a user-facing `label` (e.g. `'Choose a Card — tap one of nine to flip it'`). The existing three entries, `DEFAULT_REVEAL_STYLE`, and exports are otherwise unchanged. |
| `src/components/CardGridReveal.svelte` | **New.** Self-contained reveal component accepting the **same prop contract as `WheelReveal.svelte`**: `isImpostor, isJester, hasJester, word, hint, showHint, fellowImposters, advanceLabel, onDone`. Renders the 3×3 grid, the single-tap flip + decoys, and the detail card + advance button. |
| `src/screens/RevealScreen.svelte` | Imports `CardGridReveal`; adds **one** branch `{:else if revealStyle === 'card-grid'}` **before** the Original `{:else}` fallback, passing the already-derived `isImpostor`, `isJester`, `hasJester` (`$gameState.hasJester`), `word` (`$gameState.word`), `hint`, `showHint`, `fellowImposters`, `advanceLabel`, and `onDone={revealDone}` — mirroring the existing `<WheelReveal>` call. No other change. |

Files that must **NOT** be modified by this build: `src/lib/game-state.js`,
`src/lib/settings.js`, `src/lib/roles-config.js`, `src/lib/session-settings.js`,
`src/lib/troll-mode.js`, `src/lib/troll-state.js`, `src/lib/shuffle.js`,
`src/lib/word-source.js`, `src/lib/config.js`, `src/screens/SettingsScreen.svelte`,
`src/screens/SetupScreen.svelte`, `src/screens/RolesScreen.svelte`,
`src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`,
`src/screens/ResultsScreen.svelte`, `src/components/WheelReveal.svelte`,
`src/components/Toggle.svelte`, `src/components/Select.svelte`,
`src/components/Stepper.svelte`, `src/components/Modal.svelte`, `src/app.css` (no new tokens
needed), `src/App.svelte`, `public/data/*`, `src/service-worker.js`, `src/main.js`,
`vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Style registration + selection (`reveal-styles.js` + Settings)

1. `REVEAL_STYLES` contains a fourth entry whose `id` is `'card-grid'` and whose `label` is a
   readable, user-facing name. `DEFAULT_REVEAL_STYLE` and the other three entries are
   unchanged.
2. The Settings "Reveal animation" `<Select>` shows the new option **automatically** (because
   it renders from `REVEAL_STYLES`) — **`SettingsScreen.svelte` is not modified**, and **no
   new persisted setting** is added (`settings.js` unchanged). Selecting it sets
   `$settings.revealStyle = 'card-grid'`.
3. The selection **persists across a reload** (it rides the existing `revealStyle`
   persistence). An unknown/legacy stored value still falls back to the Original style as
   today.

### Grid presentation + no pre-tap leak (`CardGridReveal.svelte` via `RevealScreen.svelte`)

4. With `card-grid` selected, each player's reveal turn shows a **3×3 grid of nine cards**,
   all **face-down**, under a **"Choose a card"** (or equivalent) prompt. The existing
   player tag and the jester banner (when `hasJester`) still render around it.
5. **No pre-tap leak:** before any card is tapped, the grid is **role-agnostic** — nothing in
   the DOM/markup reveals which card is the real role or what the player's role is. (A reader
   inspecting the page before the tap cannot determine the role.)
6. The component is recreated per player (as the other styles are), so the grid resets to
   all-face-down at the start of each player's turn — no state leaks between players.

### The rig: single tap reveals the real role (`CardGridReveal.svelte`)

7. **Single tap** (no press-and-hold) on **any** of the nine cards flips that card. Enter/Space
   on a focused card behaves identically (keyboard parity).
8. **The tapped card always flips to this player's real role**, derived as
   `kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate'` — regardless of which
   of the nine cards is tapped. The player can never select a "wrong" role.

### Decoys (`CardGridReveal.svelte`)

9. After a card is tapped, the **other eight** cards flip to **decoy roles** drawn at random
   from a pool. The chosen card shows the real role; the eight decoys are independent of it.
10. **Jester decoys appear only when `hasJester` is true.** On a non-jester round the decoy
    pool is crewmate/imposter only — **no jester card ever appears** on a non-jester round
    (mirrors the wheel's segment gating). On a jester round a jester decoy **may** appear.

### Detail card + advance (`CardGridReveal.svelte`)

11. After the reveal, a **role-detail card** is shown **below the grid** with content
    **equivalent to the other reveal styles**:
    - **Jester** (checked **before** the imposter/crewmate split, since `isImpostor` is
      false): identifies them as the JESTER, shows the **real `word`**, and conveys the
      get-voted-out goal.
    - **Imposter:** identifies them as the imposter; shows the **hint only when `showHint`**
      (and a graceful fallback message when `showHint` is true but the hint is blank); lists
      **`fellowImposters`** when that array is non-empty.
    - **Crewmate:** shows the **real `word`**.
    This content matches `WheelReveal`'s detail card; the jester is **never** shown a hint and
    **never** rendered as a crewmate or imposter.
12. An **advance** button labelled with the passed `advanceLabel` calls `onDone` (i.e.
    `revealDone`), advancing to the pass screen, or to discussion for the last player —
    identical to the other styles.
13. The component **consumes the props `RevealScreen` already derives** (`hint`, `showHint`,
    `fellowImposters`, etc.) and does **not** re-derive role/hint/fellow-imposter logic or
    read `gameState` directly.

### Grayscale, reduced motion, look & feel

14. **Grayscale parity:** the component uses the existing colour tokens
    (`--accent` / `--error` / `--jester`) only — **no new tokens, no `app.css` change**. With
    Grayscale on, the imposter and crewmate reveals are **indistinguishable by colour**.
15. **Reduced motion:** under `prefers-reduced-motion: reduce`, the flip animation is dropped —
    the chosen card's role and the detail card appear **without motion**, the result is still
    **correct**, and there is still **no pre-tap leak**.
16. **Mobile/quality:** tap targets are **≥ 44px**; **no horizontal scroll** at a 375px-wide
    viewport; the grid fits within the existing reveal `.screen` card.
17. The card buttons are real, focusable controls with appropriate `aria-label`s; the hold/tap
    gesture does not trigger text selection or the long-press context menu.

### Isolation (the rest of the app is unchanged)

18. The **Original**, **Envelope**, and **Wheel of Fate** styles are **byte-for-byte
    unchanged** in behaviour. `WheelReveal.svelte` and the existing branches in
    `RevealScreen.svelte` are not altered beyond adding the one new `{:else if}`.
19. **No game-logic change:** role assignment, word/hint generation, fellow-imposter gating,
    Troll Mode, and the jester role are untouched. `game-state.js` is **not** modified. (On a
    Troll round every player is an imposter, so every chosen card reveals the imposter card
    with that player's own hint — this falls out of the props, no special-casing.)
20. **Single source of truth + standards:** the style id/label lives **only** in
    `reveal-styles.js`; the new component is wired in **one** place. Each new block carries a
    **brief explanatory comment** per technical-standards; user-facing text spells
    **"imposter(s)"**.

### Build

21. **No new dependencies** (`package.json` unchanged) and **no console errors/warnings** in
    dev or the built preview. **`npm run build` succeeds** with no new errors/warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Press-and-hold gating** for this style — single tap is the agreed interaction.
- **A configurable grid size** — fixed **3×3 / nine cards**.
- **Themed card art / illustrations / a redesign** — a later `03-design` concern; this build
  uses the existing token palette only.
- **Any change to the other three styles, role assignment, `game-state.js`,
  `word-source.js`, the pass/discussion/results screens, Settings markup, routing, Capacitor,
  or the service worker.**

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the
app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. **Setting present & persists:** Settings → **Reveal animation** lists **"Choose a Card"**;
   select it and **reload** → still selected.
3. **Grid & no leak:** start a round → each player's turn shows a **3×3 grid of nine
   face-down cards** with a "Choose a card" prompt; nothing about the role is visible until a
   tap.
4. **Any card → real role:** tap **different** cards across turns/restarts → the tapped card
   always flips to the **correct** role for that player; the **detail card below** matches the
   wording of the other styles (word / hint / fellow imposters / jester goal).
5. **Decoys:** the other eight flip to a believable crewmate/imposter mix; on a **non-jester**
   round **no jester decoy** appears; on a **jester** round a jester decoy **may** appear.
6. **Jester round:** the jester's chosen card reveals the **JESTER** with the **real word**
   and the get-voted-out goal (checked before the crewmate branch).
7. **Multi-imposter round:** with 2+ imposters and "Reveal fellow imposters" on, the
   imposter's detail card lists fellow imposters; on a **Troll** round it does **not** (and
   every player sees the imposter card with their own hint).
8. **Grayscale:** with Grayscale on, imposter vs crewmate reveals are indistinguishable by
   colour.
9. **Reduced motion:** with reduced motion on, **no flip animation** — role still revealed
   correctly, still no pre-tap leak.
10. **Advance:** the advance button passes to the next player, or continues to discussion for
    the last player.
11. **Regression:** the **Original / Envelope / Wheel** styles are unchanged. Re-check at
    375px (no horizontal scroll, tap targets ≥ 44px).
12. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–21 fails, the build is not done.

## Open questions for the builder

- **Card faces & prompt wording.** The face-down card design, the "Choose a card" prompt
  text, and the short per-card role labels on flip are the builder's call, provided the real
  role reads unambiguously and decoys are clearly distinct theatre (criteria 4, 8, 9).
- **Flip timing & stagger.** Exact flip duration and whether the eight decoys flip
  simultaneously or staggered is tunable by feel, provided reduced-motion drops the animation
  (criteria 7, 15).
- **Decoy distribution.** How the eight decoy kinds are chosen (fully random vs a fixed
  pleasing mix) is the builder's call, subject to the jester-only-on-jester-round rule
  (criterion 10).
- **Detail-card reuse.** Copying `WheelReveal`'s `.result` markup vs factoring a shared
  snippet is the builder's call, as long as wording stays consistent with the other styles
  (criterion 11).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/` — a new
`src/components/CardGridReveal.svelte` plus the two small wiring edits.
