-- Phase 2: Opportunity Notifications Table
-- Stores detected maintenance/replacement opportunities for contractor notification

CREATE TABLE public.opportunity_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  water_heater_id UUID NOT NULL REFERENCES public.water_heaters(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  health_score INTEGER,
  fail_probability NUMERIC,
  calculated_age NUMERIC,
  opportunity_context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'viewed', 'converted', 'dismissed')),
  dismiss_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- Index for fast contractor lookup by status
CREATE INDEX idx_opp_contractor_status ON public.opportunity_notifications(contractor_id, status);

-- Index for deduplication queries (water_heater + type within timeframe)
CREATE INDEX idx_opp_dedup ON public.opportunity_notifications(water_heater_id, opportunity_type, created_at);

-- Index for expiration cleanup
CREATE INDEX idx_opp_expires ON public.opportunity_notifications(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.opportunity_notifications ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own notifications
CREATE POLICY "Contractors can view their notifications"
ON public.opportunity_notifications
FOR SELECT
USING (auth.uid() = contractor_id);

-- Contractors can update their own notifications (mark viewed, dismissed, converted)
CREATE POLICY "Contractors can update their notifications"
ON public.opportunity_notifications
FOR UPDATE
USING (auth.uid() = contractor_id);

-- Service role can insert (from edge function)
CREATE POLICY "Service can insert notifications"
ON public.opportunity_notifications
FOR INSERT
WITH CHECK (true);

-- Service role can update (mark as sent)
CREATE POLICY "Service can update notifications"
ON public.opportunity_notifications
FOR ALL
USING (true);

-- Add trigger for updated_at (reuse existing function)
ALTER TABLE public.opportunity_notifications ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER update_opportunity_notifications_updated_at
BEFORE UPDATE ON public.opportunity_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();