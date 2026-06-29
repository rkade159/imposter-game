# Spec — Premade Word Decks (All Words, Islam, Movies/Shows, Anime, Maths)

## Source brief

[02-development/workflow/01-brief/premade-decks-brief.md](../01-brief/premade-decks-brief.md)

## Contract note

Per [technical-standards.md](../../references/technical-standards.md), this spec is a
**contract, not a blueprint** — it says WHAT must be true once built. It does not dictate
the exact word choices (the builder authors those within the content rules); it does pin
the registry shape, the All-Words merge behaviour, the Custom List repoint, and the
data-file format other code depends on.

## What must exist (deliverables)

The build extends the existing scaffold at
`02-development/workflow/03-builds/imposter-game-app/`.

| File | State after build |
|---|---|
| `public/data/islam.json` | **New.** `{ word, hint }[]`, ≥100 entries. |
| `public/data/movies-shows.json` | **New.** `{ word, hint }[]`, ≥100 entries. |
| `public/data/anime.json` | **New.** `{ word, hint }[]`, ≥100 entries. |
| `public/data/maths.json` | **New.** `{ word, hint }[]`, ≥100 entries. |
| `src/lib/word-source.js` | Five new `WORD_SOURCES` entries; `combines` merge+dedupe in `loadWords`. |
| `src/screens/CustomListBuilder.svelte` | `loadWords('common-nouns')` → `loadWords('all-words')`; comments updated. |

Files that must **not** be modified: `public/data/common-nouns.json`,
`src/screens/SetupScreen.svelte`, `src/lib/game-state.js`, the reveal/pass/results
screens, routing, `service-worker.js`, `vite.config.js`, `package.json`.

## Acceptance criteria

A build is "done" when **every** item below is true.

### Registry — `src/lib/word-source.js`

1. **`WORD_SOURCES` contains all seven sources** in this exact order:
   `all-words`, `common-nouns`, `islam`, `movies-shows`, `anime`, `maths`, `custom`.
2. **Labels** are exactly: `All Words`, `Common Nouns (Auto-loaded)`, `Islam`,
   `Movies/Shows`, `Anime`, `Maths`, `Custom List`.
3. **Each topic deck entry** (`islam`, `movies-shows`, `anime`, `maths`) has a `file`
   (`<id>.json`) and a `countNoun`. The `common-nouns` and `custom` entries are
   unchanged.
4. **`DEFAULT_WORD_SOURCE` is still `'common-nouns'`** — All Words is first in the
   dropdown but is NOT the default.
5. **The `all-words` entry has no single `file`**; it has a `combines` array listing the
   four topic files **and** `common-nouns.json`.

### All-Words loading (`loadWords`)

6. **`loadWords('all-words')` resolves to a merged `{ word, hint }[]`** built from every
   file in `combines`, fetched in parallel.
7. **De-duplicated by word**, case-insensitively, **keeping the first occurrence's**
   entry (and thus its hint). The result has no two entries whose `word` matches
   case-insensitively.
8. **Single-file decks are unaffected** — `loadWords('common-nouns')`, `loadWords('islam')`,
   etc. behave exactly as before (fetch one file, return its array).
9. **`loadWords('custom')` still must never be called** / still throws — the custom
   source has no file and no `combines`.
10. **Failure surfaces.** If any combined file fails to fetch/parse, `loadWords('all-words')`
    rejects (it must not silently drop a deck and resolve partial) — callers show the
    existing load error and keep Start disabled.

### Data files (each of `islam`, `movies-shows`, `anime`, `maths`)

11. **Valid JSON**, a flat array of objects each with non-empty string `word` and
    non-empty string `hint`. No trailing commas.
12. **≥100 entries** each.
13. **`word` is on-topic and specific** to the deck. Proper case and multi-word phrases
    allowed.
14. **`hint` is a single word** (no spaces) — a lateral association in the Common Nouns
    style, **not a definition**, **specific per entry**, and **not repeated** as a
    blanket hint across the deck. (Quality bar, reviewer's judgement.)
15. **No duplicate `word` within a single file.**
16. **Islam deck is broad & respectful** — pillars/observances/sites/concepts/prophets/
    history; nothing used disrespectfully. **Maths deck spans basics → A-level.**

### Custom List repoint (`src/screens/CustomListBuilder.svelte`)

17. **The builder loads `all-words`**, not `common-nouns`, for its candidate words — so
    its chips include words from every deck.
18. **Still only `word` is rendered, never `hint`.** Round-scoped/in-memory behaviour,
    Confirm/Back gating, and search are otherwise unchanged.
19. **Comments updated** so no stale comment claims the builder carves a subset of
    "Common Nouns" (it now carves from "All Words").

### Quality / build

20. **No new dependencies**; loading still uses `fetch`. Brief explanatory comment on the
    new `combines` branch.
21. **No console errors/warnings** in dev or preview; `npm run build` succeeds.

## What is NOT acceptance criteria (deferred)

- Editing/extending `common-nouns.json`.
- A generated/committed `all-words.json` (merge happens at load time).
- Deck management UI, persistence, per-deck settings, or new game-state fields.
- Visual/design changes to the dropdown or builder.

## Verification

1. `cd 02-development/workflow/03-builds/imposter-game-app && npm run dev`.
2. Setup → Word Source shows the 7 options in the spec order; **Common Nouns** is
   pre-selected and auto-loads as today.
3. Select each topic deck → "Loaded N …" shows N ≥ 100. Start a round → a `word`+`hint`
   reaches crewmate/imposter correctly.
4. Select **All Words** → N ≈ (sum of all decks − duplicates). Start a round; works.
5. Open **Custom List** → chips include topic words (`Naruto`, `Ramadan`, a maths term);
   only words shown, no hints. Pick a few, Confirm, Start → round works.
6. Spot-check ~8 entries per new deck for criterion 14/16 (single-word, specific,
   on-topic, respectful for Islam).
7. `npm run build` succeeds with no new errors/warnings.

If any of criteria 1–21 fails, the build is not done.
