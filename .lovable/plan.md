

# Fix Conflicting Replacement vs. Maintenance Messaging

## The Problem

The screenshot shows a clear UX contradiction:
- **VerdictCard** (top): "Replace Your Water Heater"
- **Drawer Banner**: "Proactive Maintenance Recommended" (amber)

This happens because the urgency tier logic prioritizes finding severity over the algorithm's verdict action. When a replacement is recommended but the finding has `warning` severity, it incorrectly shows maintenance messaging.

## Root Cause

In `getUrgencyTier()` (lines 57-77):

```typescript
// Current logic - findings checked FIRST
const hasWarningFinding = priorityFindings.some(f => f.severity === 'warning');
if (hasWarningFinding) return 'attention';  // <-- Maintenance messaging

// Algorithm verdict checked SECOND
if (verdictAction === 'REPLACE') return 'critical';  // <-- Never reached!
```

## Solution

Prioritize the algorithm's REPLACE verdict over finding severity to ensure consistent messaging:

```typescript
function getUrgencyTier(...) {
  // REPLACE verdict always takes priority - the algorithm has spoken
  if (verdictAction === 'REPLACE') return 'critical';
  
  // Then check findings for PASS verdicts with violations
  const hasCriticalFinding = priorityFindings.some(f => f.severity === 'critical');
  const hasWarningFinding = priorityFindings.some(f => f.severity === 'warning');
  
  if (hasCriticalFinding) return 'critical';
  if (hasWarningFinding) return 'attention';
  
  if (isPassVerdict) return 'monitor';
  
  if (healthScore < 40) return 'critical';
  if (healthScore < 70 || verdictAction === 'REPAIR') return 'attention';
  return 'healthy';
}
```

Additionally, update the `'critical'` tier messaging to be replacement-aware:

```typescript
case 'critical':
  // If it's a replacement, use replacement-specific language
  const isReplacement = verdictAction === 'REPLACE';
  return {
    headline: isReplacement 
      ? 'Replacement Recommended' 
      : 'Immediate Attention Recommended',
    subheadline: isReplacement
      ? 'Based on our assessment, your unit has reached the end of its serviceable life.'
      : 'Our assessment found issues that need prompt professional attention.',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30',
  };
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/OptionsAssessmentDrawer.tsx` | Reorder `getUrgencyTier()` logic to check REPLACE first; update `getRecommendation()` for replacement-aware messaging |

## Expected Result

When the algorithm recommends replacement:
- **VerdictCard**: "Replace Your Water Heater" 
- **Drawer Banner**: "Replacement Recommended" (red, not amber)
- **Priority Finding**: "URGENT ACTION - Replacement Consultation"

All messaging will be aligned and consistent.

