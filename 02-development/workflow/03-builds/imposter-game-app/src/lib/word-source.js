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
  {
    id: 'common-nouns',
    label: 'Common Nouns (Auto-loaded)',
    file: 'common-nouns.json',
    countNoun: 'common nouns',
  },
];

// The source selected by default when the setup screen first opens.
export const DEFAULT_WORD_SOURCE = WORD_SOURCES[0].id;

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

  // BASE_URL (not a hardcoded "/") keeps the path correct under a sub-path deploy.
  const response = await fetch(`${import.meta.env.BASE_URL}data/${source.file}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${source.file}: ${response.status}`);
  }

  const words = await response.json();
  if (!Array.isArray(words)) {
    throw new Error(`Word source ${source.file} did not contain a JSON array`);
  }
  return words;
}

// Pick one random entry ({ word, hint }) from a loaded list. Pure — it doesn't
// mutate the input. (Kept named pickWord since the secret word is the point;
// callers read .word and .hint off the returned entry.)
export function pickWord(words) {
  return words[Math.floor(Math.random() * words.length)];
}
