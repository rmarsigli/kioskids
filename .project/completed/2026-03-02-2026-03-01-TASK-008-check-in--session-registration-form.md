---
title: "Check-In — Session Registration Form"
created: 2026-03-01T21:22:56.045Z
priority: P1-M
status: backlog
tags: [feat]
---

# Check-In — Session Registration Form

SessionRepository.createSession(input): single transaction inserting sessions row + sync_queue row. check_in_at set by repository (UTC, never by Renderer). tariff_snapshot JSON stored on session row (fetched by tariff_id, validated active). Zod schema: child_name, guardian_name, guardian_contact, tariff_id. CheckInPage: 4-field form, tariff selector (active only), validation on blur, submit debounce 2s to prevent double-submit. On success: toast + clear form + navigate to /sessions. IPC error codes: TARIFF_INACTIVE. Depends on T006.

