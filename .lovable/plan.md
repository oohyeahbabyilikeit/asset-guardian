
# Algorithm Tuning: "Infrastructure First" Gate for Young Tanks

## Problem Statement
A 3-year-old basement unit without an expansion tank is being shown "replacement" language in the UI, even though the algorithm correctly returns a `REPAIR` verdict. This feels too aggressive.

**Root Cause**: The financial forecast and "years remaining" calculations use the **current accelerated aging rate** instead of the **optimized rate** that assumes infrastructure fixes are applied. This makes young tanks with correctable issues look like they're nearing end-of-life.

---

## Current Behavior

For a 3-year-old tank in a closed loop without expansion tank:

| Metric | Current Value | Issue |
|--------|---------------|-------|
| Verdict | `REPAIR` ✓ | Correct |
| Aging Rate | ~2.5x | High due to thermal expansion stress |
| Years Remaining | (13 - 3) / 2.5 = **4 years** | Uses stressed rate |
| UI Display | "Schedule Maintenance" + "Plan for replacement in 4 years" | Conflicting signals |

The verdict says "fix it" but the financial forecast says "it's almost dead."

---

## Proposed Fix

### Task 1: Implement "Infrastructure First" Financial Gate

**File: `src/lib/opterraAlgorithm.ts`**

In `calculateFinancialForecast()` (lines ~1970-1978), when the verdict is `REPAIR` and the unit is young (under 8 years), use the `optimizedRate` instead of `agingRate` for the years-remaining calculation.

```typescript
// Current (lines 1976-1978):
if (rawYearsRemaining > 0) {
  adjustedYearsRemaining = rawYearsRemaining / metrics.agingRate;
}

// Proposed:
if (rawYearsRemaining > 0) {
  // Use optimized rate for young tanks with correctable issues
  // This assumes the recommended infrastructure fix IS applied
  const isYoungWithCorrectableIssues = data.calendarAge < 8 && metrics.optimizedRate < metrics.agingRate;
  const effectiveRate = isYoungWithCorrectableIssues ? metrics.optimizedRate : metrics.agingRate;
  adjustedYearsRemaining = rawYearsRemaining / effectiveRate;
}
```

This change means a 3-year-old tank will show:
- **Before**: (13 - 3) / 2.5 = 4 years remaining
- **After**: (13 - 3) / 1.5 = 6.7 years remaining (assuming fixes applied)

### Task 2: Cap Minimum Years Remaining for Young REPAIR Verdicts

**File: `src/components/CommandCenter.tsx`**

Add a floor for `yearsRemaining` when the verdict is `REPAIR` and the unit is young, to prevent misleading "replacement soon" messaging.

```typescript
// Current (line 503):
const yearsRemaining = Math.max(0, Math.round(estimatedTotalLife - metrics.bioAge));

// Proposed:
let yearsRemaining = Math.max(0, Math.round(estimatedTotalLife - metrics.bioAge));

// Infrastructure First Gate: If algorithm says REPAIR on a young tank,
// give them credit for the fix by using optimized remaining life
const isYoungRepairCandidate = inputs.calendarAge < 8 && (verdict.action === 'REPAIR' || verdict.action === 'UPGRADE');
if (isYoungRepairCandidate && metrics.yearsLeftOptimized > yearsRemaining) {
  yearsRemaining = Math.round(metrics.yearsLeftOptimized);
}
```

### Task 3: Update OptionsAssessmentDrawer "Plan for Replacement" Threshold

**File: `src/components/OptionsAssessmentDrawer.tsx`**

Change the "Plan for Replacement" topic to only show for tanks 6+ years old OR when the verdict is actually `REPLACE`.

```typescript
// Current (lines 126-133):
if (tier === 'monitor') {
  if (yearsRemaining > 0 && yearsRemaining <= 3) {
    topics.push({
      title: 'Plan for Replacement',
      ...
    });
  }
}

// Proposed:
if (tier === 'monitor') {
  // Only show replacement planning for older tanks or truly declining units
  const isOldEnoughForReplacementPlanning = calendarAge >= 6;
  if (yearsRemaining > 0 && yearsRemaining <= 3 && isOldEnoughForReplacementPlanning) {
    topics.push({
      title: 'Plan for Replacement',
      ...
    });
  }
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/lib/opterraAlgorithm.ts` | Use `optimizedRate` for young tanks in financial forecast |
| `src/components/CommandCenter.tsx` | Floor `yearsRemaining` using optimized metrics for REPAIR verdicts |
| `src/components/OptionsAssessmentDrawer.tsx` | Gate "Plan for Replacement" topic behind age check |

---

## Expected Outcome

**Before (3-year-old basement, no expansion tank):**
- Verdict: "Schedule Maintenance" (correct)
- Years Remaining: 4 years (stressed rate)
- Messaging: Confusing - shows replacement planning topics

**After:**
- Verdict: "Schedule Maintenance" (correct)
- Years Remaining: 7 years (optimized rate, assumes fix)
- Messaging: Consistent - focuses on the infrastructure fix, not replacement

---

## Edge Cases Handled

1. **Old tank with infrastructure issues** (age 10+): Still uses current aging rate (infrastructure fix won't save a dying tank)
2. **Young tank with containment breach**: Override bypasses this logic - still shows REPLACE NOW
3. **Young tank in attic without drain pan**: Safety override still applies - urgent REPAIR with attic warning

This preserves the algorithm's safety-first hierarchy while making the financial messaging more appropriate for correctable infrastructure issues on young tanks.
