/**
 * OPTERRA v6.0 Risk Calculation Engine
 * 
 * A physics-based reliability algorithm for water heater risk assessment.
 * Only recommends action for documented problems - never on healthy systems.
 */

// --- TYPES & INTERFACES ---

export type FuelType = 'GAS' | 'ELECTRIC';
export type TempSetting = 'LOW' | 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'UPPER_FLOOR' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE' | 'EXTERIOR' | 'CRAWLSPACE';
export type RiskLevel = 1 | 2 | 3 | 4;

export interface ForensicInputs {
  calendarAge: number;     // Years
  warrantyYears: number;   // Standard is 6, 9, or 12
  psi: number;             // System pressure
  tempSetting: TempSetting; // HOT = 140°F+
  location: LocationType;
  isFinishedArea: boolean; // Is the area finished (drywall/carpet)?
  fuelType: FuelType;
  hardnessGPG: number;     // Grains per gallon
  
  // Equipment Flags
  hasSoftener: boolean;
  hasCircPump: boolean;
  hasExpTank: boolean;
  hasPrv: boolean;         // Pressure Reducing Valve present?
  isClosedLoop: boolean;   // Check valve or backflow preventer present?
  
  // Visual Inspection
  visualRust: boolean;     // Visible corrosion on tank body
  isLeaking?: boolean;     // Active water leak
}

export interface OpterraMetrics {
  bioAge: number;          // The "True" age of the metal
  failProb: number;        // Probability of failure in next 12mo
  healthScore: number;     // 0-100 User Facing Score
  sedimentLbs: number;     // Calculated calcium buildup
  shieldLife: number;      // Years until anode was depleted
  stressFactors: {
    total: number;
    pressure: number;
    temp: number;
    circ: number;
    loop: number;
    sediment: number;
  };
  riskLevel: RiskLevel;
  
  // Aging Speedometer metrics
  agingRate: number;           // Current stress multiplier (e.g., 3.1x)
  optimizedRate: number;       // Rate after PRV + expansion tank fixes
  yearsLeftCurrent: number;    // Remaining life on current path
  yearsLeftOptimized: number;  // Remaining life if optimized
  lifeExtension: number;       // Years gained by fixing (ROI)
  primaryStressor: string;     // Main contributor to accelerated aging
}

export type ActionType = 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS';

export interface Recommendation {
  action: ActionType;
  title: string;
  reason: string;
  urgent: boolean;
  badgeColor: 'red' | 'orange' | 'yellow' | 'blue' | 'green';
  // Legacy compatibility fields
  badge?: RecommendationBadge;
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
  // Weibull Reliability Parameters (Calibrated for Glass-Lined Steel)
  ETA: 11.5,               // Characteristic Life (63.2% failure point)
  BETA: 2.2,               // Shape >2.0 indicates wear-out (corrosion) vs random
  
  // Physics Baselines
  DESIGN_PSI: 60,          // The "Safe" working pressure baseline
  FATIGUE_EXP: 4.0,        // Basquin's exponent for corrosion-fatigue in steel
  
  // Sediment Accumulation (lbs per year per GPG)
  SEDIMENT_FACTOR_GAS: 0.044, 
  SEDIMENT_FACTOR_ELEC: 0.08,
  
  // Stress Saturation (Diffusion-Limited Corrosion)
  MAX_STRESS_CAP: 12.0,    // Max multiplier: 1 year = 12 years wear. Higher = immediate failure (Tier 1)
  
  // Critical Thresholds
  MAX_BIO_AGE: 25,         // Cap for age calculation (extended from 20)
  STATISTICAL_CAP: 85.0,   // Max probability based on math alone
  VISUAL_CAP: 99.9,        // Max probability if rust is seen
  
  LIMIT_PSI_SAFE: 80,      // Max code-compliant pressure
  LIMIT_PSI_CRITICAL: 100, // Vessel fatigue threshold
  LIMIT_PSI_PRV_FAIL: 75,  // If PRV exists but PSI > this, PRV failed
  LIMIT_PSI_OPTIMIZE: 65,  // Threshold for recommending PRV optimization
  
  LIMIT_SEDIMENT_LOCKOUT: 15,  // lbs - hardened "limestone" threshold (Killer Flush)
  LIMIT_SEDIMENT_FLUSH: 5,     // lbs - maintenance threshold (Sweet Spot lower bound)
  LIMIT_AGE_FRAGILE: 12,       // years - tank too old to safely disturb
  LIMIT_FAILPROB_FRAGILE: 60,  // % - statistical death threshold
  
  // Risk Levels (Severity Index)
  RISK_LOW: 1 as RiskLevel,      // Concrete/Exterior
  RISK_MED: 2 as RiskLevel,      // Unfinished Basement/Garage
  RISK_HIGH: 3 as RiskLevel,     // Finished Basement/Main Floor
  RISK_EXTREME: 4 as RiskLevel,  // Attic/Upper Floor
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
  const sedimentLbs = data.calendarAge * data.hardnessGPG * sedFactor;

  // 3. STRESS FACTORS (Physics Multipliers)
  
  // A. Pressure (Basquin's Power Law)
  const effectivePsi = Math.max(data.psi, CONSTANTS.DESIGN_PSI);
  const pressureStress = Math.pow(effectivePsi / CONSTANTS.DESIGN_PSI, CONSTANTS.FATIGUE_EXP);

  // B. Temperature (Arrhenius with eco reward)
  let tempStress = 1.0;  // NORMAL baseline (120°F)
  if (data.tempSetting === 'HOT') tempStress = 2.0;   // 140°F+ accelerates corrosion
  if (data.tempSetting === 'LOW') tempStress = 0.8;   // 110°F eco mode life extension

  // C. Circulation (Erosion-Corrosion & Duty Cycle)
  const circStress = data.hasCircPump ? 1.4 : 1.0;

  // D. Closed Loop Hammer
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;
  const loopPenalty = (isActuallyClosed && !data.hasExpTank) ? 1.5 : 1.0;

  // E. Sediment Stress (Under-deposit corrosion / thermal fatigue)
  // 0 lbs = 1.0x, 10 lbs = 1.5x, 20 lbs = 2.0x
  const sedimentStress = 1.0 + (sedimentLbs * 0.05);

  // Combine all stress factors
  const rawStress = pressureStress * tempStress * circStress * loopPenalty * sedimentStress;
  
  // SATURATION CAP: Clamp at max multiplier (diffusion-limited corrosion)
  // 12x means 1 year = 12 years of wear. Higher implies immediate failure (Tier 1)
  const totalStress = Math.min(rawStress, CONSTANTS.MAX_STRESS_CAP);

  // 4. BIOLOGICAL AGE
  const age = data.calendarAge;
  
  // Time with anode protection vs exposed steel
  const timeProtected = Math.min(age, effectiveShieldDuration);
  const timeNaked = Math.max(0, age - effectiveShieldDuration);

  // Phase 1: Protected (steel is shielded, slower aging)
  const protectedAging = timeProtected * (1 + (totalStress * 0.1));  // Lower weight
  
  // Phase 2: Naked (steel is attacked directly)
  const nakedAging = timeNaked * totalStress;
  
  // Final biological age (capped for extreme cases)
  const rawBioAge = protectedAging + nakedAging;
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
  const optimizedStress = Math.min(
    optimizedPressureStress * tempStress * circStress * optimizedLoopPenalty * sedimentStress,
    CONSTANTS.MAX_STRESS_CAP
  );

  // Calculate remaining capacity and life projection
  const remainingCapacity = Math.max(0, CONSTANTS.MAX_BIO_AGE - bioAge);
  const yearsLeftCurrent = remainingCapacity > 0 ? remainingCapacity / currentAgingRate : 0;
  const yearsLeftOptimized = remainingCapacity > 0 ? remainingCapacity / optimizedStress : 0;
  const lifeExtension = Math.max(0, yearsLeftOptimized - yearsLeftCurrent);

  // Identify primary stressor for UX messaging
  const stressorFactors = [
    { name: 'High Pressure', value: pressureStress },
    { name: 'High Temperature', value: tempStress },
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
    stressFactors: {
      total: parseFloat(totalStress.toFixed(2)),
      pressure: parseFloat(pressureStress.toFixed(2)),
      temp: tempStress,
      circ: circStress,
      loop: loopPenalty,
      sediment: parseFloat(sedimentStress.toFixed(2))
    },
    riskLevel: getLocationRisk(data.location, data.isFinishedArea),
    
    // Aging Speedometer metrics
    agingRate: parseFloat(currentAgingRate.toFixed(2)),
    optimizedRate: parseFloat(optimizedStress.toFixed(2)),
    yearsLeftCurrent: parseFloat(yearsLeftCurrent.toFixed(1)),
    yearsLeftOptimized: parseFloat(yearsLeftOptimized.toFixed(1)),
    lifeExtension: parseFloat(lifeExtension.toFixed(1)),
    primaryStressor
  };
}

// --- RECOMMENDATION ENGINE ---
// Strict Tiered Decision Tree v7.0
// Priority: Safety → Economic → Service → Pass
// Units that pass Tiers 1 & 2 are SAVEABLE

export function getRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  
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

  // 1C. Structural Fatigue: Critical pressure (>100 PSI) + Old tank (>10 yrs)
  if (data.psi > CONSTANTS.LIMIT_PSI_CRITICAL && data.calendarAge > 10) {
    return {
      action: 'REPLACE',
      title: 'Vessel Fatigue',
      reason: 'Long-term exposure to critical pressure (>100 PSI) has compromised the steel tank structure.',
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }

  // ============================================
  // TIER 2: ECONOMIC REPLACEMENT (Risk > Value)
  // Only if failProb exceeds strict thresholds
  // ============================================
  
  // 2A. Statistical End-of-Life: failProb > 60%
  if (metrics.failProb > 60) {
    return {
      action: 'REPLACE',
      title: 'Statistical End-of-Life',
      reason: `Failure probability is ${metrics.failProb.toFixed(0)}%. Repair costs are not justifiable.`,
      urgent: false,
      badgeColor: 'red',
      badge: 'REPLACE'
    };
  }

  // 2B. Liability Hazard: High/Extreme risk location + failProb > 40%
  if (metrics.riskLevel >= CONSTANTS.RISK_HIGH && metrics.failProb > 40) {
    return {
      action: 'REPLACE',
      title: 'Liability Hazard',
      reason: 'Unit is in a high-damage zone with elevated failure probability. Risk outweighs value.',
      urgent: false,
      badgeColor: 'red',
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

  // 3B. Critical Pressure Violation (PSI > 80) - URGENT
  if (data.psi > CONSTANTS.LIMIT_PSI_SAFE) {
    // Determine root cause
    if (data.hasPrv) {
      return {
        action: 'REPAIR',
        title: 'Failed PRV Detected',
        reason: `System pressure is ${data.psi} PSI despite having a PRV. The valve has failed and needs replacement.`,
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE'
      };
    }
    
    if (data.hasExpTank) {
      return {
        action: 'REPAIR',
        title: 'Expansion Tank Failure',
        reason: 'High pressure detected despite expansion tank presence. Bladder likely ruptured.',
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE'
      };
    }
    
    return {
      action: 'REPAIR',
      title: 'Critical Pressure Violation',
      reason: `Water pressure is ${data.psi} PSI (Code Max: 80). Install PRV and Expansion Tank immediately.`,
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }

  // 3C. Pressure Optimization (65-80 PSI on young tanks) - NOT URGENT
  if (!data.hasPrv && data.psi >= CONSTANTS.LIMIT_PSI_OPTIMIZE && data.psi <= CONSTANTS.LIMIT_PSI_SAFE && data.calendarAge < 8) {
    const improvement = Math.round((metrics.stressFactors.pressure - 1) * 100);
    return {
      action: 'UPGRADE',
      title: 'Pressure Optimization',
      reason: `Pressure is ${data.psi} PSI. Installing a PRV will reduce tank stress by ~${improvement}% and extend life.`,
      urgent: false,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // ============================================
  // TIER 3B: MAINTENANCE ZONE (Flush Decision Tree)
  // ============================================
  
  const isFragile = metrics.failProb > CONSTANTS.LIMIT_FAILPROB_FRAGILE 
                 || data.calendarAge > CONSTANTS.LIMIT_AGE_FRAGILE;
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
  if (metrics.shieldLife < 1 && data.calendarAge < 6) {
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

// --- MAIN ENTRY POINT ---

export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  const metrics = calculateHealth(data);
  const verdict = getRecommendation(metrics, data);
  
  return { metrics, verdict };
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
