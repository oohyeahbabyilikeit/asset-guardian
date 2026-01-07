/**
 * OPTERRA v6.2 Risk Calculation Engine (Verified)
 * 
 * A physics-based reliability algorithm with economic optimization logic.
 * VERIFIED: January 7, 2026
 * 
 * CHANGES v6.2:
 * - ARCHITECTURE: Split recommendation into getRawRecommendation + optimizeEconomicDecision
 * - ECONOMIC LAYER: Added ROI logic for repair vs. replacement decisions
 * - CONSTANTS: Added AGE_ECONOMIC_REPAIR_LIMIT, AGE_ANODE_LIMIT
 * - TUNING: Reduced LIMIT_AGE_FRAGILE from 12 to 10 years
 * 
 * CHANGES v6.1:
 * - INPUT UPDATE: Renamed 'psi' to 'housePsi' to match technician workflow (Hose Bib Measure).
 * - PHYSICS ADAPTER: Added 'getEffectivePressure' to calculate internal tank stress (detects Ghost Spikes).
 * - SAFETY PATCH: Added Tier 0 (Explosion Hazard) & Fixed Tier 2 (Highlander Bug).
 * - STABILITY: Fixed Division by Zero crash on soft water inputs.
 */

// --- TYPES & INTERFACES ---

export type FuelType = 'GAS' | 'ELECTRIC';
export type TempSetting = 'LOW' | 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'UPPER_FLOOR' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE' | 'EXTERIOR' | 'CRAWLSPACE';
export type RiskLevel = 1 | 2 | 3 | 4;

export interface ForensicInputs {
  calendarAge: number;     // Years
  warrantyYears: number;   // Standard is 6, 9, or 12
  
  // CHANGED: Technician inputs the Static Pressure measured at a fixture (Hose Bib)
  housePsi: number;        
  
  tempSetting: TempSetting; 
  location: LocationType;
  isFinishedArea: boolean; 
  fuelType: FuelType;
  hardnessGPG: number;     
  
  // Equipment Flags
  hasSoftener: boolean;
  hasCircPump: boolean;
  hasExpTank: boolean;
  hasPrv: boolean;         // Pressure Reducing Valve present?
  isClosedLoop: boolean;   // Check valve or backflow preventer present?
  
  // Visual Inspection
  visualRust: boolean;     
  isLeaking?: boolean;     
}

export interface OpterraMetrics {
  bioAge: number;          
  failProb: number;        
  healthScore: number;     
  sedimentLbs: number;     
  shieldLife: number;      
  
  // NEW: The calculated max pressure the tank actually experiences
  effectivePsi: number;    
  
  stressFactors: {
    total: number;
    mechanical: number;    
    chemical: number;      
    pressure: number;
    corrosion: number;     
    temp: number;
    tempMechanical: number;
    tempChemical: number;  
    circ: number;
    loop: number;
    sediment: number;
  };
  riskLevel: RiskLevel;
  
  // Sediment Projection metrics
  sedimentRate: number;        
  monthsToFlush: number | null; 
  monthsToLockout: number | null; 
  flushStatus: 'optimal' | 'schedule' | 'due' | 'lockout'; 
  
  // Aging Speedometer metrics
  agingRate: number;           
  optimizedRate: number;       
  yearsLeftCurrent: number;    
  yearsLeftOptimized: number;  
  lifeExtension: number;       
  primaryStressor: string;     
}

export type ActionType = 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS';

export interface Recommendation {
  action: ActionType;
  title: string;
  reason: string;
  urgent: boolean;
  badgeColor: 'red' | 'orange' | 'yellow' | 'blue' | 'green';
  badge?: RecommendationBadge;
  note?: string; // Internal debugging note
}

// Legacy types for backwards compatibility
export type RecommendationAction = 
  | 'REPLACE_URGENT' | 'REPLACE_UNSERVICEABLE' | 'REPLACE_EXPIRED' 
  | 'REPLACE_LIABILITY' | 'REPLACE_RISK' | 'REPLACE_FATIGUE'
  | 'INSTALL_PRV' | 'INSTALL_EXP_TANK' | 'MONITOR';

export type RecommendationBadge = 'CRITICAL' | 'REPLACE' | 'SERVICE' | 'MONITOR' | 'OPTIMAL';

export interface OpterraResult {
  metrics: OpterraMetrics;
  verdict: Recommendation;
}

// --- CONSTANTS & CONFIGURATION ---

const CONSTANTS = {
  // Weibull Reliability Parameters
  ETA: 11.5,               
  BETA: 2.2,               
  
  // Physics Baselines
  PSI_SAFE_LIMIT: 80,      
  PSI_SCALAR: 20,          
  PSI_QUADRATIC_EXP: 2.0,  
  
  // Thermal Expansion Spike Baseline
  // In a closed loop without an expansion tank, pressure rises until 
  // the T&P weeps or a fixture leaks. We model this as a chronic 120 PSI spike.
  PSI_THERMAL_SPIKE: 120, 
  
  // Sediment Accumulation
  SEDIMENT_FACTOR_GAS: 0.044, 
  SEDIMENT_FACTOR_ELEC: 0.08,
  
  // Limits
  MAX_STRESS_CAP: 12.0,    
  MAX_BIO_AGE: 25,         
  STATISTICAL_CAP: 85.0,   
  VISUAL_CAP: 99.9,        
  
  LIMIT_PSI_SAFE: 80,      
  LIMIT_PSI_CRITICAL: 100, 
  LIMIT_PSI_EXPLOSION: 150, // T&P Rating (Safety Limit)
  
  LIMIT_SEDIMENT_LOCKOUT: 15, 
  LIMIT_SEDIMENT_FLUSH: 5,     
  LIMIT_AGE_FRAGILE: 10,       // CHANGED v6.2: Was 12, now 10
  LIMIT_FAILPROB_FRAGILE: 60,  
  LIMIT_AGE_MAX: 20,       // Hard cap for service life (Fixes Highlander Bug)
  
  // Economic Thresholds (NEW v6.2)
  AGE_ECONOMIC_REPAIR_LIMIT: 10, // Don't recommend heavy repairs past this age
  AGE_ANODE_LIMIT: 6,            // Age limit for anode refresh recommendation
  
  // Risk Levels
  RISK_LOW: 1 as RiskLevel,      
  RISK_MED: 2 as RiskLevel,      
  RISK_HIGH: 3 as RiskLevel,     
  RISK_EXTREME: 4 as RiskLevel,  
};

// --- HELPER FUNCTIONS ---

/**
 * Maps physical location to financial risk severity (1-4).
 */
function getLocationRisk(location: LocationType, isFinished: boolean): RiskLevel {
  switch (location) {
    case 'ATTIC': 
    case 'UPPER_FLOOR':
      return CONSTANTS.RISK_EXTREME;
    case 'MAIN_LIVING':
      return CONSTANTS.RISK_HIGH;
    case 'BASEMENT':
      return isFinished ? CONSTANTS.RISK_HIGH : CONSTANTS.RISK_MED;
    case 'GARAGE':
    case 'CRAWLSPACE':
      return isFinished ? CONSTANTS.RISK_MED : CONSTANTS.RISK_LOW;
    case 'EXTERIOR':
      return CONSTANTS.RISK_LOW;
    default:
      return CONSTANTS.RISK_MED;
  }
}

/**
 * Non-linear conversion from Failure Probability to a 0-100 Health Score.
 * Creates a "Severity Curve" where score drops fast as risk appears.
 */
export function failProbToHealthScore(failProb: number): number {
  const k = 0.04;
  const score = 100 * Math.exp(-k * failProb);
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate failure probability from biological age using Weibull distribution.
 * Used for "Do Nothing" projections.
 */
export function bioAgeToFailProb(bioAge: number): number {
  const eta = 11.5;  // Characteristic Life
  const beta = 2.2;  // Shape parameter
  const maxBioAge = 25;
  const statisticalCap = 85.0;
  
  const t = Math.min(bioAge, maxBioAge);
  const rNow = Math.exp(-Math.pow(t / eta, beta));
  const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
  
  const failProb = (1 - (rNext / rNow)) * 100;
  return Math.min(failProb, statisticalCap);
}

/**
 * Project future health metrics based on current state and aging rate.
 * Returns projected bioAge, failProb, and healthScore for a given number of months.
 */
export function projectFutureHealth(
  currentBioAge: number,
  agingRate: number,
  monthsAhead: number
): { bioAge: number; failProb: number; healthScore: number } {
  const yearsAhead = monthsAhead / 12;
  const futureBioAge = currentBioAge + (yearsAhead * agingRate);
  const failProb = bioAgeToFailProb(futureBioAge);
  const healthScore = failProbToHealthScore(failProb);
  
  return {
    bioAge: parseFloat(futureBioAge.toFixed(1)),
    failProb: parseFloat(failProb.toFixed(1)),
    healthScore
  };
}

/**
 * Risk Level Info for UI display
 */
export interface RiskLevelInfo {
  level: RiskLevel;
  label: string;
  color: string;
  description: string;
}

export function getRiskLevelInfo(level: RiskLevel): RiskLevelInfo {
  switch (level) {
    case 1:
      return { level: 1, label: 'LOW', color: 'green', description: 'Minimal damage potential' };
    case 2:
      return { level: 2, label: 'MODERATE', color: 'yellow', description: 'Limited damage potential' };
    case 3:
      return { level: 3, label: 'HIGH', color: 'orange', description: 'Significant damage potential' };
    case 4:
      return { level: 4, label: 'EXTREME', color: 'red', description: 'Catastrophic damage potential' };
    default:
      return { level: 2, label: 'MODERATE', color: 'yellow', description: 'Unknown risk level' };
  }
}

/**
 * PHYSICS ADAPTER
 * Calculates the ACTUAL pressure the tank experiences (Effective PSI).
 * 
 * Scenario A: House PSI is 60. Closed Loop. No Exp Tank.
 * -> The gauge reads 60, but the tank spikes to ~120 during heating.
 * -> effectivePsi = 120.
 * 
 * Scenario B: House PSI is 90. No PRV.
 * -> The tank is always at 90.
 * -> effectivePsi = 90.
 */
function getEffectivePressure(data: ForensicInputs): number {
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;
  let effectivePsi = data.housePsi;
  
  if (isActuallyClosed && !data.hasExpTank) {
    // If closed loop without protection, tank takes the thermal spike.
    // We assume a minimum spike to 120 PSI, or the static pressure if higher.
    effectivePsi = Math.max(effectivePsi, CONSTANTS.PSI_THERMAL_SPIKE);
  }
  return effectivePsi;
}

// --- CORE CALCULATION ENGINE ---

export function calculateHealth(data: ForensicInputs): OpterraMetrics {
  
  // 1. ANODE SHIELD LIFE (Quality Credit - use warranty as baseline)
  // A 12-year warranty tank has ~2x the sacrificial metal mass of a 6-year tank
  const baseAnodeLife = data.warrantyYears > 0 ? data.warrantyYears : 6;
  
  // Decay rate multiplier (higher = faster anode consumption)
  let anodeDecayRate = 1.0;
  if (data.hasSoftener) anodeDecayRate += 1.4;  // Conductivity accelerates consumption
  if (data.hasCircPump) anodeDecayRate += 0.5;  // Erosion/amperage
  
  // Effective shield duration (how long the anode protects the steel)
  const effectiveShieldDuration = baseAnodeLife / anodeDecayRate;
  
  // Remaining shield life (can't go below 0)
  const shieldLife = Math.max(0, effectiveShieldDuration - data.calendarAge);

  // 2. SEDIMENT CALCULATION (Needed for stress factor)
  const sedFactor = data.fuelType === 'ELECTRIC' 
    ? CONSTANTS.SEDIMENT_FACTOR_ELEC 
    : CONSTANTS.SEDIMENT_FACTOR_GAS;
  
  // If softener is present, use near-zero hardness (anode sludge only)
  // Softened water removes 95%+ of minerals; remaining sediment is primarily anode byproduct
  const effectiveHardness = data.hasSoftener ? 0.5 : data.hardnessGPG;
  
  const sedimentLbs = data.calendarAge * effectiveHardness * sedFactor;
  
  // Sediment rate (lbs per year based on EFFECTIVE water hardness)
  // Guard against division by zero - use minimum rate of 0.1 lbs/year
  const sedimentRate = Math.max(0.1, effectiveHardness * sedFactor);
  
  // Calculate months until flush threshold (5 lbs) and lockout threshold (15 lbs)
  const lbsToFlush = CONSTANTS.LIMIT_SEDIMENT_FLUSH - sedimentLbs;
  const lbsToLockout = CONSTANTS.LIMIT_SEDIMENT_LOCKOUT - sedimentLbs;
  const monthsToFlush = lbsToFlush > 0 ? Math.ceil((lbsToFlush / sedimentRate) * 12) : null;
  const monthsToLockout = lbsToLockout > 0 ? Math.ceil((lbsToLockout / sedimentRate) * 12) : null;
  
  // Determine flush status based on sediment level (5-15 lb sweet spot)
  let flushStatus: 'optimal' | 'schedule' | 'due' | 'lockout';
  if (sedimentLbs > CONSTANTS.LIMIT_SEDIMENT_LOCKOUT) {
    flushStatus = 'lockout'; // Too late, sediment hardened
  } else if (sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_FLUSH) {
    flushStatus = 'due'; // In the sweet spot (5-15 lbs), flush now
  } else if (monthsToFlush !== null && monthsToFlush <= 12) {
    flushStatus = 'schedule'; // Will reach 5 lbs within a year
  } else {
    flushStatus = 'optimal'; // Clean, no action needed
  }

  // 3. STRESS FACTORS (Split into MECHANICAL vs. CHEMICAL)

  // === MECHANICAL STRESS (Fatigue - Anode CANNOT Prevent) ===
  // These hurt the tank from Day 1, regardless of anode status
  
  // A. Pressure (Buffer Zone Model)
  // **KEY CHANGE**: Use calculated Effective PSI for stress modeling
  const effectivePsi = getEffectivePressure(data);
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;

  let pressureStress = 1.0;
  if (effectivePsi > CONSTANTS.PSI_SAFE_LIMIT) {
    const excessPsi = effectivePsi - CONSTANTS.PSI_SAFE_LIMIT;
    const penalty = Math.pow(excessPsi / CONSTANTS.PSI_SCALAR, CONSTANTS.PSI_QUADRATIC_EXP);
    pressureStress = 1.0 + penalty;
  }

  // B. Sediment (Thermal Stress / Overheating) - 100% mechanical
  // Sediment insulates the tank bottom, causing hot spots and thermal fatigue
  // 0 lbs = 1.0x, 10 lbs = 1.5x, 20 lbs = 2.0x
  const sedimentStress = 1.0 + (sedimentLbs * 0.05);

  // Combine mechanical stresses - these hurt the tank from Day 1
  const mechanicalStress = pressureStress * sedimentStress;


  // === CHEMICAL STRESS (Corrosion - Anode CAN Prevent) ===
  // These accelerate electrochemical rust, which the anode fights

  // C. Temperature - Split 50/50 (expansion = mechanical, rust = chemical)
  let tempStressRaw = 1.0;  // NORMAL baseline (120°F)
  if (data.tempSetting === 'HOT') tempStressRaw = 2.0;   // 140°F+ accelerates both
  if (data.tempSetting === 'LOW') tempStressRaw = 0.8;   // 110°F eco mode life extension
  
  const tempMechanical = Math.sqrt(tempStressRaw);  // 50% mechanical (expansion cycles)
  const tempChemical = Math.sqrt(tempStressRaw);    // 50% chemical (rust acceleration)

  // D. Circulation (Erosion-Corrosion & Duty Cycle) - 100% chemical
  const circStress = data.hasCircPump ? 1.4 : 1.0;

  // E. Closed Loop (Oxygen Cycling)
  // We reduced the penalty here because the pressure penalty is now handled 
  // correctly in 'pressureStress' via the getEffectivePressure() function.
  const loopPenalty = (isActuallyClosed && !data.hasExpTank) ? 1.2 : 1.0;

  // Combine chemical stresses
  const chemicalStress = tempChemical * circStress * loopPenalty;

  // Legacy: corrosionStress for backward compatibility (includes all old factors)
  const corrosionStress = tempStressRaw * circStress * loopPenalty * sedimentStress;
  
  // Combined stress for UI display (Aging Speedometer)
  const mechanicalWithTempExpansion = mechanicalStress * tempMechanical;
  const rawStress = mechanicalWithTempExpansion * chemicalStress;
  const totalStress = Math.min(rawStress, CONSTANTS.MAX_STRESS_CAP);

  // 4. BIOLOGICAL AGE (Mechanical vs. Chemical Split)
  const age = data.calendarAge;
  
  // Time with anode protection vs exposed steel
  const timeProtected = Math.min(age, effectiveShieldDuration);
  const timeNaked = Math.max(0, age - effectiveShieldDuration);

  // === PHASE 1: PROTECTED (Anode Active) ===
  // Mechanical stress (Pressure + Sediment + Temp expansion) applies 100%
  const protectedMechanical = timeProtected * mechanicalWithTempExpansion;
  // Chemical stress (Rust/Circ/Temp corrosion) is suppressed by 90%
  const protectedChemical = timeProtected * chemicalStress * 0.1;

  // === PHASE 2: NAKED (Anode Depleted) ===
  // Everything applies 100%
  const nakedStress = Math.min(mechanicalWithTempExpansion * chemicalStress, CONSTANTS.MAX_STRESS_CAP);
  const nakedAging = timeNaked * nakedStress;

  // Final biological age (capped for extreme cases)
  const rawBioAge = protectedMechanical + protectedChemical + nakedAging;
  const bioAge = Math.min(rawBioAge, CONSTANTS.MAX_BIO_AGE);

  // 5. WEIBULL FAILURE PROBABILITY
  const t = bioAge;
  const eta = CONSTANTS.ETA;
  const beta = CONSTANTS.BETA;
  
  const rNow = Math.exp(-Math.pow(t / eta, beta));
  const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
  
  let failProb = (1 - (rNext / rNow)) * 100;

  // Caps & Overrides
  if (data.visualRust || data.isLeaking) {
    failProb = CONSTANTS.VISUAL_CAP;
  } else {
    failProb = Math.min(failProb, CONSTANTS.STATISTICAL_CAP);
  }

  // AGING SPEEDOMETER CALCULATIONS
  const currentAgingRate = totalStress;

  // Calculate OPTIMIZED stress (what if we fix pressure + expansion tank?)
  const optimizedPressureStress = 1.0;  // Fixed to 60 PSI
  const optimizedLoopPenalty = 1.0;     // Expansion tank installed
  const optimizedMechanical = optimizedPressureStress * sedimentStress * tempMechanical;
  const optimizedChemical = tempChemical * circStress * optimizedLoopPenalty;
  const optimizedStress = Math.min(
    optimizedMechanical * optimizedChemical,
    CONSTANTS.MAX_STRESS_CAP
  );

  // Calculate remaining capacity and life projection
  const remainingCapacity = Math.max(0, CONSTANTS.MAX_BIO_AGE - bioAge);
  
  // CRITICAL: If tank is breached (leaking or rust), remaining life is ZERO
  const isBreach = data.visualRust || data.isLeaking;
  const yearsLeftCurrent = isBreach 
    ? 0 
    : (remainingCapacity > 0 ? remainingCapacity / currentAgingRate : 0);
  const yearsLeftOptimized = isBreach 
    ? 0 
    : (remainingCapacity > 0 ? remainingCapacity / optimizedStress : 0);
  const lifeExtension = isBreach ? 0 : Math.max(0, yearsLeftOptimized - yearsLeftCurrent);

  // Identify primary stressor for UX messaging
  const stressorFactors = [
    { name: 'High Pressure', value: pressureStress },
    { name: 'High Temperature', value: tempStressRaw },
    { name: 'Sediment Buildup', value: sedimentStress },
    { name: 'Thermal Expansion', value: loopPenalty },
    { name: 'Circulation Pump', value: circStress }
  ];
  const primaryStressor = stressorFactors.reduce((max, f) => f.value > max.value ? f : max, stressorFactors[0]).name;

  return {
    bioAge: parseFloat(bioAge.toFixed(1)),
    failProb: parseFloat(failProb.toFixed(1)),
    healthScore: failProbToHealthScore(failProb),
    sedimentLbs: parseFloat(sedimentLbs.toFixed(1)),
    shieldLife: parseFloat(shieldLife.toFixed(1)),
    effectivePsi: parseFloat(effectivePsi.toFixed(1)), // Derived PSI
    stressFactors: {
      total: parseFloat(totalStress.toFixed(2)),
      mechanical: parseFloat(mechanicalStress.toFixed(2)),
      chemical: parseFloat(chemicalStress.toFixed(2)),
      pressure: parseFloat(pressureStress.toFixed(2)),
      corrosion: parseFloat(corrosionStress.toFixed(2)),
      temp: tempStressRaw,
      tempMechanical: parseFloat(tempMechanical.toFixed(2)),
      tempChemical: parseFloat(tempChemical.toFixed(2)),
      circ: circStress,
      loop: loopPenalty,
      sediment: parseFloat(sedimentStress.toFixed(2))
    },
    riskLevel: getLocationRisk(data.location, data.isFinishedArea),
    sedimentRate: parseFloat(sedimentRate.toFixed(2)),
    monthsToFlush,
    monthsToLockout,
    flushStatus,
    agingRate: parseFloat(currentAgingRate.toFixed(2)),
    optimizedRate: parseFloat(optimizedStress.toFixed(2)),
    yearsLeftCurrent: parseFloat(yearsLeftCurrent.toFixed(1)),
    yearsLeftOptimized: parseFloat(yearsLeftOptimized.toFixed(1)),
    lifeExtension: parseFloat(lifeExtension.toFixed(1)),
    primaryStressor
  };
}

// --- RAW RECOMMENDATION ENGINE ---
// Strict Tiered Decision Tree v7.0
// Priority: Safety → Economic → Service → Pass
// Units that pass Tiers 1 & 2 are SAVEABLE

function getRawRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  
  // ============================================
  // TIER 0: IMMEDIATE EXPLOSION HAZARD
  // ============================================
  // Checks measured house pressure against T&P rating
  if (data.housePsi >= CONSTANTS.LIMIT_PSI_EXPLOSION) {
    return {
      action: 'REPLACE',
      title: 'Explosion Hazard',
      reason: `House pressure (${data.housePsi} PSI) exceeds the T&P Safety Valve rating (150 PSI). Unit is a ticking bomb.`,
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }

  // ============================================
  // TIER 1: SAFETY & PHYSICAL LOCKOUT (Must Replace)
  // Only these conditions warrant immediate replacement
  // ============================================
  
  // 1A. Containment Breach: Visual rust OR active leak
  if (data.visualRust || data.isLeaking) {
    return {
      action: 'REPLACE',
      title: 'Containment Breach',
      reason: 'Visual evidence of tank failure. Leak is imminent or active.',
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }

  // 1B. Sediment Lockout: Hardite buildup (>15 lbs)
  if (metrics.sedimentLbs > CONSTANTS.LIMIT_SEDIMENT_LOCKOUT) {
    return {
      action: 'REPLACE',
      title: 'Sediment Lockout',
      reason: `Extreme buildup (${metrics.sedimentLbs.toFixed(1)} lbs) detected. Flushing is no longer possible without risking drain valve failure.`,
      urgent: false,
      badgeColor: 'red',
      badge: 'REPLACE'
    };
  }

  // 1C. Structural Fatigue (Updated Logic)
  // USES EFFECTIVE PSI to catch hidden thermal expansion damage
  if (metrics.effectivePsi > CONSTANTS.LIMIT_PSI_CRITICAL && data.calendarAge > 10) {
    // Distinguish between High House Pressure vs Hidden Spike for the reason text
    const isGhostSpike = data.housePsi <= 80 && metrics.effectivePsi > 100;
    const reason = isGhostSpike
      ? `Tank is fatigued by years of hidden thermal expansion spikes (~${metrics.effectivePsi} PSI) due to missing expansion tank.`
      : `Long-term exposure to critical pressure (>100 PSI) has compromised the steel tank structure.`;

    return {
      action: 'REPLACE',
      title: 'Vessel Fatigue',
      reason,
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }

  // ============================================
  // TIER 2: ECONOMIC REPLACEMENT (Risk > Value)
  // Only if failProb exceeds strict thresholds
  // ============================================
  
  // 2A. Statistical End-of-Life (Patched Highlander Loophole)
  // We added || age > 20 to ensure old tanks don't slip through the math
  if (metrics.failProb > 60 || data.calendarAge > CONSTANTS.LIMIT_AGE_MAX) {
    return {
      action: 'REPLACE',
      title: 'End of Service Life',
      reason: `Unit has exceeded its statistical service life (${data.calendarAge} years / ${metrics.failProb.toFixed(0)}% risk).`,
      urgent: false,
      badgeColor: 'red',
      badge: 'REPLACE'
    };
  }

  // 2B. Liability Hazard: High/Extreme risk location + failProb > 30%
  // Applies to: Attics, Upper Floors, Main Living Areas, Finished Basements
  // Lower threshold for finished areas where water damage is catastrophic
  if (metrics.riskLevel >= CONSTANTS.RISK_HIGH && metrics.failProb > 30) {
    return {
      action: 'REPLACE',
      title: 'Liability Hazard',
      reason: `Unit is in a high-damage zone. Statistical failure risk (${metrics.failProb.toFixed(0)}%) exceeds the safety threshold for finished areas.`,
      urgent: false,
      badgeColor: 'orange',
      badge: 'REPLACE'
    };
  }

  // ============================================
  // TIER 3: SERVICE ZONE (Unit is SAVEABLE)
  // If we reach here, the unit passed safety & economic checks
  // ============================================
  
  // Determine if system is closed-loop (backflow preventer OR PRV creates closed loop)
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;

  // 3A. Missing Thermal Expansion (Closed Loop without Expansion Tank) - URGENT
  if (isActuallyClosed && !data.hasExpTank) {
    return {
      action: 'REPAIR',
      title: 'Missing Thermal Expansion',
      reason: 'Closed-loop system detected without an expansion tank. This voids manufacturer warranty and causes premature tank failure.',
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }

  // 3B. Critical Pressure Violation (House Pressure)
  // This catches the "High House Pressure" scenario (PRV failed or missing)
  if (data.housePsi > CONSTANTS.LIMIT_PSI_SAFE) {
    if (data.hasPrv) {
      return {
        action: 'REPAIR',
        title: 'Failed PRV Detected',
        reason: `House pressure is ${data.housePsi} PSI despite having a PRV. The valve has failed.`,
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE'
      };
    }
    
    // If we have an Exp Tank but high House PSI
    if (data.hasExpTank) {
      return {
        action: 'REPAIR',
        title: 'High House Pressure',
        reason: `Incoming pressure is ${data.housePsi} PSI. PRV required to protect the system.`,
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE'
      };
    }
    
    return {
      action: 'REPAIR',
      title: 'Critical Pressure Violation',
      reason: `House pressure is ${data.housePsi} PSI (Code Max: 80). Install PRV and Expansion Tank.`,
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }

  // 3C. Pressure Optimization (Young tanks with elevated pressure)
  if (!data.hasPrv && data.housePsi >= 65 && data.housePsi <= 80 && data.calendarAge < 8) {
    // If no expansion tank, MUST recommend both as a package - PRV alone creates dangerous closed-loop thermal spikes
    if (!data.hasExpTank) {
      return {
        action: 'UPGRADE',
        title: 'Pressure Package',
        reason: `Pressure is ${data.housePsi} PSI. Install PRV + Expansion Tank together. PRV alone would create dangerous thermal spikes.`,
        urgent: false,
        badgeColor: 'yellow',
        badge: 'SERVICE'
      };
    }
    
    // Has expansion tank - safe to recommend just PRV
    return {
      action: 'UPGRADE',
      title: 'Pressure Optimization',
      reason: `Pressure is ${data.housePsi} PSI. Installing a PRV will reduce stress and extend life.`,
      urgent: false,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // ============================================
  // TIER 3B: MAINTENANCE ZONE (Flush Decision Tree)
  // ============================================
  
  const isFragile = metrics.failProb > CONSTANTS.LIMIT_FAILPROB_FRAGILE 
                 || data.calendarAge >= CONSTANTS.LIMIT_AGE_FRAGILE;
  const isServiceable = metrics.sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_FLUSH 
                     && metrics.sedimentLbs <= CONSTANTS.LIMIT_SEDIMENT_LOCKOUT;
  
  // Fragile tank with sediment - don't touch
  if (isFragile && isServiceable) {
    return {
      action: 'PASS',
      title: 'Maintenance Risk',
      reason: `Sediment present (${metrics.sedimentLbs.toFixed(1)} lbs), but unit age (${data.calendarAge} yrs) makes flushing risky. Disturbance may cause leaks.`,
      urgent: false,
      badgeColor: 'yellow',
      badge: 'MONITOR'
    };
  }

  // Safe to flush
  if (!isFragile && isServiceable) {
    return {
      action: 'MAINTAIN',
      title: 'Performance Flush',
      reason: `Estimated ${metrics.sedimentLbs.toFixed(1)} lbs of sediment. Flushing now will restore efficiency and prevent element burnout.`,
      urgent: false,
      badgeColor: 'green',
      badge: 'SERVICE'
    };
  }

  // Anode refresh on young tanks
  if (metrics.shieldLife < 1 && data.calendarAge < CONSTANTS.AGE_ANODE_LIMIT) {
    return {
      action: 'MAINTAIN',
      title: 'Anode Refresh',
      reason: 'Cathodic protection depleted. Replace anode to extend warranty life.',
      urgent: false,
      badgeColor: 'green',
      badge: 'MONITOR'
    };
  }

  // ============================================
  // TIER 4: PASS (System Healthy)
  // ============================================
  
  return {
    action: 'PASS',
    title: 'System Healthy',
    reason: 'Unit is operating within safe parameters.',
    urgent: false,
    badgeColor: 'green',
    badge: 'OPTIMAL'
  };
}

// --- ECONOMIC OPTIMIZATION ENGINE ---

function optimizeEconomicDecision(
  rec: Recommendation, 
  data: ForensicInputs, 
  metrics: OpterraMetrics
): Recommendation {
  const isOld = data.calendarAge > CONSTANTS.AGE_ECONOMIC_REPAIR_LIMIT;
  
  // HEAVY REPAIR OPTIMIZATION (PRV / Exp Tank / Pressure)
  if (rec.action === 'REPAIR' || rec.action === 'UPGRADE') {
    const isHeavyRepair = rec.title.includes('PRV') 
                       || rec.title.includes('Expansion') 
                       || rec.title.includes('Pressure');
    
    if (isHeavyRepair && isOld) {
      // Scenario A: Low Risk Location (Garage) -> RUN TO FAILURE
      if (metrics.riskLevel <= CONSTANTS.RISK_MED) {
        return {
          action: 'PASS',
          title: 'Run to Failure',
          reason: `High pressure detected, but tank age (${data.calendarAge} yrs) does not justify expensive repairs in this low-risk location. Budget for replacement.`,
          urgent: false,
          badgeColor: 'yellow',
          badge: 'MONITOR'
        };
      }
      
      // Scenario B: High Risk Location (Attic/Living) -> STRATEGIC REPLACEMENT
      if (metrics.riskLevel >= CONSTANTS.RISK_HIGH) {
        return {
          action: 'REPLACE',
          title: 'Strategic Replacement',
          reason: `System requires major pressure repairs ($$$). Given tank age (${data.calendarAge} yrs) and high-risk location, replacement is the safer investment.`,
          urgent: false,
          badgeColor: 'orange',
          badge: 'REPLACE'
        };
      }
    }
  }

  // BUDGETING ADVICE (Healthy but Past Warranty)
  if (rec.action === 'PASS' && data.calendarAge > data.warrantyYears) {
    if (rec.badge === 'OPTIMAL') {
      return {
        action: 'PASS',
        title: 'Warranty Expired',
        reason: `Unit is operating normally but is past its ${data.warrantyYears}-year warranty. Start budgeting for replacement.`,
        urgent: false,
        badgeColor: 'blue',
        badge: 'MONITOR'
      };
    }
  }

  return rec;
}

// --- MAIN ENTRY POINT ---

export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  const metrics = calculateHealth(data);
  const rawVerdict = getRawRecommendation(metrics, data);
  const verdict = optimizeEconomicDecision(rawVerdict, data, metrics);
  
  return { metrics, verdict };
}

// Exported wrapper for backward compatibility
export function getRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  return optimizeEconomicDecision(getRawRecommendation(metrics, data), data, metrics);
}

// --- LEGACY COMPATIBILITY ---

// Legacy location risk function
export function calculateLocationRiskLevel(location: LocationType, isFinished: boolean): RiskLevel {
  return getLocationRisk(location, isFinished);
}

// Legacy baseline risk data
export interface BaselineRisk {
  age: number;
  failureProbability: number;
}

export const industryBaseline: BaselineRisk[] = [
  { age: 1, failureProbability: 0.5 },
  { age: 2, failureProbability: 1.2 },
  { age: 3, failureProbability: 2.1 },
  { age: 4, failureProbability: 3.2 },
  { age: 5, failureProbability: 4.8 },
  { age: 6, failureProbability: 6.8 },
  { age: 7, failureProbability: 9.2 },
  { age: 8, failureProbability: 12.1 },
  { age: 9, failureProbability: 15.5 },
  { age: 10, failureProbability: 19.4 },
  { age: 11, failureProbability: 23.8 },
  { age: 12, failureProbability: 28.7 },
  { age: 13, failureProbability: 34.1 },
  { age: 14, failureProbability: 39.9 },
  { age: 15, failureProbability: 46.1 },
];

export function getBaselineRisk(age: number): number {
  const entry = industryBaseline.find(b => b.age === Math.round(age));
  return entry?.failureProbability ?? 0;
}
