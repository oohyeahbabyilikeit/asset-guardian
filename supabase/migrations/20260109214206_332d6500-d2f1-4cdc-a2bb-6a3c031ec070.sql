-- PATCH 3: Remove mutable condition fields from water_heaters
-- These should live in assessments.forensic_inputs, not on the static asset table
ALTER TABLE public.water_heaters DROP COLUMN IF EXISTS house_psi;
ALTER TABLE public.water_heaters DROP COLUMN IF EXISTS hardness_gpg;
ALTER TABLE public.water_heaters DROP COLUMN IF EXISTS visual_rust;
ALTER TABLE public.water_heaters DROP COLUMN IF EXISTS is_leaking;

-- PATCH 4: Create water_softeners table for softener assets
CREATE TABLE public.water_softeners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  
  -- Static Asset Data
  manufacturer text,
  model_number text,
  serial_number text,
  install_date date,
  capacity_grains integer DEFAULT 32000,
  
  -- Equipment Type (maps to algorithm inputs)
  visual_height text DEFAULT 'WAIST' CHECK (visual_height IN ('KNEE', 'WAIST', 'CHEST')),
  control_head text DEFAULT 'DIGITAL' CHECK (control_head IN ('DIGITAL', 'ANALOG')),
  resin_type text CHECK (resin_type IS NULL OR resin_type IN ('standard', 'fine_mesh', 'carbon_hybrid')),
  has_carbon_filter boolean DEFAULT false,
  
  -- Metadata
  photo_urls jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.water_softeners ENABLE ROW LEVEL SECURITY;

-- Property owners can view their softeners
CREATE POLICY "Property owners can view their water softeners"
  ON public.water_softeners FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties p 
    WHERE p.id = water_softeners.property_id 
    AND p.owner_id = auth.uid()
  ));

-- Contractors can manage softeners
CREATE POLICY "Contractors can manage water softeners"
  ON public.water_softeners FOR ALL
  USING (has_role(auth.uid(), 'contractor'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_water_softeners_updated_at
  BEFORE UPDATE ON public.water_softeners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();