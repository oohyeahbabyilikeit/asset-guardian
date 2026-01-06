// Opterra v3.0 Physics-Based Risk Calculation Engine
// Recalibrated with "Shield vs. Body" Logic + Insurance Logic Recommendation Engine
// Based on DOE (LBNL) & InterNACHI Actuarial Tables

// ============= LOCATION RISK THRESHOLDS =============
// Rule #1: "Vegas Odds" - Lower threshold for expensive locations
export type LocationRiskLevel = 'attic' | 'main_floor' | 'basement' | 'garage';

export interface LocationThreshold {
  location: LocationRiskLevel;
  label: string;
  triggerProbability: number; // Replacement trigger %
  rationale: string;
}

export const locationThresholds: Record<LocationRiskLevel, LocationThreshold> = {
  attic: {
    location: 'attic',
    label: 'Attic / 2nd Floor',
    triggerProbability: 15, // 1-in-7 chance
    rationale: 'Zero Tolerance. You are betting the ceiling.',
  },
  main_floor: {
    location: 'main_floor',
    label: 'Finished Main Floor',
    triggerProbability: 25, // 1-in-4 chance
    rationale: 'Deductible Risk. Likelihood of claim is high.',
  },
  basement: {
    location: 'basement',
    label: 'Unfinished Basement',
    triggerProbability: 35, // 1-in-3 chance
    rationale: 'Cleanup Risk. Nuisance, but manageable.',
  },
  garage: {
    location: 'garage',
    label: 'Garage / Exterior',
    triggerProbability: 40, // Statistical end
    rationale: 'Run to Failure. Only replace if essentially dead.',
  },
};

// ============= RECOMMENDATION TYPES =============
export type RecommendationAction = 'REPLACE' | 'MONITOR' | 'REPAIR';
export type RecommendationBadge = 
  | 'LIABILITY_RISK' 
  | 'FINANCIAL_RISK' 
  | 'ACTUARIAL_EXPIRY' 
  | 'UNSERVICEABLE' 
  | 'MONITOR';

export interface Recommendation {
  action: RecommendationAction;
  badge: RecommendationBadge;
  badgeLabel: string;
  badgeColor: 'red' | 'orange' | 'yellow' | 'green';
  triggerRule: string;
  script: string;
  canRepair: boolean;
}

// ============= CONSTANTS =============
const INSURANCE_DEDUCTIBLE = 2500; // $2,500 threshold for liability
const FINANCIAL_DAMAGE_THRESHOLD = 1000; // $1,000 for financial risk
const ACTUARIAL_WALL = 12.0; // Rule #2: Biological age hard stop
const SEDIMENT_LOCK = 15; // Rule #3: Serviceability lock (lbs)

export interface BaselineRisk {
  ageRange: string;
  minAge: number;
  maxAge: number;
  failureProb: number;
  status: 'safe' | 'moderate' | 'warning' | 'critical';
}

export interface ForensicInputs {
  pressure: number;
  baselinePressure: number;
  hasSoftener: boolean;
  hasExpansionTank: boolean;
  anodeCondition: 'good' | 'depleted' | 'missing';
  visualRust?: boolean; // Override for visible rust/leak
  sedimentLoad?: number; // Pounds of sediment (for serviceability check)
  estimatedDamage?: number; // Estimated burst damage in dollars
  locationRiskLevel?: LocationRiskLevel; // Location for threshold lookup
}

export interface RiskDilationResult {
  paperAge: number;
  biologicalAge: number;
  baselineRisk: number;
  forensicRisk: number;
  accelerationFactor: number;
  stressFactor: number;
  defenseFactor: number;
  anodeLifespan: number;
  exposureYears: number;
  protectedYears: number;
  nakedAgingRate: number;
  status: 'safe' | 'moderate' | 'warning' | 'critical';
  insight: string;
}

// Industry standard baseline from DOE/LBNL data
export const industryBaseline: BaselineRisk[] = [
  { ageRange: '0-6 Years', minAge: 0, maxAge: 6, failureProb: 2.5, status: 'safe' },
  { ageRange: '7-9 Years', minAge: 7, maxAge: 9, failureProb: 7.0, status: 'moderate' },
  { ageRange: '10-12 Years', minAge: 10, maxAge: 12, failureProb: 26.5, status: 'warning' },
  { ageRange: '13+ Years', minAge: 13, maxAge: 99, failureProb: 60, status: 'critical' },
];

// Standard anode rod lifespan in years
const STANDARD_ANODE_LIFE = 6;

// Softener penalty factor (kills anode 2.4x faster)
const SOFTENER_PENALTY = 2.4;

// Maximum credible risk cap (unless visual rust detected)
const MAX_CREDIBLE_RISK = 45.0;

// Naked steel aging rate multiplier (base rate when anode is dead)
const BASE_NAKED_RATE = 2.0;

/**
 * Step A: Calculate when the anode "shield" died
 * Softener accelerates anode depletion, not tank aging directly
 */
export function calculateAnodeLifespan(hasSoftener: boolean): number {
  if (hasSoftener) {
    return STANDARD_ANODE_LIFE / SOFTENER_PENALTY; // ~2.5 years
  }
  return STANDARD_ANODE_LIFE;
}

/**
 * Step B: Calculate exposure (naked) years
 * Time the tank has been unprotected
 */
export function calculateExposureYears(paperAge: number, anodeLifespan: number): number {
  return Math.max(0, paperAge - anodeLifespan);
}

/**
 * Step C: Calculate Stress Factor using pressure
 * Higher pressure = faster rust on exposed steel
 */
export function calculateStressFactor(currentPSI: number, baselinePSI: number = 60): number {
  return Math.pow(currentPSI / baselinePSI, 2); // Squared for pressure impact on naked steel
}

/**
 * Step D: Calculate "Naked Steel" aging rate
 * Once anode is dead: Pressure + Salt = accelerated rust
 */
export function calculateNakedAgingRate(stressFactor: number): number {
  return BASE_NAKED_RATE * stressFactor; // Base 2x + pressure multiplier
}

/**
 * Step E: Calculate Biological Age using Shield vs Body logic
 * Protected years age normally (1x)
 * Naked years age at accelerated rate
 */
export function calculateBiologicalAge(
  paperAge: number,
  anodeLifespan: number,
  nakedAgingRate: number
): number {
  const protectedYears = Math.min(paperAge, anodeLifespan);
  const exposureYears = Math.max(0, paperAge - anodeLifespan);
  
  // Protected phase: normal aging (1x)
  // Naked phase: accelerated aging
  const protectedAging = protectedYears * 1.0;
  const nakedAging = exposureYears * nakedAgingRate;
  
  return protectedAging + nakedAging;
}

/**
 * Step F: Calculate Failure Probability using Weibull Distribution
 * Standard life expectancy for water heaters is 11.5 years
 */
export function calculateWeibullProbability(
  biologicalAge: number, 
  lifeExpectancy: number = 11.5,
  shape: number = 2.5
): number {
  const probability = 1 - Math.exp(-Math.pow(biologicalAge / lifeExpectancy, shape));
  return probability * 100;
}

/**
 * Apply safety cap to maintain credibility
 * No working tank has >45% chance of bursting unless visible rust
 */
export function applySafetyCap(calculatedRisk: number, visualRust: boolean = false): number {
  if (visualRust) {
    return 99.0; // Override if we physically see a leak
  }
  return Math.min(calculatedRisk, MAX_CREDIBLE_RISK);
}

/**
 * Get baseline risk for a given calendar age
 */
export function getBaselineRisk(paperAge: number): BaselineRisk {
  return industryBaseline.find(
    b => paperAge >= b.minAge && paperAge <= b.maxAge
  ) || industryBaseline[3];
}

/**
 * Determine status based on forensic risk percentage
 */
export function getStatusFromRisk(risk: number): 'safe' | 'moderate' | 'warning' | 'critical' {
  if (risk < 10) return 'safe';
  if (risk < 25) return 'moderate';
  if (risk < 45) return 'warning';
  return 'critical';
}

/**
 * Master function: Calculate complete risk dilation analysis
 * Uses "Shield vs. Body" logic for realistic aging
 */
export function calculateRiskDilation(
  paperAge: number,
  forensics: ForensicInputs
): RiskDilationResult {
  // Step A: When did the shield die?
  const anodeLifespan = calculateAnodeLifespan(forensics.hasSoftener);
  
  // Step B: Calculate exposure years
  const exposureYears = calculateExposureYears(paperAge, anodeLifespan);
  const protectedYears = Math.min(paperAge, anodeLifespan);
  
  // Step C: Calculate stress from pressure
  const stressFactor = calculateStressFactor(forensics.pressure, forensics.baselinePressure);
  
  // Step D: Calculate naked aging rate
  const nakedAgingRate = calculateNakedAgingRate(stressFactor);
  
  // Step E: Calculate biological age
  const biologicalAge = calculateBiologicalAge(paperAge, anodeLifespan, nakedAgingRate);
  
  // Step F: Calculate raw forensic risk using Weibull
  const rawForensicRisk = calculateWeibullProbability(biologicalAge);
  
  // Apply safety cap for credibility
  const forensicRisk = applySafetyCap(rawForensicRisk, forensics.visualRust);
  
  // Get baseline risk for comparison
  const baselineData = getBaselineRisk(paperAge);
  const baselineRisk = baselineData.failureProb;
  
  // Calculate acceleration factor (how much faster than baseline)
  const accelerationFactor = forensicRisk / Math.max(baselineRisk, 0.1);
  
  // Defense factor for display (lower = less protection)
  const defenseFactor = forensics.hasSoftener ? 0.42 : 1.0;
  
  // Determine status
  const status = getStatusFromRisk(forensicRisk);
  
  // Generate insight text
  const insight = generateInsight(paperAge, biologicalAge, exposureYears, forensics);
  
  return {
    paperAge,
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    baselineRisk,
    forensicRisk: Math.round(forensicRisk * 10) / 10,
    accelerationFactor: Math.round(accelerationFactor * 10) / 10,
    stressFactor: Math.round(stressFactor * 100) / 100,
    defenseFactor: Math.round(defenseFactor * 100) / 100,
    anodeLifespan: Math.round(anodeLifespan * 10) / 10,
    exposureYears: Math.round(exposureYears * 10) / 10,
    protectedYears: Math.round(protectedYears * 10) / 10,
    nakedAgingRate: Math.round(nakedAgingRate * 10) / 10,
    status,
    insight,
  };
}

/**
 * Generate human-readable insight explaining the risk dilation
 */
function generateInsight(
  paperAge: number,
  biologicalAge: number,
  exposureYears: number,
  forensics: ForensicInputs
): string {
  const riskMultiple = Math.round((biologicalAge / paperAge) * 10) / 10;
  const yearsAgo = Math.round(exposureYears * 10) / 10;
  
  if (exposureYears <= 0) {
    return `your tank is ${paperAge} years old and still has active corrosion protection. Standard risk applies.`;
  }
  
  const baselineRisk = getBaselineRisk(paperAge).failureProb;
  const currentRisk = calculateWeibullProbability(biologicalAge);
  const cappedRisk = applySafetyCap(currentRisk, forensics.visualRust);
  const riskRatio = Math.round(cappedRisk / baselineRisk);
  
  return `a normal ${paperAge}-year-old tank has a ${baselineRisk.toFixed(1)}% risk. Yours has a ${cappedRisk.toFixed(1)}% risk. You are ${riskRatio}x more likely to have a flood this year than your neighbor because your protection rod died ${yearsAgo} years ago.`;
}

// ============= RECOMMENDATION ENGINE =============
// Insurance Logic: 3 Business Rules

/**
 * Rule #1: Vegas Odds - Location vs. Probability
 * Lower the failure threshold based on how expensive the location is
 */
function checkLocationRule(
  forensicRisk: number,
  estimatedDamage: number,
  locationRiskLevel: LocationRiskLevel
): Recommendation | null {
  const threshold = locationThresholds[locationRiskLevel];
  
  // LIABILITY RISK: High probability + exceeds deductible
  if (forensicRisk > threshold.triggerProbability && estimatedDamage > INSURANCE_DEDUCTIBLE) {
    return {
      action: 'REPLACE',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🔴 LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #1: Location Risk',
      script: `Normally a ${threshold.triggerProbability}% risk is acceptable. But because this tank is in your ${threshold.label.toLowerCase()}, you are betting a $${Math.round(estimatedDamage / 1000)}K repair on a roll of the dice. The math says that is a bad bet.`,
      canRepair: false,
    };
  }
  
  // FINANCIAL RISK: High probability + exceeds $1,000
  if (forensicRisk > 25 && estimatedDamage > FINANCIAL_DAMAGE_THRESHOLD) {
    return {
      action: 'REPLACE',
      badge: 'FINANCIAL_RISK',
      badgeLabel: '🟠 FINANCIAL RISK',
      badgeColor: 'orange',
      triggerRule: 'Rule #1: Financial Threshold',
      script: `With a ${forensicRisk.toFixed(1)}% failure probability and $${Math.round(estimatedDamage / 1000)}K potential damage, the expected loss exceeds your deductible. Replacement is financially justified.`,
      canRepair: true,
    };
  }
  
  return null;
}

/**
 * Rule #2: Actuarial Wall - The Hard Stop
 * Biological age > 12 years = terminal metal fatigue
 */
function checkActuarialWall(biologicalAge: number): Recommendation | null {
  if (biologicalAge > ACTUARIAL_WALL) {
    return {
      action: 'REPLACE',
      badge: 'ACTUARIAL_EXPIRY',
      badgeLabel: '🔴 ACTUARIAL EXPIRY',
      badgeColor: 'red',
      triggerRule: 'Rule #2: Biological Age Limit',
      script: `Legally I can repair this, but mathematically it is ${biologicalAge.toFixed(1)} years old. Investing money into a tank with 0% remaining life is throwing good money after bad. My software prevents me from quoting repairs on expired assets.`,
      canRepair: false, // Lockout repairs
    };
  }
  return null;
}

/**
 * Rule #3: Serviceability Lock - Sediment Load
 * Sediment > 15 lbs = DO NOT TOUCH
 */
function checkServiceabilityLock(sedimentLoad: number): Recommendation | null {
  if (sedimentLoad > SEDIMENT_LOCK) {
    return {
      action: 'REPLACE',
      badge: 'UNSERVICEABLE',
      badgeLabel: '🛑 UNSERVICEABLE',
      badgeColor: 'red',
      triggerRule: 'Rule #3: Sediment Threshold',
      script: `Our scan indicates ${sedimentLoad} lbs of rock inside the tank. That sediment is currently plugging the rust holes. If I try to flush it or fix the valve, the vibration will cause a massive leak. It is too fragile to service.`,
      canRepair: false, // DO NOT FLUSH / DO NOT REPAIR
    };
  }
  return null;
}

/**
 * Master Recommendation Engine
 * Evaluates all 3 rules in priority order and returns the appropriate recommendation
 */
export function getRecommendation(
  forensicRisk: number,
  biologicalAge: number,
  sedimentLoad: number = 0,
  estimatedDamage: number = 0,
  locationRiskLevel: LocationRiskLevel = 'garage'
): Recommendation {
  // Priority 1: Serviceability Lock (most critical - safety issue)
  const sedimentRule = checkServiceabilityLock(sedimentLoad);
  if (sedimentRule) return sedimentRule;
  
  // Priority 2: Actuarial Wall (terminal condition)
  const actuarialRule = checkActuarialWall(biologicalAge);
  if (actuarialRule) return actuarialRule;
  
  // Priority 3: Location/Liability Risk
  const locationRule = checkLocationRule(forensicRisk, estimatedDamage, locationRiskLevel);
  if (locationRule) return locationRule;
  
  // Default: MONITOR (safe to wait)
  return {
    action: 'MONITOR',
    badge: 'MONITOR',
    badgeLabel: '🟢 MONITOR',
    badgeColor: 'green',
    triggerRule: 'No triggers met',
    script: 'Your tank is within acceptable risk parameters. Continue annual inspections.',
    canRepair: true,
  };
}

/**
 * Get location risk level from location string
 */
export function getLocationRiskLevel(location: string): LocationRiskLevel {
  const normalized = location.toLowerCase();
  if (normalized.includes('attic') || normalized.includes('2nd') || normalized.includes('second')) {
    return 'attic';
  }
  if (normalized.includes('basement') && !normalized.includes('finished')) {
    return 'basement';
  }
  if (normalized.includes('garage') || normalized.includes('exterior')) {
    return 'garage';
  }
  // Default to main_floor for utility closets, finished basements, etc.
  return 'main_floor';
}
