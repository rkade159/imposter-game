# Spec — Jester Role + Roles screen + Wheel-of-Fate polish

## Source brief

[02-development/workflow/01-brief/jester-role-brief.md](../01-brief/jester-role-brief.md)
(approved plan:
[i-want-you-to-pure-swan.md](../../../../../.claude/plans/i-want-you-to-pure-swan.md))

> The Jester appears in **no** reference screenshot; it is defined by this spec and its
> brief alone. This document is the acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not exact DOM, class names, or CSS, which are the
builder's call within the constraints below.

The mandated essentials, because they are the explicit goals of the feature:
(a) a **new "Roles" screen**, reached from a **top-left** button on the setup screen,
carrying a **persisted** **"Jester"** toggle that is **off by default** (criteria 1–7);
(b) when on and the round is **not** a troll round with **≥ 3 players**, **exactly one**
player is the jester, who **reads the real word** but reveals as a **distinct light-pink
"JESTER" role** in **all three** reveal styles (criteria 8–15); (c) the jester's existence
is **announced** during the round and **revealed** on the Results screen (criteria 16–18);
(d) **Troll Mode wins** — no jester on a troll round (criterion 13); (e) the three **Wheel
of Fate** improvements — faster settle, snap-on-late-release, loading bar — work for every
role (criteria 19–22). Everything else — exact wording, emoji, wedge labels, the precise
settle duration — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/roles-config.js` | **New.** A `writable` store `{ jesterEnabled: false }`, loaded from and auto-persisted to `localStorage` under a key **distinct** from settings (e.g. `imposter:roles`), using the same guarded load/subscribe pattern as `settings.js`. Exports the store (e.g. `rolesConfig`). |
| `src/lib/config.js` | Adds `export const JESTER_MIN_PLAYERS = 3;`. Existing exports unchanged. |
| `src/app.css` | `:root` gains `--jester: #f0a8d8;` (light pink); `:root.grayscale` gains `--jester` pinned to the **same** neutral gray as `--accent`/`--error` (`#a8a8a8`). No other token changes. |
| `src/lib/game-state.js` | `buildRoles(playerCount, impostorCount, hasJester)` adds **one** `{ isImpostor:false, isJester:true }` entry when `hasJester`, then shuffles. `startGame()` accepts `jesterEnabled`, computes `hasJester = jesterEnabled && !isTroll`, passes it to `buildRoles`, and stores `hasJester` on the state. `initial` gains `hasJester:false`. Troll path unchanged. |
| `src/screens/RolesScreen.svelte` | **New.** Title "Roles"; one `<Toggle>` bound to `$rolesConfig.jesterEnabled` (label **"Jester"**, light-pink accent, a role description), **disabled with a note** when its `playerCount` prop `< JESTER_MIN_PLAYERS`; static non-toggle blurbs for Crewmate and Imposter; an `onClose` Back button. Accepts `playerCount`. |
| `src/screens/SetupScreen.svelte` | A **Roles** button (top-left) opens `RolesScreen` via a `showRoles` flag (in-place overlay like Settings), sharing a header row with the Settings button. `jesterActive = $rolesConfig.jesterEnabled && players >= JESTER_MIN_PLAYERS`. `maxImpostors = players − (jesterActive ? 2 : 1)`. A guarded reactive auto-off: when `players < JESTER_MIN_PLAYERS` and the toggle is on, set it off. `startGame({...})` is passed `jesterEnabled: jesterActive`. |
| `src/screens/RevealScreen.svelte` | A `$: isJester = role?.isJester === true` derivation; a **jester branch checked before** imposter/crewmate in **both** the Classic card and the Envelope note (title "YOU ARE THE JESTER", the real word, a get-voted-out sub-line), coloured via `var(--jester)`. `isJester` and `hasJester` passed to `<WheelReveal>`. A light-pink banner when `$gameState.hasJester`. |
| `src/components/WheelReveal.svelte` | New `isJester`/`hasJester` props; a derived `kind`; a segment set that includes light-pink jester wedges when `hasJester`; `chooseRestRotation()` matches `kind`; a jester result-card branch. **Plus:** reduced `SETTLE_MS`; `releaseHold()` snaps to `target` and lands when past ~95% of the settle; a `settleProgress` (0→1) driving a progress bar that shows while settling and hides once landed (reduced-motion respected). |
| `src/screens/DiscussionScreen.svelte` | A light-pink banner when `$gameState.hasJester`. |
| `src/screens/ResultsScreen.svelte` | When `$gameState.hasJester`, a **"The jester was {name}"** line (from the `isJester` role entry, via `displayName`) coloured `var(--jester)`, alongside the existing imposter + word reveal. |

Files that must **NOT** be modified by this build: `src/lib/settings.js`,
`src/lib/session-settings.js`, `src/lib/troll-mode.js`, `src/lib/troll-state.js`,
`src/lib/shuffle.js`, `src/lib/word-source.js`, `src/lib/reveal-styles.js`,
`src/screens/SettingsScreen.svelte`, `src/screens/PassScreen.svelte`,
`src/components/Toggle.svelte`, `src/components/Stepper.svelte`,
`src/components/Select.svelte`, `src/components/Modal.svelte`, `src/App.svelte`,
`public/data/*`, `src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`,
`index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Roles store + persistence (`roles-config.js`)

1. A `writable` store exposes `{ jesterEnabled: boolean }`, **off** by default.
2. The value is **persisted** to `localStorage` under a key **distinct** from
   `imposter:settings` (and the troll keys), with a guarded try/catch load and subscribe so
   a storage failure never throws into the app. It **survives a reload**.
3. The store is **separate from `settings.js`** — `settings.js` is **not** modified, and the
   jester toggle does **not** appear in the Settings screen.

### Config (`config.js`)

4. `JESTER_MIN_PLAYERS` is exported and equals `3`. The setup screen's jester logic gates on
   this constant, not a hard-coded literal.

### Roles screen + entry point (`RolesScreen.svelte` + `SetupScreen.svelte`)

5. The setup screen shows a **Roles** button in the **top-left** and the existing **Settings**
   button in the **top-right**; the Roles button opens the Roles screen **in place** (the
   setup form's in-progress state survives the round trip, same pattern as Settings).
6. The Roles screen has a title and a **single toggle labelled exactly `Jester`** bound to
   `$rolesConfig.jesterEnabled`, plus **non-toggle** descriptions of Crewmate and Imposter.
   **No** crewmate/imposter toggles exist. A Back control returns to setup.
7. The Jester toggle is **off by default**, reflects the persisted value, and writing it
   updates the persisted store. When `playerCount < JESTER_MIN_PLAYERS` the toggle is
   **disabled with an explanatory note** (reusing `Toggle`'s `disabled` prop).

### Role assignment (`game-state.js` + `SetupScreen.svelte`)

8. When the jester is on, the round is **non-troll**, and `players >= JESTER_MIN_PLAYERS`,
   the built `roles` contain **exactly one** entry with `isJester === true` and
   `isImpostor === false`, `impostorCount` entries with `isImpostor === true`, and the
   remainder plain crewmates — all shuffled. `gameState.hasJester === true`.
9. The jester entry carries **no `hint`** and the jester **reads `gameState.word`** (the real
   word) — identical word source to a crewmate.
10. The imposter count is constrained to **`[1, players − 2]`** while the jester is active
    (one slot reserved for the jester, one for a crewmate). With the jester off it remains
    **`[1, players − 1]`** exactly as today. The stepper's max and the Start-gate validity
    both reflect this.
11. With **3 players** and the jester active, the only valid configuration is **1 crewmate +
    1 imposter + 1 jester** (imposter max is 1).
12. When the player count drops below `JESTER_MIN_PLAYERS` while the toggle is on, the toggle
    is **automatically turned off** (guarded so it writes only when needed). *(Inert today
    because `MIN_PLAYERS = 3`; the guard must still exist and be correct.)*
13. **Troll Mode wins:** on a troll round, `hasJester` is **false**, there is **no** jester
    entry (everyone is an imposter as today), and **no** jester banner appears.
14. `initial.hasJester === false`, so `playAgain()` and `resetGame()` clear it; the next
    `startGame()` recomputes it from the persisted toggle.
15. With the jester **off**, every round is exactly as before — no jester entry,
    `hasJester === false`, `buildRoles` produces the same crewmate/imposter split.

### Jester reveal (`RevealScreen.svelte` + `WheelReveal.svelte`)

16. In **all three** reveal styles (**Classic**, **Secret Letter**, **Wheel of Fate**), the
    jester sees a **distinct** reveal: a title identifying them as the **JESTER**, the
    **real word**, and a sub-line conveying the goal (get voted out by acting like the
    imposter). The jester is **never** shown a hint and **never** rendered as a crewmate or
    imposter. The branch is checked **before** the crewmate/imposter split (the jester has
    `isImpostor:false`).
17. The jester's reveal colour is **light pink** via `var(--jester)`; in **Grayscale** mode
    it collapses to the **same** neutral gray as the crewmate and imposter reveals (no new
    tell). Crewmate and imposter reveals are **unchanged**.

### Announcement + results (`RevealScreen.svelte` + `DiscussionScreen.svelte` + `ResultsScreen.svelte`)

18. When `gameState.hasJester` is true, a banner indicating a jester is in play this round is
    shown during the **reveal** phase (each player) and on the **Discussion** screen, in
    light pink. It does **not** appear when `hasJester` is false (jester off, or a troll
    round).
19. On the **Results** screen, when `hasJester` is true, the **name of the jester** (their
    typed name or "Player N" fallback via `displayName`) is shown in light pink alongside the
    existing imposter reveal and the word. There is **no** voting UI and **no** auto-win
    logic — the round ends through the existing Discussion → Results flow.

### Wheel of Fate polish (`WheelReveal.svelte`) — applies to every role

20. **Jester wedges:** when `hasJester` is true the wheel's segment set includes light-pink
    jester wedge(s) (`var(--jester)` fill); `chooseRestRotation()` selects a segment whose
    `kind` matches the player's role, so a jester lands on a jester wedge, a crewmate on a
    crewmate wedge, an imposter on an imposter wedge. When `hasJester` is false the wheel is
    the current crewmate/imposter set.
21. **Faster:** the settle duration (`SETTLE_MS`) is **reduced** from its current `3200`,
    so the wheel reaches rest in less time than before (exact value the builder's call).
22. **Snap-on-late-release:** if the player releases when the settle is **≥ ~95%** complete,
    the wheel **snaps to its final role and lands** (does not return to free spin). Releasing
    earlier still resumes spinning, as today.
23. **Loading bar:** while settling, a progress indicator fills from 0→1 tracking time until
    the wheel stops; it is **hidden once landed**. Under `prefers-reduced-motion` the
    existing hold-to-land path still works without animation. The reduced-motion landing
    must also park on a segment of the correct `kind`.

### Look and feel + quality

24. Tap targets remain **≥ 44px**; **no horizontal scroll** at a 375px-wide viewport; the
    new screen/banner/wheel use the existing dark-theme tokens.
25. **No new dependencies** (`package.json` unchanged) and **no console errors/warnings** in
    dev or the built preview.
26. **Single source of truth:** the jester toggle lives **only** in `roles-config.js`;
    `JESTER_MIN_PLAYERS` **only** in `config.js`; `hasJester` is computed **once** in
    `startGame()` and read by every screen — not re-derived per reveal style. Each new block
    carries a **brief explanatory comment** per technical-standards. User-facing text spells
    **"imposter(s)"**.
27. **Untouched files stay untouched** — every file in the "must NOT be modified" list,
    especially `settings.js`, `SettingsScreen.svelte`, `shuffle.js`, and `word-source.js`.
28. **Production build succeeds.** `npm run build` completes with no errors and no new
    warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **In-app voting**, a "who was voted out" screen, or a "Jester wins!" outcome screen — the
  win is verbal (criterion 19).
- **More than one jester**, or making crewmate/imposter optional.
- **Jester-specific behaviour on a troll round** — troll wins (criterion 13).
- **Themed jester art / a redesign** of the reveal animations beyond the jester branch and
  the three Wheel polish items — a later `03-design` concern.
- **Lowering `MIN_PLAYERS`** or any change to normal-round assignment, `shuffle.js`,
  `word-source.js`, the pass screen, routing, Capacitor, or the service worker.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the
app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Roles entry & persistence:** **Roles** button top-left, **Settings** top-right; Roles
   opens, **Jester** toggle **off** by default; flip on, **reload** → still on; Back returns
   to setup. The Settings screen has **no** jester toggle.
3. **Assignment, 3 players:** Jester on, 3 players → 1 crewmate + 1 imposter + 1 jester;
   imposter stepper max is **1**.
4. **Assignment, 4 players:** Jester on, 4 players → imposter stepper allows **1–2**; every
   start has exactly one jester and ≥ 1 crewmate.
5. **Jester reveal:** across **all three** reveal styles the jester sees the **JESTER**
   reveal with the **real word** and the objective, in **light pink**; crewmate/imposter
   reveals unchanged.
6. **Banner & results:** on a jester round the banner shows during reveals and discussion;
   Results shows **"The jester was {name}"** in light pink plus the imposter(s) and word.
7. **Grayscale:** with Grayscale on, the jester reveal is indistinguishable from the others.
8. **Troll interaction:** Jester on + a forced Troll round (e.g. Guaranteed) → everyone is
   the imposter, **no** jester, **no** banner.
9. **Wheel polish:** spin-to-stop noticeably faster; releasing in the last ~5% **snaps** to
   the role; a **loading bar** fills while holding and disappears once landed; on a jester
   round the wheel can land on a **light-pink jester wedge**. Re-check `prefers-reduced-motion`
   still lands correctly.
10. **Auto-off guard (inert today):** temporarily lower `MIN_PLAYERS` to 2 in `config.js`,
    set players to 2 with the jester on → the toggle flips off; restore `MIN_PLAYERS`.
11. **Regression:** Jester off → behaviour identical to before. Re-check at 375px (no
    horizontal scroll, tap targets ≥ 44px).
12. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–28 fails, the build is not done.

## Open questions for the builder

- **Wedge labels & emoji.** The exact jester wedge labels (e.g. `JESTER 🃏`, `Fool 🤡`) and
  the reveal/banner wording are the builder's call as long as the role reads unambiguously as
  the jester (criteria 16, 20).
- **Settle duration.** The specific reduced `SETTLE_MS` (and whether `MIN_SPINS` drops from 3
  to 2) is tunable by feel, provided it is faster than today and still reads as a spin
  (criterion 21).
- **Banner placement.** Exact position/wording of the "a jester is in play" banner is the
  builder's call as long as it shows during reveal + discussion when `hasJester` (criterion 18).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`.
