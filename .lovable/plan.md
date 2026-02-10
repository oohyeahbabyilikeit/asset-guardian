

# Fix: Year-Over-Year Stress Acceleration in Life Projection

## Problem

The current projection divides remaining capacity by a **constant** stress rate:
```
yearsLeftCurrent = remainingCapacity / effectiveNakedRate
```

This assumes the tank degrades at the same speed in Year 1 as in Year 10. In reality, naked tanks experience **compounding degradation**:
- Sediment continues accumulating (insulation worsens)
- Corrosion products reduce wall thickness (stress concentrates)
- Scale builds on fittings (flow restriction increases temperature)

The result: projections are still too optimistic for high-stress naked tanks.

## What's Already Correct (No Changes Needed)

Past damage tracking is solid:
- `yearsWithoutAnode` preserves historical naked exposure (v8.0 "Lazarus Effect" fix)
- `yearsWithoutSoftener` splits burn rate history correctly (v9.0 "Time Machine Bug" fix)
- `protectedAging + nakedAging` correctly sums phase-weighted biological age
- New anode/softener installs do NOT retroactively heal past damage

## Proposed Fix: Iterative Year-by-Year Projection

Replace the single-division projection with a **year-by-year simulation** that compounds stress annually.

### File: `src/lib/opterraAlgorithm.ts` (lines ~1463-1472)

**Current (flat rate):**
```typescript
const effectiveNakedRate = Math.max(nakedStress, 2.0);
yearsLeftCurrent = remainingCapacity / effectiveNakedRate;
```

**New (compounding projection):**
```typescript
// v9.1.5 FIX "Flat Projection": Use iterative year-by-year simulation
// Each year of naked exposure slightly increases the degradation rate
// due to compounding sediment, wall thinning, and scale buildup.
// Acceleration factor: 3% per year of additional naked time (conservative)
const ANNUAL_ACCELERATION = 0.03; // 3% compounding per year
const effectiveNakedRate = Math.max(nakedStress, 2.0);
const effectiveOptNakedRate = Math.max(optimizedNakedStress, 1.5);

let capacityLeft = remainingCapacity;
let yearsCount = 0;
while (capacityLeft > 0 && yearsCount < MAX_YEARS_LEFT) {
  const yearRate = effectiveNakedRate * (1 + ANNUAL_ACCELERATION * yearsCount);
  capacityLeft -= yearRate;
  yearsCount++;
}
yearsLeftCurrent = yearsCount > 0 && capacityLeft < 0
  ? yearsCount - 1 + (capacityLeft + effectiveNakedRate * (1 + ANNUAL_ACCELERATION * (yearsCount - 1))) / (effectiveNakedRate * (1 + ANNUAL_ACCELERATION * (yearsCount - 1)))
  : yearsCount;

// Same for optimized
let optCapLeft = remainingCapacity;
let optYears = 0;
while (optCapLeft > 0 && optYears < MAX_YEARS_LEFT) {
  const yearRate = effectiveOptNakedRate * (1 + ANNUAL_ACCELERATION * optYears);
  optCapLeft -= yearRate;
  optYears++;
}
yearsLeftOptimized = optYears > 0 && optCapLeft < 0
  ? optYears - 1 + (optCapLeft + effectiveOptNakedRate * (1 + ANNUAL_ACCELERATION * (optYears - 1))) / (effectiveOptNakedRate * (1 + ANNUAL_ACCELERATION * (optYears - 1)))
  : optYears;
```

### Same acceleration for two-phase (active anode) path

Apply the same compounding to the naked-after-anode-depletes portion (lines ~1454-1462), so the post-anode projection also accounts for acceleration rather than using flat `nakedStress`.

## Impact

| Scenario | Before (flat) | After (3% compound) | Why |
|----------|---------------|----------------------|-----|
| 5yr naked, stress 2.0x, ceiling 16.25 | 5.6 yr | ~5.1 yr | Modest reduction |
| 10yr naked, stress 3.5x, ceiling 16.25 | 1.8 yr | ~1.7 yr | Minimal (already low) |
| 3yr naked, stress 2.0x, ceiling 16.25 | 6.6 yr | ~5.9 yr | Meaningful reduction on young tanks |

The 3% annual acceleration is conservative and prevents over-projection without being alarmist. The hard cap of 15 years remains as a safety net.

## Validation

- Run all 28 scenario tests to confirm no regressions
- Verify that naked tanks with low stress don't project unrealistic lifespans
- Confirm that protected (anode active) tanks are minimally affected since acceleration only applies to the naked phase

## Technical Details

- **File changed:** `src/lib/opterraAlgorithm.ts`
- **Lines affected:** ~1449-1481 (projection block)
- **Version bump:** v9.1.5
- **Changelog update:** `docs/algorithm-changelog.md`

