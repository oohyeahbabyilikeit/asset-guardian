/**
 * OPTERRA ROUTER (v9.2)
 * 
 * Central entry point for the Opterra risk calculation engine.
 * Routes to the appropriate algorithm based on fuel type.
 */

import type { ForensicInputs, OpterraResult } from './opterraTypes';
import { isTankless, isHybrid } from './opterraTypes';

// Import from existing algorithm files
import { calculateOpterraRisk as calculateTankOrTanklessRisk } from './opterraAlgorithm';
import { calculateOpterraHybridRisk } from './opterraHybridAlgorithm';

/**
 * Main entry point for Opterra risk calculation.
 * Routes to the appropriate algorithm based on fuel type.
 */
export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  // Route HYBRID to isolated hybrid engine
  if (isHybrid(data.fuelType)) {
    return calculateOpterraHybridRisk(data);
  }
  
  // Tank and Tankless use existing algorithm (already has internal routing)
  return calculateTankOrTanklessRisk(data);
}

// Re-export types for convenience
export type { 
  ForensicInputs, 
  OpterraResult, 
  OpterraMetrics, 
  Recommendation,
  HardWaterTax,
  FinancialForecast,
  PlumberHandshake,
  FuelType,
  TempSetting,
  LocationType,
  VentType,
  UsageType,
  QualityTier,
  RiskLevel,
  TierProfile,
  ExpansionTankStatus,
  LeakSource,
  ConnectionType,
  RoomVolumeType,
  AirFilterStatus,
  InletFilterStatus,
  VentStatus,
  FlameRodStatus,
} from './opterraTypes';

// Re-export helper functions
export { 
  isTankless, 
  isHybrid, 
  isStandardTank,
  failProbToHealthScore, 
  bioAgeToFailProb,
  projectFutureHealth,
  resolveHardness,
  getRiskLevelInfo,
  CONSTANTS,
  TIER_PROFILES,
} from './opterraTypes';
