-- Table for contractor-specific maintenance service pricing
CREATE TABLE public.contractor_service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  unit_type TEXT NOT NULL DEFAULT 'tank',
  price_usd NUMERIC(10,2) NOT NULL,
  estimated_minutes INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, service_type, unit_type)
);

-- Enable RLS
ALTER TABLE public.contractor_service_prices ENABLE ROW LEVEL SECURITY;

-- Contractors can manage their own prices
CREATE POLICY "Contractors can manage their own prices"
ON public.contractor_service_prices
FOR ALL
USING (auth.uid() = contractor_id);

-- Authenticated users can read prices (for displaying estimates)
CREATE POLICY "Authenticated users can read prices"
ON public.contractor_service_prices
FOR SELECT
USING (true);

-- Table for maintenance notification requests
CREATE TABLE public.maintenance_notification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID,
  water_heater_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  maintenance_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  notification_lead_days INTEGER DEFAULT 14,
  status TEXT DEFAULT 'pending',
  contractor_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_notification_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can create notification requests (public-facing form)
CREATE POLICY "Anyone can create notification requests"
ON public.maintenance_notification_requests
FOR INSERT
WITH CHECK (true);

-- Contractors can view and manage requests assigned to them
CREATE POLICY "Contractors can manage their requests"
ON public.maintenance_notification_requests
FOR ALL
USING (auth.uid() = contractor_id);

-- Property owners can view their own requests
CREATE POLICY "Property owners can view their requests"
ON public.maintenance_notification_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties p
    WHERE p.id = maintenance_notification_requests.property_id
    AND p.owner_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_contractor_service_prices_updated_at
BEFORE UPDATE ON public.contractor_service_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_notification_requests_updated_at
BEFORE UPDATE ON public.maintenance_notification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();