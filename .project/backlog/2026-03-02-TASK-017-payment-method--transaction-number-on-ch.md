---
title: "Payment Method + Transaction Number on Check-Out"
created: 2026-03-02T01:40:08.741Z
priority: P1-M
status: backlog
tags: [feat]
---

# Payment Method + Transaction Number on Check-Out

Add payment_method and transaction_number fields to sessions table. Migration 004: ALTER sessions ADD payment_method TEXT NULL, ADD transaction_number TEXT NULL. PaymentMethod enum/union type in shared/types/db.ts: 'dinheiro' | 'pix' | 'debito' | 'credito_visa' | 'credito_master' | 'credito_outro' | 'outro'. Update CheckoutDto to include these optional fields. Update db:check-out IPC handler to accept and persist them. Update SessionRepository.checkout() to write both columns. Add payment info section in CheckOutPage preview step: dropdown for payment method + text input for transaction number (both optional). Update Session type to include the two new fields. Update receipt template (TASK-010) to include payment method and transaction number when present. Update HistoryPage table to show payment method and transaction number columns.

