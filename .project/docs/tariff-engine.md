# Tariff Engine — Business Logic

This document is the canonical specification for how session costs are calculated. Both the Electron kiosk (TypeScript) and the Laravel Core (PHP audit engine) must implement this logic identically.

---

## Tariff Structure

| Field | Type | Description |
|---|---|---|
| `base_price` | integer (cents) | Price for the first `base_minutes` |
| `base_minutes` | integer | How many minutes the base price covers |
| `additional_fraction_price` | integer (cents) | Price per fraction unit of additional time |
| `additional_fraction_minutes` | integer | Size of each fraction unit in minutes |
| `tolerance_minutes` | integer | Grace period after `base_minutes` before additional charging starts |

**Example tariff:** R$ 30,00 for 30 minutes + R$ 1,00 per additional minute, with 5-minute tolerance:
```
base_price = 3000
base_minutes = 30
additional_fraction_price = 100
additional_fraction_minutes = 1
tolerance_minutes = 5
```

---

## Duration Calculation

```
duration_seconds = check_out_at (unix) - check_in_at (unix)
duration_minutes = ceil(duration_seconds / 60)
```

Duration is **always rounded UP** to the next full minute. A session of 30 min 01 sec = 31 minutes.

---

## Cost Calculation Algorithm

```
IF duration_minutes <= (base_minutes + tolerance_minutes):
    total = base_price

ELSE:
    additional_minutes = duration_minutes - base_minutes
    additional_fractions = ceil(additional_minutes / additional_fraction_minutes)
    total = base_price + (additional_fractions * additional_fraction_price)
```

### Key rules:
1. **Tolerance is a threshold check only.** Once exceeded, additional minutes are counted from `base_minutes` (not from `base_minutes + tolerance_minutes`). The tolerance is a grace window, not a subtracted buffer.
2. **Fractions round UP.** If a session has 7 additional minutes and the fraction size is 5 minutes, that's `ceil(7/5) = 2` fractions charged.
3. **The tariff snapshot is used, not the current active tariff.** The rules stored on the session at check-in time are the ones used for calculation.

---

## Worked Examples

### Tariff: R$30/30min + R$1/min, tolerance 5min

| Duration | Calculation | Total |
|---|---|---|
| 25 min | Within base (25 ≤ 35) | R$ 30,00 |
| 30 min | Within base (30 ≤ 35) | R$ 30,00 |
| 34 min | Within tolerance (34 ≤ 35) | R$ 30,00 |
| 35 min | Within tolerance (35 ≤ 35) | R$ 30,00 |
| 36 min | Exceeds → additional = 36-30 = 6 min → ceil(6/1) = 6 fractions | R$ 36,00 |
| 45 min | additional = 45-30 = 15 min → 15 fractions | R$ 45,00 |
| 90 min | additional = 90-30 = 60 min → 60 fractions | R$ 90,00 |

### Tariff: R$30/30min + R$5/5min block, tolerance 0min

| Duration | Calculation | Total |
|---|---|---|
| 30 min | Within base | R$ 30,00 |
| 31 min | additional = 1 min → ceil(1/5) = 1 block | R$ 35,00 |
| 35 min | additional = 5 min → ceil(5/5) = 1 block | R$ 35,00 |
| 36 min | additional = 6 min → ceil(6/5) = 2 blocks | R$ 40,00 |

---

## TypeScript Implementation Reference

```typescript
// src/shared/utils/tariff-engine.ts

export interface TariffSnapshot {
  base_price: number;
  base_minutes: number;
  additional_fraction_price: number;
  additional_fraction_minutes: number;
  tolerance_minutes: number;
}

/**
 * Calculates session total in cents.
 * @param checkInAt  - ISO 8601 UTC string
 * @param checkOutAt - ISO 8601 UTC string
 * @param tariff     - Tariff snapshot stored at check-in
 * @returns Total cost in cents (integer)
 */
export function calculateSessionTotal(
  checkInAt: string,
  checkOutAt: string,
  tariff: TariffSnapshot,
): number {
  const durationSeconds =
    (new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 1000;

  const durationMinutes = Math.ceil(durationSeconds / 60);

  if (durationMinutes <= tariff.base_minutes + tariff.tolerance_minutes) {
    return tariff.base_price;
  }

  const additionalMinutes = durationMinutes - tariff.base_minutes;
  const additionalFractions = Math.ceil(
    additionalMinutes / tariff.additional_fraction_minutes,
  );

  return tariff.base_price + additionalFractions * tariff.additional_fraction_price;
}
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| `check_out_at` < `check_in_at` | Must be prevented at the UI/IPC layer — throw a validation error before reaching the engine |
| Duration = 0 seconds | `ceil(0/60) = 0` minutes → charge `base_price` |
| `additional_fraction_minutes = 0` | Invalid tariff — must be validated at creation time (minimum value: 1) |
| Very long sessions (e.g., 24h due to forgotten check-out) | Engine calculates correctly — operator should review and may cancel/correct manually |

---

## Audit (Core Module)

The Laravel Core recalculates using the same algorithm above, applied to:
- `check_in_at` and `check_out_at` from the sync payload
- `tariff_snapshot` included in the same payload

If `server_calculated_total != payload.calculated_total`, the session is flagged as `audit_mismatch`. A small tolerance of ±1 cent may be accepted to account for floating-point edge cases (though with integer math, this should never occur).
