---
title: "Layout Redesign — Header + Two-Column Dashboard + Modal Forms"
created: 2026-03-02T01:39:53.641Z
priority: P1-L
status: backlog
tags: [feat]
---

# Layout Redesign — Header + Two-Column Dashboard + Modal Forms

Redesign complete app layout based on wireframe. Replace sidebar navigation with a fixed top header containing: app name (left), "Novo Check-in" button (center-right), hamburger menu dropdown (Histórico, Tarifas, Financeiro), and Settings gear icon. Main content becomes two-column: left panel shows today's session list (table: time, name, check-in time, check-out time, tariff, payment method, transaction number) — clickable row to open client profile. Right panel (top): "Em atividade" cards with name + countdown timer; on expiry: beep sound + name/timer in red + timer switches to counting up (extra time). Right panel (bottom): info widget with app version, live clock, support info. Convert CheckInPage and TariffForm from full pages to modals (Dialog component). Remove /check-in route, trigger modal from header button. Use standard-size text and buttons throughout (remove oversized variants). Check-out flow may remain as a page or become a modal — decide during implementation. Depends on TASK-015 (Customer DB) for check-in search field.

