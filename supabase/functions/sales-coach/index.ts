import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Asset {
  brand: string;
  model?: string;
  age: number;
  warrantyYears: number;
  location: string;
  capacity?: number;
  fuelType?: string;
}

interface ForensicInputs {
  psiReading?: number;
  hardness?: number;
  hasExpansionTank?: boolean;
  hasSoftener?: boolean;
  anodeStatus?: string;
  sedimentLevel?: string;
  leakStatus?: string;
  ventType?: string;
  // Usage context for sizing analysis
  peopleCount?: number;
  usageType?: 'low' | 'normal' | 'heavy';
  // Symptom flags from onboarding
  runsOutOfHotWater?: boolean;
  lukewarmWater?: boolean;
}

interface OpterraResult {
  healthScore: number;
  bioAge: number;
  failProb: number;
  shieldLife: number;
  verdictAction: string;
  anodeRemaining?: number;
}

interface Opportunity {
  id: string;
  customerName?: string;
  propertyAddress: string;
  priority: string;
  opportunityType: string;
  asset: Asset;
  forensicInputs?: ForensicInputs;
  opterraResult?: OpterraResult;
  inspectionNotes?: string;
  context?: string;
}

interface SalesCoachRequest {
  opportunity: Opportunity;
  mode: 'briefing' | 'chat';
  messages?: Message[];
}

function analyzeSizingMismatch(capacity: number | undefined, forensicInputs?: ForensicInputs): { isUndersized: boolean; reason?: string; recommendedCapacity?: number } {
  if (!capacity || !forensicInputs) return { isUndersized: false };
  
  const peopleCount = forensicInputs.peopleCount || 3;
  const usageType = forensicInputs.usageType || 'normal';
  const runsOutOfHotWater = forensicInputs.runsOutOfHotWater;
  const lukewarmWater = forensicInputs.lukewarmWater;
  
  // Industry sizing guidelines: 10-12 gallons per person for normal usage
  const usageMultiplier = usageType === 'heavy' ? 15 : usageType === 'low' ? 8 : 12;
  const recommendedCapacity = peopleCount * usageMultiplier;
  
  // Check for undersizing indicators
  const capacityShortfall = recommendedCapacity - capacity;
  const hasSymptoms = runsOutOfHotWater || lukewarmWater;
  
  if (capacityShortfall > 10 || (capacityShortfall > 0 && hasSymptoms)) {
    let reason = '';
    if (hasSymptoms) {
      reason = runsOutOfHotWater 
        ? 'Customer reported running out of hot water frequently'
        : 'Customer reported lukewarm water issues';
    } else {
      reason = `${peopleCount} people with ${usageType} usage on ${capacity}-gallon tank`;
    }
    
    // Round up to standard tank sizes
    const standardSizes = [40, 50, 65, 75, 80];
    const nextSize = standardSizes.find(s => s >= recommendedCapacity) || 80;
    
    return { isUndersized: true, reason, recommendedCapacity: nextSize };
  }
  
  return { isUndersized: false };
}

function buildOpportunityContext(opportunity: Opportunity): string {
  const { asset, forensicInputs, opterraResult, inspectionNotes, priority, opportunityType } = opportunity;
  
  // Analyze if tank is undersized for the household
  const sizingAnalysis = analyzeSizingMismatch(asset.capacity, forensicInputs);
  
  let context = `## PROPERTY DETAILS
- Customer: ${opportunity.customerName || 'Homeowner'}
- Address: ${opportunity.propertyAddress}
- Priority Level: ${priority.toUpperCase()}
- Opportunity Type: ${opportunityType}

## WATER HEATER PROFILE
- Brand: ${asset.brand}
- Age: ${asset.age} years old
- Warranty: ${asset.warrantyYears > asset.age ? `${asset.warrantyYears - asset.age} years remaining` : `Expired ${asset.age - asset.warrantyYears} years ago`}
- Location: ${asset.location}
${asset.capacity ? `- Capacity: ${asset.capacity} gallons` : ''}
${asset.fuelType ? `- Fuel Type: ${asset.fuelType}` : ''}
`;

  // Add household usage context
  if (forensicInputs?.peopleCount || forensicInputs?.usageType) {
    context += `
## HOUSEHOLD USAGE
${forensicInputs.peopleCount ? `- People in Home: ${forensicInputs.peopleCount}` : ''}
${forensicInputs.usageType ? `- Usage Intensity: ${forensicInputs.usageType.toUpperCase()}` : ''}
${forensicInputs.runsOutOfHotWater ? `- ⚠️ SYMPTOM: Customer reports running out of hot water` : ''}
${forensicInputs.lukewarmWater ? `- ⚠️ SYMPTOM: Customer reports lukewarm water issues` : ''}
`;
  }

  // Add sizing analysis if undersized
  if (sizingAnalysis.isUndersized) {
    context += `
## 📏 SIZING OPPORTUNITY
- Current Tank: ${asset.capacity} gallons - UNDERSIZED for this household
- Reason: ${sizingAnalysis.reason}
- Recommended Upgrade: ${sizingAnalysis.recommendedCapacity} gallons
- This is a strong upsell opportunity when discussing replacement
`;
  }

  if (opterraResult) {
    const healthLabel = opterraResult.healthScore >= 70 ? 'Good' : opterraResult.healthScore >= 40 ? 'Fair' : 'Poor';
    const riskLabel = opterraResult.failProb > 0.5 ? 'High' : opterraResult.failProb > 0.25 ? 'Elevated' : 'Normal';
    
    context += `
## DIAGNOSTIC ASSESSMENT
- Overall Health: ${healthLabel} condition (${opterraResult.healthScore}/100)
- Biological Age: ${opterraResult.bioAge} years (vs ${asset.age} calendar years)
- Failure Risk: ${riskLabel}
- Protective Shield Life: ${opterraResult.shieldLife > 0 ? `${opterraResult.shieldLife.toFixed(1)} years remaining` : 'Depleted'}
- Recommended Action: ${opterraResult.verdictAction}
`;
  }

  if (forensicInputs) {
    context += `
## PLUMBING ENVIRONMENT
${forensicInputs.psiReading ? `- Water Pressure: ${forensicInputs.psiReading} PSI ${forensicInputs.psiReading > 80 ? '(HIGH - risk factor)' : forensicInputs.psiReading < 40 ? '(LOW)' : '(Normal)'}` : ''}
${forensicInputs.hardness ? `- Water Hardness: ${forensicInputs.hardness} GPG ${forensicInputs.hardness > 10 ? '(HARD - accelerates wear)' : forensicInputs.hardness > 7 ? '(Moderately hard)' : '(Soft)'}` : ''}
${forensicInputs.hasExpansionTank !== undefined ? `- Expansion Tank: ${forensicInputs.hasExpansionTank ? 'Present' : 'MISSING (code requirement in closed-loop systems)'}` : ''}
${forensicInputs.hasSoftener !== undefined ? `- Water Softener: ${forensicInputs.hasSoftener ? 'Present' : 'Not installed'}` : ''}
${forensicInputs.anodeStatus ? `- Anode Rod Status: ${forensicInputs.anodeStatus}` : ''}
${forensicInputs.sedimentLevel ? `- Sediment Level: ${forensicInputs.sedimentLevel}` : ''}
${forensicInputs.leakStatus ? `- Leak Status: ${forensicInputs.leakStatus}` : ''}
${forensicInputs.ventType ? `- Vent Type: ${forensicInputs.ventType}` : ''}
`;
  }

  if (inspectionNotes) {
    context += `
## TECHNICIAN NOTES
${inspectionNotes}
`;
  }

  return context;
}

function buildSystemPrompt(opportunity: Opportunity): string {
  const context = buildOpportunityContext(opportunity);
  
  return `You are a Sales Coach for a plumbing company owner. Your job is to prepare them for an outreach call to a homeowner whose water heater was recently inspected by one of their technicians.

${context}

Based on the diagnostic data above, provide a structured briefing in the following format. Use markdown formatting.

## 🎯 CALL OPENING
Write 2-3 natural, conversational sentences for how to start the call. Reference the recent inspection. Be warm but professional, not pushy.

## 💬 KEY TALKING POINTS
List 3-5 bullet points of the most compelling findings to mention. Lead with the customer's BENEFIT (protecting their home, avoiding costly damage, peace of mind), not technical jargon. Reference specific data points from the inspection.

## 📦 UPSELL OPPORTUNITIES
List 2-3 additional services that make sense given the situation. Be specific about WHY each makes sense based on the findings.

## 🛡️ OBJECTION HANDLERS
Provide responses to these common objections:
- **"I don't have the budget right now"**
- **"I want to get another quote"**
- **"It's been working fine"**
${opportunity.priority === 'critical' || opportunity.priority === 'high' ? '- **"Can\'t it wait a few months?"**' : ''}

## 🎬 CLOSING STRATEGY
Write 2-3 sentences on how to ask for the appointment naturally. Focus on urgency appropriate to the priority level without being pushy.

IMPORTANT RULES:
- Be direct and tactical, not salesy or aggressive
- Reference specific numbers from the inspection when helpful
- Use qualitative terms (concerning condition, elevated wear, accelerated deterioration) rather than exact failure percentages
- Keep each section scannable in under 30 seconds
- Tailor urgency to the priority level: ${opportunity.priority.toUpperCase()}
- Never mention "biological age" - use phrases like "showing signs of accelerated wear" instead`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { opportunity, mode, messages } = await req.json() as SalesCoachRequest;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(opportunity);
    
    let chatMessages: Message[];
    
    if (mode === 'briefing') {
      // Initial briefing generation
      chatMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate my sales briefing for this customer call.' }
      ];
    } else {
      // Follow-up chat mode
      chatMessages = [
        { role: 'system', content: systemPrompt + '\n\nYou are now in follow-up mode. Answer any questions the sales rep has about this opportunity, how to handle specific scenarios, or provide additional coaching. Keep responses concise and actionable.' },
        ...(messages || [])
      ];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate coaching content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Sales coach error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
