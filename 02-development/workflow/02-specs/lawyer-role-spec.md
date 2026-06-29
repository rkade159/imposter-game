# Spec — Lawyer Role

## Source brief

[02-development/workflow/01-brief/lawyer-role-brief.md](../01-brief/lawyer-role-brief.md)

> ⚠️ **The Lawyer appears in no reference screenshot** — it is defined by this spec alone. Where it touches the roles/reveal/results screens, this spec wins. (If you open a screenshot for layout cues, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first — it overrides the images.)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a **contract, not a blueprint**. It states WHAT must be true once the feature is built — observable behaviour and the public surfaces other code depends on. It does NOT dictate exact DOM markup, class names, CSS values, or copy wording; the builder makes those calls within the constraints below.

A handful of things **are** mandated because they are the explicit goals of this feature: (a) the Lawyer is an **optional toggle**, persisted in `rolesConfig`, gated at **3 players** (criteria 1–4, 8–9); (b) when active on a non-troll round, **exactly one plain crewmate** is the Lawyer with **one client** drawn at random from **all imposter-aligned players**, stored as `isLawyer` + **`clientIndex`** (criteria 10–16); (c) the Lawyer's reveal is the **crewmate card + an appended note** that names the client and **never** says "imposter", in **all** reveal styles, with **no in-round banner** (criteria 17–23); (d) Results names the Lawyer and client and computes **no winner** (criteria 24–26); (e) **Troll Mode suppresses** the Lawyer (criterion 12); (f) `App.svelte` / routing is **not** modified (criterion 31). Everything else is the builder's call.

## The Lawyer in one paragraph

The Lawyer is mechanically a **crewmate** (sees the secret word, occupies an existing crewmate slot — adds no player) with a **flipped win condition**: they are secretly assigned a **client** and win *with the imposters* if the client is **not** voted out. The client is always imposter-aligned (a plain imposter **or** the Prosecutor); the Lawyer is **never told the client is an imposter**. There is no voting screen — the app assigns the role, reveals it privately, and names it at the end; it computes no winner. The Lawyer is the **mirror of the existing Prosecutor** and is built into the same seams with the assignment pool inverted; the one structural difference is that the Lawyer's reveal is an **addendum to the crewmate card**, not a separate reveal branch.

## What must exist (deliverables)

The build extends the existing scaffold at:

```
02-development/workflow/03-builds/imposter-game-app/
```

Files this build modifies (all already exist):

| File | State after build |
|---|---|
| `src/lib/config.js` | Exports `LAWYER_MIN_PLAYERS = 3` with a comment mirroring `PROSECUTOR_MIN_PLAYERS`. |
| `src/lib/roles-config.js` | `defaults` gains `lawyerEnabled: false` with a doc comment. Storage mechanics unchanged. |
| `src/lib/game-state.js` | `initial` gains `hasLawyer: false`; the `roles[i]` schema comment mentions `isLawyer` + `clientIndex`. `buildRoles()` accepts `hasLawyer` and assigns the Lawyer + client after the shuffle. `startGame()` accepts `lawyerEnabled`, derives/stores `hasLawyer`, and passes it through. |
| `src/screens/RolesScreen.svelte` | Renders a ⚖️ Lawyer toggle bound to `$rolesConfig.lawyerEnabled`, disabled below `LAWYER_MIN_PLAYERS`, styled via `--lawyer`. |
| `src/screens/SetupScreen.svelte` | Computes `lawyerActive`, auto-offs the toggle below the minimum, and passes `lawyerEnabled: lawyerActive` to `startGame()`. `maxImpostors` unchanged. |
| `src/screens/RevealScreen.svelte` | Derives `isLawyer` + `lawyerClientName`; appends a Lawyer note to the crewmate rendering in the Envelope and Original styles; passes `isLawyer` + `lawyerClientName` to the three reveal components. |
| `src/components/WheelReveal.svelte` | Accepts `isLawyer` / `lawyerClientName` props; appends the Lawyer note in its crewmate detail card. |
| `src/components/CardGridReveal.svelte` | As above. |
| `src/components/PeekReveal.svelte` | As above. |
| `src/screens/ResultsScreen.svelte` | Derives the Lawyer + client and renders a results line; styled via `--lawyer`. Spotlight lead-in unchanged. |
| `src/app.css` | Defines `--lawyer` in `:root` and pins it to the neutral gray in `:root.grayscale`. |

Files that must **NOT** be modified by this build: `src/App.svelte` (routing already wired), `src/lib/shuffle.js`, `src/lib/settings.js`, `src/lib/word-source.js`, `src/lib/troll-mode.js`, `src/lib/troll-state.js`, `src/components/Stepper.svelte`, `src/components/Toggle.svelte`, `src/components/Modal.svelte`, `src/components/SpotlightReveal.svelte`, `src/screens/PassScreen.svelte`, `src/screens/DiscussionScreen.svelte`, `src/screens/SettingsScreen.svelte`, `src/screens/CustomListBuilder.svelte`, `src/service-worker.js`, `src/main.js`, `vite.config.js`, `package.json`, and all `public/data/*.json`.

## Acceptance criteria

A build is "done" when **every** item below is true. Verify each before considering the work complete.

### Config & toggle persistence

1. `src/lib/config.js` exports `LAWYER_MIN_PLAYERS = 3`.
2. `src/lib/roles-config.js` `defaults` includes `lawyerEnabled: false`; it is persisted to and loaded from the existing `imposter:roles` localStorage key via the existing merge, so a user who saved before this release loads `lawyerEnabled: false` rather than `undefined`.
3. The `rolesConfig` public surface is otherwise unchanged (same store export, same storage key, same guarded subscribe).
4. No setting related to the Lawyer is added to `settings.js` — the toggle lives in `rolesConfig` only.

### Roles screen (`src/screens/RolesScreen.svelte`)

5. A new optional-role row renders for the **Lawyer** (⚖️), parallel to the Jester and Prosecutor rows, with its name styled by a `--lawyer`-backed class and a `Toggle` bound to `$rolesConfig.lawyerEnabled`.
6. The toggle is **disabled with an explanatory note** when `playerCount < LAWYER_MIN_PLAYERS` and enabled otherwise, mirroring the Prosecutor's `prosecutorDisabled` pattern; the disabled copy communicates the "(Needs 3+ players.)" condition.
7. The Crewmate/Imposter static rows and the existing Jester/Prosecutor rows are unchanged.

### Setup screen (`src/screens/SetupScreen.svelte`)

8. A reactive `lawyerActive` is true iff `$rolesConfig.lawyerEnabled` **and** the live `players` count `>= LAWYER_MIN_PLAYERS`.
9. An auto-off guard mirrors the prosecutor's: if `players` drops below `LAWYER_MIN_PLAYERS` while `lawyerEnabled` is on, it sets `lawyerEnabled = false` (guarded so it only writes when needed).
10. `start()` passes `lawyerEnabled: lawyerActive` to `startGame()`. The Lawyer does **NOT** change `maxImpostors` (it occupies a crewmate slot, like the Prosecutor) — the imposter-count cap is unchanged. No secret role info is rendered on Setup.

### Assignment (`src/lib/game-state.js`)

11. `initial` includes `hasLawyer: false`; the `roles[i]` schema comment documents the optional `isLawyer` flag and `clientIndex`.
12. `startGame({ …, lawyerEnabled = false })` computes `hasLawyer = lawyerEnabled && !isTroll`, stores `hasLawyer` in the committed state, and passes `hasLawyer` into `buildRoles(...)`. On a **Troll Mode** round `hasLawyer` is `false` and no Lawyer is assigned.
13. `buildRoles(playerCount, impostorCount, hasJester, hasProsecutor, hasLawyer)` assigns the Lawyer **after** the Fisher-Yates shuffle **and after** the existing Prosecutor-target block, so positions are final.
14. When `hasLawyer` is true, the Lawyer is chosen from `lawyerPool` = players with `isImpostor === false && isJester` **not** true (plain crewmates only — **never** the Jester, **never** an imposter). Exactly **one** player gets `isLawyer = true`.
15. The Lawyer's `clientIndex` is a uniformly-random member of `clientPool` = players with `isImpostor === true`. This pool includes the Prosecutor when present (so "any imposter-aligned" holds), and never points at the Lawyer themselves (the Lawyer is not an imposter). At most one client is assigned.
16. **Defensive, never throws:** if `lawyerPool` or `clientPool` is empty, the build assigns **no** Lawyer (no `isLawyer`, no `clientIndex`) and does not error. (In practice the imposter cap always leaves ≥1 plain crewmate and ≥1 imposter, so a Lawyer + client are assignable for every valid setup, including the 3-player / 2-imposter edge.) Assignment is independent of the Prosecutor block — both may run in the same round on different players' role objects, with `targetIndex` (prosecutor) and `clientIndex` (lawyer) never colliding on one object.

### Reveal — all styles (`RevealScreen.svelte` + `WheelReveal` / `CardGridReveal` / `PeekReveal`)

17. `RevealScreen.svelte` derives `isLawyer = role?.isLawyer === true` and `lawyerClientName` = the `displayName` for `role.clientIndex` when `isLawyer` and `clientIndex` is a number, else `''`.
18. The Lawyer's reveal is the **crewmate rendering** (it still shows **the secret word**, like any crewmate) **plus an appended Lawyer note** that names the client (`lawyerClientName`) and states the goal (keep them from being voted out). The note is added inside the existing crewmate branch — **no** new top-level reveal branch is introduced and the existing role-check order (jester → prosecutor → imposter → crewmate) is unchanged.
19. The Lawyer note appears in **all five** reveal experiences: Original (tap), Envelope (press-and-hold), Wheel, Card grid, and Peek. The three child components accept `isLawyer` (default `false`) and `lawyerClientName` (default `''`) props, passed from `RevealScreen.svelte`, and render the note in their crewmate detail card.
20. A **non-Lawyer crewmate's** reveal is unchanged in every style — the word and existing sub-line only, with **no** Lawyer note.
21. The Lawyer note **never states or implies the client is an imposter**. It names the client and the protect-them goal (a "you win if they survive" framing is permitted; "your client is an imposter / on the imposters' team" is **not**).
22. The Lawyer note stays **behind the same per-style reveal gesture** as the rest of the card (tap / hold / spin / pick / peek) — nothing about the Lawyer appears before the current player completes their reveal.
23. **No in-round banner** is shown for the Lawyer (the `🃏 A JESTER is among you` banner remains Jester-only). `hasLawyer` drives nothing visible before the Lawyer's own private reveal.

### Results (`src/screens/ResultsScreen.svelte`)

24. When `$gameState.hasLawyer` and a Lawyer exists in `roles`, a results line names the Lawyer and their client, e.g. **"The lawyer was X — their client was Y"**, using `displayName` for both (matching the prosecutor/jester lines' style) and styled via a `--lawyer`-backed class.
25. The line is **absent** when no Lawyer was in play (`hasLawyer` false or no `isLawyer` role found). The existing imposter / word / hint / jester / prosecutor lines and the **Play again** button are unchanged.
26. **No winner is computed or displayed** for the Lawyer — Results only names the Lawyer and client. The **Spotlight** lead-in (imposter hunt) is **not** modified and continues to key off imposter/jester flags only.

### Colour token (`src/app.css`)

27. `:root` defines a `--lawyer` colour distinct from `--accent` (indigo), `--error` (red), `--jester` (pink), and `--prosecutor` (gold) — e.g. teal `#2dd4bf`.
28. `:root.grayscale` **pins `--lawyer` to the same neutral gray** (`#a8a8a8`) used for the other role tokens, so the Lawyer is no colour tell in Grayscale mode. No existing token value changes.

### Spelling (whole app)

29. All new or changed **user-facing text reads "imposter"** (never "impostor"). New identifiers (`isLawyer`, `clientIndex`, `lawyerEnabled`, `hasLawyer`, `lawyerClientName`, `LAWYER_MIN_PLAYERS`) are spelling-neutral; existing `isImpostor`/`impostorCount` keep their current spelling.

### Look and feel (baseline only — design comes later)

30. The new UI uses **existing layout patterns** (the `.role-toggle` row, the reveal card/note structure, the results line) and the `--lawyer` token for colour; no new colour values beyond `--lawyer`. Touch targets stay ≥44px and there is **no horizontal scroll** at a 375px-wide viewport.

### Routing & code quality

31. **`App.svelte` is not modified.** No new screen or route is added; the Lawyer rides the existing `setup → reveal ⇄ pass → discussion → results` flow.
32. **No new dependencies** — `package.json` is unchanged. Each new code block carries a **brief explanatory comment** per [technical-standards.md](../../references/technical-standards.md) (the assignment block's pool logic, the reveal derivation/note, the results derivation).
33. **Untouched files stay untouched** — every file in the "must NOT be modified" list above, including `App.svelte`.
34. **Production build succeeds.** `npm run build` completes with no errors and no new warnings; no console errors/warnings during dev.

## What is NOT acceptance criteria (deferred)

- **Win/score computation or a voting screen** — the app names roles only; the Lawyer's win is resolved verbally.
- **More than one Lawyer**, a **Lawyer who chooses their own client**, or **telling the Lawyer the client is an imposter**.
- **An in-round Lawyer banner.**
- **Reusing `targetIndex` for the client** (use `clientIndex`).
- **Renaming `isImpostor` / `impostorCount`.**
- **Visual/design polish** beyond the functional `--lawyer` token — design comes via `03-design/` later.

## Verification

Per [technical-standards.md](../../references/technical-standards.md), the builder **writes** this checklist but does **NOT** run `npm run dev` to walk it — **Rehaan runs the app** and verifies. Sequence:

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`. No console errors.
2. Open **Roles**: a ⚖️ **Lawyer** toggle is present. Turn it on, reload the page → it stays on (persisted). Set players below 3 (where reachable) → the toggle is disabled with the "(Needs 3+ players.)" note.
3. Start a **5-player / 1-imposter** round with Lawyer on. Walk the reveals: exactly **one** player sees the **crewmate word card + a Lawyer note** naming a client; that client matches the imposter. **No** "a Lawyer is among you" banner appears, and a non-Lawyer crewmate sees the word with no note.
4. Repeat for **each reveal style** (Settings → reveal style): Original, Envelope, Wheel, Card grid, Peek — the Lawyer note appears in all five, only after completing that style's reveal gesture.
5. Turn on **Prosecutor + Lawyer**; over several rounds confirm the Lawyer's client is sometimes the Prosecutor. Turn on the **Jester** too and confirm the Lawyer is never the Jester.
6. Finish a round → Discussion → Results: the screen shows **"The lawyer was X — their client was Y"** alongside the imposter (and prosecutor/jester) lines. Confirm no win/score text is shown for the Lawyer.
7. Enable **Grayscale mode** and repeat a Lawyer reveal + Results: the Lawyer note/line carries no colour tell.
8. Trigger a **Troll Mode** round: no Lawyer is assigned and no Lawyer results line appears.
9. **Edge:** 3 players / 2 imposters / Lawyer on → the lone crewmate is the Lawyer with a valid imposter client; no crash, no console error.
10. At 375px width: no horizontal scroll on Roles / Reveal / Results; all buttons remain tappable.
11. Stop the dev server. Run `npm run build`: it succeeds with no new errors or warnings.

If any one of criteria 1–34 fails, the build is not yet done.

## Open questions for the builder

- **Lawyer note wording.** The exact reveal copy, the Roles toggle description, and the Results line wording are the builder's call, provided criteria 18, 21, 24 hold and no text says the client is an imposter. Suggested copy is in the brief.
- **Lawyer colour.** `--lawyer: #2dd4bf` (teal) is a sensible default that satisfies criteria 27–28; the final hue is a later design-silo decision and can change without touching logic.
- **`buildRoles` signature.** Adding `hasLawyer` as a fifth positional param matches the existing `hasJester`/`hasProsecutor` style; an options-object refactor is acceptable only if all existing callers/behaviour are preserved.
- **Where to render the note in the child components.** Each component already has a crewmate detail card; appending the note there (vs a shared snippet) is the builder's call as long as all five styles show it.

## Next step

This spec is the contract for the build at `02-development/workflow/03-builds/imposter-game-app/`. Implementing it is the brief → spec → **build** stage; verify against criteria 1–34 and the smoke test before considering the Lawyer role done.
