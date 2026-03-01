---
title: "Check-Out — Billing Confirmation and Session Close"
created: 2026-03-01T21:23:09.877Z
priority: P1-M
status: backlog
tags: [feat]
---

# Check-Out — Billing Confirmation and Session Close

db:preview-checkout handler: calculates estimated total without writing (returns preview_total + elapsed_minutes). db:check-out handler: sets check_out_at in Main (UTC, never Renderer), fetches session, uses stored tariff_snapshot + calculateSessionTotal, updates session to completed, refreshes sync_queue. db:cancel-session: sets status=canceled + notes, no calculated_total. Validation: check_out_at before check_in_at = CLOCK_ERROR. CheckOutPage at /sessions/:id/checkout: preview total display, Confirmar + Cancelar Sessao + Voltar actions. Post-checkout: offer Imprimir Recibo before navigating. Depends on T007 (dashboard) and T005.

