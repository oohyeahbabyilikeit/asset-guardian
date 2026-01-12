/**
 * OPTERRA v7.2 - TANKLESS RISK ENGINE
 * 
 * PHYSICS MODEL:
 * Unlike tank water heaters which are Pressure Vessels (failing via fatigue/bursting),
 * Tankless units are Flow Engines (failing via fouling/clogging).
 * 
 * - Primary Stressor: Scale Accumulation (Heat Exchanger Insulation)
 * - Secondary Stressor: Flow Restriction (Inlet Screen/Calcification)
 * - Mechanical Stress: Ignition Cycles (Usage Intensity)
 * 
 * KEY PHYSICS SHIFTS:
 * - Sediment → Scale: Track "Heat Exchanger Blockage %" instead of "pounds of sediment"
 * - Pressure → Flow: Track "Flow Degradation" (Rated GPM vs. Actual GPM)
 * - Anode → Valves: Maintenance eligibility determined by Isolation Valves
 */

import { 
  ForensicInputs, 
  OpterraMetrics, 
  Recommendation, 
  FinancialForecast, 
  RiskLevel,
  failProbToHealthScore,
  TierProfile,
  VentType,
  resolveHardness
} from './opterraAlgorithm';

// --- CONSTANTS ---

const TANKLESS = {
  // Reliability: Tankless units fail faster once neglected (Steep Beta)
  ETA_GAS: 15.5,           // Characteristic life (years) for gas tankless
  ETA_ELEC: 14.0,          // Characteristic life (years) for electric tankless
  BETA: 2.8,               // Steeper wear curve than tanks (2.2)
  
  // Scale Physics (% Blockage per GPG per Year)
  SCALE_FACTOR_GAS: 1.1,   // High heat intensity = fast scaling
  SCALE_FACTOR_ELEC: 0.8,  // Lower heat intensity
  
  // Thresholds
  // FIX v7.7 "3-Year Lockout": Raised from 40 to 60
  // At 40, 15 GPG water hit lockout in Year 3 (20% of life). Too aggressive.
  // At 60, units get a descaling chance before condemnation.
  LIMIT_SCALE_LOCKOUT: 60, // % Blockage: Flushing risks pinhole leaks (was 40)
  LIMIT_SCALE_DUE: 10,     // % Blockage: Efficiency dropping
  LIMIT_FLOW_LOSS: 20,     // % GPM Loss: Critical restriction
  
  // Costs
  COST_BASE_GAS: 3800,
  COST_BASE_ELEC: 2800,
  COST_VALVE_UPGRADE: 600,
  
  // Limits
  MAX_BIO_AGE: 25,
  MAX_STRESS_CAP: 15.0,
};

// Tankless tier profiles for financial forecasting
const TANKLESS_TIER_PROFILES: Record<string, TierProfile> = {
  BUILDER: {
    tier: 'BUILDER',
    tierLabel: 'Economy Tankless',
    warrantyYears: 5,
    ventType: 'ATMOSPHERIC' as VentType,
    features: ['Basic heat exchanger', 'Standard ignition', 'Manual controls'],
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
    baseCostGas: 5500,
    baseCostElectric: 4200,
    baseCostHybrid: 0,
  },
};

// --- HELPER FUNCTIONS ---

function getTanklessLocationRisk(location: string, isFinished: boolean): RiskLevel {
  // Tankless hold less water, but attic leaks are still catastrophic
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

function detectTanklessTier(data: ForensicInputs): TierProfile {
  // Detect tier based on warranty years (best indicator)
  if (data.warrantyYears >= 12) {
    return TANKLESS_TIER_PROFILES.PROFESSIONAL;
  } else if (data.warrantyYears >= 10) {
    return TANKLESS_TIER_PROFILES.STANDARD;
  } else if (data.warrantyYears >= 7) {
    return TANKLESS_TIER_PROFILES.STANDARD;
  } else {
    return TANKLESS_TIER_PROFILES.BUILDER;
  }
}

/**
 * NEW v7.8: Gas Starvation Detection ("Gas Starvation" Fix)
 * Undersized gas lines cause lean burn, sooting, and premature HX failure.
 * This is the #1 cause of early tankless death that gets misdiagnosed as scale.
 */
function detectGasStarvation(data: ForensicInputs): { isStarving: boolean; severity: number; message: string } {
  // Only applies to gas tankless
  if (data.fuelType !== 'TANKLESS_GAS') {
    return { isStarving: false, severity: 0, message: '' };
  }
  
  // If we don't have gas line data, can't diagnose
  if (!data.gasLineSize || !data.btuRating) {
    return { isStarving: false, severity: 0, message: '' };
  }
  
  const runLength = data.gasRunLength ?? 30;  // Default 30 feet if unknown
  
  // Gas line capacity chart (approximate CFH at 0.5" WC drop)
  // 1/2" pipe: ~70 CFH, 3/4" pipe: ~150 CFH, 1" pipe: ~275 CFH
  // Natural gas: ~1000 BTU/CF, so 199k BTU needs ~200 CFH
  const pipeCapacityCFH: Record<string, number> = {
    '1/2': 70 - (runLength > 30 ? 15 : 0),   // Derate for long runs
    '3/4': 150 - (runLength > 50 ? 25 : 0),
    '1': 275 - (runLength > 75 ? 40 : 0),
  };
  
  const requiredCFH = data.btuRating / 1000;  // BTU to CFH conversion
  const availableCFH = pipeCapacityCFH[data.gasLineSize] || 150;
  
  if (requiredCFH > availableCFH) {
    const shortfall = Math.round(((requiredCFH - availableCFH) / requiredCFH) * 100);
    return {
      isStarving: true,
      severity: Math.min(100, shortfall * 2),  // Severity scales with shortfall
      message: `${data.gasLineSize}" gas line cannot supply ${data.btuRating / 1000}k BTU unit. Running ${shortfall}% lean.`
    };
  }
  
  return { isStarving: false, severity: 0, message: '' };
}

// --- CORE CALCULATION ENGINE ---

export function calculateTanklessHealth(data: ForensicInputs): OpterraMetrics {

  // =========================================
  // 1. CYCLE INTENSITY (The "Odometer")
  // Tankless wear is driven by ON/OFF cycles (Igniter, Fan, Relays)
  // =========================================
  const usageMultipliers = { light: 0.7, normal: 1.0, heavy: 1.6 };
  const usageMultiplier = usageMultipliers[data.usageType] || 1.0;
  
  // Grandma Rule: Fewer people = fewer cycles
  const occupancyFactor = Math.max(0.4, data.peopleCount / 2.5);
  
  // Recirculation Penalty: The "Silent Killer" of tankless
  // Without on-demand controls, recirc pumps force 24/7 firing
  const recircPenalty = (data.hasRecirculationLoop || data.hasCircPump) ? 2.5 : 1.0;

  const cycleStress = Math.min(4.0, usageMultiplier * occupancyFactor * recircPenalty);

  // =========================================
  // 2. SCALE ACCUMULATION (The "Artery Blockage")
  // Scale insulates the copper heat exchanger, causing overheating/cracking
  // =========================================
  // v7.6: Use Digital-First hardness resolver for all physics calculations
  // This uses measuredHardnessGPG (test strip) if available, or infers from softener status
  const { effectiveHardness } = resolveHardness(data);
  // For tankless, if softener is working, use 0.2 GPG (less buffer than tank)
  const tanklessEffectiveHardness = (data.hasSoftener && effectiveHardness < 1.5) 
    ? 0.2 
    : effectiveHardness;
  const yearsSinceDescale = data.lastDescaleYearsAgo ?? data.calendarAge;
  
  const fuelFactor = data.fuelType === 'TANKLESS_ELECTRIC' 
    ? TANKLESS.SCALE_FACTOR_ELEC 
    : TANKLESS.SCALE_FACTOR_GAS;
    
  // Temperature Penalty: 140°F precipitates scale 50% faster than 120°F
  const tempPenalty = data.tempSetting === 'HOT' ? 1.5 : 1.0;
  
  // Physics Formula: Hardness * Time * Intensity * Temp
  const rawScaleScore = tanklessEffectiveHardness * yearsSinceDescale * cycleStress * fuelFactor * tempPenalty;
  
  // Residual Scarring: Flushing removes 90%, but 10% stays forever
  const residualScarring = Math.max(0, (data.calendarAge - yearsSinceDescale)) * 0.5;
  
  const scaleBuildupScore = Math.min(100, rawScaleScore + residualScarring);

  // =========================================
  // 3. FLOW DEGRADATION (The Vital Sign)
  // If Rated 10 GPM but measuring 7 GPM, the unit is choking
  // =========================================
  // FIX v7.6: Only use MEASURED flow loss, don't infer from scale ("Tankless Insulator" Fix)
  // Scale is a THERMAL insulator first, flow restrictor second.
  // Thin scale can crack heat exchangers while barely affecting GPM.
  let flowLossPercent = 0;
  if (data.ratedFlowGPM && data.flowRateGPM) {
    flowLossPercent = ((data.ratedFlowGPM - data.flowRateGPM) / data.ratedFlowGPM) * 100;
    flowLossPercent = Math.max(0, flowLossPercent);
  }
  // If not measured, flow loss stays at 0 (unknown) — we warn on SCALE instead

  // =========================================
  // 4. STRESS FACTORS & BIO-AGE
  // =========================================
  
  // Scale Stress: Non-linear (Exponential heat stress on copper)
  const scaleStress = 1.0 + Math.pow(scaleBuildupScore / 10, 2.0);

  // Flow Stress: Physical restriction
  let flowStress = 1.0;
  if (data.inletFilterStatus === 'DIRTY') flowStress = 1.5;
  if (data.inletFilterStatus === 'CLOGGED') flowStress = 3.0;
  if (flowLossPercent > 10) flowStress += (flowLossPercent / 10);

  // Venting Stress (gas only)
  let ventStress = 1.0;
  if (data.fuelType === 'TANKLESS_GAS') {
    if (data.tanklessVentStatus === 'RESTRICTED') ventStress = 2.0;
    if (data.tanklessVentStatus === 'BLOCKED') ventStress = 5.0;
  }

  // Total Stress
  const totalStress = Math.min(TANKLESS.MAX_STRESS_CAP, scaleStress * cycleStress * flowStress * ventStress);
  const bioAge = data.calendarAge * totalStress;
  const cappedBioAge = Math.min(bioAge, TANKLESS.MAX_BIO_AGE);

  // =========================================
  // 5. FAILURE PROBABILITY (Weibull)
  // =========================================
  const eta = data.fuelType === 'TANKLESS_GAS' ? TANKLESS.ETA_GAS : TANKLESS.ETA_ELEC;
  
  const rNow = Math.exp(-Math.pow(cappedBioAge / eta, TANKLESS.BETA));
  const rNext = Math.exp(-Math.pow((cappedBioAge + 1) / eta, TANKLESS.BETA));
  let failProb = (1 - (rNext / rNow)) * 100;
  
  // Statistical cap
  failProb = Math.min(failProb, 85.0);
  
  // Overrides for critical conditions
  if ((data.errorCodeCount || 0) > 5) failProb = Math.max(failProb, 75.0);
  if ((data.errorCodeCount || 0) > 10) failProb = Math.max(failProb, 85.0);
  if (data.isLeaking) failProb = 99.9;
  if (data.tanklessVentStatus === 'BLOCKED') failProb = 99.9;

  // =========================================
  // 6. MAINTENANCE STATUS (Descale Eligibility)
  // =========================================
  // CRITICAL: Check scale lockout FIRST - if scale is too high, unit needs replacement
  // regardless of valve status. Installing valves won't help at 40%+ scale.
  let descaleStatus: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible' = 'optimal';
  
  if (scaleBuildupScore > TANKLESS.LIMIT_SCALE_LOCKOUT) {
    descaleStatus = 'lockout'; // Scale too high - acid flush risks pinhole leaks, replacement needed
  } else if (!data.hasIsolationValves && data.calendarAge > 1) {
    descaleStatus = 'impossible'; // Cannot be flushed without valves
  } else if (scaleBuildupScore > 25) {
    descaleStatus = 'critical';
  } else if (scaleBuildupScore > TANKLESS.LIMIT_SCALE_DUE) {
    descaleStatus = 'due';
  }

  // =========================================
  // 7. PROJECTIONS (Life Extension)
  // =========================================
  const remainingCapacity = Math.max(0, TANKLESS.MAX_BIO_AGE - cappedBioAge);
  const yearsLeftCurrent = totalStress > 0 ? remainingCapacity / totalStress : remainingCapacity;
  
  // Optimized: If descaled and filters cleaned
  const optimizedStress = Math.max(1.0, 1.0 * cycleStress * 1.0 * 1.0); // Reset scale/flow/vent stress
  const yearsLeftOptimized = remainingCapacity / optimizedStress;
  const lifeExtension = Math.max(0, yearsLeftOptimized - yearsLeftCurrent);

  // =========================================
  // 8. IDENTIFY PRIMARY STRESSOR
  // =========================================
  // FIX v7.6: Correct physics terminology ("Tankless Insulator" Fix)
  // Scale is a THERMAL problem (efficiency loss, overheating) not just flow restriction
  let primaryStressor = 'Normal Wear';
  if (scaleBuildupScore > 15) primaryStressor = 'Thermal Efficiency Loss';
  if (flowLossPercent > 15) primaryStressor = 'Flow Restriction';
  if (data.hasRecirculationLoop || data.hasCircPump) primaryStressor = 'Recirculation Fatigue';
  if ((data.errorCodeCount || 0) > 5) primaryStressor = 'System Electronics';
  if (data.tanklessVentStatus === 'RESTRICTED' || data.tanklessVentStatus === 'BLOCKED') {
    primaryStressor = 'Vent Obstruction';
  }

  // =========================================
  // MAP TO SHARED METRICS INTERFACE
  // =========================================
  return {
    bioAge: parseFloat(cappedBioAge.toFixed(1)),
    failProb: parseFloat(failProb.toFixed(1)),
    healthScore: failProbToHealthScore(failProb),
    
    // UI MAPPING: "Sediment" gauge displays "Scale %"
    sedimentLbs: parseFloat(scaleBuildupScore.toFixed(1)), 
    
    shieldLife: 0, // N/A for tankless (no anode)
    effectivePsi: data.housePsi,
    
    // Tankless Specifics
    scaleBuildupScore: parseFloat(scaleBuildupScore.toFixed(1)),
    flowDegradation: parseFloat(flowLossPercent.toFixed(1)),
    descaleStatus,
    
    stressFactors: {
      total: parseFloat(totalStress.toFixed(2)),
      mechanical: parseFloat(cycleStress.toFixed(2)), // Cycles
      chemical: parseFloat(scaleStress.toFixed(2)),   // Scale
      pressure: parseFloat(flowStress.toFixed(2)),    // Flow
      corrosion: parseFloat(scaleStress.toFixed(2)),  // Scale (Legacy map)
      temp: tempPenalty,
      tempMechanical: 1.0,
      tempChemical: tempPenalty,
      circ: recircPenalty,
      loop: 1.0,
      sediment: parseFloat(scaleStress.toFixed(2)), // Legacy map to scale
      usageIntensity: parseFloat(cycleStress.toFixed(2)),
      undersizing: 0 // N/A for tankless
    },
    
    riskLevel: getTanklessLocationRisk(data.location, data.isFinishedArea),
    sedimentRate: 0, // N/A
    monthsToFlush: descaleStatus === 'due' || descaleStatus === 'critical' ? 0 : 12,
    monthsToLockout: scaleBuildupScore > 30 ? Math.round((40 - scaleBuildupScore) * 2) : null,
    flushStatus: descaleStatus === 'impossible' ? 'lockout' : 
                 descaleStatus === 'lockout' ? 'lockout' :
                 descaleStatus === 'critical' ? 'due' : 
                 descaleStatus === 'due' ? 'schedule' : 'optimal',
    
    agingRate: parseFloat(totalStress.toFixed(2)),
    optimizedRate: parseFloat(optimizedStress.toFixed(2)),
    yearsLeftCurrent: parseFloat(yearsLeftCurrent.toFixed(1)),
    yearsLeftOptimized: parseFloat(yearsLeftOptimized.toFixed(1)),
    lifeExtension: parseFloat(lifeExtension.toFixed(1)),
    primaryStressor
  };
}

// --- RECOMMENDATION ENGINE ---

export function getTanklessRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  
  // =========================================
  // TIER 0: CRITICAL / FATAL
  // =========================================
  if (data.tanklessVentStatus === 'BLOCKED') {
    return { 
      action: 'REPLACE', 
      title: 'Vent Blockage', 
      reason: 'Exhaust blocked. CO Hazard. Immediate action required.', 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'CRITICAL' 
    };
  }
  
  if (data.isLeaking) {
    return { 
      action: 'REPLACE', 
      title: 'Heat Exchanger Breach', 
      reason: 'Internal leak detected. Unit is non-repairable.', 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'CRITICAL' 
    };
  }
  
  if ((data.errorCodeCount || 0) > 10) {
    return { 
      action: 'REPAIR', 
      title: 'System Error Codes', 
      reason: `Unit throwing ${data.errorCodeCount} error codes. Diagnostics required.`, 
      urgent: true, 
      badgeColor: 'red', 
      badge: 'SERVICE' 
    };
  }

  // =========================================
  // TIER 1: SCALE LOCKOUT
  // =========================================
  if (metrics.descaleStatus === 'lockout') {
    return { 
      action: 'REPLACE', 
      title: 'Scale Lockout', 
      reason: `Heat exchanger is ${metrics.scaleBuildupScore?.toFixed(0)}% blocked. Descaling now risks leaks.`, 
      urgent: false, 
      badgeColor: 'red', 
      badge: 'REPLACE' 
    };
  }

  // =========================================
  // TIER 2: MAINTENANCE BLOCKED (No Valves)
  // =========================================
  if (metrics.descaleStatus === 'impossible') {
    return { 
      action: 'UPGRADE', 
      title: 'Isolation Valves Needed', 
      reason: 'Unit cannot be serviced without valves. Install to allow flushing.', 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE' 
    };
  }

  // =========================================
  // TIER 3: MAINTENANCE REQUIRED
  // =========================================
  if (data.inletFilterStatus === 'CLOGGED') {
    return { 
      action: 'MAINTAIN', 
      title: 'Inlet Screen Clogged', 
      reason: 'Water flow restricted. Clean inlet filter immediately.', 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE' 
    };
  }
  
  if (metrics.descaleStatus === 'critical') {
    return { 
      action: 'MAINTAIN', 
      title: 'Descale Critical', 
      reason: `Scale buildup at ${metrics.scaleBuildupScore?.toFixed(0)}%. Flush immediately to prevent damage.`, 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE' 
    };
  }
  
  if (metrics.descaleStatus === 'due') {
    return { 
      action: 'MAINTAIN', 
      title: 'Descale Required', 
      reason: `Efficiency reduced by scale buildup. Schedule maintenance flush.`, 
      urgent: false, 
      badgeColor: 'yellow', 
      badge: 'SERVICE' 
    };
  }
  
  // Igniter / Flame Rod issues (gas only)
  if (data.fuelType === 'TANKLESS_GAS' && data.flameRodStatus === 'FAILING') {
    return { 
      action: 'REPAIR', 
      title: 'Flame Rod Failing', 
      reason: 'Ignition sensor degraded. Replace to prevent no-heat failures.', 
      urgent: true, 
      badgeColor: 'orange', 
      badge: 'SERVICE' 
    };
  }
  
  if (data.fuelType === 'TANKLESS_GAS' && (data.igniterHealth || 100) < 50) {
    return { 
      action: 'REPAIR', 
      title: 'Igniter Weak', 
      reason: `Igniter health at ${data.igniterHealth}%. Service recommended.`, 
      urgent: false, 
      badgeColor: 'yellow', 
      badge: 'SERVICE' 
    };
  }
  
  // Element health (electric only)
  if (data.fuelType === 'TANKLESS_ELECTRIC' && (data.elementHealth || 100) < 50) {
    return { 
      action: 'REPAIR', 
      title: 'Heating Element Degraded', 
      reason: `Element health at ${data.elementHealth}%. Replace for consistent temps.`, 
      urgent: false, 
      badgeColor: 'yellow', 
      badge: 'SERVICE' 
    };
  }

  // =========================================
  // TIER 4: HARD WATER WARNING
  // =========================================
  if (data.hardnessGPG > 15 && !data.hasSoftener) {
    return { 
      action: 'UPGRADE', 
      title: 'Hard Water Risk', 
      reason: `Hardness (${data.hardnessGPG} GPG) is accelerating scale. Water softener recommended.`, 
      urgent: false, 
      badgeColor: 'blue', 
      badge: 'MONITOR' 
    };
  }

  // =========================================
  // TIER 5: HEALTHY
  // =========================================
  return { 
    action: 'PASS', 
    title: 'System Healthy', 
    reason: 'Tankless unit operating efficiently.', 
    urgent: false, 
    badgeColor: 'green', 
    badge: 'OPTIMAL' 
  };
}

// --- FINANCIAL FORECAST ---

export function getTanklessFinancials(metrics: OpterraMetrics, data: ForensicInputs): FinancialForecast {
  const currentTier = detectTanklessTier(data);
  
  // Base cost depends on fuel type
  const BASE_COST = data.fuelType === 'TANKLESS_GAS' 
    ? currentTier.baseCostGas 
    : currentTier.baseCostElectric;
  
  let totalCost = BASE_COST;
  
  // Vent upgrade adders (gas only)
  if (data.fuelType === 'TANKLESS_GAS') {
    if (data.ventType === 'POWER_VENT') totalCost += 800;
    if (data.ventType === 'DIRECT_VENT') totalCost += 600;
  }
  
  // Installation complexity adder
  if (data.location === 'ATTIC' || data.location === 'CRAWLSPACE') {
    totalCost += 400; // Difficult access
  }

  const yearsLeft = Math.max(0, metrics.yearsLeftCurrent);
  const futureCost = totalCost * Math.pow(1.03, yearsLeft); // 3% annual inflation
  const monthsUntilTarget = Math.max(0, Math.ceil(yearsLeft * 12));
  
  let urgency: 'LOW' | 'MED' | 'HIGH' | 'IMMEDIATE' = 'LOW';
  if (monthsUntilTarget <= 0 || metrics.failProb > 60) urgency = 'IMMEDIATE';
  else if (monthsUntilTarget < 12 || metrics.failProb > 40) urgency = 'HIGH';
  else if (monthsUntilTarget < 36 || metrics.failProb > 25) urgency = 'MED';
  
  // Calculate upgrade option (next tier up)
  let upgradeTier: TierProfile | undefined;
  let upgradeCost: number | undefined;
  let upgradeValueProp: string | undefined;
  
  if (currentTier.tier !== 'PREMIUM') {
    const nextTierMap: Record<string, string> = {
      'BUILDER': 'STANDARD',
      'STANDARD': 'PROFESSIONAL',
      'PROFESSIONAL': 'PREMIUM'
    };
    const nextTierKey = nextTierMap[currentTier.tier];
    if (nextTierKey) {
      upgradeTier = TANKLESS_TIER_PROFILES[nextTierKey];
      upgradeCost = data.fuelType === 'TANKLESS_GAS' 
        ? upgradeTier.baseCostGas 
        : upgradeTier.baseCostElectric;
      upgradeValueProp = `+${upgradeTier.warrantyYears - currentTier.warrantyYears} years warranty, ${upgradeTier.features[0]}`;
    }
  }

  // Monthly budget calculation
  const monthlyBudget = monthsUntilTarget > 0 
    ? Math.ceil(futureCost / monthsUntilTarget) 
    : Math.round(futureCost);
  
  // Target replacement date
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthsUntilTarget);
  const targetReplacementDate = monthsUntilTarget <= 0 
    ? "Now" 
    : targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    targetReplacementDate,
    monthsUntilTarget,
    estReplacementCost: Math.round(futureCost),
    estReplacementCostMin: Math.round(futureCost * 0.85),
    estReplacementCostMax: Math.round(futureCost * 1.15),
    monthlyBudget,
    budgetUrgency: urgency,
    recommendation: urgency === 'IMMEDIATE' 
      ? 'Plan for replacement immediately.' 
      : `Budget $${monthlyBudget}/mo for ${Math.ceil(monthsUntilTarget / 12)} years.`,
    currentTier,
    likeForLikeCost: Math.round(totalCost),
    upgradeTier,
    upgradeCost,
    upgradeValueProp
  };
}
