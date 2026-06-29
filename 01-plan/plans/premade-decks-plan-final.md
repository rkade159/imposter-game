# Plan: Premade Word Decks (All Words + Islam, Movies/Shows, Anime, Maths)

Status: **final** (built — pending Rehaan's `npm run dev` smoke test)

## Context

The Imposter app drew each round's secret word from one of only two sources in the
Word Source dropdown: **Common Nouns** (517 entries, auto-loaded) and **Custom List**
(hand-pick a subset). Rehaan wanted more variety and the ability to theme a round —
anime night, maths revision, an Islam-knowledge round — so this adds four premade topic
decks plus an aggregate **All Words** deck.

Two behavioural changes beyond just adding data:
1. **All Words** = every other deck merged into one (Common Nouns + Islam + Movies/Shows
   + Anime + Maths), de-duplicated by word.
2. **Custom List** now sources its candidate words from **All Words** instead of Common
   Nouns, so a custom round can pull any word from any deck.

Final dropdown order: **All Words**, **Common Nouns (Auto-loaded)** ← default, **Islam**,
**Movies/Shows**, **Anime**, **Maths**, **Custom List**.

### Decisions (confirmed with user)
- **Deck words:** proper case + multi-word phrases allowed (`Naruto`, `One Piece`,
  `Pythagoras`, `Surah` etc.) — unlike the lowercase single-word Common Nouns.
- **Hints:** **single word only**, matching the existing Common Nouns style — a clever,
  lateral, one-word association, not a definition (`apple→Eve`, `bath→Archimedes`).
  Specific per entry, not repeated as a blanket hint across a deck.
- **Islam deck:** broad & respectful — pillars, observances, holy sites, key concepts,
  prophets (incl. Muhammad, hint `Seal`), history. Divine names kept out as guessable
  words; nothing used disrespectfully.
- **Maths deck:** mixed range, school basics → A-level.
- **All Words:** include Common Nouns too; **de-dupe** by word (case-insensitive, first
  occurrence's hint kept).
- **Counts:** ≥100 entries each for the four topic decks.

## Existing pieces reused (not rebuilt)
- `WORD_SOURCES`, `loadWords(id)`, `pickWord(words)` in
  `02-development/workflow/03-builds/imposter-game-app/src/lib/word-source.js`. Each deck
  is a normal `{ word, hint }[]`, so `pickWord` and the whole reveal/results path work
  unchanged. Adding a normal deck = one registry entry + one JSON file; the setup screen
  iterates `WORD_SOURCES` generically and needed **no edits**.
- `CustomListBuilder.svelte` — only its source id changed; its UI, round-scoping, and
  "show `word` never `hint`" rule are untouched.

## Approach (as built)

### 1. New data files — `public/data/`
Four files, same `[{ word, hint }]` shape as `common-nouns.json`:
`islam.json` (124), `movies-shows.json` (128), `anime.json` (123), `maths.json` (123).
Each entry on-topic with a single-word lateral hint in the Common Nouns spirit.

### 2. Register decks + All-Words merge — `src/lib/word-source.js`
Added the five new `WORD_SOURCES` entries in the dropdown order above;
`DEFAULT_WORD_SOURCE` stays `'common-nouns'`. The **All Words** entry has no single
`file` — instead a `combines: [...]` array listing the five deck files. `loadWords` was
extended: when a source has `combines`, it fetches all listed files in parallel
(`Promise.all`), flattens, and de-dupes by lowercased word (first wins) before returning.
A shared `fetchWordFile()` helper backs both the single-file and combined paths. This
keeps the topic decks the single source of truth — no generated `all-words.json` to sync.

### 3. Repoint Custom List — `src/screens/CustomListBuilder.svelte`
Changed the builder's `loadWords('common-nouns')` → `loadWords('all-words')` so its chips
draw from every deck; updated the surrounding comments. Only `word` is still ever shown.

## Files
- `public/data/islam.json`, `movies-shows.json`, `anime.json`, `maths.json` — **new**.
- `src/lib/word-source.js` — five new `WORD_SOURCES` entries; `combines` merge+dedupe in
  `loadWords` (+ `fetchWordFile` helper).
- `src/screens/CustomListBuilder.svelte` — source id + comments.

No changes to `common-nouns.json`, `SetupScreen.svelte`, `game-state.js`, the
reveal/results screens, routing, or the service worker.

## Verification (run `npm run dev`)
1. Dropdown shows the 7 sources in order; Common Nouns pre-selected and auto-loads.
2. Each topic deck loads ≥100; **All Words** loads ~1012 (sum minus cross-deck dups);
   start a round → a word+hint reaches crewmate/imposter.
3. **Custom List** chips now include topic words (`Naruto`, `Ramadan`, a maths term);
   pick a few, Confirm, Start → round works; only words shown, no hints.
4. Spot-check ~8 entries per deck: hint is a single word, specific, on-topic; Islam reads
   respectfully.

Build-time checks already passed: all five JSON files parse; no duplicate words within a
file; every hint is a single token and never equals its word; All Words merges to 1012
unique (3 cross-deck duplicates removed); `npm run build` succeeds with no warnings.

## Pipeline artifacts
1. Brief: `02-development/workflow/01-brief/premade-decks-brief.md`
2. Spec: `02-development/workflow/02-specs/premade-decks-spec.md`
3. Build: `02-development/workflow/03-builds/imposter-game-app/`
