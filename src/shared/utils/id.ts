/**
 * UUID v4 generation shim.
 *
 * - Main process:  `node:crypto.randomUUID()` (always available in Node 15+)
 * - Renderer:      `globalThis.crypto.randomUUID()` — available in Chromium/Electron renderer
 *
 * The function resolves to whichever global is available, so the same import
 * path works in both contexts without conditional imports.
 */
export function randomUUID(): string {
  return globalThis.crypto.randomUUID()
}
