# Spec — Troll Mode

## Source brief

[02-development/workflow/01-brief/troll-mode-brief.md](../01-brief/troll-mode-brief.md)
(source plan:
[01-plan/plans/troll-mode-plan-final.md](../../../01-plan/plans/troll-mode-plan-final.md))

> Troll Mode appears in **no** reference screenshot; it is defined by this spec and its
> brief alone. The build was implemented alongside this spec; this document is the
> acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint**. It states WHAT must be true — observable behaviour and the
surfaces other code depends on — not exact DOM, class names, or CSS, which are the
builder's call within the constraints below.

Six things *are* mandated because they are the explicit goals of the feature:
(a) a **persisted** Settings selector labelled **"Troll Mode"** with **exactly four**
options, **Off by default** (criteria 1–5); (b) on a troll round **every** player sees the
**normal imposter reveal** with a **per-player random hint**, in **all three** reveal
styles (criteria 9–12); (c) the four modes behave as specified — Off never fires,
**Sneaky** is ~10% and **never twice in a row**, **Building** rises then resets,
**Guaranteed** fires next round then **turns itself Off** (criteria 6–8); (d) Sneaky and
Building **never fire on the round the mode is enabled** (criterion 7c); (e) the
**fellow-imposter line is suppressed** on a troll round (criterion 13); (f) **results stay
ambiguous** — no troll announcement anywhere (criterion 14). Everything else — option
label wording, dropdown styling, the exact odds constants — is the builder's call.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/troll-mode.js` | **New.** Exports `TROLL_MODES` (four entries: `off`, `sneaky`, `building`, `guaranteed`), `DEFAULT_TROLL_MODE = 'off'`, a pure `rollTroll(mode, state, rng = Math.random) → { isTroll, nextState, disableMode }`, and `buildTrollHints(words, count, rng = Math.random) → string[]`. Odds are local constants. No imports beyond `word-source` shapes; no side effects. |
| `src/lib/troll-state.js` | **New.** A `writable` store of `{ lastMode, lastWasTroll, roundsSinceTroll }`, loaded from and auto-persisted to `localStorage` (key distinct from settings, e.g. `imposter:troll-state`), using the same guarded load/subscribe pattern as `settings.js`. |
| `src/lib/settings.js` | A `trollMode: DEFAULT_TROLL_MODE` key is added to the existing **persisted** `settings` store's `defaults`. No other change; existing `load()` merge + auto-persist cover migration and saving. |
| `src/screens/SettingsScreen.svelte` | Adds one `<Select>` row bound to `$settings.trollMode`, `options={TROLL_MODES}`, label **"Troll Mode"**, with a description conveying it occasionally makes everyone the imposter. Existing rows unchanged. |
| `src/screens/SetupScreen.svelte` | In `start()`, **after** the Anti-Yusuf early-return and after the word is picked: calls `rollTroll($settings.trollMode, get(trollState))`, writes the returned `nextState` to `trollState`, sets `$settings.trollMode = 'off'` when `disableMode` is true, and passes `trollHints` (the per-player hints when `isTroll`, else `null`) into `startGame()`. No other setup logic changes. |
| `src/lib/game-state.js` | `startGame()` accepts an optional `trollHints`; when it is a non-empty array the round is a troll round: `isTroll: true` and `roles = trollHints.map(h => ({ isImpostor: true, hint: h }))`; otherwise unchanged `buildRoles(...)` and `isTroll: false`. `initial` gains `isTroll: false`. `buildRoles` is unchanged. |
| `src/screens/RevealScreen.svelte` | The single derived `hint` prefers the current `role.hint` and falls back to `$gameState.hint` (trimmed). The existing `fellowImposters` derivation gains a `!$gameState.isTroll` term. No other change; all three styles consume the existing derivations. |

Files that must **NOT** be modified by this build: `src/lib/buildRoles` internals,
`src/lib/shuffle.js`, `src/lib/config.js`, `src/lib/session-settings.js`,
`src/lib/reveal-styles.js`, `src/lib/word-source.js`, `src/components/Select.svelte`,
`src/components/Toggle.svelte`, `src/components/WheelReveal.svelte` (it already takes
`isImpostor`/`hint` props — **reused, not changed**), `src/screens/PassScreen.svelte`,
`src/screens/DiscussionScreen.svelte`, `src/screens/ResultsScreen.svelte`,
`src/App.svelte`, `src/app.css`, `public/data/*`, `src/service-worker.js`, `src/main.js`,
`vite.config.js`, `package.json`, `index.html`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Persisted setting (`settings.js` + `troll-mode.js`)

1. `TROLL_MODES` has **exactly four** entries with ids `off`, `sneaky`, `building`,
   `guaranteed`, and `DEFAULT_TROLL_MODE === 'off'`.
2. The `settings` store's `defaults` include **`trollMode: 'off'`** (via
   `DEFAULT_TROLL_MODE`).
3. The chosen mode is **persisted** in the existing `localStorage`-backed `settings`
   store; a user with settings saved before this key existed loads with `trollMode`
   defaulted to `off`. **No new store** is introduced for the *choice*.
4. It is **off by default** (follows from 1–2).

### Settings screen (`SettingsScreen.svelte`)

5. A new selector row exists with label **exactly** `Troll Mode`, rendered via the
   existing `Select` component as a peer of the other rows, two-way bound to
   `$settings.trollMode`, offering the four `TROLL_MODES` options. Existing rows
   (Grayscale, Reveal animation, Reveal fellow imposters, Anti-Yusuf) are **unchanged**.

### Roll behaviour — `rollTroll` (`troll-mode.js`)

6. **Pure & deterministic under an injected `rng`.** Given the same `mode`, `state`, and
   `rng`, output is identical; it has no side effects and does not read global state.
7. Per-mode behaviour, where `justEnabled = (mode !== state.lastMode)`:
   - **(a) `off`** → `isTroll` is always `false`; `disableMode` false.
   - **(b) `sneaky`** → `isTroll` true only when `!justEnabled && !state.lastWasTroll &&
     rng() < ~0.10`; in particular **never two troll rounds in a row**.
   - **(c) never-on-enable** → for **`sneaky` and `building`**, when `justEnabled` is true
     the result is **always non-troll** regardless of `rng`.
   - **(d) `building`** → `isTroll` true only when `!justEnabled && rng() <` a chance that
     **increases with `state.roundsSinceTroll`** and is **capped** (< 1), so it is never a
     certainty.
   - **(e) `guaranteed`** → `isTroll` is **always true** and **`disableMode` is true**
     (ignoring `justEnabled`).
8. **`nextState`** returned is `{ lastMode: mode, lastWasTroll: isTroll, roundsSinceTroll:
   isTroll ? 0 : state.roundsSinceTroll + 1 }` — i.e. the streak **resets on a hit** so
   Building's odds drop back to base, and `lastMode` tracks the mode just rolled.

### Cross-round persistence (`troll-state.js`)

9. The `{ lastMode, lastWasTroll, roundsSinceTroll }` counters are **persisted** to
   `localStorage` under a key **distinct** from `imposter:settings`, and survive a reload
   (so "never twice in a row" and the rising Building odds are not reset by refreshing).
   Storage failure is swallowed (guarded try/catch), never thrown into the game.

### Troll round — the core feature (`SetupScreen.svelte` + `game-state.js` + `RevealScreen.svelte`)

10. The roll happens **once per started round**, in `start()`, **after** the Anti-Yusuf
    early-return (a blocked Start consumes **no** roll) and the `nextState` is **persisted**
    each time. When the roll asks (`disableMode`), the Settings `trollMode` is set to
    **`off`** (Guaranteed fires exactly once).
11. On a troll round, **every** player's role is an imposter and **carries its own hint**:
    `roles[i] = { isImpostor: true, hint: <player i's hint> }`, with `gameState.isTroll ===
    true`. The hints are drawn per player (via `buildTrollHints`) and are **not** forced to
    be the shared `gameState.hint`; they should differ between players when the word pool
    allows.
12. On a troll round, **every** player's reveal — in **all three** styles (**Classic**,
    **Secret Letter**, **Wheel of Fate**) — shows the **same imposter card a lone imposter
    would see** (the "YOU ARE THE IMPOSTER" treatment **with a hint** and **no word**),
    reading that player's **own** `role.hint`. There is **no** crewmate view and **no**
    visible difference from a normal imposter reveal.
13. The **"Reveal fellow imposters" line is never shown on a troll round** (the
    `fellowImposters` derivation includes a `!isTroll` term), even when that setting is on
    and the configured imposter count is ≥ 2 — preserving the "I'm the lone imposter"
    illusion.

### Ambiguity & non-troll rounds

14. The **results screen is unchanged** and shows **no** "Troll Mode" framing — a troll
    round's results read as "everyone was an imposter" with no special announcement.
15. With `trollMode === 'off'`, **every** round is a normal round: the configured number of
    imposters, crewmates see the word, `gameState.isTroll === false`, and `roles[i]` has
    **no** `hint` field. Normal rounds read the shared `gameState.hint` exactly as today.
16. `playAgain()` and `resetGame()` **clear** `isTroll` back to `false` (it is part of
    `initial`).

### Look and feel (baseline only — design comes later)

17. The troll reveal **reuses the existing imposter card** with **no new colour** or layout,
    so Grayscale mode introduces no new tell. Tap targets remain **≥44px**; **no horizontal
    scroll** at a 375px-wide viewport.
18. **No console errors or warnings** in dev or in the built preview.

### Code quality

19. **No new dependencies.** `package.json` is unchanged.
20. **Single source of truth:** the option list and roll logic live **only** in
    `troll-mode.js`, the user's choice in `settings.js`, the cross-round counters in
    `troll-state.js`. The per-player hint is derived **once** in `RevealScreen` (preferring
    `role.hint`) and consumed by all three styles — the imposter card is **not** re-branched
    per style. **Brief explanatory comments** sit on each new block per
    technical-standards (the *why* of `justEnabled`, never-twice, the `isTroll` suppression).
21. **Untouched files stay untouched** — every file in the "must NOT be modified" list,
    especially `word-source.js`, `ResultsScreen.svelte`, `WheelReveal.svelte`, and
    `buildRoles`'s internals.
22. **Production build succeeds.** `npm run build` completes with no errors and no new
    warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **Announcing** the troll round (reveal or results) — it is a stealth gag; results are
  unchanged (criterion 14).
- **A distinct troll-themed reveal animation** — the reveal is the normal imposter card; a
  themed treatment is a later `03-design` concern.
- **Configurable odds or per-round UI** beyond the four options — odds are fixed constants.
- **Changing normal-round role assignment** — `buildRoles` and who's an imposter in a
  normal round are unchanged.
- **A unit-test runner** — `rollTroll`/`buildTrollHints` are pure and `rng`-injectable so
  tests are trivial later, but adding a runner is out of scope for this build.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder
**writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the
app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console
   errors.
2. **Settings → Troll Mode** row present with **four** options, **Off** by default.
3. **Persists:** pick a mode, **reload** → still selected.
4. **Guaranteed:** select it, Start → **every** reveal is the imposter card with a hint,
   and **hints differ** between players; after the round the setting is back to **Off**;
   **results** show no special framing.
5. Repeat the troll reveal across **all three** reveal styles (Classic / Secret Letter /
   Wheel of Fate) → identical to a normal imposter reveal, each with its own hint.
6. **Fellow-imposter suppression:** set imposters to 2+, turn **Reveal fellow imposters**
   on, force a troll round → **no** fellow-imposter line appears.
7. **Off:** with **Off**, several rounds are all normal (configured imposters; crewmates
   see the word).
8. **Never-on-enable:** switch **Off → Sneaky** (or **Building**), Start **one** round → a
   normal round.
9. **Probabilistic plumbing (temporary):** raise the Sneaky/Building odds constants in
   `troll-mode.js` to `1` → confirm a troll round fires and (Sneaky) the **next** round
   cannot also troll; restore the constants.
10. **Odds persistence:** reload mid-**Building** (after a few rounds) → the rising-odds
    state carries over. Re-check at 375px (no horizontal scroll).
11. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–22 fails, the build is not done.

## Open questions for the builder

- **Option labels.** The exact display text for the four options (e.g. "Sneaky — rare
  surprise chaos") is the builder's call as long as the four ids and behaviours match
  (criteria 1, 7).
- **Odds constants.** The specific `SNEAKY_CHANCE` / `BUILDING_BASE` / `BUILDING_STEP` /
  `BUILDING_CAP` values are tunable by the builder within the shape mandated in criterion
  7 (flat ~10%; rising-and-capped; cap < 1).
- **Hint distinctness.** Best-effort distinct per-player hints is expected; falling back to
  repeats when the word pool is smaller than the table is acceptable (criterion 11).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`. The implementation is already in
place; this document records the acceptance criteria it must continue to satisfy.
