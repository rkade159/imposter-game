// Troll Mode: occasionally a whole round is turned into chaos where EVERY player
// is secretly told they're the imposter, so each one thinks they're the lone
// imposter and everyone else is a crewmate. The mode is chosen in Settings and
// persists across rounds (see settings.js for the chosen mode and troll-state.js
// for the cross-round counters this logic reads/writes).
//
// This module is the single source of truth for the feature: the option list the
// Settings selector renders, the per-round "does it fire?" decision, and the
// per-player hint picker. Mirrors reveal-styles.js / word-source.js — one list
// both the selector and the game logic read, so they never drift.

// `id` is the value stored in settings (`trollMode`); `label` is what the
// selector shows. The reveal/results screens never branch on these — the roll
// below resolves a mode into a plain yes/no per round.
export const TROLL_MODES = [
  { id: 'off', label: 'Off' },
  { id: 'sneaky', label: 'Sneaky — rare surprise chaos' },
  { id: 'building', label: 'Building — odds rise each round' },
  { id: 'guaranteed', label: 'Guaranteed — next round only' },
];

// The default for new players and any unknown/legacy stored value: no chaos.
export const DEFAULT_TROLL_MODE = 'off';

// Tunable odds, kept here so balancing the feel is a one-place edit.
const SNEAKY_CHANCE = 0.1; // flat per-round chance in Sneaky mode
const BUILDING_BASE = 0.04; // Building mode's starting per-round chance
const BUILDING_STEP = 0.04; // added per non-troll round in Building mode
const BUILDING_CAP = 0.45; // ceiling so Building never feels guaranteed

// Decide whether the round about to start is a troll round, and return the
// updated cross-round state to persist. Pure (rng is injectable) so it's unit
// testable. `state` is troll-state.js's shape:
//   { lastMode, lastWasTroll, roundsSinceTroll }
// Returns { isTroll, nextState, disableMode }. `disableMode` true means the
// caller should flip the Settings mode back to 'off' (Guaranteed fires once).
//
// `justEnabled` (mode changed since the last round) forces the immediately-next
// round to be normal for the probabilistic modes — honouring "never on the round
// you turn it on", so the surprise always lands on some later round. Guaranteed
// deliberately ignores that and fires right away.
export function rollTroll(mode, state, rng = Math.random) {
  const prev = state ?? {};
  const lastMode = prev.lastMode ?? DEFAULT_TROLL_MODE;
  const lastWasTroll = prev.lastWasTroll === true;
  const roundsSinceTroll = Number.isFinite(prev.roundsSinceTroll)
    ? prev.roundsSinceTroll
    : 0;
  const justEnabled = mode !== lastMode;

  let isTroll = false;
  let disableMode = false;

  switch (mode) {
    case 'sneaky':
      // Flat chance, but never two troll rounds back to back, and not on enable.
      isTroll = !justEnabled && !lastWasTroll && rng() < SNEAKY_CHANCE;
      break;
    case 'building': {
      // Chance climbs each non-troll round (it resets via roundsSinceTroll → 0
      // below), capped so it stays a surprise rather than a certainty.
      const chance = Math.min(
        BUILDING_BASE + roundsSinceTroll * BUILDING_STEP,
        BUILDING_CAP
      );
      isTroll = !justEnabled && rng() < chance;
      break;
    }
    case 'guaranteed':
      // The next round IS the troll round; then ask the caller to turn it off.
      isTroll = true;
      disableMode = true;
      break;
    case 'off':
    default:
      isTroll = false;
  }

  const nextState = {
    lastMode: mode,
    lastWasTroll: isTroll,
    // Reset the streak on a hit so Building's odds drop back to the base.
    roundsSinceTroll: isTroll ? 0 : roundsSinceTroll + 1,
  };

  return { isTroll, nextState, disableMode };
}

// Pick `count` hints for a troll round — one per player — from a loaded word list
// (the `{ word, hint }` entries from word-source.js). Each player gets their OWN
// hint (not the shared round hint) so the table can't tell it's a troll round by
// comparing clues. Tries to keep them distinct for variety, but repeats rather
// than failing when the usable pool is smaller than the table. A null entry (no
// usable hints at all) degrades to the reveal card's existing error fallback.
export function buildTrollHints(words, count, rng = Math.random) {
  const pool = (Array.isArray(words) ? words : [])
    .map((entry) => (typeof entry?.hint === 'string' ? entry.hint.trim() : ''))
    .filter((hint) => hint.length > 0);

  const result = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    if (pool.length === 0) {
      result.push(null);
      continue;
    }
    let hint = pool[Math.floor(rng() * pool.length)];
    // Re-roll a few times for an unused hint; accept a repeat once the pool is
    // exhausted or we've simply been unlucky.
    for (let tries = 0; tries < 8 && used.has(hint) && used.size < pool.length; tries++) {
      hint = pool[Math.floor(rng() * pool.length)];
    }
    used.add(hint);
    result.push(hint);
  }
  return result;
}
