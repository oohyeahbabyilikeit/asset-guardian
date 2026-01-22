

# Fix Asset Detail Drawer for Sales AE Use Case

## Problem

1. **Wrong Action**: "Start Inspection" doesn't fit the contractor role - they're sales AEs doing outreach, not field technicians
2. **Missing Report Access**: Contractors need to view the same forensic report that homeowners see, so they can reference it during outreach calls
3. **Color Changes**: Unintended color scheme changes were made to the drawer

## Solution

Replace the "Start Inspection" action with "View Report" that opens the ForensicReport component with the asset's data. This lets the sales AE reference the health analysis, risk metrics, and recommendation during their outreach call.

---

## Changes

### 1. Update `AssetDetailDrawer.tsx`

**Remove:**
- `Wrench` icon import
- `onStartInspection` prop
- "Start Inspection" button

**Add:**
- `FileText` icon for "View Report"
- `onViewReport` callback prop
- "View Report" button that triggers navigation to the ForensicReport

```typescript
// Props change
interface AssetDetailDrawerProps {
  opportunity: MockOpportunity | null;
  open: boolean;
  onClose: () => void;
  onCall?: () => void;
  onViewReport?: () => void;  // NEW: replaces onStartInspection
}

// Button change
<Button 
  className="flex-1 gap-2"
  onClick={() => onViewReport?.()}
>
  <FileText className="w-4 h-4" />
  View Report
</Button>
```

### 2. Update `OpportunityFeed.tsx`

Wire up the "View Report" action to navigate to ForensicReport with the opportunity's forensic data:

```typescript
const handleViewReport = (opportunity: MockOpportunity) => {
  // Navigate to the main app with the opportunity's forensic data
  // This will show the full ForensicReport for the asset
  const params = new URLSearchParams({
    mode: 'contractor-report',
    opportunityId: opportunity.id
  });
  window.location.href = `/?${params.toString()}`;
};

// In AssetDetailDrawer usage:
<AssetDetailDrawer
  opportunity={selectedOpportunity}
  open={!!selectedOpportunity}
  onClose={() => setSelectedOpportunity(null)}
  onCall={() => handleCall(selectedOpportunity!)}
  onViewReport={() => handleViewReport(selectedOpportunity!)}
/>
```

### 3. Handle Contractor Report Mode in `Index.tsx`

Add a new flow that accepts `mode=contractor-report` + `opportunityId` from URL params, looks up the opportunity from mock data, and renders the ForensicReport with that data:

```typescript
// In Index.tsx useEffect or initialization
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');
const opportunityId = urlParams.get('opportunityId');

if (mode === 'contractor-report' && opportunityId) {
  // Load opportunity from mockContractorData
  // Set up state to show ForensicReport with that data
}
```

---

## File Summary

| File | Change |
|------|--------|
| `src/components/contractor/AssetDetailDrawer.tsx` | Replace "Start Inspection" with "View Report", update props |
| `src/components/contractor/OpportunityFeed.tsx` | Add `handleViewReport` that navigates with opportunity data |
| `src/pages/Index.tsx` | Handle `contractor-report` mode to show ForensicReport for opportunity |

---

## Technical Detail

The ForensicReport requires:
- `asset: AssetData` - unit profile (brand, model, age, location, etc.)
- `inputs: ForensicInputs` - full forensic data for algorithm calculation
- `onBack: () => void` - navigation callback

The `MockOpportunity` already contains:
- `opportunity.asset` - maps to AssetData (needs minor field mapping)
- `opportunity.forensicInputs` - full ForensicInputs for the algorithm

The drawer's "View Report" button will pass this data to the Index page which renders ForensicReport with the opportunity's complete inspection data.

