import type { 
  FuelType, 
  LocationType, 
  VentType, 
  TempSetting,
  AirFilterStatus, 
  InletFilterStatus, 
  FlameRodStatus, 
  VentStatus 
} from '@/lib/opterraAlgorithm';

// Salt status options (for technician quick-check)
export type SaltStatusType = 'OK' | 'EMPTY' | 'UNKNOWN';

// Step 1: Asset Identification
export interface AssetIdentification {
  brand: string;
  model: string;
  serialNumber: string;
  fuelType: FuelType;
  tankCapacity?: number;      // Gallons (tank/hybrid)
  ratedFlowGPM?: number;      // GPM (tankless)
  ventType?: VentType;        // Gas units only
  warrantyYears: number;      // Derived from brand/model or manual
  // Venting Scenario - conditional based on ventType:
  // ATMOSPHERIC: SHARED_FLUE or ORPHANED_FLUE (based on furnace sharing)
  // POWER_VENT: auto-set to DIRECT_VENT (no flue)
  // DIRECT_VENT: auto-set to DIRECT_VENT
  ventingScenario?: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';
  // Power vent exhaust pipe size (for tankless reuse assessment)
  exhaustPipeSize?: '2' | '3';
  // Anode Count ("Sticker Slap" Fix)
  anodeCount?: 1 | 2;
}

// Step 2: Pressure & Water Measurements
export interface WaterMeasurements {
  housePsi: number;
  measuredHardnessGPG?: number;  // Test strip result - CRITICAL for softener check
  flowRateGPM?: number;          // Tankless: current flow
  flowRateUnknown?: boolean;     // True if tech couldn't determine flow rate
}

// Step 3: Location & Condition
export interface LocationCondition {
  location: LocationType;
  isFinishedArea?: boolean;  // undefined = not answered yet
  visualRust: boolean;
  isLeaking: boolean;
  tempSetting?: TempSetting;  // undefined = not answered yet
  // NEW v7.8: Leak Source Classification ("Leak False Positive" Fix)
  leakSource?: 'NONE' | 'TANK_BODY' | 'FITTING_VALVE' | 'DRAIN_PAN';
}

// Step 4: Equipment Checklist

// NEW v7.10: Nipple Material Verification ("Smart Galvanic Detection")
// Used when Direct Copper is selected to verify actual corrosion risk
export type NippleMaterial = 'STEEL' | 'STAINLESS_BRASS' | 'FACTORY_PROTECTED';

export interface EquipmentChecklist {
  hasExpTank: boolean;
  hasPrv: boolean;
  hasCircPump: boolean;
  isClosedLoop: boolean;
  hasIsolationValves?: boolean;  // Tankless only
  // NEW v7.8: Expansion Tank Status ("Zombie Tank" Fix)
  expTankStatus?: 'FUNCTIONAL' | 'WATERLOGGED' | 'MISSING';
  // NEW v7.8: Drain Pan ("Attic Bomb" Fix)
  hasDrainPan?: boolean;
  // NEW v7.9: Connection Type ("Galvanic Blind Spot" Fix)
  connectionType?: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER';
  // NEW v7.10: Nipple Material ("Smart Galvanic Detection")
  // Only relevant when connectionType is DIRECT_COPPER
  // STEEL = galvanic risk confirmed, STAINLESS_BRASS/FACTORY_PROTECTED = safe
  nippleMaterial?: NippleMaterial;
}

// Step 5: Softener Inspection - SIMPLIFIED "Gatekeeper" approach
// Only 3 fields: presence, salt status, and hardness (in measurements)
export interface SoftenerInspection {
  hasSoftener?: boolean;  // undefined = not answered yet
  saltStatus?: SaltStatusType;
  // measuredHardnessGPG lives in WaterMeasurements - that's the test strip result
}

// Step 6: Hybrid-Specific (if applicable)
export interface HybridInspection {
  airFilterStatus: AirFilterStatus;
  isCondensateClear: boolean;
  compressorHealth?: number;  // 0-100 (optional advanced)
  // NEW v7.9: Room Volume Type ("Hybrid Suffocation" Fix)
  roomVolumeType?: 'OPEN' | 'CLOSET_LOUVERED' | 'CLOSET_SEALED';
}

// Step 7: Tankless-Specific (if applicable)
// v8.0 SIMPLIFIED: Algorithm calculates scale from hardness × time
// Removed deprecated fields: scaleBuildup slider, igniterHealth, elementHealth, flameRodStatus, inletWaterTemp
export interface TanklessInspection {
  inletFilterStatus: InletFilterStatus;
  tanklessVentStatus?: VentStatus;     // Gas only
  errorCodeCount: number;
  // NEW v7.8: Gas Starvation Detection
  gasLineSize?: '1/2' | '3/4' | '1';   // Inch diameter
  gasRunLength?: number;               // Feet from meter
  // NEW v7.9: Descale Liability
  lastDescaleYearsAgo?: number;        // Years since last descale
}

// Building type for inspection context
export type BuildingType = 'residential' | 'multifamily' | 'commercial';

// Complete technician inspection data
export interface TechnicianInspectionData {
  // When inspection started
  inspectedAt: string;  // ISO date
  
  // Building context
  buildingType?: BuildingType;
  
  // Core data (all units)
  asset: AssetIdentification;
  measurements: WaterMeasurements;
  location: LocationCondition;
  equipment: EquipmentChecklist;
  softener: SoftenerInspection;
  
  // Unit-specific (optional based on fuelType)
  hybrid?: HybridInspection;
  tankless?: TanklessInspection;
  
  // Derived
  calendarAge: number;  // Calculated from serial/install date
  streetHardnessGPG: number;  // Auto-fetched from API
}

// Defaults for initialization
export const DEFAULT_ASSET_IDENTIFICATION: AssetIdentification = {
  brand: '',
  model: '',
  serialNumber: '',
  fuelType: 'GAS',
  tankCapacity: 50,
  warrantyYears: 6,
};

export const DEFAULT_WATER_MEASUREMENTS: WaterMeasurements = {
  housePsi: 60,
  flowRateUnknown: false,
};

export const DEFAULT_LOCATION_CONDITION: LocationCondition = {
  location: 'GARAGE',
  isFinishedArea: undefined,  // Requires explicit selection
  visualRust: undefined as unknown as boolean,  // Requires explicit selection
  isLeaking: undefined as unknown as boolean,   // Requires explicit selection
  tempSetting: undefined,  // Requires explicit selection
};

export const DEFAULT_EQUIPMENT_CHECKLIST: EquipmentChecklist = {
  hasExpTank: undefined as unknown as boolean,   // Requires explicit selection
  hasPrv: undefined as unknown as boolean,       // Requires explicit selection
  hasCircPump: false,
  isClosedLoop: false,
  hasDrainPan: undefined,                        // Requires explicit selection
  connectionType: undefined,                      // Requires explicit selection
};

export const DEFAULT_SOFTENER_INSPECTION: SoftenerInspection = {
  hasSoftener: undefined,  // Requires explicit selection
};

export const DEFAULT_HYBRID_INSPECTION: HybridInspection = {
  airFilterStatus: 'CLEAN',
  isCondensateClear: true,
};

export const DEFAULT_TANKLESS_INSPECTION: TanklessInspection = {
  inletFilterStatus: 'CLEAN',
  errorCodeCount: 0,
  tanklessVentStatus: 'CLEAR',
};

export const DEFAULT_TECHNICIAN_DATA: TechnicianInspectionData = {
  inspectedAt: new Date().toISOString(),
  asset: DEFAULT_ASSET_IDENTIFICATION,
  measurements: DEFAULT_WATER_MEASUREMENTS,
  location: DEFAULT_LOCATION_CONDITION,
  equipment: DEFAULT_EQUIPMENT_CHECKLIST,
  softener: DEFAULT_SOFTENER_INSPECTION,
  calendarAge: 0,
  streetHardnessGPG: 10,  // Will be overwritten by API
};

// Common water heater brands
export const WATER_HEATER_BRANDS = [
  'A.O. Smith',
  'Bradford White',
  'Rheem',
  'Rinnai',
  'Navien',
  'Takagi',
  'Noritz',
  'State',
  'Lochinvar',
  'American',
  'Whirlpool',
  'GE',
  'Kenmore',
  'Ruud',
  'Other',
] as const;

// Helper to determine if unit is tankless
export function isTankless(fuelType: FuelType): boolean {
  return fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
}

// Helper to determine if unit is hybrid
export function isHybrid(fuelType: FuelType): boolean {
  return fuelType === 'HYBRID';
}

// Helper to determine if unit uses gas
export function isGasUnit(fuelType: FuelType): boolean {
  return fuelType === 'GAS' || fuelType === 'TANKLESS_GAS';
}
