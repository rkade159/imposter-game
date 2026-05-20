// Word sources for the setup screen.
//
// Each round needs a secret word. Words come from static JSON files under
// public/data/, fetched at runtime. This module is the single place that knows
// which sources exist, how to load them, and how to pick a word — so adding a
// new category later means adding one WORD_SOURCES entry plus its JSON file,
// with no changes to the setup screen.

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
// array of word strings. Throws on an unknown id, a failed request, or a
// payload that isn't a JSON array — callers surface that as a load error and
// keep Start disabled rather than starting a game with no words.
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

// Pick one random word from a loaded list. Pure — it doesn't mutate the input.
export function pickWord(words) {
  return words[Math.floor(Math.random() * words.length)];
}
