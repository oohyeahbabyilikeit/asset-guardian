-- Add tracking columns to sequence_events table
ALTER TABLE public.sequence_events 
  ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS opened_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS clicked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS message_content text;

-- Add outcome tracking to nurturing_sequences
ALTER TABLE public.nurturing_sequences
  ADD COLUMN IF NOT EXISTS outcome text,
  ADD COLUMN IF NOT EXISTS outcome_reason text,
  ADD COLUMN IF NOT EXISTS outcome_step integer,
  ADD COLUMN IF NOT EXISTS outcome_at timestamp with time zone;