// The end-of-round "imposter reveal" styles offered in Settings.
//
// Mirrors reveal-styles.js, but for the RESULTS screen rather than the per-player
// role reveal — a deliberately separate list (and a separate `resultsRevealStyle`
// setting) so the two never entangle. A single source of truth that both the
// Settings selector (for its options) and ResultsScreen (for which branch to
// render) read from, so the two never drift apart. Adding a new results-reveal
// animation is a one-line entry here, plus its branch in ResultsScreen.svelte.
//
// `id` is the value stored in settings (`resultsRevealStyle`); `label` is what the
// selector shows.
export const RESULTS_REVEALS = [
  { id: 'static', label: 'Static — just show the results' },
  { id: 'spotlight', label: 'Spotlight — hunt for the imposter in the dark' },
];

// The default results reveal for new players and any unknown/legacy stored value.
// Stays 'static' so existing behaviour is unchanged unless a player opts in.
export const DEFAULT_RESULTS_REVEAL = 'static';
