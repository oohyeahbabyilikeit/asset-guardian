
# Transform Assessment Page into Priority Findings Education

## The Problem
The current "Your Assessment" drawer shows generic content like:
- "Your unit is showing high wear"  
- "Expert Guidance: A professional can provide personalized recommendations"

This doesn't educate customers on their **specific** issues or preview what the next page will recommend.

## The Solution
Rewrite the assessment drawer to show:
1. **Top 2-3 Priority Findings** - the actual issues detected (e.g., "Missing Expansion Tank", "High Water Pressure")
2. **What We Recommend** - preview the exact categories they'll see next (Violations, Urgent Actions, etc.)

---

## Data Already Available

The `CommandCenter` already computes all the data we need:

| Data | Source | Purpose |
|------|--------|---------|
| `violationIssues` | `getIssuesByCategory(..., 'VIOLATION')` | Code compliance issues |
| `infrastructureRecommendations` | `getIssuesByCategory(..., 'INFRASTRUCTURE')` | Urgent protective work |
| `optimizationIssues` | `getIssuesByCategory(..., 'OPTIMIZATION')` | Add-ons like softeners |
| `verdict.title` | Algorithm output | "Liability Hazard", "Aging Too Fast", etc. |
| `metrics.stressFactors` | Algorithm output | Pressure, sediment, etc. |

---

## Implementation Plan

### 1. Expand OptionsAssessmentDrawer Props

Add new props to pass the prioritized findings:

```typescript
interface OptionsAssessmentDrawerProps {
  // ... existing props
  
  // NEW: Priority findings for education
  priorityFindings?: {
    id: string;
    name: string;
    friendlyName: string;
    category: 'VIOLATION' | 'INFRASTRUCTURE' | 'OPTIMIZATION';
    severity: 'critical' | 'warning' | 'info';
  }[];
  
  // NEW: Preview what next page will show
  nextPagePreview?: {
    hasViolations: boolean;
    hasUrgentActions: boolean;
    hasAddOns: boolean;
    hasReplacement: boolean;
  };
}
```

### 2. Pass Data from CommandCenter

In `CommandCenter.tsx`, compute and pass the priority findings:

```typescript
// Build priority findings from infrastructure issues
const priorityFindings = [
  ...violationIssues.map(i => ({ ...i, severity: 'critical' as const })),
  ...infrastructureRecommendations.map(i => ({ ...i, severity: 'warning' as const })),
].slice(0, 3); // Top 3 priority items

const nextPagePreview = {
  hasViolations: violationIssues.length > 0,
  hasUrgentActions: finalRecommendationTasks.length > 0,
  hasAddOns: addOnTasks.length > 0,
  hasReplacement: shouldShowReplacementOption,
};

// Pass to drawer
<OptionsAssessmentDrawer
  ...
  priorityFindings={priorityFindings}
  nextPagePreview={nextPagePreview}
/>
```

### 3. Replace Generic Content with Specific Findings

**Current "Your Situation" section** (generic):
```
• Your unit is showing high wear – well past the typical 8-12 year lifespan.
• Missing expansion tank on a closed-loop system creates excess pressure stress.
```

**New "Priority Findings" section** (specific):
```
⚠️ CODE VIOLATION
   Expansion Tank Required
   Your closed-loop system needs thermal expansion protection

⚠️ URGENT ACTION  
   PRV Installation Recommended
   Water pressure at 75 PSI accelerates wear on all plumbing
```

### 4. Add "Next Steps" Preview

Replace generic "Why This Matters" with a preview of what they'll see:

**Current**:
```
🔧 Replacement Planning
   Understanding your options now helps you avoid emergency decisions later.

⚡ Expert Guidance  
   A professional can provide personalized recommendations...
```

**New "What We'll Cover Next"**:
```
You'll see options in these areas:

🔴 Code Violations (1 item)
   Required work for system compliance

🟠 Urgent Actions (2 items)
   Protective measures to prevent damage

💡 Add-Ons  
   Optional improvements worth discussing
```

---

## Visual Design

### Priority Findings Card
- Each finding gets its own mini-card with severity-based styling
- Use the same color coding as ServiceSelectionDrawer:
  - Red border for VIOLATION
  - Amber border for INFRASTRUCTURE/Urgent
  - Accent border for OPTIMIZATION

### Next Steps Preview
- Simple list showing category icons + counts
- Matches what they'll see on the next page
- Builds anticipation and reduces surprise

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/OptionsAssessmentDrawer.tsx` | Add new props, replace `getSituationSummary` and `getWhyMatters` with findings-based content |
| `src/components/CommandCenter.tsx` | Build `priorityFindings` array and `nextPagePreview` object, pass to drawer |

---

## Example Output

For a unit with missing expansion tank, high pressure, and replacement recommended:

**Header**: "Immediate Attention Recommended"

**Priority Findings**:
```
┌─────────────────────────────────────┐
│ 🔴 CODE VIOLATION                   │
│ ─────────────────────────────────── │
│ Expansion Tank Required             │
│ Needed for closed-loop system       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 🟠 URGENT ACTION                    │
│ ─────────────────────────────────── │
│ Replacement Consultation            │
│ Your unit needs professional review │
└─────────────────────────────────────┘
```

**What's Next**:
```
On the next screen, we'll cover:
• 1 Code Violation to address
• 2 Urgent Actions to discuss  

[See My Options →]
```

This way, customers know exactly what was found and what they're about to see, making the transition educational rather than surprising.
