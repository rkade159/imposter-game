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
  isTroll: false, // Troll Mode round: everyone is an imposter (see startGame / troll-mode.js)
  hasJester: false, // Jester round: one player is the Jester (see startGame / roles-config.js)
  hasProsecutor: false, // Prosecutor round: one imposter is the Prosecutor (see startGame / roles-config.js)
  hasLawyer: false, // Lawyer round: one crewmate is the Lawyer (see startGame / roles-config.js)
  roles: [], // roles[i] = { isImpostor[, isProsecutor, targetIndex][, isJester][, isLawyer, clientIndex][, hint] } for player i; filled in by startGame()
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

// Build the per-player roles array: impostorCount impostors, one jester when
// hasJester, and the rest crewmates, then shuffle so positions are random.
// roles[i] is player i's role. Crewmates AND the jester "get the word" by reading
// gameState.word; impostors "get the hint" by reading gameState.hint — so only the
// role flags are stored per entry. The jester is NOT an imposter (isImpostor:false)
// but reveals as its own role, so reveal/results check isJester before the split.
//
// hasProsecutor: when on, ONE of the impostorCount imposters is the Prosecutor — it
// OCCUPIES an existing imposter slot (still isImpostor:true), it does not add one. The
// Prosecutor is told a secret target to get voted out; that target is picked AFTER the
// shuffle (below) from the crewmate-type players (anyone with isImpostor:false, i.e.
// crewmates and the jester), so it's never a fellow imposter and never the prosecutor.
// reveal/results check isProsecutor before the imposter split.
//
// hasLawyer: when on, ONE crewmate is the Lawyer — the MIRROR of the Prosecutor. It
// OCCUPIES an existing crewmate slot (still isImpostor:false, never the jester), it does
// not add one. The Lawyer is secretly assigned a "client" to protect; that client is
// picked AFTER the shuffle (below) from the imposter-aligned players (anyone with
// isImpostor:true, i.e. plain imposters AND the prosecutor), stored as clientIndex. The
// Lawyer reveals as a crewmate (sees the word) with an added note — there is no separate
// reveal branch — so only reveal/results read isLawyer/clientIndex, not the role split.
function buildRoles(playerCount, impostorCount, hasJester = false, hasProsecutor = false, hasLawyer = false) {
  const roles = [];
  // Lay out imposters first, then the single jester (when on), then crewmates fill
  // the rest — the shuffle below scatters them, so the order here is just bookkeeping.
  // The first imposter is flagged as the prosecutor when on (the shuffle randomises
  // which player ends up with it, just like every other role).
  const jesterCount = hasJester ? 1 : 0;
  for (let i = 0; i < playerCount; i++) {
    if (i < impostorCount) {
      roles.push(hasProsecutor && i === 0 ? { isImpostor: true, isProsecutor: true } : { isImpostor: true });
    } else if (i < impostorCount + jesterCount) {
      roles.push({ isImpostor: false, isJester: true });
    } else {
      roles.push({ isImpostor: false });
    }
  }
  const shuffled = shuffle(roles);

  // Assign the Prosecutor's target now that positions are final. The pool is every
  // crewmate-type player (isImpostor:false → plain crewmates AND the jester); this
  // excludes the prosecutor and every fellow imposter by construction. Defensive: if
  // the pool is somehow empty, drop the prosecutor flag rather than throw (in practice
  // the imposter cap always leaves at least one crewmate-type).
  if (hasProsecutor) {
    const prosecutorIdx = shuffled.findIndex((r) => r.isProsecutor);
    const targetPool = shuffled
      .map((r, i) => (r.isImpostor ? -1 : i))
      .filter((i) => i >= 0);
    if (prosecutorIdx >= 0 && targetPool.length > 0) {
      shuffled[prosecutorIdx].targetIndex =
        targetPool[Math.floor(Math.random() * targetPool.length)];
    } else if (prosecutorIdx >= 0) {
      delete shuffled[prosecutorIdx].isProsecutor;
    }
  }

  // Assign the Lawyer + their client now that positions are final (the mirror of the
  // prosecutor block above). The Lawyer is one plain crewmate — isImpostor:false AND not
  // the jester — and their client is any imposter-aligned player (isImpostor:true, which
  // includes the prosecutor). Both pools are independent of the prosecutor's, so the two
  // can coexist on the same round (different role objects; targetIndex vs clientIndex
  // never collide). Defensive: if either pool is somehow empty, skip the Lawyer rather
  // than throw (in practice the imposter cap always leaves ≥1 plain crewmate and ≥1
  // imposter, so a Lawyer + client are always assignable).
  if (hasLawyer) {
    const lawyerPool = shuffled
      .map((r, i) => (!r.isImpostor && !r.isJester ? i : -1))
      .filter((i) => i >= 0);
    const clientPool = shuffled
      .map((r, i) => (r.isImpostor ? i : -1))
      .filter((i) => i >= 0);
    if (lawyerPool.length > 0 && clientPool.length > 0) {
      const lawyerIdx = lawyerPool[Math.floor(Math.random() * lawyerPool.length)];
      shuffled[lawyerIdx].isLawyer = true;
      shuffled[lawyerIdx].clientIndex =
        clientPool[Math.floor(Math.random() * clientPool.length)];
    }
  }
  return shuffled;
}

// Start a round: commit the setup config, generate the roles, and move to the
// first player's reveal. Called by the setup screen's Start button.
//
// trollHints (Troll Mode): when a non-empty array is passed, this is a troll
// round — EVERY player is an imposter and roles[i] carries that player's own
// hint, so the reveal screen shows each a different clue and no one can tell.
// The shared `word`/`hint` are still stored (harmless: no crewmate ever reads
// the word). Absent/empty → a normal shuffled round.
// jesterEnabled (Jester role): when true AND this is not a troll round, one player
// is the Jester. Troll Mode wins — on a troll round everyone is an imposter and the
// jester is ignored (hasJester false, no banner). The persisted toggle lives in
// roles-config.js; the setup screen only passes it on when the player count allows.
// prosecutorEnabled (Prosecutor role): when true AND this is not a troll round, one of
// the imposters is the Prosecutor (see buildRoles). Troll wins here too — no prosecutor
// on a troll round. Same persistence/gating story as the jester.
// lawyerEnabled (Lawyer role): when true AND this is not a troll round, one crewmate is
// the Lawyer, secretly assigned an imposter-aligned client (see buildRoles). Troll wins
// here too — no lawyer on a troll round. Same persistence/gating story as the others.
export function startGame({ playerCount, impostorCount, wordSource, word, hint, names, trollHints = null, jesterEnabled = false, prosecutorEnabled = false, lawyerEnabled = false }) {
  const isTroll = Array.isArray(trollHints) && trollHints.length > 0;
  const hasJester = jesterEnabled && !isTroll;
  const hasProsecutor = prosecutorEnabled && !isTroll;
  const hasLawyer = lawyerEnabled && !isTroll;
  gameState.set({
    screen: 'reveal',
    playerCount,
    impostorCount,
    wordSource,
    word,
    hint, // travels with the word for the round; the imposter reveal + results read it
    names: names ?? [], // custom player names; screens fall back via displayName()
    isTroll,
    hasJester, // drives the "a jester is in play" banner + the results reveal
    hasProsecutor, // drives the prosecutor's results reveal (no in-round banner — it's hidden)
    hasLawyer, // drives the lawyer's reveal note + results reveal (no in-round banner — it's hidden)
    roles: isTroll
      ? trollHints.map((playerHint) => ({ isImpostor: true, hint: playerHint }))
      : buildRoles(playerCount, impostorCount, hasJester, hasProsecutor, hasLawyer),
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
