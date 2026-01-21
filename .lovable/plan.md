
# Fix: Properly Separate "Urgent Actions" from "Add-Ons"

## The Problem
Water softeners (and other `OPTIMIZATION` items) are appearing under "Urgent Actions" because `CommandCenter.tsx` merges both `INFRASTRUCTURE` and `OPTIMIZATION` categories into a single `recommendations` array.

## The Solution
Split the categories properly:
- **Urgent Actions**: `INFRASTRUCTURE` items only (recommended protective work that genuinely matters)
- **Add-Ons**: `OPTIMIZATION` items (premium nice-to-haves like water softeners)

---

## Changes Required

### 1. Update CommandCenter.tsx - Split Categories

**Current (lines 473-486):**
```typescript
const recommendationIssues = [
  ...getIssuesByCategory(infrastructureIssues, 'INFRASTRUCTURE'),
  ...getIssuesByCategory(infrastructureIssues, 'OPTIMIZATION'),
];
```

**New:**
```typescript
// INFRASTRUCTURE = Urgent protective work  
const infrastructureRecommendations = getIssuesByCategory(infrastructureIssues, 'INFRASTRUCTURE');
const urgentTasks: MaintenanceTask[] = infrastructureRecommendations.map(issue => ({
  type: 'inspection' as MaintenanceTask['type'],
  label: issue.name,
  description: issue.description,
  monthsUntilDue: 0,
  urgency: 'schedule' as const,
  benefit: issue.friendlyName,
  whyExplanation: issue.description,
  icon: 'wrench' as const,
  isInfrastructure: true,
}));

// OPTIMIZATION = Nice-to-have add-ons (softeners, longevity PRV)
const optimizationIssues = getIssuesByCategory(infrastructureIssues, 'OPTIMIZATION');
const addOnTasks: MaintenanceTask[] = optimizationIssues.map(issue => ({
  type: 'inspection' as MaintenanceTask['type'],
  label: issue.name,
  description: issue.description,
  monthsUntilDue: 0,
  urgency: 'optimal' as const,  // Lower urgency
  benefit: issue.friendlyName,
  whyExplanation: issue.description,
  icon: 'lightbulb' as const,  // Different icon
  isInfrastructure: true,
}));
```

### 2. Update ServiceSelectionDrawer Props

Add a new `addOns` prop to separate the categories:

```typescript
interface ServiceSelectionDrawerProps {
  // ... existing props
  recommendations: MaintenanceTask[];  // INFRASTRUCTURE (urgent)
  addOns?: MaintenanceTask[];          // NEW: OPTIMIZATION (nice-to-have)
}
```

### 3. Update ServiceSelectionDrawer Rendering

Move the current "Add-Ons" section (which was incorrectly using `replacementTasks`) to use the new `addOns` prop:

| Section | Data Source | Label |
|---------|-------------|-------|
| Code Violations | `violations` (VIOLATION) | 🔴 "Code Violations" |
| Urgent Actions | `recommendations` (INFRASTRUCTURE) | 🟠 "Urgent Actions" |
| Add-Ons | `addOns` (OPTIMIZATION) | 💡 "Add-Ons" |
| Maintenance | `regularMaintenanceTasks` | "Maintenance" |

### 4. Pass the Split Arrays from CommandCenter

Update the `ServiceSelectionDrawer` call in CommandCenter to pass both arrays:

```tsx
<ServiceSelectionDrawer
  violations={violationTasks}
  maintenanceTasks={maintenanceTasks}
  recommendations={urgentTasks}      // INFRASTRUCTURE only
  addOns={addOnTasks}                // NEW: OPTIMIZATION items
  // ...
/>
```

---

## What This Fixes

| Item | Category | Before | After |
|------|----------|--------|-------|
| Water Softener Install | OPTIMIZATION | 🟠 Urgent Actions | 💡 Add-Ons ✓ |
| Water Softener Replace | OPTIMIZATION | 🟠 Urgent Actions | 💡 Add-Ons ✓ |
| PRV for Longevity (60-69 PSI) | OPTIMIZATION | 🟠 Urgent Actions | 💡 Add-Ons ✓ |
| PRV Recommended (70-80 PSI) | INFRASTRUCTURE | 🟠 Urgent Actions | 🟠 Urgent Actions ✓ |
| Softener Service | INFRASTRUCTURE | 🟠 Urgent Actions | 🟠 Urgent Actions ✓ |
| Expansion Tank Replace | INFRASTRUCTURE | 🟠 Urgent Actions | 🟠 Urgent Actions ✓ |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/CommandCenter.tsx` | Split `INFRASTRUCTURE` and `OPTIMIZATION` into separate task arrays |
| `src/components/ServiceSelectionDrawer.tsx` | Add `addOns` prop, render it in the "Add-Ons" section |
