/**
 * Sync Mappers v1.0
 * 
 * Type-safe mapping functions to convert TechnicianInspectionData
 * to database table inserts for water_heaters, water_softeners, and assessments.
 */

import type { TechnicianInspectionData } from '@/types/technicianInspection';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
import { mapTechnicianToForensicInputs } from '@/types/technicianMapper';

// Type for water_heaters table insert (matches schema)
export interface WaterHeaterInsert {
  property_id: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  fuel_type: string;
  tank_capacity_gallons: number;
  vent_type?: string;
  warranty_years?: number;
  calendar_age_years?: number;
  install_date?: string;
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
  created_by: string;
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
}

// Type for water_softeners table insert
export interface WaterSoftenerInsert {
  property_id: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  capacity_grains?: number;
  control_head?: string;
  visual_height?: string;
  has_carbon_filter?: boolean;
  resin_type?: string;
  install_date?: string;
  notes?: string;
  created_by: string;
  photo_urls?: string[];
  // v7.8-7.9 fields
  salt_status?: string;
  quality_tier?: string;
  visual_iron?: boolean;
  visual_condition?: string;
  sanitizer_type?: string;
}

// Type for assessments table insert
export interface AssessmentInsert {
  water_heater_id: string;
  assessor_id: string;
  source: 'contractor_inspection' | 'homeowner_onboarding' | 'ai_analysis';
  forensic_inputs: ForensicInputs;
  photos?: string[];
  opterra_result?: Record<string, unknown>;
  risk_level?: number;
  fail_probability?: number;
  bio_age?: number;
  health_score?: number;
  usage_type?: string;
  symptoms?: Record<string, boolean>;
  last_anode_replace_years_ago?: number;
  last_flush_years_ago?: number;
  years_at_address?: number;
  people_count?: number;
  recommendation_action?: string;
  recommendation_title?: string;
  inspection_notes?: string;
  status?: string;
}

/**
 * Maps visual height to estimated grain capacity
 */
function getCapacityFromVisualHeight(visualHeight?: string): number {
  switch (visualHeight) {
    case 'KNEE': return 24000;
    case 'WAIST': return 32000;
    case 'CHEST': return 48000;
    case 'HEAD': return 64000;
    default: return 32000;
  }
}

/**
 * Map TechnicianInspectionData to water_heaters table insert
 */
export function mapInspectionToWaterHeater(
  data: TechnicianInspectionData,
  propertyId: string,
  createdBy: string,
  photoUrls: string[] = []
): WaterHeaterInsert {
  return {
    property_id: propertyId,
    manufacturer: data.asset.brand || undefined,
    model_number: data.asset.model || undefined,
    serial_number: data.asset.serialNumber || undefined,
    fuel_type: data.asset.fuelType,
    tank_capacity_gallons: data.asset.tankCapacity || 50,
    vent_type: data.asset.ventType || undefined,
    warranty_years: data.asset.warrantyYears || undefined,
    calendar_age_years: data.calendarAge || undefined,
    location: data.location.location || undefined,
    is_finished_area: data.location.isFinishedArea,
    temp_setting: data.location.tempSetting || undefined,
    has_softener: data.softener.hasSoftener,
    has_circ_pump: data.equipment.hasCircPump,
    has_exp_tank: data.equipment.hasExpTank,
    has_prv: data.equipment.hasPrv,
    is_closed_loop: data.equipment.isClosedLoop,
    quality_tier: undefined, // Not captured at asset level
    created_by: createdBy,
    photo_urls: photoUrls,
    
    // v7.8-7.9 fields
    venting_scenario: data.asset.ventingScenario || undefined,
    anode_count: data.asset.anodeCount || 1,
    exp_tank_status: data.equipment.expTankStatus || undefined,
    has_drain_pan: data.equipment.hasDrainPan,
    connection_type: data.equipment.connectionType || undefined,
    leak_source: data.location.leakSource || undefined,
    visual_rust: data.location.visualRust,
    is_leaking: data.location.isLeaking,
    house_psi: data.measurements.housePsi || undefined,
    street_hardness_gpg: data.streetHardnessGPG || undefined,
    building_type: data.buildingType || 'residential',
    
    // Tankless-specific
    rated_flow_gpm: data.asset.ratedFlowGPM || undefined,
    gas_line_size: data.tankless?.gasLineSize || undefined,
    last_descale_years_ago: data.tankless?.lastDescaleYearsAgo ?? undefined,
    flame_rod_status: data.tankless?.flameRodStatus || undefined,
    inlet_filter_status: data.tankless?.inletFilterStatus || undefined,
    error_code_count: data.tankless?.errorCodeCount || 0,
    
    // Hybrid-specific
    room_volume_type: data.hybrid?.roomVolumeType || undefined,
    air_filter_status: data.hybrid?.airFilterStatus || undefined,
    is_condensate_clear: data.hybrid?.isCondensateClear,
  };
}

/**
 * Map TechnicianInspectionData to water_softeners table insert
 * Returns null if no softener present
 */
export function mapInspectionToSoftener(
  data: TechnicianInspectionData,
  propertyId: string,
  createdBy: string,
  photoUrls: string[] = []
): WaterSoftenerInsert | null {
  if (!data.softener.hasSoftener) {
    return null;
  }

  return {
    property_id: propertyId,
    capacity_grains: getCapacityFromVisualHeight(data.softener.visualHeight),
    control_head: data.softener.controlHead || undefined,
    visual_height: data.softener.visualHeight || undefined,
    has_carbon_filter: data.softener.hasCarbonFilter,
    created_by: createdBy,
    photo_urls: photoUrls,
    
    // v7.8-7.9 fields
    salt_status: data.softener.saltStatus || 'UNKNOWN',
    quality_tier: data.softener.qualityTier || 'STANDARD',
    visual_iron: data.softener.visualIron || false,
    visual_condition: data.softener.visualCondition || 'WEATHERED',
    sanitizer_type: data.softener.sanitizerType || 'UNKNOWN',
  };
}

/**
 * Map TechnicianInspectionData to assessments table insert
 */
export function mapInspectionToAssessment(
  data: TechnicianInspectionData,
  waterHeaterId: string,
  assessorId: string,
  photoUrls: string[] = [],
  opterraResult?: Record<string, unknown>
): AssessmentInsert {
  const forensicInputs = mapTechnicianToForensicInputs(data);
  
  return {
    water_heater_id: waterHeaterId,
    assessor_id: assessorId,
    source: 'contractor_inspection',
    forensic_inputs: forensicInputs,
    photos: photoUrls,
    opterra_result: opterraResult,
    status: 'completed',
    inspection_notes: undefined, // Notes field not in current schema
  };
}

/**
 * Extract address data for property creation
 */
export interface PropertyUpsertData {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  owner_id: string;
  property_type?: string;
}

export function mapAddressToProperty(
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  },
  ownerId: string,
  buildingType?: string
): PropertyUpsertData {
  return {
    address_line1: address.line1,
    address_line2: address.line2,
    city: address.city,
    state: address.state,
    zip_code: address.zip,
    owner_id: ownerId,
    property_type: buildingType === 'residential' ? 'single_family' : 
                   buildingType === 'multifamily' ? 'multi_family' : 
                   buildingType === 'commercial' ? 'commercial' : 'single_family',
  };
}
