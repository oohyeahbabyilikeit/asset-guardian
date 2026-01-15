-- Create leads table for unified contact capture
CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Contact info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Source tracking
  capture_source TEXT NOT NULL, -- 'findings_summary', 'handoff_remote', 'replacement_quote', 'maintenance_notify'
  capture_context JSONB DEFAULT '{}'::jsonb, -- Store recommendation type, tier selected, etc.
  
  -- Links to existing entities
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  water_heater_id UUID REFERENCES water_heaters(id) ON DELETE SET NULL,
  contractor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status tracking
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'closed'
  notes TEXT,
  
  -- Preferences
  opt_in_alerts BOOLEAN DEFAULT true,
  preferred_contact_method TEXT DEFAULT 'phone', -- 'phone', 'email', 'sms'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_leads_contractor ON public.leads(contractor_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX idx_leads_property ON public.leads(property_id);
CREATE INDEX idx_leads_water_heater ON public.leads(water_heater_id);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can create leads (for anonymous homeowner submissions)
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

-- Contractors can view leads linked to them or their properties
CREATE POLICY "Contractors can view their leads" ON public.leads
  FOR SELECT USING (
    contractor_id = auth.uid() 
    OR (property_id IS NOT NULL AND contractor_has_relationship(auth.uid(), property_id))
  );

-- Contractors can update leads they're linked to
CREATE POLICY "Contractors can update their leads" ON public.leads
  FOR UPDATE USING (
    contractor_id = auth.uid() 
    OR (property_id IS NOT NULL AND contractor_has_relationship(auth.uid(), property_id))
  );

-- Add updated_at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();