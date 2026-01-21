

# Fix: Urgency Tier Must Account for Priority Findings

## The Bug

The `getUrgencyTier` function returns `'monitor'` (stable) when `isPassVerdict` is true, completely ignoring whether violations exist:

```typescript
if (isPassVerdict) return 'monitor';  // Shows "Your Unit Is Stable"
```

This creates a contradiction where the drawer says "stable" while showing a red CODE VIOLATION card.

## The Root Cause

The algorithm's `isPassVerdict` only reflects the **water heater's servicability** (e.g., "anode may be fused - don't touch it"). It does NOT account for **installation infrastructure issues** like missing expansion tanks.

These are separate concerns:
- **Unit servicability**: Can we safely perform maintenance on the tank?
- **Code compliance**: Are there installation violations that need fixing?

## The Fix

Update `getUrgencyTier` in `OptionsAssessmentDrawer.tsx` to check for priority findings before defaulting to monitor tier.

### Changes to OptionsAssessmentDrawer.tsx

**1. Update function signature** (add priorityFindings parameter):

```typescript
function getUrgencyTier(
  healthScore: number, 
  verdictAction: VerdictAction, 
  isPassVerdict: boolean,
  priorityFindings: PriorityFinding[]  // NEW
): UrgencyTier {
  // Check for critical findings first - violations override PASS verdict
  const hasCriticalFinding = priorityFindings.some(f => f.severity === 'critical');
  const hasWarningFinding = priorityFindings.some(f => f.severity === 'warning');
  
  if (hasCriticalFinding) return 'critical';  // Violations = immediate attention
  if (hasWarningFinding) return 'attention';  // Infrastructure issues = proactive
  
  // Only show "stable" if PASS verdict AND no findings
  if (isPassVerdict) return 'monitor';
  
  // Existing logic for health score thresholds
  if (healthScore < 40 || verdictAction === 'REPLACE') return 'critical';
  if (healthScore < 70 || verdictAction === 'REPAIR') return 'attention';
  return 'healthy';
}
```

**2. Update the function call** in the component:

```typescript
const tier = getUrgencyTier(healthScore, verdictAction, isPassVerdict, priorityFindings);
```

**3. Update monitor tier messaging** for when it IS actually stable:

The current messaging is fine for the true "stable" case - it will only show when:
- `isPassVerdict` is true AND
- There are zero priority findings

## Result

| Scenario | Before | After |
|----------|--------|-------|
| PASS verdict + no findings | "Your Unit Is Stable" | "Your Unit Is Stable" |
| PASS verdict + violation | "Your Unit Is Stable" (BUG) | "Immediate Attention Recommended" |
| PASS verdict + infrastructure issue | "Your Unit Is Stable" (BUG) | "Proactive Maintenance Recommended" |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/OptionsAssessmentDrawer.tsx` | Update `getUrgencyTier` to check priority findings before returning monitor tier |

