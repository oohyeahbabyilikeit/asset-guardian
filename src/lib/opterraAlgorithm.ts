/**
 * OPTERRA v5.0: Physics-Based Risk Calculation Engine
 * 
 * Integrates Basquin's Law (pressure fatigue), Arrhenius Equation (thermal acceleration),
 * and Galvanic Conductivity (softener impact) for scientifically defensible risk assessment.
 */

// ============================================================================
// CONSTANTS
// ============================================================================
const CONSTANTS = {
  // Weibull Parameters (Calibrated for Corrosion Wear-Out)
  ETA: 11.5,              // Characteristic Life (63.2% failure point)
  BETA: 2.2,              // Shape >2.0 = wear-out curve (steeper at end-of-life)

  // Physics Baselines (Basquin's Law)
  DESIGN_PSI: 60,         // Safe working pressure baseline
  FATIGUE_EXP: 4.0,       // Basquin's exponent for corrosion-fatigue
  DANGEROUS_PSI: 110,     // Vessel rupture threshold

  // Sediment
  CRITICAL_SEDIMENT: 15,
  SEDIMENT_GAS: 0.044,    // lbs/year for gas heaters
  SEDIMENT_ELEC: 0.08,    // lbs/year for electric heaters

  // Galvanic Conductivity
  SOFTENER_DECAY: 2.4,    // Anode consumption multiplier (sodium conductivity)
  EXPANSION_BENEFIT: 1.1, // Anode life extension from expansion tank

  // Limits
  MAX_BIO_AGE: 25,        // Cap for sanity
  CRITICAL_PROB: 95.0,    // Cap for visual display
  FATIGUE_AGE: 10,        // Zombie tank threshold

  // Financials (estimated damage by location)
  DAMAGE_ATTIC: 45000,
  DAMAGE_MAIN: 15000,
  DAMAGE_BASEMENT: 3500,
  DAMAGE_GARAGE_FIN: 3000,
  DAMAGE_GARAGE_RAW: 500,
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export type FuelType = 'GAS' | 'ELECTRIC';
export type TempSetting = 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE';

export interface ForensicInputs {
  calendarAge: number;
  psi: number;
  warrantyYears: number;
  fuelType: FuelType;
  hardnessGPG: number;
  hasSoftener: boolean;
  isClosedLoop: boolean;
  hasExpTank: boolean;
  location: LocationType;
  isFinishedArea: boolean;
  visualRust: boolean;
  tempSetting: TempSetting;
}

export type RecommendationAction = 
  | 'REPLACE_URGENT'
  | 'REPLACE_UNSERVICEABLE'
  | 'REPLACE_EXPIRED'
  | 'REPLACE_LIABILITY'
  | 'REPLACE_RISK'
  | 'REPLACE_FATIGUE'
  | 'INSTALL_PRV'
  | 'INSTALL_EXP_TANK'
  | 'MONITOR';

export type RecommendationBadge =
  | 'CONTAINMENT_BREACH'
  | 'SAFETY_HAZARD'
  | 'STRUCTURAL_FATIGUE'
  | 'SEDIMENT_LOCKOUT'
  | 'ACTUARIAL_EXPIRY'
  | 'LIABILITY_RISK'
  | 'STATISTICAL_FAILURE'
  | 'WARRANTY_VOID'
  | 'CODE_VIOLATION'
  | 'PASS';

export interface Recommendation {
  action: RecommendationAction;
  badge: RecommendationBadge;
  badgeLabel: string;
  badgeColor: 'red' | 'orange' | 'yellow' | 'green';
  triggerRule: string;
  script: string;
  canRepair: boolean;
  isPriorityLead: boolean;
}

export interface OpterraMetrics {
  bioAge: number;
  rawBioAge: number;
  bioAgeCapped: boolean;
  failProb: number;
  sedimentLbs: number;
  estDamage: number;
  shieldLife: number;
  stress: number;
  // v5.0: Physics breakdown
  pressureStress: number;
  tempStress: number;
  loopPenalty: number;
}

export interface OpterraResult {
  metrics: OpterraMetrics;
  verdict: Recommendation;
}

// Legacy compatibility types
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

export interface BaselineRisk {
  ageRange: string;
  minAge: number;
  maxAge: number;
  failureProb: number;
  status: 'safe' | 'moderate' | 'warning' | 'critical';
}

// Recalculated with BETA=2.2 Weibull distribution
export const industryBaseline: BaselineRisk[] = [
  { ageRange: '0-6 Years', minAge: 0, maxAge: 6, failureProb: 2.8, status: 'safe' },
  { ageRange: '7-9 Years', minAge: 7, maxAge: 9, failureProb: 11.2, status: 'moderate' },
  { ageRange: '10-12 Years', minAge: 10, maxAge: 12, failureProb: 18.5, status: 'warning' },
  { ageRange: '13+ Years', minAge: 13, maxAge: 99, failureProb: 32.0, status: 'critical' },
];

// ============================================================================
// MASTER CALCULATION FUNCTION
// ============================================================================
export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  // Ensure numeric types (defense against string coercion)
  const calendarAge = Number(data.calendarAge);
  const psi = Number(data.psi);
  const warrantyYears = Number(data.warrantyYears);
  const hardnessGPG = Number(data.hardnessGPG);

  // --- 1. SHIELD CALCULATION (ANODE LIFE) ---
  // Softened water has higher conductivity, draining the anode faster (galvanic decay)
  const anodeDecayRate = data.hasSoftener ? CONSTANTS.SOFTENER_DECAY : 1.0;
  // Expansion tank reduces pressure spikes, preserving anode coating
  const expansionFactor = data.hasExpTank ? CONSTANTS.EXPANSION_BENEFIT : 1.0;
  const shieldLife = (warrantyYears * expansionFactor) / anodeDecayRate;

  // --- 2. STRESS FACTORS (Physics Multipliers) ---
  
  // A. Pressure Stress (Basquin's Power Law)
  // Continuous curve: 60 PSI = 1.0x, 80 PSI = 3.16x, 100 PSI = 7.72x, 140 PSI = 29.6x
  const effectivePsi = Math.max(psi, CONSTANTS.DESIGN_PSI);
  const pressureStress = Math.pow(effectivePsi / CONSTANTS.DESIGN_PSI, CONSTANTS.FATIGUE_EXP);

  // B. Thermal Stress (Arrhenius Approximation)
  // HOT (140F+) doubles corrosion rate vs NORMAL (120F)
  const tempStress = data.tempSetting === 'HOT' ? 2.0 : 1.0;

  // C. Environmental Stress (Closed Loop)
  // Thermal hammer effect without expansion tank = 50% stress increase
  const loopPenalty = (data.isClosedLoop && !data.hasExpTank) ? 1.5 : 1.0;

  // Total Combined Stress (Multiplicative, not additive)
  const totalStress = pressureStress * tempStress * loopPenalty;

  // --- 3. BIOLOGICAL AGE (TWO-PHASE CLOCK) ---
  
  // Phase 1: Protected Time (Anode working)
  // Steel largely spared, but stress causes some fatigue to welds/glass lining (weighted at 0.2)
  const timeProtected = Math.min(calendarAge, shieldLife);
  const protectedAging = timeProtected * (1 + (totalStress * 0.2));

  // Phase 2: Naked Time (Anode Depleted)
  // Steel takes full force of stress
  const timeNaked = Math.max(0, calendarAge - shieldLife);
  const nakedAging = timeNaked * totalStress;

  const rawBioAge = protectedAging + nakedAging;
  const bioAge = Math.min(rawBioAge, CONSTANTS.MAX_BIO_AGE);
  const bioAgeCapped = rawBioAge > CONSTANTS.MAX_BIO_AGE;

  // --- 4. WEIBULL HAZARD FUNCTION ---
  // Calculate probability of failure in the NEXT 12 months (Conditional Reliability)
  // P(Failure) = 1 - (Reliability_Next_Year / Reliability_Now)
  
  const t = bioAge;
  const eta = CONSTANTS.ETA;
  const beta = CONSTANTS.BETA;

  // Weibull Reliability Function: R(t) = e^(-(t/eta)^beta)
  const rNow = Math.exp(-Math.pow(t / eta, beta));
  const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
  let failProb = (1 - (rNext / rNow)) * 100;

  // Visual evidence trumps math
  if (data.visualRust) {
    failProb = 99.9;
  }

  // Cap to avoid unrealistic percentages
  failProb = Math.min(failProb, CONSTANTS.CRITICAL_PROB);

  // --- 5. SEDIMENT LOAD ---
  const k = data.fuelType === 'GAS' ? CONSTANTS.SEDIMENT_GAS : CONSTANTS.SEDIMENT_ELEC;
  const sedimentLbs = calendarAge * hardnessGPG * k;

  // --- 6. DAMAGE ESTIMATION ---
  let estDamage = 3500; // Default
  if (data.location === 'ATTIC') estDamage = CONSTANTS.DAMAGE_ATTIC;
  if (data.location === 'MAIN_LIVING') estDamage = CONSTANTS.DAMAGE_MAIN;
  if (data.location === 'BASEMENT') estDamage = CONSTANTS.DAMAGE_BASEMENT;
  if (data.location === 'GARAGE') {
    estDamage = data.isFinishedArea ? CONSTANTS.DAMAGE_GARAGE_FIN : CONSTANTS.DAMAGE_GARAGE_RAW;
  }

  // --- 7. RECOMMENDATION ENGINE (BUSINESS RULES) ---
  const verdict = getRecommendationFromMetrics(
    data.visualRust,
    sedimentLbs,
    bioAge,
    estDamage,
    failProb,
    psi,
    calendarAge,
    data.isClosedLoop,
    data.hasExpTank
  );

  return {
    metrics: {
      bioAge: Math.round(bioAge * 10) / 10,
      rawBioAge: Math.round(rawBioAge * 10) / 10,
      bioAgeCapped,
      failProb: Math.round(failProb * 10) / 10,
      sedimentLbs: Math.round(sedimentLbs * 10) / 10,
      estDamage,
      shieldLife: Math.round(shieldLife * 10) / 10,
      stress: Math.round(totalStress * 100) / 100,
      pressureStress: Math.round(pressureStress * 100) / 100,
      tempStress,
      loopPenalty,
    },
    verdict,
  };
}

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================
function getRecommendationFromMetrics(
  visualRust: boolean,
  sedimentLbs: number,
  bioAge: number,
  estDamage: number,
  failProb: number,
  psi: number,
  calendarAge: number,
  isClosedLoop: boolean,
  hasExpTank: boolean
): Recommendation {
  // Rule 1: Active Leak (Highest Priority)
  if (visualRust) {
    return {
      action: 'REPLACE_URGENT',
      badge: 'CONTAINMENT_BREACH',
      badgeLabel: '🆘 CONTAINMENT BREACH',
      badgeColor: 'red',
      triggerRule: 'Rule #1: Active Leak Detected',
      script: 'Visible corrosion or leak detected. Immediate containment required to prevent water damage.',
      canRepair: false,
      isPriorityLead: true,
    };
  }

  // Rule 2: Safety Hazard (Dangerous Pressure)
  if (psi >= CONSTANTS.DANGEROUS_PSI) {
    return {
      action: 'REPLACE_URGENT',
      badge: 'SAFETY_HAZARD',
      badgeLabel: '🛑 DANGEROUS PRESSURE',
      badgeColor: 'red',
      triggerRule: 'Rule #2: Extreme Pressure Hazard',
      script: `Pressure is ${psi} PSI (Safe limit: 80). Vessel rupture risk is immediate. Do NOT attempt PRV install.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 3: Unserviceable (Too much sediment)
  if (sedimentLbs > CONSTANTS.CRITICAL_SEDIMENT) {
    return {
      action: 'REPLACE_UNSERVICEABLE',
      badge: 'SEDIMENT_LOCKOUT',
      badgeLabel: '🛑 SEDIMENT LOCKOUT',
      badgeColor: 'red',
      triggerRule: 'Rule #3: Sediment Threshold Exceeded',
      script: `Sediment load: ${sedimentLbs.toFixed(1)} lbs. Exceeds 15 lb serviceability limit. Flushing or repairs may cause immediate failure.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 4: Biological Age Limit (Actuarial Expiry)
  if (bioAge >= CONSTANTS.MAX_BIO_AGE) {
    return {
      action: 'REPLACE_EXPIRED',
      badge: 'ACTUARIAL_EXPIRY',
      badgeLabel: '🔴 ACTUARIAL EXPIRY',
      badgeColor: 'red',
      triggerRule: 'Rule #4: Biological Age Limit',
      script: `Biological age: ${bioAge.toFixed(1)} years. Exceeds ${CONSTANTS.MAX_BIO_AGE}-year actuarial limit. Terminal metal fatigue expected.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 5: Liability Risk (Location-Adjusted Thresholds)
  if (estDamage > 40000 && failProb > 12.0) {
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #5: Extreme Location Risk',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 12% threshold for extreme-risk locations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  if (estDamage > 15000 && failProb > 12.0) {
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #5: High Location Risk',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 12% threshold for high-risk locations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  if (estDamage > 5000 && failProb > 15.0) {
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #5: Location Risk Threshold',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 15% threshold for high-value installations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 6: High Failure Probability
  if (failProb > 40.0) {
    return {
      action: 'REPLACE_RISK',
      badge: 'STATISTICAL_FAILURE',
      badgeLabel: '🔴 STATISTICAL FAILURE',
      badgeColor: 'red',
      triggerRule: 'Rule #6: Statistical Risk Threshold',
      script: `Failure probability: ${failProb.toFixed(1)}%. Exceeds 40% actuarial threshold for replacement recommendation.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 7: Zombie Tank (Old + High Pressure)
  if (psi > 80 && calendarAge >= CONSTANTS.FATIGUE_AGE) {
    return {
      action: 'REPLACE_FATIGUE',
      badge: 'STRUCTURAL_FATIGUE',
      badgeLabel: '🔴 STRUCTURAL FATIGUE',
      badgeColor: 'red',
      triggerRule: 'Rule #7: Metal Fatigue (Zombie Tank)',
      script: `Tank has endured ${calendarAge} years at elevated pressure. Metal fatigue has compromised vessel integrity. PRV cannot reverse existing damage.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 8: High Pressure (Young Tank - Rescuable)
  if (psi > 80) {
    return {
      action: 'INSTALL_PRV',
      badge: 'WARRANTY_VOID',
      badgeLabel: '🔧 WARRANTY VOID',
      badgeColor: 'orange',
      triggerRule: 'Rule #8: Pressure Warranty Violation',
      script: `Static pressure: ${psi} PSI. Exceeds 80 PSI manufacturer limit. Warranty voided. PRV installation recommended.`,
      canRepair: true,
      isPriorityLead: true,
    };
  }

  // Rule 9: Code Violation (Expansion Tank)
  if (isClosedLoop && !hasExpTank) {
    return {
      action: 'INSTALL_EXP_TANK',
      badge: 'CODE_VIOLATION',
      badgeLabel: '⚠️ MISSING EXP TANK',
      badgeColor: 'orange',
      triggerRule: 'Rule #9: Code Violation',
      script: 'Closed loop system detected without thermal expansion control. Required by plumbing code. Easy $450 fix.',
      canRepair: true,
      isPriorityLead: true,
    };
  }

  // Default: MONITOR (safe to wait)
  return {
    action: 'MONITOR',
    badge: 'PASS',
    badgeLabel: '✅ SYSTEM HEALTHY',
    badgeColor: 'green',
    triggerRule: 'No triggers met',
    script: 'All parameters within acceptable range. Continue annual inspections.',
    canRepair: true,
    isPriorityLead: false,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

export function calculateRiskDilation(
  paperAge: number,
  forensics: {
    pressure?: number;
    psi?: number;
    baselinePressure?: number;
    hasSoftener: boolean;
    hasExpansionTank?: boolean;
    hasExpTank?: boolean;
    anodeCondition?: 'good' | 'depleted' | 'missing';
    visualRust?: boolean;
    sedimentLoad?: number;
    estimatedDamage?: number;
    locationRiskLevel?: string;
    calendarAge?: number;
    warrantyYears?: number;
    fuelType?: FuelType;
    hardnessGPG?: number;
    isClosedLoop?: boolean;
    tempSetting?: TempSetting;
    location?: LocationType;
    isFinishedArea?: boolean;
  }
): RiskDilationResult {
  const v5Input: ForensicInputs = {
    calendarAge: forensics.calendarAge ?? paperAge,
    psi: forensics.psi ?? forensics.pressure ?? 60,
    warrantyYears: forensics.warrantyYears ?? 6,
    fuelType: forensics.fuelType ?? 'GAS',
    hardnessGPG: forensics.hardnessGPG ?? 10,
    hasSoftener: forensics.hasSoftener,
    isClosedLoop: forensics.isClosedLoop ?? false,
    hasExpTank: forensics.hasExpTank ?? forensics.hasExpansionTank ?? true,
    location: forensics.location ?? mapLocationRiskLevel(forensics.locationRiskLevel),
    isFinishedArea: forensics.isFinishedArea ?? false,
    visualRust: forensics.visualRust ?? false,
    tempSetting: forensics.tempSetting ?? 'NORMAL',
  };

  const result = calculateOpterraRisk(v5Input);
  
  const baselineData = getBaselineRisk(paperAge);
  const accelerationFactor = result.metrics.failProb / Math.max(baselineData.failureProb, 0.1);
  
  const exposureYears = Math.max(0, paperAge - result.metrics.shieldLife);
  const protectedYears = Math.min(paperAge, result.metrics.shieldLife);
  
  return {
    paperAge,
    biologicalAge: result.metrics.bioAge,
    baselineRisk: baselineData.failureProb,
    forensicRisk: result.metrics.failProb,
    accelerationFactor: Math.round(accelerationFactor * 10) / 10,
    stressFactor: result.metrics.stress,
    defenseFactor: v5Input.hasSoftener ? 0.42 : 1.0,
    anodeLifespan: result.metrics.shieldLife,
    exposureYears: Math.round(exposureYears * 10) / 10,
    protectedYears: Math.round(protectedYears * 10) / 10,
    nakedAgingRate: result.metrics.stress,
    status: getStatusFromRisk(result.metrics.failProb),
    insight: generateInsight(paperAge, result.metrics.bioAge, exposureYears, v5Input),
  };
}

function mapLocationRiskLevel(level?: string): LocationType {
  if (!level) return 'GARAGE';
  const normalized = level.toLowerCase();
  if (normalized.includes('attic')) return 'ATTIC';
  if (normalized.includes('main')) return 'MAIN_LIVING';
  if (normalized.includes('basement')) return 'BASEMENT';
  return 'GARAGE';
}

export function getRecommendation(
  forensicRisk: number,
  biologicalAge: number,
  sedimentLoad: number = 0,
  estimatedDamage: number = 0,
  locationRiskLevel: string = 'garage'
): Recommendation {
  return getRecommendationFromMetrics(
    false,
    sedimentLoad,
    biologicalAge,
    estimatedDamage,
    forensicRisk,
    60,
    biologicalAge,
    false,
    true
  );
}

export function getLocationRiskLevel(location: string): string {
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
  return 'main_floor';
}

export function getBaselineRisk(paperAge: number): BaselineRisk {
  return industryBaseline.find(
    b => paperAge >= b.minAge && paperAge <= b.maxAge
  ) || industryBaseline[3];
}

export function getStatusFromRisk(risk: number): 'safe' | 'moderate' | 'warning' | 'critical' {
  if (risk < 10) return 'safe';
  if (risk < 20) return 'moderate';
  if (risk < 40) return 'warning';
  return 'critical';
}

function generateInsight(
  paperAge: number,
  biologicalAge: number,
  exposureYears: number,
  forensics: ForensicInputs
): string {
  if (exposureYears <= 0) {
    return `Tank age: ${paperAge} years. Corrosion protection active. Standard risk applies.`;
  }
  
  const baselineRisk = getBaselineRisk(paperAge).failureProb;
  const result = calculateOpterraRisk(forensics);
  const riskRatio = Math.round(result.metrics.failProb / baselineRisk);
  
  return `Standard ${paperAge}-year risk: ${baselineRisk.toFixed(1)}%. Adjusted risk: ${result.metrics.failProb.toFixed(1)}% (${riskRatio}x baseline). Protection depleted ${exposureYears.toFixed(1)} years ago.`;
}
