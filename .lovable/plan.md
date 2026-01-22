

# Automatic Contractor Opportunity Notification System

## Overview

Build a system that automatically scans water heater records nightly and notifies contractors (plumbing business owners) of maintenance and replacement opportunities for their connected properties.

---

## Phase 1: Dynamic Age Calculation

### Problem
Currently `calendar_age_years` is a static snapshot from inspection time. A unit inspected 6 months ago still shows the same age.

### Solution
Calculate age dynamically from `install_date` whenever the algorithm runs.

### Changes

**Database**: Add `manufacture_date` column (already have `install_date` which serves this purpose)

**Algorithm Helper** (`src/lib/opterraAlgorithm.ts`):
```typescript
export function calculateCurrentAge(installDate: Date | null, storedAge?: number): number {
  if (installDate) {
    const now = new Date();
    return (now.getTime() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  }
  return storedAge ?? 0;
}
```

**Usage Pattern**: When loading a water heater for algorithm calculation, compute current age:
```typescript
const currentAge = calculateCurrentAge(waterHeater.install_date, waterHeater.calendar_age_years);
const inputs: ForensicInputs = { calendarAge: currentAge, ... };
```

---

## Phase 2: Opportunity Detection Engine

### New Edge Function: `detect-opportunities`

Runs nightly via `pg_cron`. Scans all water heaters and identifies actionable opportunities.

### Opportunity Types

| Type | Detection Logic | Priority |
|------|-----------------|----------|
| `warranty_ending` | Warranty expires within 90 days | HIGH |
| `flush_due` | `monthsToFlush <= 0` or `flushStatus = 'due'/'critical'` | MEDIUM |
| `anode_due` | `shieldLife <= 1 year` | MEDIUM |
| `descale_due` | Tankless: `descaleStatus = 'due'/'critical'` | MEDIUM |
| `replacement_recommended` | `failProb >= 0.4` or `healthScore <= 50` | HIGH |
| `replacement_urgent` | `failProb >= 0.6` or leaking | CRITICAL |
| `infrastructure_missing` | No PRV/expansion tank in closed loop | MEDIUM |
| `annual_checkup` | 12+ months since last service event | LOW |

### New Database Table: `opportunity_notifications`

```sql
CREATE TABLE opportunity_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_heater_id UUID NOT NULL REFERENCES water_heaters(id),
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  opportunity_type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  health_score INTEGER,
  fail_probability NUMERIC,
  calculated_age NUMERIC,
  opportunity_context JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending', -- pending, sent, viewed, converted, dismissed
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Index for fast contractor lookup
CREATE INDEX idx_opp_contractor_status ON opportunity_notifications(contractor_id, status);
```

---

## Phase 3: Edge Function Implementation

### `supabase/functions/detect-opportunities/index.ts`

```typescript
// Pseudocode structure
async function detectOpportunities() {
  // 1. Fetch all water heaters with contractor relationships
  const waterHeaters = await fetchWaterHeatersWithContractors();
  
  // 2. For each water heater, calculate current age and run algorithm
  for (const wh of waterHeaters) {
    const currentAge = calculateCurrentAge(wh.install_date, wh.calendar_age_years);
    const inputs = buildForensicInputs(wh, currentAge);
    const result = calculateOpterraRisk(inputs);
    
    // 3. Detect opportunities based on thresholds
    const opportunities = detectThresholdBreaches(wh, result);
    
    // 4. Check for existing pending notifications (avoid duplicates)
    // 5. Insert new opportunities
  }
}
```

### Deduplication Logic
- Don't create duplicate notifications for same water heater + opportunity type within 30 days
- Mark existing as "superseded" if priority increases

---

## Phase 4: Notification Delivery

### Email Delivery via Resend

New edge function: `send-opportunity-notifications`

**Email Template Content**:
```
Subject: {count} Maintenance Opportunities in Your Service Area

Hi {contractorName},

We've identified {count} opportunities for your connected properties:

🔴 CRITICAL (1):
  - {address}: Water heater replacement recommended (Health: 35/100)

🟡 HIGH (2):
  - {address}: Warranty expiring in 45 days
  - {address}: Anode rod due for inspection

🟢 MEDIUM (3):
  - {address}: Annual flush due
  ...

[View Opportunities Dashboard →]
```

### Delivery Schedule
- Run daily at 7 AM local time (contractor's timezone)
- Batch notifications per contractor (don't send 10 emails for 10 properties)
- Respect `preferred_contact_method` from profiles table

---

## Phase 5: Contractor Dashboard

### New Route: `/contractor/opportunities`

Display pending opportunities with:
- Filter by priority/type/property
- One-click "Schedule Service" → creates lead
- "Dismiss" with reason → updates status
- "Already Serviced" → creates service event

---

## Data Flow Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                         NIGHTLY CRON                            │
│                    (pg_cron @ 2 AM UTC)                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: detect-opportunities                │
│  1. Fetch water_heaters with contractor relationships           │
│  2. Calculate CURRENT age from install_date                     │
│  3. Run Opterra algorithm for each unit                         │
│  4. Detect threshold breaches (warranty, flush, replacement)    │
│  5. Insert into opportunity_notifications (deduped)             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: send-opportunity-notifications      │
│                        (Runs @ 7 AM)                            │
│  1. Group pending notifications by contractor                   │
│  2. Build digest email with priority sections                   │
│  3. Send via Resend API                                         │
│  4. Mark as 'sent' with timestamp                               │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTRACTOR DASHBOARD                         │
│  - View pending opportunities                                   │
│  - Filter/sort by priority                                      │
│  - Convert to lead or service event                             │
│  - Dismiss with reason                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Sequence

| Step | Task | Dependency |
|------|------|------------|
| 1 | Add `calculateCurrentAge()` helper | None |
| 2 | Create `opportunity_notifications` table | None |
| 3 | Build `detect-opportunities` edge function | Steps 1-2 |
| 4 | Set up pg_cron job for detection | Step 3 |
| 5 | Add RESEND_API_KEY secret | None |
| 6 | Build `send-opportunity-notifications` edge function | Step 5 |
| 7 | Set up pg_cron job for sending | Step 6 |
| 8 | Build contractor opportunities dashboard | Steps 1-4 |

---

## Required Secrets

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Email delivery via Resend |

---

## Existing Assets to Leverage

| Asset | How It's Used |
|-------|---------------|
| `contractor_property_relationships` | Links contractors to properties |
| `leads` table | Convert opportunity → lead |
| `service_events` table | Log completed maintenance |
| `maintenanceCalculations.ts` | Threshold detection logic |
| `calculateOpterraRisk()` | Health/failure scoring |

---

## Success Metrics

1. **Opportunity Detection Rate**: % of due maintenance items flagged
2. **Email Open Rate**: Track via Resend analytics
3. **Conversion Rate**: Opportunities → Leads → Service Events
4. **Time to Action**: Hours between notification and contractor response

