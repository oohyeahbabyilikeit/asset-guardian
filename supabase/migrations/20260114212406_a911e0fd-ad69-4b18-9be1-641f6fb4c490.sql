-- Add v7.8-7.9 columns to water_heaters table
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS venting_scenario TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS anode_count INTEGER DEFAULT 1;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS exp_tank_status TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS has_drain_pan BOOLEAN DEFAULT false;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS connection_type TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS leak_source TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS visual_rust BOOLEAN DEFAULT false;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS is_leaking BOOLEAN DEFAULT false;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS house_psi NUMERIC;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS street_hardness_gpg NUMERIC;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS rated_flow_gpm NUMERIC;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS gas_line_size TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS last_descale_years_ago NUMERIC;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS room_volume_type TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS air_filter_status TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS is_condensate_clear BOOLEAN;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS flame_rod_status TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS inlet_filter_status TEXT;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS error_code_count INTEGER DEFAULT 0;
ALTER TABLE water_heaters ADD COLUMN IF NOT EXISTS building_type TEXT DEFAULT 'residential';

-- Add missing columns to water_softeners table
ALTER TABLE water_softeners ADD COLUMN IF NOT EXISTS salt_status TEXT DEFAULT 'UNKNOWN';
ALTER TABLE water_softeners ADD COLUMN IF NOT EXISTS quality_tier TEXT DEFAULT 'STANDARD';
ALTER TABLE water_softeners ADD COLUMN IF NOT EXISTS visual_iron BOOLEAN DEFAULT false;
ALTER TABLE water_softeners ADD COLUMN IF NOT EXISTS visual_condition TEXT DEFAULT 'WEATHERED';
ALTER TABLE water_softeners ADD COLUMN IF NOT EXISTS sanitizer_type TEXT DEFAULT 'UNKNOWN';

-- Create inspection-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Authenticated users can upload photos to their own folder
CREATE POLICY "Users can upload inspection photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Users can view their own photos
CREATE POLICY "Users can view own inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS: Contractors can view photos for properties they have relationships with
CREATE POLICY "Contractors can view related inspection photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'inspection-photos' 
  AND has_role(auth.uid(), 'contractor')
);

-- RLS: Users can delete their own photos
CREATE POLICY "Users can delete own inspection photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);