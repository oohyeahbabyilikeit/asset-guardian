import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceLookupRequest {
  type: 'MODEL' | 'SPECS';
  modelNumber?: string;
  manufacturer?: string;
  specs?: {
    fuelType: string;
    capacityGallons: number;
    ventType: string;
    warrantyYears: number;
    qualityTier: string;
  };
}

interface PriceResult {
  retailPrice: number;
  wholesalePrice?: number;
  manufacturer: string;
  model?: string;
  tier: string;
  warrantyYears: number;
  fuelType: string;
  ventType: string;
  capacityGallons: number;
  confidence: number;
  source: string;
  cached: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body: PriceLookupRequest = await req.json();

    console.log("Price lookup request:", JSON.stringify(body));

    // Generate cache key
    const cacheKey = body.type === 'MODEL' 
      ? `MODEL:${body.modelNumber?.toUpperCase()}`
      : `SPECS:${body.specs?.fuelType}:${body.specs?.capacityGallons}:${body.specs?.ventType}:${body.specs?.warrantyYears}:${body.specs?.qualityTier}`;

    // Check cache first
    const { data: cached } = await supabase
      .from('price_lookup_cache')
      .select('result_json, expires_at')
      .eq('lookup_key', cacheKey)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log("Cache hit for:", cacheKey);
      const result = cached.result_json as PriceResult;
      return new Response(JSON.stringify({ ...result, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we have this in unit_prices table
    let existingPrice;
    if (body.type === 'MODEL' && body.modelNumber) {
      const { data } = await supabase
        .from('unit_prices')
        .select('*')
        .ilike('model_number', body.modelNumber)
        .order('lookup_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      existingPrice = data;
    } else if (body.type === 'SPECS' && body.specs) {
      const { data } = await supabase
        .from('unit_prices')
        .select('*')
        .eq('fuel_type', body.specs.fuelType)
        .eq('capacity_gallons', body.specs.capacityGallons)
        .eq('vent_type', body.specs.ventType)
        .eq('warranty_years', body.specs.warrantyYears)
        .eq('quality_tier', body.specs.qualityTier)
        .order('lookup_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      existingPrice = data;
    }

    // If we have a recent price (< 30 days), use it
    if (existingPrice) {
      const lookupDate = new Date(existingPrice.lookup_date);
      const daysSinceLookup = (Date.now() - lookupDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLookup < 30) {
        console.log("Using existing price from DB:", existingPrice.id);
        const result: PriceResult = {
          retailPrice: parseFloat(existingPrice.retail_price_usd),
          wholesalePrice: existingPrice.wholesale_price_usd ? parseFloat(existingPrice.wholesale_price_usd) : undefined,
          manufacturer: existingPrice.manufacturer || 'Unknown',
          model: existingPrice.model_number || undefined,
          tier: existingPrice.quality_tier,
          warrantyYears: existingPrice.warranty_years,
          fuelType: existingPrice.fuel_type,
          ventType: existingPrice.vent_type,
          capacityGallons: existingPrice.capacity_gallons,
          confidence: existingPrice.confidence_score ? parseFloat(existingPrice.confidence_score) : 0.9,
          source: existingPrice.price_source || 'DATABASE',
          cached: true,
        };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Call AI for price lookup
    const prompt = body.type === 'MODEL'
      ? `Look up the current retail price for water heater model number: ${body.modelNumber}${body.manufacturer ? ` by ${body.manufacturer}` : ''}.
         
         Return the following information in JSON format:
         - retailPrice: current retail price in USD (number)
         - wholesalePrice: estimated contractor/wholesale price in USD (number, typically 60-70% of retail)
         - manufacturer: brand name
         - tier: quality tier (BUILDER, STANDARD, PROFESSIONAL, or PREMIUM)
         - warrantyYears: warranty length in years
         - fuelType: GAS, ELECTRIC, or HYBRID
         - ventType: ATMOSPHERIC, POWER_VENT, or DIRECT_VENT
         - capacityGallons: tank capacity
         - confidence: your confidence in this price accuracy (0.0-1.0)
         - source: where you found this information
         
         If you cannot find the exact model, estimate based on similar models from the same manufacturer and tier.`
      : `Estimate the current retail price for a water heater with these specifications:
         - Fuel Type: ${body.specs?.fuelType}
         - Capacity: ${body.specs?.capacityGallons} gallons
         - Venting: ${body.specs?.ventType}
         - Warranty: ${body.specs?.warrantyYears} years
         - Quality Tier: ${body.specs?.qualityTier}
         
         Return the following information in JSON format:
         - retailPrice: estimated retail price in USD (number)
         - wholesalePrice: estimated contractor/wholesale price in USD (number, typically 60-70% of retail)
         - manufacturer: most likely brand for this tier (e.g., Rheem, Bradford White, AO Smith)
         - tier: ${body.specs?.qualityTier}
         - warrantyYears: ${body.specs?.warrantyYears}
         - fuelType: ${body.specs?.fuelType}
         - ventType: ${body.specs?.ventType}
         - capacityGallons: ${body.specs?.capacityGallons}
         - confidence: your confidence in this price accuracy (0.0-1.0)
         - source: basis for estimate (e.g., "industry average for tier")`;

    console.log("Calling AI for price lookup...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a water heater pricing expert. Return only valid JSON with no markdown formatting or code blocks. Be accurate with current market prices for 2025."
          },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_price",
              description: "Return the water heater price information",
              parameters: {
                type: "object",
                properties: {
                  retailPrice: { type: "number", description: "Retail price in USD" },
                  wholesalePrice: { type: "number", description: "Wholesale/contractor price in USD" },
                  manufacturer: { type: "string", description: "Brand name" },
                  tier: { type: "string", enum: ["BUILDER", "STANDARD", "PROFESSIONAL", "PREMIUM"] },
                  warrantyYears: { type: "number" },
                  fuelType: { type: "string", enum: ["GAS", "ELECTRIC", "HYBRID"] },
                  ventType: { type: "string", enum: ["ATMOSPHERIC", "POWER_VENT", "DIRECT_VENT"] },
                  capacityGallons: { type: "number" },
                  confidence: { type: "number", description: "Confidence 0-1" },
                  source: { type: "string", description: "Source of price info" }
                },
                required: ["retailPrice", "manufacturer", "tier", "warrantyYears", "fuelType", "ventType", "capacityGallons", "confidence", "source"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_price" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    // Extract result from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call response from AI");
    }

    const priceData = JSON.parse(toolCall.function.arguments);
    
    const result: PriceResult = {
      retailPrice: priceData.retailPrice,
      wholesalePrice: priceData.wholesalePrice,
      manufacturer: priceData.manufacturer,
      model: body.modelNumber,
      tier: priceData.tier,
      warrantyYears: priceData.warrantyYears,
      fuelType: priceData.fuelType,
      ventType: priceData.ventType,
      capacityGallons: priceData.capacityGallons,
      confidence: priceData.confidence,
      source: 'AI_LOOKUP',
      cached: false,
    };

    // Store in unit_prices table
    const { error: insertError } = await supabase
      .from('unit_prices')
      .insert({
        model_number: body.modelNumber || null,
        manufacturer: result.manufacturer,
        fuel_type: result.fuelType,
        capacity_gallons: result.capacityGallons,
        vent_type: result.ventType,
        warranty_years: result.warrantyYears,
        quality_tier: result.tier,
        retail_price_usd: result.retailPrice,
        wholesale_price_usd: result.wholesalePrice || null,
        price_source: 'AI_LOOKUP',
        source_url: priceData.source,
        confidence_score: result.confidence,
      });

    if (insertError) {
      console.error("Error storing price:", insertError);
    }

    // Cache the result
    await supabase
      .from('price_lookup_cache')
      .upsert({
        lookup_key: cacheKey,
        lookup_type: body.type,
        result_json: result,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'lookup_key' });

    console.log("Price lookup complete:", result.retailPrice);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Price lookup error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});