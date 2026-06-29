# Brief — Premade Word Decks (All Words, Islam, Movies/Shows, Anime, Maths)

## Source plan

[~/.claude/plans/to-brainstorm-an-idea-delegated-alpaca.md] (session plan — adds
premade topic decks plus an aggregate "All Words" deck and repoints the Custom List
builder at it).

## What to build

Four new **premade topic decks** plus one **aggregate deck**, added to the Setup
screen's **Word Source** dropdown. Today only `Common Nouns (Auto-loaded)` and
`Custom List` exist. After this build the dropdown reads, in order:

- **All Words** — every other deck merged into one, de-duplicated.
- **Common Nouns (Auto-loaded)** — unchanged; **stays the default**.
- **Islam**
- **Movies/Shows**
- **Anime**
- **Maths**
- **Custom List**

Each new topic deck (`Islam`, `Movies/Shows`, `Anime`, `Maths`) is a static
`{ word, hint }[]` JSON file with **≥100 entries**. The **Custom List** builder, which
today carves a subset out of Common Nouns, must instead source its candidate words from
**All Words** — so a custom round can include any word from any deck.

## Why this is being built now

1. **Variety + theming.** Groups can run a themed round (anime night, maths revision,
   an Islam-knowledge round) instead of always drawing from general nouns.
2. **It reuses existing machinery.** A deck is just a `{ word, hint }[]`; `pickWord`
   and the entire reveal/results path work **unchanged**. Adding a normal deck is one
   `WORD_SOURCES` entry + one JSON file — the setup screen iterates the registry
   generically and needs no edits.
3. **All Words makes Custom List far more useful.** Pointing the builder at the merged
   deck lets users hand-pick across every topic from one place.

## Content rules (the words and hints)

- **Words:** proper case and multi-word phrases are allowed (`Naruto`, `One Piece`,
  `Pythagoras' Theorem`, `Surah Al-Fatihah`) — unlike Common Nouns, which is lowercase
  single words. Each entry must be **specific to its deck's topic**.
- **Hints:** **single word only**, matching the existing Common Nouns style — a clever,
  lateral, one-word association, **not a definition**. Study the existing deck first:
  `apple→Eve`, `bath→Archimedes`, `bridge→Troll`, `bus→Rosa`, `box→Pandora`. Hints must
  be **specific per word** and **not repeat** across a deck (don't hint every anime with
  "Anime"). Not too obvious, not too obscure.
- **Islam deck — broad & respectful.** Pillars, observances, holy sites, key concepts,
  prophets, history (e.g. Ramadan, Hajj, Kaaba, Qibla, Zakat, Tawheed, Wudu). Nothing
  is used disrespectfully as a "secret word."
- **Maths deck — school basics → A-level.** Span easy (fraction, angle, prime) to
  harder (differentiation, trigonometry, vectors, double-angle).
- **Anime deck** — a mix of titles, characters, and signature moves
  (`One Piece`, `Vegeta`, `Naruto`, `Getsuga Tensho`).
- **Movies/Shows deck** — a mix of film and TV titles; characters allowed.

## How it works (the core flow)

`WORD_SOURCES` in `word-source.js` is the single registry. Each normal deck has a
`file`; `loadWords(id)` fetches `public/data/<file>` and returns the array. The setup
dropdown already renders every registry `label` and loads the selected source's file —
so the four topic decks need **no setup-screen changes**.

**All Words** is the one special case: it has no single file. Its registry entry carries
a `combines` array listing the component files. `loadWords` detects `combines`, fetches
all listed files in parallel, flattens them, and **de-dupes by lowercased word (first
occurrence wins)** before returning. This keeps a single source of truth — no generated
file to keep in sync.

**Custom List** changes by one line: the builder's `loadWords('common-nouns')` becomes
`loadWords('all-words')`, so its candidate chips come from the merged deck. The builder
still shows **only `word`, never `hint`**, and stays round-scoped/in-memory.

## Scope

**In scope:**

- **New data files** — `public/data/islam.json`, `movies-shows.json`, `anime.json`,
  `maths.json`. Same `[{ "word", "hint" }]` shape as `common-nouns.json`, ≥100 entries
  each, valid JSON (no trailing commas).
- **Register decks** —
  [src/lib/word-source.js](../03-builds/imposter-game-app/src/lib/word-source.js): add
  the five new `WORD_SOURCES` entries in dropdown order (All Words first, then the four
  topic decks before Custom List). `DEFAULT_WORD_SOURCE` stays `'common-nouns'`. Add the
  `combines` merge + de-dupe branch to `loadWords`.
- **Repoint Custom List** —
  [src/screens/CustomListBuilder.svelte](../03-builds/imposter-game-app/src/screens/CustomListBuilder.svelte):
  `loadWords('common-nouns')` → `loadWords('all-words')`; update the comments that say
  it carves a subset of "Common Nouns" to say "All Words".
- Code follows [technical-standards.md](../../references/technical-standards.md): plain,
  no new dependencies, a brief comment on each new block, "imposter(s)" spelling.

**Out of scope (do NOT build here):**

- Any change to `common-nouns.json` itself (it stays exactly as is).
- Setup-screen, game-state, reveal/pass/results, routing, Capacitor, or
  service-worker changes.
- Persisting decks, deck management/editing UI, or per-deck settings.
- A generated/committed `all-words.json` file — All Words is merged at load time.

## Where the build lives

The existing scaffold at `02-development/workflow/03-builds/imposter-game-app/`.

| File | Change |
|---|---|
| `public/data/islam.json` | **New** — ≥100 `{word,hint}` Islamic-topic entries. |
| `public/data/movies-shows.json` | **New** — ≥100 film/TV entries. |
| `public/data/anime.json` | **New** — ≥100 anime title/character/move entries. |
| `public/data/maths.json` | **New** — ≥100 maths-term entries (basics → A-level). |
| `src/lib/word-source.js` | Five new `WORD_SOURCES` entries; `combines` merge+dedupe in `loadWords`. |
| `src/screens/CustomListBuilder.svelte` | `loadWords('common-nouns')` → `'all-words'`; update comments. |

## Verification (smoke test — Rehaan runs `npm run dev`)

1. Dropdown shows the 7 sources in order; default selected = **Common Nouns**.
2. Each topic deck loads with a sensible "Loaded N …" count (≥100).
3. **All Words** loads ≈ sum of decks minus duplicates; a round starts with a word+hint.
4. **Custom List** chips now include topic words (`Naruto`, `Ramadan`, etc.); pick a
   few, start, confirm a round works.
5. Spot-check entries per deck: hint is a single word, specific, on-topic, not too
   obvious; Islam entries read respectfully.
6. `npm run build` succeeds with no new errors/warnings.

## Next step

This brief feeds
[02-development/workflow/02-specs/premade-decks-spec.md](../02-specs/premade-decks-spec.md),
which converts it into an acceptance-criteria contract for the build.
