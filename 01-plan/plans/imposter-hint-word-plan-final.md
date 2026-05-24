# Imposter Hint Word Plan (Final)

## Why this plan exists

Right now the imposter's reveal shows nothing word-related — just *"YOU ARE THE
IMPOSTER! You don't know the word"*
([RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte), imposter branch).
The imposter is left completely blind, which makes them easy to catch the moment
discussion starts and tilts the game against their side.

This plan gives **every secret word an associated hint word**. The hint is shown
**only to the imposter** (on their reveal card, behind the existing tap-to-reveal)
and is **revealed to everyone on the results screen** alongside the secret word
and the imposter list. The hint is **deliberately vague**: its job is to give the
imposter a safe, generic angle to speak from during discussion so they aren't
instantly suspected — *not* to point them at the actual word (that may happen as a
harmless side effect).

**Intended outcome:** a more balanced round where the imposter can bluff
plausibly, with the hint surfaced at the end for the satisfying "ahh, that's what
they had" payoff.

Scope is the one existing deck — **"Common Nouns", 517 words**. A future on/off
toggle for the hint is **explicitly out of scope** here, but the data model is
built so it slots in cleanly later.

## The feature

1. **Every secret word gets a hint.** All 517 entries in the Common Nouns deck are
   given a hint word as part of this work (authored by the builder, see the
   authoring rule below).
2. **Imposter sees the hint on their reveal.** On the imposter's reveal card —
   *after* they tap to reveal, same screen that tells them they're the imposter —
   the hint is shown (e.g. a *"Your hint:"* line). Crewmates' reveal is unchanged
   (they still see the secret word, and never the hint).
3. **Results reveals the hint to everyone.** The results screen, which already
   names the imposter(s) and the secret word, gains a line for the hint word
   (e.g. *The imposter's hint was "…"*).
4. **Hint travels with the word.** The hint is picked together with the secret
   word at Start and lives in game state for the round; **Play again** picks a
   fresh word *and* its matching hint, exactly mirroring how the word already
   behaves.
5. **Data carries the pairing.** The deck file changes from a flat list of words
   to a list of `{ word, hint }` objects — one file per deck stays the single
   source of truth.
6. **A bad hint never blocks play.** A hint problem degrades gracefully: instead
   of a hint, the imposter card and the results line show **"An error occurred."**
   and the round continues. Only a *whole-deck* load failure (no words at all)
   blocks Start — because without words there's no game. (See *Error handling*.)

## The authoring rule for hints (the heart of the feature)

For each secret word, write **one short hint** that:

- names a **broad, high-level association** — *a touch broader than the immediate
  category*. e.g. `apple → "food"` (not "fruit"), `anchor → "something at sea"`,
  `bicycle → "gets you around"`, `baby → "a living thing"`.
- gives the imposter a **safe, generic angle** to talk from without naming or
  strongly implying the word.
- is **short** (1–3 words / a brief phrase), **lowercase**, no trailing
  punctuation — matching the existing word-list style.
- **may repeat** across many words (`"food"` covers apple, bacon, banana…). Many
  words → one hint and one word → several plausible hints are both fine and
  expected; don't force uniqueness.

The build should open with a worked sample of ~15–20 word→hint pairs so the tone
stays consistent across all 517.

## Error handling (graceful degrade)

A hint-data problem should **never crash or block the game** — it degrades in
three layers:

1. **Whole-deck failure stays a blocker** (network down, file missing, not a JSON
   array). Without words there's no game, so the *existing* behaviour is correct:
   the setup screen shows *"Couldn't load… try again"* and keeps **Start**
   disabled. Unchanged by this plan.
2. **Word extraction is defensive.** The picked entry's word is read as
   `entry.word ?? entry`, so even a stray *old-format* bare string still yields a
   playable word (just no hint). This is what downgrades the data change from a
   hard break to a soft, contained one.
3. **The hint is best-effort.** If the round's hint is missing or blank, the
   imposter card and the results line show **"An error occurred."** in place of
   the hint and the round plays on — visible enough to troubleshoot, harmless
   enough that no one's game is ruined.

> **Where you'll notice a broken hint:** the imposter card is private (the device
> is passed around), so a failed hint may not be seen during casual testing — but
> the **results screen shows the hint to everyone**, so a problem reliably
> surfaces there.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Who authors the 517 hints | **Builder authors all 517 now**, in this feature | Ships the feature complete rather than leaving a content gap. *(Rehaan's choice.)* |
| Hint closeness | **Broad and deliberately vague** — a touch broader than a plain category | Hint is a *discussion-participation aid*, not a pointer to the word; steering toward the word is an acceptable side effect, not the goal. *(Rehaan's choice.)* |
| Duplicate / overlapping hints | **Allowed** — many→one and one→many both fine | Forcing uniqueness would distort the vagueness; overlap is natural for broad hints. *(Rehaan's choice.)* |
| Data shape | **Pair `word` + `hint` in the same deck file** (array of objects) | One file per deck stays the source of truth; scales cleanly to future decks and the future toggle. *(Rehaan's choice.)* |
| Where the hint lives at runtime | In `gameState` next to `word`, picked together at Start | Mirrors the existing `word` lifecycle exactly — Play again re-picks both. |
| Hint visibility on reveal | **Imposter only, behind the existing tap-to-reveal** | The reveal card is already gated face-down; the hint joins it there. Crewmate card untouched. |
| Bad-data handling | **Graceful degrade**, not loud fail — show **"An error occurred."** in place of a missing hint; only a whole-deck load failure blocks Start | Keeps the game playable and the problem visible/troubleshootable; a single bad entry shouldn't sink a 517-word deck. *(Rehaan's choice.)* |

## How it fits the architecture

No new screens, routes, or dependencies — this threads a second value (`hint`)
through the path the `word` already travels:

```
common-nouns.json  [{word, hint}, …]
   │ loadWords()  → array of {word, hint}
   │ pickWord()   → one {word, hint}
   ▼ Start
gameState  { …, word, hint }
   ├─ RevealScreen  → imposter card shows hint (crewmate card shows word)
   │                   └ hint missing? → "An error occurred."
   └─ ResultsScreen → shows imposter(s) + word + hint
                       └ hint missing? → "An error occurred."
   │ Play again → reset via …initial → fresh word+hint at next Start
```

## Files this affects

| File | Change |
|---|---|
| [public/data/common-nouns.json](../../02-development/workflow/03-builds/imposter-game-app/public/data/common-nouns.json) | Convert all 517 entries from plain strings to `{ "word": "…", "hint": "…" }` objects. Author every hint per the rule above. |
| [src/lib/word-source.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/word-source.js) | `loadWords()` now returns `{word, hint}` objects. **Keep** the `Array.isArray` guard (a non-array / failed fetch still throws → existing "couldn't load" path, Start disabled). **Do not** add a strict per-entry throw — bad entries are tolerated and handled gracefully downstream (see *Error handling*). `pickWord()` reused as-is, now returning the entry object (still pure). |
| [src/lib/game-state.js](../../02-development/workflow/03-builds/imposter-game-app/src/lib/game-state.js) | Add `hint: null` to `initial`; `startGame()` accepts and stores `hint`. `playAgain()` / `resetGame()` need **no change** — both reset through `…initial`, so `hint` clears and a fresh one is picked at next Start. |
| [src/screens/SetupScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/SetupScreen.svelte) | In `start()`, pick the entry once and extract **defensively**: `const entry = pickWord(words); startGame({ …, word: entry.word ?? entry, hint: entry.hint ?? null })` — so an old-format bare string still yields a playable word and a missing hint becomes `null`. The "✓ Loaded N common nouns" count uses `words.length` (array length) — unchanged. |
| [src/screens/RevealScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/RevealScreen.svelte) | In the imposter branch (renders after tap-to-reveal), add a hint line: show `$gameState.hint` when it's a non-empty string, otherwise **"An error occurred."**. Keep the *"YOU ARE THE IMPOSTER!"* title; reword the sub-line to say the hint is there to help you blend in. Crewmate branch unchanged. |
| [src/screens/ResultsScreen.svelte](../../02-development/workflow/03-builds/imposter-game-app/src/screens/ResultsScreen.svelte) | Add a line under the word: *The imposter's hint was "…"* when `$gameState.hint` is a non-empty string, otherwise **"An error occurred."**. |

**Reused, not rebuilt:** `pickWord()` (returns the object now, same logic), the
`gameState` store + reactive-`$`-read conventions, the existing tap-to-reveal flag
on `RevealScreen`, the `loadWords()` validate-or-throw pattern, and all `app.css`
tokens / `.screen` styles. `App.svelte`, `config.js`, `shuffle.js`, and
`Stepper.svelte` are untouched.

## Conventions to honor

- **User-facing text spells it "imposter"** (never "impostor") — the screens
  already do this; keep it. The new `hint` field/identifier is spelling-neutral;
  internal `isImpostor` / `impostorCount` stay as-is. (Per
  [technical-standards.md](../../02-development/references/technical-standards.md).)
- Plain, simple, easy-to-extend code with a comment on each new block.
- No new dependencies — pure data + Svelte; mobile-responsive on modern browsers.

## What's deferred (out of scope)

- **On/off toggle for hints** — a future Settings-style option. The `{word, hint}`
  data model is built ready for it; no toggle UI or state is added now.
- **Hints for additional/future decks** — the same authoring rule applies whenever
  a new deck is added; this plan only covers Common Nouns.
- **Visual / design polish** of the hint's presentation — functional styling only;
  real design belongs in the `03-design` silo.
- **Per-imposter distinct hints** — all imposters in a round share the round's one
  hint (it's tied to the word, not the player). This is **intentional**, not just
  the simplest option: when multiple imposters riff on the same vague theme they
  can quietly recognise one another, which is a nice emergent "find your ally"
  layer. A future idea is *multiple/distinct hints per word* to help a struggling
  imposter — but note the **trade-off**: distinct hints would *remove* that
  ally-signal. Out of scope now; recorded so the tension is on the table when it's
  revisited.

## Acceptance (what "done" looks like for the eventual build)

From `02-development/workflow/03-builds/imposter-game-app/`, `npm run dev`:

1. Setup still shows **"✓ Loaded 517 common nouns"** and Start enables — the new
   object format parses correctly.
2. Start a 3-player / 1-imposter round. On the imposter's reveal, after tapping:
   the card shows **"YOU ARE THE IMPOSTER"** *and* a hint word. Crewmates see the
   secret word and **no** hint.
3. The hint shown matches its secret word (spot-check against the JSON entry).
4. Finish the round → discussion → results: results shows the imposter(s), the
   secret word, **and** the hint word.
5. **Play again** → a new round picks a new word *and* its matching hint (the hint
   changes together with the word).
6. *(Negative check — graceful degrade)* Temporarily remove one entry's `hint` in
   the JSON and force that word to be picked → the game **still plays**; the
   imposter card and the results line show **"An error occurred."** instead of a
   hint. Start is **not** disabled.
7. *(Negative check — whole-deck failure)* Temporarily break the file so it isn't a
   valid JSON array (or block the fetch) → setup shows the existing *"Couldn't
   load… try again"* message and **Start stays disabled**.
8. `npm run build` succeeds; at a 375px viewport there's no horizontal scroll and
   tap targets stay ≥44px.

Verification is **manual** (`npm run dev`, then `npm run build`), consistent with
prior features. Per the agreed split, the build **writes the checklist; Rehaan
runs `npm run dev`** to verify.

## Risks / open questions

- **Hint quality is subjective.** "As vague as possible without being useless" is
  a judgement call across 517 words; the worked sample up front sets the bar, and
  hints are easy to tweak post-hoc since they're plain data.
- **Data format change is soft and contained**, not a hard break. The deck goes
  from strings to `{word, hint}` objects, but defensive extraction
  (`entry.word ?? entry`, `entry.hint ?? null`) means even an old-format file
  still yields playable words — only the hint goes missing, and that degrades to
  "An error occurred." rather than crashing. New decks should still follow the
  `{word, hint}` shape.
- **Graceful degrade can hide a broken hint dataset.** Because problems don't
  block play, a bad hint could ship unnoticed in casual testing (the imposter
  card is private). Mitigation: the results screen shows the hint to everyone, and
  the acceptance checklist exercises both failure modes.
- **Future toggle.** When the on/off setting arrives, the imposter reveal and
  results will need to conditionally hide the hint; built vague-by-default now so
  the toggle is purely additive.

## Status

`final` — approved by Rehaan (2026-05-22), including the graceful-degrade error
handling and the intentional shared-hint dynamic. Ready to route to
`02-development/workflow/01-brief/imposter-hint-word-brief.md` to become a brief →
spec → build.
