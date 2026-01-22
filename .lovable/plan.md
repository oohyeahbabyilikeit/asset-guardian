

# Contractor Dashboard - Layout Redesign

## Current Problems

Based on the screenshot and code analysis:

1. **Endless vertical scroll** - 13 lead cards stack one after another, pushing Pipeline and Quick Actions to the bottom (requires scrolling past ~15 screens of content)
2. **Lead cards are too verbose** - Each card shows 7+ lines of content (type label, name, address, unit summary, context, metadata row, actions)
3. **No information density** - The `max-w-3xl` constraint wastes horizontal space on larger screens
4. **Key metrics buried** - Pipeline overview and Quick Actions (the "command center" elements) are hidden at the very bottom
5. **No visual grouping** - Stats, Feed, Pipeline, Actions all look like separate unrelated sections
6. **Mobile-only layout** - The single column doesn't adapt to take advantage of wider screens

## Design Solution: Split-Panel Dashboard

Create a proper CRM layout with:
- **Left panel**: Quick metrics, pipeline, and actions (always visible)
- **Right panel**: Scrollable opportunity feed (the "inbox")
- **Responsive**: Collapses to tabbed view on mobile

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Header                                                                 │
├──────────────────────────┬─────────────────────────────────────────────┤
│                          │                                              │
│  OVERVIEW PANEL          │  OPPORTUNITY FEED                           │
│  (Fixed, non-scrolling)  │  (Scrollable inbox)                         │
│                          │                                              │
│  ┌────────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Today's Priority   │  │  │ Johnson Family - Active Leak           │ │
│  │ 2 Critical Actions │  │  │ 12yr Rheem Gas Tank | Health 24        │ │
│  └────────────────────┘  │  │ [Call] [Details] [×]                   │ │
│                          │  └────────────────────────────────────────┘ │
│  ┌────────────────────┐  │  ┌────────────────────────────────────────┐ │
│  │ Pipeline           │  │  │ Williams Residence - T&P Weeping       │ │
│  │ 8→4→2→12           │  │  │ 15yr Bradford White | Health 18        │ │
│  │ $88K potential     │  │  │ [Call] [Details] [×]                   │ │
│  └────────────────────┘  │  └────────────────────────────────────────┘ │
│                          │  ┌────────────────────────────────────────┐ │
│  ┌────────────────────┐  │  │ Martinez Residence - Warranty Exp.     │ │
│  │ Quick Actions      │  │  │ 5yr A.O. Smith | Health 62             │ │
│  │ [Inspect] [Props]  │  │  │ [Call] [Details] [Later] [×]          │ │
│  │ [Pricing] [Report] │  │  └────────────────────────────────────────┘ │
│  └────────────────────┘  │                                              │
│                          │  ... more leads ...                          │
│                          │                                              │
└──────────────────────────┴─────────────────────────────────────────────┘
```

## Component Changes

### 1. Contractor.tsx - Two-Column Layout

```typescript
<main className="flex-1 flex">
  {/* Left Panel - Overview (fixed width, no scroll) */}
  <aside className="hidden lg:flex w-80 flex-col border-r border-gray-200/60 bg-white p-4 gap-4">
    <TodaysSummary counts={counts} onPriorityClick={handlePriorityClick} />
    <PipelineOverview compact />
    <QuickActions compact />
  </aside>
  
  {/* Right Panel - Feed (scrollable) */}
  <div className="flex-1 overflow-y-auto">
    <OpportunityFeed ... />
  </div>
</main>
```

### 2. New TodaysSummary Component

Replace the 4 separate StatCards with a single cohesive summary card:

```typescript
// Shows: "2 Critical | 3 High | 5 Med | 3 Low"
// Clickable segments to filter
// Shows most urgent item inline
```

### 3. Compact LeadCard

Reduce each card from 7 lines to 3-4 lines:

**Before (too verbose):**
```
URGENT REPLACEMENT
Johnson Family
📍 1847 Sunset Dr, Phoenix AZ
12yr Rheem Gas Tank in Attic
Active leak detected during routine inspection
⚙️ Elevated · 2h ago · 78% fail risk
[Call] [Details]    [Later] [×]
```

**After (condensed):**
```
Johnson Family · 1847 Sunset Dr          24/100
12yr Rheem · Active leak detected
[📞 Call] [Details] [×]
```

Changes:
- Merge name + address on one line
- Remove type label (redundant with context)
- Remove complexity badge (secondary info)
- Inline health score badge
- Smaller action buttons

### 4. Mobile Tab Navigation

On mobile (< lg breakpoint), show tabs instead of panels:

```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'leads'>('leads');

// Mobile: Tab bar at top
<div className="lg:hidden flex border-b">
  <button onClick={() => setActiveTab('overview')}>Overview</button>
  <button onClick={() => setActiveTab('leads')}>Leads (13)</button>
</div>
```

### 5. Compact Pipeline

For the left panel, create a more compact pipeline visualization:

```typescript
// Horizontal mini-funnel
8 → 4 → 2 → 12
New  Contact  Quote  Closed
$88.3K potential | 46% conv.
```

### 6. Compact Quick Actions

2x2 grid but smaller, icon-only on desktop sidebar:

```typescript
<div className="grid grid-cols-2 gap-2">
  <Button size="sm" variant="outline">
    <ClipboardList className="w-4 h-4" />
    <span className="sr-only lg:not-sr-only">Inspect</span>
  </Button>
  ...
</div>
```

## File Changes

| File | Action | Changes |
|------|--------|---------|
| `src/pages/Contractor.tsx` | **Rewrite** | Two-column layout with responsive breakpoints |
| `src/components/contractor/TodaysSummary.tsx` | **Create** | New cohesive summary component |
| `src/components/contractor/LeadCard.tsx` | **Modify** | Condense to 3-4 lines, inline badges |
| `src/components/contractor/OpportunityFeed.tsx` | **Modify** | Remove header (moved to panel), tighter spacing |
| `src/components/contractor/PipelineOverview.tsx` | **Modify** | Add `compact` prop for sidebar mode |
| `src/components/contractor/QuickActions.tsx` | **Modify** | Add `compact` prop for sidebar mode |
| `src/components/contractor/StatCard.tsx` | **Delete** | Replaced by TodaysSummary |

## Visual Improvements

1. **Consistent card heights** - Lead cards should be roughly same height for visual rhythm
2. **Tighter vertical spacing** - `space-y-2` instead of `space-y-3` in feed
3. **Fixed sidebar** - Overview panel stays visible while scrolling leads
4. **Count badges** - Show lead count on mobile tab: "Leads (13)"
5. **Priority indicator** - Small colored dot instead of colored border + label

## Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| < 640px (mobile) | Tabbed view: Overview / Leads tabs |
| 640-1024px (tablet) | Single column, all sections stacked but condensed |
| > 1024px (desktop) | Two-column: Fixed sidebar + scrollable feed |

## Expected Outcome

After implementation:
- **Desktop**: See pipeline health + leads side-by-side, no buried content
- **Mobile**: Quick tab switch between overview and action items
- **All screens**: Leads are scannable in 2-3 lines each
- **Faster workflow**: Key actions always one click away

