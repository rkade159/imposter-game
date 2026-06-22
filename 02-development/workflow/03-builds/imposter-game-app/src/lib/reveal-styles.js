// The role-reveal animation styles offered in Settings.
//
// Mirrors the word-source.js pattern: a single list that both the Settings
// selector (for its options) and the reveal screen (for which branch to render)
// read from, so the two never drift apart. Adding a new reveal animation is a
// one-line entry here, plus its branch in RevealScreen.svelte and the persisted
// default below if it should become the default.
//
// `id` is the value stored in settings (`revealStyle`); `label` is what the
// selector shows.
export const REVEAL_STYLES = [
  { id: 'original', label: 'Classic — tap to reveal' },
  { id: 'envelope', label: 'Secret letter — hold to open' },
  { id: 'wheel', label: 'Wheel of Fate — hold to spin & stop' },
  { id: 'card-grid', label: 'Choose a Card — tap one of nine to flip it' },
  { id: 'peek', label: 'Peek under — swipe up & hold' },
];

// The default reveal style for new players and any unknown/legacy stored value.
export const DEFAULT_REVEAL_STYLE = 'original';
