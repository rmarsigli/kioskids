/**
 * Typed DOM custom event name constants for cross-component communication
 * within the Renderer process.
 *
 * Usage:
 *   window.dispatchEvent(new Event(RENDERER_EVENTS.SESSIONS_REFRESH))
 *   window.addEventListener(RENDERER_EVENTS.SESSIONS_REFRESH, handler)
 */
export const RENDERER_EVENTS = {
  /** Fired by AppLayout after a successful check-in to trigger an immediate dashboard reload. */
  SESSIONS_REFRESH: 'sessions:refresh',
} as const
