import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstallPreset {
  ventType: string;
  complexity: string;
  laborCost: number;
  materialsCost: number;
  permitCost: number;
  description?: string;
  estimatedHours?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const url = new URL(req.url);
    const contractorId = url.searchParams.get('contractorId');

    if (!contractorId) {
      throw new Error("contractorId is required");
    }

    // GET: Fetch all presets for a contractor
    if (req.method === 'GET') {
      console.log("Fetching presets for contractor:", contractorId);

      const { data, error } = await supabase
        .from('contractor_install_presets')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('vent_type', { ascending: true })
        .order('complexity', { ascending: true });

      if (error) throw error;

      // Transform to frontend format
      const presets = data.map(row => ({
        id: row.id,
        ventType: row.vent_type,
        complexity: row.complexity,
        laborCost: parseFloat(row.labor_cost_usd),
        materialsCost: parseFloat(row.materials_cost_usd),
        permitCost: parseFloat(row.permit_cost_usd),
        totalCost: parseFloat(row.total_install_cost_usd),
        description: row.description,
        estimatedHours: row.estimated_hours ? parseFloat(row.estimated_hours) : null,
      }));

      return new Response(JSON.stringify({ presets }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST: Create or update presets
    if (req.method === 'POST') {
      const body = await req.json();
      const presets: InstallPreset[] = body.presets;

      if (!Array.isArray(presets)) {
        throw new Error("presets array is required");
      }

      console.log("Upserting", presets.length, "presets for contractor:", contractorId);

      const upsertData = presets.map(preset => ({
        contractor_id: contractorId,
        vent_type: preset.ventType,
        complexity: preset.complexity,
        labor_cost_usd: preset.laborCost,
        materials_cost_usd: preset.materialsCost || 0,
        permit_cost_usd: preset.permitCost || 0,
        description: preset.description || null,
        estimated_hours: preset.estimatedHours || null,
      }));

      const { data, error } = await supabase
        .from('contractor_install_presets')
        .upsert(upsertData, { 
          onConflict: 'contractor_id,vent_type,complexity',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        count: data.length,
        message: `Saved ${data.length} installation presets` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE: Remove a specific preset
    if (req.method === 'DELETE') {
      const presetId = url.searchParams.get('presetId');
      
      if (!presetId) {
        throw new Error("presetId is required for deletion");
      }

      console.log("Deleting preset:", presetId);

      const { error } = await supabase
        .from('contractor_install_presets')
        .delete()
        .eq('id', presetId)
        .eq('contractor_id', contractorId);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Install presets error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});