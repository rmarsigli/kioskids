---
title: "Session History — Today's Completed Sessions"
created: 2026-03-01T21:23:23.136Z
priority: P1-M
status: backlog
tags: [feat]
---

# Session History — Today's Completed Sessions

SessionRepository.getSessionHistory(localDate: YYYY-MM-DD): returns completed + canceled sessions filtered by local date using SQLite date(check_out_at, 'localtime'). Wire db:get-session-history IPC handler (Renderer sends new Date().toLocaleDateString('en-CA')). HistoryPage: header with local date + daily total (completed only), table with child/guardian/check-in/check-out/duration/tariff/total/status columns. Uses formatLocalDateTime and formatDuration from T010. Canceled rows muted/strikethrough. Session counts: X concluidas, Y canceladas. Spinner + EmptyState. Depends on T009.

