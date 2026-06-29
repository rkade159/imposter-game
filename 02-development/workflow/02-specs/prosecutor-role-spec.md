# Spec — Prosecutor Role

## Source brief

[02-development/workflow/01-brief/prosecutor-role-brief.md](../01-brief/prosecutor-role-brief.md)
(approved plan:
[prosecutor-role-plan-final.md](../../../01-plan/plans/prosecutor-role-plan-final.md))

> The Prosecutor appears in **no** reference screenshot; it is defined by this spec and its brief
> alone. This document is the acceptance contract the build must satisfy.

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract,
not a blueprint**. It states WHAT must be true — observable behaviour and the surfaces other code
depends on — not exact DOM, class names, or CSS, which are the builder's call within the
constraints below.

The mandated essentials, because they are the explicit goals of the feature:
(a) a **second persisted toggle, "Prosecutor"**, on the existing Roles screen, **off by default**
(criteria 1–4); (b) when on and the round is **non-troll** with **≥ 3 players**, **exactly one of
the existing imposters** becomes the Prosecutor — an imposter who **reads the shared hint** (not
the word) and is told a **secret target to vote out** (criteria 5–12); (c) the **target is always a
crewmate-type** (crewmate or Jester), never a fellow imposter, never self (criteria 9–11); (d) the
Prosecutor reveals as a **distinct gold "PROSECUTOR" role with the target** in **all reveal styles**
(criteria 13–16); (e) the Prosecutor and **their target** are **revealed on Results** (criterion
17); (f) **Troll Mode wins** (criterion 8); (g) the Prosecutor is **on the imposter team** for the
existing fellow-imposters feature, by name only (criterion 18). Everything else — exact wording,
emoji, the gold hex — is the builder's call within the constraints.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

| File | State after build |
|---|---|
| `src/lib/roles-config.js` | The persisted `defaults` gain `prosecutorEnabled: false`, alongside the existing `jesterEnabled`. Same store, same key (`imposter:roles`), same guarded load/subscribe; the existing `load()` merge supplies the default for users who saved before it existed. |
| `src/lib/config.js` | Adds `export const PROSECUTOR_MIN_PLAYERS = 3;`. Existing exports unchanged. |
| `src/app.css` | `:root` gains `--prosecutor: #e0b341;` (gold, or a near gold of the builder's choice, distinct from `--error` red and `--jester` pink); `:root.grayscale` gains `--prosecutor` pinned to the **same** neutral gray as `--accent`/`--error`/`--jester` (`#a8a8a8`). No other token changes. |
| `src/lib/game-state.js` | `buildRoles(playerCount, impostorCount, hasJester, hasProsecutor)` marks **exactly one** of the `impostorCount` imposter entries with `isProsecutor:true`; **after** the shuffle, sets that entry's `targetIndex` to a random index `i` where `roles[i].isImpostor === false` (crewmates + Jester). If that pool is empty, it drops the prosecutor flag (leaves a plain imposter) rather than throwing. `startGame()` accepts `prosecutorEnabled`, computes `hasProsecutor = prosecutorEnabled && !isTroll`, passes it to `buildRoles`, and stores `hasProsecutor` on the state. `initial` gains `hasProsecutor:false`. Troll path unchanged. |
| `src/screens/RolesScreen.svelte` | A **second** `<Toggle>` after the Jester, bound to `$rolesConfig.prosecutorEnabled` (label **"Prosecutor"**, gold `🔨` accent, a role description), **disabled with a note** when its `playerCount` prop `< PROSECUTOR_MIN_PLAYERS`. A `.role-prosecutor` colour rule using `var(--prosecutor)`. The Jester toggle and the static Crewmate/Imposter blurbs are unchanged. |
| `src/screens/SetupScreen.svelte` | `prosecutorActive = $rolesConfig.prosecutorEnabled && players >= PROSECUTOR_MIN_PLAYERS`. A guarded reactive auto-off: when `players < PROSECUTOR_MIN_PLAYERS` and the toggle is on, set it off. `startGame({...})` is passed `prosecutorEnabled: prosecutorActive`. **`maxImpostors` is unchanged.** |
| `src/screens/RevealScreen.svelte` | A `$: isProsecutor = role?.isProsecutor === true` derivation and a `$: prosecutorTargetName` (via `displayName($gameState.names, role.targetIndex)`, empty when not a prosecutor or no valid index). A **prosecutor branch checked before** the imposter branch in **both** the Original card and the Envelope note (title identifying the **PROSECUTOR**, the **target instruction**, the hint gated by `showHint` with the same blank→error fallback as the imposter, and the fellow-imposters line when present), coloured via `var(--prosecutor)`. `isProsecutor` and `prosecutorTargetName` passed to `<WheelReveal>`, `<CardGridReveal>`, `<PeekReveal>`. |
| `src/components/WheelReveal.svelte` | New `isProsecutor = false` / `prosecutorTargetName = ''` props; the landing/animation `kind` stays `impostor` for the prosecutor (no new wedges); a **prosecutor detail-card branch** before the imposter branch (🔨 title, target instruction, hint with the existing `showHint`/`cleanHint` fallback, fellow-imposters line), styled `.result-prosecutor` via `var(--prosecutor)`. |
| `src/components/CardGridReveal.svelte` | Same prop additions and detail-card prosecutor branch; the flipped-card face/`kind` for the prosecutor stays `impostor` (no new decoy kind). |
| `src/components/PeekReveal.svelte` | Same prop additions and detail-card prosecutor branch; the minimal peek line for the prosecutor stays the imposter line (no new `kind`). |
| `src/screens/ResultsScreen.svelte` | When `$gameState.hasProsecutor`, a **"The prosecutor was {name} — their target was {target}"** line (from the `isProsecutor` role entry and its `targetIndex`, via `displayName`) coloured `var(--prosecutor)`, alongside the existing imposter + word reveal. |

Files that must **NOT** be modified by this build: `src/lib/settings.js`,
`src/lib/session-settings.js`, `src/lib/troll-mode.js`, `src/lib/troll-state.js`,
`src/lib/shuffle.js`, `src/lib/word-source.js`, `src/components/SpotlightReveal.svelte`,
`src/screens/SettingsScreen.svelte`, `src/screens/PassScreen.svelte`,
`src/screens/DiscussionScreen.svelte`, `src/components/Toggle.svelte`,
`src/components/Stepper.svelte`, `src/components/Modal.svelte`, `src/App.svelte`, `public/data/*`,
`src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, `index.html`.

(Note: the **fellow-imposters logic** in `RevealScreen.svelte` is **not** changed — it already
covers the prosecutor via `isImpostor:true`. `SpotlightReveal.svelte` and `DiscussionScreen.svelte`
are deliberately untouched — no prosecutor banner, and the prosecutor flares red as an imposter in
the spotlight for free.)

## Acceptance criteria

A build is "done" when **every** item below is true.

### Roles store + persistence (`roles-config.js`)

1. The persisted store exposes `prosecutorEnabled: boolean`, **off** by default, alongside the
   existing `jesterEnabled`. It uses the **same** store and key (`imposter:roles`) — **no new
   store**.
2. The value **survives a reload** via the existing guarded load/subscribe; a user who saved before
   this field existed loads with `prosecutorEnabled: false` (the `load()` defaults-merge).
3. `settings.js` is **not** modified and the Prosecutor toggle does **not** appear in Settings.

### Config (`config.js`)

4. `PROSECUTOR_MIN_PLAYERS` is exported and equals `3`. The setup screen's prosecutor logic gates
   on this constant, not a hard-coded literal.

### Roles screen + entry point (`RolesScreen.svelte` + `SetupScreen.svelte`)

5. The Roles screen shows a **second toggle labelled exactly `Prosecutor`** after the Jester, bound
   to `$rolesConfig.prosecutorEnabled`, with a role description. **No** new always-on toggles are
   added. It is **off by default**, reflects the persisted value, and writing it updates the store.
6. When `playerCount < PROSECUTOR_MIN_PLAYERS` the Prosecutor toggle is **disabled with an
   explanatory note** (reusing `Toggle`'s `disabled` prop). The Jester toggle and the static
   Crewmate/Imposter blurbs are unchanged.

### Role assignment (`game-state.js` + `SetupScreen.svelte`)

7. When the Prosecutor is on, the round is **non-troll**, and `players >= PROSECUTOR_MIN_PLAYERS`,
   the built `roles` contain **exactly one** entry with `isProsecutor === true`. That entry also
   has `isImpostor === true` (it occupies an imposter slot), and the **total number of
   `isImpostor === true` entries equals `impostorCount`** — i.e. the prosecutor is **one of** the
   imposters, **not an extra** one. `gameState.hasProsecutor === true`.
8. **Troll Mode wins:** on a troll round, `hasProsecutor` is **false**, there is **no** prosecutor
   entry (everyone is an imposter as today).
9. The prosecutor entry carries a **`targetIndex`** that is an integer index into `roles`/`names`,
   pointing at an entry where **`isImpostor === false`** (a plain crewmate **or** the Jester).
10. The `targetIndex` is **never** the prosecutor's own index and **never** the index of any
    `isImpostor === true` entry (no fellow imposter, no self). This holds across repeated rounds
    (the target is chosen from the `!isImpostor` pool **after** the shuffle).
11. The Prosecutor reads the **shared `gameState.hint`** like an imposter (its role entry has **no**
    per-role `hint`) and is **never** shown `gameState.word`.
12. **No change to the imposter-count range.** With the prosecutor on (and the Jester off) the
    range remains **`[1, players − 1]`**; with the Jester also on it remains **`[1, players − 2]`**
    — identical to today. The prosecutor does **not** narrow the range, because it occupies an
    existing imposter slot. (The existing cap already guarantees ≥ 1 non-imposter target.)
13. An auto-off guard turns the Prosecutor toggle off when `players < PROSECUTOR_MIN_PLAYERS`
    (guarded so it writes only when needed). *(Inert today because `MIN_PLAYERS = 3`; the guard
    must still exist and be correct.)*
14. `initial.hasProsecutor === false`, so `playAgain()` and `resetGame()` clear it; the next
    `startGame()` recomputes it from the persisted toggle.
15. With the Prosecutor **off**, every round is exactly as before — no `isProsecutor` entry,
    `hasProsecutor === false`, and `buildRoles` produces the same split (including the Jester case).

### Prosecutor reveal (`RevealScreen.svelte` + the three reveal components)

16. In **all reveal styles** (**Original tap**, **Envelope**, **Wheel of Fate**, **Choose a Card**,
    **Peek**), the prosecutor sees a **distinct gold reveal**: a title identifying them as the
    **PROSECUTOR**, a clear instruction to **get a specific named player voted out** (the name is
    that player's typed name, or the "Player N" fallback via `displayName`), and the **shared hint**
    (gated by the existing "Imposter hints" setting, with the same blank→error fallback as the
    imposter). The branch is checked **before** the imposter branch (the prosecutor has
    `isImpostor:true`). The prosecutor is **never** shown the word and **never** rendered as a plain
    imposter, crewmate, or jester.
17. The prosecutor's reveal colour is **gold** via `var(--prosecutor)`; in **Grayscale** mode it
    collapses to the **same** neutral gray as the other reveals (no new tell). The
    animation/landing theatre (wheel wedge, flipped card face, peek line, envelope flap) reuses the
    **imposter** appearance — **no** new wheel segments, decoy kinds, faces, or `kind` values are
    added. Crewmate / imposter / jester reveals are **unchanged**.
18. **Fellow-imposters (unchanged logic, verified):** when "Reveal fellow imposters" is on and there
    are ≥ 2 imposters, the prosecutor's reveal lists the **other** imposters by name, and the other
    imposters' reveals list the prosecutor **by name only** — **never** labelling them "prosecutor".
    With a single imposter (the lone imposter is the prosecutor) no fellow list shows.

### Results (`ResultsScreen.svelte`)

19. On the **Results** screen, when `hasProsecutor` is true, a gold line shows **both** the
    prosecutor's name **and** their target's name (e.g. "The prosecutor was {name} — their target
    was {target}"), via `displayName` (typed name or "Player N"). The prosecutor **also** appears in
    the existing imposter heading (it is an imposter) — this is intended. There is **no** voting UI
    and **no** auto-win logic — the round ends through the existing Discussion → Results flow. The
    **Spotlight** lead-in (when enabled) shows the prosecutor flaring **red** as an imposter, with
    no code change to `SpotlightReveal.svelte`.

### Look and feel + quality

20. Tap targets remain **≥ 44px**; **no horizontal scroll** at a 375px-wide viewport; the new
    toggle/reveal/results use the existing dark-theme tokens.
21. **No new dependencies** (`package.json` unchanged) and **no console errors/warnings** in dev or
    the built preview.
22. **Single source of truth:** the prosecutor toggle lives **only** in `roles-config.js`;
    `PROSECUTOR_MIN_PLAYERS` **only** in `config.js`; `hasProsecutor` is computed **once** in
    `startGame()`; the `targetIndex` is assigned **once** in `buildRoles()` and read (not
    re-derived) by every screen/style. Each new block carries a **brief explanatory comment** per
    technical-standards. New identifiers prefer the "imposter" spelling; user-facing text spells
    **"imposter(s)"**.
23. **Untouched files stay untouched** — every file in the "must NOT be modified" list, especially
    `settings.js`, `SettingsScreen.svelte`, `DiscussionScreen.svelte`, `SpotlightReveal.svelte`,
    `shuffle.js`, and `word-source.js`. The fellow-imposters logic in `RevealScreen.svelte` is not
    altered.
24. **Production build succeeds.** `npm run build` completes with no errors and no new warnings.

## What is NOT acceptance criteria (deferred / explicitly excluded)

- **In-app voting**, a "who was voted out" screen, or a "Prosecutor wins!" outcome screen — the win
  is verbal (criterion 19).
- **An in-round "a prosecutor is in play" banner** — the prosecutor is hidden (no banner).
- **More than one prosecutor**, or making crewmate/imposter optional.
- **Prosecutor-specific reveal theatre** — no new wheel wedges, card/peek decoy kinds, or Spotlight
  colours; the landing visuals reuse the imposter appearance (criterion 17).
- **Prosecutor behaviour on a troll round** — troll wins (criterion 8).
- **Changing `maxImpostors`/the imposter cap** (criterion 12), the fellow-imposters logic, the
  Jester, `shuffle.js`, `word-source.js`, the pass screen, routing, Capacitor, or the service
  worker.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder **writes** this
checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the app** and verifies.
Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. **Roles entry & persistence:** the Roles screen shows a **Prosecutor** toggle (gold `🔨`) after
   the Jester, **off** by default; flip on, **reload** → still on; below `PROSECUTOR_MIN_PLAYERS` it
   is **disabled with a note**. The Settings screen has **no** prosecutor toggle.
3. **Assignment:** Prosecutor on, ≥ 3 players → exactly **one** imposter is the Prosecutor; the
   imposter stepper range is **unchanged** from today (prosecutor doesn't reduce the max).
4. **Target legality (repeat ~10 rounds):** the named target is **always** a crewmate or the
   Jester — **never** a fellow imposter and **never** the Prosecutor.
5. **Lone imposter:** 1 imposter + Prosecutor on → that imposter is the Prosecutor; no fellow list.
6. **Fellow imposters:** "Reveal fellow imposters" on, 2+ imposters → the Prosecutor sees the others
   and the others see the Prosecutor **by name only** (no "prosecutor" label).
7. **Prosecutor reveal (all styles):** Original, Envelope, Wheel, Choose-a-Card, and Peek each show
   the **gold** Prosecutor detail with the 🔨 title, the **named target**, and the hint;
   crewmate/imposter/jester reveals unchanged.
8. **Results:** "The prosecutor was {name} — their target was {target}" in gold; the prosecutor also
   appears in the imposter list; the Spotlight lead-in flares the prosecutor **red** as an imposter.
9. **Jester + Prosecutor:** both on → both assigned; the Jester is a legal target.
10. **Troll interaction:** Prosecutor on + a forced Troll round (e.g. Guaranteed) → everyone is the
    imposter, **no** prosecutor.
11. **Grayscale:** with Grayscale on, the Prosecutor reveal is indistinguishable from the others.
    Re-check `prefers-reduced-motion` reveal paths.
12. **Regression:** Prosecutor off → behaviour identical to before. Re-check at 375px (no horizontal
    scroll, tap targets ≥ 44px).
13. Stop the dev server. Run `npm run build`: succeeds with no new errors/warnings.

If any one of criteria 1–24 fails, the build is not done.

## Open questions for the builder

- **Wording & emoji.** The exact reveal/results wording and the `🔨` emoji are the builder's call
  as long as the role reads unambiguously as the Prosecutor and the target instruction is clear
  (criteria 16, 19).
- **Gold hex.** `#e0b341` is a suggestion; any gold/amber clearly distinct from `--error` red and
  `--jester` pink is acceptable, and it **must** pin to gray in Grayscale (criterion 17).

## Next step

This spec is the contract for the build at
`02-development/workflow/03-builds/imposter-game-app/`.