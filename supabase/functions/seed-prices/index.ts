// Seed Database with Real Water Heater Prices
// Uses Gemini AI to fetch current retail prices for known models

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Real water heater models with known specs
const REAL_WATER_HEATERS = [
  // Rheem Gas
  { manufacturer: "Rheem", model: "XG50T06EC36U1", tier: "BUILDER", fuelType: "GAS", capacityGallons: 50, ventType: "ATMOSPHERIC", warrantyYears: 6 },
  { manufacturer: "Rheem", model: "PROG50-36P RH67", tier: "STANDARD", fuelType: "GAS", capacityGallons: 50, ventType: "ATMOSPHERIC", warrantyYears: 9 },
  { manufacturer: "Rheem", model: "PROG50S38N RH95", tier: "PROFESSIONAL", fuelType: "GAS", capacityGallons: 50, ventType: "POWER_VENT", warrantyYears: 12 },
  { manufacturer: "Rheem", model: "PROG50-40P RH67 PV", tier: "STANDARD", fuelType: "GAS", capacityGallons: 50, ventType: "POWER_VENT", warrantyYears: 9 },
  
  // Bradford White Gas
  { manufacturer: "Bradford White", model: "RG250T6N", tier: "STANDARD", fuelType: "GAS", capacityGallons: 50, ventType: "ATMOSPHERIC", warrantyYears: 6 },
  { manufacturer: "Bradford White", model: "RG250S6N", tier: "PROFESSIONAL", fuelType: "GAS", capacityGallons: 50, ventType: "ATMOSPHERIC", warrantyYears: 10 },
  { manufacturer: "Bradford White", model: "URG250T6N", tier: "PROFESSIONAL", fuelType: "GAS", capacityGallons: 50, ventType: "POWER_VENT", warrantyYears: 10 },
  
  // A.O. Smith Gas
  { manufacturer: "A.O. Smith", model: "GPVT-50", tier: "BUILDER", fuelType: "GAS", capacityGallons: 50, ventType: "POWER_VENT", warrantyYears: 6 },
  { manufacturer: "A.O. Smith", model: "GPVL-50", tier: "PROFESSIONAL", fuelType: "GAS", capacityGallons: 50, ventType: "POWER_VENT", warrantyYears: 12 },
  { manufacturer: "A.O. Smith", model: "GCG-50", tier: "STANDARD", fuelType: "GAS", capacityGallons: 50, ventType: "ATMOSPHERIC", warrantyYears: 9 },
  
  // Electric variants
  { manufacturer: "Rheem", model: "XE50T10H45U0", tier: "BUILDER", fuelType: "ELECTRIC", capacityGallons: 50, ventType: "NONE", warrantyYears: 6 },
  { manufacturer: "Rheem", model: "PROE50 T2 RH95", tier: "PROFESSIONAL", fuelType: "ELECTRIC", capacityGallons: 50, ventType: "NONE", warrantyYears: 12 },
  { manufacturer: "A.O. Smith", model: "ENS-50", tier: "STANDARD", fuelType: "ELECTRIC", capacityGallons: 50, ventType: "NONE", warrantyYears: 9 },
  { manufacturer: "Bradford White", model: "RE350T6", tier: "STANDARD", fuelType: "ELECTRIC", capacityGallons: 50, ventType: "NONE", warrantyYears: 6 },
  
  // 40-gallon variants
  { manufacturer: "Rheem", model: "XG40T06EC36U1", tier: "BUILDER", fuelType: "GAS", capacityGallons: 40, ventType: "ATMOSPHERIC", warrantyYears: 6 },
  { manufacturer: "A.O. Smith", model: "GCG-40", tier: "STANDARD", fuelType: "GAS", capacityGallons: 40, ventType: "ATMOSPHERIC", warrantyYears: 9 },
  { manufacturer: "Rheem", model: "XE40M06ST45U1", tier: "BUILDER", fuelType: "ELECTRIC", capacityGallons: 40, ventType: "NONE", warrantyYears: 6 },
];

// Default contractor installation presets
const DEFAULT_INSTALL_PRESETS = [
  // Atmospheric (cheapest to install - standard B-vent)
  { vent_type: 'ATMOSPHERIC', complexity: 'STANDARD', labor_cost_usd: 400, materials_cost_usd: 100, permit_cost_usd: 75, estimated_hours: 2.5, description: 'Standard swap, same location, existing venting' },
  { vent_type: 'ATMOSPHERIC', complexity: 'CODE_UPGRADE', labor_cost_usd: 560, materials_cost_usd: 200, permit_cost_usd: 100, estimated_hours: 4, description: 'Requires PRV, expansion tank, or drain pan upgrades' },
  { vent_type: 'ATMOSPHERIC', complexity: 'DIFFICULT_ACCESS', labor_cost_usd: 640, materials_cost_usd: 150, permit_cost_usd: 75, estimated_hours: 5, description: 'Attic, crawlspace, or tight utility closet' },
  
  // Power Vent (requires PVC, blower motor, electrical)
  { vent_type: 'POWER_VENT', complexity: 'STANDARD', labor_cost_usd: 600, materials_cost_usd: 250, permit_cost_usd: 100, estimated_hours: 3.5, description: 'Standard swap with existing power vent setup' },
  { vent_type: 'POWER_VENT', complexity: 'CODE_UPGRADE', labor_cost_usd: 840, materials_cost_usd: 350, permit_cost_usd: 150, estimated_hours: 5, description: 'Convert from atmospheric or add code requirements' },
  { vent_type: 'POWER_VENT', complexity: 'DIFFICULT_ACCESS', labor_cost_usd: 920, materials_cost_usd: 300, permit_cost_usd: 100, estimated_hours: 6, description: 'Difficult location with power vent conversion' },
  
  // Direct Vent (sealed combustion, wall termination)
  { vent_type: 'DIRECT_VENT', complexity: 'STANDARD', labor_cost_usd: 550, materials_cost_usd: 200, permit_cost_usd: 100, estimated_hours: 3, description: 'Standard swap with existing direct vent' },
  { vent_type: 'DIRECT_VENT', complexity: 'CODE_UPGRADE', labor_cost_usd: 770, materials_cost_usd: 300, permit_cost_usd: 125, estimated_hours: 4.5, description: 'New direct vent installation or code upgrades' },
  { vent_type: 'DIRECT_VENT', complexity: 'DIFFICULT_ACCESS', labor_cost_usd: 850, materials_cost_usd: 250, permit_cost_usd: 100, estimated_hours: 5.5, description: 'Difficult access with direct vent' },
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const results = {
      unitPrices: { success: 0, failed: 0, errors: [] as string[] },
      installPresets: { success: 0, failed: 0 },
    };

    // ===================================
    // 1. SEED UNIT PRICES WITH AI LOOKUP
    // ===================================
    console.log('🔍 Starting AI price lookup for', REAL_WATER_HEATERS.length, 'water heaters...');

    for (const heater of REAL_WATER_HEATERS) {
      try {
        // Check if we already have a recent price for this model
        const { data: existingPrice } = await supabase
          .from('unit_prices')
          .select('*')
          .eq('model_number', heater.model)
          .eq('manufacturer', heater.manufacturer)
          .gte('lookup_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .single();

        if (existingPrice) {
          console.log(`✓ Already have recent price for ${heater.manufacturer} ${heater.model}`);
          results.unitPrices.success++;
          continue;
        }

        // Call Gemini for price lookup
        const aiPrompt = `You are a water heater pricing specialist. Look up the current 2025 retail price for this specific water heater:

Manufacturer: ${heater.manufacturer}
Model Number: ${heater.model}
Type: ${heater.fuelType} ${heater.capacityGallons}-gallon ${heater.ventType === 'NONE' ? '' : heater.ventType.replace('_', ' ')}
Warranty: ${heater.warrantyYears} years

Return the price as a JSON object with these exact fields:
{
  "retailPrice": <number in USD>,
  "wholesalePrice": <number in USD, typically 70-75% of retail>,
  "confidenceScore": <0.0 to 1.0 based on data freshness>,
  "priceSource": "<where you found this price>"
}

Be accurate. If you cannot find an exact price, estimate based on similar models in the same tier. ${heater.tier} grade ${heater.fuelType.toLowerCase()} water heaters typically range:
- BUILDER: $500-750 retail
- STANDARD: $750-1100 retail  
- PROFESSIONAL: $1100-1600 retail
- PREMIUM: $1600-2500 retail

Add $150-300 for POWER_VENT, $100-200 for DIRECT_VENT.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a water heater pricing database. Return only valid JSON.' },
              { role: 'user', content: aiPrompt }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'set_price',
                description: 'Store the water heater price data',
                parameters: {
                  type: 'object',
                  properties: {
                    retailPrice: { type: 'number', description: 'Retail price in USD' },
                    wholesalePrice: { type: 'number', description: 'Wholesale price in USD' },
                    confidenceScore: { type: 'number', description: 'Confidence 0.0-1.0' },
                    priceSource: { type: 'string', description: 'Source of price data' },
                  },
                  required: ['retailPrice', 'confidenceScore'],
                },
              },
            }],
            tool_choice: { type: 'function', function: { name: 'set_price' } },
          }),
        });

        if (!aiResponse.ok) {
          throw new Error(`AI API returned ${aiResponse.status}`);
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall?.function?.arguments) {
          throw new Error('No price data in AI response');
        }

        const priceData = JSON.parse(toolCall.function.arguments);

        // Store in database
        const { error: insertError } = await supabase
          .from('unit_prices')
          .upsert({
            model_number: heater.model,
            manufacturer: heater.manufacturer,
            fuel_type: heater.fuelType,
            capacity_gallons: heater.capacityGallons,
            vent_type: heater.ventType === 'NONE' ? 'ATMOSPHERIC' : heater.ventType,
            warranty_years: heater.warrantyYears,
            quality_tier: heater.tier,
            retail_price_usd: priceData.retailPrice,
            wholesale_price_usd: priceData.wholesalePrice || Math.round(priceData.retailPrice * 0.72),
            confidence_score: priceData.confidenceScore,
            price_source: priceData.priceSource || 'AI_LOOKUP',
            lookup_date: new Date().toISOString(),
          }, {
            onConflict: 'model_number,manufacturer',
          });

        if (insertError) {
          console.error(`Failed to store price for ${heater.model}:`, insertError);
          results.unitPrices.failed++;
          results.unitPrices.errors.push(`${heater.model}: ${insertError.message}`);
        } else {
          console.log(`✓ Stored price for ${heater.manufacturer} ${heater.model}: $${priceData.retailPrice}`);
          results.unitPrices.success++;
        }

        // Rate limit: wait 500ms between AI calls
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`Error processing ${heater.model}:`, err);
        results.unitPrices.failed++;
        results.unitPrices.errors.push(`${heater.model}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // ===================================
    // 2. SEED DEFAULT CONTRACTOR PRESETS
    // ===================================
    console.log('\n📋 Seeding default contractor installation presets...');

    const DEMO_CONTRACTOR_ID = '00000000-0000-0000-0000-000000000001';

    for (const preset of DEFAULT_INSTALL_PRESETS) {
      try {
        // Don't include total_install_cost_usd - it's a generated column
        const { error } = await supabase
          .from('contractor_install_presets')
          .upsert({
            contractor_id: DEMO_CONTRACTOR_ID,
            vent_type: preset.vent_type,
            complexity: preset.complexity,
            labor_cost_usd: preset.labor_cost_usd,
            materials_cost_usd: preset.materials_cost_usd,
            permit_cost_usd: preset.permit_cost_usd,
            estimated_hours: preset.estimated_hours,
            description: preset.description,
          }, {
            onConflict: 'contractor_id,vent_type,complexity',
          });

        if (error) {
          console.error(`Failed to insert preset ${preset.vent_type}/${preset.complexity}:`, error);
          results.installPresets.failed++;
        } else {
          const totalCost = preset.labor_cost_usd + preset.materials_cost_usd + preset.permit_cost_usd;
          console.log(`✓ Preset: ${preset.vent_type} / ${preset.complexity} = $${totalCost}`);
          results.installPresets.success++;
        }
      } catch (err) {
        console.error('Preset error:', err);
        results.installPresets.failed++;
      }
    }

    // Return summary
    return new Response(JSON.stringify({
      success: true,
      message: 'Database seeded with real water heater prices',
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Seed function error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
