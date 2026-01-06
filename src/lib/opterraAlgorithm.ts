// Opterra v3.0 Physics-Based Risk Calculation Engine
// Recalibrated with "Shield vs. Body" Logic
// Based on DOE (LBNL) & InterNACHI Actuarial Tables

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
