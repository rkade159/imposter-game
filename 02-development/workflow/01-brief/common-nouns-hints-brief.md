# Brief — Rewrite Common Nouns hints

## Source plan

[01-plan/plans/common-nouns-hints-plan-final.md](../../../01-plan/plans/common-nouns-hints-plan-final.md)

## What to build

Rewrite every `hint` in the **Common Nouns** deck
([src/.../public/data/common-nouns.json](../03-builds/imposter-game-app/public/data/common-nouns.json),
517 `{ word, hint }` entries) so each hint is a **single, concrete, lateral
clue** about that specific word — replacing the current broad category labels.

This is a **content-only** change. The `{ word, hint }` schema, the loader
([src/lib/word-source.js](../03-builds/imposter-game-app/src/lib/word-source.js)),
and every screen stay exactly as they are. Only `hint` strings change; `word`
values and their order are preserved.

## Why this is being built now

Playtesting found the hints too vague to be fun. They describe a **category**,
not the word: 60+ entries share the literal hint `"food"`, and large clusters
collapse to `"a living thing"`, `"something you wear"`, `"part of the body"`,
`"found in a kitchen"`. A hint that fits hundreds of words gives the imposter
nothing to bluff with and crewmates no signal. Replacing each with a word-specific
lateral clue (lamp→`Shade`, necklace→`Locket`, beef→`Cow`) makes the imposter's
job a real, winnable bluff.

## The rule each hint must follow

1. **Exactly one word**, no articles/phrases.
2. **Not a category label** (`food`, `furniture`, `a tool`…). Specific to *this*
   word.
3. **Not an adjective** — nouns / proper names only; a rare adjective is allowed
   **only** if it doesn't oversimplify the word. Never a near-definition.
4. **A real connection** by origin (egg→`Humpty`), compound/wordplay
   (lamp→`Shade`), function (magnet→`Fridge`), or oblique synonym/culture
   (apple→`Eve`).
5. **Oblique** — should take a beat; never effectively the answer.
6. **No collisions** — no duplicate hints; no hint equal to another list word.

Difficulty target: **bluff-able but oblique**. References (brands, names,
pop-culture) are **used freely**.

## Scope

**In scope:**
- Rewrite all 517 `hint` values in `common-nouns.json` to satisfy the rubric.

**Out of scope (do NOT touch):**
- The `{ word, hint }` schema, `word` values, or entry order.
- `word-source.js`, `game-state.js`, any `.svelte` screen, routing, the custom
  word-list builder, Capacitor, or the service worker.
- Adding/removing words, or any other word source (`custom`, etc.).

## Where the build lives

| File | Change |
|---|---|
| `src/.../public/data/common-nouns.json` | Rewrite every `hint`; keep `word` + order. |

## Verification (smoke test — Rehaan runs `npm run dev`)

1. **Validity/lint (automated):** file parses as 517 `{ word, hint }`; no hint has
   a space; no duplicate hints; no category labels; no hint equals a list word.
2. **In-app:** start a game on **Common Nouns**; across several rounds the imposter
   sees a **single-word** hint on the reveal screen, and it reads as an oblique
   clue (not a category).
3. **Build:** `npm run build` succeeds with no new errors/warnings.

## Next step

This brief feeds
[02-development/workflow/02-specs/common-nouns-hints-spec.md](../02-specs/common-nouns-hints-spec.md),
the authoritative rubric + worked examples for the rewrite.
