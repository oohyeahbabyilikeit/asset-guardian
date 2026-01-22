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