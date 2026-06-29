# Brief — Prosecutor Role

## Source plan

[prosecutor-role-plan-final.md](../../../01-plan/plans/prosecutor-role-plan-final.md)
(approved plan; this feature has no reference screenshot — it is defined by this brief and its
spec.)

## What to build

A second **optional** role — the **Prosecutor** — alongside the existing **crewmate**,
**imposter**, and optional **Jester** roles. The Prosecutor is an *imposter-type* with a secret
assassination mission, toggled on the existing **Roles screen** next to the Jester.

Today every round assigns `impostorCount` imposters (each sees a vague hint instead of the word);
everyone else is a crewmate, with at most one optional Jester (a crewmate who wins by being voted
out). After this build:

- The **Roles screen** gains a **second toggle — "Prosecutor"** — **off by default** and
  **persisted across rounds**, sitting after the Jester. (Crewmate and Imposter remain the
  always-on roster; only the Jester and now the Prosecutor are optional.)
- When the Prosecutor is **on** and a round starts (and it is **not** a Troll round), **one of the
  round's imposters becomes the Prosecutor** — it **occupies an existing imposter slot**, it does
  **not** add an imposter. If `impostorCount` is 1, that lone imposter is the Prosecutor.
- The Prosecutor is an imposter: it does **not** see the word and gets the **same shared hint** the
  other imposters see. Its reveal says **"🔨 YOU ARE THE PROSECUTOR!"** in **gold**, and tells them
  **one specific player to get voted out** ("Get {name} voted out to win the round").
- **Target constraint (hard):** the assigned target is **always a crewmate-type** — a plain
  crewmate or the Jester (the Jester counts as a crewmate). The target is **never** a fellow
  imposter / imposter-role, and **never** the Prosecutor themselves.
- **Jester crossover:** the Prosecutor is **not** told what role the target is. If the target
  happens to be the Jester and the table votes them out, **both win** — this is emergent, no
  special code.
- Because the app has **no in-app voting**, the win is handled **verbally at the table**, exactly
  like the Jester. The app's jobs: assign the role, reveal it correctly (with the target) in **all
  reveal styles**, and **reveal who the Prosecutor was and who their target was** on the Results
  screen.
- **No in-round banner.** Unlike the announced Jester, the Prosecutor is a **hidden** role — there
  is **no** "a prosecutor is in play" banner during reveals/discussion. It is disclosed only at
  Results.
- **Team visibility (free):** since the Prosecutor's role object is `isImpostor: true`, the existing
  **"Reveal fellow imposters"** feature already shows the Prosecutor the other imposters, and lists
  the Prosecutor among other imposters' fellows — **by name only, never the role**, so it never
  leaks who the Prosecutor is.
- **Player-count rule (prosecutor on, non-troll):** needs **≥ 3 players**
  (`PROSECUTOR_MIN_PLAYERS = 3`). The toggle **auto-disables** below that. **The imposter-count cap
  is unchanged** (see below).
- **Troll Mode wins:** on a troll round everyone is an imposter — the Prosecutor is **ignored**
  that round.
- **Grayscale-safe:** the Prosecutor's gold collapses to the same neutral gray as the other roles.

## Why this is being built now

1. **It reuses the Jester's plumbing almost entirely** — a persisted toggle in `roles-config.js`,
   a derived `hasProsecutor` computed once in `startGame()`, a role branch checked before the
   imposter/crewmate split across the reveal styles, and a Results reveal line. The seams already
   exist.
2. **Two key properties fall out for free** because the Prosecutor is `isImpostor: true`: the
   "Reveal fellow imposters" feature and the Spotlight end-reveal both treat it correctly with **no
   change** — and the fellow-list shows names only, so the specific role never leaks.
3. **No setup-math change is needed.** Because the Prosecutor *occupies* an existing imposter slot
   (rather than adding one), the current imposter cap already guarantees ≥ 1 crewmate-type target.

## How the role is assigned (the core logic)

Role objects in `gameState.roles[]` are `{ isImpostor }` (plus `{ isImpostor, isJester }` for the
Jester, or `{ isImpostor, hint }` on a Troll round). The Prosecutor is a new shape:

```js
{ isImpostor: true, isProsecutor: true, targetIndex: <int> }   // reads the shared gameState.hint
```

`startGame()` gains a `prosecutorEnabled` flag and computes
`hasProsecutor = prosecutorEnabled && !isTroll`. `buildRoles(playerCount, impostorCount, hasJester,
hasProsecutor)` marks **one** of the `impostorCount` imposter entries as the prosecutor, then —
**after** the existing `shuffle()` — picks the prosecutor's `targetIndex` at random from the
indices where `!isImpostor` (crewmates + the Jester). `gameState` carries a new `hasProsecutor`
boolean that the Results reveal reads.

The **persisted toggle** is a new field `prosecutorEnabled: false` on the **existing**
`roles-config.js` store (key `imposter:roles`) — no new store.

## Scope

**In scope:**

- **Roles store** — [src/lib/roles-config.js](../03-builds/imposter-game-app/src/lib/roles-config.js):
  add `prosecutorEnabled: false` to `defaults` (the existing `load()` merge picks it up for users
  who saved before it existed). No new store, no key change.
- **New constant** — [src/lib/config.js](../03-builds/imposter-game-app/src/lib/config.js):
  `export const PROSECUTOR_MIN_PLAYERS = 3;`. The min-player guard gates on this, not a literal.
- **New colour token** — [src/app.css](../03-builds/imposter-game-app/src/app.css): add
  `--prosecutor: #e0b341;` (gold) to `:root`, and `--prosecutor: #a8a8a8;` to `:root.grayscale`
  (so it neutralises to the same gray as the other roles — the existing anti-leak fix).
- **Role assignment** — [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  `buildRoles` gains a `hasProsecutor` arg (marks one imposter `isProsecutor:true`; after the
  shuffle, assigns `targetIndex` from the non-imposter pool; defensive fallback drops the flag if
  the pool is empty). `startGame` gains `prosecutorEnabled`, computes
  `hasProsecutor = prosecutorEnabled && !isTroll`, passes it to `buildRoles`, and stores
  `hasProsecutor`. `initial` gains `hasProsecutor: false`. Troll path unchanged.
- **Roles screen** — [src/screens/RolesScreen.svelte](../03-builds/imposter-game-app/src/screens/RolesScreen.svelte):
  a second `<Toggle>` after the Jester, bound to `$rolesConfig.prosecutorEnabled` (label
  **"Prosecutor"**, gold `🔨`, a role description), **disabled with a note** when
  `playerCount < PROSECUTOR_MIN_PLAYERS`. A `.role-prosecutor { color: var(--prosecutor); }` style.
- **Setup screen** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  a `prosecutorActive` derived value
  (`$rolesConfig.prosecutorEnabled && players >= PROSECUTOR_MIN_PLAYERS`); an auto-off guard
  mirroring the Jester's; and `prosecutorEnabled: prosecutorActive` passed into `startGame()`.
  **`maxImpostors` is NOT changed.**
- **Reveal** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  a `$: isProsecutor` derivation and a `prosecutorTargetName` (via `displayName` on the role's
  `targetIndex`); a **prosecutor branch** (checked **before** the imposter branch, since the
  prosecutor has `isImpostor:true`) in **both** the Original card and the Envelope note — **"🔨 YOU
  ARE THE PROSECUTOR!"**, the **target instruction**, the hint (gated by `showHint`, same
  blank→error fallback as the imposter), and the fellow-imposters line when present — styled with
  `var(--prosecutor)`. `isProsecutor` and `prosecutorTargetName` are passed to the three reveal
  components.
- **Reveal styles** — `WheelReveal.svelte`, `CardGridReveal.svelte`, `PeekReveal.svelte`: new
  `isProsecutor` / `prosecutorTargetName` props; the landing/animation **`kind` stays `impostor`**
  for the prosecutor (reuse imposter theatre — no new wheel segments / decoy kinds / faces); a
  **prosecutor detail-card branch** (gold `.result-prosecutor`) before the imposter branch, with
  the 🔨 title, target instruction, hint, and fellow-imposters line.
- **Results** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte):
  when `$gameState.hasProsecutor`, a gold **"The prosecutor was {name} — their target was
  {target}"** line (from the `isProsecutor` role entry and its `targetIndex`, via `displayName`),
  alongside the existing imposter + word reveal. The prosecutor also appears in the imposter
  heading (it is an imposter) — intended.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS, **no new
  dependencies**, a brief comment on each new block, user-facing spelling **"imposter(s)"**, new
  identifiers prefer the "imposter" spelling, tap targets ≥ 44px, no horizontal scroll at 375px.

**Out of scope (do NOT build here):**

- **In-app voting / a "who got voted out" screen / a "Prosecutor wins!" outcome screen.** The win
  is verbal; the app only reveals who the prosecutor was and their target.
- **An in-round "a prosecutor is in play" banner** — the Prosecutor is hidden (decision: no
  banner).
- **Prosecutor-specific reveal theatre** — no new wheel segments, card-grid/peek decoy kinds, or
  Spotlight colours; the landing visuals reuse the imposter appearance. Only the detail card is
  gold.
- **Changing `maxImpostors` / the imposter cap**, the fellow-imposters logic, `SpotlightReveal`,
  Troll Mode, the Jester, `shuffle.js`, `word-source.js`, routing, the pass screen, Capacitor, or
  the service worker.
- **More than one prosecutor per round.**

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/roles-config.js` | Add `prosecutorEnabled: false` to defaults. |
| `src/lib/config.js` | Add `PROSECUTOR_MIN_PLAYERS = 3`. |
| `src/app.css` | Add `--prosecutor` to `:root` and `:root.grayscale`. |
| `src/lib/game-state.js` | `buildRoles` gains `hasProsecutor` + assigns `targetIndex` post-shuffle; `startGame` gains `prosecutorEnabled` + stores `hasProsecutor`; `initial.hasProsecutor`. |
| `src/screens/RolesScreen.svelte` | Prosecutor toggle row. |
| `src/screens/SetupScreen.svelte` | `prosecutorActive` + auto-off guard; pass `prosecutorEnabled`. |
| `src/screens/RevealScreen.svelte` | Prosecutor branch (Original + Envelope); pass `isProsecutor`/`prosecutorTargetName` to the three reveal components. |
| `src/components/WheelReveal.svelte` | Prosecutor detail-card branch; landing kind stays imposter. |
| `src/components/CardGridReveal.svelte` | Prosecutor detail-card branch; landing kind stays imposter. |
| `src/components/PeekReveal.svelte` | Prosecutor detail-card branch; peek line stays imposter. |
| `src/screens/ResultsScreen.svelte` | "The prosecutor was {name} — their target was {target}" reveal. |

## Constraints worth highlighting

- **The Prosecutor occupies an existing imposter slot** — it does NOT add an imposter. Exactly one
  per round, only when the toggle is on AND it's a non-troll round with ≥ 3 players.
- **The target is always a crewmate-type** (crewmate or Jester), never a fellow imposter, never
  self. Picked **after** the shuffle from the `!isImpostor` indices.
- **The Prosecutor reads the shared hint** (`gameState.hint`) like an imposter — it has no per-role
  hint of its own and is **never** shown the word. Its reveal branch must be checked **before** the
  imposter branch (it has `isImpostor:true`) or it renders as a plain imposter.
- **Troll wins.** `hasProsecutor` is forced **false** on a troll round.
- **No imposter-cap change.** The current cap already guarantees a valid target; do not alter
  `maxImpostors`.
- **Fellow-imposters & Spotlight are untouched** — they already handle `isImpostor:true` correctly,
  and the fellow-list shows names only (no role leak).
- **No banner**, unlike the Jester.
- **Grayscale parity.** The Prosecutor uses `var(--prosecutor)`, pinned to gray in Grayscale.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥ 44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Roles entry & persistence:** the Roles screen shows a **Prosecutor** toggle (gold `🔨`) after
   the Jester, **off** by default; flip it, **reload** → still on; disabled with a note below
   `PROSECUTOR_MIN_PLAYERS`.
2. **Assignment:** Prosecutor on, ≥ 3 players → exactly **one** imposter reveals as the
   **Prosecutor**; total imposter count is unchanged (the prosecutor is one of them).
3. **Target legality (repeat many rounds):** the named target is **always** a crewmate or the
   Jester — **never** a fellow imposter and **never** the Prosecutor.
4. **Lone imposter:** 1 imposter + Prosecutor on → that imposter is the Prosecutor; no fellow list.
5. **Fellow imposters:** with "Reveal fellow imposters" on and 2+ imposters, the Prosecutor sees
   the other imposters, and the other imposters see the Prosecutor **by name only** (no "prosecutor"
   label).
6. **Reveal across all styles:** envelope, original, wheel, card-grid, and peek all show the
   Prosecutor detail card (🔨 title, target, hint) in **gold**; crewmate/imposter/jester reveals
   unchanged.
7. **Results:** "The prosecutor was {name} — their target was {target}" in gold; the prosecutor also
   appears in the imposter list; the Spotlight lead-in flares the Prosecutor **red** as an imposter.
8. **Jester + Prosecutor:** both on → both roles assigned; the Jester can be the target; if voted
   out, both win (verbally).
9. **Troll interaction:** Prosecutor on + a forced Troll round → everyone is the imposter, **no**
   prosecutor, no errors.
10. **Grayscale & reduced motion:** the Prosecutor gold collapses to gray; reduced-motion reveal
    paths behave.
11. **Regression + build:** Prosecutor off → behaviour identical to before; `npm run build`
    succeeds; no console errors; no horizontal scroll at 375px; tap targets ≥ 44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/prosecutor-role-spec.md](../02-specs/prosecutor-role-spec.md),
which converts it into an acceptance-criteria contract for the build.