/**
 * OPTERRA TANKLESS MVP ENGINE (v8.0 "Safe Mode")
 * 
 * Strategy: Replaces complex fluid dynamics with exception-based logic.
 * Avoids "100x Aging" bugs and "Negative Flow" errors.
 * 
 * Logic Gates:
 * 1. DEAD (Safety/Leak) -> REPLACE
 * 2. DYING (Codes/Old) -> REPAIR/REPLACE
 * 3. DIRTY (Scale Risk) -> MAINTAIN
 * 4. HEALTHY -> PASS
 */

import { 
  ForensicInputs, 
  OpterraMetrics, 
  Recommendation, 
  FinancialForecast, 
  TierProfile,
  VentType,
  RiskLevel,
  OpterraResult,
  failProbToHealthScore,
  resolveHardness,
} from './opterraTypes';

import { calculateHardWaterTax, generatePlumberHandshake } from './opterraAlgorithm';

// --- CONSTANTS ---

const TANKLESS_TIER_PROFILES: Record<string, TierProfile> = {
  BUILDER: {
    tier: 'BUILDER',
    tierLabel: 'Economy Tankless',
    warrantyYears: 5,
    ventType: 'ATMOSPHERIC' as VentType,
    features: ['Basic heat exchanger', 'Standard ignition', 'Manual controls'],
    insulationQuality: 'LOW',
    anodeType: 'SINGLE',  // N/A for tankless but needed for type
    failureMode: 'CATASTROPHIC',
    expectedLife: 12,
    baseCostGas: 2400,
    baseCostElectric: 1800,
    baseCostHybrid: 0,
  },
  STANDARD: {
    tier: 'STANDARD',
    tierLabel: 'Standard Tankless',
    warrantyYears: 10,
    ventType: 'DIRECT_VENT' as VentType,
    features: ['Copper heat exchanger', 'Electronic ignition', 'Digital display'],
    insulationQuality: 'MEDIUM',
    anodeType: 'SINGLE',
    failureMode: 'GRADUAL',
    expectedLife: 15,
    baseCostGas: 3200,
    baseCostElectric: 2400,
    baseCostHybrid: 0,
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    tierLabel: 'Professional Tankless',
    warrantyYears: 12,
    ventType: 'DIRECT_VENT' as VentType,
    features: ['Premium copper HX', 'Built-in recirculation', 'WiFi connectivity', 'Error diagnostics'],
    insulationQuality: 'HIGH',
    anodeType: 'DUAL',
    failureMode: 'SLOW_LEAK',
    expectedLife: 18,
    baseCostGas: 4200,
    baseCostElectric: 3200,
    baseCostHybrid: 0,
  },
  PREMIUM: {
    tier: 'PREMIUM',
    tierLabel: 'Premium Tankless',
    warrantyYears: 15,
    ventType: 'DIRECT_VENT' as VentType,
    features: ['Commercial-grade HX', 'Condensing technology', 'Smart home integration', 'Leak detection'],
    insulationQuality: 'VERY_HIGH',
    anodeType: 'POWERED',
    failureMode: 'CONTROLLED',
    expectedLife: 20,
    baseCostGas: 5500,
    baseCostElectric: 4200,
    baseCostHybrid: 0,
  },
};

// --- HELPER FUNCTIONS ---

function getTanklessLocationRisk(location: string, isFinished: boolean): RiskLevel {
  switch (location) {
    case 'ATTIC':
    case 'UPPER_FLOOR':
      return 4 as RiskLevel;
    case 'MAIN_LIVING':
      return 3 as RiskLevel;
    case 'BASEMENT':
      return isFinished ? 3 as RiskLevel : 2 as RiskLevel;
    case 'GARAGE':
    case 'CRAWLSPACE':
      return isFinished ? 2 as RiskLevel : 1 as RiskLevel;
    case 'EXTERIOR':
      return 1 as RiskLevel;
    default:
      return 2 as RiskLevel;
  }
}

// --- CORE CALCULATION ENGINE ---

export function calculateTanklessHealth(data: ForensicInputs): OpterraMetrics {
  // Default "Healthy" State
  let failProb = 5.0; 
  let healthScore = 95;
  let primaryStressor = 'Normal Wear';
  let descaleStatus: OpterraMetrics['descaleStatus'] = 'optimal';
  let scaleBuildupScore = 0;

  // 1. DEAD GATES (Immediate Failure)
  if (data.isLeaking) {
    failProb = 99.9;
    healthScore = 0;
    primaryStressor = 'Heat Exchanger Breach';
  } 
  else if (data.tanklessVentStatus === 'BLOCKED') {
    failProb = 99.9;
    healthScore = 0;
    primaryStressor = 'Vent Obstruction';
  }
  
  // 2. DYING GATES (Operational Failure)
  else if ((data.errorCodeCount || 0) > 0) {
    failProb = 75.0;
    healthScore = 35;
    primaryStressor = 'System Electronics';
  }
  else if (data.calendarAge > 15) {
    failProb = 85.0;
    healthScore = 20;
    primaryStressor = 'End of Service Life';
  }

  // 3. DIRTY GATES (Maintenance required)
  else {
    // Heuristic: High Hardness + No Maintenance = Scale Risk
    const { effectiveHardness } = resolveHardness(data);
    const isHardWater = effectiveHardness > 10;
    const neverDescaled = data.lastDescaleYearsAgo === undefined || data.lastDescaleYearsAgo === null;
    
    // Estimate scale buildup for UI display
    const yearsSinceDescale = data.lastDescaleYearsAgo ?? data.calendarAge;
    scaleBuildupScore = Math.min(100, effectiveHardness * yearsSinceDescale * 0.8);
    
    // "Point of No Return" Logic
    // If unit is old, hard water, and NEVER flushed: DO NOT FLUSH.
    // Flushing now strips the "structural scale" holding the pinholes shut.
    if (isHardWater && neverDescaled && data.calendarAge > 6) {
      descaleStatus = 'run_to_failure';
      primaryStressor = 'Calcification (Non-Serviceable)';
      healthScore = 60;
      failProb = 40;
    } 
    // Standard Maintenance Due
    else if (isHardWater && neverDescaled && data.calendarAge > 2) {
      descaleStatus = 'due';
      primaryStressor = 'Scale Accumulation';
      healthScore = 75;
      failProb = 30;
    }
    // Critical scale buildup
    else if (scaleBuildupScore > 60) {
      descaleStatus = 'lockout';
      primaryStressor = 'Severe Scale Buildup';
      healthScore = 50;
      failProb = 50;
    }
    // Moderate scale
    else if (scaleBuildupScore > 25) {
      descaleStatus = 'critical';
      primaryStressor = 'Scale Accumulation';
      healthScore = 70;
      failProb = 25;
    }
    else if (scaleBuildupScore > 10) {
      descaleStatus = 'due';
      primaryStressor = 'Normal Wear';
      healthScore = 85;
      failProb = 15;
    }
  }

  // Determine flush status from descale status (mapped to 5-tier system)
  let flushStatus: 'optimal' | 'advisory' | 'due' | 'critical' | 'lockout' = 'optimal';
  if (descaleStatus === 'lockout' || descaleStatus === 'run_to_failure') {
    flushStatus = 'lockout';
  } else if (descaleStatus === 'critical') {
    flushStatus = 'critical';
  } else if (descaleStatus === 'due') {
    flushStatus = 'due';
  } else if (descaleStatus === 'optimal') {
    flushStatus = 'optimal';
  }

  // MVP Metrics Return (Simplified)
  // NOTE: Tankless units don't have anodes - these fields are set to N/A values
  return {
    bioAge: data.calendarAge,
    failProb: parseFloat(failProb.toFixed(1)),
    healthScore,
    sedimentLbs: 0,
    shieldLife: 0,
    // Tankless units have no anode rod - set to N/A values
    anodeDepletionPercent: 0,
    anodeStatus: 'protected' as const,  // N/A for tankless
    anodeMassRemaining: 1,               // N/A for tankless
    effectivePsi: data.housePsi,
    isTransientPressure: false, // Tankless units don't have same thermal expansion concern
    scaleBuildupScore: parseFloat(scaleBuildupScore.toFixed(1)),
    flowDegradation: 0,
    descaleStatus,
    stressFactors: {
      total: 1.0,
      mechanical: 1.0,
      chemical: 1.0,
      pressure: 1.0, 
      corrosion: 1.0,
      temp: 1.0,
      tempMechanical: 1.0,
      tempChemical: 1.0,
      circ: 1.0,
      loop: 1.0,
      sediment: 1.0,
      usageIntensity: 1.0,
      undersizing: 1.0
    },
    riskLevel: getTanklessLocationRisk(data.location, data.isFinishedArea),
    sedimentRate: 0, 
    monthsToFlush: descaleStatus === 'due' || descaleStatus === 'critical' ? 0 : 12, 
    monthsToLockout: scaleBuildupScore > 30 ? Math.round((60 - scaleBuildupScore) * 2) : null, 
    flushStatus,
    agingRate: 1.0, 
    optimizedRate: 1.0, 
    yearsLeftCurrent: Math.max(0, 15 - data.calendarAge), 
    yearsLeftOptimized: Math.max(0, 15 - data.calendarAge), 
    lifeExtension: 0,
    primaryStressor
  };
}

// --- RECOMMENDATION ENGINE ---

export function getTanklessRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  // PRIORITY 1: SAFETY (Leaks/Vents)
  if (data.tanklessVentStatus === 'BLOCKED') {
    return {
      action: 'REPLACE', 
      title: 'Vent Obstruction', 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'CRITICAL',
      reason: 'Critical safety hazard detected in venting system.'
    };
  }
  if (data.isLeaking) {
    return {
      action: 'REPLACE', 
      title: 'Heat Exchanger Failure', 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'CRITICAL',
      reason: 'Internal leakage detected. Heat exchanger integrity compromised.'
    };
  }

  // PRIORITY 2: AGE/ERROR OUT
  if ((data.errorCodeCount || 0) > 0) {
    const codeCount = data.errorCodeCount || 0;
    if (codeCount > 10) {
      return {
        action: 'REPLACE', 
        title: 'Chronic System Errors', 
        urgent: true, 
        badgeColor: 'red', 
        badge: 'CRITICAL',
        reason: `Unit is displaying ${codeCount} error codes. System reliability is compromised.`
      };
    }
    return {
      action: 'REPAIR', 
      title: 'System Error Codes', 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE',
      reason: `Unit is displaying ${codeCount} error codes. Diagnostics required.`
    };
  }
  
  if (data.calendarAge > 15) {
    return {
      action: 'REPLACE', 
      title: 'End of Service Life', 
      urgent: false, 
      badgeColor: 'orange', 
      badge: 'REPLACE',
      reason: 'Unit has exceeded statistical life expectancy (15 years).'
    };
  }

  // PRIORITY 3: MAINTENANCE (Simple Scale Check)
  if (metrics.descaleStatus === 'run_to_failure') {
    return {
      action: 'PASS', 
      title: 'Run to Failure', 
      urgent: false, 
      badgeColor: 'orange', 
      badge: 'MONITOR',
      reason: 'Unit is functioning but too calcified to safely flush. Monitor for leaks.'
    };
  }
  
  if (metrics.descaleStatus === 'lockout') {
    return {
      action: 'REPLACE', 
      title: 'Scale Lockout', 
      urgent: false, 
      badgeColor: 'orange', 
      badge: 'REPLACE',
      reason: 'Scale buildup has exceeded serviceable limits. Descaling risks revealing pinhole leaks.'
    };
  }
  
  if (metrics.descaleStatus === 'critical') {
    return {
      action: 'MAINTAIN', 
      title: 'Descale Critical', 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE',
      reason: 'Heavy scale accumulation detected. Immediate descaling recommended.'
    };
  }
  
  if (metrics.descaleStatus === 'due') {
    return {
      action: 'MAINTAIN', 
      title: 'Descale Required', 
      urgent: false, 
      badgeColor: 'yellow', 
      badge: 'SERVICE',
      reason: 'Hard water exposure without recent maintenance detected.'
    };
  }

  // PRIORITY 4: GAS STARVATION (The #1 Killer)
  if (data.btuRating && data.btuRating > 150000 && data.gasLineSize === '1/2') {
    return {
      action: 'UPGRADE', 
      title: 'Gas Supply Starvation', 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'CRITICAL',
      reason: '1/2" gas line is insufficient for this unit output. System is running lean.'
    };
  }

  // PRIORITY 5: ISOLATION VALVES (Serviceability)
  if (!data.hasIsolationValves && data.calendarAge > 1) {
    return {
      action: 'UPGRADE', 
      title: 'Install Isolation Valves', 
      urgent: false, 
      badgeColor: 'yellow', 
      badge: 'SERVICE',
      reason: 'Unit cannot be descaled without isolation valves. Install to enable maintenance.'
    };
  }

  // DEFAULT
  return {
    action: 'PASS', 
    title: 'System Healthy', 
    urgent: false, 
    badgeColor: 'green', 
    badge: 'OPTIMAL',
    reason: 'No critical issues or maintenance needs detected.'
  };
}

// --- FINANCIAL ENGINE ---

export function getTanklessFinancials(metrics: OpterraMetrics, data: ForensicInputs): FinancialForecast {
  // Detect tier based on warranty years
  let currentTier = TANKLESS_TIER_PROFILES.STANDARD;
  if (data.warrantyYears >= 12) {
    currentTier = TANKLESS_TIER_PROFILES.PROFESSIONAL;
  } else if (data.warrantyYears >= 10) {
    currentTier = TANKLESS_TIER_PROFILES.STANDARD;
  } else if (data.warrantyYears >= 7) {
    currentTier = TANKLESS_TIER_PROFILES.STANDARD;
  } else {
    currentTier = TANKLESS_TIER_PROFILES.BUILDER;
  }
  
  // Simple inflation logic for MVP
  const yearsLeft = Math.max(0, 15 - data.calendarAge);
  const baseCost = data.fuelType === 'TANKLESS_ELECTRIC' 
    ? currentTier.baseCostElectric 
    : currentTier.baseCostGas;
  const inflation = Math.pow(1.03, yearsLeft);
  const futureCost = baseCost * inflation;

  // Determine urgency
  let budgetUrgency: 'LOW' | 'MED' | 'HIGH' | 'IMMEDIATE' = 'LOW';
  if (yearsLeft <= 0 || metrics.healthScore < 30) budgetUrgency = 'IMMEDIATE';
  else if (yearsLeft < 2 || metrics.healthScore < 50) budgetUrgency = 'HIGH';
  else if (yearsLeft < 5 || metrics.healthScore < 70) budgetUrgency = 'MED';

  return {
    targetReplacementDate: new Date(new Date().getFullYear() + yearsLeft, 0, 1).toISOString(),
    monthsUntilTarget: yearsLeft * 12,
    estReplacementCost: Math.round(futureCost),
    estReplacementCostMin: Math.round(futureCost * 0.9),
    estReplacementCostMax: Math.round(futureCost * 1.1),
    monthlyBudget: Math.round(futureCost / Math.max(yearsLeft * 12, 1)),
    budgetUrgency,
    recommendation: metrics.healthScore < 50 ? 'Prepare for Replacement' : 'Save for Future',
    currentTier, 
    likeForLikeCost: baseCost,
    upgradeCost: 0
  };
}

// --- MAIN ENTRY POINT ---

/**
 * Calculate Opterra risk for Tankless water heaters.
 * This is the isolated tankless engine entry point.
 */
export function calculateOpterraTanklessRisk(data: ForensicInputs): OpterraResult {
  const metrics = calculateTanklessHealth(data);
  const verdict = getTanklessRecommendation(metrics, data);
  const financial = getTanklessFinancials(metrics, data);
  const hardWaterTax = calculateHardWaterTax(data, metrics);
  const handshake = generatePlumberHandshake(data, metrics, verdict);
  
  return { metrics, verdict, handshake, hardWaterTax, financial };
}
