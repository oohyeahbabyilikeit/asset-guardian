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

    const systemPrompt = `You are an expert plumbing advisor explaining infrastructure issues to homeowners. Your job is to provide clear, honest guidance based on the algorithm's technical assessment.

CRITICAL RULES:
1. TRUST THE ALGORITHM - The recommendation (action field) is the source of truth. Do NOT override or second-guess it.
2. NO PERCENTAGES OR DOLLAR AMOUNTS - Never mention specific costs, prices, failure rates, or percentages
3. Use qualitative labels only: "elevated wear", "concerning condition", "aging faster than normal"
4. Match your headline to the algorithm's action: REPAIR/MAINTAIN = "Protect Your Investment", REPLACE = "Plan for Replacement", MONITOR = "Stay Vigilant"
5. For REPAIR/MAINTAIN actions on young tanks - emphasize the Infrastructure First approach: fixing the issue now protects a viable unit
6. For REPLACE actions - explain why investing in this fix doesn't make sense when the unit needs replacement anyway
7. For MONITOR actions - explain why no immediate action is needed

Response format (JSON only):
{
  "headline": "3-5 word summary matching the action",
  "explanation": "2-3 sentences explaining what this infrastructure issue is in plain language",
  "yourSituation": "2-3 sentences personalizing to their unit's condition - use qualitative terms, not numbers",
  "recommendation": "2-3 sentences with clear guidance that aligns with the algorithm's action",
  "economicContext": "1-2 sentences about protection value - no dollar amounts",
  "actionItems": ["2-3 specific next steps - use 'Have your plumber reach out' not 'schedule'"],
  "shouldFix": true/false based on whether action is REPAIR/MAINTAIN (true) vs REPLACE/MONITOR (false)
}

Keep language warm but professional. Focus on actionable guidance that matches the algorithm's verdict.`;

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
  const action = ctx.recommendation.action;
  const isRepairAction = action === 'REPAIR' || action === 'MAINTAIN';
  const isReplaceAction = action === 'REPLACE';
  const isMonitorAction = action === 'MONITOR';
  const isYoungTank = ctx.unitAge <= 8;
  const isHighRiskLocation = ['ATTIC', 'UTILITY_CLOSET', 'LIVING_AREA'].includes(ctx.location.toUpperCase());
  
  // Qualitative descriptors based on health
  const healthLabel = ctx.healthScore >= 70 ? 'good condition' :
                      ctx.healthScore >= 40 ? 'fair condition' :
                      'concerning condition';
  
  const agingLabel = ctx.agingRate <= 1.2 ? 'normal aging' :
                     ctx.agingRate <= 2.0 ? 'elevated wear' :
                     ctx.agingRate <= 4.0 ? 'accelerated aging' :
                     'significantly accelerated aging';

  let actionGuidance = '';
  
  if (isReplaceAction) {
    actionGuidance = `ALGORITHM VERDICT: REPLACE - The algorithm has determined this unit needs replacement (reason: ${ctx.recommendation.reason}). 
Do NOT recommend investing in this infrastructure fix. The replacement will include proper infrastructure.
Your guidance should help them understand why their money is better spent on replacement, not repairs.`;
  } else if (isRepairAction && isYoungTank) {
    actionGuidance = `ALGORITHM VERDICT: ${action} - This is a younger tank (${ctx.unitAge} years) that can benefit from infrastructure improvements.
This is an "Infrastructure First" situation - fixing this issue protects a viable unit with remaining service life.
Your guidance should emphasize that addressing this now protects their investment.`;
  } else if (isRepairAction) {
    actionGuidance = `ALGORITHM VERDICT: ${action} - The algorithm recommends addressing this infrastructure issue.
The unit has sufficient remaining value to warrant this investment.
Your guidance should explain the protective value of this fix.`;
  } else if (isMonitorAction) {
    actionGuidance = `ALGORITHM VERDICT: MONITOR - The algorithm has determined no immediate action is needed.
The unit is stable enough that this infrastructure concern doesn't require urgent attention.
Your guidance should reassure them while noting what to watch for.`;
  }

  const locationContext = isHighRiskLocation
    ? `HIGH RISK LOCATION: ${formatLocation(ctx.location)}. A failure here could cause significant water damage.`
    : `STANDARD RISK LOCATION: ${formatLocation(ctx.location)}.`;

  return `
INFRASTRUCTURE ISSUE: ${ctx.issueName}
Friendly description: ${ctx.friendlyName}

UNIT CONTEXT (use qualitative descriptions, not these numbers):
- Age: ${ctx.unitAge} years
- Condition: ${healthLabel}
- Wear pattern: ${agingLabel}
${ctx.manufacturer ? `- Brand: ${ctx.manufacturer}` : ''}

${actionGuidance}

LOCATION CONTEXT:
${locationContext}

IMPORTANT REMINDERS:
- Match your headline to the algorithm's ${action} verdict
- Set shouldFix to ${isRepairAction ? 'true' : 'false'} based on the ${action} action
- Do NOT mention specific percentages, dollar amounts, or failure rates
- Use qualitative terms: "elevated wear", "concerning condition", "healthy unit"

Generate personalized guidance for this homeowner about "${ctx.issueName}".`;
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
