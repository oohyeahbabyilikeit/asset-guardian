-- Create demo_opportunities table for self-contained demo data
-- This bypasses the profiles FK constraint that requires auth.users

CREATE TABLE IF NOT EXISTS demo_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer info (would normally come from profiles)
  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  
  -- Property info
  property_address text NOT NULL,
  property_city text NOT NULL,
  property_state text NOT NULL DEFAULT 'AZ',
  property_zip text NOT NULL,
  
  -- Opportunity metadata
  opportunity_type text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  job_complexity text NOT NULL DEFAULT 'STANDARD',
  context_description text,
  
  -- Water heater asset info
  asset_brand text NOT NULL,
  asset_model text,
  asset_serial text,
  asset_age_years numeric NOT NULL,
  asset_location text,
  asset_capacity integer NOT NULL DEFAULT 50,
  asset_fuel_type text NOT NULL DEFAULT 'GAS',
  asset_vent_type text,
  asset_warranty_years integer NOT NULL DEFAULT 6,
  
  -- Forensic inputs (JSONB for flexibility)
  forensic_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Opterra results
  health_score integer,
  bio_age numeric,
  fail_probability numeric,
  shield_life numeric,
  risk_level integer,
  verdict_action text,
  verdict_title text,
  anode_remaining numeric,
  
  -- Additional data
  inspection_notes text,
  photo_urls jsonb DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE demo_opportunities ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read demo data (it's demo data, not sensitive)
CREATE POLICY "Anyone can read demo opportunities"
  ON demo_opportunities FOR SELECT
  USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_demo_opportunities_updated_at
  BEFORE UPDATE ON demo_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed the 12 demo opportunities
INSERT INTO demo_opportunities (
  id, customer_name, customer_phone, customer_email,
  property_address, property_city, property_state, property_zip,
  opportunity_type, priority, status, job_complexity, context_description,
  asset_brand, asset_model, asset_serial, asset_age_years, asset_location,
  asset_capacity, asset_fuel_type, asset_vent_type, asset_warranty_years,
  forensic_inputs, health_score, bio_age, fail_probability, shield_life,
  risk_level, verdict_action, verdict_title, anode_remaining,
  inspection_notes, photo_urls, created_at
) VALUES
  -- CRITICAL: Johnson Family
  (
    'a0000000-0000-0000-0000-000000000001',
    'Johnson Family', '(602) 555-0142', 'johnson.family@email.com',
    '1847 Sunset Dr', 'Phoenix', 'AZ', '85001',
    'replacement_urgent', 'critical', 'pending', 'COMPLEX',
    'Active leak detected at base. Tank is 12 years old with no anode service history. High pressure system.',
    'Rheem', 'PROG50-36N-RH67', 'RH-2012-5567-P', 12, 'Attic',
    50, 'GAS', 'Atmospheric', 6,
    '{"fuelType": "GAS", "calendarAge": 12, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": false, "hardnessGPG": 18, "measuredHardnessGPG": 18, "streetHardnessGPG": 22, "housePsi": 95, "hasPrv": true, "hasExpTank": false, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "HOT", "peopleCount": 4, "usageType": "normal", "location": "ATTIC", "isFinishedArea": false, "ventType": "ATMOSPHERIC", "isLeaking": true, "leakSource": "TANK_BODY", "visualRust": true}'::jsonb,
    24, 18.2, 0.78, 0, 4, 'REPLACE', 'Replacement Required', 0,
    'Active leak at tank base with visible rust staining. T&P valve discharging intermittently. Tank in unconditioned attic - major flood risk. Recommend immediate replacement with relocation to garage if possible.',
    '["https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80"]'::jsonb,
    now() - interval '2 hours'
  ),
  
  -- CRITICAL: Williams Residence
  (
    'a0000000-0000-0000-0000-000000000002',
    'Williams Residence', '(602) 555-0298', 'williams.r@email.com',
    '2301 E Camelback Rd', 'Phoenix', 'AZ', '85016',
    'replacement_urgent', 'critical', 'pending', 'ELEVATED',
    'Severe corrosion on tank exterior. T&P valve weeping. Electric unit in garage - 15 years old.',
    'Bradford White', 'RE350S6-1NCWW', 'BW-2009-8823-E', 15, 'Garage',
    50, 'ELECTRIC', 'N/A', 6,
    '{"fuelType": "ELECTRIC", "calendarAge": 15, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": false, "hardnessGPG": 24, "measuredHardnessGPG": 24, "streetHardnessGPG": 24, "housePsi": 72, "hasPrv": false, "hasExpTank": false, "isClosedLoop": false, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 2, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "isLeaking": true, "leakSource": "FITTING_VALVE", "visualRust": true}'::jsonb,
    18, 22.5, 0.85, 0, 4, 'REPLACE', 'Critical - Replace Immediately', 0,
    'Tank exterior shows severe corrosion around seams. T&P valve weeping - indicates internal pressure issues. No anode maintenance records found. Unit has exceeded expected lifespan.',
    '["https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"]'::jsonb,
    now() - interval '5 hours'
  ),
  
  -- HIGH: Martinez Residence
  (
    'a0000000-0000-0000-0000-000000000003',
    'Martinez Residence', '(480) 555-0187', NULL,
    '456 Oak Ave', 'Scottsdale', 'AZ', '85251',
    'warranty_expiring', 'high', 'pending', 'STANDARD',
    'Warranty expires in 6 months. 5-year-old A.O. Smith in good condition. Recommend anode inspection.',
    'A.O. Smith', 'GPVX-50', 'AOS-2019-4421-G', 5, 'Utility Room',
    50, 'GAS', 'Power Vent', 6,
    '{"fuelType": "GAS", "calendarAge": 5, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": true, "hardnessGPG": 8, "measuredHardnessGPG": 8, "streetHardnessGPG": 18, "housePsi": 65, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 3, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 2, "ventType": "POWER_VENT", "isLeaking": false, "visualRust": false}'::jsonb,
    62, 7.5, 0.38, 6, 2, 'MONITOR', 'Monitor Closely', 2,
    'Warranty expires in 6 months. Unit in good condition. Recommend anode inspection before warranty expires.',
    '[]'::jsonb,
    now() - interval '1 day'
  ),
  
  -- HIGH: Chen Family
  (
    'a0000000-0000-0000-0000-000000000004',
    'Chen Family', '(480) 555-0334', NULL,
    '789 Mesquite Ln', 'Tempe', 'AZ', '85281',
    'anode_due', 'high', 'viewed', 'ELEVATED',
    'Anode confirmed depleted during last visit. High sediment detected. 10-year unit in hard water area.',
    'State Select', 'GS650YBRT', 'SS-2014-7756-G', 10, 'Closet',
    50, 'GAS', 'Atmospheric', 6,
    '{"fuelType": "GAS", "calendarAge": 10, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": false, "hardnessGPG": 22, "measuredHardnessGPG": 22, "streetHardnessGPG": 22, "housePsi": 78, "hasPrv": true, "hasExpTank": false, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 5, "usageType": "heavy", "location": "MAIN_LIVING", "isFinishedArea": true, "lastFlushYearsAgo": 4, "ventType": "ATMOSPHERIC", "isLeaking": false, "visualRust": false}'::jsonb,
    45, 14.5, 0.52, 3, 3, 'MAINTAIN', 'Maintenance Required', 0,
    'Anode confirmed depleted during inspection. High sediment detected. Unit in finished space - higher risk location. Recommend immediate anode replacement and flush.',
    '[]'::jsonb,
    now() - interval '2 days'
  ),
  
  -- HIGH: Thompson Home
  (
    'a0000000-0000-0000-0000-000000000005',
    'Thompson Home', '(480) 555-0912', NULL,
    '1122 Palm Desert Way', 'Gilbert', 'AZ', '85234',
    'replacement_recommended', 'high', 'pending', 'ELEVATED',
    'House PSI at 105 - no PRV installed. 8-year-old unit showing stress signs. Closed loop system.',
    'Bradford White', 'RG240T6N', 'BW-2016-3312-G', 8, 'Garage',
    40, 'GAS', 'Atmospheric', 6,
    '{"fuelType": "GAS", "calendarAge": 8, "warrantyYears": 6, "tankCapacity": 40, "hasSoftener": false, "hardnessGPG": 16, "measuredHardnessGPG": 16, "streetHardnessGPG": 18, "housePsi": 105, "hasPrv": false, "hasExpTank": false, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 4, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 3, "ventType": "ATMOSPHERIC", "isLeaking": false, "visualRust": false}'::jsonb,
    52, 12.0, 0.48, 4, 3, 'MONITOR', 'Monitor - Code Issues', 1,
    'House PSI at 105 - dangerously high with no PRV installed. Closed loop system without expansion tank. Unit showing stress from high pressure. Recommend PRV and expansion tank installation.',
    '[]'::jsonb,
    now() - interval '3 days'
  ),
  
  -- MEDIUM: Rodriguez Family
  (
    'a0000000-0000-0000-0000-000000000006',
    'Rodriguez Family', '(480) 555-0456', NULL,
    '3344 Saguaro Blvd', 'Mesa', 'AZ', '85201',
    'anode_due', 'medium', 'pending', 'STANDARD',
    'Anode replacement due based on 6-year cycle. Well-maintained unit with softener.',
    'Rheem', 'PROG40-38N-RH60', 'RH-2018-2234-G', 6, 'Utility Room',
    40, 'GAS', 'Atmospheric', 6,
    '{"fuelType": "GAS", "calendarAge": 6, "warrantyYears": 6, "tankCapacity": 40, "hasSoftener": true, "hardnessGPG": 6, "measuredHardnessGPG": 6, "streetHardnessGPG": 20, "housePsi": 62, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 4, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 1, "ventType": "ATMOSPHERIC", "isLeaking": false, "visualRust": false}'::jsonb,
    71, 8.0, 0.28, 8, 2, 'MAINTAIN', 'Routine Maintenance Due', 1,
    'Anode replacement due based on 6-year cycle. Well-maintained unit with softener. Good overall condition.',
    '[]'::jsonb,
    now() - interval '4 days'
  ),
  
  -- MEDIUM: Patel Residence
  (
    'a0000000-0000-0000-0000-000000000007',
    'Patel Residence', '(480) 555-0567', NULL,
    '5566 Ironwood Dr', 'Chandler', 'AZ', '85226',
    'flush_due', 'medium', 'pending', 'STANDARD',
    'Annual flush due. 18 GPG hard water with no softener - recommend flush + softener discussion.',
    'A.O. Smith', 'GPVL-40', 'AOS-2020-6678-G', 4, 'Garage',
    40, 'GAS', 'Power Vent', 6,
    '{"fuelType": "GAS", "calendarAge": 4, "warrantyYears": 6, "tankCapacity": 40, "hasSoftener": false, "hardnessGPG": 18, "measuredHardnessGPG": 18, "streetHardnessGPG": 18, "housePsi": 58, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 3, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 2, "lastAnodeReplaceYearsAgo": 3, "ventType": "POWER_VENT", "isLeaking": false, "visualRust": false}'::jsonb,
    78, 5.5, 0.22, 10, 2, 'MAINTAIN', 'Flush Recommended', 3,
    'Annual flush due. 18 GPG hard water with no softener - recommend flush and softener discussion.',
    '[]'::jsonb,
    now() - interval '5 days'
  ),
  
  -- MEDIUM: Anderson Home
  (
    'a0000000-0000-0000-0000-000000000008',
    'Anderson Home', '(623) 555-0678', NULL,
    '9900 Cactus Wren Ln', 'Peoria', 'AZ', '85382',
    'flush_due', 'medium', 'pending', 'STANDARD',
    'Flush overdue by 18 months. Electric unit in garage. Moderate hard water area.',
    'Bradford White', 'RE340S6-1NCWW', 'BW-2017-9912-E', 7, 'Garage',
    40, 'ELECTRIC', 'N/A', 6,
    '{"fuelType": "ELECTRIC", "calendarAge": 7, "warrantyYears": 6, "tankCapacity": 40, "hasSoftener": false, "hardnessGPG": 14, "measuredHardnessGPG": 14, "streetHardnessGPG": 16, "housePsi": 68, "hasPrv": true, "hasExpTank": false, "isClosedLoop": false, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 2, "usageType": "light", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 3, "lastAnodeReplaceYearsAgo": 4, "isLeaking": false, "visualRust": false}'::jsonb,
    68, 10.0, 0.32, 6, 2, 'MAINTAIN', 'Flush Overdue', 2,
    'Flush overdue by 18 months. Electric unit in garage. Schedule maintenance soon.',
    '[]'::jsonb,
    now() - interval '6 days'
  ),
  
  -- MEDIUM: Davis Residence
  (
    'a0000000-0000-0000-0000-000000000009',
    'Davis Residence', '(480) 555-0789', NULL,
    '2233 Quail Run', 'Scottsdale', 'AZ', '85255',
    'anode_due', 'medium', 'contacted', 'STANDARD',
    'Anode inspection recommended. 5-year-old unit, softener installed. Good maintenance history.',
    'State Select', 'GS640YBRT', 'SS-2019-1145-G', 5, 'Utility Room',
    40, 'GAS', 'Atmospheric', 6,
    '{"fuelType": "GAS", "calendarAge": 5, "warrantyYears": 6, "tankCapacity": 40, "hasSoftener": true, "hardnessGPG": 5, "measuredHardnessGPG": 5, "streetHardnessGPG": 18, "housePsi": 55, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": true, "tempSetting": "NORMAL", "peopleCount": 3, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 1, "ventType": "ATMOSPHERIC", "isLeaking": false, "visualRust": false}'::jsonb,
    74, 6.5, 0.26, 9, 2, 'MAINTAIN', 'Anode Check Recommended', 2,
    'Anode inspection recommended. 5-year-old unit with softener. Good maintenance history.',
    '[]'::jsonb,
    now() - interval '7 days'
  ),
  
  -- LOW: Miller Family
  (
    'a0000000-0000-0000-0000-00000000000a',
    'Miller Family', '(480) 555-0890', NULL,
    '4455 Dove Valley Rd', 'Cave Creek', 'AZ', '85331',
    'annual_checkup', 'low', 'pending', 'STANDARD',
    'Annual checkup due. 2-year-old unit in excellent condition. Premium install with all components.',
    'Rheem', 'PROG50-42N-RH95', 'RH-2022-8834-G', 2, 'Garage',
    50, 'GAS', 'Direct Vent', 12,
    '{"fuelType": "GAS", "calendarAge": 2, "warrantyYears": 12, "tankCapacity": 50, "hasSoftener": true, "hardnessGPG": 4, "measuredHardnessGPG": 4, "streetHardnessGPG": 16, "housePsi": 58, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": true, "tempSetting": "NORMAL", "peopleCount": 4, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 1, "ventType": "DIRECT_VENT", "isLeaking": false, "visualRust": false}'::jsonb,
    92, 2.5, 0.08, 14, 1, 'MAINTAIN', 'Excellent Condition', 10,
    'Annual checkup due. 2-year-old unit in excellent condition. Premium install with all components.',
    '[]'::jsonb,
    now() - interval '10 days'
  ),
  
  -- LOW: Taylor Home
  (
    'a0000000-0000-0000-0000-00000000000b',
    'Taylor Home', '(480) 555-0901', NULL,
    '6677 Desert Sage Way', 'Fountain Hills', 'AZ', '85268',
    'annual_checkup', 'low', 'pending', 'STANDARD',
    'Annual inspection recommended. 3-year-old electric unit. Customer enrolled in maintenance plan.',
    'A.O. Smith', 'ENS-50', 'AOS-2021-5567-E', 3, 'Laundry Room',
    50, 'ELECTRIC', 'N/A', 6,
    '{"fuelType": "ELECTRIC", "calendarAge": 3, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": true, "hardnessGPG": 6, "measuredHardnessGPG": 6, "streetHardnessGPG": 14, "housePsi": 62, "hasPrv": true, "hasExpTank": true, "isClosedLoop": true, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 2, "usageType": "light", "location": "MAIN_LIVING", "isFinishedArea": true, "lastFlushYearsAgo": 1, "isLeaking": false, "visualRust": false}'::jsonb,
    88, 4.0, 0.12, 12, 1, 'MAINTAIN', 'Good Condition', 4,
    'Annual inspection recommended. 3-year-old electric unit. Customer enrolled in maintenance plan.',
    '[]'::jsonb,
    now() - interval '12 days'
  ),
  
  -- LOW: Garcia Residence
  (
    'a0000000-0000-0000-0000-00000000000c',
    'Garcia Residence', '(623) 555-0234', NULL,
    '8899 Thunderbird Rd', 'Surprise', 'AZ', '85374',
    'annual_checkup', 'low', 'pending', 'STANDARD',
    'Routine annual check. 4-year-old electric unit. No issues reported.',
    'Whirlpool', 'E50H6-45', 'WP-2020-3345-E', 4, 'Garage',
    50, 'ELECTRIC', 'N/A', 6,
    '{"fuelType": "ELECTRIC", "calendarAge": 4, "warrantyYears": 6, "tankCapacity": 50, "hasSoftener": false, "hardnessGPG": 12, "measuredHardnessGPG": 12, "streetHardnessGPG": 14, "housePsi": 65, "hasPrv": true, "hasExpTank": false, "isClosedLoop": false, "hasCircPump": false, "tempSetting": "NORMAL", "peopleCount": 3, "usageType": "normal", "location": "GARAGE", "isFinishedArea": false, "lastFlushYearsAgo": 2, "isLeaking": false, "visualRust": false}'::jsonb,
    85, 5.0, 0.15, 11, 1, 'MAINTAIN', 'Routine Check Due', 3,
    'Routine annual check. 4-year-old electric unit. No issues reported.',
    '[]'::jsonb,
    now() - interval '14 days'
  )
ON CONFLICT (id) DO NOTHING;