
# Database Cleanup Plan: Tank Water Heaters v1.0

## Goal
Create a tight, validated, tank-focused database schema that matches the isolated Tank Algorithm (v9.2). This ensures data integrity and makes the system ship-ready.

---

## Phase 1: Add Missing Tank-Specific Fields

### Migration: Add Missing Columns

```sql
-- Tank-specific fields missing from schema
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS nipple_material TEXT;
-- Options: 'STEEL', 'STAINLESS_BRASS', 'FACTORY_PROTECTED'

-- Water quality fields needed for algorithm
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS measured_hardness_gpg NUMERIC;
-- Test strip result - most accurate hardness reading

ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS sanitizer_type TEXT DEFAULT 'UNKNOWN';
-- Options: 'CHLORINE', 'CHLORAMINE', 'UNKNOWN' - affects corrosion rate
```

---

## Phase 2: Create ENUM Types for Data Validation

Replace TEXT columns with proper ENUMs to prevent bad data:

```sql
-- Fuel Type (Tank focus: GAS, ELECTRIC)
CREATE TYPE fuel_type AS ENUM ('GAS', 'ELECTRIC', 'HYBRID', 'TANKLESS_GAS', 'TANKLESS_ELECTRIC');

-- Vent Type (Gas tanks only)
CREATE TYPE vent_type AS ENUM ('ATMOSPHERIC', 'POWER_VENT', 'DIRECT_VENT');

-- Location Type
CREATE TYPE location_type AS ENUM ('ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING', 'BASEMENT', 'GARAGE', 'EXTERIOR', 'CRAWLSPACE');

-- Temperature Setting
CREATE TYPE temp_setting AS ENUM ('LOW', 'NORMAL', 'HOT');

-- Connection Type (Galvanic detection)
CREATE TYPE connection_type AS ENUM ('DIELECTRIC', 'BRASS', 'DIRECT_COPPER');

-- Expansion Tank Status
CREATE TYPE exp_tank_status AS ENUM ('FUNCTIONAL', 'WATERLOGGED', 'MISSING');

-- Leak Source
CREATE TYPE leak_source AS ENUM ('NONE', 'TANK_BODY', 'FITTING_VALVE', 'DRAIN_PAN');

-- Quality Tier
CREATE TYPE quality_tier AS ENUM ('BUILDER', 'STANDARD', 'PROFESSIONAL', 'PREMIUM');
```

**Note**: Postgres doesn't allow direct TEXT -> ENUM conversion. This requires:
1. Create new ENUM type
2. Add new column with ENUM type
3. Migrate data with USING clause
4. Drop old TEXT column
5. Rename new column

---

## Phase 3: Add Validation Constraints

Add business logic validation to catch bad data at insert:

```sql
-- Warranty years must be reasonable (1-15 years)
ALTER TABLE water_heaters ADD CONSTRAINT warranty_years_range 
  CHECK (warranty_years IS NULL OR (warranty_years >= 1 AND warranty_years <= 15));

-- Calendar age can't be negative or unrealistic
ALTER TABLE water_heaters ADD CONSTRAINT calendar_age_range 
  CHECK (calendar_age_years IS NULL OR (calendar_age_years >= 0 AND calendar_age_years <= 50));

-- Anode count must be 1 or 2
ALTER TABLE water_heaters ADD CONSTRAINT anode_count_valid 
  CHECK (anode_count IS NULL OR anode_count IN (1, 2));

-- Tank capacity must be valid (20-120 gallons for residential)
ALTER TABLE water_heaters ADD CONSTRAINT tank_capacity_range 
  CHECK (tank_capacity_gallons >= 20 AND tank_capacity_gallons <= 120);

-- House PSI must be in reasonable range
ALTER TABLE water_heaters ADD CONSTRAINT house_psi_range 
  CHECK (house_psi IS NULL OR (house_psi >= 20 AND house_psi <= 150));

-- Hardness must be non-negative
ALTER TABLE water_heaters ADD CONSTRAINT hardness_non_negative 
  CHECK (street_hardness_gpg IS NULL OR street_hardness_gpg >= 0);
ALTER TABLE water_heaters ADD CONSTRAINT measured_hardness_non_negative 
  CHECK (measured_hardness_gpg IS NULL OR measured_hardness_gpg >= 0);
```

---

## Phase 4: Improve Defaults

Set sensible defaults so inserts don't fail:

```sql
-- Ensure critical fields have defaults
ALTER TABLE water_heaters ALTER COLUMN house_psi SET DEFAULT 60;
ALTER TABLE water_heaters ALTER COLUMN warranty_years SET DEFAULT 6;
ALTER TABLE water_heaters ALTER COLUMN anode_count SET DEFAULT 1;
ALTER TABLE water_heaters ALTER COLUMN visual_rust SET DEFAULT false;
ALTER TABLE water_heaters ALTER COLUMN is_leaking SET DEFAULT false;
```

---

## Phase 5: Populate Assessment Metrics

Update `assessments` table insert in edge function to populate denormalized metrics:

```typescript
// sync-inspection/index.ts - Update assessment insert
const { data: assessment, error: assessError } = await supabase
  .from("assessments")
  .insert({
    water_heater_id: waterHeater.id,
    assessor_id: user.id,
    source: "contractor_inspection",
    forensic_inputs: payload.assessment.forensic_inputs,
    photos: payload.assessment.photos || [],
    opterra_result: payload.assessment.opterra_result,
    // Populate denormalized fields from opterra_result
    health_score: payload.assessment.opterra_result?.metrics?.healthScore,
    bio_age: payload.assessment.opterra_result?.metrics?.bioAge,
    fail_probability: payload.assessment.opterra_result?.metrics?.failProb,
    risk_level: payload.assessment.opterra_result?.metrics?.riskLevel,
    recommendation_action: payload.assessment.opterra_result?.verdict?.action,
    recommendation_title: payload.assessment.opterra_result?.verdict?.title,
    inspection_notes: payload.assessment.inspection_notes,
    status: "completed",
  })
```

---

## Phase 6: Update Type Mappers

### syncMappers.ts Updates

Add the new fields to the mapper:

```typescript
// Add to WaterHeaterInsert interface
nipple_material?: string;
measured_hardness_gpg?: number;
sanitizer_type?: string;

// Add to mapInspectionToWaterHeater function
nipple_material: data.equipment.nippleMaterial || undefined,
measured_hardness_gpg: data.measurements.measuredHardnessGPG || undefined,
sanitizer_type: undefined, // Captured from water district API or manual
```

### sync-inspection Edge Function Updates

Update the `InspectionPayload` interface to include new fields:

```typescript
interface InspectionPayload {
  waterHeater: {
    // ... existing fields
    nipple_material?: string;
    measured_hardness_gpg?: number;
    sanitizer_type?: string;
  };
}
```

---

## Phase 7: Documentation Update

Update `docs/database.md` with:
1. New columns added
2. ENUM definitions
3. Validation constraints
4. Default values

---

## Migration Order

| Step | Action | Risk |
|------|--------|------|
| 1 | Add missing columns (nipple_material, measured_hardness_gpg, sanitizer_type) | None - additive |
| 2 | Add CHECK constraints | Low - only affects new inserts |
| 3 | Update defaults | Low - only affects new inserts |
| 4 | Update edge function to populate assessment metrics | Low - enhancement |
| 5 | Update type mappers | Low - additive |
| 6 | (Future) Migrate TEXT to ENUM types | High - requires data migration |

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/new` | Add columns, constraints, defaults |
| `supabase/functions/sync-inspection/index.ts` | Update InspectionPayload, populate assessment metrics |
| `src/lib/syncMappers.ts` | Add new fields to interface and mapper |
| `src/types/technicianInspection.ts` | Verify all tank fields captured |
| `docs/database.md` | Document new schema |

---

## Expected Outcome

After this cleanup:
- All tank algorithm inputs have corresponding DB columns
- Invalid data is rejected at insert time
- Assessment metrics are queryable without parsing JSONB
- Schema is documented and validated
- Foundation ready for shipping tank heaters

---

## Optional: Tank-Only View

Create a view for cleaner tank queries:

```sql
CREATE VIEW tank_water_heaters AS
SELECT * FROM water_heaters
WHERE fuel_type IN ('GAS', 'ELECTRIC');
```

This isolates tank logic at the DB level too.
