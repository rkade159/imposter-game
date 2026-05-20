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
