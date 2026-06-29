# Brief — Lawyer Role

## Source plan

[01-plan/plans/lawyer-role-plan-final.md](../../../01-plan/plans/lawyer-role-plan-final.md)

> ⚠️ **The Lawyer appears in no reference screenshot.** It is specified by this brief, not by any image. Where it touches the reveal/roles/results screens, this brief wins. (If you do open a screenshot for layout cues, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first — it overrides the images.)

## What to build

A third **optional, toggleable role** on the **Roles** screen: the **⚖️ Lawyer**.

The Lawyer is mechanically a **crewmate** (knows the secret word, occupies an existing crewmate slot — does **not** add a player) with a **flipped win condition**: they're secretly assigned a **"client"** and win *with the imposters* if that client is **not** voted out. The client is always an imposter-aligned player (a plain imposter **or** the Prosecutor), but the Lawyer is **never told the client is an imposter** — only to keep "Player XYZ" from being voted out.

There is **no voting screen** (by design — voting is verbal), so the app only: (1) assigns the role secretly, (2) reveals it privately to the Lawyer, (3) names the Lawyer and their client at the end. **No win is computed.**

After this build:

- The **Roles screen** gains a ⚖️ Lawyer toggle (off by default), persisted like the Jester/Prosecutor toggles, disabled with a note below `LAWYER_MIN_PLAYERS` (3).
- When on (and not a Troll round), **exactly one** crewmate is the Lawyer, assigned **one** client at random from **all imposter-aligned players** (every plain imposter and the Prosecutor, equal chance).
- The Lawyer's **private reveal** = the normal **crewmate word card** *plus* an appended note naming the client and the goal. Works in **all four reveal styles**. **No** in-round banner (the role is hidden, like the Prosecutor).
- The **Results screen** names the Lawyer and client: *"The lawyer was X — their client was Y."*

## The Lawyer is the mirror of the Prosecutor (build it the same way)

The Prosecutor is already wired end-to-end; the Lawyer plugs into the **same seams with the pool inverted**. Use the Prosecutor as your template in every file.

| | Prosecutor (existing) | Lawyer (new) |
|---|---|---|
| Side | imposter (`isImpostor:true`) | crewmate (`isImpostor:false`) |
| Secret field | `targetIndex` → a crewmate-type | **`clientIndex`** → an imposter-aligned player |
| Assignment pool | non-imposters | **imposters** (incl. the Prosecutor) |
| Reveal | its **own** card (before the imposter branch) | the **crewmate** card **+ an appended note** |
| Banner | none | none |
| Results | "The prosecutor was X — their target was Y" | "The lawyer was X — their client was Y" |

**The one structural difference:** the Prosecutor is a *separate* reveal branch. The Lawyer is **not** — it's a crewmate, so it falls into the existing crewmate `{:else}` branch naturally. You only **append** a note to the crewmate rendering; do **not** add a new top-level branch and do **not** reorder the jester/prosecutor/imposter/crewmate checks.

## Why this is being built now

1. **It adds a new social axis.** A hidden crewmate rooting *for* the imposters (and arguing to protect a specific player) creates fresh misdirection — the inverse of the Prosecutor's "frame an innocent" pressure.
2. **The seams already exist.** The Prosecutor landed the toggle/assignment/reveal/results pattern; the Lawyer is a low-risk reuse of it with an inverted pool, so it's cheap to add cleanly now.

## Scope

**In scope** — all paths under `02-development/workflow/03-builds/imposter-game-app/src/`:

- **Config** — [lib/config.js](../03-builds/imposter-game-app/src/lib/config.js): add `export const LAWYER_MIN_PLAYERS = 3;` with a comment mirroring `PROSECUTOR_MIN_PLAYERS`.
- **Toggle store** — [lib/roles-config.js](../03-builds/imposter-game-app/src/lib/roles-config.js): add `lawyerEnabled: false` to `defaults`, with a doc comment (a crewmate secretly defending one imposter-aligned player; wins with the imposters if the client survives). The existing `load()` merge means users who saved before this release pick up the default.
- **Game state** — [lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  - `initial`: add `hasLawyer: false`; extend the `roles[i]` schema comment to mention `isLawyer` + `clientIndex`.
  - `buildRoles(...)`: add a `hasLawyer = false` parameter. **After** the shuffle **and** the existing Prosecutor-target block, add a parallel Lawyer block:
    - `lawyerPool` = indices where `!isImpostor && !isJester` (plain crewmates only — never the Jester).
    - `clientPool` = indices where `isImpostor` (every imposter, incl. the Prosecutor → "any imposter-aligned").
    - If **both** non-empty: pick a random `lawyerIdx` from `lawyerPool`, set `shuffled[lawyerIdx].isLawyer = true` and `shuffled[lawyerIdx].clientIndex = <random from clientPool>`. Otherwise **skip defensively** (don't throw) — in practice the imposter cap always leaves ≥1 plain crewmate and there's always ≥1 imposter.
  - `startGame({...})`: add `lawyerEnabled = false` param; compute `const hasLawyer = lawyerEnabled && !isTroll;`; store `hasLawyer`; pass `hasLawyer` into `buildRoles(...)`. (Troll Mode wins — no Lawyer on a troll round.)
- **Roles screen** — [screens/RolesScreen.svelte](../03-builds/imposter-game-app/src/screens/RolesScreen.svelte): import `LAWYER_MIN_PLAYERS`; add `$: lawyerDisabled = !(playerCount >= LAWYER_MIN_PLAYERS);`; add a third `.role-toggle` block (⚖️ Lawyer) bound to `$rolesConfig.lawyerEnabled` with enabled/disabled descriptions; add `.role-lawyer { color: var(--lawyer); }`.
- **Setup screen** — [screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte): import `LAWYER_MIN_PLAYERS`; add `$: lawyerActive = $rolesConfig.lawyerEnabled && typeof players === 'number' && players >= LAWYER_MIN_PLAYERS;`; add the auto-off guard mirroring the prosecutor's; pass `lawyerEnabled: lawyerActive` in the `startGame({...})` call. The Lawyer occupies a crewmate slot, so — like the Prosecutor — it **does NOT** change `maxImpostors`.
- **Reveal** — [screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte): derive once —
  ```
  $: isLawyer = role?.isLawyer === true;
  $: lawyerClientName = isLawyer && typeof role?.clientIndex === 'number'
       ? displayName($gameState.names, role.clientIndex) : '';
  ```
  In the **crewmate** rendering of the **Envelope** (inline) and **Original** styles, after the existing word/sub lines, add `{#if isLawyer}` … a `note-lawyer` / `card-lawyer` styled block naming `lawyerClientName` … `{/if}`. Pass `isLawyer` and `lawyerClientName` as props to the three reveal components.
- **Reveal components** — [components/WheelReveal.svelte](../03-builds/imposter-game-app/src/components/WheelReveal.svelte), [components/CardGridReveal.svelte](../03-builds/imposter-game-app/src/components/CardGridReveal.svelte), [components/PeekReveal.svelte](../03-builds/imposter-game-app/src/components/PeekReveal.svelte): add `export let isLawyer = false;` and `export let lawyerClientName = '';`; append the same Lawyer note inside each component's **crewmate** detail card.
- **Results** — [screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte): mirror the prosecutor derivations —
  ```
  $: lawyerIndex = $gameState.hasLawyer ? $gameState.roles.findIndex(r => r.isLawyer) : -1;
  $: lawyerName = lawyerIndex >= 0 ? displayName($gameState.names, lawyerIndex) : '';
  $: lawyerClientName = lawyerIndex >= 0 && typeof $gameState.roles[lawyerIndex].clientIndex === 'number'
       ? displayName($gameState.names, $gameState.roles[lawyerIndex].clientIndex) : '';
  ```
  Add a results line after the prosecutor line: `{#if lawyerName}<p class="lawyer">The lawyer was {lawyerName} — their client was {lawyerClientName}</p>{/if}` and a `.lawyer { color: var(--lawyer); … }` rule mirroring `.prosecutor`. The **Spotlight** lead-in is imposter-only — leave it unchanged.
- **Colour token** — [app.css](../03-builds/imposter-game-app/src/app.css): add `--lawyer` to `:root` (a hue distinct from accent indigo, error red, jester pink, prosecutor gold — **teal `#2dd4bf`** unless design says otherwise) and pin `--lawyer: #a8a8a8;` in `:root.grayscale` so the Lawyer is no colour tell.

**Out of scope (do NOT build here):**

- **Win/score computation.** No voting screen, no winner calc — the app only reveals identities. The Lawyer's win is resolved verbally, like the Jester/Prosecutor.
- **More than one Lawyer**, a **Lawyer who picks their own client**, or **telling the Lawyer the client is an imposter** — all explicitly rejected. One Lawyer, random client, never named as an imposter.
- **An in-round "a Lawyer is among you" banner** — the role is hidden (only the Jester gets a banner).
- **Reusing the Prosecutor's `targetIndex`** for the client — use a separate `clientIndex`.
- **Renaming `isImpostor` / `impostorCount`** — leave them; the new flags are spelling-neutral.
- **Visual/design polish** beyond the functional `--lawyer` token — real design comes via `03-design/` later.
- **`App.svelte` / routing changes**, and **new dependencies** of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. **No new files** — every file below already exists.

| File | Change |
|---|---|
| `src/lib/config.js` | Add `LAWYER_MIN_PLAYERS = 3`. |
| `src/lib/roles-config.js` | Add `lawyerEnabled: false` default + comment. |
| `src/lib/game-state.js` | `initial.hasLawyer`; schema comment; `buildRoles()` param + assignment block; `startGame()` param/compute/pass. |
| `src/screens/RolesScreen.svelte` | ⚖️ Lawyer toggle + `lawyerDisabled` + `.role-lawyer` CSS. |
| `src/screens/SetupScreen.svelte` | `lawyerActive` + auto-off guard + pass `lawyerEnabled`. |
| `src/screens/RevealScreen.svelte` | Derive `isLawyer`/`lawyerClientName`; crewmate-note in Envelope + Original; pass props to 3 components. |
| `src/components/WheelReveal.svelte` | Props + crewmate Lawyer note. |
| `src/components/CardGridReveal.svelte` | Props + crewmate Lawyer note. |
| `src/components/PeekReveal.svelte` | Props + crewmate Lawyer note. |
| `src/screens/ResultsScreen.svelte` | Derive Lawyer/client; add results line + `.lawyer` CSS. |
| `src/app.css` | `--lawyer` token + grayscale pin. |

## Copy (functional; design may refine — must NOT say "imposter")

- **Reveal (appended under the crewmate word):** *"⚖️ You're also the **LAWYER**. Your client is **{client}** — keep them from being voted out. If your client survives the round, you win."* — **must not** state the client is an imposter.
- **Roles toggle description (enabled):** "A secret crewmate assigned to defend one player — if their client survives, the lawyer wins!"
- **Roles toggle description (disabled):** same, with " (Needs 3+ players.)" appended (mirror the prosecutor's disabled-copy pattern).
- **Results:** "The lawyer was {name} — their client was {client}".

## Constraints worth highlighting

- **Spelling is "imposter", not "impostor", in all user-facing text** (recorded standard — see [technical-standards.md](../../references/technical-standards.md)). New identifiers (`isLawyer`, `clientIndex`, `lawyerEnabled`, `hasLawyer`) are spelling-neutral; existing `isImpostor`/`impostorCount` stay as-is.
- **Never reveal the client is an imposter** anywhere the Lawyer can see before Results. The reveal note names the client and the goal only.
- **Lawyer is a plain crewmate** in assignment — never the Jester, never an imposter. The `lawyerPool` excludes both.
- **Reveal is an addendum, not a new branch.** The Lawyer note hangs off the existing crewmate card in every style; the role-check order (jester → prosecutor → imposter → crewmate) is unchanged.
- **No in-round banner** for the Lawyer (hidden role) — unlike the Jester.
- **Transitions/state live in `game-state.js`**; screens are pure reactive reads — don't write the store from screens. Assignment happens once in `buildRoles()`.
- **Grayscale safety:** the `--lawyer` token must be pinned to the neutral gray in `:root.grayscale` so colour can't out the Lawyer.
- **No new dependencies** — pure Svelte. Per [technical-standards.md](../../references/technical-standards.md): code "plainly and simply", with a brief comment on each new block.
- Works on modern browsers; mobile-responsive — verify at 375px, tap targets ≥44px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. Roles screen shows the ⚖️ **Lawyer** toggle; flipping it on persists across reload (localStorage `imposter:roles`); below 3 players it's disabled with the "(Needs 3+ players.)" note.
2. Start a **5-player / 1-imposter** round with Lawyer on. Walk the reveals: exactly **one** player sees the **crewmate word card + a Lawyer note** naming a client; that client is the imposter. **No** "a Lawyer is among you" banner shows.
3. Repeat for **each reveal style** (Original, Envelope, Wheel, Card grid, Peek) — the Lawyer note appears in all five.
4. With **Prosecutor + Lawyer** both on, over several rounds confirm the client can be the Prosecutor; with the **Jester** also on, the Lawyer is never the Jester.
5. Finish → Discussion → Results: shows **"The lawyer was X — their client was Y"** alongside the imposter (and prosecutor/jester) lines.
6. **Grayscale** mode: the Lawyer note carries no colour tell.
7. **Troll Mode** round: no Lawyer assigned, no Lawyer results line.
8. **Edge:** 3 players / 2 imposters / Lawyer on still assigns a Lawyer to the lone crewmate with a valid client — no crash, no console error.
9. `npm run build` succeeds; at 375px no horizontal scroll and tap targets stay ≥44px.

## Next step

This brief feeds `02-development/workflow/02-specs/lawyer-role-spec.md`, which converts it into an acceptance-criteria contract for the build.
