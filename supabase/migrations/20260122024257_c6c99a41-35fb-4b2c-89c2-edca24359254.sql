-- Add foreign key constraints to maintenance_notification_requests
-- These are optional columns (nullable) so we use ON DELETE SET NULL

-- 1. Link to water_heaters
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_water_heater_id_fkey
FOREIGN KEY (water_heater_id) REFERENCES water_heaters(id) ON DELETE SET NULL;

-- 2. Link to properties
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_property_id_fkey
FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;

-- 3. Link to contractor profiles
ALTER TABLE maintenance_notification_requests
ADD CONSTRAINT maintenance_notification_requests_contractor_id_fkey
FOREIGN KEY (contractor_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Add index for water_heater_id lookups (missing)
CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_water_heater 
ON maintenance_notification_requests(water_heater_id);