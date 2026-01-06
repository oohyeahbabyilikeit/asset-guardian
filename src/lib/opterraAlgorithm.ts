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
  };
  riskLevel: RiskLevel;
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
  
  // Critical Thresholds
  MAX_BIO_AGE: 25,         // Cap for age calculation
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
  
  // 1. ANODE SHIELD LIFE
  let anodeDecay = 1.0;
  if (data.hasSoftener) anodeDecay += 1.4;
  if (data.hasCircPump) anodeDecay += 0.5;
  const expansionBenefit = data.hasExpTank ? 1.1 : 1.0;
  const shieldLife = (data.warrantyYears * expansionBenefit) / anodeDecay;

  // 2. STRESS FACTORS (Physics Multipliers)
  
  // A. Pressure (Basquin's Power Law)
  const effectivePsi = Math.max(data.psi, CONSTANTS.DESIGN_PSI);
  const pressureStress = Math.pow(effectivePsi / CONSTANTS.DESIGN_PSI, CONSTANTS.FATIGUE_EXP);

  // B. Temperature (Arrhenius Rate)
  const tempStress = data.tempSetting === 'HOT' ? 2.0 : 1.0;

  // C. Circulation (Erosion-Corrosion & Duty Cycle)
  const circStress = data.hasCircPump ? 1.4 : 1.0;

  // D. Closed Loop Hammer
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;
  const loopPenalty = (isActuallyClosed && !data.hasExpTank) ? 1.5 : 1.0;

  const totalStress = pressureStress * tempStress * circStress * loopPenalty;

  // 3. BIOLOGICAL AGE
  const age = data.calendarAge;
  const timeProtected = Math.min(age, shieldLife);
  const timeNaked = Math.max(0, age - shieldLife);

  const protectedAging = timeProtected * (1 + (totalStress * 0.2));
  const nakedAging = timeNaked * totalStress;
  const rawBioAge = protectedAging + nakedAging;
  const bioAge = Math.min(rawBioAge, CONSTANTS.MAX_BIO_AGE);

  // 4. WEIBULL FAILURE PROBABILITY
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

  // 5. SEDIMENT CALCULATION
  const sedFactor = data.fuelType === 'ELECTRIC' ? CONSTANTS.SEDIMENT_FACTOR_ELEC : CONSTANTS.SEDIMENT_FACTOR_GAS;
  const sedimentLbs = data.calendarAge * data.hardnessGPG * sedFactor;

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
      loop: loopPenalty
    },
    riskLevel: getLocationRisk(data.location, data.isFinishedArea)
  };
}

// --- RECOMMENDATION ENGINE ---

export function getRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  
  // ============================================
  // TIER 1: SAFETY & PHYSICAL LOCKOUT (Must Replace)
  // ============================================
  
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

  // KILLER FLUSH: Sediment has hardened into limestone (>15 lbs)
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

  // Structural Fatigue: Old tank + Critical Pressure = Bomb
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
  // ============================================
  
  // Liability Check: High Risk Location + High Failure Prob
  if (metrics.riskLevel >= CONSTANTS.RISK_HIGH && metrics.failProb > 40) {
    return {
      action: 'REPLACE',
      title: 'Liability Hazard',
      reason: 'Unit is in a high-damage zone with elevated failure probability. Risk outweighs value.',
      urgent: false,
      badgeColor: 'orange',
      badge: 'REPLACE'
    };
  }

  // Statistical Death
  if (metrics.failProb > 60) {
    return {
      action: 'REPLACE',
      title: 'Statistical End-of-Life',
      reason: `Failure probability is ${metrics.failProb.toFixed(0)}%. Repair costs are not justifiable.`,
      urgent: false,
      badgeColor: 'orange',
      badge: 'REPLACE'
    };
  }

  // ============================================
  // TIER 3: THE SERVICE ZONE (Billable Work)
  // ============================================
  
  // 1. Failed PRV (Has one, but PSI is still high)
  if (data.hasPrv && data.psi > CONSTANTS.LIMIT_PSI_PRV_FAIL) {
    return {
      action: 'REPAIR',
      title: 'Failed PRV Detected',
      reason: `System pressure is ${data.psi} PSI despite having a PRV. The valve has failed.`,
      urgent: true,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // 2. Dangerous Pressure (No PRV, unsafe PSI)
  if (!data.hasPrv && data.psi > CONSTANTS.LIMIT_PSI_SAFE) {
    return {
      action: 'REPAIR',
      title: 'Critical Pressure Violation',
      reason: `Water pressure is ${data.psi} PSI (Code Max: 80). Install PRV and Expansion Tank.`,
      urgent: true,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // 3. Missing Expansion Tank (Closed Loop Trap)
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;
  if (isActuallyClosed && !data.hasExpTank) {
    return {
      action: 'REPAIR',
      title: 'Missing Thermal Expansion',
      reason: 'Closed-loop system detected without an expansion tank. Voids manufacturer warranty.',
      urgent: true,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // 4. Failed Expansion Tank (Has one, but PSI high)
  if (data.hasExpTank && data.psi > CONSTANTS.LIMIT_PSI_SAFE) {
    return {
      action: 'REPAIR',
      title: 'Expansion Tank Failure',
      reason: 'High pressure detected despite expansion tank presence. Bladder likely ruptured.',
      urgent: true,
      badgeColor: 'yellow',
      badge: 'SERVICE'
    };
  }

  // 5. Pressure Optimization (The "Prolong Life" Sell)
  if (!data.hasPrv && data.psi >= CONSTANTS.LIMIT_PSI_OPTIMIZE && data.calendarAge < 8) {
    const improvement = Math.round((metrics.stressFactors.pressure - 1) * 100);
    return {
      action: 'UPGRADE',
      title: 'Pressure Optimization',
      reason: `Pressure is ${data.psi} PSI. Installing a PRV will reduce tank stress by ~${improvement}% and extend life.`,
      urgent: false,
      badgeColor: 'blue',
      badge: 'SERVICE'
    };
  }

  // ============================================
  // SAFE FLUSH DECISION TREE
  // Filters "Killer Flushes" (too old) and "Useless Flushes" (too clean)
  // ============================================
  
  const isFragile = metrics.failProb > CONSTANTS.LIMIT_FAILPROB_FRAGILE 
                 || data.calendarAge > CONSTANTS.LIMIT_AGE_FRAGILE;
  const isClean = metrics.sedimentLbs < CONSTANTS.LIMIT_SEDIMENT_FLUSH;
  const isServiceable = metrics.sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_FLUSH 
                     && metrics.sedimentLbs <= CONSTANTS.LIMIT_SEDIMENT_LOCKOUT;
  
  // THE TRAP: Tank has sediment but is too old/fragile to touch safely
  if (isFragile && isServiceable) {
    return {
      action: 'PASS',
      title: 'Maintenance Risk',
      reason: `Sediment present (${metrics.sedimentLbs.toFixed(1)} lbs), but unit age (${data.calendarAge} yrs) makes flushing risky. We do not recommend servicing this unit—disturbance may cause leaks.`,
      urgent: false,
      badgeColor: 'orange',
      badge: 'MONITOR'
    };
  }

  // THE SWEET SPOT: Safe to flush, beneficial to customer
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
  
  // CLEAN PASS: Falls through to anode check or healthy system

  // 7. Anode Refresh (Only on young tanks to avoid seized threads)
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
