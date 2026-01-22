

## Goal
Wire the contractor views to fetch real data from the `demo_opportunities` database table instead of using hardcoded mock data.

---

## Current Problem

**What we have (database):**
- `demo_opportunities` table with 12 detailed records containing:
  - Customer info (name, phone, email)
  - Property address (full with city, state, zip)
  - Asset specs (brand, model, serial, age, capacity, fuel type, vent type)
  - **Forensic inputs (JSONB)** with housePsi, hardnessGPG, isLeaking, hasSoftener, etc.
  - **Opterra metrics:** health_score, bio_age, fail_probability, shield_life, risk_level
  - **Verdict:** verdict_action (REPLACE/MONITOR/MAINTAIN), verdict_title
  - Inspection notes and photo URLs

**What's broken (frontend):**
- `OpportunityFeed.tsx` imports `mockOpportunities` from static file (line 14)
- `useState` initializes with mock data (line 26)
- All contractor views (`LeadCard`, `PropertyReportDrawer`, `SalesCoachDrawer`) receive mock objects
- **No database fetch hook exists** - `useContractorOpportunities.ts` was never created
- **No data mapper exists** - `opportunityMapper.ts` was never created

---

## Implementation Plan

### Phase 1: Create Data Mapper (`src/lib/opportunityMapper.ts`)

Create a transformation layer that converts database rows to the `MockOpportunity` type:

```text
Functions needed:
- mapDemoRowToMockOpportunity(row: DemoOpportunityRow): MockOpportunity
  - Maps flat DB columns → nested TankAsset object
  - Parses forensic_inputs JSONB → ForensicInputs type
  - Constructs opterraResult from denormalized metrics
  - Handles date parsing (created_at → Date)
  - Combines address fields into propertyAddress string

- Priority is lowercase in UI but the DB stores uppercase (CRITICAL → critical)
```

**Mapping table:**

| Database Column | MockOpportunity Field |
|-----------------|----------------------|
| `customer_name` | `customerName` |
| `customer_phone` | `customerPhone` |
| `property_address, property_city, property_state, property_zip` | `propertyAddress` (combined string) |
| `asset_brand` | `asset.brand` |
| `asset_model` | `asset.model` |
| `asset_serial` | `asset.serialNumber` |
| `asset_age_years` | `asset.calendarAge` |
| `asset_capacity` | `asset.capacity` |
| `asset_fuel_type` | `asset.fuelType` |
| `asset_vent_type` | `asset.ventType` |
| `asset_warranty_years` | `asset.warrantyYears` |
| `asset_location` | `asset.location` |
| `forensic_inputs` (JSONB) | `forensicInputs` (typed) |
| `health_score` | `healthScore` |
| `bio_age` | `opterraResult.bioAge` |
| `fail_probability` | `failProbability` + `opterraResult.failProb` |
| `shield_life` | `opterraResult.shieldLife` |
| `risk_level` | `opterraResult.riskLevel` |
| `verdict_action` | `opterraResult.verdictAction` |
| `verdict_title` | `opterraResult.verdictTitle` |
| `anode_remaining` | `opterraResult.anodeRemaining` |
| `inspection_notes` | `inspectionNotes` |
| `photo_urls` (JSONB) | `photoUrls` (string[]) |
| `context_description` | `context` |
| `job_complexity` | `jobComplexity` |
| `priority` | `priority` (lowercase) |
| `status` | `status` |
| `created_at` | `createdAt` (Date) |

### Phase 2: Create Database Fetch Hook (`src/hooks/useContractorOpportunities.ts`)

Create a React Query hook to fetch opportunities from the database:

```text
Exports:
- useContractorOpportunities(): { data: MockOpportunity[], isLoading, error }
- useOpportunityById(id: string): { data: MockOpportunity | null, isLoading }

Query details:
- Fetch from demo_opportunities table
- Order by priority (critical first), then by created_at
- Transform each row using mapDemoRowToMockOpportunity()
- Cache with React Query for performance
```

### Phase 3: Update OpportunityFeed Component

**File: `src/components/contractor/OpportunityFeed.tsx`**

Changes:
1. Remove import of `mockOpportunities` from static file
2. Import and use `useContractorOpportunities` hook
3. Replace `useState` initialization with hook data
4. Add loading state UI (skeleton cards)
5. Add error handling UI
6. Keep local state management for status changes (view/dismiss/remind)

```text
Before:
  import { mockOpportunities } from '@/data/mockContractorData';
  const [opportunities, setOpportunities] = useState<MockOpportunity[]>(mockOpportunities);

After:
  import { useContractorOpportunities } from '@/hooks/useContractorOpportunities';
  const { data: dbOpportunities, isLoading } = useContractorOpportunities();
  const [localStatusChanges, setLocalStatusChanges] = useState<Record<string, string>>({});
  // Merge DB data with local status overrides
```

### Phase 4: Update Contractor Page Priority Counts

**File: `src/pages/Contractor.tsx`**

Changes:
1. Import `useContractorOpportunities` hook
2. Replace mock data usage in priority count calculation
3. Derive counts from real database data

### Phase 5: Verify Data Flow Through Components

All child components already accept `MockOpportunity` as props - no changes needed:
- `LeadCard` - receives opportunity, displays healthScore, asset, forensicInputs ✓
- `PropertyReportDrawer` - receives opportunity, displays full report with forensics ✓
- `SalesCoachDrawer` - receives opportunity, sends to edge function ✓

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/opportunityMapper.ts` | **CREATE** | Transform DB rows to MockOpportunity type |
| `src/hooks/useContractorOpportunities.ts` | **CREATE** | React Query hook to fetch from demo_opportunities |
| `src/components/contractor/OpportunityFeed.tsx` | **MODIFY** | Use hook instead of mock import |
| `src/pages/Contractor.tsx` | **MODIFY** | Use hook for priority counts |

---

## Technical Notes

**JSONB field mapping:**
The `forensic_inputs` column stores keys in camelCase (matching the TypeScript interface), so minimal transformation is needed:
```json
{
  "calendarAge": 12,
  "housePsi": 95,
  "hardnessGPG": 18,
  "isLeaking": true,
  "hasSoftener": false
  // etc.
}
```

**Type safety:**
- Use `Tables<'demo_opportunities'>` from Supabase types for the DB row
- Cast/transform to `MockOpportunity` for UI consistency
- The mapper ensures all required fields have defaults

**Local state for optimistic updates:**
Status changes (viewed/contacted/dismissed) will be tracked locally since `demo_opportunities` is read-only for demos. In production, this would update the real `opportunity_notifications` table.

---

## Verification Steps

After implementation:
1. Navigate to `/contractor`
2. Verify 12 opportunities load from database (not mock)
3. Check that health scores, addresses, and asset details match DB values
4. Click "Details" on any opportunity → PropertyReportDrawer shows:
   - Correct customer name and address from DB
   - Real forensic data (PSI, hardness, leak status)
   - Real opterra metrics (bio age, shield life, risk level)
   - Inspection notes from technician
5. Click "Sales Coach" → AI briefing references real data
6. Filter by priority → Filter works with DB data
7. Call/Dismiss actions work with local state

