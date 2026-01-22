-- RLS Policies for inspection-photos bucket
-- Allow authenticated users (technicians) to upload photos
CREATE POLICY "Technicians can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos' AND
  auth.uid() IS NOT NULL
);

-- Allow authenticated users to view photos
-- Photos can be viewed by property owners or contractors with relationships
CREATE POLICY "Authenticated users can view inspection photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid() IS NOT NULL
);

-- Allow uploaders to update their own photos
CREATE POLICY "Users can update their own inspection photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid() = owner
);

-- Allow uploaders to delete their own photos
CREATE POLICY "Users can delete their own inspection photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'inspection-photos' AND
  auth.uid() = owner
);