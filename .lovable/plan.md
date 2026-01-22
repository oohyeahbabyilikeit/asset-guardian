
# Load Real Tank Water Heater Assets into Contractor Dashboard

## Summary

Create a fully functional asset management system for the contractor dashboard with:
1. Rich mock tank water heater data (only tanks for now - no hybrids/tankless)
2. Complete `ForensicInputs` + `AssetData` for each record
3. A slide-out detail drawer when clicking "Details" on any lead
4. Full unit profile display with equipment, specs, health score, and service context

---

## Current State

- `mockContractorData.ts` has 13 opportunities but they're lightweight (no full `ForensicInputs`)
- Clicking "Details" only shows a toast notification
- Tank data in `mockAsset.ts` has 10 detailed tank scenarios with complete forensic inputs
- No drawer/sheet component wired to display asset details

---

## Implementation Plan

### 1. Update Mock Data Structure (`mockContractorData.ts`)

Replace the current `MockOpportunity` with enriched tank-only data that includes full forensic inputs and asset details.

**New Interface:**
```typescript
export interface TankAsset {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  calendarAge: number;
  location: string;
  capacity: number;
  fuelType: 'GAS' | 'ELECTRIC';
  ventType: string;
}

export interface MockOpportunity {
  id: string;
  propertyAddress: string;
  customerName?: string;
  customerPhone?: string;
  opportunityType: OpportunityType;
  priority: Priority;
  healthScore: number;
  failProbability: number;
  jobComplexity: JobComplexity;
  context: string;
  createdAt: Date;
  status: 'pending' | 'viewed' | 'contacted' | 'converted' | 'dismissed';
  
  // NEW: Full asset data
  asset: TankAsset;
  forensicInputs: ForensicInputs;
}
```

**Tank-Only Data (12 realistic scenarios):**
- Remove hybrids/tankless from opportunities
- Keep only `GAS` and `ELECTRIC` fuel types
- Include complete `ForensicInputs` for each unit
- Realistic Arizona addresses, customer names, and contexts

### 2. Create Asset Detail Drawer (`AssetDetailDrawer.tsx`)

New component using the `Sheet` primitive to display full asset information when clicking "Details":

**Content sections:**
1. **Header**: Customer name, address, priority badge
2. **Unit Profile**: Brand, model, serial, age, location, capacity
3. **Health Summary**: Health score ring, fail probability, risk level
4. **Equipment Checklist**: PRV, Expansion Tank, Softener, Circ Pump (with present/absent indicators)
5. **Key Metrics**: House PSI, water hardness, temp setting
6. **Issue Context**: Why this opportunity was flagged (context from algorithm)
7. **Action Buttons**: Call customer, Start inspection

### 3. Wire Up Detail View (`OpportunityFeed.tsx`)

Update `handleViewDetails` to open the drawer instead of showing a toast:
```typescript
const [selectedOpportunity, setSelectedOpportunity] = useState<MockOpportunity | null>(null);

const handleViewDetails = (opportunity: MockOpportunity) => {
  setSelectedOpportunity(opportunity);
  // Mark as viewed
  setOpportunities(prev => 
    prev.map(o => o.id === opportunity.id && o.status === 'pending' 
      ? { ...o, status: 'viewed' as const } : o)
  );
};

// In render:
<AssetDetailDrawer 
  opportunity={selectedOpportunity}
  open={!!selectedOpportunity}
  onClose={() => setSelectedOpportunity(null)}
/>
```

### 4. Update LeadCard Display

Derive `unitSummary` from actual asset data:
```typescript
// In LeadCard or OpportunityFeed
const unitSummary = `${asset.calendarAge}yr ${asset.brand} ${asset.fuelType === 'GAS' ? 'Gas' : 'Electric'} Tank in ${asset.location}`;
```

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/data/mockContractorData.ts` | **Rewrite** | Add `TankAsset` interface, embed full `ForensicInputs` in each opportunity, tank-only data (12 records) |
| `src/components/contractor/AssetDetailDrawer.tsx` | **Create** | Slide-out sheet with full unit profile, health metrics, equipment list, and action buttons |
| `src/components/contractor/OpportunityFeed.tsx` | **Modify** | Add state for selected opportunity, wire up drawer on "Details" click |
| `src/components/contractor/LeadCard.tsx` | **Modify** | Accept full opportunity with asset, derive summary from actual data |

---

## Mock Data: 12 Tank Water Heaters

All TANK units only (GAS or ELECTRIC):

| Customer | Address | Brand | Age | Fuel | Health | Priority | Context |
|----------|---------|-------|-----|------|--------|----------|---------|
| Johnson Family | 1847 Sunset Dr, Phoenix | Rheem | 12yr | GAS | 24 | Critical | Active leak detected |
| Williams Residence | 2301 E Camelback Rd | Bradford White | 15yr | ELECTRIC | 18 | Critical | Severe corrosion + T&P weeping |
| Martinez Residence | 456 Oak Ave, Scottsdale | A.O. Smith | 5yr | GAS | 62 | High | Warranty expires in 6 months |
| Chen Family | 789 Mesquite Ln, Tempe | State Select | 10yr | GAS | 45 | High | Anode depleted, high sediment |
| Rodriguez Family | 3344 Saguaro Blvd, Mesa | Rheem | 6yr | GAS | 71 | Medium | Anode replacement due |
| Patel Residence | 5566 Ironwood Dr, Chandler | A.O. Smith | 4yr | GAS | 78 | Medium | Annual flush due (18 GPG) |
| Anderson Home | 9900 Cactus Wren Ln, Peoria | Bradford White | 7yr | ELECTRIC | 68 | Medium | Flush overdue 18 months |
| Davis Residence | 2233 Quail Run, Scottsdale | State Select | 5yr | GAS | 74 | Medium | Anode inspection needed |
| Miller Family | 4455 Dove Valley Rd, Cave Creek | Rheem | 2yr | GAS | 92 | Low | Annual checkup |
| Taylor Home | 6677 Desert Sage Way, Fountain Hills | A.O. Smith | 3yr | ELECTRIC | 88 | Low | Annual inspection |
| Garcia Residence | 8899 Thunderbird Rd, Surprise | Whirlpool | 4yr | ELECTRIC | 85 | Low | Routine check |
| Thompson Home | 1122 Palm Desert Way, Gilbert | Bradford White | 8yr | GAS | 52 | High | Pressure issue, no PRV |

---

## Asset Detail Drawer Layout

```text
┌─────────────────────────────────────────────────────────────┐
│  ← Asset Details                                      [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Johnson Family                           ⚠️ CRITICAL       │
│  1847 Sunset Dr, Phoenix AZ                                  │
│  (602) 555-0142                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  UNIT PROFILE                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Rheem Performance Plus                                  ││
│  │ 50-Gal Gas Tank · 12 years old · Attic                  ││
│  │                                                         ││
│  │ Serial: RH-2012-5567-P    Model: PROG50-36N-RH67       ││
│  │ Warranty: EXPIRED (6yr)   Vent: Atmospheric             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  HEALTH STATUS                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │    [████░░░░░░]                                         ││
│  │         24/100                                          ││
│  │    78% failure probability                              ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  INSTALLED EQUIPMENT                                         │
│  ✓ PRV (Pressure Reducing Valve)                            │
│  ✗ Expansion Tank (Required - closed loop)                  │
│  ✗ Water Softener                                           │
│  ✗ Recirculation Pump                                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  KEY READINGS                                                │
│  House PSI: 95 (HIGH)       Hardness: 18 GPG                │
│  Temp Setting: Normal       Closed Loop: Yes                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  WHY FLAGGED                                                 │
│  Active leak detected during routine inspection.             │
│  Tank is 12 years old with no anode service history.        │
│  High pressure (95 PSI) without PRV increases stress.       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [📞 Call Customer]    [🔧 Start Inspection]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

- Remove tankless/hybrid entries from mock data (IDs 5, 6, 8, 12, 13 reference non-tank units)
- Each `ForensicInputs` object will have complete data for the Opterra algorithm
- The drawer pulls directly from `opportunity.forensicInputs` and `opportunity.asset`
- "Start Inspection" button navigates to `/?mode=technician` with pre-filled asset context
- Equipment checklist is derived from `forensicInputs.hasPrv`, `.hasExpTank`, `.hasSoftener`, `.hasCircPump`
