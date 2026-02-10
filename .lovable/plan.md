

# v9.1.8: Thermal Expansion Spike Correction (140 PSI)

## Problem

The `PSI_THERMAL_SPIKE` constant is set to **120 PSI**, but real-world thermal expansion in a closed-loop system without an expansion tank generates spikes of **~140 PSI** (T&P relief valves are set at 150 PSI as the last safety margin). This undervalues the mechanical stress penalty by ~33%.

Additionally, the pressure profile function (`getPressureProfile`) only spikes to 120, so even when the penalty logic fires correctly, it's calculating damage from a 40 PSI excess (120 - 80) instead of the correct 60 PSI excess (140 - 80).

## Impact of the Fix

Current math (120 PSI spike):
- spikeExcess = 120 - 80 = 40
- cyclicFatiguePenalty = (40/20)^2 = 4.0
- With 0.50 dampener: pressureStress = 1.0 + (4.0 * 0.50) = **3.0**

Corrected math (140 PSI spike):
- spikeExcess = 140 - 80 = 60
- cyclicFatiguePenalty = (60/20)^2 = 9.0
- With 0.50 dampener: pressureStress = 1.0 + (9.0 * 0.50) = **5.5**

This is a significant and appropriate increase -- a missing expansion tank on a closed loop is one of the most damaging conditions a tank can face.

## Changes

### File: `src/lib/opterraAlgorithm.ts`

1. Update `PSI_THERMAL_SPIKE` from `120` to `140` in the CONSTANTS object
2. Update all comments referencing "120 PSI" thermal spikes to "140 PSI"

### File: `docs/algorithm-changelog.md`

Add v9.1.8 entry documenting the correction with the math comparison.

## Validation

Re-run the 28-scenario test suite to confirm no unintended verdict changes. The scenarios involving closed-loop / missing expansion tank should show increased stress (which is the correct behavior).

