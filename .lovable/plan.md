
# Fix: Young Tank Algorithm Gate Bypass (v9.1)

## Problem Identified
The v9.0 anode algorithm changes made the algorithm **too aggressive on young tanks with softeners**:

| Factor | Before v9.0 | After v9.0 |
|--------|-------------|------------|
| Base anode life | 6 years | 4 years |
| Softener multiplier | +1.4x (additive) | 3.0x (multiplicative) |

**The Math (3-year-old tank with softener):**
- Consumed mass: 3 years x 3.0 = **9 anode-years**
- Base capacity: 4 years
- Remaining: 4 - 9 = **-5 years** (naked since ~year 1.3)
- Naked phase: ~1.7 years exposed to full corrosion stress
- Result: Bio-age spikes → failProb > 60% → Tier 2A "End of Service Life" REPLACE

**Why the Infrastructure First gate fails:**
- The gate (line 1580) requires `failProb < 50`
- By the time we reach that gate, failProb is already 60%+
- The young tank bypasses the protection entirely

## Root Cause
The v9.0 changes correctly model anode physics, but the **failProb threshold in the Infrastructure First gate is too low** for the new aggressive calculation. Young tanks with softeners legitimately have depleted anodes, but they're still **young enough to save** with an anode replacement + infrastructure fix.

## Solution: "Young Tank Override" Priority Gate
Add a NEW gate **before** Tier 2A that protects tanks under 6 years old from hitting the "End of Service Life" threshold, regardless of failProb.

### Logic:
```
If tank is ≤ 6 years old AND has no physical breach (no rust/leak):
  → Cannot trigger "End of Service Life"
  → Instead: Redirect to REPAIR with "Protect Your Investment" or "Anode Service Required"
```

This is "Technical Necessity" thinking: A 3-year-old tank with a depleted anode is NOT at end of life - it needs an anode replacement. The steel hasn't failed; the sacrificial protection has.

## Implementation Plan

### Step 1: Add Young Tank Override Gate (New Tier 1.9)
In `src/lib/opterraAlgorithm.ts`, add a new gate **before** Tier 2A that prevents young tanks from hitting replacement thresholds:

```typescript
// NEW v9.1: Young Tank Override - Physical Age Trumps Statistical Age
// A 3-year-old tank with a depleted anode is NOT at end of life
// The steel hasn't failed - only the sacrificial protection has
const YOUNG_TANK_ABSOLUTE_THRESHOLD = 6; // Years

if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !data.visualRust && !isTankBodyLeak) {
  // Young tank cannot hit "End of Service Life" - anode is replaceable
  const isAnodeDepleted = metrics.shieldLife <= 0;
  const needsInfrastructure = (data.isClosedLoop && !data.hasExpTank) || 
                              (data.housePsi > 80 && !data.hasPrv);
  
  if (isAnodeDepleted || needsInfrastructure) {
    return {
      action: 'REPAIR',
      title: isAnodeDepleted ? 'Anode Service Required' : 'Infrastructure Upgrade Required',
      reason: `Your ${data.calendarAge}-year-old tank is young enough to protect. ${
        isAnodeDepleted 
          ? 'The sacrificial anode has been consumed faster than expected - replacement will restore corrosion protection.'
          : 'Installing code-required infrastructure will reduce stress and extend useful life.'
      }`,
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE',
      note: 'Young tank with correctable issues - worth protecting.'
    };
  }
}
```

### Step 2: Update the Existing Infrastructure First Gate
Remove the `failProb < 50` requirement from line 1580 - it's now redundant because the Young Tank Override catches these cases earlier.

### Step 3: Add Test Scenario
In `src/lib/__tests__/scenarioValidation.ts`, add a test case:
- **"Young Tank with Softener"**: 3yr, softener, closed-loop, no exp tank
- **Expected**: REPAIR (not REPLACE)

### Step 4: Update Documentation
In `docs/algorithm-changelog.md`:
- Document v9.1 "Young Tank Override" gate
- Explain that physical calendar age (≤6 years) now overrides statistical failure probability for non-breached tanks

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/opterraAlgorithm.ts` | Add Young Tank Override gate before Tier 2A (~line 1515) |
| `src/lib/__tests__/scenarioValidation.ts` | Add "Young Tank with Softener" test case |
| `docs/algorithm-changelog.md` | Document v9.1 changes |

## Expected Behavior After Fix

| Scenario | Before Fix | After Fix |
|----------|------------|-----------|
| 3yr tank, softener, closed-loop, no exp tank | REPLACE (failProb 65%) | REPAIR (Anode Service + Infrastructure) |
| 5yr tank, softener, high pressure, no PRV | REPLACE (failProb 55%) | REPAIR (Infrastructure Required) |
| 8yr tank, same issues | REPLACE (age exceeds threshold) | REPLACE (correctly - too old to save) |
| 3yr tank, visual rust | REPLACE (breach) | REPLACE (correctly - physical failure) |
