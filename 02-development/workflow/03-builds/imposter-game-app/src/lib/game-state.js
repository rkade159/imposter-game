// Central game state for the screen-based state machine.
//
// Initial shape is intentionally minimal — only the fields the setup screen
// needs. Future features (reveal, pass, discussion, results) extend the shape
// as they land. The ready-vs-editing distinction in SetupScreen is derived
// from `playerCount !== null`, so no separate status flag is needed yet.
import { writable } from 'svelte/store';

const initial = { playerCount: null };

export const gameState = writable({ ...initial });

// Returns the store to its initial shape. Used by the setup screen's
// "Change settings" button and (later) by a "New game" affordance on the
// results screen.
export function resetGame() {
  gameState.set({ ...initial });
}
