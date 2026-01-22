

# Make Maintenance Schedule Tasks Clickable for Service Information

## What We're Building

The "Tank Flush Due in Now" item (and other maintenance tasks) in the `OptionsAssessmentDrawer` should be clickable, opening the `EducationalDrawer` with relevant information about that service.

## Current State

- The drawer already has `EducationalDrawer` integrated with state management (`selectedTopic`)
- Priority Findings are already clickable and map to educational topics
- The maintenance schedule items (lines 404-435) are currently **static divs** - not interactive

## Implementation Plan

### Step 1: Add Task-to-Topic Mapping Function

Add a new helper function that maps maintenance task types to educational topics:

```typescript
function getTaskEducationalTopic(taskType: string, metrics?: OpterraMetrics): EducationalTopic | null {
  // Context-aware mapping (like ServiceHistory does)
  const isSedimentRisky = metrics?.sedimentLbs && metrics.sedimentLbs > 10;
  const isAnodeFused = metrics?.anodeStatus === 'fused';
  
  const topicMap: Record<string, EducationalTopic> = {
    'flush': isSedimentRisky ? 'sediment-risky' : 'sediment',
    'anode': isAnodeFused ? 'anode-rod-fused' : 'anode-rod',
    'descale': 'scale-tankless',
    'filter_clean': 'heat-exchanger',
    'exp_tank_install': 'thermal-expansion',
    'exp_tank_replace': 'thermal-expansion',
    'prv_install': 'prv',
    'prv_replace': 'prv',
  };
  return topicMap[taskType] || null;
}
```

### Step 2: Convert Task Items to Clickable Buttons

Transform the maintenance task items from static `<div>` to interactive `<button>` elements:

**Current (lines 406-418):**
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    {/* icon + label */}
  </div>
  <span>Due in {formatDueDate(...)}</span>
</div>
```

**Updated:**
```tsx
<button 
  onClick={() => {
    const topic = getTaskEducationalTopic(schedule.primaryTask.type, metrics);
    if (topic) setSelectedTopic(topic);
  }}
  className="w-full flex items-center justify-between hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors cursor-pointer"
>
  <div className="flex items-center gap-2">
    {/* icon + label */}
  </div>
  <div className="flex items-center gap-1.5">
    <span className="text-xs text-muted-foreground">
      Due in {formatDueDate(...)}
    </span>
    <Info className="w-3.5 h-3.5 text-muted-foreground" />
  </div>
</button>
```

### Step 3: Visual Feedback

Add visual cues to indicate interactivity:
- Hover state with subtle background change
- Info icon on the right side (consistent with ServiceHistory pattern)
- Cursor pointer

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/OptionsAssessmentDrawer.tsx` | Add `getTaskEducationalTopic` function, convert primary/secondary task divs to buttons |

## Expected Result

Users can tap on "Tank Flush Due in Now" (or any maintenance task) and see educational content explaining:
- What the service is
- Why it's important
- What happens if ignored

This follows the existing UX pattern from `ServiceHistory.tsx` where Anode and Sediment indicators are already clickable for education.

