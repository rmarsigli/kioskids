import { contextBridge } from 'electron'

// Placeholder — full IPC surface is wired in TASK-003 (IPC Foundation).
// Only add stable, typed values here. Raw Node APIs must never be exposed.
contextBridge.exposeInMainWorld('api', {
  version: process.env['npm_package_version'] ?? 'unknown',
})
