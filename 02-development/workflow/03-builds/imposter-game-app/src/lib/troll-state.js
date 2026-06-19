// Cross-round bookkeeping for Troll Mode (troll-mode.js).
//
// Separate from settings.js on purpose: settings.js holds the user's CHOICE
// (which troll mode), while this holds the derived state the roll needs between
// rounds — what mode last ran, whether the last round was a troll round (so
// Sneaky never fires twice in a row), and how many rounds since the last hit (so
// Building's odds can climb). Persisted with the same localStorage pattern as
// settings.js so "never twice in a row" and the rising Building odds survive
// app reloads, matching the feature's "persists until turned off" promise.
import { writable } from 'svelte/store';
import { DEFAULT_TROLL_MODE } from './troll-mode.js';

const STORAGE_KEY = 'imposter:troll-state';

const defaults = {
  lastMode: DEFAULT_TROLL_MODE, // trollMode seen on the previous round
  lastWasTroll: false, // was the previous round a troll round?
  roundsSinceTroll: 0, // non-troll rounds since the last hit (drives Building)
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export const trollState = writable(load());

// Persist on every change. Guarded so storage failure (private mode, quota)
// never throws into the game.
trollState.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
});
