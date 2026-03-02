---
title: "History Page — Date Filter, Range Picker, Full Table"
created: 2026-03-02T01:40:08.750Z
priority: P1-M
status: backlog
tags: [feat]
---

# History Page — Date Filter, Range Picker, Full Table

Upgrade TASK-012 (today-only history) into a full history page with date-range filtering. Replaces/supersedes TASK-012 scope. DB: SessionRepository.getHistory(from: string, to: string): returns sessions with status='completed' OR status='canceled' in the given UTC date range, ordered by checked_in_at DESC. IPC: db:get-session-history with from/to ISO date params, max range enforced at 90 days on Main side (returns RANGE_TOO_LARGE error if exceeded). HistoryPage: Quick filter chips at top — "Hoje", "Ontem", "Últimos 7 dias", "Este mês"; plus a custom date range picker (two date inputs: from + to) — validate max 90 days with inline error. Results shown as a table (not cards): columns — Horário, Nome, Tarifa, Tempo, Total, Forma de Pagamento, Nro Transação, Status (badge). Rows are clickable to open client profile (if customer_id present). Empty state per filter. Pagination or virtual scroll if list > 100 rows. Depends on TASK-017 (payment fields) for payment columns.

