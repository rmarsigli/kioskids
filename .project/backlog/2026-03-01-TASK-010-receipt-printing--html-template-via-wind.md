---
title: "Receipt Printing — HTML Template via window.print()"
created: 2026-03-01T21:23:09.884Z
priority: P1-M
status: backlog
tags: [feat]
---

# Receipt Printing — HTML Template via window.print()

datetime utils in src/shared/utils/datetime.ts: formatLocalDateTime(utcIso) via Intl.DateTimeFormat pt-BR, formatDuration(seconds), formatCurrency(cents). ReceiptTemplate.tsx: pure presentational React component with @media print CSS (hides all chrome, 280px/80mm width, monospace). Prints: store name, child name, guardian, check-in/out in local timezone, duration, tariff name, total. printReceipt(data) utility: renders template to hidden div, calls window.print(), removes div on onafterprint. Wire Imprimir Recibo button in CheckOutPage. Main process has zero print-related code. Depends on T009 (check-out flow).

