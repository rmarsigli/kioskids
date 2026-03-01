---
title: "WhatsApp Deep Link — Manual Guardian Notification"
created: 2026-03-01T21:23:23.131Z
priority: P1-M
status: backlog
tags: [feat]
---

# WhatsApp Deep Link — Manual Guardian Notification

buildWhatsAppLink(params): normalizes phone (strips non-digits, prepends 55 if needed), encodes pre-filled message with guardian name, child name, elapsed time, current cost. Primary: whatsapp://send?phone=&text=. Fallback: https://wa.me/. window.open() from Renderer — OS handles deep link. If phone invalid (less than 8 digits after normalization): button degrades to copy-to-clipboard with tooltip. Notificar button added to SessionCard using live values from useSessionTimer. Reuses centsToRs() from T006. Depends on T008 (session dashboard/card).

