import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EducationalTopic = 
  | 'aging' 
  | 'aging-tankless'
  | 'pressure' 
  | 'thermal-expansion' 
  | 'anode-rod' 
  | 'sediment' 
  | 'scale-tankless'
  | 'prv'
  | 'failure-rate'
  | 'hardness'
  | 'hardness-tankless'
  | 'thermal'
  | 'temperature'
  | 'tank-failure'
  | 'heat-exchanger';

interface EducationalContext {
  // Unit details
  calendarAge?: number;
  bioAge?: number;
  manufacturer?: string;
  modelNumber?: string;
  fuelType?: string;
  tankCapacity?: number;
  warrantyYears?: number;
  
  // Water quality
  hardnessGPG?: number;
  hasSoftener?: boolean;
  
  // Pressure
  housePsi?: number;
  hasPrv?: boolean;
  
  // System config
  isClosedLoop?: boolean;
  hasExpTank?: boolean;
  expTankStatus?: string;
  
  // Maintenance
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  
  // Metrics
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  failProb?: number;
  healthScore?: number;
  
  // Tankless specific
  errorCodeCount?: number;
  descaleStatus?: string;
}

interface GenerateRequest {
  topic: EducationalTopic;
  context: EducationalContext;
}

// Get relevant context fields based on topic
function getRelevantContext(topic: EducationalTopic, context: EducationalContext): string {
  const lines: string[] = [];
  
  // Always include basic unit info if available
  if (context.manufacturer) lines.push(`- Brand: ${context.manufacturer}`);
  if (context.calendarAge !== undefined) lines.push(`- Unit Age: ${context.calendarAge} years`);
  if (context.bioAge !== undefined) lines.push(`- Biological Age (wear-adjusted): ${context.bioAge.toFixed(1)} years`);
  if (context.fuelType) lines.push(`- Fuel Type: ${context.fuelType}`);
  if (context.tankCapacity) lines.push(`- Tank Capacity: ${context.tankCapacity} gallons`);
  
  // Topic-specific context
  switch (topic) {
    case 'aging':
    case 'aging-tankless':
      if (context.warrantyYears) lines.push(`- Warranty: ${context.warrantyYears} years`);
      if (context.failProb !== undefined) lines.push(`- Calculated Failure Probability: ${context.failProb.toFixed(1)}%`);
      if (context.healthScore !== undefined) lines.push(`- Health Score: ${context.healthScore}/100`);
      break;
      
    case 'pressure':
    case 'prv':
      if (context.housePsi !== undefined) lines.push(`- Measured Pressure: ${context.housePsi} PSI`);
      lines.push(`- Has PRV: ${context.hasPrv ? 'Yes' : 'No'}`);
      break;
      
    case 'thermal-expansion':
    case 'thermal':
      if (context.housePsi !== undefined) lines.push(`- Current Pressure: ${context.housePsi} PSI`);
      lines.push(`- Closed Loop System: ${context.isClosedLoop ? 'Yes' : 'No'}`);
      lines.push(`- Has Expansion Tank: ${context.hasExpTank ? 'Yes' : 'No'}`);
      if (context.expTankStatus) lines.push(`- Expansion Tank Status: ${context.expTankStatus}`);
      if (context.tankCapacity) lines.push(`- Tank Size: ${context.tankCapacity} gallons (expands ~${(context.tankCapacity * 0.02).toFixed(1)} gallons when heated)`);
      break;
      
    case 'anode-rod':
      if (context.shieldLife !== undefined) lines.push(`- Estimated Anode Shield Life: ${context.shieldLife.toFixed(0)}%`);
      if (context.lastAnodeReplaceYearsAgo !== undefined) lines.push(`- Last Anode Replacement: ${context.lastAnodeReplaceYearsAgo} years ago`);
      else lines.push(`- Last Anode Replacement: Never (or unknown)`);
      if (context.hardnessGPG !== undefined) lines.push(`- Water Hardness: ${context.hardnessGPG} GPG`);
      lines.push(`- Has Water Softener: ${context.hasSoftener ? 'Yes' : 'No'}`);
      break;
      
    case 'sediment':
      if (context.sedimentLbs !== undefined) lines.push(`- Estimated Sediment Accumulation: ${context.sedimentLbs.toFixed(1)} lbs`);
      if (context.lastFlushYearsAgo !== undefined) lines.push(`- Last Tank Flush: ${context.lastFlushYearsAgo} years ago`);
      else lines.push(`- Last Tank Flush: Never (or unknown)`);
      if (context.hardnessGPG !== undefined) lines.push(`- Water Hardness: ${context.hardnessGPG} GPG`);
      break;
      
    case 'hardness':
    case 'hardness-tankless':
      if (context.hardnessGPG !== undefined) lines.push(`- Water Hardness: ${context.hardnessGPG} GPG`);
      lines.push(`- Has Water Softener: ${context.hasSoftener ? 'Yes' : 'No'}`);
      if (context.sedimentLbs !== undefined) lines.push(`- Estimated Scale/Sediment: ${context.sedimentLbs.toFixed(1)} lbs`);
      break;
      
    case 'scale-tankless':
    case 'heat-exchanger':
      if (context.scaleBuildupScore !== undefined) lines.push(`- Scale Buildup Score: ${context.scaleBuildupScore}%`);
      if (context.hardnessGPG !== undefined) lines.push(`- Water Hardness: ${context.hardnessGPG} GPG`);
      if (context.lastDescaleYearsAgo !== undefined) lines.push(`- Last Descale: ${context.lastDescaleYearsAgo} years ago`);
      else lines.push(`- Last Descale: Never (or unknown)`);
      if (context.descaleStatus) lines.push(`- Descale Status: ${context.descaleStatus}`);
      if (context.errorCodeCount !== undefined) lines.push(`- Recent Error Codes: ${context.errorCodeCount}`);
      lines.push(`- Has Water Softener: ${context.hasSoftener ? 'Yes' : 'No'}`);
      break;
      
    case 'temperature':
      if (context.tankCapacity) lines.push(`- Tank Size: ${context.tankCapacity} gallons`);
      break;
      
    case 'tank-failure':
      if (context.failProb !== undefined) lines.push(`- Failure Probability: ${context.failProb.toFixed(1)}%`);
      break;
      
    case 'failure-rate':
      if (context.failProb !== undefined) lines.push(`- Calculated Failure Probability: ${context.failProb.toFixed(1)}%`);
      if (context.healthScore !== undefined) lines.push(`- Health Score: ${context.healthScore}/100`);
      break;
  }
  
  return lines.length > 0 ? lines.join('\n') : 'No specific data available';
}

// Get topic display name
function getTopicDisplayName(topic: EducationalTopic): string {
  const names: Record<EducationalTopic, string> = {
    'aging': 'Water Heater Aging',
    'aging-tankless': 'Tankless Water Heater Aging',
    'pressure': 'Water Pressure',
    'thermal-expansion': 'Thermal Expansion',
    'anode-rod': 'Anode Rod Protection',
    'sediment': 'Sediment Buildup',
    'scale-tankless': 'Scale Buildup in Tankless Units',
    'prv': 'Pressure Reducing Valves',
    'failure-rate': 'Failure Statistics',
    'hardness': 'Water Hardness',
    'hardness-tankless': 'Water Hardness & Tankless Units',
    'thermal': 'Thermal Expansion',
    'temperature': 'Temperature Settings',
    'tank-failure': 'Tank Body Leaks',
    'heat-exchanger': 'Heat Exchanger Health',
  };
  return names[topic] || topic;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, context }: GenerateRequest = await req.json();
    
    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const topicName = getTopicDisplayName(topic);
    const relevantContext = getRelevantContext(topic, context || {});
    
    const systemPrompt = `You are an expert water heater technician and educator. You generate personalized educational content for homeowners about their water heater.

Your content should:
1. Be written in plain, friendly English that any homeowner can understand
2. Reference the SPECIFIC data provided about their unit (actual numbers, not generic examples)
3. Explain how this topic affects THEIR specific situation
4. Provide actionable insights they can use
5. Be reassuring but honest about any concerns

Keep each section concise but informative. Use their actual measurements when explaining concepts.`;

    const userPrompt = `Generate educational content about "${topicName}" for this homeowner.

THEIR SPECIFIC UNIT DATA:
${relevantContext}

Generate a JSON response with this structure:
{
  "title": "Clear, engaging title for this topic",
  "description": "One sentence summary relevant to their situation",
  "sections": [
    {
      "heading": "Section title",
      "content": "2-3 sentences explaining this aspect, referencing their specific data where relevant"
    }
  ],
  "source": "Brief credibility note (e.g., 'Based on manufacturer guidelines and your unit data')"
}

Include 3-4 sections that are most relevant to their specific situation. Reference their actual numbers (e.g., "At ${context?.housePsi || 'X'} PSI...") when explaining concepts.`;

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
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limited by AI gateway");
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required for AI gateway");
        return new Response(
          JSON.stringify({ error: 'AI service payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await response.json();
    const messageContent = aiResult.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: 'Empty AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the JSON from the response (may be wrapped in markdown code blocks)
    let parsedContent;
    try {
      // Remove markdown code blocks if present
      let cleanContent = messageContent;
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }
      parsedContent = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", messageContent);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Generated educational content for topic: ${topic}`);
    
    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error generating educational content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
