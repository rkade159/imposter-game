# Lawyer Role Plan (Final)

## Why this plan exists

The game has two optional, toggleable roles on the **Roles** screen — the
**Jester** (a crewmate who wins by being voted out) and the **Prosecutor** (a
hidden imposter secretly told to get one player voted out). Rehaan wants a third
toggleable role: the **Lawyer**.

The **Lawyer** is mechanically a **crewmate** (knows the word, occupies an
existing crewmate slot — it does **not** add a player) but with a **flipped win
condition**. They are secretly assigned a **"client"**, and they win *with the
imposters* if their client survives the round while the crewmates are voted out
instead. The client is always an imposter-aligned player (a plain imposter or
the Prosecutor), but the Lawyer is **never told the client is an imposter** —
only that they must keep "Player XYZ" from being voted out.

There is **no voting screen** (by design — discussion/voting is verbal), so the
app's job is purely: (1) assign the role secretly, (2) reveal it privately to
the Lawyer, (3) name the Lawyer and their client at the end.

**Intended outcome:** a new ⚖️ Lawyer toggle that adds a hidden, social
"defend-the-imposter" twist — the mirror image of the Prosecutor.

## The mental model — Lawyer is the mirror of the Prosecutor

| | Prosecutor | Lawyer |
|---|---|---|
| Side it sits on | Imposter (`isImpostor:true`) | Crewmate (`isImpostor:false`) |
| Secret assignment | A **target** crewmate to get voted out | A **client** imposter to protect |
| Target pool | crewmate-type players | imposter-aligned players |
| Win | target IS voted out | client is NOT voted out |
| Reveal | its **own** card (checked before the imposter branch) | the **crewmate** card **plus** an added note |
| In-round banner | none (hidden) | none (hidden) |
| Results line | "The prosecutor was X — their target was Y" | "The lawyer was X — their client was Y" |

The same assignment / reveal / results plumbing the Prosecutor already uses
applies to the Lawyer with the pool inverted. The build mirrors the Prosecutor
file-for-file (see *Files this affects*).

## The feature

1. **New toggle.** A third optional role on the **Roles** screen (⚖️ Lawyer),
   persisted in `rolesConfig` (`lawyerEnabled`, default off) exactly like the
   Jester/Prosecutor toggles. Disabled with a note below `LAWYER_MIN_PLAYERS`.
2. **Assignment.** When on (and not a Troll round), **exactly one** crewmate
   becomes the Lawyer and is assigned one **client**, chosen at random from
   **all imposter-aligned players** (every plain imposter *and* the Prosecutor
   are equally eligible). The Lawyer is a plain crewmate — never the Jester,
   never an imposter. Stored on the role as `isLawyer` + `clientIndex`.
3. **Reveal.** On the Lawyer's private reveal, they see the **normal crewmate
   card (the secret word)** *plus* an added Lawyer note naming their client and
   telling them to keep that player from being voted out. It **does not** say
   the client is an imposter. No in-round banner (the role is hidden, like the
   Prosecutor). Works across all reveal styles (Original, Envelope, Wheel,
   Card grid, Peek).
4. **Results.** At the end, the Results screen names the Lawyer and their
   client: *"The lawyer was X — their client was Y."* (Just the two names — no
   "an imposter" annotation, no win-condition restatement.)

## Decisions (confirmed with Rehaan, 2026-06-29)

| Decision | Choice | Why |
|---|---|---|
| Who can be the client | **Random among any imposter-aligned player** — every plain imposter *and* the Prosecutor, equal chance | Matches Rehaan's intent that the Lawyer defends "imposters/imposter roles such as the Prosecutor". *(Rehaan's choice.)* |
| Number of Lawyers | **Exactly one** per round, any player count | Avoids edge cases like two Lawyers sharing a client. *(Rehaan's choice.)* |
| End-of-round reveal | **Just the two names** — "The lawyer was X — their client was Y" | Keeps the Results line neutral; players infer the twist from the imposter reveal. *(Rehaan's choice.)* |
| Minimum players | **3** (`LAWYER_MIN_PLAYERS = 3`) | Matches the Prosecutor; inert while `MIN_PLAYERS` is 3 but kept correct/future-proof. *(Rehaan's choice.)* |
| Reveal placement | **Crewmate card + an appended note**, not a separate reveal branch | The Lawyer IS a crewmate (`isImpostor:false`); it falls into the existing crewmate `{:else}` naturally — only an addendum is needed, no branch reordering. |
| Client field name | **`clientIndex`** (not the Prosecutor's `targetIndex`) | Distinct semantics (a player to protect, not to remove); a separate field keeps the role schema self-documenting. |
| In-round banner | **None** (hidden role) | Same as the Prosecutor; revealing "a Lawyer is among you" would leak the twist. The Jester's banner is the exception, not the rule. |

## How it fits the architecture

No new screens or routes — the Lawyer rides the existing
`setup → reveal ⇄ pass → discussion → results` loop. It plugs into the same
seams the Prosecutor uses:

- **Toggle/persistence:** `rolesConfig` (`lawyerEnabled`), separate from settings.
- **Gating:** `LAWYER_MIN_PLAYERS` in `config.js`, enforced by the Roles toggle
  and the Setup auto-off guard. The Lawyer occupies a crewmate slot, so — like
  the Prosecutor — it does **not** change `maxImpostors`.
- **Assignment:** a new block in `buildRoles()`, run **after** the shuffle (and
  after the Prosecutor's target assignment) so positions are final:

  ```
  lawyerPool  = indices where !isImpostor && !isJester   (plain crewmates only)
  clientPool  = indices where isImpostor                 (imposters + prosecutor)
  if both non-empty:
    pick a random lawyerIdx;  shuffled[lawyerIdx].isLawyer   = true
                              shuffled[lawyerIdx].clientIndex = random clientPool entry
  else: skip (defensive — never throws)
  ```

  In practice the imposter cap always leaves ≥1 plain crewmate and there's
  always ≥1 imposter, so a Lawyer + client are always assignable; the guard is
  belt-and-braces.
- **Troll Mode wins:** `hasLawyer = lawyerEnabled && !isTroll` — no Lawyer on a
  troll round, same as the Jester/Prosecutor.

## Files this affects

All paths under `02-development/workflow/03-builds/imposter-game-app/src/`.

| File | Change |
|---|---|
| `lib/config.js` | Add `LAWYER_MIN_PLAYERS = 3` (comment mirrors `PROSECUTOR_MIN_PLAYERS`). |
| `lib/roles-config.js` | Add `lawyerEnabled: false` to `defaults`, with a doc comment. |
| `lib/game-state.js` | `initial`: add `hasLawyer: false`; extend the `roles[i]` schema comment (`isLawyer`, `clientIndex`). `buildRoles()`: add `hasLawyer` param + the post-shuffle assignment block above. `startGame()`: add `lawyerEnabled` param, compute `hasLawyer = lawyerEnabled && !isTroll`, store it, pass into `buildRoles()`. |
| `screens/RolesScreen.svelte` | Import `LAWYER_MIN_PLAYERS`; add `lawyerDisabled`; add the ⚖️ Lawyer `.role-toggle` bound to `$rolesConfig.lawyerEnabled` with enabled/disabled copy; add `.role-lawyer { color: var(--lawyer); }`. |
| `screens/SetupScreen.svelte` | Import `LAWYER_MIN_PLAYERS`; add `lawyerActive`; add the auto-off guard (mirror the prosecutor's); pass `lawyerEnabled: lawyerActive` to `startGame()`. (Does NOT affect `maxImpostors`.) |
| `screens/RevealScreen.svelte` | Derive `isLawyer` + `lawyerClientName`. Append a Lawyer note to the **crewmate** block in the Envelope and Original styles. Pass `isLawyer` + `lawyerClientName` props to the three reveal components. |
| `components/WheelReveal.svelte`, `components/CardGridReveal.svelte`, `components/PeekReveal.svelte` | Add `isLawyer` / `lawyerClientName` props (default `false`/`''`); append the same Lawyer note inside each one's crewmate detail card. |
| `screens/ResultsScreen.svelte` | Derive `lawyerIndex` / `lawyerName` / `lawyerClientName`; add the results line after the prosecutor line; add a `.lawyer { color: var(--lawyer) }` rule. (Spotlight lead-in is imposter-only — unchanged.) |
| `app.css` | Add `--lawyer` to `:root` (distinct from indigo/red/pink/gold — proposed teal `#2dd4bf`, final colour is a design-silo call) and pin `--lawyer: #a8a8a8` in `:root.grayscale` so the role is no colour tell. |

**Reused, not rebuilt:** the `rolesConfig` toggle pattern, `buildRoles()` /
`startGame()` plumbing, `displayName()`, the per-style reveal-card structure, the
Results derivation pattern, and the `app.css` token + Grayscale-pin convention.
No new dependencies, no new screens, no `App.svelte`/routing change.

## Proposed copy (final wording is a design pass; honors "never say imposter")

- **Reveal (appended under the crewmate word):**
  > ⚖️ You're also the **LAWYER**. Your client is **{client}** — keep them from
  > being voted out. If your client survives the round, you win.

  Deliberately does **not** state the client is an imposter.
- **Roles toggle description:** "A secret crewmate assigned to defend one
  player — if their client survives, the lawyer wins. (Needs 3+ players.)"
- **Results:** "The lawyer was {name} — their client was {client}"

## What's deferred (out of scope)

- **Win/score tracking.** There's no voting screen and the app computes no
  winner; it only reveals identities. The Lawyer's win is resolved verbally by
  the table, exactly like the Jester/Prosecutor.
- **Multiple Lawyers / Lawyer-picks-own-client / Lawyer knows it's an imposter.**
  Explicitly out — one Lawyer, random client, never told it's an imposter.
- **Visual/design polish** of the Lawyer note and colour — the `--lawyer` token
  ships with a sensible default; real design belongs in the `03-design` silo.

## Acceptance (what "done" looks like for the eventual build)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. Roles screen shows a ⚖️ **Lawyer** toggle; it persists across reload
   (localStorage `imposter:roles`); it's disabled with a note below 3 players.
2. Start a round (e.g. 5 players / 1 imposter / Lawyer on): exactly one player's
   reveal is the **crewmate word card + a Lawyer note** naming a client, and
   that client is the imposter. **No** "a Lawyer is among you" banner appears.
3. The Lawyer note appears in **all** reveal styles (Original, Envelope, Wheel,
   Card grid, Peek).
4. With **Prosecutor + Lawyer** both on, the Lawyer's client can be the
   Prosecutor (over several rounds); with the **Jester** also on, the Lawyer is
   never the Jester.
5. Results shows **"The lawyer was X — their client was Y"** alongside the
   imposter/prosecutor/jester lines.
6. **Grayscale** mode: the Lawyer note carries no colour tell.
7. **Troll Mode** round: no Lawyer assigned, no Lawyer results line.
8. **Edge:** 3 players / 2 imposters / Lawyer on still assigns a Lawyer to the
   lone crewmate with a valid client — no crash.
9. `npm run build` succeeds; at 375px there's no horizontal scroll and tap
   targets stay ≥44px.

Verification is **manual** — the build **writes the checklist; Rehaan runs
`npm run dev`** to verify (per the agreed split).

## Risks / open questions

- **Reveal differs from a plain crewmate's** (the extra note). That's intended
  and not a leak — each reveal is private (pass-and-play), so no other player
  sees it.
- **`clientIndex` vs `targetIndex`.** Kept separate on purpose; both can coexist
  on a round (different player's role objects) with no collision.
- **Colour token** `--lawyer` ships a default (teal); the exact hue is a design
  call and can change without touching logic.

## Status

`final` — approved by Rehaan (2026-06-29). Feeds the brief at
`02-development/workflow/01-brief/lawyer-role-brief.md`, then a spec, then a
build.
