-- Database Cleanup: Tank Water Heaters v1.0
-- Phase 1: Add Missing Tank-Specific Columns

ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS nipple_material TEXT;
-- Options: 'STEEL', 'STAINLESS_BRASS', 'FACTORY_PROTECTED'

ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS measured_hardness_gpg NUMERIC;
-- Test strip result - most accurate hardness reading

-- Phase 2: Add Validation Constraints (using triggers for time-agnostic validation)

-- Warranty years must be reasonable (1-15 years)
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS warranty_years_range;
ALTER TABLE water_heaters ADD CONSTRAINT warranty_years_range 
  CHECK (warranty_years IS NULL OR (warranty_years >= 1 AND warranty_years <= 15));

-- Calendar age can't be negative or unrealistic
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS calendar_age_range;
ALTER TABLE water_heaters ADD CONSTRAINT calendar_age_range 
  CHECK (calendar_age_years IS NULL OR (calendar_age_years >= 0 AND calendar_age_years <= 50));

-- Anode count must be 1 or 2
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS anode_count_valid;
ALTER TABLE water_heaters ADD CONSTRAINT anode_count_valid 
  CHECK (anode_count IS NULL OR anode_count IN (1, 2));

-- Tank capacity must be valid (20-120 gallons for residential)
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS tank_capacity_range;
ALTER TABLE water_heaters ADD CONSTRAINT tank_capacity_range 
  CHECK (tank_capacity_gallons >= 20 AND tank_capacity_gallons <= 120);

-- House PSI must be in reasonable range
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS house_psi_range;
ALTER TABLE water_heaters ADD CONSTRAINT house_psi_range 
  CHECK (house_psi IS NULL OR (house_psi >= 20 AND house_psi <= 150));

-- Hardness must be non-negative
ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS hardness_non_negative;
ALTER TABLE water_heaters ADD CONSTRAINT hardness_non_negative 
  CHECK (street_hardness_gpg IS NULL OR street_hardness_gpg >= 0);

ALTER TABLE water_heaters DROP CONSTRAINT IF EXISTS measured_hardness_non_negative;
ALTER TABLE water_heaters ADD CONSTRAINT measured_hardness_non_negative 
  CHECK (measured_hardness_gpg IS NULL OR measured_hardness_gpg >= 0);

-- Phase 3: Improve Defaults
ALTER TABLE water_heaters ALTER COLUMN house_psi SET DEFAULT 60;
ALTER TABLE water_heaters ALTER COLUMN warranty_years SET DEFAULT 6;
ALTER TABLE water_heaters ALTER COLUMN anode_count SET DEFAULT 1;
ALTER TABLE water_heaters ALTER COLUMN visual_rust SET DEFAULT false;
ALTER TABLE water_heaters ALTER COLUMN is_leaking SET DEFAULT false;

-- Phase 4: Create Tank-Only View for cleaner queries
CREATE OR REPLACE VIEW tank_water_heaters AS
SELECT * FROM water_heaters
WHERE fuel_type IN ('GAS', 'ELECTRIC');