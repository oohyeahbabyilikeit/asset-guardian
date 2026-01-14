import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InspectionPayload {
  inspectionId: string;
  propertyId?: string;
  newPropertyAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  buildingType?: string;
  waterHeater: {
    manufacturer?: string;
    model_number?: string;
    serial_number?: string;
    fuel_type: string;
    tank_capacity_gallons: number;
    vent_type?: string;
    warranty_years?: number;
    calendar_age_years?: number;
    location?: string;
    is_finished_area?: boolean;
    temp_setting?: string;
    has_softener?: boolean;
    has_circ_pump?: boolean;
    has_exp_tank?: boolean;
    has_prv?: boolean;
    is_closed_loop?: boolean;
    quality_tier?: string;
    notes?: string;
    photo_urls?: string[];
    // v7.8-7.9 fields
    venting_scenario?: string;
    anode_count?: number;
    exp_tank_status?: string;
    has_drain_pan?: boolean;
    connection_type?: string;
    leak_source?: string;
    visual_rust?: boolean;
    is_leaking?: boolean;
    house_psi?: number;
    street_hardness_gpg?: number;
    rated_flow_gpm?: number;
    gas_line_size?: string;
    last_descale_years_ago?: number;
    room_volume_type?: string;
    air_filter_status?: string;
    is_condensate_clear?: boolean;
    flame_rod_status?: string;
    inlet_filter_status?: string;
    error_code_count?: number;
    building_type?: string;
  };
  softener?: {
    capacity_grains?: number;
    control_head?: string;
    visual_height?: string;
    has_carbon_filter?: boolean;
    photo_urls?: string[];
    salt_status?: string;
    quality_tier?: string;
    visual_iron?: boolean;
    visual_condition?: string;
    sanitizer_type?: string;
  };
  assessment: {
    forensic_inputs: Record<string, unknown>;
    photos?: string[];
    opterra_result?: Record<string, unknown>;
    inspection_notes?: string;
  };
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📥 Sync request from user ${user.id}`);

    // Parse payload
    const payload: InspectionPayload = await req.json();
    console.log(`📋 Syncing inspection ${payload.inspectionId}`);

    // Step 1: Resolve or create property
    let propertyId = payload.propertyId;
    
    if (!propertyId && payload.newPropertyAddress) {
      console.log("📍 Creating new property...");
      const { data: newProperty, error: propError } = await supabase
        .from("properties")
        .insert({
          address_line1: payload.newPropertyAddress.line1,
          address_line2: payload.newPropertyAddress.line2,
          city: payload.newPropertyAddress.city,
          state: payload.newPropertyAddress.state,
          zip_code: payload.newPropertyAddress.zip,
          owner_id: user.id,
          property_type: payload.buildingType === "residential" ? "single_family" :
                         payload.buildingType === "multifamily" ? "multi_family" :
                         payload.buildingType === "commercial" ? "commercial" : "single_family",
        })
        .select("id")
        .single();

      if (propError) {
        console.error("Failed to create property:", propError);
        return new Response(
          JSON.stringify({ error: "Failed to create property", details: propError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      propertyId = newProperty.id;
      console.log(`✅ Created property ${propertyId}`);
    }

    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "No property ID and no address provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Create water heater record
    console.log("🔥 Creating water heater...");
    const { data: waterHeater, error: whError } = await supabase
      .from("water_heaters")
      .insert({
        property_id: propertyId,
        created_by: user.id,
        ...payload.waterHeater,
      })
      .select("id")
      .single();

    if (whError) {
      console.error("Failed to create water heater:", whError);
      return new Response(
        JSON.stringify({ error: "Failed to create water heater", details: whError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Created water heater ${waterHeater.id}`);

    // Step 3: Create softener if present
    let softenerId: string | null = null;
    if (payload.softener) {
      console.log("💧 Creating water softener...");
      const { data: softener, error: softError } = await supabase
        .from("water_softeners")
        .insert({
          property_id: propertyId,
          created_by: user.id,
          ...payload.softener,
        })
        .select("id")
        .single();

      if (softError) {
        console.warn("Failed to create softener:", softError);
        // Don't fail the whole sync for softener errors
      } else {
        softenerId = softener.id;
        console.log(`✅ Created softener ${softenerId}`);
      }
    }

    // Step 4: Create assessment record
    console.log("📊 Creating assessment...");
    const { data: assessment, error: assessError } = await supabase
      .from("assessments")
      .insert({
        water_heater_id: waterHeater.id,
        assessor_id: user.id,
        source: "contractor_inspection",
        forensic_inputs: payload.assessment.forensic_inputs,
        photos: payload.assessment.photos || [],
        opterra_result: payload.assessment.opterra_result,
        inspection_notes: payload.assessment.inspection_notes,
        status: "completed",
      })
      .select("id")
      .single();

    if (assessError) {
      console.error("Failed to create assessment:", assessError);
      return new Response(
        JSON.stringify({ error: "Failed to create assessment", details: assessError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Created assessment ${assessment.id}`);

    // Step 5: Create contractor-property relationship
    console.log("🤝 Creating contractor relationship...");
    const { error: relError } = await supabase
      .from("contractor_property_relationships")
      .upsert({
        contractor_id: user.id,
        property_id: propertyId,
        relationship_type: "inspection",
      }, { 
        onConflict: "contractor_id,property_id,relationship_type" 
      });

    if (relError) {
      console.warn("Failed to create relationship:", relError);
      // Non-fatal - continue
    }

    console.log(`🎉 Sync complete for inspection ${payload.inspectionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        inspectionId: payload.inspectionId,
        propertyId,
        waterHeaterId: waterHeater.id,
        softenerId,
        assessmentId: assessment.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
