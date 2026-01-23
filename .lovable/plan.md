
# Contractor Flow Optimization - "Print Money" Mode

## Current State Analysis

The Lead Engine currently has:
- Lane-based categorization (Replacements, Code Fixes, Maintenance)
- Nurturing sequence badges with step progress
- Category filter tabs
- Call/Details/Coach actions on each lead
- Sequence Overview panel at the bottom

### Identified Friction Points

1. **No revenue visibility** - Contractor can't see potential earnings or conversion value
2. **Buried sequences panel** - The Nurturing Sequences overview is at the bottom, easy to miss
3. **No "hot leads" priority** - Critical actions requiring TODAY get lost in the list
4. **Missing urgency cues** - No time-sensitive indicators (e.g., "Call within 2 hours")
5. **No quick-start actions** - Starting sequences requires multiple taps
6. **No performance dashboard** - Contractor can't see their win rate or trending metrics

---

## Optimization Strategy

### Phase 1: "Money Dashboard" Header

Add a revenue-focused summary bar at the top showing:
- **Today's Priority**: Number of leads needing action TODAY
- **Pipeline Value**: Visual indicator of opportunity value (Replacements = $$$)
- **Active Outreach**: Sequences running right now
- **This Week Conversions**: Quick win counter

### Phase 2: "Hot Leads" Floating Action Panel

Create a sticky action panel showing the #1 priority lead:
- Most critical lead with countdown timer
- One-tap call button
- One-tap start sequence
- Auto-advances to next lead when action taken

### Phase 3: "Batch Sequence Starter"

Add a batch action mode:
- Select multiple leads without sequences
- One-tap to enroll all in appropriate templates
- Smart template matching based on lead category

### Phase 4: Performance Metrics Integration

Add a collapsible performance header:
- Conversion rate trending
- Response rate from sequences
- Closes this week vs last week
- Visual momentum indicator

---

## Technical Implementation

### New Components

| Component | Purpose |
|-----------|---------|
| `MoneyDashboard.tsx` | Revenue-focused KPI bar at top of Lead Engine |
| `HotLeadPanel.tsx` | Floating priority action panel for top lead |
| `BatchSequenceSheet.tsx` | Bottom sheet for batch sequence enrollment |
| `PerformanceRibbon.tsx` | Collapsible weekly performance metrics |

### Modified Components

| File | Changes |
|------|---------|
| `LeadEngine.tsx` | Add MoneyDashboard, HotLeadPanel, reorganize layout |
| `SequenceOverviewPanel.tsx` | Move to header area, make more prominent |
| `EnhancedLeadCard.tsx` | Add value indicator, time-since-last-contact |
| `LeadLane.tsx` | Add batch selection checkboxes when in selection mode |
| `CategoryTabs.tsx` | Add value totals to each category chip |

### New Hooks

| Hook | Purpose |
|------|---------|
| `useHotLead()` | Returns the single most urgent lead requiring action |
| `useBatchSequenceStart()` | Mutation to start sequences for multiple opportunities |
| `usePerformanceMetrics()` | Weekly/monthly conversion and response stats |

---

## Detailed Feature Designs

### 1. Money Dashboard (Top Bar)

```text
+------------------------------------------------------------------+
| TODAY: 4 actions needed | $$$$ Pipeline | 7 Active | 3 Won      |
+------------------------------------------------------------------+
```

- "TODAY" shows count of leads with sequences due or no contact in 48hrs
- "$$$$ Pipeline" shows dollar signs (1-4) based on replacement lead count
- "Active" shows running sequences
- "Won" shows this week's conversions

### 2. Hot Lead Panel (Floating)

When there's a critical lead requiring action:

```text
+----------------------------------------------------------+
| PRIORITY ACTION                                    ⏱ 2hr |
| Williams Residence - LEAKING                             |
| Bradford 50gal · 15yr · Health: 18                       |
|                                                          |
| [📞 Call Now]  [⚡ Start Sequence]  [→ Skip]             |
+----------------------------------------------------------+
```

- Appears above the lane list when there's an urgent lead
- Timer shows time since last contact or time until next sequence step
- "Skip" moves to next priority lead
- Dismissable but returns on next visit

### 3. Batch Sequence Mode

Triggered by long-press or "Select" button in header:

```text
+----------------------------------------------------------+
| SELECT LEADS                               [Cancel] [Done] |
+----------------------------------------------------------+
| ☑ Williams Residence - No sequence                        |
| ☑ Johnson Family - No sequence                            |
| ☐ Thompson Home - Urgent Replace (active)                 |
| ☑ Anderson Home - No sequence                             |
+----------------------------------------------------------+
| 3 selected · Start all with Urgent Replace template       |
| [Start Sequences]                                         |
+----------------------------------------------------------+
```

### 4. Performance Ribbon (Collapsible)

Tapping the header expands to show:

```text
+----------------------------------------------------------+
| THIS WEEK                           vs Last Week         |
| ─────────────────────────────────────────────────────── |
| 📞 Calls Made: 12        | Response Rate: 67% ▲          |
| ⚡ Sequences: 8 started  | Conversion: 23% ▲              |
| ✓ Closes: 3              | Trending: 🔥 Hot streak        |
+----------------------------------------------------------+
```

---

## Implementation Order

1. **MoneyDashboard.tsx** - Quick visual wins, shows value immediately
2. **HotLeadPanel.tsx** - Reduces decision fatigue, surfaces priority
3. **PerformanceRibbon.tsx** - Gamifies success, shows momentum
4. **BatchSequenceSheet.tsx** - Efficiency boost for bulk actions
5. **EnhancedLeadCard.tsx updates** - Value indicators on each card

---

## Database Considerations

No new tables required. All metrics can be derived from existing:
- `demo_opportunities` - Pipeline counts, category totals
- `nurturing_sequences` - Active/completed counts
- `sequence_events` - Response and delivery tracking

May add columns later for:
- `last_contacted_at` on opportunities for time-since tracking
- `estimated_value` on opportunities for pipeline value

---

## Summary

This optimization transforms the Lead Engine from a "list of leads" into a **revenue command center**:

1. **Immediate value visibility** - Contractor sees money potential
2. **Reduced decision fatigue** - Hot Lead Panel tells them exactly what to do next
3. **Batch efficiency** - Start sequences for multiple leads in one action
4. **Performance gamification** - Seeing wins and streaks motivates action
5. **Mobile-first urgency** - Critical actions are unmissable

The contractor logs in and immediately sees: what to do, why it matters, and how they're performing.
