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

    console.log("Scanning softener data plate...");

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
                text: `Analyze this water softener data plate/label image. Extract:

1. BRAND/MANUFACTURER: Look for company names like Culligan, Kinetico, GE, Whirlpool, Morton, Fleck, Clack, Pentair, WaterBoss, Kenmore, Rainsoft, EcoWater, etc.
2. MODEL NUMBER: Alphanumeric identifier
3. SERIAL NUMBER: For age dating
4. CAPACITY: In grains (e.g., 24,000, 32,000, 48,000, 64,000 grains)
5. CONTROL TYPE: Digital/metered vs analog/timer
6. MANUFACTURE DATE: Often encoded in serial or shown directly

Quality tier indicators:
- CABINET: All-in-one units, compact design
- STANDARD: Separate brine and resin tanks
- PREMIUM: Kinetico, high-end Culligan, twin-tank systems

Respond with a JSON object (no markdown):
{
  "brand": "string or null",
  "model": "string or null",
  "serialNumber": "string or null",
  "capacityGrains": number or null,
  "qualityTier": "CABINET" | "STANDARD" | "PREMIUM" | null,
  "controlHead": "DIGITAL" | "ANALOG" | null,
  "manufactureYear": number or null,
  "estimatedAge": number or null,
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
        brand: null,
        model: null,
        serialNumber: null,
        capacityGrains: null,
        qualityTier: null,
        controlHead: null,
        manufactureYear: null,
        estimatedAge: null,
        confidence: 0
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error scanning softener plate:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
