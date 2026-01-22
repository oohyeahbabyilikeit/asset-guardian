
# Show Actual Tank Evidence Photos in Risk Analysis

## Problem Statement

The UI claims "Visual evidence of tank failure" when rust or leaks are detected, but displays a generic stock image (`containment-breach.png`) instead of the actual inspection photos captured by the technician. This undermines credibility and misses an opportunity to show the homeowner compelling visual proof.

## Current Architecture

| Component | Current Behavior |
|-----------|-----------------|
| `water_heaters.photo_urls` | JSONB column exists for photo URLs |
| `inspection-photos` bucket | Private storage bucket configured |
| `LocationStep.tsx` | Captures condition photo, but only stores locally in state |
| `BreachAlert.tsx` | Shows static `containment-breach.png` |
| `ForensicReport.tsx` | Evidence items show placeholder Camera icon |

## Solution: End-to-End Photo Integration

### Phase 1: Capture & Upload Photos

**File: `src/components/steps/technician/LocationStep.tsx`**

When technician captures the condition photo:
1. Upload the blob to `inspection-photos` bucket with path format: `{inspectionId}/condition-{timestamp}.jpg`
2. Store the resulting URL in component state for later sync

```text
┌─────────────────┐     ┌────────────────────┐     ┌───────────────────┐
│  Camera Input   │────▶│  Resize & Upload   │────▶│  Storage Bucket   │
│  (Condition)    │     │  to inspection-    │     │  inspection-photos│
└─────────────────┘     │  photos bucket     │     └───────────────────┘
                        └────────────────────┘              │
                                                            ▼
                                                   Returns signed URL
```

### Phase 2: Persist Photo URLs

**File: `src/hooks/useOfflineSync.ts` or sync flow**

When the inspection is synced:
1. Include the condition photo URL in `photo_urls` array
2. Tag photos by type: `{ type: 'condition', url: '...' }`

**Edge Function: `sync-inspection/index.ts`**

Already accepts `photo_urls` array - no changes needed.

### Phase 3: Surface Photos in UI

**File: `src/lib/opterraAlgorithm.ts` or `ForensicInputs` interface**

Add optional `photoUrls?: { condition?: string; dataplate?: string; pressure?: string }` to ForensicInputs so the UI can access them.

**File: `src/components/BreachAlert.tsx`**

Replace the static image with the actual condition photo:

```typescript
// Before
<img src={containmentBreachImg} alt="Evidence of tank breach" />

// After  
<img 
  src={inputs.photoUrls?.condition || containmentBreachImg} 
  alt="Documented evidence of tank failure" 
/>
```

**File: `src/components/ForensicReport.tsx`**

In the `EvidenceItem` component, display the actual photo when available instead of just the Camera icon placeholder:

```typescript
{finding.photoUrl ? (
  <img 
    src={finding.photoUrl} 
    alt={finding.name}
    className="w-full rounded-xl object-cover aspect-video"
  />
) : (
  // Existing placeholder
)}
```

**File: `src/components/UnifiedStatusCard.tsx`**

When showing the breach badge section (lines 125-145), display a thumbnail of the evidence photo:

```typescript
{(isLeaking || visualRust) && inputs.photoUrls?.condition && (
  <div className="mt-3 rounded-lg overflow-hidden border border-destructive/30">
    <img 
      src={inputs.photoUrls.condition}
      alt="Documented breach evidence"
      className="w-full h-24 object-cover"
    />
    <div className="px-2 py-1 bg-destructive/10 text-xs text-destructive">
      Photo evidence captured during inspection
    </div>
  </div>
)}
```

### Phase 4: RLS Policy for Photo Access

Ensure the storage bucket allows authenticated users to view photos for properties they have a relationship with.

```sql
-- Policy: Technicians can upload to their inspections
CREATE POLICY "Technicians can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  auth.uid() IS NOT NULL
);

-- Policy: Anyone with relationship can view
CREATE POLICY "Property stakeholders can view photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos' AND
  -- Path format: {inspection_id}/filename.jpg
  -- Link to water_heater assessment ownership
  auth.uid() IS NOT NULL
);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/opterraTypes.ts` | Add `photoUrls` to ForensicInputs interface |
| `src/components/steps/technician/LocationStep.tsx` | Upload photo to storage bucket on capture |
| `src/components/BreachAlert.tsx` | Display actual photo instead of stock image |
| `src/components/UnifiedStatusCard.tsx` | Show evidence thumbnail when breach detected |
| `src/components/ForensicReport.tsx` | Display actual finding photos in Evidence Locker |
| Storage RLS | Add policies for upload/view access |

## Expected Result

When a technician photographs a rusty or leaking tank:
1. The photo is uploaded to cloud storage during inspection
2. The URL is persisted with the water heater record
3. When homeowner views "Our Recommendation: Replace Your Water Heater"
4. **The actual photo of THEIR tank appears** as visual evidence
5. Clicking "View Risk Analysis" shows the photo prominently in the Forensic Report

This creates a compelling, personalized experience that demonstrates exactly why replacement is recommended.
