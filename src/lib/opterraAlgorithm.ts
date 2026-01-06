// Opterra v3.0 Physics-Based Risk Calculation Engine
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
}

export interface RiskDilationResult {
  paperAge: number;
  biologicalAge: number;
  baselineRisk: number;
  forensicRisk: number;
  accelerationFactor: number;
  stressFactor: number;
  defenseFactor: number;
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

/**
 * Step A: Calculate Stress Factor using Basquin's Law (Cubic Stress Curve)
 * Higher pressure = exponentially more stress on glass lining
 */
export function calculateStressFactor(currentPSI: number, baselinePSI: number = 60): number {
  return Math.pow(currentPSI / baselinePSI, 3);
}

/**
 * Step B: Calculate Defense Factor (Anode Effectiveness)
 * Softener increases water conductivity 2.4x, reducing anode life
 * Depleted/missing anode provides less protection
 */
export function calculateDefenseFactor(
  hasSoftener: boolean, 
  anodeCondition: 'good' | 'depleted' | 'missing'
): number {
  const softenerFactor = hasSoftener ? 0.42 : 1.0;
  const anodeFactor = anodeCondition === 'good' ? 1.0 : 
                      anodeCondition === 'depleted' ? 0.6 : 0.2;
  return softenerFactor * anodeFactor;
}

/**
 * Step C: Calculate Biological Age (Time Dilation)
 * Bio Age = Paper Age × (Stress / Defense)
 */
export function calculateBiologicalAge(
  paperAge: number, 
  stressFactor: number, 
  defenseFactor: number
): number {
  return paperAge * (stressFactor / defenseFactor);
}

/**
 * Step D: Calculate Failure Probability using Weibull Distribution
 * Standard life expectancy for water heaters is 11.5 years
 */
export function calculateWeibullProbability(
  biologicalAge: number, 
  lifeExpectancy: number = 11.5,
  shape: number = 2.5
): number {
  const probability = 1 - Math.exp(-Math.pow(biologicalAge / lifeExpectancy, shape));
  return Math.min(99.9, probability * 100);
}

/**
 * Get baseline risk for a given calendar age
 */
export function getBaselineRisk(paperAge: number): BaselineRisk {
  return industryBaseline.find(
    b => paperAge >= b.minAge && paperAge <= b.maxAge
  ) || industryBaseline[3]; // Default to critical for very old units
}

/**
 * Determine status based on forensic risk percentage
 */
export function getStatusFromRisk(risk: number): 'safe' | 'moderate' | 'warning' | 'critical' {
  if (risk < 10) return 'safe';
  if (risk < 25) return 'moderate';
  if (risk < 50) return 'warning';
  return 'critical';
}

/**
 * Master function: Calculate complete risk dilation analysis
 */
export function calculateRiskDilation(
  paperAge: number,
  forensics: ForensicInputs
): RiskDilationResult {
  // Step A: Calculate stress from pressure
  const stressFactor = calculateStressFactor(forensics.pressure, forensics.baselinePressure);
  
  // Step B: Calculate defense from anode condition
  const defenseFactor = calculateDefenseFactor(forensics.hasSoftener, forensics.anodeCondition);
  
  // Step C: Calculate biological age
  const biologicalAge = calculateBiologicalAge(paperAge, stressFactor, defenseFactor);
  
  // Step D: Calculate forensic risk using Weibull
  const forensicRisk = calculateWeibullProbability(biologicalAge);
  
  // Get baseline risk for comparison
  const baselineData = getBaselineRisk(paperAge);
  const baselineRisk = baselineData.failureProb;
  
  // Calculate acceleration factor
  const accelerationFactor = stressFactor / defenseFactor;
  
  // Determine status
  const status = getStatusFromRisk(forensicRisk);
  
  // Generate insight text
  const insight = generateInsight(paperAge, biologicalAge, accelerationFactor, forensics);
  
  return {
    paperAge,
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    baselineRisk,
    forensicRisk: Math.round(forensicRisk * 10) / 10,
    accelerationFactor: Math.round(accelerationFactor * 10) / 10,
    stressFactor: Math.round(stressFactor * 100) / 100,
    defenseFactor: Math.round(defenseFactor * 100) / 100,
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
  accelerationFactor: number,
  forensics: ForensicInputs
): string {
  const factors: string[] = [];
  
  if (forensics.hasSoftener) {
    factors.push('Water Softener (which eats protection)');
  }
  
  if (forensics.pressure > 70) {
    factors.push('Elevated Pressure (which cracks glass)');
  }
  
  if (forensics.anodeCondition !== 'good') {
    factors.push(`${forensics.anodeCondition === 'depleted' ? 'Depleted' : 'Missing'} Anode Rod`);
  }
  
  const factorText = factors.length > 0 
    ? `Because you have ${factors.join(' and ')}, your` 
    : 'Your';
  
  return `On paper your tank is ${paperAge} years old. ${factorText} tank has aged ${accelerationFactor.toFixed(1)} years for every 1 year it has been installed. Physically, it is ${Math.round(biologicalAge)} years old.`;
}
