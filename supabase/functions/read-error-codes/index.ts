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
    const { imageBase64, brand } = await req.json();
    
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

    console.log("Reading error codes from tankless display...");

    const brandContext = brand ? `This is a ${brand} tankless water heater.` : "This is a tankless water heater display.";

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
                text: `${brandContext}

Analyze this tankless water heater display photo. Extract:
1. Any ERROR CODES shown (e.g., E1, E2, 11, 12, LC, etc.)
2. Current FLOW RATE if displayed (in GPM or L/min)
3. Current TEMPERATURE if displayed
4. Any WARNING indicators

Common error codes by brand:
- Rinnai: 02, 03, 10, 11, 12, 14, 16, 25, 29, 31, 32, 61, 65, 79, LC
- Navien: E003, E004, E012, E016, E030, E047, E109, E110, E302, E407, E515
- Takagi: 031, 111, 121, 140, 211, 311, 391, 651, 661
- Noritz: 10, 11, 12, 14, 16, 29, 31, 32, 33, 61, 65, 71, 90

Respond with a JSON object (no markdown):
{
  "errorCodes": [
    {
      "code": "string",
      "description": "what this error typically means",
      "severity": "info" | "warning" | "critical"
    }
  ],
  "errorCount": number,
  "flowRateGPM": number or null,
  "temperature": number or null,
  "temperatureUnit": "F" | "C" | null,
  "displayStatus": "normal" | "error" | "warning" | "standby",
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
        errorCodes: [],
        errorCount: 0,
        flowRateGPM: null,
        temperature: null,
        temperatureUnit: null,
        displayStatus: "unknown",
        confidence: 0
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error reading error codes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
