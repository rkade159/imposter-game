// Roles configuration — which optional roles are in play, persisted across rounds.
//
// Deliberately SEPARATE from settings.js: the roster of roles is its own concept
// (it has its own "Roles" screen, reached from the setup screen), not an app
// setting. The storage mechanics, though, are identical to settings.js — a single
// writable that loads from localStorage on startup and writes back on every change
// — so a toggle flipped once stays flipped. Key is distinct from imposter:settings.
import { writable } from 'svelte/store';

const STORAGE_KEY = 'imposter:roles';

// Defaults for every optional role. Crewmate and Imposter are always-on and so
// are NOT represented here — only roles the user can turn on/off live in this
// store. load() merges these under the stored value, so a role added in a later
// release picks up its default for users who saved before it existed.
const defaults = {
  // Jester: when on, one player per round is the Jester (sees the real word like a
  // crewmate, but wins by getting voted out). Off by default. Only takes effect on
  // a non-troll round with enough players — see JESTER_MIN_PLAYERS / startGame().
  jesterEnabled: false,
  // Prosecutor: when on, ONE of the round's imposters becomes the Prosecutor — an
  // imposter (gets the hint, not the word) who is secretly told one crewmate-type
  // player to get voted out to win. Occupies an existing imposter slot, doesn't add
  // one. Off by default. Only on a non-troll round with enough players — see
  // PROSECUTOR_MIN_PLAYERS / startGame().
  prosecutorEnabled: false,
  // Lawyer: the mirror of the Prosecutor. When on, ONE crewmate becomes the Lawyer —
  // a crewmate (gets the word like any crewmate) secretly assigned one imposter-aligned
  // "client" (a plain imposter OR the Prosecutor) to protect; they win WITH the imposters
  // if their client is NOT voted out. The Lawyer is never told the client is an imposter.
  // Occupies an existing crewmate slot, doesn't add one. Off by default. Only on a
  // non-troll round with enough players — see LAWYER_MIN_PLAYERS / startGame().
  lawyerEnabled: false,
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

export const rolesConfig = writable(load());

// Persist on every change. Guarded so a storage failure (private mode, quota)
// never throws into the app.
rolesConfig.subscribe((value) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {}
});
