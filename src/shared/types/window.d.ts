// Augments the global Window interface with the contextBridge API surface.
// Keep this in sync with src/preload/index.ts.
// The full typed surface will be expanded in TASK-003 (IPC Foundation).
interface Window {
  api: {
    version: string
  }
}
