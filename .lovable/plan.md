

# Add Missing Tank Algorithm Columns to water_heaters Table

## Goal
Add 9 missing `ForensicInputs` fields to the `water_heaters` table so every tank algorithm input can be persisted and retrieved for accurate historical assessments.

---

## Migration: Add 9 Missing Columns

```sql
-- Add missing tank algorithm columns to water_heaters table
-- These fields are actively used in opterraAlgorithm.ts but not currently persisted

-- 1. Household Usage Fields
ALTER TABLE water_heaters
ADD COLUMN people_count integer DEFAULT 3,
ADD COLUMN usage_type text DEFAULT 'normal';

-- Add constraint for valid usage_type values
ALTER TABLE water_heaters
ADD CONSTRAINT usage_type_valid 
CHECK (usage_type IS NULL OR usage_type IN ('light', 'normal', 'heavy'));

-- Add constraint for people_count range (1-12)
ALTER TABLE water_heaters
ADD CONSTRAINT people_count_range 
CHECK (people_count IS NULL OR (people_count >= 1 AND people_count <= 12));

-- 2. Service History Fields (critical for anode/sediment models)
ALTER TABLE water_heaters
ADD COLUMN last_anode_replace_years_ago numeric DEFAULT NULL,
ADD COLUMN last_flush_years_ago numeric DEFAULT NULL,
ADD COLUMN is_annually_maintained boolean DEFAULT false;

-- Add constraints for service history years (0-50 range)
ALTER TABLE water_heaters
ADD CONSTRAINT last_anode_replace_range 
CHECK (last_anode_replace_years_ago IS NULL OR (last_anode_replace_years_ago >= 0 AND last_anode_replace_years_ago <= 50));

ALTER TABLE water_heaters
ADD CONSTRAINT last_flush_range 
CHECK (last_flush_years_ago IS NULL OR (last_flush_years_ago >= 0 AND last_flush_years_ago <= 50));

-- 3. History Tracking Fields ("Lazarus Effect" prevention)
ALTER TABLE water_heaters
ADD COLUMN years_without_anode numeric DEFAULT NULL,
ADD COLUMN years_without_softener numeric DEFAULT NULL;

-- Add constraints for history tracking (0-50 range)
ALTER TABLE water_heaters
ADD CONSTRAINT years_without_anode_range 
CHECK (years_without_anode IS NULL OR (years_without_anode >= 0 AND years_without_anode <= 50));

ALTER TABLE water_heaters
ADD CONSTRAINT years_without_softener_range 
CHECK (years_without_softener IS NULL OR (years_without_softener >= 0 AND years_without_softener <= 50));

-- 4. Water Chemistry Fields
ALTER TABLE water_heaters
ADD COLUMN softener_salt_status text DEFAULT 'UNKNOWN',
ADD COLUMN sanitizer_type text DEFAULT 'UNKNOWN';

-- Add constraint for valid salt status values
ALTER TABLE water_heaters
ADD CONSTRAINT salt_status_valid 
CHECK (softener_salt_status IS NULL OR softener_salt_status IN ('OK', 'EMPTY', 'UNKNOWN'));

-- Add constraint for valid sanitizer type values
ALTER TABLE water_heaters
ADD CONSTRAINT sanitizer_type_valid 
CHECK (sanitizer_type IS NULL OR sanitizer_type IN ('CHLORINE', 'CHLORAMINE', 'UNKNOWN'));

-- 5. Update tank_water_heaters view to include new columns
CREATE OR REPLACE VIEW tank_water_heaters 
WITH (security_invoker = true) AS
SELECT *
FROM water_heaters
WHERE fuel_type IN ('GAS', 'ELECTRIC', 'HYBRID');
```

---

## Column Details

| Column | Type | Default | Constraint | Algorithm Usage |
|--------|------|---------|------------|-----------------|
| `people_count` | integer | 3 | 1-12 | Usage intensity multiplier (gallons/day) |
| `usage_type` | text | 'normal' | light/normal/heavy | Wear rate multiplier (0.8x/1.0x/1.3x) |
| `last_anode_replace_years_ago` | numeric | NULL | 0-50 | Anode shield life reset calculation |
| `last_flush_years_ago` | numeric | NULL | 0-50 | Sediment accumulation reset |
| `is_annually_maintained` | boolean | false | - | Steady-state sediment factor (0.4 lbs/year) |
| `years_without_anode` | numeric | NULL | 0-50 | Historical corrosion damage tracking |
| `years_without_softener` | numeric | NULL | 0-50 | Historical hard water damage |
| `softener_salt_status` | text | 'UNKNOWN' | OK/EMPTY/UNKNOWN | Effective hardness override |
| `sanitizer_type` | text | 'UNKNOWN' | CHLORINE/CHLORAMINE/UNKNOWN | Resin degradation factor |

---

## Files to Update After Migration

| File | Changes |
|------|---------|
| `src/lib/syncMappers.ts` | Add 9 new fields to `WaterHeaterInsert` interface and `mapInspectionToWaterHeater()` |
| `src/types/technicianMapper.ts` | Map new fields in `mapTechnicianToForensicInputs()` |
| `docs/database.md` | Document new columns in schema reference |

---

## Sync Mapper Updates

```typescript
// In WaterHeaterInsert interface, add:
people_count?: number;
usage_type?: string;
last_anode_replace_years_ago?: number;
last_flush_years_ago?: number;
is_annually_maintained?: boolean;
years_without_anode?: number;
years_without_softener?: number;
softener_salt_status?: string;
sanitizer_type?: string;

// In mapInspectionToWaterHeater(), add:
people_count: data.homeownerContext?.peopleCount || 3,
usage_type: data.homeownerContext?.usageType || 'normal',
last_anode_replace_years_ago: data.serviceHistory?.lastAnodeReplaceYearsAgo,
last_flush_years_ago: data.serviceHistory?.lastFlushYearsAgo,
is_annually_maintained: data.serviceHistory?.isAnnuallyMaintained || false,
years_without_anode: data.serviceHistory?.yearsWithoutAnode,
years_without_softener: data.serviceHistory?.yearsWithoutSoftener,
softener_salt_status: data.softener?.saltStatus || 'UNKNOWN',
sanitizer_type: data.sanitizerType || 'UNKNOWN',
```

---

## Current vs Future Data Flow

```text
BEFORE (missing fields):
TechnicianInspection → mapToForensicInputs() → Algorithm runs → Result
                                ↓
                         water_heaters table (24 fields)
                         [people_count, usage_type NOT saved]

AFTER (complete fields):
TechnicianInspection → mapToForensicInputs() → Algorithm runs → Result
                                ↓
                         water_heaters table (33 fields)
                         [ALL algorithm inputs persisted]
```

---

## Smart Proxy Behavior (Unchanged)

The algorithm's `applySmartProxies()` function will continue to work for records with NULL values:

| Field | NULL Behavior |
|-------|---------------|
| `people_count` | Defaults to 2.5 (average household) |
| `usage_type` | Defaults to 'normal' |
| `last_anode_replace_years_ago` | Assumes never replaced |
| `last_flush_years_ago` | Assumes never flushed |
| `is_annually_maintained` | Assumes false |
| `years_without_anode` | Calculated from calendar age |
| `years_without_softener` | Calculated from calendar age if softener present |
| `softener_salt_status` | Defaults to 'UNKNOWN' |
| `sanitizer_type` | Defaults to 'UNKNOWN' |

---

## Expected Outcome

After this migration:
- All 33 tank algorithm inputs will have corresponding database columns
- Historical assessments can be accurately recalculated
- No more data loss between inspection and persistence
- TypeScript types will auto-regenerate to include new columns

