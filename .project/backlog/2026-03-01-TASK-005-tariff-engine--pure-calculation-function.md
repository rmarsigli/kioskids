---
title: "Tariff Engine — Pure Calculation Function + Full Test Suite"
created: 2026-03-01T21:22:44.023Z
priority: P1-M
status: backlog
tags: [feat]
---

# Tariff Engine — Pure Calculation Function + Full Test Suite

Pure function calculateSessionTotal(checkInAt, checkOutAt, tariff): number in src/shared/utils/tariff-engine.ts. Integer math only (no floating-point). Algorithm: durationMinutes = ceil(seconds/60); if within base+tolerance = base_price; else additional_fractions = ceil(additionalMinutes/fraction_minutes), total = base_price + fractions*fraction_price. Also export calculateLiveCost(checkInAt, tariff) for live dashboard. Zod validation for TariffSnapshot (fraction_minutes >= 1). 100% test coverage: all worked examples from tariff-engine.md as explicit test cases + edge cases (rounding, zero duration, tolerance boundary). Depends on T001.

