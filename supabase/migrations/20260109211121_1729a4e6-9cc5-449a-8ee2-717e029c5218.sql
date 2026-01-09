-- ================================================
-- Water Heater Pricing & Contractor Presets v1.0
-- ================================================

-- Table: Unit prices (populated by AI lookup)
CREATE TABLE public.unit_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Model identification
  model_number TEXT,                     -- Exact model if scanned
  manufacturer TEXT,                     -- Brand name
  
  -- Specs for fallback matching
  fuel_type TEXT NOT NULL DEFAULT 'GAS', -- GAS, ELECTRIC, HYBRID
  capacity_gallons INTEGER NOT NULL DEFAULT 50,
  vent_type TEXT NOT NULL DEFAULT 'ATMOSPHERIC', -- ATMOSPHERIC, POWER_VENT, DIRECT_VENT
  warranty_years INTEGER NOT NULL DEFAULT 6,
  quality_tier TEXT NOT NULL DEFAULT 'STANDARD', -- BUILDER, STANDARD, PROFESSIONAL, PREMIUM
  
  -- Pricing
  retail_price_usd NUMERIC(10,2) NOT NULL,
  wholesale_price_usd NUMERIC(10,2),     -- Optional contractor cost
  price_source TEXT,                      -- 'AI_LOOKUP', 'MANUAL', 'IMPORT'
  source_url TEXT,                        -- Where price was found
  
  -- Metadata
  lookup_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confidence_score NUMERIC(3,2),          -- 0.00-1.00 AI confidence
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table: Contractor installation presets
CREATE TABLE public.contractor_install_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL,           -- Future: link to contractors table
  
  -- Venting dimension
  vent_type TEXT NOT NULL,               -- ATMOSPHERIC, POWER_VENT, DIRECT_VENT
  
  -- Complexity dimension  
  complexity TEXT NOT NULL,              -- STANDARD, CODE_UPGRADE, DIFFICULT_ACCESS, NEW_INSTALL
  
  -- Pricing
  labor_cost_usd NUMERIC(10,2) NOT NULL,
  materials_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  permit_cost_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_install_cost_usd NUMERIC(10,2) GENERATED ALWAYS AS (labor_cost_usd + materials_cost_usd + permit_cost_usd) STORED,
  
  -- Description
  description TEXT,
  estimated_hours NUMERIC(4,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one preset per vent+complexity combo per contractor
  UNIQUE (contractor_id, vent_type, complexity)
);

-- Table: Price lookup cache (avoid duplicate AI calls)
CREATE TABLE public.price_lookup_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lookup key
  lookup_key TEXT NOT NULL UNIQUE,       -- model_number or specs hash
  lookup_type TEXT NOT NULL,             -- 'MODEL' or 'SPECS'
  
  -- Cached result
  result_json JSONB NOT NULL,
  
  -- Expiry
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days')
);

-- Enable RLS
ALTER TABLE public.unit_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_install_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lookup_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: unit_prices (public read, admin write)
CREATE POLICY "Anyone can read unit prices" 
ON public.unit_prices FOR SELECT USING (true);

CREATE POLICY "Service can insert unit prices" 
ON public.unit_prices FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update unit prices" 
ON public.unit_prices FOR UPDATE USING (true);

-- RLS Policies: contractor_install_presets (contractors manage their own)
CREATE POLICY "Anyone can read install presets" 
ON public.contractor_install_presets FOR SELECT USING (true);

CREATE POLICY "Service can manage install presets" 
ON public.contractor_install_presets FOR ALL USING (true);

-- RLS Policies: price_lookup_cache (internal use)
CREATE POLICY "Service can manage cache" 
ON public.price_lookup_cache FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_unit_prices_model ON public.unit_prices (model_number);
CREATE INDEX idx_unit_prices_specs ON public.unit_prices (fuel_type, capacity_gallons, vent_type, warranty_years);
CREATE INDEX idx_install_presets_vent_complexity ON public.contractor_install_presets (vent_type, complexity);
CREATE INDEX idx_cache_expires ON public.price_lookup_cache (expires_at);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_unit_prices_updated_at
BEFORE UPDATE ON public.unit_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_install_presets_updated_at
BEFORE UPDATE ON public.contractor_install_presets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();