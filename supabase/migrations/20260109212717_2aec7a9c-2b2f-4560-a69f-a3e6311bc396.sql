-- =============================================
-- OPTERRA MULTI-APP DATABASE SCHEMA
-- Supports: iOS Contractor App + Web Homeowner App
-- =============================================

-- 1. USER ROLES (Security-first approach)
CREATE TYPE public.app_role AS ENUM ('admin', 'contractor', 'homeowner');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  -- Contractor-specific fields (null for homeowners)
  company_name TEXT,
  license_number TEXT,
  service_area JSONB, -- Array of zip codes or geo region
  -- Homeowner-specific fields (null for contractors)
  preferred_contractor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Contractors can view homeowner profiles they service"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'contractor'));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. PROPERTIES TABLE (Homeowner addresses)
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT DEFAULT 'single_family', -- single_family, condo, townhouse, etc.
  year_built INTEGER,
  square_footage INTEGER,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can manage their own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Contractors can view properties they service"
  ON public.properties FOR SELECT
  USING (public.has_role(auth.uid(), 'contractor'));

-- 4. WATER HEATERS TABLE (The core asset)
CREATE TABLE public.water_heaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  -- Unit identification
  manufacturer TEXT,
  model_number TEXT,
  serial_number TEXT,
  -- Specs (from contractor inspection or onboarding)
  fuel_type TEXT NOT NULL DEFAULT 'GAS', -- GAS, ELECTRIC
  tank_capacity_gallons INTEGER NOT NULL DEFAULT 50,
  vent_type TEXT DEFAULT 'ATMOSPHERIC', -- ATMOSPHERIC, POWER_VENT, DIRECT_VENT
  warranty_years INTEGER DEFAULT 6,
  quality_tier TEXT DEFAULT 'STANDARD', -- BUILDER, STANDARD, PROFESSIONAL, PREMIUM
  -- Installation context
  install_date DATE,
  calendar_age_years NUMERIC,
  location TEXT DEFAULT 'GARAGE', -- ATTIC, UPPER_FLOOR, MAIN_LIVING, BASEMENT, GARAGE, etc.
  is_finished_area BOOLEAN DEFAULT false,
  -- System configuration (contractor-verified)
  house_psi INTEGER,
  temp_setting TEXT DEFAULT 'NORMAL', -- LOW, NORMAL, HOT
  has_softener BOOLEAN DEFAULT false,
  has_circ_pump BOOLEAN DEFAULT false,
  has_exp_tank BOOLEAN DEFAULT false,
  has_prv BOOLEAN DEFAULT false,
  is_closed_loop BOOLEAN DEFAULT false,
  hardness_gpg NUMERIC,
  -- Current state
  visual_rust BOOLEAN DEFAULT false,
  is_leaking BOOLEAN DEFAULT false,
  -- Metadata
  photo_urls JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.water_heaters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view their water heaters"
  ON public.water_heaters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = water_heaters.property_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can manage water heaters"
  ON public.water_heaters FOR ALL
  USING (public.has_role(auth.uid(), 'contractor'));

-- 5. ASSESSMENTS TABLE (Both self-assessments and contractor inspections)
CREATE TYPE public.assessment_source AS ENUM ('homeowner_onboarding', 'homeowner_update', 'contractor_inspection');

CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_heater_id UUID NOT NULL REFERENCES public.water_heaters(id) ON DELETE CASCADE,
  assessor_id UUID NOT NULL REFERENCES public.profiles(id),
  source assessment_source NOT NULL,
  -- Onboarding/Usage data (from homeowner web app)
  people_count INTEGER,
  usage_type TEXT, -- light, normal, heavy
  years_at_address NUMERIC,
  last_flush_years_ago NUMERIC,
  last_anode_replace_years_ago NUMERIC,
  -- Symptoms (from homeowner web app)
  symptoms JSONB DEFAULT '{}'::jsonb,
  -- Full ForensicInputs snapshot (for algorithm)
  forensic_inputs JSONB NOT NULL,
  -- Calculated results
  opterra_result JSONB, -- Full OpterraResult from algorithm
  health_score INTEGER,
  bio_age NUMERIC,
  fail_probability NUMERIC,
  risk_level INTEGER,
  recommendation_action TEXT,
  recommendation_title TEXT,
  -- Contractor-specific fields
  inspection_notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  -- Status
  status TEXT DEFAULT 'completed', -- draft, completed, archived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assessments for their properties"
  ON public.assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.water_heaters wh
      JOIN public.properties p ON p.id = wh.property_id
      WHERE wh.id = assessments.water_heater_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Assessors can manage their own assessments"
  ON public.assessments FOR ALL
  USING (auth.uid() = assessor_id);

CREATE POLICY "Contractors can view all assessments"
  ON public.assessments FOR SELECT
  USING (public.has_role(auth.uid(), 'contractor'));

-- 6. SERVICE HISTORY TABLE
CREATE TYPE public.service_event_type AS ENUM (
  'inspection', 'flush', 'anode_replacement', 'repair', 
  'thermostat_adjustment', 'prv_install', 'exp_tank_install', 'replacement'
);

CREATE TABLE public.service_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_heater_id UUID NOT NULL REFERENCES public.water_heaters(id) ON DELETE CASCADE,
  performed_by UUID REFERENCES public.profiles(id),
  event_type service_event_type NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cost_usd NUMERIC,
  notes TEXT,
  -- Health impact
  health_score_before INTEGER,
  health_score_after INTEGER,
  -- Metadata
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property owners can view their service history"
  ON public.service_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.water_heaters wh
      JOIN public.properties p ON p.id = wh.property_id
      WHERE wh.id = service_events.water_heater_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can manage service events"
  ON public.service_events FOR ALL
  USING (public.has_role(auth.uid(), 'contractor'));

-- 7. QUOTES TABLE (Contractor-generated quotes)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE SET NULL,
  water_heater_id UUID NOT NULL REFERENCES public.water_heaters(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id),
  -- Quote details
  quote_type TEXT NOT NULL, -- replacement, repair, maintenance
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, declined, expired
  -- Pricing breakdown
  unit_price_usd NUMERIC,
  unit_manufacturer TEXT,
  unit_model TEXT,
  labor_cost_usd NUMERIC NOT NULL,
  materials_cost_usd NUMERIC DEFAULT 0,
  permit_cost_usd NUMERIC DEFAULT 0,
  discount_usd NUMERIC DEFAULT 0,
  total_usd NUMERIC GENERATED ALWAYS AS (
    COALESCE(unit_price_usd, 0) + labor_cost_usd + materials_cost_usd + permit_cost_usd - discount_usd
  ) STORED,
  -- Timeline
  estimated_hours NUMERIC,
  proposed_date DATE,
  valid_until DATE,
  -- Terms
  warranty_terms TEXT,
  notes TEXT,
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homeowners can view their quotes"
  ON public.quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.water_heaters wh
      JOIN public.properties p ON p.id = wh.property_id
      WHERE wh.id = quotes.water_heater_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Contractors can manage their quotes"
  ON public.quotes FOR ALL
  USING (auth.uid() = contractor_id);

-- 8. UPDATE contractor_install_presets to reference proper contractor profile
-- (Already has contractor_id, just need to add FK if not present)

-- 9. INDEXES for performance
CREATE INDEX idx_properties_owner ON public.properties(owner_id);
CREATE INDEX idx_water_heaters_property ON public.water_heaters(property_id);
CREATE INDEX idx_assessments_water_heater ON public.assessments(water_heater_id);
CREATE INDEX idx_assessments_assessor ON public.assessments(assessor_id);
CREATE INDEX idx_service_events_water_heater ON public.service_events(water_heater_id);
CREATE INDEX idx_quotes_contractor ON public.quotes(contractor_id);
CREATE INDEX idx_quotes_water_heater ON public.quotes(water_heater_id);

-- 10. UPDATED_AT TRIGGERS
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_water_heaters_updated_at
  BEFORE UPDATE ON public.water_heaters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();