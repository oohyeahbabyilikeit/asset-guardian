
# Outreach Sequences Page - Dedicated Automation Workspace

## Overview

Create a new `/contractor/sequences` page that provides a centralized hub for managing all nurturing sequences and templates. This separates the "automation system" from the "lead prioritization" workflow.

---

## Information Architecture

```text
/contractor (Lead Engine)
├── CommandBar (hot lead, stats)
├── Lead Lanes (categorized leads)
└── [Lead Cards → PropertyReportDrawer → SequenceControlDrawer]

/contractor/sequences (NEW)
├── Active Sequences Dashboard
│   ├── Overdue (needs attention NOW)
│   ├── Due Today 
│   └── Upcoming
├── Sequence Templates
│   ├── View all templates
│   ├── Create new template
│   └── Edit existing template
└── Performance Analytics
    ├── Open/Click rates
    └── Conversion attribution
```

---

## Page Layout

### Header Section

```text
┌──────────────────────────────────────────────────────────────────┐
│ [☰]  Outreach Sequences                              [+ New]    │
│       Automate follow-up with customers                         │
└──────────────────────────────────────────────────────────────────┘
```

### Tab Navigation

```text
[ Active (7) ]  [ Templates (3) ]  [ Analytics ]
```

---

## Tab 1: Active Sequences

Shows all in-progress sequences grouped by urgency:

```text
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ OVERDUE (2)                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Williams Residence          Urgent Replace · Step 3/5          │
│ Due: Yesterday              [Send Now] [Skip] [→]               │
├─────────────────────────────────────────────────────────────────┤
│ Johnson Family              Urgent Replace · Step 2/5          │
│ Due: 2 days ago             [Send Now] [Skip] [→]               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📅 DUE TODAY (1)                                                │
├─────────────────────────────────────────────────────────────────┤
│ Thompson Home               Code Violation · Step 4/5          │
│ Due: Today at 2:00 PM       [Send Now] [Skip] [→]               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📆 UPCOMING (4)                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Martinez Residence          Maintenance · Step 1/4    ⏸ Paused │
│ Due: Tomorrow               [Resume] [→]                        │
├─────────────────────────────────────────────────────────────────┤
│ Patel Residence             Code Violation · Step 2/5          │
│ Due: In 3 days              [Pause] [→]                         │
├─────────────────────────────────────────────────────────────────┤
│ ... more ...                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Sequence Row Actions

| Button | Action |
|--------|--------|
| Send Now | Execute current step immediately |
| Skip | Skip current step, advance sequence |
| Pause/Resume | Toggle sequence status |
| → (Arrow) | Open SequenceControlDrawer for full details |

---

## Tab 2: Templates

A list of all sequence templates with ability to create/edit:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Urgent Replacement - 5 Day                           [Edit]    │
│ 5 steps · SMS, Email, Call                                     │
│ Best for: Critical/High priority leads                         │
├─────────────────────────────────────────────────────────────────┤
│ Code Violation - 7 Day                               [Edit]    │
│ 4 steps · SMS, Email                                           │
│ Best for: Safety compliance issues                             │
├─────────────────────────────────────────────────────────────────┤
│ Maintenance Reminder                                 [Edit]    │
│ 3 steps · SMS, Email                                           │
│ Best for: Routine maintenance                                  │
└─────────────────────────────────────────────────────────────────┘

                    [+ Create New Template]
```

### Template Editor (Drawer or Modal)

When creating/editing a template:

```text
┌─────────────────────────────────────────────────────────────────┐
│ Template Name: [Urgent Replacement - 5 Day______]               │
│ Trigger Type:  [Replacement Urgent        ▼]                   │
├─────────────────────────────────────────────────────────────────┤
│ STEPS                                                           │
├─────────────────────────────────────────────────────────────────┤
│ Day 1 │ SMS │ "Hi {name}, this is {company}..."      [🗑]     │
│ Day 2 │ Email │ "Following up on your water..."     [🗑]     │
│ Day 3 │ Call │ "Reminder: Call customer"            [🗑]     │
│ Day 5 │ SMS │ "Just checking in about..."           [🗑]     │
│                                                                 │
│       [+ Add Step]                                              │
├─────────────────────────────────────────────────────────────────┤
│                              [Cancel]  [Save Template]          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tab 3: Analytics

Performance metrics for outreach effectiveness:

```text
┌─────────────────────────────────────────────────────────────────┐
│ LAST 30 DAYS                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Messages Sent        Open Rate         Click Rate             │
│       47                68%               24%                  │
│                                                                 │
│  Sequences Started    Converted         Lost                   │
│       12                 4                 2                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ TOP PERFORMING TEMPLATE                                         │
│ Urgent Replacement - 5 Day                                      │
│ 75% conversion rate (3/4)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/pages/Sequences.tsx` | Main sequences page with tabs |
| `src/components/contractor/ActiveSequencesList.tsx` | Grouped list of active sequences |
| `src/components/contractor/SequenceRow.tsx` | Compact row for sequence in list |
| `src/components/contractor/TemplatesList.tsx` | List of templates with edit buttons |
| `src/components/contractor/TemplateEditor.tsx` | Create/edit template drawer |
| `src/components/contractor/SequenceAnalytics.tsx` | Performance metrics component |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add route `/contractor/sequences` |
| `src/components/contractor/ContractorMenu.tsx` | Add "Sequences" nav link |
| `src/hooks/useNurturingSequences.ts` | Add mutations for template CRUD |

### Files to Keep (Reused)

| File | Why Keep |
|------|----------|
| `SequenceControlDrawer.tsx` | Still used for detailed step timeline from list |
| `StepTimeline.tsx` | Reused inside drawer |
| `StepCard.tsx` | Reused inside drawer |

---

## Navigation Integration

Update `ContractorMenu.tsx` to add the Sequences link:

```text
Current:                          Updated:
🏠 Dashboard                      🏠 Dashboard
🔥 Lead Engine    ← active       🔥 Lead Engine
⚙️ Settings                       ⚡ Sequences     ← NEW
📊 Reports                        ⚙️ Settings
                                  📊 Reports
```

The Lead Engine will still show sequence badges on cards and allow quick start via modal, but the Sequences page becomes the power-user hub for managing automation.

---

## Technical Notes

### Data Fetching

The new `ActiveSequencesList` will use an enhanced query that joins:
- `nurturing_sequences` (status, current_step, next_action_at)
- `demo_opportunities` (customer_name, property_address)
- `sequence_templates` (template name, steps)

This provides all data needed for the list view without N+1 queries.

### Template CRUD

Add new mutations to `useNurturingSequences.ts`:
- `useCreateTemplate()` - Insert new template
- `useUpdateTemplate()` - Update existing template
- `useDeleteTemplate()` - Soft delete (set is_active = false)

### State Management

The page will use React Query for all data with optimistic updates for:
- Pause/Resume toggling
- Skip step
- Send now

---

## Benefits

| Aspect | Before | After |
|--------|--------|-------|
| View all sequences | One-at-a-time via lead cards | Full dashboard view |
| Overdue visibility | Hidden | Prominent top section |
| Template management | DB-only | Full UI editor |
| Quick actions | Open lead → find sequence | Direct from list |
| Analytics | None | Open/click/conversion rates |

---

## Summary

This dedicated Sequences page transforms scattered automation controls into a unified workspace:

1. **Active Sequences Dashboard** - See all sequences, prioritized by urgency
2. **Template Builder** - Create and edit templates without touching the database
3. **Analytics** - Track what's working and conversion attribution
4. **Quick Actions** - Send, skip, pause directly from the list

The Lead Engine stays focused on leads while Sequences becomes the automation command center.
