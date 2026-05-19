// Game state store stub.
//
// Will hold the central writable store that drives the screen state machine
// (setup → reveal → pass → discussion → results). Empty for now — the real
// state model lands in its own brief once setup/reveal screens are designed.
import { writable } from 'svelte/store';

export const gameState = writable(null);
