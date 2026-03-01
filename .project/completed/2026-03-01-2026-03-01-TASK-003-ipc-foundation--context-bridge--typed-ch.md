---
title: "IPC Foundation — Context Bridge + Typed Channels"
created: 2026-03-01T21:22:32.318Z
priority: P1-M
status: backlog
tags: [feat]
---

# IPC Foundation — Context Bridge + Typed Channels

Typed IPC contract between Renderer and Main. src/shared/constants/ipc-channels.ts with IPC.DB.*, IPC.HW.*, IPC.APP.* constants (no magic strings). Generic IpcResult&lt;T&gt; = { success: true, data } | { success: false, error, code } in src/shared/types/result.ts. contextBridge exposing window.api.db.*, window.api.hw.*, window.api.app.* in preload. window.d.ts for Renderer TS autocompletion. Handler registration pattern in src/main/ipc/ (one file per domain). First real handler: db:get-tariffs. Depends on T002.

