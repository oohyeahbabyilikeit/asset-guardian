-- Add unique constraint for upsert operations
ALTER TABLE public.unit_prices 
ADD CONSTRAINT unit_prices_model_manufacturer_key UNIQUE (model_number, manufacturer);

-- Add unique constraint for contractor install presets
ALTER TABLE public.contractor_install_presets 
ADD CONSTRAINT contractor_install_presets_contractor_vent_complexity_key UNIQUE (contractor_id, vent_type, complexity);