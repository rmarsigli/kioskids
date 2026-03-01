---
title: "Auto-Updater — Silent Update via GitHub Releases"
created: 2026-03-01T21:23:35.104Z
priority: P2-M
status: backlog
tags: [feat]
---

# Auto-Updater — Silent Update via GitHub Releases

electron-updater (runtime dependency). electron-builder publish section: GitHub provider. UpdaterService in src/main/updater.ts: checkForUpdates() called 5s after window load, swallows network errors silently (no UI error on no-internet). Events: update-downloaded sends app:update-ready IPC to Renderer. app:restart-to-update IPC handler calls autoUpdater.quitAndInstall(). UpdateBanner component in AppLayout: non-intrusive, Reiniciar Agora + Depois buttons. GH_TOKEN via environment only, never hardcoded. Depends on T001.

