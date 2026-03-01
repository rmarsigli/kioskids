---
title: "App Shell — Layout, Routing, Design Tokens"
created: 2026-03-01T21:22:32.322Z
priority: P1-M
status: backlog
tags: [feat]
---

# App Shell — Layout, Routing, Design Tokens

Renderer shell: Tailwind v4 design tokens via @theme directive (CSS custom properties for brand, surface, danger, warning, success colors). TanStack Router with routes for /sessions, /check-in, /history, /tariffs (stub pages). AppLayout with sidebar nav (active state, 48px min touch targets). Base UI components in src/renderer/src/components/ui/: Button (primary/danger/ghost), Card, Badge (active/completed/canceled), Spinner, EmptyState. React ErrorBoundary. Toast notifications via sonner. Kiosk-optimized: 1280x800 minimum, no horizontal scroll. Depends on T003.

