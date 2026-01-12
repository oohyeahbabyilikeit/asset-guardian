import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CACHE_DAYS = 365;

interface WaterDistrictResult {
  utilityName: string;
  sanitizer: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
  hardnessGPG: number | null;
  sourceUrl: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zipCode } = await req.json();
    
    if (!zipCode || typeof zipCode !== 'string' || !/^\d{5}$/.test(zipCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid zip code. Must be 5 digits.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-water-quality] Looking up zip: ${zipCode}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const cacheThreshold = new Date();
    cacheThreshold.setDate(cacheThreshold.getDate() - CACHE_DAYS);

    const { data: cached, error: cacheError } = await supabase
      .from('water_districts')
      .select('*')
      .eq('zip_code', zipCode)
      .gte('last_verified', cacheThreshold.toISOString())
      .maybeSingle();

    if (cacheError) {
      console.error('[analyze-water-quality] Cache lookup error:', cacheError);
    }

    if (cached) {
      console.log(`[analyze-water-quality] Cache HIT for ${zipCode}`);
      return new Response(
        JSON.stringify({
          utilityName: cached.utility_name,
          sanitizer: cached.sanitizer_type,
          hardnessGPG: cached.hardness_gpg,
          sourceUrl: cached.source_url,
          confidence: cached.confidence,
          cached: true,
          cachedAt: cached.last_verified
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[analyze-water-quality] Cache MISS for ${zipCode}, calling Lovable AI`);

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a water chemistry forensic expert. Your task is to find the water treatment method for a given US ZIP code.

SEARCH STRATEGY:
1. First identify which city/municipality the ZIP code belongs to
2. Search for that city's water utility or water department
3. Find their Consumer Confidence Report (CCR) or Annual Water Quality Report
4. Look for the "Disinfection" or "Disinfectant" section
5. Determine if they use CHLORINE (Free Chlorine) or CHLORAMINES (Total Chlorine/Monochloramine/Combined Chlorine)

CLASSIFICATION RULES:
- If the report mentions "chloramine", "monochloramine", or "combined chlorine" as the primary disinfectant → CHLORAMINE
- If the report mentions "free chlorine" as the primary disinfectant → CHLORINE  
- If you cannot find definitive information → UNKNOWN

You must return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "utilityName": "Name of the water utility",
  "sanitizer": "CHLORAMINE" or "CHLORINE" or "UNKNOWN",
  "hardnessGPG": number or null (water hardness in grains per gallon if found),
  "sourceUrl": "URL of the CCR or utility water quality page",
  "confidence": number 0-100 (how confident you are in this answer)
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Find the water treatment method (chlorine vs chloramine) for ZIP code ${zipCode}. Search for the Consumer Confidence Report or Annual Water Quality Report for this area.` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[analyze-water-quality] AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits exhausted.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('[analyze-water-quality] AI response:', content);

    // Parse JSON from response (may be wrapped in markdown code blocks)
    let result: WaterDistrictResult;
    try {
      // Try direct parse first
      result = JSON.parse(content);
    } catch {
      // Try extracting from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        // Try finding JSON object in text
        const objectMatch = content.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          result = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not parse JSON from AI response');
        }
      }
    }

    // Validate sanitizer value
    if (!['CHLORINE', 'CHLORAMINE', 'UNKNOWN'].includes(result.sanitizer)) {
      result.sanitizer = 'UNKNOWN';
    }

    // Save to cache
    const { error: upsertError } = await supabase
      .from('water_districts')
      .upsert({
        zip_code: zipCode,
        utility_name: result.utilityName || null,
        sanitizer_type: result.sanitizer,
        hardness_gpg: result.hardnessGPG || null,
        source_url: result.sourceUrl || null,
        confidence: result.confidence || 0,
        last_verified: new Date().toISOString()
      }, { onConflict: 'zip_code' });

    if (upsertError) {
      console.error('[analyze-water-quality] Cache save error:', upsertError);
      // Don't fail the request, just log it
    } else {
      console.log(`[analyze-water-quality] Cached result for ${zipCode}`);
    }

    return new Response(
      JSON.stringify({
        utilityName: result.utilityName,
        sanitizer: result.sanitizer,
        hardnessGPG: result.hardnessGPG,
        sourceUrl: result.sourceUrl,
        confidence: result.confidence,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[analyze-water-quality] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
