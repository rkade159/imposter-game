// Word sources for the setup screen.
//
// Each round needs a secret word. Words come from static JSON files under
// public/data/, fetched at runtime. Each entry is a `{ word, hint }` object —
// the hint is the deliberately vague clue shown to the imposter. This module is
// the single place that knows which sources exist, how to load them, and how to
// pick an entry — so adding a new category later means adding one WORD_SOURCES
// entry plus its JSON file, with no changes to the setup screen.

// The available word sources. `file` is resolved relative to public/data/.
// `label` is what the dropdown shows; `countNoun` is the noun used in the
// "Loaded N ___" confirmation (e.g. "Loaded 644 common nouns").
export const WORD_SOURCES = [
  // "All Words" is special too: it has NO single `file`. Instead it `combines`
  // every other real deck into one list at load time (see loadWords), so there's
  // no generated all-words.json to keep in sync — the topic decks stay the single
  // source of truth. Listed first so it heads the dropdown, but it is NOT the
  // default (DEFAULT_WORD_SOURCE below pins that to common-nouns).
  {
    id: 'all-words',
    label: 'All Words',
    countNoun: 'words',
    combines: [
      'common-nouns.json',
      'islam.json',
      'movies-shows.json',
      'anime.json',
      'maths.json',
    ],
  },
  {
    id: 'common-nouns',
    label: 'Common Nouns (Auto-loaded)',
    file: 'common-nouns.json',
    countNoun: 'common nouns',
  },
  {
    id: 'islam',
    label: 'Islam',
    file: 'islam.json',
    countNoun: 'Islamic terms',
  },
  {
    id: 'movies-shows',
    label: 'Movies/Shows',
    file: 'movies-shows.json',
    countNoun: 'titles',
  },
  {
    id: 'anime',
    label: 'Anime',
    file: 'anime.json',
    countNoun: 'anime words',
  },
  {
    id: 'maths',
    label: 'Maths',
    file: 'maths.json',
    countNoun: 'maths terms',
  },
  // The custom list is special: it has NO `file`. Selecting it doesn't fetch
  // anything — the setup screen opens the Custom List builder instead, which
  // lets the user hand-pick a subset of the All Words deck for this round.
  // `loadWords` must therefore never be called with this id (see isCustomSource).
  {
    id: 'custom',
    label: 'Custom List',
    countNoun: 'custom words',
    custom: true,
  },
];

// The source selected by default when the setup screen first opens. Pinned to
// common-nouns by id (not WORD_SOURCES[0]) so adding/reordering sources — like
// the custom entry above — can't accidentally make 'custom' the default, which
// has no deck of its own until the user builds one.
export const DEFAULT_WORD_SOURCE = 'common-nouns';

// Whether a source id is the in-memory custom list rather than a fetchable file.
// The setup screen uses this to branch to the builder instead of loadWords().
export function isCustomSource(id) {
  return id === 'custom';
}

// Fetch the word list for a given source id from public/data/. Resolves to an
// array of `{ word, hint }` entry objects. Throws on an unknown id, a failed
// request, or a payload that isn't a JSON array — callers surface that as a load
// error and keep Start disabled rather than starting a game with no words.
// Individual entries are NOT validated here on purpose: a missing/blank hint is
// tolerated and degrades gracefully at display time, so one bad entry can't sink
// the whole deck.
export async function loadWords(sourceId) {
  const source = WORD_SOURCES.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error(`Unknown word source: ${sourceId}`);
  }

  // "All Words" (and any future aggregate) has no single file — it `combines`
  // several deck files. Fetch them all in parallel, flatten, and de-dupe by word
  // (case-insensitive, first occurrence wins so the earliest deck's hint stays).
  // Promise.all rejects if ANY file fails, so a partial deck never silently loads.
  if (source.combines) {
    const lists = await Promise.all(source.combines.map(fetchWordFile));
    const seen = new Set();
    const merged = [];
    for (const entry of lists.flat()) {
      const key = String(entry.word).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(entry);
    }
    return merged;
  }

  return fetchWordFile(source.file);
}

// Fetch and parse one `{ word, hint }[]` deck file from public/data/. Shared by
// the single-file path and the All Words merge above. BASE_URL (not a hardcoded
// "/") keeps the path correct under a sub-path deploy.
async function fetchWordFile(file) {
  const response = await fetch(`${import.meta.env.BASE_URL}data/${file}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${file}: ${response.status}`);
  }

  const words = await response.json();
  if (!Array.isArray(words)) {
    throw new Error(`Word source ${file} did not contain a JSON array`);
  }
  return words;
}

// Pick one random entry ({ word, hint }) from a loaded list. Pure — it doesn't
// mutate the input. (Kept named pickWord since the secret word is the point;
// callers read .word and .hint off the returned entry.)
export function pickWord(words) {
  return words[Math.floor(Math.random() * words.length)];
}
