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

// Re-export types from algorithm files for consistency
import { 
  SoftenerQualityTier, 
  ControlHead, 
  VisualHeight, 
  SaltLevelState 
} from '@/lib/softenerAlgorithm';

export type { SoftenerQualityTier, ControlHead, VisualHeight, SaltLevelState };

// Salt status options (for technician quick-check)
export type SaltStatusType = 'OK' | 'EMPTY' | 'UNKNOWN';

// Visual condition for age estimation (when serial decode fails)
export type SoftenerVisualCondition = 'NEW' | 'WEATHERED' | 'AGED';

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
  // NEW v7.9: Venting Scenario ("Orphaned Vent Liability" Fix)
  ventingScenario?: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';
  // NEW v7.9: Anode Count ("Sticker Slap" Fix)
  anodeCount?: 1 | 2;
}

// Step 2: Pressure & Water Measurements
export interface WaterMeasurements {
  housePsi: number;
  measuredHardnessGPG?: number;  // Optional test strip
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
}

// Step 5: Softener Inspection (if present)
export interface SoftenerInspection {
  hasSoftener?: boolean;  // undefined = not answered yet
  saltStatus?: SaltStatusType;
  qualityTier?: SoftenerQualityTier;
  controlHead?: ControlHead;
  visualHeight?: VisualHeight;
  visualIron?: boolean;
  hasCarbonFilter?: boolean;
  visualCondition?: SoftenerVisualCondition;  // Visual age proxy for pre-existing units
  // NEW v7.9: Sanitizer Type ("Chloramine Meltdown" Fix)
  sanitizerType?: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
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
export interface TanklessInspection {
  flameRodStatus?: FlameRodStatus;     // Gas only
  inletFilterStatus: InletFilterStatus;
  tanklessVentStatus?: VentStatus;     // Gas only
  errorCodeCount: number;
  scaleBuildup?: number;               // 0-100 (if known)
  igniterHealth?: number;              // Gas only
  elementHealth?: number;              // Electric only
  // NEW v7.8: Gas Starvation Detection
  gasLineSize?: '1/2' | '3/4' | '1';   // Inch diameter
  gasRunLength?: number;               // Feet from meter
  // NEW v7.9: Descale Liability
  lastDescaleYearsAgo?: number;        // Years since last descale
  // NEW v7.7: Winter Flow Diagnosis
  inletWaterTemp?: number;             // Degrees F (optional)
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
  visualRust: false,
  isLeaking: false,
  tempSetting: undefined,  // Requires explicit selection
};

export const DEFAULT_EQUIPMENT_CHECKLIST: EquipmentChecklist = {
  hasExpTank: false,
  hasPrv: false,
  hasCircPump: false,
  isClosedLoop: false,
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
