// Shuffle stub.
//
// A proper Fisher-Yates implementation will live here once role assignment
// needs it. For now we return a shallow copy so callers can be written
// against the intended interface (pure, returns a new array).

export function shuffle(items) {
  return items.slice();
}
