

# Contractor View Redesign - Complete Desktop Dashboard

## Overview

This redesign consolidates the contractor experience into a clean, focused dashboard that emphasizes the automated outreach system. The user's optimal flow centers on:
- **Watch the machine run** (Pulse Widget on dashboard)
- **Manage active sequences** (Master Table view)
- **Intervene when needed** (Kill Switch search)

## Current Architecture Issues

| Issue | Current State | Desired State |
|-------|---------------|---------------|
| Multiple entry points | LeadEngine + Contractor + Sequences | Single unified dashboard |
| Lead-centric UI | Card lanes by priority category | Sequence-centric table view |
| Navigation confusion | Dashboard vs Lead Engine both at /contractor | Clear hierarchy: Dashboard → Sequences |
| Pulse Widget placement | Embedded in LeadEngine with lead lanes | Prominent on main dashboard |

## Proposed Information Architecture

```text
/contractor (Main Dashboard)
├── Header with Company Name + Global Search
├── Pulse Widget (The Machine Status)
│   └── Click → /contractor/sequences
├── Quick Stats Section
│   ├── Pipeline Health
│   ├── Weekly Wins
│   └── Engagement Rate
└── Activity Feed (Recent Bookings, Opens, Clicks)

/contractor/sequences (Active Sequences Management)
├── Header with Global Search (Kill Switch)
├── Sidebar: Sequence Bucket Filters
│   ├── All Active (count)
│   ├── High Risk / Replacement (count) ← Daily Check
│   ├── Maintenance Due (count)
│   └── Anode Check (count)
└── Master Table
    ├── Address / Customer
    ├── Sequence Type
    ├── Current Step
    ├── Status (🟢 🟡 🔴)
    ├── Engagement (👁️ 👆)
    ├── Next Touchpoint
    └── Actions [PAUSE] [SKIP] [STOP]
```

## Implementation Plan

### Phase 1: Redesign Main Dashboard (`/contractor`)

Transform `LeadEngine.tsx` into a clean dashboard focused on automation monitoring.

**New Layout:**

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [☰] ACME Plumbing                              [🔍 Search...]        │
│       Dashboard                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 Automated Outreach                                       [View →] │
│  ──────────────────────────────────────────────────────────────────────│
│   Enrolled (7d)    Active Now      Engaged (24h)      Converted       │
│       14               42               8                  3          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│  📊 Pipeline Health              │  │  🏆 This Week                    │
│  ────────────────────────────────│  │  ────────────────────────────────│
│  Replacements:  12               │  │  Jobs Booked:  3                 │
│  Code Fixes:     8               │  │  Revenue:      $4,200            │
│  Maintenance:   30               │  │  From Automation: 2              │
└──────────────────────────────────┘  └──────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  📋 Recent Activity                                                    │
│  ──────────────────────────────────────────────────────────────────────│
│  • Mrs. Johnson opened "Risk Report" email           2 hours ago      │
│  • Smith Residence booked replacement                Yesterday         │
│  • New sequence started for 456 Oak Ave              Yesterday         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Changes to LeadEngine.tsx:**
- Remove CategoryTabs, LeadLane, LeadCardCompact
- Promote SequencesPulseWidget to hero position
- Add Pipeline Summary card (from existing opportunity data)
- Add Weekly Stats card
- Add Recent Activity feed (from sequence_events)
- Move Global Search to header (for quick Kill Switch access)

### Phase 2: Enhance Sequences Page (`/contractor/sequences`)

The Sequences page already has most features implemented. Enhancements needed:

1. **Add "Anode Check" bucket** to sidebar (currently missing from buckets)
2. **Improve table density** for more rows visible
3. **Add engagement streak indicator** (multiple opens = hot)
4. **Add "Last Contact" column** showing when last message was sent

### Phase 3: Update Navigation

**ContractorMenu Updates:**
- Rename "Lead Engine" to "Dashboard"
- Ensure "Sequences" is prominently placed
- Add counts to nav items (e.g., "Sequences (42)")

### Phase 4: Create Activity Feed Component

New component to show recent automation activity:

```typescript
// ActivityFeed shows: opens, clicks, bookings, new sequences
interface ActivityItem {
  type: 'opened' | 'clicked' | 'booked' | 'started' | 'stopped';
  customerName: string;
  message?: string;
  timestamp: Date;
}
```

## File Changes Summary

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/LeadEngine.tsx` | Complete redesign - remove lead lanes, add dashboard widgets |
| `src/pages/Sequences.tsx` | Minor enhancements - add Anode bucket, improve density |
| `src/components/contractor/ContractorMenu.tsx` | Rename items, add counts, highlight active |
| `src/components/contractor/SequenceBucketSidebar.tsx` | Add "Anode Check" bucket |

### New Files

| File | Purpose |
|------|---------|
| `src/components/contractor/DashboardPulseHero.tsx` | Enhanced Pulse Widget for hero position |
| `src/components/contractor/PipelineSummaryCard.tsx` | Pipeline health breakdown |
| `src/components/contractor/WeeklyStatsCard.tsx` | This week's performance metrics |
| `src/components/contractor/RecentActivityFeed.tsx` | Activity stream from sequence events |

### Removed/Deprecated

| Component | Reason |
|-----------|--------|
| `CategoryTabs.tsx` | Replaced by sequence-centric view |
| `LeadLane.tsx` | Replaced by master table |
| `LeadCardCompact.tsx` | Replaced by table rows |
| `CommandBar.tsx` | Replaced by dashboard widgets |
| `Contractor.tsx` page | Redundant with new dashboard |

## Database Queries

### Recent Activity Feed

```sql
-- Get recent engagement events
SELECT 
  se.id,
  se.opened_at,
  se.clicked_at,
  se.executed_at,
  ns.sequence_type,
  do.customer_name,
  do.property_address
FROM sequence_events se
JOIN nurturing_sequences ns ON se.sequence_id = ns.id
JOIN demo_opportunities do ON ns.opportunity_id = do.id
WHERE se.opened_at IS NOT NULL 
   OR se.clicked_at IS NOT NULL
   OR se.executed_at > now() - interval '7 days'
ORDER BY COALESCE(se.clicked_at, se.opened_at, se.executed_at) DESC
LIMIT 10;
```

### Weekly Stats

```sql
-- Completed sequences (converted) this week
SELECT COUNT(*) 
FROM nurturing_sequences 
WHERE outcome = 'converted' 
  AND completed_at > date_trunc('week', now());
```

## Design Specifications

### Dashboard Pulse Widget (Hero)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   🤖  AUTOMATED OUTREACH                                   [View All →]│
│   ────────────────────────────────────────────────────────────────────  │
│                                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│   │     14      │  │     42      │  │      8      │  │      3      │   │
│   │  Enrolled   │  │   Active    │  │   Engaged   │  │  Converted  │   │
│   │  (7 days)   │  │    Now      │  │   (24h)     │  │             │   │
│   │   👥 +3     │  │   🟢 ●●●    │  │   📬 ↑12%   │  │   🎉        │   │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                         │
│   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░  56% of pipeline in sequence   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Colors:
- Enrolled: Sky blue (`text-sky-400`)
- Active: Emerald (`text-emerald-400`)
- Engaged: Amber (`text-amber-400`)
- Converted: Violet (`text-violet-400`)

### Pipeline Card

```text
┌────────────────────────────────────┐
│ 📊 Pipeline                        │
│ ────────────────────────────────── │
│                                    │
│ 🔴 Replacements          12        │
│ 🟡 Code Fixes             8        │
│ 🔵 Maintenance           30        │
│                                    │
│ Total Value         ~$48,000       │
└────────────────────────────────────┘
```

### Activity Feed Item

```text
│ 👁️  Mrs. Johnson opened "Risk Report" email     │
│     123 Maple Ave · Urgent Replace              │  2h ago
│     [View Sequence]                             │
```

Activity types:
- 👁️ Opened email
- 👆 Clicked link
- 🎉 Customer booked
- ▶️ Sequence started
- ⏹️ Sequence stopped

## Summary

This redesign transforms the contractor experience from a lead-centric card interface to a **sequence-centric automation dashboard**:

1. **Main Dashboard** answers: "Is the machine running?" with the Pulse Widget hero
2. **Sequences Page** provides the master table for "Who's in the pipeline?"
3. **Global Search** enables instant "Kill Switch" when customers book
4. **Activity Feed** shows engagement without needing to dig into tables

The primary interaction model becomes:
- **Watch**: See the Pulse numbers trending up
- **Monitor**: Glance at Activity Feed for engagement signals
- **Intervene**: Search + Stop when customer calls to book

