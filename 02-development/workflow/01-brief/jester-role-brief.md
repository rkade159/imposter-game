# Brief — Jester Role + Roles screen + Wheel-of-Fate polish

## Source plan

[i-want-you-to-pure-swan.md](../../../../../.claude/plans/i-want-you-to-pure-swan.md)
(approved plan; this feature has no reference screenshot — it is defined by this brief and
its spec.)

## What to build

A third, **optional** role — the **Jester** — alongside the existing **crewmate** and
**imposter** roles, plus a **new "Roles" screen** to toggle it, plus three quality-of-life
improvements to the **Wheel of Fate** reveal animation.

Today every round assigns `impostorCount` imposters; everyone else is a crewmate (the
crewmate sees the real word, the imposter sees a vague hint). The reveal is rendered by one
of three animations and the round ends at a Results screen that names the imposter(s) and
the word. After this build:

- A **"Roles" button** sits in the **top-left** of the main (setup) screen, mirroring the
  existing **Settings** button in the top-right. It opens a **new "Roles" screen**.
- The **Roles screen** has a **single toggle — "Jester"** — **off by default** and
  **persisted across rounds**. (Crewmate and Imposter are shown as the always-on roster but
  are **not** toggles — only the jester is optional.) The Settings screen is **not** touched.
- When the jester is **on** and a round starts (and it is **not** a Troll round), **exactly
  one** player is the **Jester**. The jester is given the **real word**, like a crewmate,
  but is a **distinct role**: their reveal says **"YOU ARE THE JESTER"** in **light pink**
  (`🃏`), with the goal of being **voted out on purpose** by acting like the imposter.
- Because the app has **no in-app voting**, the jester's win is handled **verbally at the
  table**. The app's jobs are: assign the role, reveal it correctly in **all three**
  animations, **announce** that a jester is in play this round (a light-pink banner during
  reveals and discussion), and **reveal who the jester was** on the Results screen.
- **Player-count rules (jester on, non-troll):** needs **≥ 3 players** (1 jester + ≥ 1
  imposter + ≥ 1 crewmate); the imposter count range becomes **`[1, players − 2]`**. The
  toggle **auto-disables** if the player count drops below 3.
- **Troll Mode wins:** on a troll round everyone is an imposter — the jester is **ignored**
  that round (no jester, no banner). Confirmed: "don't do anything special."
- **Grayscale-safe:** the jester's light pink collapses to the same neutral gray as the
  other two roles, so Grayscale mode introduces no new tell.

**Wheel of Fate polish (applies to every role, not just the jester):**

- **Faster:** the spin-to-stop settle time is reduced so landing takes less time.
- **Snap-to-finish:** if the player lets go in the **last ~5%** of the settle, the wheel
  **snaps** to its final role instead of speeding back up — no need to hold again.
- **Loading bar:** a progress bar fills while holding so the player can see how long until
  the wheel stops (mirroring the Secret-Letter reveal's existing hold bar).

## Why this is being built now

1. **It's a high-variance social role** that reuses the existing role/reveal/results
   plumbing — roles are built once in `startGame()`, the reveal screen already branches per
   role across all three styles, and a persisted toggle is the same pattern as `settings.js`.
2. **The seams already exist.** A persisted store with `localStorage` load/subscribe
   (`settings.js`), an in-place overlay screen reached from setup (`SettingsScreen` via a
   `showSettings` flag), a disabled-toggle pattern (`Toggle`'s `disabled` prop, used for
   "Reveal fellow imposters"), and a colour-token system that already neutralises in
   Grayscale (`--accent` / `--error`) — the jester slots straight into all four.
3. **The Wheel changes are small and local** — they live entirely inside
   `WheelReveal.svelte` (the settle constant, the release handler, and a progress element
   copied from the envelope reveal), so bundling them here costs almost nothing.

## How the role is assigned (the core logic)

Role objects in `gameState.roles[]` are `{ isImpostor }` today (plus `{ isImpostor, hint }`
on a Troll round). The jester is a new shape:

```js
{ isImpostor: false, isJester: true }   // reads gameState.word like a crewmate
```

`startGame()` gains a `jesterEnabled` flag and computes `hasJester = jesterEnabled &&
!isTroll`. `buildRoles(playerCount, impostorCount, hasJester)` builds `impostorCount`
imposters, **one** jester when `hasJester`, the rest crewmates, then `shuffle()`s — exactly
the existing pattern, with one extra entry type. `gameState` carries a new `hasJester`
boolean that the banner, the wheel wedges, and the results reveal all read.

The **persisted toggle** lives in a **new store separate from `settings.js`** — Roles is
its own concept, not a setting — but uses the identical `writable` + guarded
`localStorage` load/subscribe pattern (key `imposter:roles`, default
`{ jesterEnabled: false }`).

## Scope

**In scope:**

- **New persisted store** — `src/lib/roles-config.js`: a `writable`
  `{ jesterEnabled: false }` with the same guarded `localStorage` load/subscribe pattern as
  `settings.js` (key `imposter:roles`). Survives reloads.
- **New constant** — [src/lib/config.js](../03-builds/imposter-game-app/src/lib/config.js):
  `export const JESTER_MIN_PLAYERS = 3;`. The min-player guard gates on this, not a literal.
- **New colour token** — [src/app.css](../03-builds/imposter-game-app/src/app.css): add
  `--jester: #f0a8d8;` to `:root`, and `--jester: #a8a8a8;` to `:root.grayscale` (so the
  jester neutralises to the same gray as `--accent` / `--error`, the existing anti-leak fix).
- **New screen** — `src/screens/RolesScreen.svelte`: modelled on `SettingsScreen.svelte`
  (same `.screen` card, `onClose` prop, Back button). One `<Toggle>` bound to
  `$rolesConfig.jesterEnabled` (label **"Jester"**, light-pink `🃏`, a role description),
  **disabled with a note** when `playerCount < JESTER_MIN_PLAYERS` (reusing `Toggle`'s
  `disabled` prop, like "Reveal fellow imposters"). Static, non-toggle blurbs for Crewmate
  and Imposter so it reads as the roster. Accepts a `playerCount` prop.
- **Role assignment** — [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  `buildRoles` gains a `hasJester` arg (adds one `{ isImpostor:false, isJester:true }`
  entry); `startGame` gains `jesterEnabled`, computes `hasJester = jesterEnabled && !isTroll`,
  passes it to `buildRoles`, and stores `hasJester` on the state. `initial` gains
  `hasJester: false`. The Troll path is unchanged.
- **Main screen** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte):
  a top **Roles** button (top-left) opening `RolesScreen` via a `showRoles` flag (same
  in-place-overlay pattern as Settings); the existing Settings button moves to share a
  header row (`space-between`). A `jesterActive` derived value
  (`$rolesConfig.jesterEnabled && players >= JESTER_MIN_PLAYERS`); `maxImpostors` becomes
  `players − (jesterActive ? 2 : 1)`; an auto-off guard
  (`if (players < JESTER_MIN_PLAYERS && $rolesConfig.jesterEnabled) → false`); and
  `jesterEnabled: jesterActive` passed into `startGame()`.
- **Reveal** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte):
  a `$: isJester` derivation; a **jester branch** (checked **before** imposter/crewmate,
  since the jester has `isImpostor:false`) in **both** the Classic card and the Envelope
  note — **"🃏 YOU ARE THE JESTER!"**, the real word, and a "get voted out to win"
  sub-line — styled with `.card-jester` / `.note-jester` using `var(--jester)`. `isJester`
  and `hasJester` are passed to `<WheelReveal>`. A light-pink **banner** shows at the top
  when `$gameState.hasJester`.
- **Wheel of Fate** — [src/components/WheelReveal.svelte](../03-builds/imposter-game-app/src/components/WheelReveal.svelte):
  new `isJester` / `hasJester` props and a derived `kind`
  (`'jester' | 'impostor' | 'crewmate'`); the segment set includes **light-pink jester
  wedges** when `hasJester`; `chooseRestRotation()` matches `w.kind === kind`; a jester
  result-card branch (`.result-jester`, `.seg-jester`). **Plus the three polish items:**
  reduce `SETTLE_MS`; snap to `target` in `releaseHold()` when past ~95% of the settle; a
  `settleProgress` (0→1) tracked in the frame loop driving a progress bar copied from the
  envelope reveal (hidden once landed; honours `prefers-reduced-motion`).
- **Discussion** — [src/screens/DiscussionScreen.svelte](../03-builds/imposter-game-app/src/screens/DiscussionScreen.svelte):
  the same light-pink banner when `$gameState.hasJester`.
- **Results** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte):
  when `$gameState.hasJester`, a **"The jester was {name}"** line in light pink (derived
  from the `isJester` role entry), alongside the existing imposter + word reveal.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain JS,
  **no new dependencies**, a brief comment on each new block, user-facing spelling
  **"imposter(s)"**, tap targets ≥ 44px, no horizontal scroll at 375px.

**Out of scope (do NOT build here):**

- **In-app voting / a "who got voted out" screen / a "Jester wins!" outcome screen.** The
  win is verbal; the app only reveals who the jester was (decision: verbal handling).
- **More than one jester**, or making **crewmate/imposter** optional toggles — only the
  jester is optional, max one per round.
- **Jester-specific behaviour on a Troll round** — troll wins; the jester is simply absent
  that round.
- **A redesign of the reveal animations** beyond adding the jester branch and the three
  Wheel polish items — themed art is a later `03-design` concern.
- **Lowering `MIN_PLAYERS`** or any change to normal-round assignment, `shuffle.js`,
  `word-source.js`, the pass screen, routing, Capacitor, or the service worker.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `src/lib/roles-config.js` | **New.** Persisted `{ jesterEnabled }` store (key `imposter:roles`). |
| `src/lib/config.js` | Add `JESTER_MIN_PLAYERS = 3`. |
| `src/app.css` | Add `--jester` to `:root` and `:root.grayscale`. |
| `src/lib/game-state.js` | `buildRoles` gains `hasJester`; `startGame` gains `jesterEnabled` + stores `hasJester`; `initial.hasJester`. |
| `src/screens/RolesScreen.svelte` | **New.** Roles roster + the Jester toggle. |
| `src/screens/SetupScreen.svelte` | Roles button + overlay; `maxImpostors` reserves the jester slot; auto-off guard; pass `jesterEnabled`. |
| `src/screens/RevealScreen.svelte` | Jester branch in Classic + Envelope; banner; pass `isJester`/`hasJester` to the wheel. |
| `src/components/WheelReveal.svelte` | Jester wedges + result branch; faster settle; snap-on-late-release; loading bar. |
| `src/screens/DiscussionScreen.svelte` | Jester banner. |
| `src/screens/ResultsScreen.svelte` | "The jester was {name}" reveal. |

## Constraints worth highlighting

- **At most one jester per round**, and **only** when the toggle is on **and** it's a
  non-troll round with **≥ 3 players**.
- **The jester reads the real word** (`gameState.word`) like a crewmate — it is **not** an
  imposter (`isImpostor: false`) and must **not** receive a hint. But its reveal branch must
  be checked **before** the crewmate branch or it will render as a crewmate.
- **Troll wins.** `hasJester` is forced **false** on a troll round; no banner, no jester.
- **Grayscale parity.** The jester uses `var(--jester)`, which is pinned to the same neutral
  gray as the other roles in Grayscale mode — no new tell.
- **Roles is not a Setting.** The toggle lives in its **own** store (`roles-config.js`) and
  its **own** screen; the Settings screen and `settings.js` are untouched.
- **Min-player guard is to spec but inert today.** `MIN_PLAYERS = 3`, so the player count
  never actually reaches 2 — the auto-off guard is future-proofing, gated on
  `JESTER_MIN_PLAYERS` so the relationship is explicit.
- **Wheel polish is role-agnostic** — faster settle, snap-on-late-release, and the loading
  bar apply to crewmate/imposter/jester alike, and must keep the reduced-motion path working.
- **No new dependencies** — pure Svelte + JS. Verify at 375px, tap targets ≥ 44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. **Roles entry & persistence:** main screen shows a **Roles** button (top-left) and
   **Settings** (top-right); Roles opens, **Jester** toggle is **off** by default; flip it,
   **reload** → still on; Back returns to setup.
2. **Assignment, 3 players:** Jester on, 3 players → roles are exactly 1 crewmate + 1
   imposter + 1 jester; the imposter stepper max is **1**.
3. **Assignment, 4 players:** Jester on, 4 players → imposter stepper allows **1–2**; every
   start yields exactly one jester and ≥ 1 crewmate.
4. **Jester reveal (all three styles):** the jester sees **"🃏 YOU ARE THE JESTER!"**, the
   **real word**, and the get-voted-out objective, in **light pink**; crewmate/imposter
   reveals are unchanged.
5. **Banner & results:** on a jester round the **"A JESTER is among you"** banner shows
   during reveals and discussion; Results shows **"The jester was {name}"** in light pink
   plus the imposter(s) and word.
6. **Grayscale:** with Grayscale on, the jester reveal is indistinguishable from the others.
7. **Troll interaction:** Jester on + a forced Troll round → everyone is the imposter, **no**
   jester and **no** banner that round.
8. **Wheel polish:** spin-to-stop is noticeably faster; releasing in the last ~5% **snaps**
   to the role instead of re-spinning; a **loading bar** fills while holding and disappears
   once landed; on a jester round the wheel can land on a **light-pink jester wedge**.
9. **Auto-off guard:** (inert today, but) the guard turns the toggle off when the player
   count is below `JESTER_MIN_PLAYERS` — verify by temporarily lowering `MIN_PLAYERS`.
10. **Regression + build:** Jester off behaves exactly as before; `npm run build` succeeds;
    no console errors; no horizontal scroll at 375px; tap targets ≥ 44px.

## Next step

This brief feeds
[02-development/workflow/02-specs/jester-role-spec.md](../02-specs/jester-role-spec.md),
which converts it into an acceptance-criteria contract for the build.
