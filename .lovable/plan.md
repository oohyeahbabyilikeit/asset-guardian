

# Optimal Desktop Dashboard UX - Outreach Sequences Redesign

## Overview

This plan transforms the current Sequences page into the optimal contractor dashboard flow with three major features:

1. **The "Pulse" Widget** - A summary widget for the Lead Engine dashboard showing automation health at a glance
2. **Master Table View** - Replace the card-based sequence list with a sortable, scannable data table
3. **Sequence Type Sidebar** - Left sidebar filter for sequence buckets
4. **Global Search with Kill Switch** - Quick search to find customers and stop sequences instantly

---

## Current State Analysis

The existing Sequences page uses:
- **Tab layout**: Active | Templates | Analytics
- **Card-based list**: `ActiveSequencesList` → `SequenceRow` (grouped by urgency)
- **No sidebar filters**
- **No global search**
- **No dashboard widget on Lead Engine**

The user's optimal flow requires a significant restructure to make the desktop experience more scannable and actionable.

---

## Implementation Plan

### Phase 1: Create the "Pulse" Widget

Add a new summary card to the Lead Engine dashboard that shows automation health at a glance.

**New Component: `SequencesPulseWidget.tsx`**

Layout:
```text
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Automated Outreach                                    [View →] │
├────────────┬─────────────┬─────────────┬─────────────────────────────┤
│  Enrolled  │   Active    │   Engaged   │   Converted               │
│  (7 days)  │    Now      │  (24h)      │                           │
│    14      │     42      │      8      │      3                    │
└────────────┴─────────────┴─────────────┴─────────────────────────────┘
```

Metrics (from database):
- **Enrolled (7 days)**: Count of sequences created in last 7 days
- **Active Now**: Count of sequences with status='active'
- **Engaged (24h)**: Count of events with `opened_at` or `clicked_at` in last 24 hours
- **Converted**: Count of sequences with outcome='converted'

Click behavior: Navigates to `/contractor/sequences`

---

### Phase 2: Redesign Active Sequences as Master Table

Replace the card-based `ActiveSequencesList` with a proper data table using the existing shadcn Table components.

**Modified Component: `ActiveSequencesList.tsx`**

Table Columns:
| Column | Content | Width |
|--------|---------|-------|
| Address/Customer | "123 Maple Ave - Smith" | 30% |
| Sequence | "Urgent Replace", "Annual Flush" | 15% |
| Current Step | "Step 2/5: 'Risk Report' Email" | 20% |
| Status | 🟢 Active, 🟡 Paused, 🔴 Error | 8% |
| Engagement | 👁️ (Opened) and 👆 (Clicked) icons | 8% |
| Next Touchpoint | "Tomorrow @ 9:00 AM" | 12% |
| Actions | [PAUSE] [SKIP] [STOP] | 7% |

Table behavior:
- Sortable by any column (click headers)
- Status icons light up for most recent message engagement
- Clicking row opens SequenceControlDrawer (existing)
- Action buttons work inline (no drawer needed for simple actions)

---

### Phase 3: Add Sequence Bucket Sidebar

Add a left sidebar filter to the Sequences page for filtering by automation type.

**New Component: `SequenceBucketSidebar.tsx`**

Sidebar items:
```text
┌─────────────────────────┐
│  FILTER BY TYPE         │
├─────────────────────────┤
│  ● All Active     (56)  │ ← default
│  ○ High Risk      (12)  │ ← replacement_urgent
│  ○ Code Violation  (8)  │ ← code_violation  
│  ○ Maintenance    (30)  │ ← maintenance
│  ○ Warranty        (6)  │ ← warranty_expiring
└─────────────────────────┘
```

Filter logic:
- Maps to `sequence_type` field
- Uses `normalizeSequenceType()` for consistent matching
- Clicking filter updates table to show only matching sequences

---

### Phase 4: Global Search with Kill Switch

Add a search bar to the Sequences page header that allows quick lookup and instant sequence stopping.

**Modified Component: `Sequences.tsx` header**

Search behavior:
1. User types customer name or address
2. Matching sequences appear in dropdown
3. Each result shows: "123 Maple Ave - Smith [IN SEQUENCE: REPLACEMENT]"
4. Clicking the badge instantly opens a confirm dialog to STOP the sequence
5. Stopping marks `outcome='stopped'`, `status='cancelled'`

This solves the "Mrs. Jones calls to book" scenario - one search, one click, automation stopped.

**New Component: `SequenceGlobalSearch.tsx`**

Uses Command component (cmdk) for fast fuzzy search with keyboard navigation.

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/contractor/SequencesPulseWidget.tsx` | Dashboard widget showing automation health |
| `src/components/contractor/SequenceBucketSidebar.tsx` | Left sidebar filter by sequence type |
| `src/components/contractor/SequenceGlobalSearch.tsx` | Global search with kill switch |
| `src/components/contractor/SequenceTableRow.tsx` | Individual table row for master table |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/Sequences.tsx` | Add sidebar layout, search bar, update to table view |
| `src/pages/LeadEngine.tsx` | Add SequencesPulseWidget above CommandBar |
| `src/components/contractor/ActiveSequencesList.tsx` | Replace cards with Table component |
| `src/hooks/useNurturingSequences.ts` | Add `usePulseMetrics()` hook for widget data |

---

## Database Queries

### Pulse Widget Metrics

```typescript
usePulseMetrics() -> {
  enrolled7Days: count of nurturing_sequences created > now() - 7 days
  activeNow: count of nurturing_sequences with status = 'active'
  engaged24h: count of sequence_events with opened_at > now() - 24h OR clicked_at > now() - 24h
  converted: count of nurturing_sequences with outcome = 'converted'
}
```

### Engagement Detection (per sequence)

For the engagement icons in the table, we need to check if the most recent sent event has been opened/clicked:

```typescript
// In enriched sequence data
const latestEvent = events.filter(e => e.status === 'sent').sort(desc)[0]
const hasOpened = latestEvent?.openedAt != null
const hasClicked = latestEvent?.clickedAt != null
```

---

## Technical Architecture

### Page Layout Change

Current Sequences.tsx:
```
┌──────────────────────────────┐
│ Header                       │
├──────────────────────────────┤
│ Tabs                         │
├──────────────────────────────┤
│ Content (cards)              │
└──────────────────────────────┘
```

New Sequences.tsx:
```
┌──────────────────────────────────────────────────┐
│ Header with Global Search                        │
├──────────┬───────────────────────────────────────┤
│ Sidebar  │ Tabs (Active | Templates | Analytics) │
│ Filters  ├───────────────────────────────────────┤
│          │ Master Table or Tab Content           │
│ (12 hl)  │                                       │
│ (30 mt)  │                                       │
│ (14 an)  │                                       │
└──────────┴───────────────────────────────────────┘
```

### Kill Switch Flow

```text
1. User types "Jones" in search
2. Dropdown shows: "123 Maple Ave - Jones [REPLACEMENT]"
3. User clicks the badge
4. Confirm dialog: "Stop sequence for Jones?"
5. On confirm:
   - nurturing_sequences.update({ 
       status: 'cancelled', 
       outcome: 'stopped', 
       outcome_reason: 'Customer booked' 
     })
6. Toast: "Sequence stopped for Jones"
```

---

## Design Details

### Status Icons

| Status | Icon | Color |
|--------|------|-------|
| Active | ● | `text-emerald-400` |
| Paused | ● | `text-amber-400` |
| Error | ● | `text-rose-400` |

### Engagement Icons

| State | Icon | Appearance |
|-------|------|------------|
| Not sent yet | 👁️ 👆 | `text-muted-foreground/30` (dimmed) |
| Sent, not opened | 👁️ | `text-muted-foreground/50` |
| Opened | 👁️ | `text-sky-400` (lit up) |
| Clicked | 👆 | `text-violet-400` (lit up) |

### Sidebar Visual

```text
┌─────────────────────────────────┐
│  📋 FILTER BY TYPE              │
│  ───────────────────────────────│
│  ● All Active            56    │ ← bg-muted, border-l-2 violet
│    High Risk / Replace   12    │
│    Code Violation         8    │
│    Maintenance           30    │
│    Warranty               6    │
└─────────────────────────────────┘
```

---

## Summary

This redesign addresses all user requirements:

1. **The Pulse Widget**: Quick glance at automation health from Lead Engine
2. **Master Table**: Scannable rows instead of cards - see everything at once
3. **Bucket Filters**: Left sidebar to filter by sequence type (owner checks "High Risk" daily)
4. **Kill Switch Search**: Global search with one-click STOP when customer books

The primary interaction model shifts to:
- **Default**: Watch the table - it populates automatically
- **Success metric**: "Engaged" numbers go up
- **Primary action**: Search + Stop when customer books

