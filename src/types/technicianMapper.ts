import type { TechnicianInspectionData, SoftenerVisualCondition } from './technicianInspection';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
import type { SoftenerInputs, SaltLevelState } from '@/lib/softenerAlgorithm';

/**
 * Map technician inspection data to ForensicInputs for the Opterra algorithm
 */
export function mapTechnicianToForensicInputs(
  tech: TechnicianInspectionData,
  homeownerOverrides?: Partial<ForensicInputs>
): ForensicInputs {
  const baseInputs: ForensicInputs = {
    // Age & Warranty
    calendarAge: tech.calendarAge,
    warrantyYears: tech.asset.warrantyYears,
    
    // Measurements
    housePsi: tech.measurements.housePsi,
    
    // Location & Condition
    tempSetting: tech.location.tempSetting,
    location: tech.location.location,
    isFinishedArea: tech.location.isFinishedArea,
    
    // Unit Type
    fuelType: tech.asset.fuelType,
    
    // Hardness (Digital-First approach)
    streetHardnessGPG: tech.streetHardnessGPG,
    measuredHardnessGPG: tech.measurements.measuredHardnessGPG,
    hardnessGPG: tech.streetHardnessGPG,  // Legacy fallback
    
    // Softener
    hasSoftener: tech.softener.hasSoftener,
    softenerSaltStatus: tech.softener.saltStatus,
    
    // Equipment
    hasCircPump: tech.equipment.hasCircPump,
    hasExpTank: tech.equipment.hasExpTank,
    hasPrv: tech.equipment.hasPrv,
    isClosedLoop: tech.equipment.isClosedLoop,
    
    // NEW v7.8: Expansion Tank Status ("Zombie Tank" Fix)
    expTankStatus: tech.equipment.expTankStatus,
    // NEW v7.8: Drain Pan ("Attic Bomb" Fix)
    hasDrainPan: tech.equipment.hasDrainPan,
    // NEW v7.9: Connection Type ("Galvanic Blind Spot" Fix)
    connectionType: tech.equipment.connectionType,
    // NEW v7.10: Nipple Material ("Smart Galvanic Detection")
    nippleMaterial: tech.equipment.nippleMaterial,
    
    // Visual Inspection
    visualRust: tech.location.visualRust,
    isLeaking: tech.location.isLeaking,
    // NEW v7.8: Leak Source Classification ("Leak False Positive" Fix)
    leakSource: tech.location.leakSource,
    
    // Tank specs
    tankCapacity: tech.asset.tankCapacity || 50,
    
    // Vent type (gas units)
    ventType: tech.asset.ventType,
    // NEW v7.9: Venting Scenario ("Orphaned Vent Liability" Fix)
    ventingScenario: tech.asset.ventingScenario,
    // NEW v7.9: Anode Count ("Sticker Slap" Fix)
    anodeCount: tech.asset.anodeCount,
    
    // Usage defaults (will be overwritten by homeowner)
    peopleCount: 3,
    usageType: 'normal',
    lastFlushYearsAgo: undefined,
    lastAnodeReplaceYearsAgo: undefined,
    
    // Hybrid-specific
    airFilterStatus: tech.hybrid?.airFilterStatus,
    isCondensateClear: tech.hybrid?.isCondensateClear,
    compressorHealth: tech.hybrid?.compressorHealth,
    // NEW v7.9: Room Volume Type ("Hybrid Suffocation" Fix)
    roomVolumeType: tech.hybrid?.roomVolumeType,
    
    // Tankless-specific
    flowRateGPM: tech.measurements.flowRateGPM,
    ratedFlowGPM: tech.asset.ratedFlowGPM,
    flameRodStatus: tech.tankless?.flameRodStatus,
    inletFilterStatus: tech.tankless?.inletFilterStatus,
    tanklessVentStatus: tech.tankless?.tanklessVentStatus,
    errorCodeCount: tech.tankless?.errorCodeCount,
    scaleBuildup: tech.tankless?.scaleBuildup,
    hasIsolationValves: tech.equipment.hasIsolationValves,
    igniterHealth: tech.tankless?.igniterHealth,
    elementHealth: tech.tankless?.elementHealth,
    // NEW v7.8: Gas Starvation Detection
    gasLineSize: tech.tankless?.gasLineSize,
    gasRunLength: tech.tankless?.gasRunLength,
    // NEW v7.9: Descale Liability
    lastDescaleYearsAgo: tech.tankless?.lastDescaleYearsAgo,
    // NEW v7.7: Winter Flow Diagnosis
    inletWaterTemp: tech.tankless?.inletWaterTemp,
  };
  
  // Apply homeowner overrides if provided
  return { ...baseInputs, ...homeownerOverrides };
}

/**
 * Estimate softener age from visual condition
 * Used as fallback when serial decode fails and unit is pre-existing
 */
function getAgeFromVisualCondition(condition?: SoftenerVisualCondition): number {
  switch (condition) {
    case 'NEW': return 3;       // Looks new: ~3 years (conservative)
    case 'WEATHERED': return 8; // Yellowing, faded labels: ~8 years
    case 'AGED': return 12;     // Brittle plastic, illegible: 10+ years
    default: return 5;          // Unknown = conservative mid-range
  }
}

/**
 * Map technician softener inspection to SoftenerInputs
 */
export function mapTechnicianToSoftenerInputs(
  tech: TechnicianInspectionData,
  homeownerOverrides?: Partial<SoftenerInputs>
): SoftenerInputs | null {
  if (!tech.softener.hasSoftener) {
    return null;
  }
  
  // Use visual condition to estimate age (key fix for pre-existing softeners)
  const visualAge = getAgeFromVisualCondition(tech.softener.visualCondition);
  
  const baseInputs: SoftenerInputs = {
    ageYears: visualAge,  // Now uses visual condition, not 0
    hardnessGPG: tech.streetHardnessGPG,
    people: 3,  // Default, overwritten by homeowner
    isCityWater: true,  // Default, overwritten by homeowner
    hasCarbonFilter: tech.softener.hasCarbonFilter || false,
    visualHeight: tech.softener.visualHeight || 'WAIST',
    controlHead: tech.softener.controlHead || 'DIGITAL',
    visualIron: tech.softener.visualIron || false,
    carbonAgeYears: null,
    saltLevelState: mapSaltStatusToLevelState(tech.softener.saltStatus),
    qualityTier: tech.softener.qualityTier || 'STANDARD',
    capacity: getCapacityFromVisualHeight(tech.softener.visualHeight),
    // NEW v7.9: Sanitizer Type ("Chloramine Meltdown" Fix)
    sanitizerType: tech.softener.sanitizerType || 'UNKNOWN',
  };
  
  return { ...baseInputs, ...homeownerOverrides };
}

/**
 * Map salt status to salt level state
 */
function mapSaltStatusToLevelState(
  status?: 'OK' | 'EMPTY' | 'UNKNOWN'
): SaltLevelState {
  switch (status) {
    case 'OK':
      return 'OK';
    case 'EMPTY':
      return 'LOW';  // Map EMPTY to LOW for algorithm
    case 'UNKNOWN':
    default:
      return 'OK';  // Conservative default
  }
}

/**
 * Get grain capacity from visual height
 */
function getCapacityFromVisualHeight(height?: 'KNEE' | 'WAIST' | 'CHEST'): number {
  switch (height) {
    case 'KNEE':
      return 24000;
    case 'CHEST':
      return 48000;
    case 'WAIST':
    default:
      return 32000;
  }
}

/**
 * Asset display data for UI
 */
export interface AssetDisplayData {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  installYear?: number;
  calendarAge: number;
  biologicalAge?: number;
  location: string;
  specs: {
    capacity: string;
    fuelType: string;
    ventType: string;
    piping: string;
  };
}

/**
 * Map technician data to asset display format
 */
export function mapTechnicianToAssetDisplay(
  tech: TechnicianInspectionData
): AssetDisplayData {
  const installYear = tech.calendarAge > 0 
    ? new Date().getFullYear() - tech.calendarAge 
    : undefined;
  
  // Log mapper inputs for debugging
  console.log('[Mapper] Mapping technician data:', {
    brand: tech.asset.brand,
    model: tech.asset.model,
    serialNumber: tech.asset.serialNumber,
    fuelType: tech.asset.fuelType,
    tankCapacity: tech.asset.tankCapacity,
    ratedFlowGPM: tech.asset.ratedFlowGPM,
    calendarAge: tech.calendarAge,
    location: tech.location.location,
  });

  return {
    id: `TECH-${Date.now()}`,
    type: getUnitTypeLabel(tech.asset.fuelType),
    brand: tech.asset.brand || '[NOT CAPTURED]',
    model: tech.asset.model || '[NOT CAPTURED]',
    serialNumber: tech.asset.serialNumber || '[NOT CAPTURED]',
    installYear,
    calendarAge: tech.calendarAge || 0,
    location: getLocationLabel(tech.location.location) || '[NOT CAPTURED]',
    specs: {
      capacity: tech.asset.tankCapacity 
        ? `${tech.asset.tankCapacity}-Gal` 
        : tech.asset.ratedFlowGPM 
          ? `${tech.asset.ratedFlowGPM} GPM`
          : '[NOT CAPTURED]',
      fuelType: getFuelTypeLabel(tech.asset.fuelType),
      ventType: tech.asset.ventType || 'N/A',
      piping: '3/4"',
    },
  };
}

// Helper functions
function getUnitTypeLabel(fuelType: string): string {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return 'Tankless Gas Water Heater';
    case 'TANKLESS_ELECTRIC':
      return 'Tankless Electric Water Heater';
    case 'HYBRID':
      return 'Hybrid Heat Pump Water Heater';
    case 'ELECTRIC':
      return 'Electric Tank Water Heater';
    case 'GAS':
    default:
      return 'Gas Tank Water Heater';
  }
}

function getFuelTypeLabel(fuelType: string): string {
  switch (fuelType) {
    case 'TANKLESS_GAS':
    case 'GAS':
      return 'Natural Gas';
    case 'TANKLESS_ELECTRIC':
    case 'ELECTRIC':
      return 'Electric';
    case 'HYBRID':
      return 'Heat Pump';
    default:
      return fuelType;
  }
}

function getLocationLabel(location: string): string {
  switch (location) {
    case 'GARAGE':
      return 'Garage';
    case 'BASEMENT':
      return 'Basement';
    case 'ATTIC':
      return 'Attic';
    case 'UTILITY':
      return 'Utility Closet';
    case 'CRAWLSPACE':
      return 'Crawlspace';
    case 'EXTERIOR':
      return 'Exterior';
    default:
      return location;
  }
}
