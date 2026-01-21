import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface WaterHeaterContext {
  inputs: {
    manufacturer?: string;
    modelNumber?: string;
    calendarAgeYears?: number;
    fuelType?: string;
    tankCapacityGallons?: number;
    hasPrv?: boolean;
    hasExpTank?: boolean;
    expTankStatus?: string;
    isClosedLoop?: boolean;
    streetHardnessGpg?: number;
    hasSoftener?: boolean;
    housePsi?: number;
    visualRust?: boolean;
    isLeaking?: boolean;
    leakSource?: string;
  };
  metrics: {
    healthScore?: number;
    bioAge?: number;
    failProbability?: number;
    stressFactors?: {
      age?: number;
      pressure?: number;
      waterQuality?: number;
      loop?: number;
    };
  };
  recommendation?: {
    action?: string;
    badge?: string;
    title?: string;
    description?: string;
  };
  findings: Array<{
    title: string;
    measurement?: string;
    explanation: string;
    severity: string;
  }>;
  financial?: {
    totalReplacementCost?: number;
    monthlyBudget?: number;
    targetDate?: string;
  };
  // NEW: Service context for Corrtex AI chat
  serviceContext?: {
    selectedServices: string[];
    violationCount: number;
    recommendationCount: number;
    maintenanceCount: number;
    addOnCount: number;
  };
}

function buildSystemPrompt(context: WaterHeaterContext): string {
  const { inputs, metrics, recommendation, findings, serviceContext } = context;
  
  let prompt = `You are Corrtex AI, a friendly and knowledgeable water heater advisor helping a homeowner understand their assessment results. Use the specific data below to answer their questions. Be conversational, honest, and helpful. Keep responses concise but thorough.

## THEIR WATER HEATER
`;

  if (inputs.manufacturer || inputs.modelNumber) {
    prompt += `- Brand/Model: ${inputs.manufacturer || 'Unknown'} ${inputs.modelNumber || ''}\n`;
  }
  if (inputs.calendarAgeYears !== undefined) {
    prompt += `- Calendar Age: ${inputs.calendarAgeYears} years\n`;
  }
  if (metrics.bioAge !== undefined) {
    prompt += `- Biological Age (wear-adjusted): ${metrics.bioAge.toFixed(1)} years\n`;
  }
  if (inputs.fuelType) {
    prompt += `- Fuel Type: ${inputs.fuelType}\n`;
  }
  if (inputs.tankCapacityGallons) {
    prompt += `- Tank Capacity: ${inputs.tankCapacityGallons} gallons\n`;
  }

  prompt += `\n## HEALTH ASSESSMENT\n`;
  if (metrics.healthScore !== undefined) {
    prompt += `- Health Score: ${metrics.healthScore}/100\n`;
  }
  if (metrics.failProbability !== undefined) {
    prompt += `- Failure Probability: ${(metrics.failProbability * 100).toFixed(0)}%\n`;
  }

  prompt += `\n## PLUMBING ENVIRONMENT\n`;
  prompt += `- PRV (Pressure Reducing Valve): ${inputs.hasPrv ? 'Yes' : 'No'}\n`;
  prompt += `- Expansion Tank: ${inputs.hasExpTank ? (inputs.expTankStatus || 'Installed') : 'Not installed'}\n`;
  prompt += `- Closed-Loop System: ${inputs.isClosedLoop || inputs.hasPrv ? 'Yes' : 'No'}\n`;
  if (inputs.streetHardnessGpg !== undefined) {
    prompt += `- Water Hardness: ${inputs.streetHardnessGpg} GPG${inputs.hasSoftener ? ' (softener installed)' : ''}\n`;
  }
  if (inputs.housePsi !== undefined) {
    prompt += `- Water Pressure: ${inputs.housePsi} PSI\n`;
  }

  if (metrics.stressFactors) {
    prompt += `\n## STRESS FACTORS (multipliers accelerating wear)\n`;
    if (metrics.stressFactors.age) {
      prompt += `- Age Factor: ${metrics.stressFactors.age.toFixed(1)}x\n`;
    }
    if (metrics.stressFactors.pressure) {
      prompt += `- Pressure/Thermal Expansion: ${metrics.stressFactors.pressure.toFixed(1)}x\n`;
    }
    if (metrics.stressFactors.waterQuality) {
      prompt += `- Water Quality: ${metrics.stressFactors.waterQuality.toFixed(1)}x\n`;
    }
  }

  if (findings.length > 0) {
    prompt += `\n## KEY FINDINGS\n`;
    findings.forEach((finding, i) => {
      prompt += `${i + 1}. **${finding.title}**${finding.measurement ? ` - ${finding.measurement}` : ''} (${finding.severity})\n`;
      prompt += `   ${finding.explanation}\n`;
    });
  }

  if (recommendation) {
    prompt += `\n## OUR RECOMMENDATION\n`;
    prompt += `- Action: ${recommendation.action || 'N/A'}\n`;
    prompt += `- Badge: ${recommendation.badge || 'N/A'}\n`;
    if (recommendation.title) {
      prompt += `- Summary: ${recommendation.title}\n`;
    }
    if (recommendation.description) {
      prompt += `- Details: ${recommendation.description}\n`;
    }
  }

  // Service context for helping customer understand their options
  if (serviceContext && serviceContext.selectedServices.length > 0) {
    prompt += `\n## SERVICES BEING CONSIDERED\n`;
    prompt += `The homeowner is looking at these service options:\n`;
    serviceContext.selectedServices.forEach((service, i) => {
      prompt += `${i + 1}. ${service}\n`;
    });
    if (serviceContext.violationCount > 0) {
      prompt += `\n⚠️ ${serviceContext.violationCount} item(s) are code violations that require attention.\n`;
    }
  }

  // Note: Financial context removed in v9.0 - focus on physics-based explanations

  prompt += `
## GUIDELINES
- Answer based on their specific situation and data above
- Be honest about what you know vs. don't know
- When explaining technical concepts (like thermal expansion), relate it to their specific situation
- NEVER mention specific dollar amounts or costs - focus on the physics and risk factors
- If they ask about costs, explain that pricing varies by location and suggest they discuss with a local professional
- If they seem worried, acknowledge their concerns while being reassuring and practical
- Suggest actionable next steps when appropriate
- Keep responses focused and avoid unnecessary jargon
- If they ask about services on their list, explain WHY those services matter for their specific situation
- Be supportive of their decision to learn more before committing`;

  return prompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json() as { 
      messages: Message[]; 
      context: WaterHeaterContext;
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to get AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Chat water heater error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
