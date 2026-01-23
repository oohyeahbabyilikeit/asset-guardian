

# Update Backend Documentation with New Features

## Overview

The `docs/backend.md` file needs to be updated to document the new Contractor Dashboard redesign and sidecar revenue tracking features that have been implemented. This includes:

1. **New Database Tables**: `nurturing_sequences`, `sequence_events`, `sequence_templates`, `demo_opportunities`
2. **New Revenue Column**: `revenue_usd` on `nurturing_sequences` for tracking actual closed sales
3. **New Hooks**: `useWeeklyStats`, `useRecentActivity`, `useNurturingSequences`, `useSequenceEvents`
4. **New Components**: Dashboard widgets for the contractor automation view

---

## Additions to Backend Documentation

### Section 1: Update ERDiagram (lines ~93-318)

Add the new nurturing/sequence tables to the entity relationship diagram:

```text
%% Nurturing Sequences Layer
demo_opportunities ||--o{ nurturing_sequences : "has"
nurturing_sequences ||--o{ sequence_events : "contains"
sequence_templates ||--o{ nurturing_sequences : "uses"
```

And table definitions:
```text
demo_opportunities {
    uuid id PK
    string customer_name
    string property_address
    string opportunity_type
    string priority
    string status
    jsonb forensic_inputs
    integer health_score
}

nurturing_sequences {
    uuid id PK
    uuid opportunity_id FK
    string sequence_type
    string status
    integer current_step
    integer total_steps
    timestamptz next_action_at
    string outcome
    numeric revenue_usd
}

sequence_events {
    uuid id PK
    uuid sequence_id FK
    integer step_number
    string action_type
    string status
    timestamptz scheduled_at
    timestamptz executed_at
    timestamptz opened_at
    timestamptz clicked_at
}

sequence_templates {
    uuid id PK
    string name
    string trigger_type
    jsonb steps
    boolean is_active
}
```

### Section 2: New Table Schema Details (after line ~675)

Add complete column-level schema documentation for the four new tables:

#### `demo_opportunities`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `customer_name` | `text` | No | - | Contact name |
| `customer_phone` | `text` | Yes | - | Contact phone |
| `customer_email` | `text` | Yes | - | Contact email |
| `property_address` | `text` | No | - | Street address |
| `property_city` | `text` | No | - | City |
| `property_state` | `text` | No | `'AZ'` | State code |
| `property_zip` | `text` | No | - | ZIP code |
| `opportunity_type` | `text` | No | - | `replacement`, `code_violation`, `maintenance` |
| `priority` | `text` | No | - | `critical`, `high`, `medium`, `low` |
| `status` | `text` | No | `'pending'` | Pipeline status |
| `job_complexity` | `text` | No | `'STANDARD'` | `STANDARD`, `COMPLEX`, `PREMIUM` |
| `asset_brand` | `text` | No | - | Equipment brand |
| `asset_age_years` | `numeric` | No | - | Equipment age |
| `forensic_inputs` | `jsonb` | No | `'{}'` | Algorithm input data |
| `health_score` | `integer` | Yes | - | 0-100 health score |
| `bio_age` | `numeric` | Yes | - | Biological age |
| `fail_probability` | `numeric` | Yes | - | 12-month failure probability |
| `verdict_action` | `text` | Yes | - | `replace`, `maintain`, `monitor` |

#### `nurturing_sequences`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `opportunity_id` | `uuid` | No | - | FK to demo_opportunities |
| `sequence_type` | `text` | No | - | `replacement_urgent`, `code_violation`, `maintenance` |
| `status` | `text` | No | `'active'` | `active`, `paused`, `completed`, `cancelled` |
| `current_step` | `integer` | No | `1` | Current step number |
| `total_steps` | `integer` | No | - | Total steps in sequence |
| `next_action_at` | `timestamptz` | Yes | - | When next action due |
| `started_at` | `timestamptz` | No | `now()` | When sequence started |
| `completed_at` | `timestamptz` | Yes | - | When sequence ended |
| `outcome` | `text` | Yes | - | `converted`, `lost`, `stopped` |
| `outcome_reason` | `text` | Yes | - | Reason for outcome |
| `outcome_step` | `integer` | Yes | - | Step when outcome occurred |
| `outcome_at` | `timestamptz` | Yes | - | When outcome recorded |
| `revenue_usd` | `numeric` | Yes | - | **Manually-entered sale amount** |

#### `sequence_events`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `sequence_id` | `uuid` | No | - | FK to nurturing_sequences |
| `step_number` | `integer` | No | - | Step position in sequence |
| `action_type` | `text` | No | - | `sms`, `email`, `call_reminder` |
| `status` | `text` | No | `'pending'` | `pending`, `sent`, `failed`, `skipped` |
| `scheduled_at` | `timestamptz` | No | - | When action scheduled |
| `executed_at` | `timestamptz` | Yes | - | When action executed |
| `delivery_status` | `text` | Yes | `'pending'` | `pending`, `sent`, `delivered`, `failed` |
| `message_content` | `text` | Yes | - | Message text |
| `opened_at` | `timestamptz` | Yes | - | When recipient opened |
| `clicked_at` | `timestamptz` | Yes | - | When recipient clicked |
| `error_message` | `text` | Yes | - | Error if failed |

#### `sequence_templates`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `name` | `text` | No | - | Template name |
| `trigger_type` | `text` | No | - | What triggers this sequence |
| `steps` | `jsonb` | No | `'[]'` | Array of step definitions |
| `is_active` | `boolean` | No | `true` | Template enabled |

### Section 3: Add New Relationship Chain (after line ~790)

#### 7. Nurturing Sequence Chain
```text
demo_opportunities
    ↓ opportunity_id
nurturing_sequences
    ↓ sequence_id
sequence_events
```

**Key Points:**
- Sequences are linked to demo opportunities (not core water_heaters)
- Each sequence has multiple events (one per step)
- Templates define reusable sequence blueprints
- `revenue_usd` captures actual closed sale amounts (manual entry)

### Section 4: Add FK Reference Table Rows

| Child Table | FK Column | Parent Table | Cascade? |
|-------------|-----------|--------------|----------|
| `nurturing_sequences` | `opportunity_id` | `demo_opportunities` | CASCADE |
| `sequence_events` | `sequence_id` | `nurturing_sequences` | CASCADE |

### Section 5: Add New Table Category

| Category | Tables | Purpose |
|----------|--------|---------|
| **Nurturing/Automation** | `demo_opportunities`, `nurturing_sequences`, `sequence_events`, `sequence_templates` | Lead nurturing automation |

### Section 6: New Hooks Documentation (new section after Type Mappers)

## Contractor Dashboard Hooks

### Location: `src/hooks/useNurturingSequences.ts`

#### `useNurturingSequences(opportunityId?: string)`

Fetches all nurturing sequences, optionally filtered by opportunity.

```typescript
interface NurturingSequence {
  id: string;
  opportunityId: string;
  sequenceType: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  nextActionAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  outcome: 'converted' | 'lost' | 'stopped' | null;
  outcomeReason: string | null;
  outcomeAt: Date | null;
}
```

#### `useEnrichedSequences()`

Fetches sequences with customer data from demo_opportunities (client-side join).

```typescript
interface EnrichedSequence extends NurturingSequence {
  customerName: string;
  propertyAddress: string;
  opportunityType: string;
}
```

#### `usePulseMetrics()`

Aggregates automation health metrics for dashboard display.

```typescript
interface PulseMetrics {
  enrolled7Days: number;   // Sequences created in last 7 days
  activeNow: number;       // Currently active sequences
  engaged24h: number;      // Opens/clicks in last 24 hours
  converted: number;       // Total converted sequences
}
```

---

### Location: `src/hooks/useSequenceEvents.ts`

#### `useSequenceEvents(sequenceId: string)`

Fetches all events for a specific sequence.

#### `useMarkOutcome()`

Marks a sequence as converted/lost with optional revenue capture.

```typescript
interface MarkOutcomeParams {
  sequenceId: string;
  outcome: 'converted' | 'lost';
  reason?: string;
  currentStep: number;
  revenueUsd?: number | null;  // Manual sale amount entry
}
```

---

### Location: `src/hooks/useWeeklyStats.ts`

#### `useWeeklyStats()`

Calculates weekly performance metrics from database.

```typescript
interface WeeklyStats {
  jobsBooked: number;     // Converted sequences this week
  revenue: number;        // Sum of revenue_usd from conversions
  fromAutomation: number; // Bookings from automated sequences
  trend: number;          // % change vs previous week
}
```

**Key Distinction:**
- `revenue` is derived from **manually-entered** `revenue_usd` values
- This is NOT estimated - it's what the contractor actually logged

---

### Location: `src/hooks/useRecentActivity.ts`

#### `useRecentActivity(limit?: number)`

Fetches recent engagement activity for the dashboard feed.

```typescript
type ActivityType = 'opened' | 'clicked' | 'booked' | 'started' | 'stopped';

interface ActivityItem {
  id: string;
  type: ActivityType;
  customerName: string;
  propertyAddress: string;
  sequenceType: string;
  messageContent?: string;
  timestamp: Date;
}
```

### Section 7: Revenue Tracking Architecture (new section)

## Revenue Tracking (Sidecar Model)

The platform operates as a "sidecar" without integration to external invoicing systems. Revenue tracking uses manual entry with gamification.

### Data Flow

```text
1. Contractor clicks "Mark Converted" in SequenceControlDrawer
         ↓
2. ConversionCelebrationModal opens with confetti animation
         ↓
3. Contractor enters Final Sale Amount: $[    ]
         ↓
4. useMarkOutcome() saves to nurturing_sequences.revenue_usd
         ↓
5. useWeeklyStats() sums revenue_usd for dashboard display
```

### Est. Value vs Revenue Distinction

| Metric | Source | Display | Purpose |
|--------|--------|---------|---------|
| **Est. Value** | Calculated from opportunity types | `~$18,000` (tilde prefix) | Pipeline potential |
| **Revenue** | Sum of `revenue_usd` entries | `$9,000` (solid, green) | Actual closed sales |

**Pitch:** "We generated $18k in opportunities. You closed $9k. Let's go get the rest."

### High Interest Nudge

Sequences with 2+ clicks display a "High Interest" indicator (flame icon) in the table to prompt the contractor to verify if the customer has booked externally.

---

## File Changes Summary

| File | Action |
|------|--------|
| `docs/backend.md` | Add new sections documenting nurturing tables, hooks, and revenue tracking |

The documentation update will add approximately 400-500 lines covering:
- 4 new table schemas with full column details
- New relationship chain documentation
- 5 new hooks with TypeScript interfaces
- Revenue tracking architecture explanation
- Updated ERDiagram with nurturing entities

