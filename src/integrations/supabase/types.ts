export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessments: {
        Row: {
          assessor_id: string
          bio_age: number | null
          created_at: string
          fail_probability: number | null
          forensic_inputs: Json
          health_score: number | null
          id: string
          inspection_notes: string | null
          last_anode_replace_years_ago: number | null
          last_flush_years_ago: number | null
          opterra_result: Json | null
          people_count: number | null
          photos: Json | null
          recommendation_action: string | null
          recommendation_title: string | null
          risk_level: number | null
          source: Database["public"]["Enums"]["assessment_source"]
          status: string | null
          symptoms: Json | null
          updated_at: string
          usage_type: string | null
          water_heater_id: string
          years_at_address: number | null
        }
        Insert: {
          assessor_id: string
          bio_age?: number | null
          created_at?: string
          fail_probability?: number | null
          forensic_inputs: Json
          health_score?: number | null
          id?: string
          inspection_notes?: string | null
          last_anode_replace_years_ago?: number | null
          last_flush_years_ago?: number | null
          opterra_result?: Json | null
          people_count?: number | null
          photos?: Json | null
          recommendation_action?: string | null
          recommendation_title?: string | null
          risk_level?: number | null
          source: Database["public"]["Enums"]["assessment_source"]
          status?: string | null
          symptoms?: Json | null
          updated_at?: string
          usage_type?: string | null
          water_heater_id: string
          years_at_address?: number | null
        }
        Update: {
          assessor_id?: string
          bio_age?: number | null
          created_at?: string
          fail_probability?: number | null
          forensic_inputs?: Json
          health_score?: number | null
          id?: string
          inspection_notes?: string | null
          last_anode_replace_years_ago?: number | null
          last_flush_years_ago?: number | null
          opterra_result?: Json | null
          people_count?: number | null
          photos?: Json | null
          recommendation_action?: string | null
          recommendation_title?: string | null
          risk_level?: number | null
          source?: Database["public"]["Enums"]["assessment_source"]
          status?: string | null
          symptoms?: Json | null
          updated_at?: string
          usage_type?: string | null
          water_heater_id?: string
          years_at_address?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_install_presets: {
        Row: {
          complexity: string
          contractor_id: string
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          labor_cost_usd: number
          materials_cost_usd: number
          permit_cost_usd: number
          total_install_cost_usd: number | null
          updated_at: string
          vent_type: string
        }
        Insert: {
          complexity: string
          contractor_id: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          labor_cost_usd: number
          materials_cost_usd?: number
          permit_cost_usd?: number
          total_install_cost_usd?: number | null
          updated_at?: string
          vent_type: string
        }
        Update: {
          complexity?: string
          contractor_id?: string
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          labor_cost_usd?: number
          materials_cost_usd?: number
          permit_cost_usd?: number
          total_install_cost_usd?: number | null
          updated_at?: string
          vent_type?: string
        }
        Relationships: []
      }
      contractor_property_relationships: {
        Row: {
          contractor_id: string
          created_at: string
          expires_at: string | null
          id: string
          property_id: string
          relationship_type: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          property_id: string
          relationship_type: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          property_id?: string
          relationship_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_property_relationships_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lookup_cache: {
        Row: {
          cached_at: string
          expires_at: string
          id: string
          lookup_key: string
          lookup_type: string
          result_json: Json
        }
        Insert: {
          cached_at?: string
          expires_at?: string
          id?: string
          lookup_key: string
          lookup_type: string
          result_json: Json
        }
        Update: {
          cached_at?: string
          expires_at?: string
          id?: string
          lookup_key?: string
          lookup_type?: string
          result_json?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          license_number: string | null
          phone: string | null
          preferred_contractor_id: string | null
          service_area: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          license_number?: string | null
          phone?: string | null
          preferred_contractor_id?: string | null
          service_area?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          preferred_contractor_id?: string | null
          service_area?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_contractor_id_fkey"
            columns: ["preferred_contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          created_at: string
          id: string
          is_primary: boolean | null
          owner_id: string
          property_type: string | null
          square_footage: number | null
          state: string
          updated_at: string
          year_built: number | null
          zip_code: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          owner_id: string
          property_type?: string | null
          square_footage?: number | null
          state: string
          updated_at?: string
          year_built?: number | null
          zip_code: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          owner_id?: string
          property_type?: string | null
          square_footage?: number | null
          state?: string
          updated_at?: string
          year_built?: number | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          assessment_id: string | null
          contractor_id: string
          created_at: string
          declined_at: string | null
          discount_usd: number | null
          estimated_hours: number | null
          id: string
          labor_cost_usd: number
          materials_cost_usd: number | null
          notes: string | null
          permit_cost_usd: number | null
          proposed_date: string | null
          quote_type: string
          sent_at: string | null
          status: string | null
          total_usd: number | null
          unit_manufacturer: string | null
          unit_model: string | null
          unit_price_usd: number | null
          updated_at: string
          valid_until: string | null
          warranty_terms: string | null
          water_heater_id: string
        }
        Insert: {
          accepted_at?: string | null
          assessment_id?: string | null
          contractor_id: string
          created_at?: string
          declined_at?: string | null
          discount_usd?: number | null
          estimated_hours?: number | null
          id?: string
          labor_cost_usd: number
          materials_cost_usd?: number | null
          notes?: string | null
          permit_cost_usd?: number | null
          proposed_date?: string | null
          quote_type: string
          sent_at?: string | null
          status?: string | null
          total_usd?: number | null
          unit_manufacturer?: string | null
          unit_model?: string | null
          unit_price_usd?: number | null
          updated_at?: string
          valid_until?: string | null
          warranty_terms?: string | null
          water_heater_id: string
        }
        Update: {
          accepted_at?: string | null
          assessment_id?: string | null
          contractor_id?: string
          created_at?: string
          declined_at?: string | null
          discount_usd?: number | null
          estimated_hours?: number | null
          id?: string
          labor_cost_usd?: number
          materials_cost_usd?: number | null
          notes?: string | null
          permit_cost_usd?: number | null
          proposed_date?: string | null
          quote_type?: string
          sent_at?: string | null
          status?: string | null
          total_usd?: number | null
          unit_manufacturer?: string | null
          unit_model?: string | null
          unit_price_usd?: number | null
          updated_at?: string
          valid_until?: string | null
          warranty_terms?: string | null
          water_heater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
            referencedColumns: ["id"]
          },
        ]
      }
      service_events: {
        Row: {
          cost_usd: number | null
          created_at: string
          event_date: string
          event_type: Database["public"]["Enums"]["service_event_type"]
          health_score_after: number | null
          health_score_before: number | null
          id: string
          notes: string | null
          performed_by: string | null
          photos: Json | null
          water_heater_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          event_date?: string
          event_type: Database["public"]["Enums"]["service_event_type"]
          health_score_after?: number | null
          health_score_before?: number | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          photos?: Json | null
          water_heater_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          event_date?: string
          event_type?: Database["public"]["Enums"]["service_event_type"]
          health_score_after?: number | null
          health_score_before?: number | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          photos?: Json | null
          water_heater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_events_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_events_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_prices: {
        Row: {
          capacity_gallons: number
          confidence_score: number | null
          created_at: string
          fuel_type: string
          id: string
          lookup_date: string
          manufacturer: string | null
          model_number: string | null
          price_source: string | null
          quality_tier: string
          retail_price_usd: number
          source_url: string | null
          updated_at: string
          vent_type: string
          warranty_years: number
          wholesale_price_usd: number | null
        }
        Insert: {
          capacity_gallons?: number
          confidence_score?: number | null
          created_at?: string
          fuel_type?: string
          id?: string
          lookup_date?: string
          manufacturer?: string | null
          model_number?: string | null
          price_source?: string | null
          quality_tier?: string
          retail_price_usd: number
          source_url?: string | null
          updated_at?: string
          vent_type?: string
          warranty_years?: number
          wholesale_price_usd?: number | null
        }
        Update: {
          capacity_gallons?: number
          confidence_score?: number | null
          created_at?: string
          fuel_type?: string
          id?: string
          lookup_date?: string
          manufacturer?: string | null
          model_number?: string | null
          price_source?: string | null
          quality_tier?: string
          retail_price_usd?: number
          source_url?: string | null
          updated_at?: string
          vent_type?: string
          warranty_years?: number
          wholesale_price_usd?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      water_heaters: {
        Row: {
          calendar_age_years: number | null
          created_at: string
          created_by: string | null
          fuel_type: string
          has_circ_pump: boolean | null
          has_exp_tank: boolean | null
          has_prv: boolean | null
          has_softener: boolean | null
          id: string
          install_date: string | null
          is_closed_loop: boolean | null
          is_finished_area: boolean | null
          location: string | null
          manufacturer: string | null
          model_number: string | null
          notes: string | null
          photo_urls: Json | null
          property_id: string
          quality_tier: string | null
          serial_number: string | null
          tank_capacity_gallons: number
          temp_setting: string | null
          updated_at: string
          vent_type: string | null
          warranty_years: number | null
        }
        Insert: {
          calendar_age_years?: number | null
          created_at?: string
          created_by?: string | null
          fuel_type?: string
          has_circ_pump?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          id?: string
          install_date?: string | null
          is_closed_loop?: boolean | null
          is_finished_area?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          photo_urls?: Json | null
          property_id: string
          quality_tier?: string | null
          serial_number?: string | null
          tank_capacity_gallons?: number
          temp_setting?: string | null
          updated_at?: string
          vent_type?: string | null
          warranty_years?: number | null
        }
        Update: {
          calendar_age_years?: number | null
          created_at?: string
          created_by?: string | null
          fuel_type?: string
          has_circ_pump?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          id?: string
          install_date?: string | null
          is_closed_loop?: boolean | null
          is_finished_area?: boolean | null
          location?: string | null
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          photo_urls?: Json | null
          property_id?: string
          quality_tier?: string | null
          serial_number?: string | null
          tank_capacity_gallons?: number
          temp_setting?: string | null
          updated_at?: string
          vent_type?: string | null
          warranty_years?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "water_heaters_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_heaters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      water_softeners: {
        Row: {
          capacity_grains: number | null
          control_head: string | null
          created_at: string
          created_by: string | null
          has_carbon_filter: boolean | null
          id: string
          install_date: string | null
          manufacturer: string | null
          model_number: string | null
          notes: string | null
          photo_urls: Json | null
          property_id: string
          resin_type: string | null
          serial_number: string | null
          updated_at: string
          visual_height: string | null
        }
        Insert: {
          capacity_grains?: number | null
          control_head?: string | null
          created_at?: string
          created_by?: string | null
          has_carbon_filter?: boolean | null
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          photo_urls?: Json | null
          property_id: string
          resin_type?: string | null
          serial_number?: string | null
          updated_at?: string
          visual_height?: string | null
        }
        Update: {
          capacity_grains?: number | null
          control_head?: string | null
          created_at?: string
          created_by?: string | null
          has_carbon_filter?: boolean | null
          id?: string
          install_date?: string | null
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          photo_urls?: Json | null
          property_id?: string
          resin_type?: string | null
          serial_number?: string | null
          updated_at?: string
          visual_height?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_softeners_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      contractor_has_relationship: {
        Args: { _contractor_id: string; _property_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contractor" | "homeowner"
      assessment_source:
        | "homeowner_onboarding"
        | "homeowner_update"
        | "contractor_inspection"
      service_event_type:
        | "inspection"
        | "flush"
        | "anode_replacement"
        | "repair"
        | "thermostat_adjustment"
        | "prv_install"
        | "exp_tank_install"
        | "replacement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contractor", "homeowner"],
      assessment_source: [
        "homeowner_onboarding",
        "homeowner_update",
        "contractor_inspection",
      ],
      service_event_type: [
        "inspection",
        "flush",
        "anode_replacement",
        "repair",
        "thermostat_adjustment",
        "prv_install",
        "exp_tank_install",
        "replacement",
      ],
    },
  },
} as const
