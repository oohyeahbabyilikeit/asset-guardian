-- Water Districts Cache Table
-- Stores water utility sanitizer data from AI-powered CCR lookups
CREATE TABLE public.water_districts (
  zip_code TEXT PRIMARY KEY,
  utility_name TEXT,
  sanitizer_type TEXT CHECK (sanitizer_type IN ('CHLORINE', 'CHLORAMINE', 'UNKNOWN')),
  hardness_gpg NUMERIC,
  source_url TEXT,
  confidence NUMERIC DEFAULT 0,
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.water_districts ENABLE ROW LEVEL SECURITY;

-- Public read access (water quality data is public information)
CREATE POLICY "Anyone can read water districts"
  ON public.water_districts FOR SELECT
  USING (true);

-- Service role can manage (edge function uses service role)
CREATE POLICY "Service can manage water districts"
  ON public.water_districts FOR ALL
  USING (true);

-- Index for cache lookup performance
CREATE INDEX idx_water_districts_zip ON public.water_districts(zip_code);
CREATE INDEX idx_water_districts_verified ON public.water_districts(last_verified);