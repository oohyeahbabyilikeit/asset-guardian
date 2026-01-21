

# UX Refinement: CTA Consolidation & Violation Alert Cleanup

## Overview
This plan addresses two UX friction points: redundant CTAs creating decision fatigue, and a truncated/aggressive violation alert that looks broken to users.

---

## Task 1: Consolidate Redundant CTAs

### Problem
Two primary CTAs visible simultaneously:
- VerdictCard: "Discuss Your Options" (context-aware)
- ActionDock (sticky footer): "What are my options?"

Both trigger the same action but compete for attention.

### Solution
Remove the CTA button from VerdictCard and let the sticky ActionDock handle all primary conversion. VerdictCard becomes purely informational.

### Changes

**File: `src/components/VerdictCard.tsx`**
- Remove the `<Button>` component entirely (lines 147-154)
- Remove the trust indicator below it (lines 156-162)
- Remove the `onGetHelp` prop since it's no longer needed
- Simplify the component to show only: icon, title, and description

**File: `src/components/CommandCenter.tsx`**
- Remove the `onGetHelp` prop from VerdictCard usage (line 633)

### Result
VerdictCard becomes a clear, non-competing summary card. The always-visible sticky footer ("What are my options?") becomes the single conversion point.

---

## Task 2: Fix Truncated Text & Soften "VIOLATION" Label

### Problem
1. "Thermal expansion pr..." is truncating — looks broken
2. "VIOLATION" label is aggressive for homeowners

### Solution
1. Allow text to wrap properly by adjusting flex layout
2. Rename "VIOLATION" to "CODE ISSUE" (maintains urgency but feels less punitive)

### Changes

**File: `src/components/UnifiedMaintenanceCard.tsx`**

Lines 114-124: Update violation badge and fix layout
```jsx
// Change from:
<span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white mb-1 mr-2">
  VIOLATION
</span>

// Change to:
<span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white mb-1 mr-2">
  CODE ISSUE
</span>
```

Line 122: Ensure label wraps properly
```jsx
// Change from:
<h3 className="text-lg font-semibold text-foreground">
  {label}
</h3>

// Change to:
<h3 className="text-lg font-semibold text-foreground break-words">
  {label}
</h3>
```

**File: `src/components/BundledServiceCard.tsx`**

Line 126-128: Same label change
```jsx
// Change from:
<span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white">
  VIOLATION
</span>

// Change to:
<span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white whitespace-nowrap">
  CODE ISSUE
</span>
```

Lines 130-133: Fix label wrapping in the task display
```jsx
// Change from:
<p className={cn(
  "font-medium text-sm",
  task.isInfrastructure ? "text-destructive" : "text-foreground"
)}>{task.label}</p>

// Change to:
<p className={cn(
  "font-medium text-sm break-words",
  task.isInfrastructure ? "text-destructive" : "text-foreground"
)}>{task.label}</p>
```

Also update `getStatusLabel()` in UnifiedMaintenanceCard.tsx (line 94):
```jsx
// Change from:
if (isViolation) return 'Code Violation';

// Change to:
if (isViolation) return 'Code Issue';
```

---

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/VerdictCard.tsx` | Remove CTA button and trust indicator; remove `onGetHelp` prop |
| `src/components/CommandCenter.tsx` | Remove `onGetHelp` prop from VerdictCard |
| `src/components/UnifiedMaintenanceCard.tsx` | Change "VIOLATION" to "CODE ISSUE"; add `break-words` to label |
| `src/components/BundledServiceCard.tsx` | Change "VIOLATION" to "CODE ISSUE"; add `break-words` to label |

---

## Visual Outcome

**Before:**
- Two competing CTAs visible at once
- Truncated "Thermal expansion pr..." with aggressive "VIOLATION" badge

**After:**
- Single clear conversion point (sticky footer)
- Full "Thermal expansion protection" readable with softer "CODE ISSUE" badge

