// Central game state for the screen-based state machine.
//
// `screen` decides which screen App.svelte renders. The setup screen fills in
// the round config (counts, word source, secret word) and calls startGame(),
// which turns that into a per-player roles array and hands off to the
// reveal → pass loop. revealIndex walks through every player; after the last
// reveal the loop ends at the discussion screen.
import { writable } from 'svelte/store';
import { shuffle } from './shuffle.js';

const initial = {
  screen: 'setup', // 'setup' | 'reveal' | 'pass' | 'discussion' | 'results'
  playerCount: null,
  impostorCount: null,
  wordSource: null,
  word: null,
  hint: null, // the vague clue shown to the imposter(s); shared by all imposters this round
  names: [], // names[i] = the custom name typed for player i ('' = use "Player i+1")
  roles: [], // roles[i] = { isImpostor } for player i; filled in by startGame()
  revealIndex: 0, // which player is currently revealing
};

export const gameState = writable({ ...initial });

// The label to show for player i: their typed name if they entered one, otherwise
// the positional "Player N" fallback. One rule, used by every screen so blank
// fields degrade consistently. Defensive against a short/missing names array.
export function displayName(names, i) {
  const typed = names?.[i];
  return (typeof typed === 'string' && typed.trim()) || `Player ${i + 1}`;
}

// Build the per-player roles array: impostorCount impostors and the rest
// crewmates, then shuffle so the impostor positions are random. roles[i] is
// player i's role. Crewmates "get the word" by reading gameState.word and
// impostors "get the hint" by reading gameState.hint, so only the impostor flag
// is stored per entry.
function buildRoles(playerCount, impostorCount) {
  const roles = [];
  for (let i = 0; i < playerCount; i++) {
    roles.push({ isImpostor: i < impostorCount });
  }
  return shuffle(roles);
}

// Start a round: commit the setup config, generate the shuffled roles, and move
// to the first player's reveal. Called by the setup screen's Start button.
export function startGame({ playerCount, impostorCount, wordSource, word, hint, names }) {
  gameState.set({
    screen: 'reveal',
    playerCount,
    impostorCount,
    wordSource,
    word,
    hint, // travels with the word for the round; the imposter reveal + results read it
    names: names ?? [], // custom player names; screens fall back via displayName()
    roles: buildRoles(playerCount, impostorCount),
    revealIndex: 0,
  });
}

// The current player has finished seeing their role. If players remain, go to
// the pass hand-off; otherwise every player has revealed, so move to discussion.
export function revealDone() {
  gameState.update((state) =>
    state.revealIndex < state.playerCount - 1
      ? { ...state, screen: 'pass' }
      : { ...state, screen: 'discussion' }
  );
}

// Hand-off complete: advance to the next player and show their reveal.
export function nextPlayer() {
  gameState.update((state) => ({
    ...state,
    revealIndex: state.revealIndex + 1,
    screen: 'reveal',
  }));
}

// The discussion is over and the table wants the answer: show the results
// screen. Only the screen changes — the round data (roles, word) is left intact
// so ResultsScreen can read who the impostors were and what the word was.
export function showResults() {
  gameState.update((state) => ({ ...state, screen: 'results' }));
}

// Play another round with the SAME group: go back to setup but KEEP the player
// count, impostor count, word source, and names so the form comes back pre-filled.
// The per-round data (roles, revealIndex) and the previous word + hint are cleared
// — a fresh word and hint are picked when Start is pressed again. (Spreading
// `initial` resets screen/word/hint/roles/revealIndex, then we restore the kept
// settings.)
export function playAgain() {
  gameState.update((state) => ({
    ...initial,
    playerCount: state.playerCount,
    impostorCount: state.impostorCount,
    wordSource: state.wordSource,
    names: state.names,
  }));
}

// Hard reset: returns the store to its full initial shape (back to setup at
// defaults, clearing the settings too). No screen calls this after the results
// feature — playAgain() is the settings-preserving restart — but it's kept for a
// future Settings menu's "reset to defaults".
export function resetGame() {
  gameState.set({ ...initial });
}
