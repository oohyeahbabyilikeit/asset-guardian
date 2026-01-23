

# Real Nurturing Sequence System - Feature Design

## Current Gaps

The current implementation has:
- Sequences stored in DB with step/status
- Badge showing "Step 2/5" on lead cards
- Pause/Resume toggle
- Aggregate stats panel

But lacks the intuitive features contractors need to actually manage outreach.

---

## Feature Requirements for a Real Nurture System

### 1. Sequence Lifecycle Management

| Feature | Description |
|---------|-------------|
| **Start Sequence** | Button on lead card or drawer to enroll a lead in a sequence |
| **Choose Template** | Modal/drawer showing available templates with preview |
| **Stop Sequence** | Cancel entirely (different from pause) |
| **Restart Sequence** | Re-enroll from step 1 after completion or cancel |

### 2. Sequence Step Visibility

| Feature | Description |
|---------|-------------|
| **Step Timeline View** | Visual timeline showing all steps, what's done, what's next |
| **Step Details** | See the actual message content for each step |
| **Scheduled Timing** | Show "Day 0", "Day 3", etc. and actual scheduled dates |
| **Step Type Icons** | SMS, Email, Call Reminder with distinct icons |

### 3. Event History / Activity Log

| Feature | Description |
|---------|-------------|
| **Sent Log** | Record of every message sent with timestamp |
| **Delivery Status** | Sent / Delivered / Failed |
| **Open/Click Tracking** | Did they open the email? Click a link? |
| **Reply Detection** | Flag when customer responds (stops automation) |

### 4. Manual Controls

| Feature | Description |
|---------|-------------|
| **Send Now** | Trigger the next step immediately |
| **Skip Step** | Skip current step, advance to next |
| **Jump to Step** | Go to a specific step in the sequence |
| **Edit Message** | Customize the message for this specific lead |

### 5. Outcome Tracking

| Feature | Description |
|---------|-------------|
| **Mark Converted** | Lead booked appointment / closed deal |
| **Mark Lost** | Lead declined / unsubscribed |
| **Reason Codes** | Why did they convert or decline? |
| **Sequence Attribution** | Which step led to conversion? |

### 6. Template Management

| Feature | Description |
|---------|-------------|
| **View Templates** | List all available sequence templates |
| **Preview Steps** | See the full workflow before starting |
| **Create Template** | Build custom sequences (advanced) |
| **Enable/Disable** | Turn templates on/off |

---

## Proposed UI Components

### 1. Sequence Control Drawer

Opens when clicking "Details" on a sequence badge or "Start Sequence" on a lead without one.

```
+----------------------------------------------------------+
|  Nurturing Sequence                              [Close] |
+----------------------------------------------------------+
|                                                          |
|  ┌────────────────────────────────────────────────────┐  |
|  │  Maria Santos · 123 Oak St                         │  |
|  │  Rheem 50g · 12yr · CRITICAL                       │  |
|  └────────────────────────────────────────────────────┘  |
|                                                          |
|  CURRENT SEQUENCE: Urgent Replace (5 steps)              |
|  Status: Active · Step 2 of 5 · Next: Tomorrow           |
|                                                          |
|  ──────── Step Timeline ────────                         |
|                                                          |
|  [x] Day 0 · SMS · "Your water heater needs attention"   |
|      Sent Jan 22, 2:30 PM · Delivered                    |
|                                                          |
|  [>] Day 1 · EMAIL · "Risk report PDF attached"          |
|      Scheduled: Jan 23, 2:30 PM                          |
|      [Send Now] [Skip] [Edit]                            |
|                                                          |
|  [ ] Day 3 · SMS · "Limited time financing available"    |
|      Scheduled: Jan 25, 2:30 PM                          |
|                                                          |
|  [ ] Day 5 · CALL · "Call reminder to contractor"        |
|      Scheduled: Jan 27, 2:30 PM                          |
|                                                          |
|  [ ] Day 7 · SMS · "Ready when you are"                  |
|      Scheduled: Jan 29, 2:30 PM                          |
|                                                          |
|  ────────────────────────────────────────                |
|                                                          |
|  [Pause Sequence]  [Stop Sequence]  [Change Template]    |
|                                                          |
+----------------------------------------------------------+
```

### 2. Start Sequence Modal

Shows when starting a new sequence for a lead:

```
+------------------------------------------+
|  Start Nurturing Sequence                |
+------------------------------------------+
|                                          |
|  Choose a sequence for Maria Santos:     |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │ [x] Urgent Replacement - 5 Day     │  |
|  │     5 steps · SMS + Email + Call   │  |
|  │     Best for: Critical/High leads  │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │ [ ] Code Violation Awareness       │  |
|  │     3 steps · Email + SMS + Call   │  |
|  │     Best for: Safety issues        │  |
|  └────────────────────────────────────┘  |
|                                          |
|  ┌────────────────────────────────────┐  |
|  │ [ ] Maintenance Reminder - 30 Day  │  |
|  │     4 steps · Email + SMS          │  |
|  │     Best for: Routine maintenance  │  |
|  └────────────────────────────────────┘  |
|                                          |
|  [Preview Steps]         [Start Now]     |
|                                          |
+------------------------------------------+
```

### 3. Activity Log Tab (in PropertyReportDrawer)

Add a tab to the existing drawer showing sequence history:

```
+------------------------------------------+
|  Activity                                |
+------------------------------------------+
|                                          |
|  Today                                   |
|  ─────                                   |
|  📧 Email sent: "Risk report PDF"        |
|     2:30 PM · Delivered · Opened         |
|                                          |
|  Yesterday                               |
|  ─────────                               |
|  📱 SMS sent: "Your water heater needs   |
|     attention"                           |
|     3:45 PM · Delivered                  |
|                                          |
|  📋 Sequence started: Urgent Replace     |
|     3:45 PM · By system                  |
|                                          |
|  🔍 Lead created from inspection         |
|     3:30 PM · Tech: John Smith           |
|                                          |
+------------------------------------------+
```

### 4. Enhanced Lead Card with Start Button

For leads without a sequence:

```
┌──────────────────────────────────────────────────────────┐
│ Maria Santos                                  Health: 28 │
│ 123 Oak Street, Phoenix AZ                               │
├──────────────────────────────────────────────────────────┤
│ Rheem ProSeries · 50 gal · 12 years                      │
│ LEAKING · High sediment                                  │
├──────────────────────────────────────────────────────────┤
│ ⚡ No sequence active                                    │
│ [+ Start Sequence]                                       │
├──────────────────────────────────────────────────────────┤
│ [Call]  [Details]  [Coach]                    2 hours ago│
└──────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Core Sequence Controls

**New Components:**
| Component | Purpose |
|-----------|---------|
| `SequenceControlDrawer.tsx` | Full drawer showing timeline, controls, history |
| `StartSequenceModal.tsx` | Template picker when starting a new sequence |
| `StepTimeline.tsx` | Visual timeline of sequence steps |
| `StepCard.tsx` | Individual step with status, timing, actions |

**Database:**
- Use existing `sequence_events` table to log sent messages
- Add columns: `delivery_status`, `opened_at`, `clicked_at`

**Hooks:**
| Hook | Purpose |
|------|---------|
| `useSequenceEvents(sequenceId)` | Fetch event history |
| `useAdvanceStep()` | Mutation to send now or skip |
| `useStopSequence()` | Cancel a sequence entirely |

### Phase 2: Activity Feed

**New Components:**
| Component | Purpose |
|-----------|---------|
| `ActivityFeed.tsx` | Chronological log of all touchpoints |
| `ActivityItem.tsx` | Single activity entry with icon/status |

**Integration:**
- Add "Activity" tab to `PropertyReportDrawer`
- Combine sequence events + manual actions (calls logged, notes added)

### Phase 3: Template Management

**New Components:**
| Component | Purpose |
|-----------|---------|
| `TemplatesListDrawer.tsx` | View all templates |
| `TemplatePreview.tsx` | Full step-by-step preview |

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/contractor/SequenceControlDrawer.tsx` | Main sequence management drawer |
| `src/components/contractor/StartSequenceModal.tsx` | Template picker modal |
| `src/components/contractor/StepTimeline.tsx` | Visual step timeline |
| `src/components/contractor/StepCard.tsx` | Individual step UI |
| `src/components/contractor/ActivityFeed.tsx` | Activity log component |
| `src/hooks/useSequenceEvents.ts` | Fetch sequence event history |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/contractor/EnhancedLeadCard.tsx` | Add "Start Sequence" button for leads without one |
| `src/components/contractor/NurturingBadge.tsx` | Make clickable to open control drawer |
| `src/components/contractor/PropertyReportDrawer.tsx` | Add Activity tab with sequence history |
| `src/pages/LeadEngine.tsx` | Wire up new drawers and modals |
| `src/hooks/useNurturingSequences.ts` | Add mutations for skip, stop, advance |

## Database Changes

Add columns to `sequence_events` table for tracking:
```sql
ALTER TABLE sequence_events 
  ADD COLUMN delivery_status text DEFAULT 'pending',
  ADD COLUMN opened_at timestamptz,
  ADD COLUMN clicked_at timestamptz,
  ADD COLUMN message_content text;
```

---

## Technical Approach

**Step Timing Calculation:**
- Each template step has a `day` offset (0, 1, 3, 5, 7)
- `scheduled_at = sequence.started_at + (step.day * 24 hours)`
- Display shows actual date/time based on this calculation

**Send Now Logic:**
- Update `sequence_events` with `executed_at = now()`
- Advance `current_step` in `nurturing_sequences`
- Recalculate `next_action_at` for remaining steps

**Outcome Tracking:**
- When contractor marks "Converted", update sequence status to 'completed'
- Store which step they were on at conversion (attribution)
- Record reason code if applicable

---

## Summary

This plan adds the missing pieces to make the nurturing system actually usable:

1. **Start Sequence** - Enroll leads with template selection
2. **View Steps** - See full timeline with scheduled dates
3. **Control Steps** - Send now, skip, pause, stop
4. **Track History** - Activity log showing what happened
5. **Record Outcomes** - Mark converted/lost with attribution

