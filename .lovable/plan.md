

# Clean Up Unit Profile Card

## Goal
Simplify the UnitProfileCard by removing uncaptured/irrelevant data and improving readability.

## Data to REMOVE

### 1. Dimensions (Line 165-169)
- **Reason:** Not captured by technician. It's just a fake calculation based on capacity.
- **Action:** Delete the entire Dimensions cell from the specs grid.

### 2. Piping (Line 174-177)
- **Reason:** Hardcoded as `"3/4"` always. Tech doesn't capture this.
- **Action:** Delete the entire Piping cell from the specs grid.

## Data to RELOCATE

### 3. Household Size & Usage Pattern (Line 190-206)
- **Reason:** These are homeowner inputs, not equipment specs. They don't belong on a "unit profile" card which should describe the physical asset.
- **Action:** Remove from this card entirely. This data is already used in the algorithm and displayed in context elsewhere (like ServiceHistory or HealthGauge where usage impact is shown).

## Layout Improvements

### 4. Simplify the Specs Grid
**Before:** 6 cells in a 3-column grid (cramped, overlapping on mobile)
```
Capacity | Fuel Type | Dimensions
Vent Type | Piping | Warranty
```

**After:** 4 cells in a 2-column grid (cleaner, more readable)
```
Capacity   | Fuel Type
Vent Type  | Warranty
```

### 5. Keep Equipment Section
The equipment checklist (PRV, Expansion Tank, Softener, Recirc Pump) stays because:
- All items ARE captured by technician
- They're relevant to the unit's installation context
- But switch from 2-column to a cleaner single-column list for readability

## Files to Modify

1. **`src/components/UnitProfileCard.tsx`**
   - Remove Dimensions cell (lines 165-169)
   - Remove Piping cell (lines 174-177)
   - Remove Household Usage section entirely (lines 190-206)
   - Change specs grid from `grid-cols-3` to `grid-cols-2`
   - Optionally: Change equipment grid from `grid-cols-2` to single column for better mobile readability

## Before/After Comparison

### BEFORE (Cluttered)
```
Serial Number    | Model Number
Capacity | Fuel Type | Dimensions
Vent Type | Piping | Warranty
[ Household Size | Usage Pattern ]  <- Doesn't belong
[ PRV | Expansion Tank ]
[ Softener | Recirc Pump ]
```

### AFTER (Clean)
```
Serial Number    | Model Number
Capacity    | Fuel Type
Vent Type   | Warranty
Equipment:
  - PRV
  - Expansion Tank  
  - Water Softener
  - Recirculation Pump
```

## Technical Note
The `AssetData` type in `mockAsset.ts` will still have `specs.piping` but we simply won't display it. No type changes needed - the card just renders less fields.

