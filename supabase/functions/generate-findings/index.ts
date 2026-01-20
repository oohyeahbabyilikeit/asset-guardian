import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FindingContext {
  // Unit details
  unitType: 'tank' | 'tankless' | 'hybrid';
  manufacturer?: string;
  model?: string;
  calendarAge: number;
  bioAge: number;
  fuelType: string;
  tankCapacity?: number;
  warrantyYears?: number;
  
  // Water quality
  hardnessGPG: number;
  hasSoftener: boolean;
  
  // Pressure & infrastructure
  housePsi: number;
  // Effective PSI includes thermal expansion spikes (e.g., 120 PSI in closed loop)
  effectivePsi?: number;
  // True if pressure cycles between normal and spike (cyclic fatigue is worse than static load)
  isTransientPressure?: boolean;
  hasPrv: boolean;
  hasExpTank: boolean;
  expTankStatus?: string;
  isClosedLoop: boolean;
  
  // Maintenance history
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  
  // Visual inspection
  visualRust: boolean;
  isLeaking: boolean;
  leakSource?: string;
  
  // Algorithm metrics
  healthScore: number;
  failProb: number; // Already a percentage (e.g., 39.2 = 39.2%)
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  
  // Stress factors
  stressFactors: {
    pressure?: number;
    chemical?: number;
    mechanical?: number;
    sediment?: number;
  };
  
  // Recommendation context
  isReplacementRecommended: boolean;
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR';
}

interface FindingRequest {
  findingType: string;
  context: FindingContext;
}

interface GeneratedFinding {
  title: string;
  measurement: string;
  explanation: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { findingType, context } = await req.json() as FindingRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

const systemPrompt = `You are generating finding card content for a water heater assessment app. 
Your job is to create clear, personalized content that explains issues in plain language using the homeowner's ACTUAL DATA.

RULES:
1. Reference SPECIFIC numbers from their data (PSI, GPG, age, etc.)
2. Explain the IMPACT on THEIR specific unit
3. Use conversational but professional tone
4. Keep explanations under 80 words
5. Never use generic templates - every response should feel personalized
6. If replacement is recommended, frame findings as "what caused this" rather than "what to fix"
7. For measurement field, use their actual readings or timeframes

CRITICAL - AGING RATE LANGUAGE:
When explaining stress factors or accelerated wear, ALWAYS use PERCENTAGE-BASED language, NOT multipliers.
- NEVER say "1x faster" (confusing - sounds like no change)
- NEVER say "ages at 2x rate" or "3x wear factor" (jargon)
- Instead use percentages: "100% faster", "200% faster", "twice as fast"
- For reference: 2.0x multiplier = "100% faster" or "twice as fast"
- For reference: 7.0x multiplier = "600% faster" or "7 times normal"
- For reference: 1.5x multiplier = "50% faster"
- Always explain what "normal" means for context

Return ONLY valid JSON with this structure:
{
  "title": "Short descriptive title (3-6 words)",
  "measurement": "Their specific reading or timeframe",
  "explanation": "Personalized explanation referencing their data"
}`;

    const userPrompt = buildUserPrompt(findingType, context);

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in response");
    }

    // Parse the JSON from the response - handle various AI output formats
    let finding: GeneratedFinding;
    
    try {
      // First, try to extract JSON from markdown code blocks
      let jsonString = content;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1].trim();
      }
      
      // Find the JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }
      
      // Clean the JSON string - remove any trailing commas before closing braces
      let cleanJson = jsonMatch[0]
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/[\x00-\x1F\x7F]/g, ' '); // Remove control characters
      
      finding = JSON.parse(cleanJson);
      
      // Validate required fields
      if (!finding.title || !finding.measurement || !finding.explanation) {
        throw new Error("Missing required fields in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      // Fallback: try to extract fields manually using regex
      const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
      const measurementMatch = content.match(/"measurement"\s*:\s*"([^"]+)"/i);
      const explanationMatch = content.match(/"explanation"\s*:\s*"([^"]+)"/);
      
      if (titleMatch && measurementMatch && explanationMatch) {
        finding = {
          title: titleMatch[1],
          measurement: measurementMatch[1],
          explanation: explanationMatch[1]
        };
      } else {
        throw new Error(`Could not parse JSON from response: ${parseError instanceof Error ? parseError.message : 'Unknown'}`);
      }
    }

    return new Response(JSON.stringify(finding), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("generate-findings error:", error);
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
  // For high multipliers, use both percentage and "X times" for clarity
  return `${Math.round((multiplier - 1) * 100)}% faster (${multiplier.toFixed(0)} times normal wear)`;
}

function buildUserPrompt(findingType: string, ctx: FindingContext): string {
  const unitDesc = ctx.manufacturer 
    ? `${ctx.manufacturer} ${ctx.unitType} water heater` 
    : `${ctx.unitType} water heater`;
  
  const baseInfo = `
UNIT: ${unitDesc}
Calendar Age: ${ctx.calendarAge} years
Biological Age: ${ctx.bioAge.toFixed(1)} years
Fuel Type: ${ctx.fuelType}
${ctx.tankCapacity ? `Tank Capacity: ${ctx.tankCapacity} gallons` : ''}
Health Score: ${ctx.healthScore}/100
Replacement Recommended: ${ctx.isReplacementRecommended ? 'YES' : 'NO'}
`;

  switch (findingType) {
    case 'leak-tank-body':
      return `${baseInfo}
FINDING: Tank body leak detected
Leak Source: ${ctx.leakSource || 'TANK_BODY'}

Generate finding explaining this is a critical failure requiring immediate replacement. The tank wall has been breached by internal corrosion.`;

    case 'leak-heat-exchanger':
      return `${baseInfo}
FINDING: Heat exchanger leak detected
This is a tankless unit with a leak from the heat exchanger core.

Generate finding explaining this critical failure. Heat exchanger cannot be economically repaired.`;

    case 'leak-fitting':
      return `${baseInfo}
FINDING: Fitting/valve leak detected
Leak Source: ${ctx.leakSource}

Generate finding explaining this is REPAIRABLE - good news. A plumber can fix this without replacing the unit.`;

    case 'leak-drain-pan':
      return `${baseInfo}
FINDING: Water in drain pan
Generate finding explaining this needs investigation - could be condensation, minor drip, or early warning sign.`;

    case 'pressure-critical':
      // IMPORTANT: Distinguish between baseline PSI and effective PSI (thermal spikes)
      const effectivePsiCrit = ctx.effectivePsi || ctx.housePsi;
      const isTransientCrit = ctx.isTransientPressure ?? false;
      const pressureMultiplierCrit = ctx.stressFactors.pressure || 1;
      const pressurePercentCrit = formatAgingPercent(pressureMultiplierCrit);
      return `${baseInfo}
FINDING: Critical high pressure
Baseline House PSI: ${ctx.housePsi} (measured at meter)
Effective PSI (what tank experiences): ${effectivePsiCrit} PSI
${isTransientCrit 
  ? `IMPORTANT: The ${effectivePsiCrit} PSI is from THERMAL EXPANSION SPIKES, not constant pressure. 
   The tank cycles between ${ctx.housePsi} PSI and ${effectivePsiCrit} PSI every time it heats. 
   This cyclic fatigue (like bending a paper clip back and forth) is MORE damaging than constant pressure.` 
  : `This is constant high pressure, not cyclic.`}
Has PRV: ${ctx.hasPrv ? 'Yes' : 'No'}
Has Expansion Tank: ${ctx.hasExpTank ? 'Yes' : 'No'}
Expansion Tank Status: ${ctx.expTankStatus || 'Unknown'}

AGING RATE IMPACT: ${pressurePercentCrit}
(This means the pressure stress is causing the tank to age ${pressurePercentCrit} compared to a tank with normal 50-60 PSI pressure.)

${ctx.isReplacementRecommended 
  ? `Frame as: Years of pressure spikes (${effectivePsiCrit} PSI thermal expansion, not the ${ctx.housePsi} PSI baseline) accelerated failure. Use "${pressurePercentCrit}" to explain wear - NOT "${pressureMultiplierCrit.toFixed(1)}x". Advise PRV + expansion tank for next unit.`
  : 'Frame as: Current danger requiring immediate PRV installation/adjustment.'}`;

    case 'pressure-high':
      return `${baseInfo}
FINDING: Elevated pressure (not critical)
House PSI: ${ctx.housePsi} (optimal: 40-60 PSI)
Has PRV: ${ctx.hasPrv ? 'Yes' : 'No'}

${ctx.isReplacementRecommended
  ? 'Frame as: Elevated pressure contributed to wear over time.'
  : 'Frame as: Above optimal range, adding gradual wear. PRV would help.'}`;

    case 'expansion-tank':
      // IMPORTANT: Expansion tank issues cause THERMAL SPIKES, not constant high pressure
      const effectivePsiExp = ctx.effectivePsi || ctx.housePsi;
      const isTransientExp = ctx.isTransientPressure ?? false;
      const pressureMultiplierExp = ctx.stressFactors.pressure || 1;
      const pressurePercentExp = formatAgingPercent(pressureMultiplierExp);
      return `${baseInfo}
FINDING: Thermal expansion issue
Has Expansion Tank: ${ctx.hasExpTank ? 'Yes' : 'No'}
Expansion Tank Status: ${ctx.expTankStatus || 'Unknown'}
Is Closed Loop: ${ctx.isClosedLoop ? 'Yes' : 'No'}
Has PRV: ${ctx.hasPrv ? 'Yes' : 'No'}
Baseline House PSI: ${ctx.housePsi} (measured at meter)
Effective PSI (spike during heating): ${effectivePsiExp} PSI
${isTransientExp 
  ? `CRITICAL: Every time the heater fires, trapped water expands and pressure spikes from ${ctx.housePsi} to ${effectivePsiExp} PSI.
   This cycling happens multiple times per day. Cyclic fatigue (like bending metal back and forth) is MUCH more damaging than constant load.` 
  : ''}
${ctx.tankCapacity ? `Tank Capacity: ${ctx.tankCapacity} gallons (thermal expansion ~${(ctx.tankCapacity * 0.02).toFixed(1)} gallons)` : ''}

AGING RATE IMPACT: ${pressurePercentExp}
(The thermal expansion spikes are causing the tank to wear ${pressurePercentExp} compared to a properly protected system.)

${ctx.expTankStatus === 'WATERLOGGED' 
  ? 'The expansion tank bladder has failed - it is waterlogged and provides zero protection.'
  : 'Missing expansion tank in closed system causes uncontrolled pressure spikes.'}

${ctx.isReplacementRecommended
  ? `Frame as: Thermal expansion spikes to ${effectivePsiExp} PSI (not the baseline ${ctx.housePsi} PSI) caused the tank to wear ${pressurePercentExp}. This cyclic pressure fatigue caused premature failure. MUST install expansion tank with next unit.`
  : 'Frame as: Current issue causing dangerous pressure spikes every heating cycle. Install expansion tank ASAP.'}`;

    case 'hardness-critical':
      const chemicalMultiplier = ctx.stressFactors.chemical || 1;
      const chemicalPercent = formatAgingPercent(chemicalMultiplier);
      return `${baseInfo}
FINDING: Severe hard water
Hardness: ${ctx.hardnessGPG} GPG (very hard is >15)
Has Softener: ${ctx.hasSoftener ? 'Yes' : 'No'}
${ctx.unitType === 'tankless' 
  ? `Scale Buildup: ${ctx.scaleBuildupScore || 'Unknown'}%` 
  : `Sediment: ~${ctx.sedimentLbs?.toFixed(0) || 'Unknown'} lbs accumulated`}

AGING RATE IMPACT: ${chemicalPercent}
(The hard water minerals are causing chemical wear ${chemicalPercent} compared to soft water.)

${ctx.isReplacementRecommended
  ? `Frame as: Hard water accelerated deterioration (${chemicalPercent}). Recommend softener for next unit.`
  : 'Frame as: Current hard water causing rapid scale/sediment buildup.'}`;

    case 'hardness-moderate':
      return `${baseInfo}
FINDING: Moderate hard water
Hardness: ${ctx.hardnessGPG} GPG
Has Softener: ${ctx.hasSoftener ? 'Yes' : 'No'}

${ctx.isReplacementRecommended
  ? 'Frame as: Hard water contributed to wear over time.'
  : 'Frame as: Moderately hard water causing gradual wear.'}`;

    case 'aging':
      return `${baseInfo}
FINDING: Unit age concern
Calendar Age: ${ctx.calendarAge} years
Biological Age: ${ctx.bioAge.toFixed(1)} years
Typical Lifespan: ${ctx.unitType === 'tankless' ? '15-20' : '8-12'} years
Fail Probability: ${(ctx.failProb * 100).toFixed(0)}%
Health Score: ${ctx.healthScore}/100

${ctx.isReplacementRecommended
  ? 'Unit has exceeded useful service life. Explain replacement makes sense.'
  : 'Unit is aging but still has life left. Explain proactive monitoring.'}`;

    case 'rust':
      return `${baseInfo}
FINDING: Visual rust/corrosion
Calendar Age: ${ctx.calendarAge} years
Anode Rod Life: ${ctx.shieldLife?.toFixed(0) || 'Unknown'}%

External rust visible on tank. Explain this is a warning sign of internal corrosion and potential tank failure.`;

    case 'sediment':
      const sedimentMultiplier = ctx.stressFactors.sediment || 1;
      const sedimentPercent = formatAgingPercent(sedimentMultiplier);
      return `${baseInfo}
FINDING: Sediment buildup
Hardness: ${ctx.hardnessGPG} GPG
Last Flush: ${ctx.lastFlushYearsAgo ? `${ctx.lastFlushYearsAgo}+ years ago` : 'Unknown/Never'}
Sediment Accumulated: ~${ctx.sedimentLbs?.toFixed(0) || 'Unknown'} lbs

AGING RATE IMPACT: ${sedimentPercent}
(The sediment layer is causing the heating element to work harder, wearing the tank ${sedimentPercent}.)

${ctx.isReplacementRecommended
  ? `Frame as: Years of sediment buildup reduced efficiency and accelerated wear (${sedimentPercent}).`
  : 'Frame as: Sediment needs to be flushed to restore efficiency.'}`;

    case 'anode-rod':
      // Anode depletion accelerates corrosion by approximately 200-400% when below 20%
      const shieldLifePct = ctx.shieldLife ?? 50;
      const anodeCorrosionRate = shieldLifePct < 10 ? '300-400% faster' : shieldLifePct < 20 ? '200-300% faster' : shieldLifePct < 40 ? '50-100% faster' : 'at normal rate';
      return `${baseInfo}
FINDING: Anode rod depletion
Calendar Age: ${ctx.calendarAge} years
Shield Life Remaining: ${shieldLifePct.toFixed(0)}%
Last Anode Replace: ${ctx.lastAnodeReplaceYearsAgo ? `${ctx.lastAnodeReplaceYearsAgo} years ago` : 'Unknown/Never'}
Hardness: ${ctx.hardnessGPG} GPG

CORROSION RATE: With only ${shieldLifePct.toFixed(0)}% anode protection remaining, unprotected steel is corroding ${anodeCorrosionRate} than a protected tank.
(The anode rod sacrifices itself to protect the tank. When depleted, corrosion attacks the tank walls directly.)

${ctx.isReplacementRecommended
  ? `Frame as: With anode at ${shieldLifePct.toFixed(0)}%, corrosion has been accelerating ${anodeCorrosionRate}. For reference on next unit.`
  : 'Frame as: Anode rod needs replacement to continue protecting the tank from corrosion.'}`;

    case 'descale':
      return `${baseInfo}
FINDING: Descaling needed (tankless)
Last Descale: ${ctx.lastDescaleYearsAgo ? `${ctx.lastDescaleYearsAgo}+ years ago` : 'Unknown/Never'}
Hardness: ${ctx.hardnessGPG} GPG
Scale Buildup: ${ctx.scaleBuildupScore || 'Unknown'}%

${ctx.isReplacementRecommended
  ? 'Frame as: Scale buildup restricted flow and caused heat exchanger stress.'
  : 'Frame as: Descaling needed to restore flow and prevent damage.'}`;

    case 'healthy':
      return `${baseInfo}
FINDING: System appears healthy
Health Score: ${ctx.healthScore}/100
No significant issues detected.

Generate positive finding emphasizing continued maintenance to keep it running well.`;

    case 'economic-guidance':
      return `${baseInfo}
FINDING: Economic recommendation
Recommendation Type: ${ctx.recommendationType}
Fail Probability: ${(ctx.failProb * 100).toFixed(0)}%
Health Score: ${ctx.healthScore}/100

Generate the "Our Recommendation" finding based on recommendation type:
- REPLACE_NOW: Unit has exceeded service life, replacement is the smart financial move
- REPLACE_SOON: Start planning replacement for near future
- MAINTAIN: Repairs make sense, unit has life left
- MONITOR: System is healthy, regular maintenance is the investment`;

    default:
      return `${baseInfo}
FINDING TYPE: ${findingType}
Generate an appropriate finding based on the data provided.`;
  }
}
