
# Add "Run to Failure with Code Upgrades" Path for Young Tanks

## Problem
A 4-year-old tank with depleted anode + missing expansion tank is being recommended for replacement because:
1. `hasHighBioAge` (bioAge > calendarAge × 1.8) triggers the "Repair Not Economical" gate
2. The algorithm doesn't distinguish between **correctable stress** (missing infrastructure) and **irreversible damage** (years of naked exposure)

For a young tank (under 6-8 years), it may still make sense to:
- Install the expansion tank (code compliance)
- Accept the depleted anode
- Run to failure with reduced stress

## Proposed Solution

### Add "Infrastructure First" Gate for Young Tanks

Modify `getRawRecommendation` to add a new decision branch **before** the economic fragility check:

```text
YOUNG TANK + HIGH BIO-AGE + CORRECTABLE STRESS?
├── YES → "Protect Your Investment" (REPAIR: Install infrastructure)
│         Reason: Tank is young but stressed. Installing expansion tank 
│         reduces aging rate and extends remaining life.
│
└── NO → Continue to existing fragility checks
```

### Code Changes

**File: `src/lib/opterraAlgorithm.ts`**

Add new gate before Tier 2C (~line 1529):

```typescript
// 2B-NEW: "Infrastructure First" Gate for Young Tanks
// Young tanks with high bio-age due to CORRECTABLE stress (missing infra)
// can be saved with infrastructure upgrades, even if anode is depleted
const YOUNG_TANK_THRESHOLD = 6; // Years - within this range, infrastructure fixes are worthwhile
const isYoungTank = data.calendarAge <= YOUNG_TANK_THRESHOLD;
const hasCorrectableStress = 
  (data.isClosedLoop && !data.hasExpTank) ||  // Missing expansion tank
  (data.housePsi > 80 && !data.hasPrv);       // Missing PRV

// Young tank with high stress that can be reduced via infrastructure
if (isYoungTank && hasHighBioAge && hasCorrectableStress && metrics.failProb < 50) {
  // Calculate projected life WITH infrastructure fixes
  const wouldExtendLife = metrics.yearsLeftOptimized > metrics.yearsLeftCurrent + 2;
  
  if (wouldExtendLife) {
    return {
      action: 'REPAIR',
      title: 'Protect Your Investment',
      reason: `Tank is ${data.calendarAge} years old with significant stress. Installing code-required infrastructure will reduce wear rate and extend useful life.`,
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE',
      note: 'Unit has some wear but is worth protecting with infrastructure upgrades.'
    };
  }
}
```

### Modify "Naked Rule" to Allow Infrastructure Repairs on Young Tanks

**File: `src/lib/opterraAlgorithm.ts`** (lines 1802-1813)

Current:
```typescript
// RULE 1: The "Naked" Rule (Liability Protection)
if (metrics.shieldLife <= 0 && rec.action === 'MAINTAIN') {
  return { action: 'REPLACE', title: 'End of Service Life', ... };
}
```

Modified:
```typescript
// RULE 1: The "Naked" Rule (Liability Protection)
// Exception: Young tanks can still benefit from infrastructure fixes
const isYoungEnoughToSave = data.calendarAge <= 6;
const hasInfrastructureRepair = rec.action === 'REPAIR' && 
  (rec.title.includes('Expansion') || rec.title.includes('PRV') || rec.title.includes('Pressure'));

if (metrics.shieldLife <= 0 && rec.action === 'MAINTAIN' && !isYoungEnoughToSave) {
  return { action: 'REPLACE', title: 'End of Service Life', ... };
}

// Allow infrastructure repairs to proceed for young naked tanks
if (metrics.shieldLife <= 0 && hasInfrastructureRepair && isYoungEnoughToSave) {
  rec.note = 'Anode protection is depleted. Infrastructure fix will extend remaining life but monitor closely.';
  // Don't override - let the REPAIR recommendation through
}
```

### Add "Run to Failure" Option for Monitor-Only Cases

Add a new recommendation tier for tanks that:
- Are young (≤6 years)
- Have depleted anodes
- Are in LOW-RISK locations (garage, basement)
- Have infrastructure already in place OR don't need it

```typescript
// 2B-ALT: "Managed Decline" for Low-Risk Young Tanks
const isLowRiskLocation = metrics.riskLevel <= 2; // Garage, Basement, Utility
const hasInfrastructure = data.hasExpTank && (!data.isClosedLoop || data.hasExpTank);

if (isYoungTank && isAnodeDepleted && isLowRiskLocation && !hasCorrectableStress) {
  return {
    action: 'PASS',
    title: 'Run to Failure OK',
    reason: `Anode is depleted but tank is young (${data.calendarAge} yrs) in a protected location. Safe to monitor and budget for replacement.`,
    urgent: false,
    badgeColor: 'blue',
    badge: 'MONITOR',
    note: `Estimated ${Math.round(metrics.yearsLeftCurrent)} years remaining. No structural risk from location.`
  };
}
```

---

## Decision Matrix After Changes

| Scenario | Calendar Age | Anode | Location | Infra Needed? | Recommendation |
|----------|--------------|-------|----------|---------------|----------------|
| Young + Naked + Infra Missing | ≤6 yrs | Depleted | Any | Yes | **REPAIR** (Install infra) |
| Young + Naked + Infra OK | ≤6 yrs | Depleted | Low-Risk | No | **PASS** (Run to failure) |
| Young + Naked + High-Risk | ≤6 yrs | Depleted | Attic/Upper | Any | **REPLACE** (Location risk) |
| Old + Naked | >8 yrs | Depleted | Any | Any | **REPLACE** (End of service) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/opterraAlgorithm.ts` | Add "Infrastructure First" gate for young tanks (~line 1529) |
| `src/lib/opterraAlgorithm.ts` | Modify "Naked Rule" to allow infra repairs on young tanks (~line 1802) |
| `docs/algorithm-changelog.md` | Document v8.5 "Young Tank Infrastructure Gate" |

---

## Benefits

1. **Pragmatic**: Allows homeowners to invest in code compliance without forcing immediate replacement
2. **Physics-Based**: Infrastructure fixes genuinely reduce stress and extend life
3. **Location-Aware**: High-risk locations still push toward replacement
4. **Honest**: "Run to failure" messaging sets appropriate expectations for naked tanks
5. **Lead Capture**: Creates service opportunities (expansion tank install) instead of "replace or nothing"

---

## Test Scenarios to Add

1. **4-year tank, depleted anode, missing expansion tank, garage** → Should recommend REPAIR (install expansion)
2. **4-year tank, depleted anode, has expansion tank, basement** → Should recommend PASS (run to failure)
3. **4-year tank, depleted anode, missing expansion, attic** → Should recommend REPLACE (location risk)
4. **9-year tank, depleted anode, missing expansion** → Should recommend REPLACE (too old)
