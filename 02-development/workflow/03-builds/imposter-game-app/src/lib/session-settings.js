// Session-only user settings — the same idea as settings.js, but deliberately
// NOT persisted.
//
// Anything in this store lives in memory for the current app session only: it is
// never written to localStorage, so a fresh launch (or reload) always starts from
// the defaults below. Use this for toggles that should NOT linger across launches
// — in contrast to settings.js, which persists across sessions.
import { writable } from 'svelte/store';

// Defaults for every session-only setting. Adding a future one is a one-line change.
export const sessionSettings = writable({
  // Anti-Yusuf: when on, pressing Start refuses to begin the round and instead
  // calls out the last player to pass to. Intentionally not persisted, so it can
  // never be left on by accident across launches.
  antiYusuf: false,
});
