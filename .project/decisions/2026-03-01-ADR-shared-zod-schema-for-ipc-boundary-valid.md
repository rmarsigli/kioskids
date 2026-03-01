---
title: "Shared Zod schema for IPC boundary validation (SaveTariffSchema)"
date: 2026-03-01
taskId: TASK-006
status: Accepted
---

# Shared Zod schema for IPC boundary validation (SaveTariffSchema)

## Rationale

Placed SaveTariffSchema in src/shared/utils/tariff-schema.ts so both the Main process IPC handler and the Renderer form can import the exact same validation rules. This eliminates the risk of main/renderer divergence and avoids duplicating error messages. The IPC handler uses safeParse on `unknown` input (the renderer could send anything), and the Renderer uses safeParse for per-field blur validation and pre-submit guard. Single source of truth for every constraint (min/max, integer, fraction_minutes >= 1).

## Status

Accepted
