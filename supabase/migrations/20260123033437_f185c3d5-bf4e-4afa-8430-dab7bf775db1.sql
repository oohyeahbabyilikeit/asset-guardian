-- Add revenue_usd column to track actual closed revenue from conversions
ALTER TABLE nurturing_sequences 
ADD COLUMN revenue_usd numeric DEFAULT NULL;