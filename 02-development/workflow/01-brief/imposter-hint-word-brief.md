# Brief — Imposter Hint Word

## Source plan

[01-plan/plans/imposter-hint-word-plan-final.md](../../../01-plan/plans/imposter-hint-word-plan-final.md)

> ⚠️ **If you open any reference screenshot, read [CORRECTIONS.md](../../../01-plan/references/examples-of-good-work/CORRECTIONS.md) first.** It records intentional deviations from the images and **overrides** them. The hint feature does **not** appear in any screenshot — it is specified by this brief, not by an image. Where it touches the imposter reveal, this brief wins.

## What to build

A **hint word for every secret word**, shown **only to the imposter** and revealed to everyone at the end.

Today the imposter's reveal card says only *"YOU ARE THE IMPOSTER! You don't know the word"* — they're left blind and easy to catch the moment discussion starts. After this build:

- Every word in the **Common Nouns** deck (517 words) carries a paired **hint word**.
- On the **imposter's reveal card** (after they tap to reveal — same private screen that tells them they're the imposter), the hint is shown. Crewmates' card is unchanged: they still see the secret word and **never** the hint.
- The **Results screen** shows the hint to everyone, alongside the imposter(s) and the secret word it already displays.
- A hint problem **degrades gracefully** — it never blocks or crashes the game (see *Error handling* in Scope).

`App.svelte`, routing, `config.js`, `shuffle.js`, and `Stepper.svelte` are **not** touched.

## Why this is being built now

1. **It balances the game for the imposter.** A blind imposter is trivially caught; a vague hint gives them a safe angle to contribute to discussion so they can blend in. That's the whole point of the feature.
2. **It adds a payoff at the end.** Surfacing the hint on Results lets the table see what the imposter was working from — the "ahh, that's what they had" moment.
3. **The data model needs to land once.** Moving the deck to `{word, hint}` pairs now sets the shape every future deck (and the future on/off toggle) builds on, so it's worth doing cleanly while there's a single deck to convert.

## The hint authoring rule (the heart of this build)

The builder authors a hint for **all 517 words**. Each hint must:

- name a **broad, high-level association** — *a touch broader than the immediate category*. e.g. `apple → "food"` (not "fruit"), `anchor → "something at sea"`, `bicycle → "gets you around"`, `baby → "a living thing"`.
- give the imposter a **safe, generic angle** to talk from without naming or strongly implying the word. The hint is a **discussion-participation aid**, *not* a pointer to the word — steering them toward it is an acceptable side effect, not the goal.
- be **short** (1–3 words / a brief phrase), **lowercase**, no trailing punctuation — matching the existing word-list style.
- **may repeat** across many words (`"food"` covers apple, bacon, banana…). Don't force uniqueness; many words → one hint and one word → several plausible hints are both fine.

**Open the build with a worked sample of ~15–20 word→hint pairs** so the tone is calibrated before generating all 517.

## Scope

**In scope:**

- **Data — convert the deck.** [public/data/common-nouns.json](../03-builds/imposter-game-app/public/data/common-nouns.json): change all 517 entries from plain strings to `{ "word": "…", "hint": "…" }` objects, authoring every hint per the rule above.
- **Word source** — [src/lib/word-source.js](../03-builds/imposter-game-app/src/lib/word-source.js):
  - `loadWords()` returns the array of entry objects. **Keep** the existing `Array.isArray` guard (a non-array payload / failed fetch still throws → the existing "couldn't load" path, Start disabled).
  - **Do NOT** add a strict per-entry throw — malformed entries are tolerated and handled gracefully downstream.
  - `pickWord()` is reused as-is, now returning the picked entry object (still pure, no mutation).
- **Game state** — [src/lib/game-state.js](../03-builds/imposter-game-app/src/lib/game-state.js):
  - Add `hint: null` to `initial`; `startGame()` accepts and stores `hint`.
  - `playAgain()` / `resetGame()` need **no change** — both reset through `…initial`, so `hint` clears and a fresh one is picked at the next Start, mirroring `word`.
- **Setup** — [src/screens/SetupScreen.svelte](../03-builds/imposter-game-app/src/screens/SetupScreen.svelte): in `start()`, pick the entry once and extract **defensively**: `const entry = pickWord(words); startGame({ …, word: entry.word ?? entry, hint: entry.hint ?? null })`. The "✓ Loaded N common nouns" count keeps using `words.length` — unchanged.
- **Reveal** — [src/screens/RevealScreen.svelte](../03-builds/imposter-game-app/src/screens/RevealScreen.svelte): in the **imposter branch** (renders after tap-to-reveal), add a hint line — show `$gameState.hint` when it's a non-empty string, otherwise **"An error occurred."**. Keep the *"YOU ARE THE IMPOSTER!"* title; reword the sub-line to say the hint is there to help you blend in. **Crewmate branch unchanged.**
- **Results** — [src/screens/ResultsScreen.svelte](../03-builds/imposter-game-app/src/screens/ResultsScreen.svelte): add a line under the word — *The imposter's hint was "…"* when `$gameState.hint` is a non-empty string, otherwise **"An error occurred."**.
- **Error handling (graceful degrade)** — a hint problem must never block or crash the game:
  1. **Whole-deck failure stays a blocker** (network down, file missing, not a JSON array) → existing "couldn't load… try again" message, Start disabled. Unchanged.
  2. **Word extraction is defensive** (`entry.word ?? entry`) so even an old-format bare string still yields a playable word.
  3. **Hint is best-effort** — a missing/blank hint shows **"An error occurred."** in the imposter card and the Results line; the round plays on.
- **Mobile-responsive** — tap targets ≥44px, no horizontal scroll at 375px. Re-use the existing `app.css` tokens and `.screen` / `.card` / button style patterns.
- Code follows [technical-standards.md](../../references/technical-standards.md): plain and simple, no new dependencies, brief comments on new blocks.

**Out of scope (do NOT build here):**

- **On/off toggle for the hint** — a *later* Settings-style feature. The `{word, hint}` data model is built ready for it, but add **no** toggle UI or state now.
- **Hints for other/future decks** — only Common Nouns exists; the same authoring rule applies whenever a new deck is added later.
- **Per-imposter distinct hints** — all imposters in a round **share** the round's single hint (it's tied to the word, not the player). This is intentional. Do not build a distinct-hint-per-imposter system.
- **A strict load-time validator that disables Start on a bad entry** — explicitly rejected in favour of graceful degrade. Only a whole-deck failure blocks Start.
- **Renaming code identifiers** `isImpostor` / `impostorCount` — leave them. The new `hint` field is spelling-neutral.
- **Visual / design polish** of the hint's presentation — functional styling only; design comes via `03-design/` later.
- **`App.svelte` / routing changes**, and **new dependencies** of any kind.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`. No new files — every file below already exists.

| File | Change |
|---|---|
| `public/data/common-nouns.json` | Convert all 517 entries to `{ word, hint }` objects; author every hint per the rule above. |
| `src/lib/word-source.js` | `loadWords()` returns entry objects; keep the `Array.isArray` guard, add **no** strict per-entry throw. `pickWord()` returns the entry object. |
| `src/lib/game-state.js` | Add `hint: null` to `initial`; `startGame()` stores `hint`. `playAgain()` / `resetGame()` unchanged. |
| `src/screens/SetupScreen.svelte` | `start()`: defensive extract — `word: entry.word ?? entry`, `hint: entry.hint ?? null`. |
| `src/screens/RevealScreen.svelte` | Imposter branch: add hint line; non-empty string → show hint, else **"An error occurred."**. Reword the sub-line. Crewmate branch untouched. |
| `src/screens/ResultsScreen.svelte` | Add hint line under the word; non-empty string → *The imposter's hint was "…"*, else **"An error occurred."**. |

## Constraints worth highlighting

- **Spelling is "imposter", not "impostor", in all user-facing text** (recorded standard — see [technical-standards.md](../../references/technical-standards.md)). The existing screens already comply; keep it. Internal identifiers (`isImpostor`, `impostorCount`) stay as-is.
- **Graceful degrade is the rule, loud-fail is rejected.** A single bad entry must not sink the 517-word deck. The visible **"An error occurred."** is the intended troubleshooting signal — keep the exact-ish wording so Rehaan recognises it.
- **The hint stays behind the existing tap-to-reveal** on the imposter card — it must not appear before the player taps, and must never appear on the crewmate card.
- **Hint travels with the word.** It's picked together at Start and re-picked together on Play again — mirror the `word` lifecycle exactly; don't add a separate hint-picking step.
- **Transitions/state live in `game-state.js`**; screens are pure reactive reads — don't write the store directly from screens.
- **No new dependencies** — pure data + Svelte. Per technical-standards: *"plainly and simply as possible"*, *"add comments… whenever you are coding a new code block"*.
- **Heads-up on hidden failures:** the imposter card is private (device passed around), so a broken hint may not be seen in casual play — but the Results screen shows the hint to everyone, so it surfaces there. The verification checklist exercises both failure modes.
- Works on modern browsers (Chrome, Firefox, Safari latest). Mobile-responsive — verify at 375px.

## Verification (smoke test — Rehaan runs `npm run dev`; the builder does NOT launch the app)

1. Setup still shows **"✓ Loaded 517 common nouns"** and Start enables — the new object format parses.
2. Start a 3-player / 1-imposter round. On the imposter's reveal, after tapping: the card shows **"YOU ARE THE IMPOSTER"** *and* a hint word. Crewmates see the secret word and **no** hint.
3. The hint shown matches its secret word (spot-check against the JSON entry).
4. Finish the round → discussion → results: Results shows the imposter(s), the secret word, **and** the hint word.
5. **Play again** → a new round picks a new word *and* its matching hint (the hint changes together with the word).
6. *(Negative — graceful degrade)* Remove one entry's `hint` and force that word → the game **still plays**; the imposter card and the Results line show **"An error occurred."**; Start is **not** disabled.
7. *(Negative — whole-deck failure)* Make the file an invalid JSON array (or block the fetch) → setup shows *"Couldn't load… try again"* and **Start stays disabled**.
8. `npm run build` succeeds; at 375px there's no horizontal scroll and tap targets stay ≥44px.

## Next step

This brief feeds `02-development/workflow/02-specs/imposter-hint-word-spec.md`, which converts it into an acceptance-criteria contract for the build.
