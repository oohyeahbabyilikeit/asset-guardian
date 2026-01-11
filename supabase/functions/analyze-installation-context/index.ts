import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing installation context from wide-angle photo...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this water heater installation area photo. This is a wide-angle view to identify equipment and installation context.

Look for and identify:

1. EXPANSION TANK: Small tank (usually blue, gray, or white) connected near the water heater, typically on the cold water inlet above or beside the unit
   - Approximate size if visible

2. PRESSURE REDUCING VALVE (PRV): Bell-shaped brass valve, typically on the main water line entering the home
   - May have adjustment screw on top

3. RECIRCULATION PUMP: Small pump on the hot water line, or under a sink
   - Grundfos, Watts, or similar brands
   - May have timer/controller

4. CHECK VALVE / BACKFLOW PREVENTER: Indicates a closed loop system
   - Usually brass fitting on main line
   - May be combined with PRV

5. WATER SOFTENER: Two-tank system (brine tank + resin tank) or cabinet-style unit
   - Note if present nearby

6. WHOLE-HOUSE WATER FILTER: Filter canister on main water line
   - May be clear or opaque housing

7. DRAIN PAN: Metal or plastic pan under the water heater
   - May have drain line attached

8. PIPING MATERIAL: What type of piping is visible?
   - Copper (orange/brown metal)
   - PEX (red/blue/white plastic)
   - CPVC (cream/yellow plastic)
   - Galvanized (gray metal)
   - Mixed

9. LOCATION TYPE: Where is the water heater installed?
   - Garage
   - Basement
   - Utility closet
   - Attic
   - Crawl space
   - Other

Respond with a JSON object (no markdown):
{
  "hasExpTank": boolean | null,
  "expTankSize": "small" | "medium" | "large" | null,
  "hasPrv": boolean | null,
  "hasRecircPump": boolean | null,
  "hasBackflowPreventer": boolean | null,
  "isClosedLoop": boolean | null,
  "hasSoftener": boolean | null,
  "hasWholeHouseFilter": boolean | null,
  "hasDrainPan": boolean | null,
  "pipingMaterial": "copper" | "pex" | "cpvc" | "galvanized" | "mixed" | null,
  "locationType": "garage" | "basement" | "utility_closet" | "attic" | "crawl_space" | "other" | null,
  "additionalNotes": "any other relevant observations",
  "confidence": number 0-100
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      result = {
        hasExpTank: null,
        expTankSize: null,
        hasPrv: null,
        hasRecircPump: null,
        hasBackflowPreventer: null,
        isClosedLoop: null,
        hasSoftener: null,
        hasWholeHouseFilter: null,
        hasDrainPan: null,
        pipingMaterial: null,
        locationType: null,
        additionalNotes: "Could not analyze image",
        confidence: 0
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error analyzing installation context:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
