/**
 * Returns the current UTC timestamp in ISO-8601 string format.
 * Centralises `new Date().toISOString()` — prevents repetition and
 * makes it trivial to swap for a deterministic value in tests.
 */
export function nowIso(): string {
  return new Date().toISOString()
}
