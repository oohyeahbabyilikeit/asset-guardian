

# Anode Shield Life Algorithm Fix (v9.0)

## Overview
Correct the physics model and time-history logic for anode rod life estimation to align with forensic engineering reality rather than manufacturer marketing.

## Issues to Fix

### 1. Over-Optimistic Baseline (Marketing Math)
| Current | Proposed |
|---------|----------|
| 6 years per rod | **4 years per rod** |
| 2 rods = 12 years | **2 rods = 7.5 years** (parallel surface area reduces effectiveness) |
| Powered = 12 years | **Powered = 15+ years** (actively regenerates) |

**Rationale**: Industry standard is inspect at 2-4 years. The "6-year warranty" is designed so the rod dies at Year 4 and the steel tank survives Years 4-6 naked.

### 2. Hard Water Physics Inversion
| Current (Wrong) | Proposed (Correct) |
|-----------------|-------------------|
| Hard water **penalizes** anode life (+0.02x per GPG) | Hard water has **no penalty** (passivation protects) |
| Soft water has no modifier | Soft water **penalizes** anode life (3.0x decay rate) |

**Physics**: Calcium carbonate scale coats the anode and tank wall, slowing electrochemical reactions. Soft water (especially from salt-based softeners) is highly conductive and aggressively dissolves the sacrificial metal.

### 3. "Time Machine" Bug (History-Aware Burn Rate)
| Current (Wrong) | Proposed (Correct) |
|-----------------|-------------------|
| Current decay rate × entire anode age | Split: (Normal years × historical rate) + (Softener years × current rate) |
| 10yr tank + new softener = "dead anode" | 10yr tank + new softener = "healthy anode with accelerated future burn" |

**Logic**: We already have `yearsWithoutSoftener` in `ForensicInputs`. Use it to calculate historical vs. current consumption separately.

---

## Implementation Plan

### Step 1: Update Constants
In `src/lib/opterraAlgorithm.ts`, update the anode baseline constants:

```typescript
const ANODE_CONSTANTS = {
  BASE_LIFE_SINGLE: 4.0,      // Years for single Mg rod (was 6.0)
  BASE_LIFE_DUAL: 7.5,        // Years for dual rods (not 12.0)
  BASE_LIFE_POWERED: 15,      // Powered anode (indefinite with maintenance)
  SOFTENER_MULTIPLIER: 3.0,   // Soft water = 3x consumption (was 1.4 additive)
  GALVANIC_MULTIPLIER: 2.5,   // Direct copper + steel nipple
  RECIRC_MULTIPLIER: 1.25,    // Turbulence prevents passivation (was 0.5 additive)
  MAX_DECAY_RATE: 8.0,        // Cap for compound effects
};
```

### Step 2: Remove Hard Water Penalty
Delete or comment out lines 863-864:
```typescript
// REMOVED v9.0: Hard water protects via passivation, not penalizes
// const hardnessAboveBaseline = Math.max(0, effectiveHardness - 5);
// anodeDecayRate += hardnessAboveBaseline * 0.02;
```

### Step 3: Change Decay Math from Additive to Multiplicative
```typescript
// Before (wrong - additive):
if (data.hasSoftener) anodeDecayRate += 1.4;
if (data.hasCircPump) anodeDecayRate += 0.5;

// After (correct - multiplicative):
const softenerFactor = data.hasSoftener ? 3.0 : 1.0;
const recircFactor = data.hasCircPump ? 1.25 : 1.0;
const galvanicFactor = (data.connectionType === 'DIRECT_COPPER' && 
                        data.nippleMaterial === 'STEEL') ? 2.5 : 1.0;
const currentBurnRate = softenerFactor * galvanicFactor * recircFactor;
```

### Step 4: Implement History-Aware Shield Life
Replace the simple calculation with split-history logic:

```typescript
function calculateShieldLife(data: ForensicInputs): number {
  // 1. ESTABLISH MASS (The "Fuel Tank")
  let baseMassYears = 4.0; // Standard single rod
  if (data.anodeCount === 2 || data.warrantyYears >= 12) {
    baseMassYears = 7.5; // Two rods working in parallel
  }
  
  // 2. DEFINE BURN RATES (Multiplicative)
  const softenerFactor = data.hasSoftener ? 3.0 : 1.0;
  const galvanicFactor = getGalvanicFactor(data);
  const recircFactor = data.hasCircPump ? 1.25 : 1.0;
  
  const currentBurnRate = softenerFactor * galvanicFactor * recircFactor;
  const historicalBurnRate = 1.0 * galvanicFactor * recircFactor; // No softener historically
  
  // 3. CALCULATE FUEL CONSUMED (History-Aware)
  const age = data.lastAnodeReplaceYearsAgo ?? data.calendarAge;
  
  // How long has the softener been active?
  const yearsWithSoftener = data.yearsWithoutSoftener !== undefined
    ? Math.max(0, age - data.yearsWithoutSoftener)
    : (data.hasSoftener ? age : 0); // If unknown, assume worst case
    
  const yearsNormal = age - yearsWithSoftener;
  
  // Total "Anode Years" burned
  const consumedMass = (yearsNormal * historicalBurnRate) + 
                       (yearsWithSoftener * currentBurnRate);
  
  // 4. PREDICT REMAINING LIFE
  const remainingMass = baseMassYears - consumedMass;
  
  if (remainingMass <= 0) return 0; // Naked Tank
  
  // Divide remaining mass by CURRENT burn rate
  return Math.max(0.5, remainingMass / currentBurnRate);
}
```

### Step 5: Update Algorithm Calculation Trace UI
In `src/components/AlgorithmCalculationTrace.tsx`, update the "Shield Life" step to show:
- Base anode capacity (4.0 or 7.5 years)
- Current burn rate (multiplicative factors)
- Historical consumption split
- Remaining protection time

### Step 6: Update Documentation
In `docs/algorithm-changelog.md`, add v9.0 entry:
- "FIX Shield Life Baseline": 6→4 years (forensic reality vs. marketing)
- "FIX Hard Water Physics": Removed penalty (passivation protects anode)
- "FIX Time Machine Bug": History-aware burn rate using `yearsWithoutSoftener`
- Changed decay math from additive to multiplicative

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/opterraAlgorithm.ts` | Update constants, fix shield life calculation, remove hard water penalty, change to multiplicative math |
| `src/components/AlgorithmCalculationTrace.tsx` | Update trace output to show new calculation steps |
| `docs/algorithm-changelog.md` | Document v9.0 changes |
| `src/lib/__tests__/scenarioValidation.ts` | Update expected outcomes for scenarios affected by tighter baseline |

---

## Validation Scenarios

After implementing, these scenarios should show different results:

| Scenario | Before (v8.x) | After (v9.0) |
|----------|--------------|--------------|
| 5yr tank, no softener, no issues | ~1yr shield life remaining | ~0 (naked - should trigger anode service warning) |
| 3yr tank + new softener (installed today) | Negative shield life (false alarm) | ~1yr remaining (correct: only recent burn) |
| 4yr tank, dual anode, hard water (20 GPG) | ~0 (hard water penalty killed it) | ~3.5yr remaining (hard water doesn't hurt anode) |
| 2yr tank + softener since Day 1 | ~2yr remaining | ~0 (softener burns 3x = 6 effective years consumed) |

---

## Physics References

For documentation and defensibility:
- NACE International SP0169: Cathodic protection standards
- AWWA Research Foundation: Water heater anode rod studies
- Bradford White Technical Bulletin: Anode rod inspection guidelines (2-4 year recommendation)

