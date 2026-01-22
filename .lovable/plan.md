

# Anode Depletion Threshold Redesign

## Status: ✅ COMPLETE

Implementation completed on 2026-01-22.

## Problem Statement

The current anode alerting uses a **time-remaining** threshold (`shieldLife <= 1 year`), which doesn't account for:
1. **Prediction uncertainty** - The math has a margin of error, so 50% calculated could be 70-80% actual
2. **Non-linear physics** - Mass depletes faster than surface area (50% diameter = 75% mass loss)
3. **Variable burn rates** - A 1-year threshold means different depletion percentages depending on water conditions

## Solution: Percentage-Based Thresholds

Switched from time-based to **mass-percentage-based** alerting with explicit safety margins.

---

## ✅ Phase 1: Add Depletion Percentage to Algorithm Output (COMPLETE)

### Updated `OpterraMetrics` Interface

Added new metrics in `src/lib/opterraAlgorithm.ts` and `src/lib/opterraTypes.ts`:

```typescript
interface OpterraMetrics {
  // Existing
  shieldLife: number; // Years remaining (kept for backward compatibility)
  
  // NEW v9.2: Percentage-based metrics
  anodeDepletionPercent: number;  // 0-100 (0 = new rod, 100 = depleted)
  anodeStatus: AnodeStatus;       // 'protected' | 'inspect' | 'replace' | 'naked'
  anodeMassRemaining: number;     // 0-1 (fraction of original mass)
}

type AnodeStatus = 'protected' | 'inspect' | 'replace' | 'naked';
```

### Calculation Logic in `calculateHealth()`

```typescript
// Implemented after existing shieldLife calculation
const anodeDepletionPercent = Math.min(100, Math.max(0, (consumedMass / baseMassYears) * 100));
const anodeMassRemaining = Math.max(0, remainingMass / baseMassYears);

// Three-stage status mapping with safety margins
let anodeStatus: AnodeStatus;
if (anodeDepletionPercent <= 40) {
  anodeStatus = 'protected';     // System healthy
} else if (anodeDepletionPercent <= 50) {
  anodeStatus = 'inspect';       // "Upcoming Service" / plan ahead
} else if (anodeMassRemaining > 0) {
  anodeStatus = 'replace';       // "Service Due Now"
} else {
  anodeStatus = 'naked';         // Tank unprotected - critical
}
```

---

## ✅ Phase 2: Update Maintenance Trigger Logic (COMPLETE)

### File: `src/lib/maintenanceCalculations.ts`

Replaced time-based trigger with percentage-based:

**Before:**
```typescript
const monthsToAnodeReplacement = shieldLife > 1 
  ? Math.round((shieldLife - 1) * 12) : 0;
```

**After:**
```typescript
// Trigger based on depletion percentage, not time remaining
if (anodeDepletionPercent > 50 || anodeStatus === 'replace' || anodeStatus === 'naked') {
  anodeUrgency = anodeStatus === 'naked' ? 'critical' : 'overdue';
} else if (anodeDepletionPercent > 40 || anodeStatus === 'inspect') {
  anodeUrgency = 'schedule';  // "Plan for Service"
} else {
  anodeUrgency = 'optimal';   // "Protected"
}
```

Added `getAnodeExplanation()` helper for context-aware messaging.

---

## Phase 3-4: UI & Opportunity Detection (Optional - UI already uses algorithm output)

The UI components (`ServiceHistory.tsx`) already consume the algorithm's output, which now includes `anodeStatus`. The opportunity detection edge function (`detect-opportunities`) should use these new thresholds when implemented.

---

## Summary of Threshold Changes

| Status | Old Logic | New Logic |
|--------|-----------|-----------|
| **Protected** | Not explicit | 0-40% depletion |
| **Inspect/Plan** | shieldLife 1-2 years | 40-50% depletion |
| **Replace** | shieldLife < 1 year | >50% depletion |
| **Naked/Critical** | shieldLife ≤ 0 | 100% (no remaining mass) |

## Files Modified

- `src/lib/opterraAlgorithm.ts` - Added `AnodeStatus` type and depletion calculation
- `src/lib/opterraTypes.ts` - Added `AnodeStatus` type and metrics to interface
- `src/lib/opterraTanklessAlgorithm.ts` - Added N/A anode metrics for tankless units
- `src/lib/maintenanceCalculations.ts` - Updated urgency logic to use percentage thresholds
- `docs/types.md` - Updated documentation

