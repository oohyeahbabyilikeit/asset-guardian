# ✅ COMPLETED: Show Actual Tank Evidence Photos in Risk Analysis

## Implementation Summary

Successfully integrated actual inspection photos into breach/rust evidence displays across the UI.

### Changes Made

| File | Changes |
|------|---------|
| `src/lib/opterraTypes.ts` | Added `photoUrls?: { condition?: string; dataplate?: string; pressure?: string }` to ForensicInputs |
| `src/lib/opterraAlgorithm.ts` | Added same `photoUrls` field to ForensicInputs interface |
| `src/components/BreachAlert.tsx` | Added `conditionPhotoUrl` prop; displays actual photo when available, fallback to stock image |
| `src/components/UnifiedStatusCard.tsx` | Displays actual condition photo in breach section with "Photo from your inspection" label |
| `src/components/ForensicReport.tsx` | EvidenceItem shows actual photos for VISUAL_RUST and LEAK_DETECTED findings |
| Storage RLS | Added policies for authenticated upload/view of inspection-photos bucket |

### How It Works

1. **Technician captures photo** → stored in component state with blob URL
2. **On sync** → `useOfflineSync.uploadPhotos()` uploads to `inspection-photos` bucket
3. **URL persisted** → stored in `water_heaters.photo_urls` JSONB column
4. **UI displays** → `photoUrls.condition` flows through ForensicInputs to:
   - `UnifiedStatusCard` breach thumbnail
   - `BreachAlert` evidence section
   - `ForensicReport` Evidence Locker items

### Result

When a technician photographs a rusty or leaking tank, the homeowner sees **their actual tank** as visual evidence instead of a generic stock image.
