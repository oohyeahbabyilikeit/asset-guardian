
## Goal
Ensure Sales Coach uses **real data from the database** by:
1. Seeding demo data into the database (profiles, properties, water heaters, assessments, and opportunity notifications)
2. Wiring up the `OpportunityFeed` to fetch from the database instead of mock data
3. Ensuring the Sales Coach edge function receives complete, real data

---

## Current State (the problem)

**Data flow today:**
1. `OpportunityFeed` imports `mockOpportunities` from `src/data/mockContractorData.ts` (hardcoded fake data)
2. User clicks "Sales Coach" → `SalesCoachDrawer` receives the mock object
3. `SalesCoachDrawer` sends the mock object to the `sales-coach` edge function
4. Edge function builds a prompt from whatever it receives (trusts client blindly)

**Database state:**
- 0 rows in `opportunity_notifications`
- 0 rows in `assessments`
- 0 rows in `water_heaters`
- 0 rows in `properties`
- 0 rows in `profiles`

**The mock data contains 12 detailed opportunities** with full forensic inputs, asset details, and opterra results. We'll seed equivalent data into the database.

---

## Implementation Plan

### Phase 1: Create seed data migration

Create a database migration that inserts demo data matching the current mock records:

**Insert sequence (respecting foreign keys):**
1. `profiles` → Create a contractor profile and homeowner profiles
2. `user_roles` → Assign contractor role
3. `properties` → Create properties for each opportunity address
4. `water_heaters` → Create water heater records with all forensic inputs
5. `assessments` → Create assessment records with opterra results
6. `opportunity_notifications` → Create opportunity records linked to contractor

**Data mapping from mock to database:**
- `MockOpportunity.customerName` → `profiles.full_name`
- `MockOpportunity.customerPhone` → `profiles.phone`
- `MockOpportunity.propertyAddress` → `properties.address_line1, city, state, zip_code`
- `MockOpportunity.asset.*` → `water_heaters.*`
- `MockOpportunity.forensicInputs.*` → `water_heaters.*` columns
- `MockOpportunity.opterraResult.*` → `assessments.opterra_result` (JSONB) + denormalized fields
- `MockOpportunity.inspectionNotes` → `assessments.inspection_notes`
- Opportunity metadata → `opportunity_notifications.*`

### Phase 2: Create opportunity fetching hook

Create `src/hooks/useContractorOpportunities.ts`:

```text
Hook responsibilities:
- Fetch from opportunity_notifications joined with water_heaters, properties, profiles, and assessments
- Transform database rows into the MockOpportunity shape (for minimal UI changes)
- Handle loading and error states
- Support priority filtering
```

**Query structure:**
```sql
SELECT 
  opp.*, 
  wh.* (forensic data becomes forensicInputs),
  p.address_line1, p.city, p.state, p.zip_code (becomes propertyAddress),
  pr.full_name, pr.phone, pr.email (becomes customerName, customerPhone, customerEmail),
  a.opterra_result, a.inspection_notes, a.photos (becomes opterraResult, inspectionNotes, photoUrls)
FROM opportunity_notifications opp
JOIN water_heaters wh ON opp.water_heater_id = wh.id
JOIN properties p ON wh.property_id = p.id
LEFT JOIN profiles pr ON p.owner_id = pr.id
LEFT JOIN assessments a ON a.water_heater_id = wh.id
WHERE opp.contractor_id = $currentUserId
  AND opp.status IN ('pending', 'viewed', 'contacted')
ORDER BY priority_order, created_at
```

### Phase 3: Update OpportunityFeed to use real data

**File: `src/components/contractor/OpportunityFeed.tsx`**

Changes:
1. Remove `import { mockOpportunities } from '@/data/mockContractorData'`
2. Add `import { useContractorOpportunities } from '@/hooks/useContractorOpportunities'`
3. Replace `const [opportunities, setOpportunities] = useState(mockOpportunities)` with hook call
4. Add loading skeleton while fetching
5. Add empty state when no opportunities exist

### Phase 4: Create data transformation layer

Create `src/lib/opportunityMapper.ts`:

```text
Functions:
- mapDbRowToOpportunity(row): MockOpportunity
- mapForensicInputsFromWaterHeater(wh): ForensicInputs
- mapOpterraResultFromAssessment(a): OpterraResultSummary
- formatPropertyAddress(p): string
```

This keeps the transformation logic centralized and testable.

### Phase 5: Verify Sales Coach data flow

The `SalesCoachDrawer` already sends the opportunity object to the edge function. Once we're using real data, the edge function will receive:
- Real customer name and address
- Real forensic inputs from inspection
- Real opterra diagnostic results
- Real technician notes

No changes needed to the edge function - it already accepts the right structure.

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| (migration) | CREATE | Seed demo data matching mock opportunities |
| `src/hooks/useContractorOpportunities.ts` | CREATE | Hook to fetch opportunities from database |
| `src/lib/opportunityMapper.ts` | CREATE | Transform database rows to UI types |
| `src/components/contractor/OpportunityFeed.tsx` | MODIFY | Use hook instead of mock data |

---

## Demo Data Summary (12 opportunities)

| Priority | Customer | Address | Unit | Health |
|----------|----------|---------|------|--------|
| CRITICAL | Johnson Family | 1847 Sunset Dr, Phoenix | Rheem 50g Gas | 24 |
| CRITICAL | Williams Residence | 2301 E Camelback Rd, Phoenix | Bradford White 50g Electric | 18 |
| HIGH | Martinez Residence | 456 Oak Ave, Scottsdale | A.O. Smith 50g Gas | 62 |
| HIGH | Chen Family | 789 Mesquite Ln, Tempe | State Select 50g Gas | 45 |
| HIGH | Thompson Home | 1122 Palm Desert Way, Gilbert | Bradford White 40g Gas | 52 |
| MEDIUM | Rodriguez Family | 3344 Saguaro Blvd, Mesa | Rheem 40g Gas | 71 |
| MEDIUM | Patel Residence | 5566 Ironwood Dr, Chandler | A.O. Smith 40g Gas | 78 |
| MEDIUM | Anderson Home | 9900 Cactus Wren Ln, Peoria | Bradford White 40g Electric | 68 |
| MEDIUM | Davis Residence | 2233 Quail Run, Scottsdale | State Select 40g Gas | 74 |
| LOW | Miller Family | 4455 Dove Valley Rd, Cave Creek | Rheem 50g Gas | 92 |
| LOW | Taylor Home | 6677 Desert Sage Way, Fountain Hills | A.O. Smith 50g Electric | 88 |
| LOW | Garcia Residence | 8899 Prickly Pear Trail, Sun City | Rheem 50g Gas | 85 |

---

## Contractor Access Pattern

Since database tables use RLS, we need:
1. A logged-in user with the `contractor` role
2. Active `contractor_property_relationships` linking the contractor to each property
3. OR - for demo purposes, we can use a service role / bypass RLS for the seed data

The seed migration will create a demo contractor profile and establish all necessary relationships.

---

## Technical Notes

**RLS considerations:**
- The seed migration will use the service role context to bypass RLS during seeding
- The frontend fetch will work because we'll establish contractor_property_relationships
- If no user is logged in, the hook returns empty (expected behavior)

**Type safety:**
- The `useContractorOpportunities` hook will return `MockOpportunity[]` to minimize UI changes
- Internal typing uses database row types from `@/integrations/supabase/types`

**Performance:**
- Single query with JOINs is more efficient than multiple queries
- Results cached via React Query

---

## Verification Steps

After implementation:
1. Log in as the demo contractor
2. Go to `/contractor`
3. Verify 12 opportunities appear (matching the mock data)
4. Click "Details" on any opportunity
5. Click "Sales Coach"
6. Verify the briefing references real data (customer name, address, PSI readings, health score, etc.)
7. Check that follow-up questions also reflect real data context
