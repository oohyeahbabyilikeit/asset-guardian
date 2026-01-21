import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RationaleContext {
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
  failProb: number;
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  
  // Environmental factors
  hardnessGPG: number;
  hasSoftener: boolean;
  housePsi: number;
  installLocation: string;
  isFinishedArea: boolean;
  
  // Current state
  visualRust: boolean;
  isLeaking: boolean;
  leakSource?: string;
  
  // Maintenance history
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  
  // Financial context
  estimatedRepairCost: number;
  estimatedReplacementCost: number;
  
  // Recommendation
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON';
  recommendationTitle?: string;
  
  // Stress factors
  stressFactors?: {
    pressure?: number;
    chemical?: number;
    mechanical?: number;
    sediment?: number;
  };
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
      console.error("[generate-replacement-rationale] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { context } = await req.json() as { context: RationaleContext };
    
    if (!context) {
      return new Response(
        JSON.stringify({ error: "Missing context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[generate-replacement-rationale] Generating for:", {
      calendarAge: context.calendarAge,
      bioAge: context.bioAge,
      failProb: context.failProb,
      location: context.installLocation,
      recommendationType: context.recommendationType,
    });

    const systemPrompt = `You are an expert water heater consultant explaining to a homeowner why replacement makes more sense than repair for their specific situation. 

Your goal is to educate, not sell. Be empathetic, clear, and use their actual data to make the case. Avoid jargon. Speak in plain language.

CRITICAL RULES:
1. Use the SPECIFIC numbers provided (age, failure probability, etc.) - don't make up numbers
2. Be honest about the situation - don't exaggerate or minimize
3. Keep each section focused and under 60 words
4. Use "your" and "you" to make it personal
5. Acknowledge this is a significant decision
6. If location is risky (attic, upstairs, finished area), emphasize potential damage costs
7. NEVER mention specific dollar amounts for repairs or replacements - focus on the physics and risk

CRITICAL - AGING RATE LANGUAGE:
When explaining accelerated wear or stress factors, ALWAYS use PERCENTAGE-BASED language:
- NEVER say "1x faster" or "2x wear rate" (confusing multiplier jargon)
- Instead say "100% faster", "twice as fast", "200% faster than normal"
- For reference: 2.0x = "100% faster" or "twice as fast"
- For reference: 7.0x = "600% faster" or "7 times normal wear"
- Always provide context on what "normal" means

Return a JSON object with exactly this structure:
{
  "sections": [
    {"heading": "The Numbers", "content": "..."},
    {"heading": "The Physics", "content": "..."},
    {"heading": "The Risk", "content": "..."},
    {"heading": "The Opportunity", "content": "..."}
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
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[generate-replacement-rationale] AI error:", response.status, errorText);
      
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
      console.error("[generate-replacement-rationale] No JSON in response:", content);
      return new Response(
        JSON.stringify({ error: "Invalid AI response format" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]) as RationaleResponse;
    
    console.log("[generate-replacement-rationale] Generated sections:", parsed.sections.length);

    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-replacement-rationale] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Convert multiplier to percentage-based language
function formatAgingPercent(multiplier: number): string {
  if (multiplier <= 1.05) return 'at normal rate';
  if (multiplier < 1.5) return `${Math.round((multiplier - 1) * 100)}% faster than normal`;
  if (multiplier < 2.05 && multiplier >= 1.95) return 'twice as fast as normal';
  if (multiplier < 3) return `${Math.round((multiplier - 1) * 100)}% faster than normal`;
  return `${Math.round((multiplier - 1) * 100)}% faster (${multiplier.toFixed(0)} times normal wear)`;
}

function buildUserPrompt(ctx: RationaleContext): string {
  const locationRisk = getLocationRisk(ctx.installLocation, ctx.isFinishedArea);
  const isUrgent = ctx.recommendationType === 'REPLACE_NOW';
  
  // Pre-compute aging rate percentages for stress factors
  const pressureRate = ctx.stressFactors?.pressure ? formatAgingPercent(ctx.stressFactors.pressure) : null;
  const chemicalRate = ctx.stressFactors?.chemical ? formatAgingPercent(ctx.stressFactors.chemical) : null;
  const sedimentRate = ctx.stressFactors?.sediment ? formatAgingPercent(ctx.stressFactors.sediment) : null;
  
  let prompt = `Generate a personalized explanation for why we're recommending ${isUrgent ? 'immediate' : 'planned'} replacement over repairs.

## THE HOMEOWNER'S SPECIFIC DATA

**Unit Details:**
- Type: ${ctx.unitType === 'tankless' ? 'Tankless' : ctx.unitType === 'hybrid' ? 'Heat Pump Hybrid' : 'Tank'} water heater
- Brand: ${ctx.manufacturer || 'Unknown brand'}
- Calendar Age: ${ctx.calendarAge} years old
- Biological Age: ${ctx.bioAge.toFixed(1)} years (how worn the unit actually is based on conditions)
- Warranty: ${ctx.warrantyRemaining > 0 ? `${ctx.warrantyRemaining} years remaining` : 'Expired'}

**Risk Assessment:**
- Failure Probability: ${Math.round(ctx.failProb)}% chance of failure in the next 12 months
- Health Score: ${ctx.healthScore}/100`;

  if (ctx.shieldLife !== undefined && ctx.unitType === 'tank') {
    prompt += `\n- Anode Shield Life: ${ctx.shieldLife.toFixed(0)}% remaining`;
  }
  
  if (ctx.sedimentLbs !== undefined && ctx.sedimentLbs > 0) {
    prompt += `\n- Sediment Accumulation: ~${ctx.sedimentLbs.toFixed(1)} lbs in tank`;
  }

  // Add stress factor percentages
  if (pressureRate || chemicalRate || sedimentRate) {
    prompt += `\n\n**Accelerated Wear Factors (use these percentages, NOT multipliers):**`;
    if (pressureRate && pressureRate !== 'at normal rate') {
      prompt += `\n- Pressure stress causing tank to wear ${pressureRate}`;
    }
    if (chemicalRate && chemicalRate !== 'at normal rate') {
      prompt += `\n- Hard water causing chemical wear ${chemicalRate}`;
    }
    if (sedimentRate && sedimentRate !== 'at normal rate') {
      prompt += `\n- Sediment causing heating stress ${sedimentRate}`;
    }
  }

  prompt += `

**Environmental Stress:**
- Water Hardness: ${ctx.hardnessGPG} GPG ${ctx.hardnessGPG > 15 ? '(VERY HARD - accelerates wear)' : ctx.hardnessGPG > 10 ? '(HARD)' : ctx.hardnessGPG > 7 ? '(MODERATE)' : '(SOFT)'}
- Water Softener: ${ctx.hasSoftener ? 'Yes (helps)' : 'No water treatment'}
- House Pressure: ${ctx.housePsi} PSI ${ctx.housePsi > 80 ? '(HIGH - causes stress)' : ctx.housePsi > 70 ? '(ELEVATED)' : '(NORMAL)'}

**Installation Location:**
- Location: ${formatLocation(ctx.installLocation)}
- ${locationRisk.description}
- Risk Level: ${locationRisk.level}`;

  if (ctx.isLeaking) {
    prompt += `\n\n**CRITICAL: Unit is currently leaking from ${ctx.leakSource || 'unknown source'}**`;
  }
  
  if (ctx.visualRust) {
    prompt += `\n**WARNING: Visible rust/corrosion detected**`;
  }

  prompt += `

**Maintenance History:**`;
  
  if (ctx.lastFlushYearsAgo !== undefined) {
    prompt += `\n- Last flush: ${ctx.lastFlushYearsAgo > 10 ? 'Never or 10+ years ago' : `${ctx.lastFlushYearsAgo} years ago`}`;
  }
  if (ctx.lastAnodeReplaceYearsAgo !== undefined && ctx.unitType === 'tank') {
    prompt += `\n- Last anode replacement: ${ctx.lastAnodeReplaceYearsAgo > 10 ? 'Never' : `${ctx.lastAnodeReplaceYearsAgo} years ago`}`;
  }
  if (ctx.lastDescaleYearsAgo !== undefined && ctx.unitType === 'tankless') {
    prompt += `\n- Last descale: ${ctx.lastDescaleYearsAgo > 10 ? 'Never' : `${ctx.lastDescaleYearsAgo} years ago`}`;
  }

  prompt += `

**Our Recommendation:** ${ctx.recommendationType === 'REPLACE_NOW' ? 'REPLACE NOW' : 'PLAN REPLACEMENT SOON'}
${ctx.recommendationTitle ? `Reason: ${ctx.recommendationTitle}` : ''}

---

Generate 4 sections explaining why replacement makes sense:
1. "The Situation" - Describe their unit's condition qualitatively: wear level is ${ctx.bioAge > ctx.calendarAge + 5 ? 'high' : ctx.bioAge > ctx.calendarAge + 2 ? 'elevated' : 'normal'}, risk level is ${ctx.failProb > 30 ? 'high' : ctx.failProb > 15 ? 'moderate' : 'low'}. DO NOT use percentages or specific numbers. Use terms like "elevated risk" or "significant wear" instead.
2. "The Physics" - Explain the technical reasons why repairs don't make sense at this stage (depleted protection, structural fatigue, etc.). NO DOLLAR AMOUNTS, NO PERCENTAGES.
3. "The Risk" - Focus on their ${formatLocation(ctx.installLocation)} installation. ${locationRisk.level === 'HIGH' ? 'Emphasize potential water damage if the unit fails in this location.' : 'Discuss the inconvenience and stress of emergency replacement.'}
4. "The Opportunity" - Benefits of proactive replacement: control timing, compare options, get efficient unit, new warranty, peace of mind.

Be empathetic about the decision. Don't be salesy. NEVER mention specific dollar amounts or percentages. Use qualitative terms only.`;

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

function getLocationRisk(location: string, isFinished: boolean): { level: string; description: string } {
  switch (location) {
    case 'ATTIC':
      return { 
        level: 'HIGH', 
        description: 'Attic installation means any leak can cause ceiling damage, insulation damage, and water damage to rooms below. Emergency access is difficult.' 
      };
    case 'CLOSET':
      if (isFinished) {
        return { 
          level: 'HIGH', 
          description: 'Interior closet in finished living space. A leak here damages flooring, walls, and potentially spreads to adjacent rooms.' 
        };
      }
      return { 
        level: 'MEDIUM', 
        description: 'Interior closet location. Leaks can affect nearby rooms and flooring.' 
      };
    case 'BASEMENT':
      return { 
        level: 'LOW', 
        description: 'Basement with floor drain nearby. Leaks typically contained with minimal damage.' 
      };
    case 'GARAGE':
      return { 
        level: 'LOW', 
        description: 'Garage installation. Concrete floor and drainage typically limit water damage from leaks.' 
      };
    case 'UTILITY_ROOM':
      return { 
        level: 'MEDIUM', 
        description: 'Utility room location. Some leak protection but can still cause damage.' 
      };
    case 'CRAWLSPACE':
      return { 
        level: 'MEDIUM', 
        description: 'Crawl space installation. Leaks can cause moisture issues and are difficult to detect early.' 
      };
    case 'OUTDOOR':
      return { 
        level: 'LOW', 
        description: 'Outdoor installation. Leaks typically drain harmlessly.' 
      };
    default:
      return { 
        level: 'MEDIUM', 
        description: 'Installation location affects potential water damage if unit fails.' 
      };
  }
}
