---
title: "Settings Page — App Config via Gear Icon"
created: 2026-03-02T01:40:20.402Z
priority: P2-M
status: backlog
tags: [feat]
---

# Settings Page — App Config via Gear Icon

Settings page accessible via gear icon in top header. Initial settings: app display name (shown in header), kiosk location/name (for receipt header), default tariff (optional, pre-selected in check-in modal). Stored in app_config table (already exists via AppConfigRepository). IPC: app:get-config and app:set-config already partially wired — extend as needed. Settings page should be reachable from a /settings route OR as a modal from gear icon (decide during implementation — modal preferred for consistency). No sync of settings to cloud in this task.

