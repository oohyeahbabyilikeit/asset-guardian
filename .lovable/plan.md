

# Opterra v9.1 Algorithm Patch - Gemini-Validated Physics Corrections

## Overview

This plan implements the three required code patches identified by Gemini's physics review of the Opterra tank water heater algorithm. All three fixes address mathematically or physically incorrect behavior that could lead to inaccurate health assessments.

---

## Patch Summary

| Fix | Issue | Current Value | New Value | Impact |
|-----|-------|---------------|-----------|--------|
| 1 | Unreachable Verdict | `failProb > 60` | `failProb > 45` | Makes "End of Service Life" reachable before age-out |
| 2 | Static ETA | `ETA = 13.0` (all tiers) | Dynamic ETA based on warranty | 6yr=13.0, 9yr=14.5, 12yr=16.0 |
| 3 | Soft Water Naked Penalty | `2.5x` | `4.0x` | Reflects true corrosion rate of bare steel in soft water |

**Bonus Fix (Gemini Recommendation #8):**
| 4 | Pressure Duty Cycle | `0.25` dampener | `0.50` for closed-loop | Better models fatigue from daily 60-120 PSI cycles |

---

## Technical Implementation Details

### Patch 1: Fix "Unreachable Verdict" Bug

**Problem:**
The current `failProb > 60` threshold is mathematically impossible to hit before the `LIMIT_AGE_MAX = 20` age-out. With Weibull parameters `ETA=13.0` and `BETA=3.2`, the hazard rate at Age 15 is only ~30% and doesn't cross 60% until Age 21.

**Files:**
- `src/lib/opterraAlgorithm.ts` (line ~1714)
- `src/lib/opterraTypes.ts` (line ~505)

**Code Changes:**

In `opterraAlgorithm.ts` (Verdict Engine - Tier 2A):
```typescript
// BEFORE (line ~1714):
if (metrics.failProb > 60 || data.calendarAge > CONSTANTS.LIMIT_AGE_MAX) {

// AFTER:
if (metrics.failProb > 45 || data.calendarAge > CONSTANTS.LIMIT_AGE_MAX) {
```

In `opterraTypes.ts` (CONSTANTS - line ~505):
```typescript
// BEFORE:
LIMIT_FAILPROB_FRAGILE: 60,

// AFTER:
LIMIT_FAILPROB_FRAGILE: 45, // v9.1 Fix: Lowered to make End of Service Life reachable
```

---

### Patch 2: Dynamic ETA (Warranty-Aware Weibull)

**Problem:**
A 6-year builder-grade tank and a 12-year professional-grade tank share the same death curve (ETA=13.0). This ignores the physical reality that premium tanks have better glass lining and dual anodes.

**Files:**
- `src/lib/opterraAlgorithm.ts` (line ~1359-1367)

**Code Changes:**

Add dynamic ETA calculation before Weibull failProb:
```typescript
// BEFORE (line ~1359-1367):
// 5. WEIBULL FAILURE PROBABILITY
const t = bioAge;
const eta = CONSTANTS.ETA;
const beta = CONSTANTS.BETA;

const rNow = Math.exp(-Math.pow(t / eta, beta));
const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));

// AFTER:
// 5. WEIBULL FAILURE PROBABILITY
// v9.1 FIX "Dynamic ETA": Warranty-aware characteristic life
// Base ETA 13.0 is for 6-year warranty. Add 0.5 years per tier above baseline.
// Result: 6yr=13.0, 9yr=14.5, 12yr=16.0, 15yr=17.5
const warrantyBonus = ((data.warrantyYears ?? 6) - 6) * 0.5;
const dynamicEta = CONSTANTS.ETA + warrantyBonus;

const t = bioAge;
const eta = dynamicEta;
const beta = CONSTANTS.BETA;

const rNow = Math.exp(-Math.pow(t / eta, beta));
const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
```

---

### Patch 3: Correct Soft Water Naked Physics

**Problem:**
The current 2.5x conductivity penalty for bare steel in soft water is too lenient. Research shows corrosion rates can be 4.0x to 5.0x higher in soft water vs. hard water due to the absence of passivating scale.

**Files:**
- `src/lib/opterraAlgorithm.ts` (line ~1351)

**Code Changes:**

```typescript
// BEFORE (line ~1351):
const waterConductivity = data.hasSoftener ? 2.5 : 1.0;

// AFTER:
// v9.1 FIX "Soft Water Physics": Increased from 2.5x to 4.0x
// Research shows carbon steel corrosion in soft water is 4.0-5.0x faster
// than in hard water (0.25 mm/y vs 0.05 mm/y) due to lack of passivation.
// Nernst's Principle: High conductivity = higher corrosion current
const waterConductivity = data.hasSoftener ? 4.0 : 1.0;
```

---

### Patch 4: Pressure Duty Cycle Correction (Bonus)

**Problem:**
The 0.25 dampener for transient pressure is too lenient. Daily cycling from 60 to 120 PSI in closed-loop systems causes significant glass lining fatigue.

**Files:**
- `src/lib/opterraAlgorithm.ts` (line ~1164)

**Code Changes:**

```typescript
// BEFORE (line ~1164):
pressureStress = 1.0 + (cyclicFatiguePenalty * 0.25);

// AFTER:
// v9.1 FIX "Pressure Duty Cycle": Increased from 0.25 to 0.50 for closed-loop
// Daily 60→120→60 PSI cycles are more damaging than 0.25 implies
// Fatigue failure follows power law (S^N) - cyclic stress is cumulative
const closedLoopDampener = 0.50;
const openLoopDampener = 0.25;
const effectiveDampener = (data.isClosedLoop || data.hasPrv || data.hasCircPump) 
  ? closedLoopDampener 
  : openLoopDampener;
pressureStress = 1.0 + (cyclicFatiguePenalty * effectiveDampener);
```

---

## Documentation Updates

### Update `docs/algorithm-changelog.md`

Add a new v9.1 section at the top:

```markdown
## v9.1 (Gemini Physics Audit - 4 Corrections)

**Validated by Gemini AI Physics Review (2026-02-02)**

**FIX 1 "Unreachable Verdict":**
- Lowered `failProb` threshold from 60% to 45%
- With Weibull(η=13, β=3.2), hazard rate at Age 15 was only ~30%
- The old threshold was unreachable before age-out (Age 21 to hit 60%)
- Now properly triggers "End of Service Life" at practical ages

**FIX 2 "Dynamic ETA":**
- Weibull ETA now scales with warranty tier
- 6-year tank: η=13.0 (baseline)
- 9-year tank: η=14.5 (+1.5)
- 12-year tank: η=16.0 (+3.0)
- 15-year tank: η=17.5 (+4.5)
- Reflects physical reality: premium tanks have better glass and dual anodes

**FIX 3 "Soft Water Naked Penalty":**
- Increased conductivity multiplier from 2.5x to 4.0x
- Research shows soft water corrodes bare steel at 4-5x the rate of hard water
- Hard water forms passivating calcium carbonate scale
- Soft water accelerates ion transfer per Nernst's Principle

**FIX 4 "Pressure Duty Cycle":**
- Increased closed-loop dampener from 0.25 to 0.50
- Reflects cumulative fatigue damage from daily thermal expansion cycles
- Open-loop systems retain 0.25 dampener (less frequent cycling)
```

---

## Validation Approach

After implementation, validate using the existing Algorithm Validation Test Suite:

1. **Run `scenarioValidation.ts`** to ensure 40+ scenarios still pass
2. **Check boundary cases:**
   - 12-year tank should now hit `failProb > 45` earlier than before
   - 12-year professional tank should have longer projected life than 12-year builder tank
   - Naked tank with softener should show ~60% higher bioAge than v8.2

---

## Risk Assessment

| Change | Risk Level | Mitigation |
|--------|------------|------------|
| Lower failProb threshold | Medium | May push some borderline units to REPLACE; validate with test suite |
| Dynamic ETA | Low | Only affects units with 9+ year warranty; improves accuracy |
| Soft water penalty | Medium | More aggressive on naked+softener combos; matches physical reality |
| Pressure dampener | Low | Only affects closed-loop transient pressure scenarios |

---

## Summary

This patch corrects four physics/math errors identified by Gemini's review:

1. **Unreachable verdict** - Statistical threshold was impossible to hit
2. **Static death curve** - Premium tanks had no survival advantage
3. **Soft water underestimate** - Conductivity penalty was 40% too lenient
4. **Pressure dampener** - Fatigue damage was underweighted for closed-loop

All changes are scientifically defensible and improve the algorithm's predictive accuracy without adding new features or complexity.

