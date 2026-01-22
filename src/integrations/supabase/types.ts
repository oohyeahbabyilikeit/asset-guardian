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
            referencedRelation: "tank_water_heaters"
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
      contractor_service_prices: {
        Row: {
          contractor_id: string
          created_at: string
          description: string | null
          estimated_minutes: number | null
          id: string
          price_usd: number
          service_type: string
          unit_type: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          price_usd: number
          service_type: string
          unit_type?: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          price_usd?: number
          service_type?: string
          unit_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          capture_context: Json | null
          capture_source: string
          contractor_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          opt_in_alerts: boolean | null
          preferred_contact_method: string | null
          property_id: string | null
          status: string | null
          updated_at: string
          water_heater_id: string | null
        }
        Insert: {
          capture_context?: Json | null
          capture_source: string
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          opt_in_alerts?: boolean | null
          preferred_contact_method?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          water_heater_id?: string | null
        }
        Update: {
          capture_context?: Json | null
          capture_source?: string
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          opt_in_alerts?: boolean | null
          preferred_contact_method?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          water_heater_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "tank_water_heaters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_notification_requests: {
        Row: {
          contractor_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          due_date: string
          id: string
          maintenance_type: string
          notes: string | null
          notification_lead_days: number | null
          property_id: string | null
          status: string | null
          updated_at: string
          water_heater_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          due_date: string
          id?: string
          maintenance_type: string
          notes?: string | null
          notification_lead_days?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          water_heater_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          due_date?: string
          id?: string
          maintenance_type?: string
          notes?: string | null
          notification_lead_days?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string
          water_heater_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_notification_requests_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notification_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notification_requests_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "tank_water_heaters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_notification_requests_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_notifications: {
        Row: {
          calculated_age: number | null
          contractor_id: string
          created_at: string
          dismiss_reason: string | null
          expires_at: string | null
          fail_probability: number | null
          health_score: number | null
          id: string
          opportunity_context: Json | null
          opportunity_type: string
          priority: string
          sent_at: string | null
          status: string
          updated_at: string
          viewed_at: string | null
          water_heater_id: string
        }
        Insert: {
          calculated_age?: number | null
          contractor_id: string
          created_at?: string
          dismiss_reason?: string | null
          expires_at?: string | null
          fail_probability?: number | null
          health_score?: number | null
          id?: string
          opportunity_context?: Json | null
          opportunity_type: string
          priority?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          viewed_at?: string | null
          water_heater_id: string
        }
        Update: {
          calculated_age?: number | null
          contractor_id?: string
          created_at?: string
          dismiss_reason?: string | null
          expires_at?: string | null
          fail_probability?: number | null
          health_score?: number | null
          id?: string
          opportunity_context?: Json | null
          opportunity_type?: string
          priority?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
          viewed_at?: string | null
          water_heater_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_notifications_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notifications_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "tank_water_heaters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_notifications_water_heater_id_fkey"
            columns: ["water_heater_id"]
            isOneToOne: false
            referencedRelation: "water_heaters"
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
            referencedRelation: "tank_water_heaters"
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
            referencedRelation: "tank_water_heaters"
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
      water_districts: {
        Row: {
          confidence: number | null
          created_at: string | null
          hardness_gpg: number | null
          last_verified: string | null
          sanitizer_type: string | null
          source_url: string | null
          utility_name: string | null
          zip_code: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          hardness_gpg?: number | null
          last_verified?: string | null
          sanitizer_type?: string | null
          source_url?: string | null
          utility_name?: string | null
          zip_code: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          hardness_gpg?: number | null
          last_verified?: string | null
          sanitizer_type?: string | null
          source_url?: string | null
          utility_name?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      water_heaters: {
        Row: {
          air_filter_status: string | null
          anode_count: number | null
          building_type: string | null
          calendar_age_years: number | null
          connection_type: string | null
          created_at: string
          created_by: string | null
          error_code_count: number | null
          exp_tank_status: string | null
          flame_rod_status: string | null
          fuel_type: string
          gas_line_size: string | null
          has_circ_pump: boolean | null
          has_drain_pan: boolean | null
          has_exp_tank: boolean | null
          has_prv: boolean | null
          has_softener: boolean | null
          house_psi: number | null
          id: string
          inlet_filter_status: string | null
          install_date: string | null
          is_annually_maintained: boolean | null
          is_closed_loop: boolean | null
          is_condensate_clear: boolean | null
          is_finished_area: boolean | null
          is_leaking: boolean | null
          last_anode_replace_years_ago: number | null
          last_descale_years_ago: number | null
          last_flush_years_ago: number | null
          leak_source: string | null
          location: string | null
          manufacturer: string | null
          measured_hardness_gpg: number | null
          model_number: string | null
          nipple_material: string | null
          notes: string | null
          people_count: number | null
          photo_urls: Json | null
          property_id: string
          quality_tier: string | null
          rated_flow_gpm: number | null
          room_volume_type: string | null
          sanitizer_type: string | null
          serial_number: string | null
          softener_salt_status: string | null
          street_hardness_gpg: number | null
          tank_capacity_gallons: number
          temp_setting: string | null
          updated_at: string
          usage_type: string | null
          vent_type: string | null
          venting_scenario: string | null
          visual_rust: boolean | null
          warranty_years: number | null
          years_without_anode: number | null
          years_without_softener: number | null
        }
        Insert: {
          air_filter_status?: string | null
          anode_count?: number | null
          building_type?: string | null
          calendar_age_years?: number | null
          connection_type?: string | null
          created_at?: string
          created_by?: string | null
          error_code_count?: number | null
          exp_tank_status?: string | null
          flame_rod_status?: string | null
          fuel_type?: string
          gas_line_size?: string | null
          has_circ_pump?: boolean | null
          has_drain_pan?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          house_psi?: number | null
          id?: string
          inlet_filter_status?: string | null
          install_date?: string | null
          is_annually_maintained?: boolean | null
          is_closed_loop?: boolean | null
          is_condensate_clear?: boolean | null
          is_finished_area?: boolean | null
          is_leaking?: boolean | null
          last_anode_replace_years_ago?: number | null
          last_descale_years_ago?: number | null
          last_flush_years_ago?: number | null
          leak_source?: string | null
          location?: string | null
          manufacturer?: string | null
          measured_hardness_gpg?: number | null
          model_number?: string | null
          nipple_material?: string | null
          notes?: string | null
          people_count?: number | null
          photo_urls?: Json | null
          property_id: string
          quality_tier?: string | null
          rated_flow_gpm?: number | null
          room_volume_type?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          softener_salt_status?: string | null
          street_hardness_gpg?: number | null
          tank_capacity_gallons?: number
          temp_setting?: string | null
          updated_at?: string
          usage_type?: string | null
          vent_type?: string | null
          venting_scenario?: string | null
          visual_rust?: boolean | null
          warranty_years?: number | null
          years_without_anode?: number | null
          years_without_softener?: number | null
        }
        Update: {
          air_filter_status?: string | null
          anode_count?: number | null
          building_type?: string | null
          calendar_age_years?: number | null
          connection_type?: string | null
          created_at?: string
          created_by?: string | null
          error_code_count?: number | null
          exp_tank_status?: string | null
          flame_rod_status?: string | null
          fuel_type?: string
          gas_line_size?: string | null
          has_circ_pump?: boolean | null
          has_drain_pan?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          house_psi?: number | null
          id?: string
          inlet_filter_status?: string | null
          install_date?: string | null
          is_annually_maintained?: boolean | null
          is_closed_loop?: boolean | null
          is_condensate_clear?: boolean | null
          is_finished_area?: boolean | null
          is_leaking?: boolean | null
          last_anode_replace_years_ago?: number | null
          last_descale_years_ago?: number | null
          last_flush_years_ago?: number | null
          leak_source?: string | null
          location?: string | null
          manufacturer?: string | null
          measured_hardness_gpg?: number | null
          model_number?: string | null
          nipple_material?: string | null
          notes?: string | null
          people_count?: number | null
          photo_urls?: Json | null
          property_id?: string
          quality_tier?: string | null
          rated_flow_gpm?: number | null
          room_volume_type?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          softener_salt_status?: string | null
          street_hardness_gpg?: number | null
          tank_capacity_gallons?: number
          temp_setting?: string | null
          updated_at?: string
          usage_type?: string | null
          vent_type?: string | null
          venting_scenario?: string | null
          visual_rust?: boolean | null
          warranty_years?: number | null
          years_without_anode?: number | null
          years_without_softener?: number | null
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
          quality_tier: string | null
          resin_type: string | null
          salt_status: string | null
          sanitizer_type: string | null
          serial_number: string | null
          updated_at: string
          visual_condition: string | null
          visual_height: string | null
          visual_iron: boolean | null
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
          quality_tier?: string | null
          resin_type?: string | null
          salt_status?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          updated_at?: string
          visual_condition?: string | null
          visual_height?: string | null
          visual_iron?: boolean | null
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
          quality_tier?: string | null
          resin_type?: string | null
          salt_status?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          updated_at?: string
          visual_condition?: string | null
          visual_height?: string | null
          visual_iron?: boolean | null
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
      tank_water_heaters: {
        Row: {
          air_filter_status: string | null
          anode_count: number | null
          building_type: string | null
          calendar_age_years: number | null
          connection_type: string | null
          created_at: string | null
          created_by: string | null
          error_code_count: number | null
          exp_tank_status: string | null
          flame_rod_status: string | null
          fuel_type: string | null
          gas_line_size: string | null
          has_circ_pump: boolean | null
          has_drain_pan: boolean | null
          has_exp_tank: boolean | null
          has_prv: boolean | null
          has_softener: boolean | null
          house_psi: number | null
          id: string | null
          inlet_filter_status: string | null
          install_date: string | null
          is_annually_maintained: boolean | null
          is_closed_loop: boolean | null
          is_condensate_clear: boolean | null
          is_finished_area: boolean | null
          is_leaking: boolean | null
          last_anode_replace_years_ago: number | null
          last_descale_years_ago: number | null
          last_flush_years_ago: number | null
          leak_source: string | null
          location: string | null
          manufacturer: string | null
          measured_hardness_gpg: number | null
          model_number: string | null
          nipple_material: string | null
          notes: string | null
          people_count: number | null
          photo_urls: Json | null
          property_id: string | null
          quality_tier: string | null
          rated_flow_gpm: number | null
          room_volume_type: string | null
          sanitizer_type: string | null
          serial_number: string | null
          softener_salt_status: string | null
          street_hardness_gpg: number | null
          tank_capacity_gallons: number | null
          temp_setting: string | null
          updated_at: string | null
          usage_type: string | null
          vent_type: string | null
          venting_scenario: string | null
          visual_rust: boolean | null
          warranty_years: number | null
          years_without_anode: number | null
          years_without_softener: number | null
        }
        Insert: {
          air_filter_status?: string | null
          anode_count?: number | null
          building_type?: string | null
          calendar_age_years?: number | null
          connection_type?: string | null
          created_at?: string | null
          created_by?: string | null
          error_code_count?: number | null
          exp_tank_status?: string | null
          flame_rod_status?: string | null
          fuel_type?: string | null
          gas_line_size?: string | null
          has_circ_pump?: boolean | null
          has_drain_pan?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          house_psi?: number | null
          id?: string | null
          inlet_filter_status?: string | null
          install_date?: string | null
          is_annually_maintained?: boolean | null
          is_closed_loop?: boolean | null
          is_condensate_clear?: boolean | null
          is_finished_area?: boolean | null
          is_leaking?: boolean | null
          last_anode_replace_years_ago?: number | null
          last_descale_years_ago?: number | null
          last_flush_years_ago?: number | null
          leak_source?: string | null
          location?: string | null
          manufacturer?: string | null
          measured_hardness_gpg?: number | null
          model_number?: string | null
          nipple_material?: string | null
          notes?: string | null
          people_count?: number | null
          photo_urls?: Json | null
          property_id?: string | null
          quality_tier?: string | null
          rated_flow_gpm?: number | null
          room_volume_type?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          softener_salt_status?: string | null
          street_hardness_gpg?: number | null
          tank_capacity_gallons?: number | null
          temp_setting?: string | null
          updated_at?: string | null
          usage_type?: string | null
          vent_type?: string | null
          venting_scenario?: string | null
          visual_rust?: boolean | null
          warranty_years?: number | null
          years_without_anode?: number | null
          years_without_softener?: number | null
        }
        Update: {
          air_filter_status?: string | null
          anode_count?: number | null
          building_type?: string | null
          calendar_age_years?: number | null
          connection_type?: string | null
          created_at?: string | null
          created_by?: string | null
          error_code_count?: number | null
          exp_tank_status?: string | null
          flame_rod_status?: string | null
          fuel_type?: string | null
          gas_line_size?: string | null
          has_circ_pump?: boolean | null
          has_drain_pan?: boolean | null
          has_exp_tank?: boolean | null
          has_prv?: boolean | null
          has_softener?: boolean | null
          house_psi?: number | null
          id?: string | null
          inlet_filter_status?: string | null
          install_date?: string | null
          is_annually_maintained?: boolean | null
          is_closed_loop?: boolean | null
          is_condensate_clear?: boolean | null
          is_finished_area?: boolean | null
          is_leaking?: boolean | null
          last_anode_replace_years_ago?: number | null
          last_descale_years_ago?: number | null
          last_flush_years_ago?: number | null
          leak_source?: string | null
          location?: string | null
          manufacturer?: string | null
          measured_hardness_gpg?: number | null
          model_number?: string | null
          nipple_material?: string | null
          notes?: string | null
          people_count?: number | null
          photo_urls?: Json | null
          property_id?: string | null
          quality_tier?: string | null
          rated_flow_gpm?: number | null
          room_volume_type?: string | null
          sanitizer_type?: string | null
          serial_number?: string | null
          softener_salt_status?: string | null
          street_hardness_gpg?: number | null
          tank_capacity_gallons?: number | null
          temp_setting?: string | null
          updated_at?: string | null
          usage_type?: string | null
          vent_type?: string | null
          venting_scenario?: string | null
          visual_rust?: boolean | null
          warranty_years?: number | null
          years_without_anode?: number | null
          years_without_softener?: number | null
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
