/**
 * Plays a short audible beep via the Web Audio API.
 * Safe to call in any Electron renderer context — silently swallows errors
 * when AudioContext is unavailable (e.g., unit test environments).
 */
export function playBeep(
  frequencyHz = 880,
  durationMs = 400,
  volume = 0.3,
): void {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = frequencyHz
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    // Exponential ramp creates a natural decay rather than an abrupt cut.
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1_000)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + durationMs / 1_000)
  } catch {
    // AudioContext unavailable — no-op
  }
}
