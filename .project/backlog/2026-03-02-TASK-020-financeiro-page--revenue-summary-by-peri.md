---
title: "Financeiro Page — Revenue Summary by Period and Method"
created: 2026-03-02T01:40:20.413Z
priority: P2-M
status: backlog
tags: [feat]
---

# Financeiro Page — Revenue Summary by Period and Method

Financial summary page accessible from the main menu. Scope: daily and monthly revenue totals, grouped by payment method. No external integration — reads only from local SQLite. DB query: aggregate SUM(calculated_total) from sessions WHERE status='completed', grouped by payment_method, filterable by date range (same filter chips as HistoryPage). Display: summary cards at top (total today, total this month, total by method), followed by a simple bar/table breakdown. Depends on TASK-017 (payment_method field) and TASK-018 (date range logic reuse).

