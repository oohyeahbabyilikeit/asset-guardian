
## Goal
Wire the **Pipeline** and **Completed** sidebar widgets to use real data from the `demo_opportunities` database table, eliminating the last remaining mock data imports in the contractor dashboard.

---

## Current State

**Already Using Real Data:**
- Today's Actions (priority counts) - derived from `useContractorOpportunities()`
- Service Opportunities Feed - fetched from `demo_opportunities` table
- PropertyReportDrawer / SalesCoachDrawer - receive real opportunity data

**Still Using Mock Data:**
- `PipelineOverview.tsx` (line 2): `import { mockPipeline } from '@/data/mockContractorData'`
- `ClosesBreakdown.tsx` (line 2): `import { mockPipeline } from '@/data/mockContractorData'`

---

## Implementation Plan

### Phase 1: Extend the Contractor Opportunities Hook

Add functions to derive pipeline and service metrics from the `demo_opportunities` data:

**New exports in `useContractorOpportunities.ts`:**

```text
getPipelineMetrics(opportunities):
  - NEW: opportunities where status = 'pending'
  - CONTACTED: opportunities where status = 'contacted' or 'viewed'
  - SCHEDULED: opportunities where status = 'converted' (approximation)
  - COMPLETED: count from opportunity_type that indicate completed work

getClosesMetrics(opportunities):
  - Maintenance: count where opportunity_type in ['flush_due', 'anode_due', 'descale_due', 'annual_checkup']
  - Code Fixes: derive from forensicInputs (missing PRV, exp tank, softener)
  - Replacements: count where opportunity_type in ['replacement_urgent', 'replacement_recommended']
  - Calculate thisMonth vs lastMonth trend
```

### Phase 2: Update PipelineOverview Component

**File: `src/components/contractor/PipelineOverview.tsx`**

Changes:
1. Remove `import { mockPipeline }` from mock data
2. Accept `opportunities` as a prop from `Contractor.tsx`
3. Derive pipeline stages from opportunity status counts
4. Calculate conversion rate from real data

**Props change:**
```text
Before: { compact?: boolean }
After:  { compact?: boolean; opportunities: MockOpportunity[] }
```

### Phase 3: Update ClosesBreakdown Component

**File: `src/components/contractor/ClosesBreakdown.tsx`**

Changes:
1. Remove `import { mockPipeline }` from mock data
2. Accept `opportunities` as a prop from `Contractor.tsx`
3. Derive service close counts from opportunity types and forensicInputs
4. Calculate maintenance/codeFixes/replacements breakdown

**Props change:**
```text
Before: { compact?: boolean }
After:  { compact?: boolean; opportunities: MockOpportunity[] }
```

### Phase 4: Update Contractor Page

**File: `src/pages/Contractor.tsx`**

Changes:
1. Pass the fetched `opportunities` array to `PipelineOverview`
2. Pass the fetched `opportunities` array to `ClosesBreakdown`

---

## Data Derivation Logic

### Pipeline Stages (from opportunity status)
| Stage | Filter Criteria |
|-------|-----------------|
| New | `status === 'pending'` |
| Contacted | `status === 'viewed' \|\| status === 'contacted'` |
| Scheduled | (reserved for future status) |
| Completed | `status === 'converted' \|\| status === 'dismissed'` |

### Closes Categories (from opportunity_type + forensicInputs)
| Category | Criteria |
|----------|----------|
| Maintenance - Flush | `opportunity_type === 'flush_due'` |
| Maintenance - Anode | `opportunity_type === 'anode_due'` |
| Maintenance - Descale | `opportunity_type === 'descale_due'` |
| Maintenance - Inspection | `opportunity_type === 'annual_checkup'` |
| Code Fixes - Exp Tank | `!forensicInputs.hasExpTank && forensicInputs.isClosedLoop` |
| Code Fixes - PRV | `!forensicInputs.hasPrv && forensicInputs.housePsi > 80` |
| Code Fixes - Softener | `!forensicInputs.hasSoftener && forensicInputs.hardnessGPG > 15` |
| Replacements | `opportunity_type in ['replacement_urgent', 'replacement_recommended']` |

### Conversion Rate
```text
conversionRate = (contacted + scheduled + completed) / total * 100
```

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useContractorOpportunities.ts` | **MODIFY** | Add helper functions for pipeline/closes metrics |
| `src/components/contractor/PipelineOverview.tsx` | **MODIFY** | Remove mock import, derive data from props |
| `src/components/contractor/ClosesBreakdown.tsx` | **MODIFY** | Remove mock import, derive data from props |
| `src/pages/Contractor.tsx` | **MODIFY** | Pass opportunities to PipelineOverview and ClosesBreakdown |

---

## Technical Notes

**Why derive from demo_opportunities:**
- The `service_events` and `leads` tables are empty (0 records)
- The `demo_opportunities` table contains 12 seeded records with rich data
- For demo purposes, we can infer pipeline status from the opportunity `status` field
- Service type breakdowns can be derived from `opportunity_type` and `forensicInputs`

**Fallback for empty data:**
If no opportunities exist, display zeros gracefully rather than breaking the UI.

---

## Verification Steps

After implementation:
1. Navigate to `/contractor`
2. Verify Pipeline shows real counts derived from opportunity statuses:
   - NEW count matches `status === 'pending'` opportunities
   - CONT count matches `status === 'viewed' || 'contacted'` opportunities
3. Verify Completed shows real service type breakdown:
   - Maintenance count based on maintenance-type opportunities
   - Code Fixes count based on infrastructure issues in forensicInputs
   - Replacements count based on replacement-type opportunities
4. Verify no hardcoded numbers from mockPipeline are displayed
5. Confirm trend calculation uses real data comparisons
