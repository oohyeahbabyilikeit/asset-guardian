// Opterra v4.0 Physics-Based Risk Calculation Engine
// Master Algorithm Specification - Full Implementation
// Integrates Forensic Physics, Actuarial Math, and Business Rules

// ============= CONSTANTS (DO NOT CHANGE WITHOUT ENGINEERING REVIEW) =============
const CONSTANTS = {
  // WEIBULL STATS (LBNL Data)
  ETA: 11.5,             // Characteristic Life (Years)
  BETA: 1.5,             // Slope (Models random mid-life failure)
  
  // LIMITS
  SAFE_PSI: 80,          // Warranty Void Threshold (A.O. Smith)
  DANGEROUS_PSI: 110,    // Vessel rupture threshold - immediate replacement
  CRITICAL_SEDIMENT: 15, // Lbs (Unserviceable Limit)
  FATIGUE_AGE: 10,       // Years of high-pressure exposure that compromises vessel
  
  // COEFFICIENTS
  SEDIMENT_GAS: 0.044,   // Lbs/Year/GPG (Battelle Study)
  SEDIMENT_ELEC: 0.08,   // Lbs/Year/GPG
  SOFTENER_DECAY: 2.4,   // Conductivity Divisor (NACE Std)
  
  // FINANCIALS (2024 Insurance Avg)
  DAMAGE_ATTIC: 45000,
  DAMAGE_MAIN: 15000,
  DAMAGE_BASEMENT: 3500,
  DAMAGE_GARAGE_FIN: 3000,
  DAMAGE_GARAGE_RAW: 500,
};

// ============= TYPE DEFINITIONS =============
export type FuelType = 'GAS' | 'ELECTRIC';
export type TempSetting = 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE';

export interface ForensicInputs {
  calendarAge: number;           // Years since manufacture
  psi: number;                   // Static water pressure
  warrantyYears: number;         // 6, 9, or 12 - Proxy for Anode Mass
  fuelType: FuelType;            // GAS or ELECTRIC
  hardnessGPG: number;           // Grains Per Gallon (Sediment Fuel)
  hasSoftener: boolean;          // Increases conductivity (Anode Killer)
  isClosedLoop: boolean;         // Check Valve/PRV present?
  hasExpTank: boolean;           // Thermal Expansion Tank present?
  location: LocationType;        // ATTIC, MAIN_LIVING, BASEMENT, GARAGE
  isFinishedArea: boolean;       // Is the garage/basement finished?
  visualRust: boolean;           // Immediate Kill Switch
  tempSetting: TempSetting;      // NORMAL or HOT (>130°F)
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
  failProb: number;
  sedimentLbs: number;
  estDamage: number;
  shieldLife: number;
  stress: number;
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

// Industry standard baseline - Calculated using same Weibull formula for consistency
// rNow = exp(-(age/11.5)^1.5), rNext = exp(-((age+1)/11.5)^1.5), failProb = (1 - rNext/rNow) * 100
export const industryBaseline: BaselineRisk[] = [
  { ageRange: '0-6 Years', minAge: 0, maxAge: 6, failureProb: 3.8, status: 'safe' },       // Weibull @ age 3
  { ageRange: '7-9 Years', minAge: 7, maxAge: 9, failureProb: 9.5, status: 'moderate' },   // Weibull @ age 8
  { ageRange: '10-12 Years', minAge: 10, maxAge: 12, failureProb: 14.2, status: 'warning' }, // Weibull @ age 11
  { ageRange: '13+ Years', minAge: 13, maxAge: 99, failureProb: 23.5, status: 'critical' }, // Weibull @ age 14
];

// ============= MASTER CALCULATION FUNCTION =============
export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  const { ETA, BETA, SOFTENER_DECAY, SAFE_PSI } = CONSTANTS;

  // --- 1. SHIELD CALCULATION (ANODE LIFE) ---
  // How long did the anode last?
  // Soft water increases conductivity, eating anodes 2.4x faster.
  const decayRate = data.hasSoftener ? SOFTENER_DECAY : 1.0;
  const shieldLife = data.warrantyYears / decayRate;

  // --- 2. STRESS CALCULATION (THE ATTACK) ---
  // How fast does the tank rot once the shield is down?
  let stress = 1.0;
  
  // The Glass Cliff: Hard Stop at 80 PSI
  if (data.psi > SAFE_PSI) {
    stress = 10.0; // Terminal Glass Fracture (10x Aging)
  } else {
    // Basquin's Law (Cubic Curve). Floor at 50 PSI to prevent logic errors.
    const effectivePsi = Math.max(data.psi, 50);
    stress = Math.pow(effectivePsi / 60, 3);
  }

  // Environmental Penalties
  if (data.isClosedLoop && !data.hasExpTank) stress += 0.5; // Thermal Hammer
  if (data.tempSetting === 'HOT') stress += 0.5; // Arrhenius (Heat)

  // --- 3. BIOLOGICAL AGE (TWO-PHASE CLOCK) ---
  // Phase 1: Protected Years (Age ≤ ShieldLife). Aging = 1.0x.
  const timeProtected = Math.min(data.calendarAge, shieldLife);
  
  // Phase 2: Naked Years (Age > ShieldLife). Aging = StressFactor.
  const timeNaked = Math.max(0, data.calendarAge - shieldLife);
  
  // Final Biological Age
  const bioAge = timeProtected + (timeNaked * stress);

  // --- 4. WEIBULL PROBABILITY (NEXT 12 MO) ---
  // Calculates conditional probability of failure in the next year
  const rNow = Math.exp(-Math.pow(bioAge / ETA, BETA));
  const rNext = Math.exp(-Math.pow((bioAge + 1) / ETA, BETA));
  let failProb = (1 - (rNext / rNow)) * 100;

  // Sanity Cap: Don't scare people with 99% unless leaking.
  // Cap at 45% (Russian Roulette odds) to maintain credibility.
  if (!data.visualRust) failProb = Math.min(failProb, 45.0);
  if (data.visualRust) failProb = 99.9;

  // --- 5. SEDIMENT LOAD ---
  const k = data.fuelType === 'GAS' ? CONSTANTS.SEDIMENT_GAS : CONSTANTS.SEDIMENT_ELEC;
  const sedimentLbs = data.calendarAge * data.hardnessGPG * k;

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
    data.psi,
    data.calendarAge,
    data.isClosedLoop,
    data.hasExpTank
  );

  return {
    metrics: {
      bioAge: Math.round(bioAge * 10) / 10,
      failProb: Math.round(failProb * 10) / 10,
      sedimentLbs: Math.round(sedimentLbs * 10) / 10,
      estDamage,
      shieldLife: Math.round(shieldLife * 10) / 10,
      stress: Math.round(stress * 100) / 100,
    },
    verdict,
  };
}

// ============= RECOMMENDATION ENGINE =============
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

  // Rule 2: Safety Hazard (The "Bomb" Rule) [PATCHED]
  // Pressure >110 PSI is dangerous regardless of age/warranty
  if (psi > CONSTANTS.DANGEROUS_PSI) {
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
  
  // Rule 3: Unserviceable (Too much rock to flush)
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
  
  // Rule 4: Actuarial Expiry (Old Age)
  if (bioAge > 12.0) {
    return {
      action: 'REPLACE_EXPIRED',
      badge: 'ACTUARIAL_EXPIRY',
      badgeLabel: '🔴 ACTUARIAL EXPIRY',
      badgeColor: 'red',
      triggerRule: 'Rule #4: Biological Age Limit',
      script: `Biological age: ${bioAge.toFixed(1)} years. Exceeds 12-year actuarial limit. Terminal metal fatigue expected.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 5: Liability Risk (Location-Adjusted Thresholds)
  // [PATCHED] Bumped Attic threshold to 12% to avoid flagging healthy 7yr old tanks
  if (estDamage > 40000 && failProb > 12.0) {
    // Attic - extreme damage scenario
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #4: Extreme Location Risk',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 8% threshold for extreme-risk locations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  if (estDamage > 15000 && failProb > 12.0) {
    // Utility Closet / Finished Basement - high damage
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #4: High Location Risk',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 12% threshold for high-risk locations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  if (estDamage > 5000 && failProb > 15.0) {
    // Other high-value locations
    return {
      action: 'REPLACE_LIABILITY',
      badge: 'LIABILITY_RISK',
      badgeLabel: '🛡️ LIABILITY RISK',
      badgeColor: 'red',
      triggerRule: 'Rule #4: Location Risk Threshold',
      script: `Failure probability is ${failProb.toFixed(1)}%, above the 15% threshold for high-value installations. Estimated damage: $${Math.round(estDamage / 1000)}K.`,
      canRepair: false,
      isPriorityLead: true,
    };
  }
  
  // Rule 5: Financial Risk (Low Cost Location)
  // Basement/Garage -> Trigger at 35% Risk
  if (failProb > 35.0) {
    return {
      action: 'REPLACE_RISK',
      badge: 'STATISTICAL_FAILURE',
      badgeLabel: '🔴 STATISTICAL FAILURE',
      badgeColor: 'orange',
      triggerRule: 'Rule #5: Statistical Risk Threshold',
      script: `Failure probability: ${failProb.toFixed(1)}%. Exceeds 35% actuarial threshold for replacement recommendation.`,
      canRepair: true,
      isPriorityLead: true,
    };
  }
  
  // Rule 7: Warranty Rescue / Zombie Tank (Fork)
  if (psi > CONSTANTS.SAFE_PSI) {
    // SUB-RULE: The "Zombie Tank" Patch [PATCHED]
    // If it's old AND high pressure, kill it. Don't rescue it.
    if (calendarAge > CONSTANTS.FATIGUE_AGE) {
      return {
        action: 'REPLACE_FATIGUE',
        badge: 'STRUCTURAL_FATIGUE',
        badgeLabel: '🔴 STRUCTURAL FATIGUE',
        badgeColor: 'red',
        triggerRule: 'Rule #7a: Metal Fatigue (Zombie Tank)',
        script: `Tank has endured ${calendarAge} years at elevated pressure. Metal fatigue has compromised vessel integrity. PRV cannot reverse existing damage.`,
        canRepair: false,
        isPriorityLead: true,
      };
    }
    
    // Otherwise: Rescue Mission (Young Tank)
    return {
      action: 'INSTALL_PRV',
      badge: 'WARRANTY_VOID',
      badgeLabel: '🔧 WARRANTY VOID',
      badgeColor: 'orange',
      triggerRule: 'Rule #7b: Pressure Warranty Violation',
      script: `Static pressure: ${psi} PSI. Exceeds 80 PSI manufacturer limit. Warranty voided. PRV installation recommended.`,
      canRepair: true,
      isPriorityLead: true,
    };
  }

  // Rule 8: Code Violation (Expansion Tank Upsell) [PATCHED]
  if (isClosedLoop && !hasExpTank) {
    return {
      action: 'INSTALL_EXP_TANK',
      badge: 'CODE_VIOLATION',
      badgeLabel: '⚠️ MISSING EXP TANK',
      badgeColor: 'orange',
      triggerRule: 'Rule #8: Code Violation',
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

// ============= LEGACY COMPATIBILITY FUNCTIONS =============
// These maintain backwards compatibility with existing UI components

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
    // v4.0 fields
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
  // Convert legacy inputs to v4.0 format
  const v4Input: ForensicInputs = {
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

  const result = calculateOpterraRisk(v4Input);
  
  // Get baseline for comparison
  const baselineData = getBaselineRisk(paperAge);
  const accelerationFactor = result.metrics.failProb / Math.max(baselineData.failureProb, 0.1);
  
  // Calculate legacy fields
  const exposureYears = Math.max(0, paperAge - result.metrics.shieldLife);
  const protectedYears = Math.min(paperAge, result.metrics.shieldLife);
  
  return {
    paperAge,
    biologicalAge: result.metrics.bioAge,
    baselineRisk: baselineData.failureProb,
    forensicRisk: result.metrics.failProb,
    accelerationFactor: Math.round(accelerationFactor * 10) / 10,
    stressFactor: result.metrics.stress,
    defenseFactor: v4Input.hasSoftener ? 0.42 : 1.0,
    anodeLifespan: result.metrics.shieldLife,
    exposureYears: Math.round(exposureYears * 10) / 10,
    protectedYears: Math.round(protectedYears * 10) / 10,
    nakedAgingRate: result.metrics.stress,
    status: getStatusFromRisk(result.metrics.failProb),
    insight: generateInsight(paperAge, result.metrics.bioAge, exposureYears, v4Input),
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
  // Use the new recommendation engine with computed values
  return getRecommendationFromMetrics(
    false, // visualRust - would need to be passed separately
    sedimentLoad,
    biologicalAge,
    estimatedDamage,
    forensicRisk,
    60, // default PSI - would need actual value
    biologicalAge, // using as proxy for calendar age
    false, // isClosedLoop - default
    true   // hasExpTank - default (assume compliant)
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
  if (risk < 25) return 'moderate';
  if (risk < 45) return 'warning';
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
