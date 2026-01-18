import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaintainRationaleContext {
  // Unit identification
  unitType: 'tank' | 'tankless' | 'hybrid';
  manufacturer?: string;
  model?: string;
  
  // Age and condition
  calendarAge: number;
  bioAge: number;
  fuelType: string;
  tankCapacity?: number;
  warrantyYears?: number;
  warrantyRemaining: number;
  
  // Risk metrics
  healthScore: number;
  failProb: number; // Already a percentage (e.g., 15.5 = 15.5%)
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  
  // Environmental factors
  hardnessGPG: number;
  hasSoftener: boolean;
  housePsi: number;
  installLocation: string;
  isFinishedArea: boolean;
  
  // Maintenance history
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  
  // Recommendation
  recommendationType: 'MAINTAIN' | 'MONITOR';
  recommendationTitle?: string;
  
  // Upcoming maintenance
  upcomingMaintenance?: {
    type: string;
    dueIn: string;
  }[];
}

interface RationaleSection {
  heading: string;
  content: string;
}

interface RationaleResponse {
  sections: RationaleSection[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[generate-maintain-rationale] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { context } = await req.json() as { context: MaintainRationaleContext };
    
    if (!context) {
      return new Response(
        JSON.stringify({ error: "Missing context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-maintain-rationale] Generating for:", {
      calendarAge: context.calendarAge,
      bioAge: context.bioAge,
      failProb: context.failProb,
      healthScore: context.healthScore,
      recommendationType: context.recommendationType,
    });

    const systemPrompt = `You are an expert water heater consultant explaining to a homeowner why their water heater is in good shape and doesn't need replacement.

Your goal is to reassure them while also educating them on what keeps their unit healthy. Be positive, clear, and use their actual data. Avoid jargon.

CRITICAL RULES:
1. Use the SPECIFIC numbers provided (age, health score, failure probability, etc.)
2. Be honest and encouraging - their unit is doing well
3. Keep each section focused and under 60 words
4. Use "your" and "you" to make it personal
5. Explain what's working in their favor
6. Give them actionable next steps for maintenance

CRITICAL - AGING RATE LANGUAGE:
When explaining how equipment protection reduces wear, use PERCENTAGE-BASED language:
- Say "reducing wear by 80%" not "0.2x wear factor"
- Say "water softener cuts chemical stress by 70%" not "0.3x multiplier"
- For benefits: "50% less wear than typical" is clearer than "0.5x"
- Always make the benefit concrete and relatable

Return a JSON object with exactly this structure:
{
  "sections": [
    {"heading": "Why Your Unit Is Healthy", "content": "..."},
    {"heading": "What's Working in Your Favor", "content": "..."},
    {"heading": "Keep It Running Strong", "content": "..."}
  ]
}`;

    const userPrompt = buildUserPrompt(context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-maintain-rationale] AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[generate-maintain-rationale] No JSON in response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as RationaleResponse;
    
    console.log("[generate-maintain-rationale] Generated sections:", parsed.sections.length);

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-maintain-rationale] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildUserPrompt(ctx: MaintainRationaleContext): string {
  const isMonitor = ctx.recommendationType === 'MONITOR';
  
  let prompt = `Generate a personalized explanation for why we're recommending ${isMonitor ? 'monitoring' : 'regular maintenance'} rather than replacement.

## THE HOMEOWNER'S SPECIFIC DATA

**Unit Details:**
- Type: ${ctx.unitType === 'tankless' ? 'Tankless' : ctx.unitType === 'hybrid' ? 'Heat Pump Hybrid' : 'Tank'} water heater
- Brand: ${ctx.manufacturer || 'Unknown brand'}
- Calendar Age: ${ctx.calendarAge} years old
- Biological Age: ${ctx.bioAge.toFixed(1)} years (how worn the unit actually is)
- Warranty: ${ctx.warrantyRemaining > 0 ? `${ctx.warrantyRemaining} years remaining` : 'Expired'}

**Health Metrics (These are GOOD!):**
- Health Score: ${ctx.healthScore}/100
- Failure Probability: Only ${Math.round(ctx.failProb)}% chance of failure in the next 12 months`;

  if (ctx.shieldLife !== undefined && ctx.unitType === 'tank') {
    prompt += `\n- Anode Shield Life: ${ctx.shieldLife.toFixed(0)}% remaining`;
  }
  
  if (ctx.sedimentLbs !== undefined) {
    prompt += `\n- Sediment Level: ~${ctx.sedimentLbs.toFixed(1)} lbs ${ctx.sedimentLbs < 5 ? '(LOW - good!)' : ctx.sedimentLbs < 10 ? '(MODERATE)' : '(NEEDS ATTENTION)'}`;
  }

  prompt += `

**Environmental Factors:**
- Water Hardness: ${ctx.hardnessGPG} GPG ${ctx.hardnessGPG > 15 ? '(VERY HARD)' : ctx.hardnessGPG > 10 ? '(HARD)' : ctx.hardnessGPG > 7 ? '(MODERATE)' : '(SOFT - easier on equipment)'}
- Water Softener: ${ctx.hasSoftener ? 'Yes (protecting the unit)' : 'No water treatment'}
- House Pressure: ${ctx.housePsi} PSI ${ctx.housePsi > 80 ? '(HIGH - consider PRV)' : ctx.housePsi > 70 ? '(ELEVATED)' : '(NORMAL - good)'}
- Location: ${formatLocation(ctx.installLocation)}`;

  prompt += `

**Maintenance History:**`;
  
  if (ctx.lastFlushYearsAgo !== undefined && ctx.unitType === 'tank') {
    const flushStatus = ctx.lastFlushYearsAgo <= 1 ? '(RECENT - great!)' : ctx.lastFlushYearsAgo <= 3 ? '(DUE SOON)' : '(OVERDUE)';
    prompt += `\n- Last flush: ${ctx.lastFlushYearsAgo > 10 ? 'Never or 10+ years ago' : `${ctx.lastFlushYearsAgo} years ago`} ${flushStatus}`;
  }
  if (ctx.lastAnodeReplaceYearsAgo !== undefined && ctx.unitType === 'tank') {
    prompt += `\n- Last anode replacement: ${ctx.lastAnodeReplaceYearsAgo > 10 ? 'Never' : `${ctx.lastAnodeReplaceYearsAgo} years ago`}`;
  }
  if (ctx.lastDescaleYearsAgo !== undefined && ctx.unitType === 'tankless') {
    const descaleStatus = ctx.lastDescaleYearsAgo <= 1 ? '(RECENT - great!)' : ctx.lastDescaleYearsAgo <= 2 ? '(DUE SOON)' : '(OVERDUE)';
    prompt += `\n- Last descale: ${ctx.lastDescaleYearsAgo > 10 ? 'Never' : `${ctx.lastDescaleYearsAgo} years ago`} ${descaleStatus}`;
  }

  prompt += `

**Our Recommendation:** ${ctx.recommendationType === 'MAINTAIN' ? 'MAINTAIN - Keep doing what you\'re doing!' : 'MONITOR - Watch for changes, maintenance recommended'}
${ctx.recommendationTitle ? `Summary: ${ctx.recommendationTitle}` : ''}

---

Generate 3 sections explaining why their unit is in good shape:
1. "Why Your Unit Is Healthy" - Use their ${ctx.healthScore}/100 health score and ${Math.round(ctx.failProb)}% failure probability. Explain why these numbers are reassuring.
2. "What's Working in Your Favor" - Mention specific factors: ${ctx.hasSoftener ? 'water softener protecting the unit,' : ''} ${ctx.housePsi <= 70 ? 'good water pressure,' : ''} ${ctx.calendarAge <= 8 ? 'relatively young age,' : ''} ${ctx.shieldLife && ctx.shieldLife > 50 ? 'good anode protection,' : ''} etc.
3. "Keep It Running Strong" - Specific maintenance recommendations based on their data. What should they do to keep this unit healthy for years to come?

Be encouraging and positive. Use their actual numbers. Give them confidence their unit is doing well.`;

  return prompt;
}

function formatLocation(location: string): string {
  const locationMap: Record<string, string> = {
    'GARAGE': 'Garage',
    'BASEMENT': 'Basement',
    'UTILITY_ROOM': 'Utility Room',
    'ATTIC': 'Attic',
    'CLOSET': 'Interior Closet',
    'CRAWLSPACE': 'Crawl Space',
    'OUTDOOR': 'Outdoor',
  };
  return locationMap[location] || location || 'Unknown';
}
