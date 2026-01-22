
# Fix: Maintenance Recommendation Alignment with Algorithm Verdict

## Problem Summary
The maintenance calculation logic operates independently from the algorithm's verdict, creating conflicting recommendations:
- Algorithm returns **PASS** (e.g., "Run to Failure OK", "Anode Possibly Fused") meaning "no service recommended"
- But maintenance cards still display "Anode Rod Inspection - Due Now" because `shieldLife < 1`

This is confusing to users and undermines trust in the recommendations.

## Root Cause

### 1. Maintenance Calculation Doesn't Know About Verdict
`maintenanceCalculations.ts` calculates task urgency based purely on metrics:
```typescript
// Line 63: If shieldLife <= 1, it's "due now"
const monthsToAnodeReplacement = shieldLife > 1 ? Math.round((shieldLife - 1) * 12) : 0;
```

But it has no knowledge of whether the algorithm said:
- **MAINTAIN** → "Yes, do this maintenance"
- **PASS** → "Don't touch it, monitoring only"
- **REPLACE** → "Skip maintenance, replacing anyway"

### 2. UI Components Don't Check Verdict
- `MaintenanceEducationCard` always calculates and shows tasks
- `CommandCenter` correctly filters tasks for PASS verdicts
- `ServiceSelectionDrawer` has "Monitor Only" state but relies on receiving empty arrays

## Proposed Solution

### Option A: Filter at the Source (Recommended)
Pass the verdict action to `calculateMaintenanceSchedule` and return empty/reduced tasks for PASS verdicts:

```typescript
// maintenanceCalculations.ts
export function calculateMaintenanceSchedule(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  verdictAction?: 'MAINTAIN' | 'REPAIR' | 'REPLACE' | 'PASS'
): MaintenanceSchedule {
  // PASS verdict = no maintenance recommended
  if (verdictAction === 'PASS') {
    return {
      unitType: getUnitType(inputs.fuelType),
      primaryTask: null,
      secondaryTask: null,
      additionalTasks: [],
      isBundled: false,
      monitorOnly: true,
    };
  }
  
  // REPLACE verdict = only show replacement consultation
  if (verdictAction === 'REPLACE') {
    // Return replacement task only, no maintenance
  }
  
  // MAINTAIN/REPAIR = proceed with normal calculation
  ...
}
```

### Option B: Filter at Each Component (Alternative)
Add `verdictAction` prop to `MaintenanceEducationCard`, `MaintenancePlan`, etc. and conditionally render "Monitor Only" states.

## Implementation Plan

### Step 1: Update MaintenanceSchedule Interface
Add `monitorOnly` flag to indicate no tasks should be shown:
```typescript
export interface MaintenanceSchedule {
  unitType: 'tank' | 'tankless' | 'hybrid';
  primaryTask: MaintenanceTask | null;  // Now nullable
  secondaryTask: MaintenanceTask | null;
  additionalTasks: MaintenanceTask[];
  isBundled: boolean;
  bundledTasks?: MaintenanceTask[];
  bundleReason?: string;
  monitorOnly?: boolean;  // NEW: Algorithm said don't recommend service
}
```

### Step 2: Add Verdict Parameter to calculateMaintenanceSchedule
```typescript
export function calculateMaintenanceSchedule(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  verdictAction?: 'MAINTAIN' | 'REPAIR' | 'REPLACE' | 'PASS'
): MaintenanceSchedule
```

### Step 3: Handle PASS Verdict
Return empty schedule with `monitorOnly: true` for PASS verdicts.

### Step 4: Update All Callers
Pass the verdict action from:
- `CommandCenter.tsx`
- `MaintenancePlan.tsx`
- `MaintenanceEducationCard.tsx`

### Step 5: Update UI to Show "All Caught Up" State
When `monitorOnly` is true, show a positive message instead of maintenance tasks.

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/maintenanceCalculations.ts` | Add `verdictAction` param, handle PASS/REPLACE cases |
| `src/components/MaintenanceEducationCard.tsx` | Accept verdict prop, show "All Caught Up" for monitor-only |
| `src/components/MaintenancePlan.tsx` | Pass verdict to calculation |
| `src/components/CommandCenter.tsx` | Already handles this, but can be simplified |

## Expected Behavior After Fix

| Verdict | Maintenance Display |
|---------|---------------------|
| MAINTAIN | Show all due tasks normally |
| REPAIR | Show tasks + infrastructure |
| REPLACE | Show only "Replacement Consultation" |
| PASS | Show "All Caught Up" - no tasks |

## UI Design for "Monitor Only" State

When algorithm returns PASS, instead of maintenance tasks, show:
- Icon: Green checkmark or eye
- Title: "Your Unit Is Stable"  
- Message: Based on verdict title (Fused, Fragile, No Issues, etc.)
- CTA: "We'll be here when you need us" (soft lead capture)

This matches the existing `ServiceSelectionDrawer` "Monitor Only" state but applies it to all maintenance displays.
