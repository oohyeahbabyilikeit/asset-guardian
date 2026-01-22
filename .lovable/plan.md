
# Fix: Young Tank Override Logic Gap (v9.1.1)

## Problem Identified
The Young Tank Override gate uses a **narrower definition** of infrastructure issues than the UI's infrastructure detector, allowing young tanks to slip through to replacement.

### The Gap

**Infrastructure Issue Detection (line 51)** - Used for UI badges:
```typescript
const isActuallyClosed = inputs.isClosedLoop || inputs.hasPrv || inputs.hasCircPump;
```

**Young Tank Override (line 1573-1575)** - Algorithm gate:
```typescript
const needsInfrastructure = 
  (data.isClosedLoop && !data.hasExpTank) || 
  (data.housePsi > 80 && !data.hasPrv);
```

### Failure Scenario
A 4-year-old tank with:
- `isClosedLoop = false`
- `hasPrv = true` (this CREATES a closed loop!)
- `hasExpTank = false`
- `housePsi = 75` (no PRV issue triggered)

Result:
- UI shows "CODE ISSUE: Thermal expansion protection"
- But algorithm returns "End of Service Life" REPLACE

## Root Cause
The PRV and recirc pump create closed-loop conditions even when `isClosedLoop` is explicitly `false`. The Young Tank Override doesn't account for this.

## Solution
Align the Young Tank Override's infrastructure check with the infrastructure detector's logic.

### Implementation

**Step 1: Add unified closed-loop detection in algorithm**

In `src/lib/opterraAlgorithm.ts`, update the Young Tank Override gate:

```typescript
// TIER 1.9: YOUNG TANK OVERRIDE (v9.1)
const YOUNG_TANK_ABSOLUTE_THRESHOLD = 6;
const isPhysicalBreach = data.visualRust || isTankBodyLeak;

if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !isPhysicalBreach) {
  const isAnodeDepletedYoung = metrics.shieldLife <= 0;
  
  // v9.1.1 FIX: Use same closed-loop logic as infrastructureIssues.ts
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  const needsExpansionTank = isActuallyClosed && !data.hasExpTank;
  const needsPrv = data.housePsi > 80 && !data.hasPrv;
  const needsInfrastructure = needsExpansionTank || needsPrv;
  
  if (isAnodeDepletedYoung || needsInfrastructure) {
    // ... return REPAIR verdict
  }
}
```

**Step 2: Add "Catch-All" for young tanks with ANY code violations**

Even if no specific infrastructure issue is detected by the narrow check, young tanks should never hit "End of Service Life" - they should get a REPAIR or MAINTAIN verdict:

```typescript
// After the specific infrastructure check, add catch-all for young tanks
if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !isPhysicalBreach) {
  // If we reach here, young tank has high failProb but no specific issue identified
  // This should NOT hit "End of Service Life" - default to MAINTAIN
  // The algorithm will re-evaluate at next tier
}
```

Actually, the cleanest fix is a **final safety gate** before Tier 2A:

```typescript
// RIGHT BEFORE line 1607 (Tier 2A)
// v9.1.1 SAFETY NET: Young tanks cannot hit "End of Service Life"
// If they have high failProb, something is wrong - redirect to MAINTAIN
if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !isPhysicalBreach) {
  return {
    action: 'MAINTAIN',
    title: 'Elevated Wear Detected',
    reason: `Your ${data.calendarAge}-year-old tank is showing higher-than-expected wear. Professional inspection recommended to identify the root cause.`,
    urgent: true,
    badgeColor: 'orange',
    badge: 'SERVICE'
  };
}
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/opterraAlgorithm.ts` | Fix `needsInfrastructure` logic to match `infrastructureIssues.ts` |
| `docs/algorithm-changelog.md` | Document v9.1.1 fix |

## Expected Behavior After Fix

| Scenario | Before | After |
|----------|--------|-------|
| 4yr tank, PRV creates closed loop, no exp tank | REPLACE (End of Service Life) | REPAIR (Infrastructure Required) |
| 4yr tank, recirc pump, no exp tank | REPLACE | REPAIR |
| 4yr tank, high failProb, no identified cause | REPLACE | MAINTAIN (needs inspection) |
| 8yr tank, same issues | REPLACE (correctly - too old) | REPLACE |
