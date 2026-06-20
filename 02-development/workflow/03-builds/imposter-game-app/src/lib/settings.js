// App-wide user preferences, persisted across sessions.
//
// Mirrors the gameState store pattern (game-state.js) but for settings that
// outlive a single round and belong in the Settings screen. The store is the
// single source of truth; it loads from localStorage on startup and writes back
// on every change, so a toggle the user flips once stays flipped.
import { writable } from 'svelte/store';
import { DEFAULT_REVEAL_STYLE } from './reveal-styles.js';
import { DEFAULT_TROLL_MODE } from './troll-mode.js';

const STORAGE_KEY = 'imposter:settings';

// Defaults for every setting. Adding a future toggle is a one-line change here.
// load() merges these under the stored value, so a setting added in a later
// release picks up its default for users who saved settings before it existed,
// and any unknown/legacy stored keys are simply ignored.
const defaults = {
  // Grayscale mode: strips colour from the whole app so no one can infer the
  // imposter from the red reveal card by glance or reflection. See app.css.
  grayscale: false,

  // Reveal style: which role-reveal animation the reveal screen uses. The set of
  // values lives in reveal-styles.js; the reveal screen branches on this id and
  // falls back to the original for anything it doesn't recognise. Persists across
  // rounds.
  revealStyle: DEFAULT_REVEAL_STYLE,

  // Reveal fellow imposters: when on, each imposter's reveal also lists the OTHER
  // imposters by name. Only has any effect with 2+ imposters (with one there are
  // no others to show). The reveal screen gates on this; here it just persists.
  showFellowImposters: false,

  // Imposter hints: when on (default), the imposter is shown a vague hint instead
  // of the word, as always. Turn off to withhold it — the imposter then learns
  // only THAT they're the imposter, making the round harder for them. The reveal
  // screen gates the hint display on this (reveal-time, so it also covers Troll
  // Mode rounds); here it just persists across rounds.
  enableImpostorHint: true,

  // Troll Mode: occasionally turns a whole round into chaos where everyone is the
  // imposter. The set of values lives in troll-mode.js; the setup screen rolls
  // against it each round. Persists across rounds (Guaranteed turns itself off
  // after firing). See troll-state.js for the cross-round counters.
  trollMode: DEFAULT_TROLL_MODE,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    // No storage (or corrupt JSON) — fall back to defaults rather than break.
    return { ...defaults };
  }
}

export const settings = writable(load());

// Persist on every change. Guarded so a storage failure (private mode, quota)
// never throws into the app.
settings.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
});
