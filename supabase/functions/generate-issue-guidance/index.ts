import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IssueGuidanceContext {
  issueId: string;
  issueName: string;
  friendlyName: string;
  recommendation: {
    action: 'REPLACE' | 'REPAIR' | 'MAINTAIN' | 'MONITOR';
    reason: string;
  };
  location: string;
  damageScenario: {
    min: number;
    max: number;
    description: string;
  };
  unitAge: number;
  healthScore: number;
  agingRate: number;
  isServiceable: boolean;
  manufacturer?: string;
  stressFactors?: Record<string, number>;
}

interface GuidanceSection {
  headline: string;
  explanation: string;
  yourSituation: string;
  recommendation: string;
  economicContext: string;
  actionItems: string[];
  shouldFix: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json() as { context: IssueGuidanceContext };
    
    if (!context || !context.issueId) {
      return new Response(
        JSON.stringify({ error: "Missing required context" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert plumbing advisor explaining infrastructure issues to homeowners. Your job is to provide clear, honest guidance that factors in:
1. The unit's current condition and age
2. Whether fixing the issue makes economic sense
3. The location-based risk
4. The algorithm's overall recommendation

Be direct and honest. If the unit should be replaced, don't recommend spending money on repairs. If the unit is new and healthy, explain why the fix protects their investment.

IMPORTANT: Do NOT mention any specific prices, costs, or dollar amounts. Focus on the value and importance of addressing the issue, not the cost.

Always respond with a JSON object with these fields:
- headline: A 3-5 word summary of what they should do (e.g., "Protect Your Investment" or "Plan for Replacement")
- explanation: 2-3 sentences explaining what this issue is in plain language
- yourSituation: 2-3 sentences personalizing the guidance to their specific unit, age, and condition
- recommendation: 2-3 sentences with a clear recommendation on what to do NOW
- economicContext: 1-2 sentences about WHY this matters (not specific costs) - focus on protection, prevention, peace of mind
- actionItems: Array of 2-3 specific next steps (use "Have your plumber reach out" not "schedule")
- shouldFix: Boolean - true if they should fix this issue now, false if they should replace the unit instead

Keep language warm but professional. Avoid jargon. Focus on actionable guidance. Never mention specific dollar amounts or prices.`;

    const userPrompt = buildUserPrompt(context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service quota exceeded." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from response");
    }

    const guidance = JSON.parse(jsonMatch[0]) as GuidanceSection;

    return new Response(
      JSON.stringify({ guidance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating issue guidance:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildUserPrompt(ctx: IssueGuidanceContext): string {
  const isReplacementRecommended = ctx.recommendation.action === 'REPLACE';
  const isNewUnit = ctx.unitAge <= 3;
  const isHealthy = ctx.healthScore >= 60;
  const isHighRiskLocation = ['ATTIC', 'UTILITY_CLOSET', 'LIVING_AREA'].includes(ctx.location.toUpperCase());
  
  let situationSummary = '';
  
  if (isReplacementRecommended) {
    situationSummary = `This unit is recommended for REPLACEMENT (reason: ${ctx.recommendation.reason}). The customer should NOT invest in fixing this infrastructure issue because the entire system needs to be replaced. The replacement will include proper infrastructure.`;
  } else if (isNewUnit && isHealthy) {
    situationSummary = `This is a relatively NEW unit (${ctx.unitAge} years old) with good health (${ctx.healthScore}/100). Fixing this issue is a SMART INVESTMENT that will protect the unit for years to come.`;
  } else if (isHealthy) {
    situationSummary = `This unit is in decent condition (health: ${ctx.healthScore}/100) and has life left. Fixing this issue is RECOMMENDED to extend its service life.`;
  } else {
    situationSummary = `This unit is showing wear (health: ${ctx.healthScore}/100, age: ${ctx.unitAge} years). Consider whether fixing this issue makes sense vs. planning for replacement soon.`;
  }

  const locationRisk = isHighRiskLocation
    ? `HIGH RISK LOCATION: ${formatLocation(ctx.location)}. A failure here could cause significant water damage. ${ctx.damageScenario.description}`
    : `LOWER RISK LOCATION: ${formatLocation(ctx.location)}. A failure could still cause damage, but the risk is more manageable.`;

  return `
INFRASTRUCTURE ISSUE: ${ctx.issueName}
Friendly description: ${ctx.friendlyName}

UNIT CONTEXT:
- Age: ${ctx.unitAge} years
- Health Score: ${ctx.healthScore}/100
- Aging Rate: ${ctx.agingRate.toFixed(2)}x (1.0 = normal)
${ctx.manufacturer ? `- Brand: ${ctx.manufacturer}` : ''}

ALGORITHM RECOMMENDATION: ${ctx.recommendation.action}
Reason: ${ctx.recommendation.reason}

SITUATION ASSESSMENT:
${situationSummary}

LOCATION & RISK:
${locationRisk}

IS THIS SERVICEABLE?: ${ctx.isServiceable ? 'Yes - fixing this issue makes sense' : 'No - the unit should be replaced instead'}

Generate personalized guidance for this customer about what "${ctx.issueName}" means for THEIR specific situation. Be honest about whether they should fix this or plan for replacement. Do NOT include any specific dollar amounts or prices in your response.`;
}

function formatLocation(location: string): string {
  const map: Record<string, string> = {
    'ATTIC': 'Attic installation',
    'BASEMENT': 'Basement',
    'GARAGE': 'Garage',
    'UTILITY_CLOSET': 'Utility closet',
    'LIVING_AREA': 'Living area',
    'CRAWLSPACE': 'Crawlspace',
    'EXTERIOR': 'Exterior installation',
  };
  return map[location.toUpperCase()] || location;
}
