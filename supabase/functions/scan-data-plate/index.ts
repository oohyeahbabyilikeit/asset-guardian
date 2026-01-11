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
  capacity: number | null;
  flowRate: number | null;
  warrantyYears: number | null;
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
                text: `Analyze this water heater data plate image and extract the following information. Be precise and only extract what you can clearly read.

Extract:
1. Brand/Manufacturer name (e.g., Rheem, A.O. Smith, Bradford White, Rinnai, Navien, etc.)
2. Model number (the alphanumeric product code)
3. Serial number (usually starts with numbers indicating manufacture date)
4. Unit type - determine based on these indicators:
   - "BTU" or "BTU/HR" = Gas unit
   - "kW" or "Watts" = Electric unit
   - "GPM" or "Gallons Per Minute" without tank capacity = Tankless
   - "Heat Pump" or "Hybrid" = Hybrid unit
   - Tank capacity in gallons = Tank unit
5. Tank capacity in gallons (for tank/hybrid units)
6. Flow rate in GPM (for tankless units)
7. Warranty period if visible

Return your analysis as structured data.`
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
              description: 'Extract water heater information from data plate',
              parameters: {
                type: 'object',
                properties: {
                  brand: {
                    type: 'string',
                    description: 'Brand/manufacturer name (e.g., Rheem, A.O. Smith, Bradford White)',
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
                    description: 'Type of water heater based on fuel source and configuration',
                    nullable: true
                  },
                  capacity: {
                    type: 'number',
                    description: 'Tank capacity in gallons (for tank/hybrid units)',
                    nullable: true
                  },
                  flowRate: {
                    type: 'number',
                    description: 'Flow rate in GPM (for tankless units)',
                    nullable: true
                  },
                  warrantyYears: {
                    type: 'number',
                    description: 'Warranty period in years if visible',
                    nullable: true
                  },
                  confidence: {
                    type: 'string',
                    enum: ['HIGH', 'MEDIUM', 'LOW'],
                    description: 'Confidence level in the extraction (HIGH if clear image, MEDIUM if some fields unclear, LOW if image quality poor)'
                  },
                  rawText: {
                    type: 'string',
                    description: 'Any other relevant text visible on the data plate'
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
