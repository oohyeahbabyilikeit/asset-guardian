

## Lead Engine Refactor - Contractor Dashboard

### Vision Summary
Transform the contractor dashboard from a generic "opportunities list" into a **Lead Engine** - a focused, actionable workspace where contractors can:
1. **See leads by opportunity type** (Replacements, Code Fixes, Maintenance) at a glance
2. **Track automated nurturing sequences** that are running on each lead
3. **Take action quickly** with type-specific workflows

---

## Current State

```text
+------------------+     +--------------------------------+
|  Left Sidebar    |     |  Right Panel                   |
|------------------|     |--------------------------------|
| Today's Actions  |     |  Opportunity Feed              |
| (priority counts)|     |  - All leads mixed together    |
|                  |     |  - Filter by priority only     |
| Pipeline Overview|     |  - Generic "Lead Card"         |
| (New→Contacted→) |     |                                |
|                  |     |                                |
| Closes Breakdown |     |                                |
| (maint/code/repl)|     |                                |
|                  |     |                                |
| Quick Actions    |     |                                |
+------------------+     +--------------------------------+
```

**Problems:**
- Leads are mixed together - replacement urgencies buried with annual checkups
- No visibility into which leads have automated sequences running
- No "lane-based" view by opportunity category
- Priority-based sorting doesn't help contractor see the TYPE of work

---

## Proposed Lead Engine Layout

```text
+----------------------------------------------------------+
|  Lead Engine                                    [Alerts] |
+----------------------------------------------------------+
|                                                          |
|  [🔴 Replacements (4)]  [⚠️ Code Fixes (3)]  [🔧 Maint (5)] |
|  ─────────────────────────────────────────────────────── |
|                                                          |
|  ┌─────────────────────────────────────────────────────┐ |
|  │ REPLACEMENTS                              4 leads   │ |
|  │                                                     │ |
|  │ ┌─────────────────────────────────────────────────┐ │ |
|  │ │ 🔴 Maria Santos · 123 Oak St                    │ │ |
|  │ │    Rheem 50g · 12yr · LEAKING                   │ │ |
|  │ │    ⚡ Nurture: Day 2 of "Urgent Replace"        │ │ |
|  │ │    [Call] [Details] [Pause Sequence]            │ │ |
|  │ └─────────────────────────────────────────────────┘ │ |
|  │ ...                                                 │ |
|  └─────────────────────────────────────────────────────┘ |
|                                                          |
|  ┌─────────────────────────────────────────────────────┐ |
|  │ CODE FIXES                                3 leads   │ |
|  │ (Missing PRV, Expansion Tank, etc.)                 │ |
|  │ ┌─────────────────────────────────────────────────┐ │ |
|  │ │ ⚠️ John Martinez · 456 Maple Ave               │ │ |
|  │ │    95 PSI - No PRV installed                    │ │ |
|  │ │    ⚡ Nurture: "Code Violation Awareness"       │ │ |
|  │ └─────────────────────────────────────────────────┘ │ |
|  └─────────────────────────────────────────────────────┘ |
|                                                          |
|  ┌─────────────────────────────────────────────────────┐ |
|  │ MAINTENANCE                               5 leads   │ |
|  │ (Flush due, Anode due, Descale, Annual checkup)     │ |
|  │ ...                                                 │ |
|  └─────────────────────────────────────────────────────┘ |
|                                                          |
|  ┌────────────────┐                                      |
|  │ 📊 Sequences   │  Active: 8 | Paused: 2 | Done: 12   |
|  │    Overview    │                                      |
|  └────────────────┘                                      |
+----------------------------------------------------------+
```

---

## Implementation Plan

### Phase 1: Define Nurturing Sequence Data Model

**New database table: `nurturing_sequences`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| opportunity_id | uuid | FK to demo_opportunities |
| sequence_type | text | e.g., 'urgent_replace', 'code_violation', 'maintenance_reminder' |
| status | text | 'active', 'paused', 'completed', 'cancelled' |
| current_step | integer | Which step in the sequence (1, 2, 3...) |
| total_steps | integer | Total steps in sequence |
| next_action_at | timestamptz | When the next automated action fires |
| started_at | timestamptz | When sequence began |
| completed_at | timestamptz | When sequence ended (if applicable) |

**New database table: `sequence_templates`**

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| name | text | e.g., "Urgent Replacement - 5 Day" |
| trigger_type | text | 'replacement_urgent', 'prv_missing', etc. |
| steps | jsonb | Array of steps with timing and action type |

### Phase 2: Create Opportunity Categories

**File: `src/lib/opportunityCategories.ts`**

Define three lead lanes with clear categorization logic:

```text
REPLACEMENTS:
  - opportunity_type: 'replacement_urgent' | 'replacement_recommended' | 'warranty_expiring'
  - OR verdictAction === 'REPLACE'
  - OR isLeaking === true
  
CODE FIXES (derived from forensicInputs):
  - housePsi > 80 && !hasPrv → "Missing PRV"
  - isClosedLoop && !hasExpTank → "Missing Expansion Tank"
  - hardnessGPG > 15 && !hasSoftener → "Softener Recommended"
  
MAINTENANCE:
  - opportunity_type: 'flush_due' | 'anode_due' | 'descale_due' | 'annual_checkup'
```

### Phase 3: Refactor Page Layout

**File: `src/pages/Contractor.tsx`**

Replace the current two-column layout with a single-column, lane-based layout:

1. **Header**: "Lead Engine" branding with notification bell
2. **Category Tabs**: Quick-filter chips showing counts per category
3. **Lane Sections**: Collapsible sections for each category
4. **Nurturing Overview**: Bottom panel showing sequence statistics

### Phase 4: Create New Components

**New components to build:**

| Component | Purpose |
|-----------|---------|
| `LeadEnginePage.tsx` | New page layout replacing current Contractor |
| `CategoryTabs.tsx` | Horizontal tabs for Replacements/Code Fixes/Maintenance |
| `LeadLane.tsx` | Collapsible section showing leads of one category |
| `EnhancedLeadCard.tsx` | Lead card with nurturing sequence indicator |
| `NurturingBadge.tsx` | Shows sequence status on lead card |
| `SequenceOverviewPanel.tsx` | Bottom panel with sequence stats |
| `SequenceControlDrawer.tsx` | Drawer to pause/resume/customize sequences |

### Phase 5: Enhanced Lead Card Design

The new `EnhancedLeadCard` will show:

```text
┌──────────────────────────────────────────────────────────┐
│ 🔴 Maria Santos                              Health: 28  │
│    123 Oak Street, Phoenix AZ                            │
├──────────────────────────────────────────────────────────┤
│ Rheem ProSeries · 50 gal Gas · 12 years old              │
│ LEAKING · High sediment · No PRV                         │
├──────────────────────────────────────────────────────────┤
│ ⚡ Nurture: "Urgent Replace" · Step 2/5 · Next: Tomorrow │
│ [Pause] [Skip to Call]                                   │
├──────────────────────────────────────────────────────────┤
│ [📞 Call]  [📄 Details]  [🤖 Coach]           2 hours ago │
└──────────────────────────────────────────────────────────┘
```

### Phase 6: Sequence Templates (Predefined)

Create initial sequence templates:

**Urgent Replacement (5 steps over 7 days):**
1. Day 0: SMS - "Your water heater needs attention"
2. Day 1: Email - Risk report PDF attached
3. Day 3: SMS - "Limited time financing available"
4. Day 5: Call reminder to contractor
5. Day 7: Final SMS - "Ready when you are"

**Code Violation Awareness (3 steps over 14 days):**
1. Day 0: Email - Educational content about the violation
2. Day 7: SMS - "Your home may not be up to code"
3. Day 14: Call reminder

**Maintenance Reminder (4 steps over 30 days):**
1. Day 0: Email - "Annual maintenance keeps you safe"
2. Day 14: SMS - "Did you know sediment builds up?"
3. Day 21: Email - Seasonal maintenance checklist
4. Day 30: Call reminder

### Phase 7: Hook Updates

**File: `src/hooks/useContractorOpportunities.ts`**

Add new exports:

```text
- getOpportunitiesByCategory(opportunities): { replacements, codeFixes, maintenance }
- useNurturingSequences(): Fetch active sequences from new table
- useSequenceTemplates(): Fetch available templates
```

---

## Files to Create

| File | Description |
|------|-------------|
| `src/pages/LeadEngine.tsx` | New main page component |
| `src/components/contractor/CategoryTabs.tsx` | Category filter tabs |
| `src/components/contractor/LeadLane.tsx` | Collapsible lead section |
| `src/components/contractor/EnhancedLeadCard.tsx` | Card with nurture status |
| `src/components/contractor/NurturingBadge.tsx` | Sequence status indicator |
| `src/components/contractor/SequenceOverviewPanel.tsx` | Sequence stats panel |
| `src/components/contractor/SequenceControlDrawer.tsx` | Sequence management UI |
| `src/lib/opportunityCategories.ts` | Category logic and types |
| `src/hooks/useNurturingSequences.ts` | Sequence data hook |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route for `/lead-engine` or replace `/contractor` |
| `src/hooks/useContractorOpportunities.ts` | Add category grouping helper |
| `src/data/mockContractorData.ts` | Add sequence-related types |

## Database Migrations

| Table | Purpose |
|-------|---------|
| `nurturing_sequences` | Track active sequences per opportunity |
| `sequence_templates` | Store reusable sequence definitions |
| `sequence_events` | Log of sent messages/actions |

---

## Technical Notes

**Why lanes instead of a single list:**
- Contractors think in terms of "what TYPE of work do I have?" not just priority
- Replacement jobs are high-value - need visibility
- Code fixes have legal/safety urgency - separate from routine maintenance
- Maintenance can be batched and scheduled differently

**Nurturing sequence architecture:**
- Sequences are triggered when opportunities are created (via edge function)
- A background job (or Supabase scheduled function) processes due actions
- Contractors can pause/resume sequences from the UI
- When a contractor calls or converts, the sequence auto-completes

**Mobile considerations:**
- Category tabs scroll horizontally
- Lanes are fully collapsible for focused viewing
- Sequence controls in a bottom sheet on mobile

---

## Verification Steps

After implementation:
1. Navigate to `/contractor` (or `/lead-engine`)
2. See leads organized into three category lanes
3. Each lane shows count and is collapsible
4. Lead cards show nurturing sequence status
5. Click a lead → see sequence controls in drawer
6. Pause a sequence → badge updates to "Paused"
7. Convert a lead → sequence auto-completes
8. Sequence Overview panel shows accurate counts

