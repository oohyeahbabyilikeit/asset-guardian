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

    console.log("Analyzing unit condition from photo...");

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
                text: `Analyze this water heater photo for visual condition and equipment. Look for:

1. RUST/CORROSION: Any orange/brown discoloration, flaking metal, oxidation on tank or fittings
2. LEAKING: Water stains, wet spots, mineral deposits from water drips, puddles, moisture trails
3. GENERAL CONDITION: Overall state of the unit

4. TEMPERATURE DIAL: Look for the thermostat dial/setting on the unit
   - LOW (vacation/pilot mode, ~90-100°F)
   - NORMAL (A/B setting, ~120°F)
   - HOT (high setting, ~140°F+)
   - Not visible

5. EXPANSION TANK: Look for a small tank (usually blue/gray) connected to cold water inlet above/near the water heater
   - Present and appears normal
   - Present but shows corrosion/age
   - Not visible in photo

6. PRESSURE REDUCING VALVE (PRV): Bell-shaped brass valve on the main water line
   - Present
   - Not visible

7. ANODE ROD PORT: Hex bolt on top of tank (may require looking at top of unit)
   - Clean/serviced appearance
   - Corroded/never serviced appearance
   - Not visible

8. DRAIN VALVE CONDITION: Look at bottom drain spigot
   - Clean (flushed recently)
   - Mineral buildup visible (needs flush)
   - Leaking/dripping

Respond with a JSON object (no markdown):
{
  "visualRust": boolean (true if ANY rust or corrosion visible),
  "isLeaking": boolean (true if ANY water damage, stains, or active leaks visible),
  "rustSeverity": "none" | "minor" | "moderate" | "severe",
  "leakSeverity": "none" | "minor" | "moderate" | "severe",
  "rustDetails": "description of rust location and extent",
  "leakDetails": "description of leak indicators",
  "overallCondition": "good" | "fair" | "poor" | "critical",
  "tempDialSetting": "LOW" | "NORMAL" | "HOT" | null,
  "hasExpTankVisible": boolean | null,
  "expTankCondition": "good" | "aged" | null,
  "hasPrvVisible": boolean | null,
  "anodePortCondition": "serviced" | "corroded" | "not_visible",
  "drainValveCondition": "clean" | "mineral_buildup" | "leaking" | "not_visible",
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

    // Parse the JSON response
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
        visualRust: false,
        isLeaking: false,
        rustSeverity: "none",
        leakSeverity: "none",
        rustDetails: "Could not analyze image",
        leakDetails: "Could not analyze image",
        overallCondition: "unknown",
        tempDialSetting: null,
        hasExpTankVisible: null,
        expTankCondition: null,
        hasPrvVisible: null,
        anodePortCondition: "not_visible",
        drainValveCondition: "not_visible",
        confidence: 0
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error analyzing unit condition:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
