
# Demo Scenario Algorithm Validation Audit

## Overview
This plan creates a comprehensive validation system to ensure all demo scenarios produce the correct algorithm recommendations based on the v8.5 algorithm logic.

## Current Demo Scenario Inventory

### Location 1: `src/data/mockAsset.ts` (17 scenarios)
| Scenario Name | Age | Key Stress Factors | Expected Recommendation |
|--------------|-----|-------------------|------------------------|
| The Perfect Install | 2 | All equipment present, low hardness | PASS (Monitor) |
| The Garage Sleeper | 4 | Has exp tank, has PRV, moderate hardness | PASS or MAINTAIN |
| The Low-Risk Rental | 3 | No exp tank, no PRV, not closed-loop | PASS or MAINTAIN |
| The Sediment Builder | 6 | 20 GPG hardness, no exp tank | REPAIR (Flush) or infra |
| The Pressure Cooker | 5 | 95 PSI, no PRV, in finished area | REPAIR (PRV required) |
| The Missing Tank | 4 | Closed-loop, no exp tank, finished area | REPAIR (Expansion Tank) |
| The Softener Accelerator | 7 | Softener + attic location | REPLACE or REPAIR (location risk) |
| The Basement Time Bomb | 11 | 82 PSI, 22 GPG, visual rust, hot temp | REPLACE (multiple factors) |
| The Double Whammy | 9 | Attic, visual rust, no exp tank, closed loop | REPLACE (Attic Liability) |
| The Zombie Tank | 12 | 88 PSI, no exp tank, hot temp | REPLACE (age + pressure) |
| The Efficient Hybrid | 2 | Hybrid, all equipment, clean filter | PASS |
| The Clogged Hybrid | 3 | Hybrid, clogged filter, condensate blocked | REPAIR (filter/condensate) |
| The Dusty Hybrid | 3 | Hybrid, dirty filter, missing exp tank | REPAIR (filter + infra) |
| The Efficient Tankless | 2 | Tankless, clean, has isolation valves | PASS |
| The Hard Water Warrior | 5 | Tankless, 22 GPG, scale buildup, no PRV | REPAIR (descale) |
| The Igniter Issue | 6 | Tankless, 45% igniter, no isolation valves | REPLACE or REPAIR (valve install first) |
| The Electric Instant | 3 | Electric tankless, healthy | PASS |
| The Scaled Tankless (No Valves) | 6 | Critical scale, no isolation valves | REPAIR (install valves) |
| The Descale Due Tankless | 4 | Moderate scale, has isolation valves | REPAIR (descale) |

### Location 2: `src/lib/generateRandomScenario.ts` (11 archetypes + 1 test scenario)
| Archetype | Age Range | Condition | Expected Recommendation Range |
|-----------|-----------|-----------|------------------------------|
| The Perfect Install | 1-3 | Excellent | PASS |
| The Healthy Veteran | 4-7 | Good | PASS or MAINTAIN |
| The Pressure Cooker | 3-8 | Stressed + high pressure | REPAIR (PRV/expansion) |
| The Sediment Bomb | 5-10 | Neglected + high hardness | REPAIR or REPLACE (age-dependent) |
| The Zombie Tank | 8-14 | Critical | REPLACE |
| The Attic Bomb | 6-12 | Risky + Attic | REPLACE (Attic Liability) |
| The Hard Water Victim | 4-9 | Extreme hardness | REPAIR or REPLACE (age-dependent) |
| The Frat House | 3-7 | Extreme usage | MAINTAIN or REPAIR |
| The Grandma Special | 8-15 | Minimal usage | REPLACE (age) |
| The Ticking Clock | 10-14 | Expiring | REPLACE |
| The Leaker | 6-12 | Leaking | REPLACE (tank body) or REPAIR (fitting) |

### Location 3: `src/components/AlgorithmTestHarness.tsx` (10 scenarios)
| Scenario Name | Key Stress | Expected Recommendation |
|--------------|-----------|------------------------|
| Attic Time Bomb | 12yr, attic, no pan, closed loop | REPLACE (Attic Liability) |
| Zombie Expansion Tank | 8yr, waterlogged exp tank, 90 PSI | REPAIR (Waterlogged Expansion Tank) |
| Gas Starvation | Tankless, undersized gas line | REPAIR (gas line) |
| Chloramine + Hard Water | 22 GPG, chloramine, hot temp | REPLACE or REPAIR (chemistry) |
| Orphaned Flue | Orphaned flue backdraft risk | REPLACE (venting) |
| Galvanic Nightmare | Direct copper, fitting leak, rust | REPLACE (Too Fragile to Service) |
| Hybrid Suffocation | Hybrid, sealed closet, clogged filter | REPAIR (airflow) |
| Tankless Scale Crisis | Tankless, never descaled, no valves | REPAIR (install valves first) |
| Legionella Risk | Low temp, light usage, 80 gal | MAINTAIN (temp increase) |
| Perfect Unit | All equipment, well-maintained | PASS |

---

## Identified Issues/Concerns

### Issue 1: "The Missing Tank" (mockAsset.ts)
- **Scenario**: 4-year-old, closed-loop, no expansion tank, finished area
- **Current inputs**: `isClosedLoop: true`, `hasExpTank: false`, `location: 'MAIN_LIVING'`
- **Expected**: Should hit Tier 3A "Missing Thermal Expansion" → REPAIR
- **Concern**: Verify `hasHighBioAge` is false so it doesn't falsely trigger v8.5 gate

### Issue 2: "The Pressure Cooker" (mockAsset.ts)
- **Scenario**: 5yr, 95 PSI, has exp tank but no PRV, finished area
- **Current inputs**: `housePsi: 95`, `hasPrv: false`, `hasExpTank: true`
- **Expected**: Should hit Tier 3B "Critical Pressure Violation" → REPAIR (PRV)
- **Concern**: At 95 PSI it's above 80 PSI code limit, should return "High House Pressure" or "Critical Pressure Violation"

### Issue 3: "The Softener Accelerator" (mockAsset.ts)
- **Scenario**: 7yr, attic location, softener (accelerates anode decay)
- **Current inputs**: `location: 'ATTIC'`, `hasSoftener: true`, `calendarAge: 7`
- **Expected**: Check if failProb > 15% triggers "Attic Liability" REPLACE
- **Concern**: Softener + 7 years may push bio-age high enough to trigger replacement

### Issue 4: Random Scenario Generator Constraints
- **Issue**: Random generator only produces GAS or ELECTRIC tanks (lines 138-144)
- **Problem**: This means "The Zombie Tank" archetype could generate a tank with missing expansion tank that should be saveable under v8.5 if young, but the age range is 8-14 which bypasses young tank protection
- **Status**: Correctly configured - old tanks should not benefit from young tank gate

### Issue 5: Test Harness "Galvanic Nightmare"
- **Scenario**: 7yr, direct copper, fitting leak, visual rust
- **Current inputs**: `visualRust: true`, `isLeaking: true`, `leakSource: 'FITTING_VALVE'`
- **Expected**: Should hit Tier 1A "Containment Breach" → REPLACE (visual rust)
- **Concern**: Verify that visual rust takes priority over fitting leak repair

---

## Implementation Plan

### Step 1: Create Algorithm Validation Test Suite
Create a new file `src/lib/__tests__/scenarioValidation.ts` that:
1. Imports all scenarios from all three locations
2. Runs each scenario through `calculateOpterraRisk()`
3. Compares output to expected recommendation
4. Logs discrepancies

### Step 2: Add Expected Outcomes to Each Scenario
Modify scenario definitions to include expected algorithm output:
```typescript
interface ValidatedScenario {
  name: string;
  inputs: ForensicInputs;
  expected: {
    action: 'REPLACE' | 'REPAIR' | 'MAINTAIN' | 'PASS' | 'UPGRADE';
    titleContains?: string; // Partial match for recommendation title
    badgeExpected?: string;
  };
}
```

### Step 3: Fix Identified Discrepancies
Based on validation results, update scenarios where:
- Expected output doesn't match algorithm output
- Scenario description doesn't match its inputs
- v8.5 young tank gate should/shouldn't apply

### Step 4: Add Console Validation on Demo Load
In `Index.tsx`, add a development-mode check that:
1. Runs the loaded scenario through the algorithm
2. Console.logs the recommendation details
3. Warns if recommendation seems inconsistent with scenario name

### Step 5: Update Scenario Documentation
Create `docs/demo-scenarios.md` with:
- Full list of all scenarios
- Expected recommendation for each
- Key stress factors that trigger the recommendation
- Test coverage notes

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/__tests__/scenarioValidation.ts` | Create new test file for automated validation |
| `src/data/mockAsset.ts` | Add `expected` field to scenario interface |
| `src/lib/generateRandomScenario.ts` | Add expected outcome to archetypes |
| `src/pages/Index.tsx` | Add dev-mode scenario validation logging |
| `docs/demo-scenarios.md` | Create documentation for all scenarios |

---

## Validation Script (Quick Check)

To manually verify scenarios now, we can add temporary logging:

```typescript
// In Index.tsx, add after computing opterraResult:
if (process.env.NODE_ENV === 'development') {
  console.log('[VALIDATION] Scenario:', currentAsset?.model || 'Unknown');
  console.log('[VALIDATION] Result:', opterraResult.verdict);
  console.log('[VALIDATION] Metrics:', {
    bioAge: opterraResult.metrics.bioAge,
    failProb: opterraResult.metrics.failProb,
    shieldLife: opterraResult.metrics.shieldLife,
    hasHighBioAge: opterraResult.metrics.bioAge > currentInputs.calendarAge * 1.8
  });
}
```

---

## Test Matrix Summary

| Category | Count | Expected PASS | Expected REPAIR | Expected REPLACE |
|----------|-------|---------------|-----------------|------------------|
| mockAsset Tank Scenarios | 10 | 3 | 4 | 3 |
| mockAsset Hybrid Scenarios | 3 | 1 | 2 | 0 |
| mockAsset Tankless Scenarios | 6 | 2 | 4 | 0 |
| Random Archetypes | 11 | 2 | 4 | 5 |
| Test Harness Scenarios | 10 | 1 | 5 | 4 |
| **Total** | **40** | **9** | **19** | **12** |

