// Fisher–Yates (Durstenfeld) shuffle.
//
// Returns a NEW array — it never mutates the input — so callers (like role
// assignment) stay pure. Uses Math.random, which is fine for a casual party
// game; it does not need to be cryptographically secure.

export function shuffle(items) {
  const result = items.slice();
  // Walk from the last index down, swapping each element with a randomly chosen
  // one at or before it. This visits every position once and is unbiased.
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
