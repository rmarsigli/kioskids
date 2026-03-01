---
title: "Session Dashboard — Live Timers + Active Sessions Grid"
created: 2026-03-01T21:22:56.038Z
priority: P1-M
status: backlog
tags: [feat]
---

# Session Dashboard — Live Timers + Active Sessions Grid

useSessionTimer(checkInAt) hook: elapsedSeconds derived from checkInAt (NOT accumulated ticks), elapsedDisplay HH:MM:SS, isOverTolerance, liveCost recalculated every 60s using calculateLiveCost. Survives app restart and machine sleep (always computed from checkInAt). SessionCard component: child name, guardian, elapsed (monospace), current cost, warning color when isOverTolerance, Check-Out + Notificar buttons (48px min). SessionsPage: grid, refreshes session list every 30s, EmptyState, Spinner on load. Depends on T007 and T005.

