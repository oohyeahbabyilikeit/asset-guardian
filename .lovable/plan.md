
# Backend Documentation Update: Current Database & Edge Functions State

## Overview

The `docs/backend.md` file needs updates to reflect the current database schema and edge function inventory. Several tables and functions have been added since the documentation was last updated.

## Gap Analysis

### Missing Tables (Not Documented)

| Table | Purpose | Status |
|-------|---------|--------|
| `opportunity_notifications` | Contractor alerts for maintenance/warranty opportunities | **Not in docs** |

### Missing Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `generate-issue-guidance` | AI-generated infrastructure issue explanations | **Not in overview table** |

### Incomplete Schema Documentation

The `water_heaters` table is missing 9 algorithm-related columns that now exist in the database:

| Column | Type | Purpose |
|--------|------|---------|
| `people_count` | integer | Household size for usage calculation |
| `usage_type` | text | normal/heavy/light usage pattern |
| `measured_hardness_gpg` | numeric | Measured water hardness |
| `sanitizer_type` | text | CHLORINE/CHLORAMINE/UNKNOWN |
| `softener_salt_status` | text | Salt level status |
| `nipple_material` | text | Connection nipple material |
| `last_flush_years_ago` | numeric | Years since last flush |
| `last_anode_replace_years_ago` | numeric | Years since anode replacement |
| `years_without_softener` | numeric | Years exposed to hard water |
| `years_without_anode` | numeric | Years without anode protection |
| `is_annually_maintained` | boolean | Regular maintenance flag |

---

## Implementation Plan

### Step 1: Add `opportunity_notifications` Table Schema

Add after the `maintenance_notification_requests` section (~line 531):

```markdown
#### `opportunity_notifications`

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `water_heater_id` | `uuid` | No | - | FK to water_heaters (CASCADE) |
| `contractor_id` | `uuid` | No | - | FK to profiles (CASCADE) |
| `opportunity_type` | `text` | No | - | `warranty_ending`, `flush_due`, `anode_due`, etc. |
| `priority` | `text` | No | `'medium'` | `low`, `medium`, `high`, `critical` |
| `health_score` | `integer` | Yes | - | Unit health at notification time |
| `fail_probability` | `numeric` | Yes | - | Failure probability snapshot |
| `calculated_age` | `numeric` | Yes | - | Bio age at notification time |
| `opportunity_context` | `jsonb` | Yes | `'{}'` | Additional context data |
| `status` | `text` | No | `'pending'` | `pending`, `sent`, `viewed`, `converted`, `dismissed` |
| `dismiss_reason` | `text` | Yes | - | Why contractor dismissed |
| `created_at` | `timestamptz` | No | `now()` | Record creation time |
| `sent_at` | `timestamptz` | Yes | - | When notification sent |
| `viewed_at` | `timestamptz` | Yes | - | When contractor viewed |
| `expires_at` | `timestamptz` | Yes | `now() + 30 days` | Notification expiration |
```

### Step 2: Update ER Diagram

Add relationship lines in the mermaid diagram (~line 94-131):

```mermaid
%% Add to Asset Layer section
water_heaters ||--o{ opportunity_notifications : "generates"
opportunity_notifications }o--|| profiles : "assigned_to"
```

Add table definition:
```
opportunity_notifications {
    uuid id PK
    uuid water_heater_id FK
    uuid contractor_id FK
    string opportunity_type
    string priority
    string status
    timestamp expires_at
}
```

### Step 3: Add `generate-issue-guidance` Edge Function

Add to the Edge Functions overview table (~line 775):

```markdown
| `generate-issue-guidance` | Content | gemini-3-flash-preview | No | No |
```

Add detailed section after `generate-educational-content` (~line 1083):

```markdown
#### `generate-issue-guidance`

**Purpose:** Generate personalized infrastructure issue explanations for homeowners.

**Request:**
```typescript
interface IssueGuidanceRequest {
  context: {
    issueId: string;          // e.g., 'missing_prv', 'missing_exp_tank'
    issueName: string;        // Technical issue name
    friendlyName: string;     // User-friendly description
    recommendation: {
      action: 'REPLACE' | 'REPAIR' | 'MAINTAIN' | 'MONITOR';
      reason: string;
    };
    location: string;         // Installation location
    damageScenario: {
      min: number;            // Minimum damage estimate
      max: number;            // Maximum damage estimate
      description: string;
    };
    unitAge: number;
    healthScore: number;
    agingRate: number;
    isServiceable: boolean;
    manufacturer?: string;
    stressFactors?: Record<string, number>;
  };
}
```

**Response:**
```typescript
interface IssueGuidanceResponse {
  success: boolean;
  guidance?: {
    headline: string;         // 3-5 word summary
    explanation: string;      // Plain language issue description
    yourSituation: string;    // Personalized context
    recommendation: string;   // Action guidance
    economicContext: string;  // Value proposition
    actionItems: string[];    // Next steps
    shouldFix: boolean;       // Fix recommended?
  };
  error?: string;
}
```

**AI Behavior Rules:**
- Trust algorithm verdict (action field is source of truth)
- No percentages or dollar amounts in responses
- Use qualitative labels ("elevated wear", "concerning condition")
- Match headline to algorithm action type
```

### Step 4: Update `water_heaters` Table Schema

Add missing columns to the `water_heaters` table definition (~line 345-394):

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `people_count` | `integer` | Yes | `3` | Household size |
| `usage_type` | `text` | Yes | `'normal'` | `normal`, `heavy`, `light` |
| `measured_hardness_gpg` | `numeric` | Yes | - | Tested water hardness |
| `sanitizer_type` | `text` | Yes | `'UNKNOWN'` | `CHLORINE`, `CHLORAMINE`, `UNKNOWN` |
| `softener_salt_status` | `text` | Yes | `'UNKNOWN'` | Salt level status |
| `nipple_material` | `text` | Yes | - | Pipe nipple material |
| `last_flush_years_ago` | `numeric` | Yes | - | Years since last flush |
| `last_anode_replace_years_ago` | `numeric` | Yes | - | Years since anode service |
| `years_without_softener` | `numeric` | Yes | - | Hard water exposure years |
| `years_without_anode` | `numeric` | Yes | - | Unprotected years |
| `is_annually_maintained` | `boolean` | Yes | `false` | Regular maintenance flag |

### Step 5: Update Foreign Key Reference Table

Add to the FK table (~line 720-742):

```markdown
| `opportunity_notifications` | `water_heater_id` | `water_heaters` | CASCADE |
| `opportunity_notifications` | `contractor_id` | `profiles` | CASCADE |
```

### Step 6: Update Table Categories

Add `opportunity_notifications` to the Commercial category (~line 752):

```markdown
| **Commercial** | `quotes`, `leads`, `maintenance_notification_requests`, `opportunity_notifications` | Business operations |
```

### Step 7: Update Relationship Chains

Add new chain after Lead Generation Chain (~line 700):

```markdown
#### 6. Opportunity Notification Chain
```
water_heaters
    ↓ (algorithm triggers)
opportunity_notifications
    ↓
contractor (via contractor_id)
```

**Key Points:**
- Notifications generated when maintenance thresholds met
- Linked to both asset and assigned contractor
- Status workflow: pending → sent → viewed → converted/dismissed
- Auto-expire after 30 days
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `docs/backend.md` | Add opportunity_notifications schema, add generate-issue-guidance function, update water_heaters columns, update ER diagram, update FK table, update category table |

## Verification Checklist

After implementation, confirm:
- [ ] `opportunity_notifications` table fully documented with all 14 columns
- [ ] `generate-issue-guidance` in edge function table and has detailed section
- [ ] `water_heaters` table has all 11 missing algorithm columns
- [ ] ER diagram shows `opportunity_notifications` relationships
- [ ] FK reference table includes CASCADE delete relationships
- [ ] Table categories include the new table
