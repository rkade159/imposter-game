// Central game state for the screen-based state machine.
//
// The setup screen fills this in: how many players, how many impostors, which
// word source was used, and the secret word picked for the round. That's
// everything the (still-stubbed) reveal screen needs to do its job. Future
// features (pass, discussion, results) extend the shape further as they land.
// The ready-vs-editing distinction in SetupScreen is derived from
// `playerCount !== null`, so no separate status flag is needed yet.
import { writable } from 'svelte/store';

const initial = {
  playerCount: null,
  impostorCount: null,
  wordSource: null,
  word: null,
};

export const gameState = writable({ ...initial });

// Returns the store to its initial shape. Used by the setup screen's
// "Change settings" button and (later) by a "New game" affordance on the
// results screen.
export function resetGame() {
  gameState.set({ ...initial });
}
