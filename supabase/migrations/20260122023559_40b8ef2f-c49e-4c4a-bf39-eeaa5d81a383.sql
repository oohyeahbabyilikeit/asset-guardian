-- Fix: Change view to SECURITY INVOKER to inherit querying user's RLS
DROP VIEW IF EXISTS tank_water_heaters;
CREATE VIEW tank_water_heaters WITH (security_invoker = on) AS
SELECT * FROM water_heaters
WHERE fuel_type IN ('GAS', 'ELECTRIC');