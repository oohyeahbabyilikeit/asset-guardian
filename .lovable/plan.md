

# Algorithm Isolation Plan: Ship Tank Heaters Fast

## Goal
Create a clean separation between Standard Tank, Tankless, and Hybrid algorithms so you can ship the tank heater logic independently without risk of hybrid code causing regressions.

---

## Architecture After Isolation

```text
src/lib/
├── opterraAlgorithm.ts        # Standard Tank ONLY (GAS/ELECTRIC) - Clean for shipping
├── opterraTanklessAlgorithm.ts # Tankless only (already done)
├── opterraHybridAlgorithm.ts   # NEW: Hybrid/Heat Pump only
├── opterraRouter.ts            # NEW: Entry point that routes by fuel type
└── opterraTypes.ts             # NEW: Shared types/interfaces/constants
```

---

## Implementation Steps

### Step 1: Extract Shared Types (opterraTypes.ts)
Create a new file with all shared types, interfaces, and constants that are used across all three algorithms:
- `ForensicInputs`, `OpterraMetrics`, `Recommendation`, `FinancialForecast`
- `TierProfile`, `FuelType`, `QualityTier`, etc.
- Shared helper functions: `resolveHardness()`, `failProbToHealthScore()`, `isTankless()`
- `CONSTANTS` object

This prevents circular dependencies and allows each algorithm to import cleanly.

### Step 2: Create opterraHybridAlgorithm.ts
Extract all hybrid-specific logic into a new file modeled after tankless:
```typescript
export function calculateHybridHealth(data: ForensicInputs): OpterraMetrics { ... }
export function getHybridRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation { ... }
export function getHybridFinancials(metrics: OpterraMetrics, data: ForensicInputs): FinancialForecast { ... }
```

Hybrid-specific logic to move:
| Current Location | Logic |
|------------------|-------|
| Lines 162-167 | Input fields: `airFilterStatus`, `isCondensateClear`, `compressorHealth` |
| Lines 1478-1503 | Tier 0.5: Filter clog, condensate blockage failure modes |
| Lines 2429-2433 | Element burnout risk (instead of sediment efficiency loss) |
| Lines 2145-2146 | Hybrid pricing (`baseCostHybrid`) |
| Scattered | All `if (data.fuelType === 'HYBRID')` checks |

### Step 3: Clean opterraAlgorithm.ts (Tank-Only)
Remove all hybrid-specific branches from the main algorithm:
- Delete `TIER 0.5: HYBRID-SPECIFIC FAILURE MODES` block
- Remove `if (data.fuelType === 'HYBRID')` conditionals
- Remove hybrid pricing logic
- Keep only `GAS` and `ELECTRIC` fuel types

Rename the file header to clarify scope:
```typescript
/**
 * OPTERRA TANK ENGINE (v9.2)
 * Standard Tank Water Heaters: GAS and ELECTRIC only
 */
```

### Step 4: Create opterraRouter.ts (Entry Point)
Create a clean entry point that routes by fuel type:
```typescript
import { calculateOpterraTankRisk } from './opterraAlgorithm';
import { calculateOpterraTanklessRisk } from './opterraTanklessAlgorithm';
import { calculateOpterraHybridRisk } from './opterraHybridAlgorithm';

export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  switch (data.fuelType) {
    case 'TANKLESS_GAS':
    case 'TANKLESS_ELECTRIC':
      return calculateOpterraTanklessRisk(data);
      
    case 'HYBRID':
      return calculateOpterraHybridRisk(data);
      
    case 'GAS':
    case 'ELECTRIC':
    default:
      return calculateOpterraTankRisk(data);
  }
}
```

### Step 5: Update Imports Across Codebase
Update all files that import from `opterraAlgorithm.ts`:
- Components should import from `opterraRouter.ts` for `calculateOpterraRisk()`
- Components can import types from `opterraTypes.ts`

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/opterraTypes.ts` | CREATE | Shared types, interfaces, constants |
| `src/lib/opterraHybridAlgorithm.ts` | CREATE | Hybrid-specific health, recommendation, financial logic |
| `src/lib/opterraRouter.ts` | CREATE | Entry point with fuel-type routing |
| `src/lib/opterraAlgorithm.ts` | MODIFY | Remove all hybrid branches, rename to Tank Engine |
| `src/lib/opterraTanklessAlgorithm.ts` | MODIFY | Import types from opterraTypes.ts |
| `src/components/*.tsx` | MODIFY | Update imports to use router |
| `src/data/repairOptions.ts` | KEEP | Already unit-type aware |

---

## Hybrid Algorithm Stub (Ship Tank First)

If you want to ship tank logic IMMEDIATELY without fully implementing hybrid:
```typescript
// opterraHybridAlgorithm.ts (MVP Stub)
export function calculateOpterraHybridRisk(data: ForensicInputs): OpterraResult {
  // v1.0: Reuse tank logic with hybrid-specific overrides
  // This allows shipping without full hybrid implementation
  console.warn('Hybrid algorithm using tank fallback - full implementation pending');
  return calculateOpterraTankRisk(data);
}
```

This way, hybrid units still work (using tank logic as baseline), but the codebase is cleanly separated for future hybrid-specific development.

---

## Validation After Isolation

1. Run Algorithm Validation Suite to ensure all tank scenarios pass
2. Verify demo mode generates correct recommendations for GAS/ELECTRIC
3. Test Young Tank Override gate (v9.1.1) still works correctly
4. Confirm tankless routing still works (already isolated)

---

## Benefits

| Before | After |
|--------|-------|
| 2,666 line monolith with mixed logic | Clean ~1,800 line tank algorithm |
| Hybrid bugs can break tank logic | Isolated: changes don't cross-contaminate |
| Hard to test tank-specific scenarios | Easy to unit test tank algorithm in isolation |
| Risky to ship partial features | Ship tank confidently, iterate on hybrid separately |

