
# Lead Engine Modular Refactor

## Problem Analysis

The current UI has **too many visual layers** competing for attention:

```text
Current Layout (Too Cluttered):
┌─────────────────────────────────────┐
│ Header + Category Tabs              │  ← Fixed
├─────────────────────────────────────┤
│ Money Dashboard (4 KPIs)            │  ← Zone 1
├─────────────────────────────────────┤
│ Hot Lead Panel (full card)          │  ← Zone 2 (DUPLICATES first lead!)
├─────────────────────────────────────┤
│ Performance Ribbon (collapsible)    │  ← Zone 3
├─────────────────────────────────────┤
│ Replacements Lane (4 cards)         │  ← Zone 4
├─────────────────────────────────────┤
│ Code Fixes Lane (2 cards)           │  ← Zone 5
├─────────────────────────────────────┤
│ Maintenance Lane (6 cards)          │  ← Zone 6
└─────────────────────────────────────┘
```

### Key Issues

| Issue | Impact |
|-------|--------|
| Hot Lead Panel duplicates first lead in lane | Confusing, wastes space |
| 4 separate info zones before actual leads | Overwhelming first impression |
| Each lead card has 4 vertical sections | Cards are too tall |
| 5+ action buttons per card | Decision paralysis |
| Performance Ribbon collapsible = hidden value | Easy to miss |

---

## Solution: Consolidated Command Bar + Streamlined Cards

### New Layout

```text
Proposed Layout (Clean & Focused):
┌─────────────────────────────────────┐
│ Header + Category Tabs              │  ← Keep (works well)
├─────────────────────────────────────┤
│ Command Bar (merged dashboard)      │  ← Zone 1: Money + Stats + Hot Alert
├─────────────────────────────────────┤
│ Lead Lanes (streamlined cards)      │  ← Zone 2: Compact cards only
└─────────────────────────────────────┘
```

---

## Implementation Details

### 1. New `CommandBar` Component

Merge MoneyDashboard + PerformanceRibbon + Hot Lead Alert into ONE component:

```text
┌──────────────────────────────────────────────────────────────┐
│ 🔥 Hot: Williams (LEAKING)  [Call]    │  $$$$ │ 7 Active │ 3 Won │
└──────────────────────────────────────────────────────────────┘
```

- **Left side**: Inline hot lead alert with quick call button
- **Right side**: Pipeline + Active + Wins (compact)
- One tap on hot lead opens details drawer
- Performance stats accessible via expansion (optional)

### 2. Simplified `LeadCardCompact` Component

Reduce each lead card from 4 sections to 2:

```text
Current Card (Too Tall):           Compact Card (Streamlined):
┌─────────────────────────┐        ┌─────────────────────────────────┐
│ Name         Health: 24 │        │ • Williams   LEAKING    24  [📞]│
├─────────────────────────┤        │   Bradford 50g · Step 2/5   →   │
│ Address                 │        └─────────────────────────────────┘
├─────────────────────────┤
│ Unit · Context          │
├─────────────────────────┤
│ Sequence badge          │
├─────────────────────────┤
│ [Call] [Details] [Coach]│
│ [Pause] timestamp       │
└─────────────────────────┘
```

Key changes:
- **Row 1**: Name + urgency tag + health score + inline call button
- **Row 2**: Unit summary + sequence progress → tap to expand
- Remove inline "Coach" button (move to drawer)
- Remove inline "Pause/Resume" (move to drawer)
- Tap entire card for details (not separate button)

### 3. Remove Duplicate Hot Lead

Don't show a separate Hot Lead Panel - instead:
- Mark the hot lead in its lane with a glow/highlight
- Show inline call button prominently in the Command Bar

### 4. Unified Lead Lane Headers

Collapse category lanes by default when there's only 1-2 leads:
- Replacements (4 leads) → Expanded
- Code Fixes (2 leads) → Collapsed with summary
- Maintenance (6 leads) → Expanded

---

## File Changes

### New Components

| File | Purpose |
|------|---------|
| `CommandBar.tsx` | Merged dashboard + hot lead + stats |
| `LeadCardCompact.tsx` | Streamlined 2-row lead card |

### Delete Components

| File | Reason |
|------|--------|
| `MoneyDashboard.tsx` | Merged into CommandBar |
| `HotLeadPanel.tsx` | Merged into CommandBar |
| `PerformanceRibbon.tsx` | Merged into CommandBar (collapsible) |

### Modified Components

| File | Changes |
|------|---------|
| `LeadEngine.tsx` | Replace 3 components with CommandBar |
| `LeadLane.tsx` | Use LeadCardCompact, auto-collapse small lanes |
| `EnhancedLeadCard.tsx` | Rename/refactor to LeadCardCompact |

---

## Visual Comparison

### Before (Current)

```text
[ TODAY: 1 action ] [ $$$$ Pipeline ] [ 7 Active ] [ 1 Won ]

┌── PRIORITY ACTION ─────────────────────────────────────┐
│ Williams Residence - LEAKING                           │
│ Bradford 50g · Health: 18                              │
│ [ Call Now ] [ Step 3/5 → ] [>]                        │
└────────────────────────────────────────────────────────┘

[ This Week: 17 closes ▲ 🔥 Hot streak ] [v]

▼ Replacements (4 leads)
┌───────────────────────────────────────────────────────┐
│ • Williams Residence                           24     │
│   2301 E Camelback Rd                                 │
│   9yr Bradford White 50gal in Garage                  │
│   LEAKING                                             │
│   ⚡ Urgent Replace · Step 3/5 · Next: Tomorrow    →  │
│   [Call] [Details>] [Coach] [Pause] 7hr ago           │
└───────────────────────────────────────────────────────┘
... (3 more cards)
```

### After (Refactored)

```text
┌─────────────────────────────────────────────────────────────────┐
│ 🔥 Williams (LEAKING) [📞]     │  $$$$ │  7 Active  │  3 Won   │
└─────────────────────────────────────────────────────────────────┘

▼ Replacements (4)
┌──────────────────────────────────────────────────────────────┐
│ 🔴 Williams         LEAKING                   24    [📞]     │
│    9yr Bradford 50g · Urgent Replace 3/5              →      │
├──────────────────────────────────────────────────────────────┤
│ 🔴 Johnson Family   LEAKING                   24    [📞]     │
│    12yr Rheem 50g · Urgent Replace 2/5                →      │
├──────────────────────────────────────────────────────────────┤
│ 🔴 Thompson Home                              52    [📞]     │
│    8yr Bradford 40g · Urgent Replace 4/5              →      │
├──────────────────────────────────────────────────────────────┤
│ 🔴 Martinez Residence                         62    [📞]     │
│    5yr A.O. Smith 50g · Maintenance 1/4 ⏸             →      │
└──────────────────────────────────────────────────────────────┘

▸ Code Fixes (2) — Chen Family, Patel Residence

▼ Maintenance (6)
...
```

---

## Technical Approach

### CommandBar Component

```text
Props:
- hotLead: CategorizedOpportunity | null
- hotLeadSequence: NurturingSequence | null
- pipelineValue: number (1-4)
- activeSequences: number
- weeklyWins: number
- onCallHotLead: () => void
- onViewHotLead: () => void
```

### LeadCardCompact Component

```text
Props:
- opportunity: CategorizedOpportunity
- sequence: NurturingSequence | null
- isHotLead: boolean (adds glow/highlight)
- onCall: () => void
- onClick: () => void (opens details drawer)
```

Interactions:
- Tap card → Opens PropertyReportDrawer
- Tap phone icon → Direct call
- No inline Coach/Pause buttons (moved to drawer)

### LeadLane Auto-Collapse

```text
const defaultExpanded = opportunities.length > 2;
// If 1-2 leads: show collapsed with names preview
// If 3+ leads: expand by default
```

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| Visual zones above leads | 3 separate blocks | 1 unified command bar |
| Lead card height | ~140px | ~60px |
| Actions per card | 5 buttons | 2 (call + tap for details) |
| Duplicate content | Hot lead shown twice | Hot lead highlighted in lane |
| Scan time to first lead | 4 scroll swipes | Immediate |

---

## Summary

This refactor consolidates scattered dashboard elements into a **single Command Bar** and replaces verbose lead cards with **compact 2-row cards**. The result is:

1. **Fewer zones** - One command bar instead of three
2. **No duplication** - Hot lead is highlighted, not repeated
3. **Compact cards** - 60px vs 140px per lead
4. **Clear actions** - Call and details only; other controls in drawer
5. **Smart collapse** - Small lanes collapse to save space
