-- Create nurturing_sequences table to track active sequences per opportunity
CREATE TABLE public.nurturing_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES public.demo_opportunities(id) ON DELETE CASCADE,
  sequence_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  current_step INTEGER NOT NULL DEFAULT 1,
  total_steps INTEGER NOT NULL,
  next_action_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sequence_templates table for reusable sequence definitions
CREATE TABLE public.sequence_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create sequence_events table to log sent messages/actions
CREATE TABLE public.sequence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.nurturing_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.nurturing_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for nurturing_sequences (demo: allow all reads)
CREATE POLICY "Anyone can read nurturing sequences" 
ON public.nurturing_sequences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can manage nurturing sequences" 
ON public.nurturing_sequences 
FOR ALL 
USING (true);

-- RLS policies for sequence_templates (demo: allow all reads)
CREATE POLICY "Anyone can read sequence templates" 
ON public.sequence_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage sequence templates" 
ON public.sequence_templates 
FOR ALL 
USING (true);

-- RLS policies for sequence_events (demo: allow all reads)
CREATE POLICY "Anyone can read sequence events" 
ON public.sequence_events 
FOR SELECT 
USING (true);

CREATE POLICY "Service can manage sequence events" 
ON public.sequence_events 
FOR ALL 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_nurturing_sequences_opportunity ON public.nurturing_sequences(opportunity_id);
CREATE INDEX idx_nurturing_sequences_status ON public.nurturing_sequences(status);
CREATE INDEX idx_sequence_events_sequence ON public.sequence_events(sequence_id);

-- Add updated_at triggers
CREATE TRIGGER update_nurturing_sequences_updated_at
  BEFORE UPDATE ON public.nurturing_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sequence_templates_updated_at
  BEFORE UPDATE ON public.sequence_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial sequence templates
INSERT INTO public.sequence_templates (name, trigger_type, steps) VALUES
(
  'Urgent Replacement - 5 Day',
  'replacement_urgent',
  '[
    {"step": 1, "day": 0, "action": "sms", "message": "Your water heater needs attention"},
    {"step": 2, "day": 1, "action": "email", "message": "Risk report PDF attached"},
    {"step": 3, "day": 3, "action": "sms", "message": "Limited time financing available"},
    {"step": 4, "day": 5, "action": "call_reminder", "message": "Call reminder to contractor"},
    {"step": 5, "day": 7, "action": "sms", "message": "Ready when you are"}
  ]'::jsonb
),
(
  'Code Violation Awareness',
  'code_violation',
  '[
    {"step": 1, "day": 0, "action": "email", "message": "Educational content about the violation"},
    {"step": 2, "day": 7, "action": "sms", "message": "Your home may not be up to code"},
    {"step": 3, "day": 14, "action": "call_reminder", "message": "Follow-up call reminder"}
  ]'::jsonb
),
(
  'Maintenance Reminder - 30 Day',
  'maintenance',
  '[
    {"step": 1, "day": 0, "action": "email", "message": "Annual maintenance keeps you safe"},
    {"step": 2, "day": 14, "action": "sms", "message": "Did you know sediment builds up?"},
    {"step": 3, "day": 21, "action": "email", "message": "Seasonal maintenance checklist"},
    {"step": 4, "day": 30, "action": "call_reminder", "message": "Time for a maintenance call"}
  ]'::jsonb
);