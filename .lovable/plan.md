

# Fix: Young Tank Replacement Recommendation Bug

## Problem Summary
A **2-year-old unit** missing only an expansion tank is incorrectly being recommended for **replacement**. The algorithm correctly returns `REPAIR` (install expansion tank), but downstream components override this verdict based on flawed heuristics.

## Root Cause
Three components use hardcoded `bioAge >= 10` checks that **bypass the algorithm's decision**:

| Location | Bug | Impact |
|----------|-----|--------|
| `Index.tsx:357` | `bioAge >= 10` → `REPLACE_SOON` | AI prefetch uses wrong recommendation type |
| `FindingsSummaryPage.tsx:1252` | `bioAge >= 10` → `REPLACE_SOON` | Customer sees "Start Planning Replacement" |
| `HealthGauge.tsx:260` | `bioAge >= 10` → "Wear Catching Up" | Misleading status message |

### Why This Happens
A 2-year-old tank in a closed-loop system **without an expansion tank** experiences:
- Pressure spikes to ~120 PSI during heating cycles
- This causes elevated stress factors in the algorithm
- The `bioAge` can spike to 10+ even on a young tank

But this is **correctable damage** — install the expansion tank, and the stress disappears. The algorithm knows this and returns `REPAIR`, but the UI ignores it.

## Solution

### Step 1: Fix `Index.tsx` (Prefetch Logic)
Replace the flawed recommendation type logic with the correct pattern from `CommandCenter.tsx`:

```typescript
// BEFORE (buggy)
if (verdict.action === 'REPLACE' || urgency === 'IMMEDIATE') {
  recommendationType = 'REPLACE_NOW';
} else if (urgency === 'HIGH' || opterraResult.metrics.bioAge >= 10) {
  recommendationType = 'REPLACE_SOON';  // ❌ Ignores REPAIR verdict!
} else if (verdict.action === 'REPAIR' || verdict.action === 'MAINTAIN') {
  recommendationType = 'MAINTAIN';
}

// AFTER (correct)
if (verdict.action === 'REPLACE') {
  recommendationType = verdict.urgent ? 'REPLACE_NOW' : 'REPLACE_SOON';
} else if (verdict.action === 'REPAIR' || verdict.action === 'MAINTAIN') {
  recommendationType = 'MAINTAIN';
} else if (verdict.action === 'UPGRADE') {
  recommendationType = 'MONITOR';
}
// PASS stays as MONITOR
```

### Step 2: Fix `FindingsSummaryPage.tsx` (Bottom Line Logic)
The `getBottomLine()` function needs the same fix. It should respect the algorithm's verdict:

- If `verdict.action === 'REPLACE'` → Return replacement recommendation
- If `verdict.action === 'REPAIR'` or `MAINTAIN` → Return maintenance recommendation
- Remove the `bioAge >= 10` override entirely

### Step 3: Fix `HealthGauge.tsx` (Status Messaging)
Update the status message logic to compare `bioAge` relative to `calendarAge` instead of using an absolute threshold:

```typescript
// BEFORE (misleading)
if (metrics.bioAge >= 10) {
  return { message: 'Wear Catching Up', severity: 'info' };
}

// AFTER (context-aware)
const ageRatio = metrics.bioAge / Math.max(inputs.calendarAge, 1);
if (ageRatio > 1.5 && inputs.calendarAge >= 5) {
  return { message: 'Wear Catching Up', severity: 'info' };
}
```

This ensures a 2-year-old tank with `bioAge: 10` (due to stress) isn't flagged the same as a 10-year-old tank with `bioAge: 10` (normal wear).

## Files to Modify

1. **`src/pages/Index.tsx`** — Lines 355-361
2. **`src/components/FindingsSummaryPage.tsx`** — Lines 1252-1270 (the `getBottomLine` function)
3. **`src/components/HealthGauge.tsx`** — Lines 260-262

## Alignment with Existing Architecture

This fix aligns with the documented business logic:

- **Infrastructure First Gate**: Young tanks (<8 years) with correctable issues should get REPAIR/MAINTAIN verdicts
- **Technical Necessity**: The algorithm is the single source of truth for verdicts
- **Young Tank Recommendation Gate**: Replacement recommendations on young tanks are gated

## Testing Scenarios

After the fix, verify these scenarios:

| Scenario | Calendar Age | bioAge | Missing Exp Tank | Expected Result |
|----------|-------------|--------|------------------|-----------------|
| Young tank, missing expansion | 2 | 10+ | Yes | `REPAIR` (install tank) |
| Old tank, missing expansion | 12 | 15+ | Yes | `REPLACE` (too fragile) |
| Young tank, healthy | 3 | 3.5 | No | `PASS` (no issues) |

