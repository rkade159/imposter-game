// Player-count bounds for the setup screen.
// Centralised here so a future widen-the-range change is a one-file edit
// instead of hunting through screens and components.
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const DEFAULT_PLAYERS = 6;

// Impostor-count bounds. There's no MAX_IMPOSTORS constant on purpose: the
// maximum depends on the chosen player count (always playerCount - 1, so at
// least one crewmate remains) and is derived at runtime by the setup screen.
export const MIN_IMPOSTORS = 1;
export const DEFAULT_IMPOSTORS = 1;

// Minimum players for the optional Jester role: one jester + at least one imposter
// and one crewmate. The setup screen gates the toggle (and the imposter-count
// range) on this. Note: MIN_PLAYERS is already 3, so the "auto-off below this"
// guard is currently inert but kept correct and future-proof.
export const JESTER_MIN_PLAYERS = 3;

// Minimum players for the optional Prosecutor role. The Prosecutor occupies one
// existing imposter slot (it does NOT add an imposter) and needs at least one
// crewmate-type player to target, so 3 is the floor (1 prosecutor + ≥1 target +
// the table). Like JESTER_MIN_PLAYERS this gates the setup toggle; inert while
// MIN_PLAYERS is 3, but kept correct/future-proof.
export const PROSECUTOR_MIN_PLAYERS = 3;
