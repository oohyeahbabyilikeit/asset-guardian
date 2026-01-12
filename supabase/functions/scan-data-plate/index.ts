import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedData {
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  fuelType: 'GAS' | 'ELECTRIC' | 'TANKLESS_GAS' | 'TANKLESS_ELECTRIC' | 'HYBRID' | null;
  capacity: number | null;       // Gallons for tank units
  flowRate: number | null;       // GPM for tankless
  warrantyYears: number | null;
  btuRating: number | null;      // BTU/hr for gas units
  wattage: number | null;        // Watts for electric units
  voltage: number | null;        // Input voltage (120, 208, 240, etc.)
  ventType: 'ATMOSPHERIC' | 'POWER_VENT' | 'DIRECT_VENT' | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rawText: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing data plate image...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this water heater data plate/rating label image. Extract ALL visible specifications precisely.

CRITICAL FIELDS TO EXTRACT:
1. Brand/Manufacturer (e.g., Rheem, A.O. Smith, Bradford White, Rinnai, Navien)
2. Model number (alphanumeric code, often starts with letters)
3. Serial number (usually starts with date code like 1423, 2208, etc.)
4. BTU/HR rating (gas units - look for "BTU", "BTU/HR", "Input")
5. Wattage (electric units - look for "Watts", "W", "kW")
6. Voltage (look for "VAC", "V", "Volts" - commonly 120V, 208V, 240V)
7. Tank capacity in gallons (look for "GAL", "Gallons", "Capacity")
8. Flow rate in GPM (tankless - look for "GPM", "Gallons Per Minute")
9. Vent type (look for "Atmospheric", "Power Vent", "Direct Vent")
10. Warranty info if visible

UNIT TYPE DETERMINATION:
- BTU rating + tank capacity = GAS tank unit
- Watts/kW + tank capacity = ELECTRIC tank unit  
- BTU + GPM (no tank) = TANKLESS_GAS
- Watts + GPM (no tank) = TANKLESS_ELECTRIC
- "Heat Pump", "Hybrid" text = HYBRID unit

Be extremely precise - only extract what you can clearly read. Do NOT guess.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_data_plate_info',
              description: 'Extract all water heater specifications from data plate',
              parameters: {
                type: 'object',
                properties: {
                  brand: {
                    type: 'string',
                    description: 'Brand/manufacturer name',
                    nullable: true
                  },
                  model: {
                    type: 'string',
                    description: 'Model number/code',
                    nullable: true
                  },
                  serialNumber: {
                    type: 'string',
                    description: 'Serial number',
                    nullable: true
                  },
                  fuelType: {
                    type: 'string',
                    enum: ['GAS', 'ELECTRIC', 'TANKLESS_GAS', 'TANKLESS_ELECTRIC', 'HYBRID'],
                    description: 'Unit type based on BTU/Watts/GPM indicators',
                    nullable: true
                  },
                  capacity: {
                    type: 'number',
                    description: 'Tank capacity in gallons',
                    nullable: true
                  },
                  flowRate: {
                    type: 'number',
                    description: 'Flow rate in GPM (tankless only)',
                    nullable: true
                  },
                  warrantyYears: {
                    type: 'number',
                    description: 'Warranty period in years',
                    nullable: true
                  },
                  btuRating: {
                    type: 'number',
                    description: 'BTU/HR input rating for gas units (e.g., 40000, 76000)',
                    nullable: true
                  },
                  wattage: {
                    type: 'number',
                    description: 'Wattage for electric units (e.g., 4500, 5500)',
                    nullable: true
                  },
                  voltage: {
                    type: 'number',
                    description: 'Input voltage (120, 208, 240, etc.)',
                    nullable: true
                  },
                  ventType: {
                    type: 'string',
                    enum: ['ATMOSPHERIC', 'POWER_VENT', 'DIRECT_VENT'],
                    description: 'Vent type for gas units',
                    nullable: true
                  },
                  confidence: {
                    type: 'string',
                    enum: ['HIGH', 'MEDIUM', 'LOW'],
                    description: 'HIGH if clear image with 5+ fields, MEDIUM if 3-4 fields, LOW if image quality poor'
                  },
                  rawText: {
                    type: 'string',
                    description: 'All other relevant text visible on the data plate'
                  }
                },
                required: ['confidence', 'rawText'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_data_plate_info' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== 'extract_data_plate_info') {
      console.error('Unexpected response format:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Could not parse data plate. Please enter information manually.',
          extracted: null 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extracted: ExtractedData = JSON.parse(toolCall.function.arguments);
    console.log('Extracted data:', JSON.stringify(extracted));

    return new Response(
      JSON.stringify({ extracted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing data plate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
