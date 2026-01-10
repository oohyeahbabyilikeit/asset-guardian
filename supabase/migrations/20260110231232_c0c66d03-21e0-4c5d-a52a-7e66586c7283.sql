-- Phase 1: Create Service Relationship Infrastructure

-- Step 1.1: Create contractor_property_relationships table
CREATE TABLE public.contractor_property_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('quote', 'service', 'preferred')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 year'),
  UNIQUE (contractor_id, property_id, relationship_type)
);

ALTER TABLE public.contractor_property_relationships ENABLE ROW LEVEL SECURITY;

-- Contractors can see their own relationships
CREATE POLICY "Contractors can view their relationships"
  ON public.contractor_property_relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = contractor_id);

-- Contractors can create relationships when they submit quotes or perform service
CREATE POLICY "Contractors can create relationships"
  ON public.contractor_property_relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contractor_id AND has_role(auth.uid(), 'contractor'::app_role));

-- Step 1.2: Create helper function to check contractor-property relationship
CREATE OR REPLACE FUNCTION public.contractor_has_relationship(
  _contractor_id uuid, 
  _property_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM contractor_property_relationships
    WHERE contractor_id = _contractor_id
      AND property_id = _property_id
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Phase 2: Fix Critical Table Policies

-- Step 2.1: Fix profiles table
DROP POLICY IF EXISTS "Contractors can view homeowner profiles they service" ON profiles;

CREATE POLICY "Contractors can view profiles they have relationships with"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    (has_role(auth.uid(), 'contractor'::app_role) AND EXISTS (
      SELECT 1 FROM properties p
      WHERE p.owner_id = profiles.id
        AND contractor_has_relationship(auth.uid(), p.id)
    ))
  );

-- Step 2.2: Fix properties table
DROP POLICY IF EXISTS "Contractors can view properties they service" ON properties;

CREATE POLICY "Contractors can view properties they have relationships with"
  ON properties FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR
    contractor_has_relationship(auth.uid(), id)
  );

-- Step 2.3: Fix assessments table
DROP POLICY IF EXISTS "Contractors can view all assessments" ON assessments;

CREATE POLICY "Contractors can view assessments for related properties"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = assessor_id
    OR
    EXISTS (
      SELECT 1 FROM water_heaters wh
      JOIN properties p ON p.id = wh.property_id
      WHERE wh.id = assessments.water_heater_id
        AND (p.owner_id = auth.uid() OR contractor_has_relationship(auth.uid(), p.id))
    )
  );

-- Step 2.4: Fix water_heaters table
DROP POLICY IF EXISTS "Contractors can manage water heaters" ON water_heaters;

CREATE POLICY "Contractors can insert water heaters for related properties"
  ON water_heaters FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'contractor'::app_role)
    AND contractor_has_relationship(auth.uid(), property_id)
  );

CREATE POLICY "Contractors can update water heaters they created"
  ON water_heaters FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM properties p 
      WHERE p.id = water_heaters.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can delete water heaters they created"
  ON water_heaters FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Step 2.5: Fix service_events table
DROP POLICY IF EXISTS "Contractors can manage service events" ON service_events;

CREATE POLICY "Contractors can insert service events for related properties"
  ON service_events FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'contractor'::app_role)
    AND auth.uid() = performed_by
    AND EXISTS (
      SELECT 1 FROM water_heaters wh
      WHERE wh.id = service_events.water_heater_id
        AND contractor_has_relationship(auth.uid(), wh.property_id)
    )
  );

CREATE POLICY "Contractors can update their own service events"
  ON service_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = performed_by);

CREATE POLICY "Contractors can delete their own service events"
  ON service_events FOR DELETE
  TO authenticated
  USING (auth.uid() = performed_by);

-- Step 2.6: Fix water_softeners table
DROP POLICY IF EXISTS "Contractors can manage water softeners" ON water_softeners;

CREATE POLICY "Contractors can insert water softeners for related properties"
  ON water_softeners FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'contractor'::app_role)
    AND contractor_has_relationship(auth.uid(), property_id)
  );

CREATE POLICY "Contractors can update water softeners they created"
  ON water_softeners FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Contractors can delete water softeners they created"
  ON water_softeners FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Phase 3: Fix Warning-Level Issues

-- Step 3.1: Restrict unit_prices to authenticated users
DROP POLICY IF EXISTS "Anyone can read unit prices" ON unit_prices;

CREATE POLICY "Authenticated users can read retail prices"
  ON unit_prices FOR SELECT
  TO authenticated
  USING (true);

-- Step 3.2: Restrict contractor_install_presets to authenticated users
DROP POLICY IF EXISTS "Anyone can read install presets" ON contractor_install_presets;

CREATE POLICY "Authenticated users can read install presets"
  ON contractor_install_presets FOR SELECT
  TO authenticated
  USING (true);

-- Step 3.3: Fix quotes table - separate homeowner acceptance
CREATE POLICY "Homeowners can update quote acceptance status"
  ON quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM water_heaters wh
      JOIN properties p ON p.id = wh.property_id
      WHERE wh.id = quotes.water_heater_id 
        AND p.owner_id = auth.uid()
    )
  );

-- Phase 4: Add Relationship Creation Triggers

-- Step 4.1: Auto-create relationship when quote is submitted
CREATE OR REPLACE FUNCTION public.create_relationship_on_quote()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contractor_property_relationships (contractor_id, property_id, relationship_type)
  SELECT NEW.contractor_id, wh.property_id, 'quote'
  FROM water_heaters wh
  WHERE wh.id = NEW.water_heater_id
  ON CONFLICT (contractor_id, property_id, relationship_type) DO UPDATE SET expires_at = now() + interval '1 year';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_quote_insert
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_relationship_on_quote();

-- Step 4.2: Auto-create relationship when service is performed
CREATE OR REPLACE FUNCTION public.create_relationship_on_service()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO contractor_property_relationships (contractor_id, property_id, relationship_type)
  SELECT NEW.performed_by, wh.property_id, 'service'
  FROM water_heaters wh
  WHERE wh.id = NEW.water_heater_id
  ON CONFLICT (contractor_id, property_id, relationship_type) DO UPDATE SET expires_at = now() + interval '1 year';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;