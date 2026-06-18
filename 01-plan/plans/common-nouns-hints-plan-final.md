# Plan: Rewrite "Common Nouns" hints to be specific & lateral

Status: **final** (built and linted — see verification)

## Context

The "Common Nouns" word list (`02-development/workflow/03-builds/imposter-game-app/public/data/common-nouns.json`,
517 `{ word, hint }` entries) is the default word source. Playtesting showed the
**hints are too vague to be fun**: they are broad category labels, not clues
about the specific word.

The hints were **non-discriminating** — they described a whole category, not the
word:
- 60+ words shared the identical hint `"food"` (apple, bacon, cake, pizza, salad…).
- Whole clusters collapsed to `"a living thing"`, `"something you wear"`,
  `"part of the body"`, `"found in a kitchen"`, `"gets you around"`.

Because the imposter's hint didn't point at *this* word, it gave them nothing to
bluff with and gave crewmates no signal. This rewrite replaces every hint with a
**single, concrete, lateral clue** in the spirit of a sample list Rehaan
provided (e.g. Beef burger→Chicken, Lamp→Shade, Necklace→Chain) — same world as
the word, but oblique enough to need a moment's thought.

## Decisions (confirmed with Rehaan)

- **Difficulty:** Bluff-able but oblique. A clued imposter can reason toward the
  topic and bluff, but the hint never hands them the word.
- **Adjectives:** Nouns / proper names preferred. A rare adjective is allowed
  **only** if it doesn't oversimplify the word (never a near-definition like
  apple→"red"/"fruit").
- **References:** Brands, names, and pop-culture used freely (apple→`Eve`,
  smoothie→`Instagram`, doctor→`Who`).

## The Hint Rubric

Every hint must satisfy ALL of:
1. **Exactly one word.** No phrases, no articles.
2. **Not a category label.** Never `food`, `furniture`, `a living thing`, etc.
   Specific to *this* word, not a class it belongs to.
3. **Not an adjective** (rare exception per above), and never a near-synonym that
   gives the word away outright.
4. **A real, traceable connection** via one of these levers:
   - **Origin / source:** beef burger→Cow, egg→Humpty, wool→Merino.
   - **Compound / wordplay:** lamp→Shade, basket→Picnic, knee→Jerk.
   - **Function / behaviour:** magnet→Fridge, casserole→Oven, umbrella→Poppins.
   - **Synonym (oblique) / cultural:** jug→Pitcher, apple→Eve, frog→Kermit.
5. **Oblique, not transparent.** It should take a beat to connect.
6. **No collisions:** no two words share a hint; a hint is never itself another
   word in the list.

## Approach (what was done)

Content-only rewrite of one data file — **no application code changed**. The
schema (`{ word, hint }`), loader (`src/lib/word-source.js`), and all screens are
untouched; the loader does no hint validation, so the format is unchanged.

- Rewrote all 517 hints in `common-nouns.json` per the rubric, words and order
  preserved, only `hint` values changed.
- Codified the rubric + worked examples as the spec
  (`02-development/workflow/02-specs/common-nouns-hints-spec.md`).
- Ran an automated lint (below) to enforce the mechanical rules.

## Files

- **Modified:** `02-development/workflow/03-builds/imposter-game-app/public/data/common-nouns.json`
  — every `hint` value.
- **Docs (this pipeline):** this plan; `01-brief/common-nouns-hints-brief.md`;
  `02-specs/common-nouns-hints-spec.md`.
- **Unchanged:** all `.svelte` / `.js`.

## Verification

1. **JSON validity:** parses as 517 objects, each with `word` + `hint`. ✓
2. **Lint (automated, passed):** no hint contains a space; no duplicate hints
   (case-insensitive); no banned category label; no hint equals a list word.
3. **Manual spot-check:** ~20 random entries reviewed for the oblique-but-fair feel.
4. **In-app smoke test (Rehaan runs `npm run dev`):** start a game on Common
   Nouns, confirm words load and the imposter sees the new one-word hint on the
   reveal screen across several rounds.

## Known judgement calls (flag for review)

A handful lean on niche references and may warrant Rehaan's eye: snow→Jon (GoT),
giraffe→Geoffrey (Toys R Us), roof→Fiddler, table→Arthur, wagon→Oregon,
violin→Nero, raspberry→Beret, slide→Helter. All are deliberate per "use
references freely," but are the most replaceable if any feel too obscure.
