

# Anode Depletion Threshold Redesign

## Problem Statement

The current anode alerting uses a **time-remaining** threshold (`shieldLife <= 1 year`), which doesn't account for:
1. **Prediction uncertainty** - The math has a margin of error, so 50% calculated could be 70-80% actual
2. **Non-linear physics** - Mass depletes faster than surface area (50% diameter = 75% mass loss)
3. **Variable burn rates** - A 1-year threshold means different depletion percentages depending on water conditions

## Solution: Percentage-Based Thresholds

Switch from time-based to **mass-percentage-based** alerting with explicit safety margins.

---

## Phase 1: Add Depletion Percentage to Algorithm Output

### Update `OpterraMetrics` Interface

Add new metrics alongside `shieldLife`:

```typescript
interface OpterraMetrics {
  // Existing
  shieldLife: number; // Years remaining (keep for backward compatibility)
  
  // NEW: Percentage-based metrics
  anodeDepletionPercent: number;  // 0-100 (0 = new rod, 100 = depleted)
  anodeStatus: 'protected' | 'inspect' | 'replace' | 'naked';
  anodeMassRemaining: number;     // 0-1 (fraction of original mass)
}
```

### Calculation Logic in `calculateHealth()`

```typescript
// After existing shieldLife calculation
const depletionPercent = (consumedMass / baseMassYears) * 100;
const massRemaining = Math.max(0, remainingMass / baseMassYears);

// Three-stage status mapping
let anodeStatus: 'protected' | 'inspect' | 'replace' | 'naked';
if (depletionPercent <= 40) {
  anodeStatus = 'protected';
} else if (depletionPercent <= 50) {
  anodeStatus = 'inspect';      // "Upcoming Service"
} else if (remainingMass > 0) {
  anodeStatus = 'replace';      // "Service Due Now"
} else {
  anodeStatus = 'naked';        // Tank unprotected
}
```

---

## Phase 2: Update Maintenance Trigger Logic

### File: `src/lib/maintenanceCalculations.ts`

Replace time-based trigger:

**Before:**
```typescript
const monthsToAnodeReplacement = shieldLife > 1 
  ? Math.round((shieldLife - 1) * 12) : 0;
```

**After:**
```typescript
// Trigger based on depletion percentage, not time remaining
const anodeDepletionPercent = metrics.anodeDepletionPercent;

let anodeUrgency: MaintenanceTask['urgency'];
if (anodeDepletionPercent > 50) {
  anodeUrgency = 'overdue';      // "Service Due Now"
} else if (anodeDepletionPercent > 40) {
  anodeUrgency = 'due_soon';     // "Plan for Service"
} else {
  anodeUrgency = 'upcoming';     // "Protected"
}

// Estimate months to 50% threshold for scheduling
const monthsToThreshold = anodeDepletionPercent < 50
  ? Math.round(((50 - anodeDepletionPercent) / 100) * baseMassYears * 12 / currentBurnRate)
  : 0;
```

---

## Phase 3: Update UI Status Mapping

### File: `src/components/ServiceHistory.tsx`

Replace hardcoded thresholds with algorithm output:

**Before:**
```typescript
const anodeStatus = anodeDepleted 
  ? 'critical' 
  : anodeDepletionPercent > 70 
    ? 'warning' 
    : 'good';
```

**After:**
```typescript
// Use algorithm-provided status
const anodeStatusColor = {
  'protected': 'good',
  'inspect': 'warning',
  'replace': 'critical',
  'naked': 'critical'
}[metrics.anodeStatus];
```

---

## Phase 4: Update Opportunity Detection

### File: `supabase/functions/detect-opportunities/index.ts`

Use the new percentage thresholds:

```typescript
// Anode opportunity detection
if (result.metrics.anodeStatus === 'replace' || result.metrics.anodeStatus === 'naked') {
  opportunities.push({
    type: 'anode_due',
    priority: result.metrics.anodeStatus === 'naked' ? 'critical' : 'high',
    context: {
      depletionPercent: result.metrics.anodeDepletionPercent,
      massRemaining: result.metrics.anodeMassRemaining
    }
  });
} else if (result.metrics.anodeStatus === 'inspect') {
  opportunities.push({
    type: 'anode_inspection',
    priority: 'medium',
    context: { depletionPercent: result.metrics.anodeDepletionPercent }
  });
}
```

---

## The Physics Consideration (Future Enhancement)

You noted that diameter loss and mass loss are non-linear:

| Diameter Remaining | Mass Remaining |
|-------------------|----------------|
| 100% | 100% |
| 75% | 56% |
| 50% | 25% |
| 25% | 6% |

The current algorithm models anode as a linear "fuel tank" (mass-years consumed linearly). A more accurate model would account for:

1. **Surface Area Decay**: As diameter shrinks, current density increases (accelerating consumption)
2. **Electrochemical Efficiency**: Below ~30% mass, the rod becomes too small to maintain protective potential

**Recommendation**: For v1, the 50% mass threshold with linear burn rate is a solid, conservative choice. The physics refinement (non-linear decay curve) could be Phase 2 after validating the model against field data.

---

## Implementation Sequence

| Step | Task | Effort |
|------|------|--------|
| 1 | Add `anodeDepletionPercent`, `anodeStatus`, `anodeMassRemaining` to `OpterraMetrics` | Small |
| 2 | Update `calculateHealth()` to compute new metrics | Small |
| 3 | Update `calculateTankMaintenance()` to use percentage-based thresholds | Medium |
| 4 | Update `ServiceHistory.tsx` UI to use algorithm-provided status | Small |
| 5 | Update `detect-opportunities` to use new threshold logic | Small |
| 6 | Update `AlgorithmTestHarness` and `AlgorithmCalculationTrace` to display new metrics | Medium |

---

## Summary of Threshold Changes

| Status | Current Logic | New Logic |
|--------|---------------|-----------|
| **Protected** | Not explicit | 0-40% depletion |
| **Inspect/Plan** | shieldLife 1-2 years | 40-50% depletion |
| **Replace** | shieldLife < 1 year | >50% depletion |
| **Naked/Critical** | shieldLife ≤ 0 | 100% (no remaining mass) |

