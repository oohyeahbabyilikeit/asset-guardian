# Demo Scenario Documentation

This document lists all demo scenarios used across the application, their expected algorithm recommendations, and key stress factors.

## Scenario Sources

1. **mockAsset.ts** - Predefined scenarios with specific inputs
2. **generateRandomScenario.ts** - Weighted archetypes for random generation
3. **AlgorithmTestHarness.tsx** - Edge-case test scenarios

---

## mockAsset.ts Scenarios (19 total)

### Tank Water Heaters (10 scenarios)

| Scenario | Age | Key Stress Factors | Expected Action | Expected Badge |
|----------|-----|-------------------|-----------------|----------------|
| The Perfect Install | 2 | All equipment, low hardness (8 GPG), 55 PSI | PASS | HEALTHY |
| The Garage Sleeper | 4 | Has exp tank & PRV, moderate hardness (12 GPG) | PASS/MAINTAIN | HEALTHY |
| The Low-Risk Rental | 3 | No exp tank or PRV but not closed-loop, basement | PASS/MAINTAIN | HEALTHY |
| The Sediment Builder | 6 | 20 GPG hardness, no flush history, heavy usage | REPAIR (Flush) | WARNING |
| The Pressure Cooker | 5 | 95 PSI (!), has exp tank but NO PRV, finished area | REPAIR (PRV) | WARNING |
| The Missing Tank | 4 | Closed-loop, NO expansion tank, finished area | REPAIR (Exp Tank) | WARNING |
| The Softener Accelerator | 7 | Attic + softener (accelerates anode decay) | REPLACE/REPAIR | CRITICAL |
| The Basement Time Bomb | 11 | 82 PSI, 22 GPG, visual rust, HIGH temp, 5 people | REPLACE | CRITICAL |
| The Double Whammy | 9 | Attic + rust + no exp tank + closed loop + HIGH temp | REPLACE | CRITICAL |
| The Zombie Tank | 12 | 88 PSI, no exp/PRV, HIGH temp, old | REPLACE | CRITICAL |

### Hybrid Water Heaters (3 scenarios)

| Scenario | Age | Key Stress Factors | Expected Action | Expected Badge |
|----------|-----|-------------------|-----------------|----------------|
| The Efficient Hybrid | 2 | All equipment, CLEAN filter, condensate clear | PASS | HEALTHY |
| The Clogged Hybrid | 3 | CLOGGED filter, condensate blocked, heavy usage | REPAIR (Filter) | WARNING |
| The Dusty Hybrid | 3 | DIRTY filter, missing exp tank, closed loop | REPAIR/MAINTAIN | WARNING |

### Tankless Water Heaters (6 scenarios)

| Scenario | Age | Key Stress Factors | Expected Action | Expected Badge |
|----------|-----|-------------------|-----------------|----------------|
| The Efficient Tankless | 2 | Has isolation valves, clean, recent descale | PASS | HEALTHY |
| The Hard Water Warrior | 5 | 22 GPG, 35% scale, has valves, overdue descale | REPAIR (Descale) | WARNING |
| The Igniter Issue | 6 | 45% igniter, NO isolation valves, 12 error codes | REPLACE/REPAIR | CRITICAL |
| The Electric Instant | 3 | Electric, healthy, has valves | PASS | HEALTHY |
| The Scaled Tankless (No Valves) | 6 | 42% scale, NO isolation valves, never descaled | REPAIR (Install Valves) | WARNING |
| The Descale Due Tankless | 4 | 18% scale, HAS valves, overdue 2.5 years | REPAIR (Descale) | WARNING |

---

## generateRandomScenario.ts Archetypes (11 total)

| Archetype | Age Range | Weight | Condition | Expected Range |
|-----------|-----------|--------|-----------|----------------|
| The Perfect Install | 1-3 | 15% | Excellent | PASS |
| The Healthy Veteran | 4-7 | 10% | Good | PASS/MAINTAIN |
| The Pressure Cooker | 3-8 | 10% | Stressed + high pressure | REPAIR (PRV/expansion) |
| The Sediment Bomb | 5-10 | 10% | Neglected + high hardness | REPAIR/REPLACE |
| The Zombie Tank | 8-14 | 8% | Critical | REPLACE |
| The Attic Bomb | 6-12 | 8% | Risky + Attic location | REPLACE (Attic Liability) |
| The Hard Water Victim | 4-9 | 10% | Extreme hardness (20-35 GPG) | REPAIR/REPLACE |
| The Frat House | 3-7 | 7% | Extreme usage (5-8 people) | MAINTAIN/REPAIR |
| The Grandma Special | 8-15 | 7% | Minimal usage (1-2 people) | REPLACE (age) |
| The Ticking Clock | 10-14 | 8% | Expiring (near end of life) | REPLACE |
| The Leaker | 6-12 | 7% | Leaking (tank body or fitting) | REPLACE/REPAIR |

**Note**: Random generator only produces GAS or ELECTRIC tank water heaters (not hybrid/tankless) to focus on core physics model.

---

## AlgorithmTestHarness.tsx Scenarios (10 total)

| Scenario | Key Stress Factor | Expected Action | Notes |
|----------|------------------|-----------------|-------|
| Attic Time Bomb | 12yr attic, no pan, closed loop | REPLACE | Attic Liability gate |
| Zombie Expansion Tank | 8yr, waterlogged exp tank, 90 PSI | REPAIR | Replace exp tank |
| Gas Starvation | Tankless, undersized 1/2" gas line | REPAIR | Gas line upgrade |
| Chloramine + Hard Water | 22 GPG + chloramine, HOT temp | REPLACE/REPAIR | Chemistry stress |
| Orphaned Flue | Atmospheric + orphaned flue scenario | REPLACE | Venting hazard |
| Galvanic Nightmare | Direct copper, fitting leak, rust | REPLACE | Too Fragile to Service |
| Hybrid Suffocation | Hybrid in sealed closet, clogged filter | REPAIR | Airflow restoration |
| Tankless Scale Crisis | Never descaled, NO isolation valves | REPAIR | Install valves first |
| Legionella Risk | LOW temp, light usage, 80 gal | MAINTAIN | Temperature adjustment |
| Perfect Unit | All equipment, well-maintained | PASS | Baseline healthy |

---

## Algorithm v8.5 Gates Reference

### Safety Gates (Priority Order)

1. **Tier 1A: Containment Breach** - Visual rust OR tank body leak → REPLACE
2. **Tier 1B: Vessel Fatigue** - bioAge > 20 OR (old + high PSI) → REPLACE
3. **Tier 1C: Sediment Lockout** - sedimentPounds > 15 → REPLACE

### Economic Gates

4. **Tier 2A: Attic Liability** - Attic location + failProb > 15% → REPLACE
5. **Tier 2B: Bad Investment** - Age 8+ AND dead anode AND failProb > 25% → REPLACE
6. **Tier 2C: Naked Aging** - bioAge > calendarAge × 1.8 AND age > 6 → REPLACE

### Infrastructure First Gate (v8.5 NEW)

- **Young Tank Protection** - If tank ≤6 years AND has correctable stress (missing exp tank/PRV):
  - Recommend REPAIR ("Protect Your Investment") instead of REPLACE
  - Calculate yearsRemaining using optimized rate (post-fix projection)

### Repair Gates

7. **Tier 3A: Missing Thermal Expansion** - Closed loop without exp tank → REPAIR
8. **Tier 3B: Critical Pressure Violation** - PSI > 80 without PRV → REPAIR
9. **Tier 3C: Waterlogged Expansion Tank** - Exp tank present but waterlogged → REPAIR

### Fragility Filter

- Tanks > 12 years OR failProb > 50% → "Too Fragile to Service"
- No aggressive repairs (torque could rupture vessel)

---

## Test Matrix Summary

| Category | Count | PASS | REPAIR | REPLACE |
|----------|-------|------|--------|---------|
| mockAsset Tank | 10 | 3 | 4 | 3 |
| mockAsset Hybrid | 3 | 1 | 2 | 0 |
| mockAsset Tankless | 6 | 2 | 4 | 0 |
| Random Archetypes | 11 | 2 | 4 | 5 |
| Test Harness | 10 | 1 | 5 | 4 |
| **Total** | **40** | **9** | **19** | **12** |

---

## Running Validation

To validate all scenarios match expected recommendations:

```typescript
import { runFullValidation } from '@/lib/__tests__/scenarioValidation';

// Run in console
runFullValidation();
```

This will log:
- Summary of pass/fail counts by source
- Detailed failure information with actual vs expected values
- Key metrics (bioAge, failProb, hasHighBioAge) for debugging
