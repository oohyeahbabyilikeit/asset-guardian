
# Anode Depletion Transparency: Show Active Burn Rate Factors

## Problem Statement

The anode shows as **DEPLETED (0%)** but the user doesn't understand why because:
1. There's no water softener present (no 3.0x multiplier)
2. The UI doesn't display which OTHER factors are accelerating depletion
3. Users see "DEPLETED" without context, leading to confusion

## Root Cause Analysis

The algorithm applies multiplicative burn rates from multiple sources:

| Factor | Multiplier | When Applied |
|--------|------------|--------------|
| Water Softener | 3.0x | `hasSoftener: true` |
| Direct Copper Connection | 2.5x | `connectionType: 'DIRECT_COPPER'` |
| Recirc Pump | 1.25x | `hasCircPump: true` |
| Chloramine Water | 1.2x | `sanitizerType: 'CHLORAMINE'` |

**Example**: A 7-year tank with direct copper (2.5x) and recirc pump (1.25x) has:
- Burn rate: `2.5 × 1.25 = 3.125x`
- Consumed mass: `7 × 3.125 = 21.875 years`
- Base mass (6-year warranty): `4.0 years`
- Result: **100% depleted** (consumed > available)

## Proposed Solution

### Phase 1: Add Burn Rate Factors to Algorithm Output

Add to `OpterraMetrics`:
```typescript
interface OpterraMetrics {
  // Existing
  anodeDepletionPercent: number;
  anodeStatus: 'protected' | 'inspect' | 'replace' | 'naked';
  
  // NEW: Transparency fields
  anodeBurnRate: number;           // Combined multiplier (e.g., 3.125)
  anodeBurnFactors: {              // Individual active factors
    softener: boolean;             // 3.0x if true
    galvanic: boolean;             // 2.5x if direct copper
    recircPump: boolean;           // 1.25x if true
    chloramine: boolean;           // 1.2x if true
  };
}
```

### Phase 2: Update ServiceHistory.tsx Anode Display

When anode is depleted or in `inspect`/`replace` status, show the active burn factors:

**Before (confusing):**
```
Anode Rod: DEPLETED
Shield Life: 0 years
```

**After (transparent):**
```
Anode Rod: Replace Needed (100% consumed)

Active Accelerators:
🔌 Direct Copper Connection (2.5x)
💨 Recirculation Pump (1.25x)

Combined burn rate: 3.1x normal
```

### Phase 3: Add Burn Rate Info to Algorithm Test Harness

In the test harness calculation trace, add a dedicated step showing:
- Base mass years (4.0 / 7.5 / 15)
- Active multipliers with sources
- Combined burn rate
- Consumed vs. remaining mass

## Implementation Sequence

| Step | Task | File |
|------|------|------|
| 1 | Add `anodeBurnRate` and `anodeBurnFactors` to `OpterraMetrics` | `opterraTypes.ts`, `opterraAlgorithm.ts` |
| 2 | Compute and return factors in `calculateHealth()` | `opterraAlgorithm.ts` |
| 3 | Create `AnodeBurnFactorsDisplay` component | New component |
| 4 | Update `ServiceHistory.tsx` to show factors when depleted | `ServiceHistory.tsx` |
| 5 | Update `AlgorithmCalculationTrace.tsx` with burn rate step | `AlgorithmCalculationTrace.tsx` |

## UI Preview

When anode is depleted, the ServiceHistory card will show:

```
┌─────────────────────────────────────────┐
│  🛡️ Anode Protection                   │
│                                         │
│  Status: Replace Needed                 │
│  Depletion: 100% (tank unprotected)     │
│                                         │
│  ⚡ Why depleted faster than normal?    │
│  ├─ 🔌 Direct copper connection: 2.5x   │
│  └─ ♻️ Recirculation pump: 1.25x        │
│                                         │
│  Combined wear rate: 3.1x normal        │
└─────────────────────────────────────────┘
```

## Expected Outcome

Users will understand that:
1. Anode depletion is a function of **multiple factors**, not just softener
2. The displayed percentage is a **calculated estimate** based on environmental conditions
3. **Action is needed** regardless of which factor caused the depletion
