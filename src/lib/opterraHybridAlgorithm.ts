/**
 * OPTERRA HYBRID ENGINE (v1.0 MVP Stub)
 * 
 * Heat Pump Water Heater specific algorithm.
 * 
 * CURRENT STATE: Falls back to tank logic with hybrid-specific safety checks.
 * This allows shipping the tank engine immediately while keeping hybrid units functional.
 * 
 * FUTURE: Full hybrid-specific physics including:
 * - Compressor lifecycle modeling
 * - Air filter degradation curves
 * - Condensate drain failure modes
 * - COP efficiency loss calculations
 * - Room volume airflow requirements
 */

import { 
  ForensicInputs, 
  OpterraMetrics, 
  Recommendation, 
  OpterraResult,
} from './opterraTypes';

// Import tank engine for fallback
import { 
  calculateHealth, 
  getRawRecommendation, 
  optimizeTechnicalNecessity,
  calculateFinancialForecast,
  calculateHardWaterTax,
  generatePlumberHandshake 
} from './opterraAlgorithm';

// --- HYBRID-SPECIFIC FAILURE MODES ---

/**
 * Check for hybrid-specific critical failures that supersede tank logic.
 * These are checked BEFORE falling back to tank engine.
 */
function getHybridCriticalFailure(data: ForensicInputs): Recommendation | null {
  // Filter Clog - Heat pump cannot draw air, compressor damage imminent
  if (data.airFilterStatus === 'CLOGGED') {
    return {
      action: 'REPAIR',
      title: 'Filter Clog',
      reason: 'Clogged air filter is starving the heat pump compressor. Immediate cleaning required to prevent compressor failure.',
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }
  
  // Condensate Blockage - water backing up can damage electronics
  if (data.isCondensateClear === false) {
    return {
      action: 'REPAIR',
      title: 'Condensate Blockage',
      reason: 'Condensate drain is blocked. Water backup can damage control board and create mold. Clear drain immediately.',
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }
  
  // Room Volume Warning - Heat pump in sealed closet
  if (data.roomVolumeType === 'CLOSET_SEALED') {
    return {
      action: 'UPGRADE',
      title: 'Insufficient Airflow',
      reason: 'Heat pump installed in sealed closet. Unit requires ~700 cubic feet of air volume to operate efficiently. Add louvered door or ductwork.',
      urgent: false,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }
  
  return null;
}

/**
 * Calculate hybrid efficiency based on operating conditions.
 * Returns 0-100% efficiency score.
 */
function calculateHybridEfficiency(data: ForensicInputs): number {
  let efficiency = 100;
  
  // Air filter condition impacts efficiency
  if (data.airFilterStatus === 'DIRTY') {
    efficiency -= 15;
  } else if (data.airFilterStatus === 'CLOGGED') {
    efficiency -= 40;
  }
  
  // Room volume impacts heat extraction
  if (data.roomVolumeType === 'CLOSET_LOUVERED') {
    efficiency -= 10;
  } else if (data.roomVolumeType === 'CLOSET_SEALED') {
    efficiency -= 30;
  }
  
  // Compressor health directly impacts efficiency
  const compressorHealth = data.compressorHealth ?? 100;
  efficiency = efficiency * (compressorHealth / 100);
  
  // Condensate issues reduce efficiency slightly
  if (data.isCondensateClear === false) {
    efficiency -= 5;
  }
  
  return Math.max(0, Math.min(100, efficiency));
}

// --- MAIN HYBRID ENTRY POINT ---

/**
 * Calculate Opterra risk for Hybrid (Heat Pump) water heaters.
 * 
 * Strategy: Check hybrid-specific failures first, then fall back to tank logic.
 * This is an MVP approach - hybrid tanks have all the same tank issues PLUS
 * additional failure modes unique to the heat pump components.
 */
export function calculateOpterraHybridRisk(data: ForensicInputs): OpterraResult {
  console.log('[Hybrid Engine] Processing hybrid unit - MVP fallback to tank logic');
  
  // 1. Check for hybrid-specific critical failures FIRST
  const hybridFailure = getHybridCriticalFailure(data);
  
  // 2. Calculate tank metrics (hybrid tanks still have anode, sediment, etc.)
  const metrics = calculateHealth(data);
  
  // 3. Add hybrid-specific metrics
  metrics.hybridEfficiency = calculateHybridEfficiency(data);
  
  // 4. Determine verdict
  let verdict: Recommendation;
  
  if (hybridFailure) {
    // Hybrid-specific failure takes precedence
    verdict = hybridFailure;
  } else {
    // Fall back to standard tank recommendation logic
    const rawVerdict = getRawRecommendation(metrics, data);
    verdict = optimizeTechnicalNecessity(rawVerdict, data, metrics);
  }
  
  // 5. Calculate financial and other outputs using tank logic
  const financial = calculateFinancialForecast(data, metrics);
  const hardWaterTax = calculateHardWaterTax(data, metrics);
  const handshake = generatePlumberHandshake(data, metrics, verdict);
  
  return { metrics, verdict, handshake, hardWaterTax, financial };
}

// --- EXPORTS FOR FUTURE HYBRID-SPECIFIC DEVELOPMENT ---

export { getHybridCriticalFailure, calculateHybridEfficiency };
