/**
 * OPTERRA SHARED TYPES & CONSTANTS (v9.2)
 * 
 * This file contains all shared types, interfaces, constants, and helper functions
 * used across the Tank, Tankless, and Hybrid algorithm engines.
 * 
 * Extracted to prevent circular dependencies and enable clean imports.
 */

// --- FUEL TYPE & UNIT CLASSIFICATION ---

export type FuelType = 'GAS' | 'ELECTRIC' | 'HYBRID' | 'TANKLESS_GAS' | 'TANKLESS_ELECTRIC';

/**
 * Classify if a unit is tankless (on-demand) type
 */
export function isTankless(fuelType: FuelType): boolean {
  return fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
}

/**
 * Classify if a unit is hybrid/heat pump type
 */
export function isHybrid(fuelType: FuelType): boolean {
  return fuelType === 'HYBRID';
}

/**
 * Classify if a unit is standard tank type (GAS or ELECTRIC only)
 */
export function isStandardTank(fuelType: FuelType): boolean {
  return fuelType === 'GAS' || fuelType === 'ELECTRIC';
}

// --- STATUS & CONDITION TYPES ---

export type AirFilterStatus = 'CLEAN' | 'DIRTY' | 'CLOGGED';
export type InletFilterStatus = 'CLEAN' | 'DIRTY' | 'CLOGGED';
export type FlameRodStatus = 'GOOD' | 'WORN' | 'FAILING';
export type VentStatus = 'CLEAR' | 'RESTRICTED' | 'BLOCKED';
export type TempSetting = 'LOW' | 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'UPPER_FLOOR' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE' | 'EXTERIOR' | 'CRAWLSPACE';
export type RiskLevel = 1 | 2 | 3 | 4;
export type UsageType = 'light' | 'normal' | 'heavy';
export type VentType = 'ATMOSPHERIC' | 'POWER_VENT' | 'DIRECT_VENT';

// Quality Tier System
export type QualityTier = 'BUILDER' | 'STANDARD' | 'PROFESSIONAL' | 'PREMIUM';

// Expansion Tank Status ("Zombie Tank" Fix)
export type ExpansionTankStatus = 'FUNCTIONAL' | 'WATERLOGGED' | 'MISSING';

// Leak Source Classification ("Leak False Positive" Fix)
export type LeakSource = 'NONE' | 'TANK_BODY' | 'FITTING_VALVE' | 'DRAIN_PAN';

// Connection Type ("Galvanic Blind Spot" Fix)
export type ConnectionType = 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER';

// Room Volume Type ("Hybrid Suffocation" Fix)
export type RoomVolumeType = 'OPEN' | 'CLOSET_LOUVERED' | 'CLOSET_SEALED';

// Physical Trait Types
export type InsulationQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type AnodeType = 'SINGLE' | 'SINGLE_LARGE' | 'DUAL' | 'POWERED';
export type FailureMode = 'CATASTROPHIC' | 'GRADUAL' | 'SLOW_LEAK' | 'CONTROLLED';

// Softener Salt Status
export type SoftenerSaltStatus = 'OK' | 'EMPTY' | 'UNKNOWN';

// Sanitizer Type ("Chloramine Corrosion" Fix)
export type SanitizerType = 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';

// Venting Scenario ("Orphaned Vent Liability" Fix)
export type VentingScenario = 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';

// --- TIER PROFILE INTERFACE ---

export interface TierProfile {
  tier: QualityTier;
  tierLabel: string;
  warrantyYears: number;
  ventType: VentType;
  features: string[];
  // Physical traits for risk assessment
  insulationQuality: InsulationQuality;
  anodeType: AnodeType;
  failureMode: FailureMode;
  expectedLife: number;
  /** @deprecated - kept for backwards compatibility */
  baseCostGas: number;
  /** @deprecated - kept for backwards compatibility */
  baseCostElectric: number;
  /** @deprecated - kept for backwards compatibility */
  baseCostHybrid: number;
}

// --- FORENSIC INPUTS (THE BIG ONE) ---

export interface ForensicInputs {
  calendarAge: number;
  warrantyYears: number;
  housePsi: number;
  
  // Asset identification
  modelNumber?: string;
  manufacturer?: string;
  
  tempSetting: TempSetting;
  location: LocationType;
  isFinishedArea: boolean;
  fuelType: FuelType;
  
  // Hardness Inputs (v7.6 "Digital-First" Split Architecture)
  streetHardnessGPG?: number;
  measuredHardnessGPG?: number;
  hardnessGPG: number;
  
  // Usage Calibration
  peopleCount: number;
  usageType: UsageType;
  tankCapacity: number;
  
  // Venting Type
  ventType?: VentType;
  
  // Equipment Flags
  hasSoftener: boolean;
  softenerSaltStatus?: SoftenerSaltStatus;
  sanitizerType?: SanitizerType;
  hasCircPump: boolean;
  hasExpTank: boolean;
  expTankStatus?: ExpansionTankStatus;
  hasPrv: boolean;
  isClosedLoop: boolean;
  hasDrainPan?: boolean;
  
  // Visual Inspection
  visualRust: boolean;
  isLeaking?: boolean;
  leakSource?: LeakSource;
  
  // Service History
  lastAnodeReplaceYearsAgo?: number;
  lastFlushYearsAgo?: number;
  isAnnuallyMaintained?: boolean;
  yearsWithoutAnode?: number;
  yearsWithoutSoftener?: number;
  
  // Hybrid (Heat Pump) specific fields
  airFilterStatus?: AirFilterStatus;
  isCondensateClear?: boolean;
  compressorHealth?: number;
  
  // Tankless-specific fields
  flowRateGPM?: number;
  ratedFlowGPM?: number;
  lastDescaleYearsAgo?: number;
  igniterHealth?: number;
  flameRodStatus?: FlameRodStatus;
  elementHealth?: number;
  inletFilterStatus?: InletFilterStatus;
  hasRecirculationLoop?: boolean;
  errorCodeCount?: number;
  tanklessVentStatus?: VentStatus;
  scaleBuildup?: number;
  hasIsolationValves?: boolean;
  inletWaterTemp?: number;
  gasLineSize?: '1/2' | '3/4' | '1';
  gasRunLength?: number;
  btuRating?: number;
  
  // Connection Type
  connectionType?: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER';
  nippleMaterial?: 'STEEL' | 'STAINLESS_BRASS' | 'FACTORY_PROTECTED';
  
  // Venting Scenario
  ventingScenario?: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';
  
  // Room Volume for Hybrid
  roomVolumeType?: 'OPEN' | 'CLOSET_LOUVERED' | 'CLOSET_SEALED';
  
  // Anode Count
  anodeCount?: 1 | 2;
  
  // Inspection Photo URLs (v9.4)
  photoUrls?: {
    condition?: string;   // Photo of unit condition (rust, leak evidence)
    dataplate?: string;   // Photo of data plate
    pressure?: string;    // Photo of pressure gauge reading
  };
}

// --- OPTERRA METRICS (OUTPUT) ---

// Anode Status type for percentage-based alerting
export type AnodeStatus = 'protected' | 'inspect' | 'replace' | 'naked';

// NEW v9.3: Burn rate factors for anode depletion transparency
export interface AnodeBurnFactors {
  softener: boolean;     // 3.0x if true
  galvanic: boolean;     // 2.5x if direct copper
  recircPump: boolean;   // 1.25x if true
  chloramine: boolean;   // 1.2x if true
}

export interface OpterraMetrics {
  bioAge: number;
  failProb: number;
  healthScore: number;
  sedimentLbs: number;
  shieldLife: number;
  
  // NEW v9.2: Percentage-based anode metrics (replaces time-based thresholds)
  // These provide more predictable alerting with built-in safety margins
  anodeDepletionPercent: number;  // 0-100 (0 = new rod, 100 = depleted)
  anodeStatus: AnodeStatus;       // Three-stage status: protected/inspect/replace/naked
  anodeMassRemaining: number;     // 0-1 (fraction of original mass)
  
  // NEW v9.3: Burn rate transparency - shows WHY anode depleted faster
  anodeBurnRate: number;          // Combined multiplier (e.g., 3.125)
  anodeBurnFactors: AnodeBurnFactors; // Individual active factors
  
  effectivePsi: number;
  isTransientPressure: boolean;
  
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
    usageIntensity: number;
    undersizing: number;
  };
  riskLevel: RiskLevel;
  
  // Sediment Projection metrics
  sedimentRate: number;
  monthsToFlush: number | null;
  monthsToLockout: number | null;
  flushStatus: 'optimal' | 'advisory' | 'due' | 'critical' | 'lockout';
  
  // Aging Speedometer metrics
  agingRate: number;
  optimizedRate: number;
  yearsLeftCurrent: number;
  yearsLeftOptimized: number;
  lifeExtension: number;
  primaryStressor: string;
  
  // Tankless-specific metrics
  scaleBuildupScore?: number;
  flowDegradation?: number;
  descaleStatus?: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible' | 'run_to_failure';
  
  // Safety Warnings
  bacterialGrowthWarning?: boolean;
  
  // Hybrid Efficiency
  hybridEfficiency?: number;
}

// --- RECOMMENDATION ---

export type ActionType = 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS';
export type RecommendationBadge = 'CRITICAL' | 'REPLACE' | 'SERVICE' | 'MONITOR' | 'OPTIMAL';

export interface Recommendation {
  action: ActionType;
  title: string;
  reason: string;
  urgent: boolean;
  badgeColor: 'red' | 'orange' | 'yellow' | 'blue' | 'green';
  badge?: RecommendationBadge;
  note?: string;
}

// --- PLUMBER HANDSHAKE ---

export interface PlumberHandshake {
  urgency: 'EMERGENCY' | 'PRIORITY' | 'ROUTINE' | 'MONITOR';
  headline: string;
  technicalSummary: string;
  jobComplexity: 'STANDARD' | 'ELEVATED' | 'COMPLEX';
  codeAlerts: string[];
  talkingPoints: string[];
  yearsRemaining: number;
  planningHorizon: 'IMMEDIATE' | 'THIS_YEAR' | '1_TO_3_YEARS' | '3_PLUS_YEARS';
}

// --- FINANCIAL FORECAST (DEPRECATED) ---

export interface FinancialForecast {
  targetReplacementDate: string;
  monthsUntilTarget: number;
  estReplacementCost: number;
  estReplacementCostMin: number;
  estReplacementCostMax: number;
  monthlyBudget: number;
  budgetUrgency: 'LOW' | 'MED' | 'HIGH' | 'IMMEDIATE';
  recommendation: string;
  currentTier: TierProfile;
  likeForLikeCost: number;
  upgradeTier?: TierProfile;
  upgradeCost?: number;
  upgradeValueProp?: string;
}

// --- HARD WATER TAX ---

export interface HardWaterTax {
  hardnessGPG: number;
  hasSoftener: boolean;
  energyLoss: number;
  applianceDepreciation: number;
  detergentOverspend: number;
  plumbingProtection: number;
  totalAnnualLoss: number;
  elementBurnoutRisk?: number;
  softenerAnnualCost: number;
  netAnnualSavings: number;
  paybackYears: number;
  recommendation: 'NONE' | 'CONSIDER' | 'RECOMMEND' | 'PROTECTED';
  reason: string;
  badgeColor: 'green' | 'yellow' | 'orange';
  protectedAmount?: number;
}

// --- OPTERRA RESULT (FINAL OUTPUT) ---

export interface OpterraResult {
  metrics: OpterraMetrics;
  verdict: Recommendation;
  handshake: PlumberHandshake;
  hardWaterTax: HardWaterTax;
  /** @deprecated Use handshake instead */
  financial: FinancialForecast;
}

// --- HELPER FUNCTIONS ---

/**
 * Non-linear conversion from Failure Probability to a 0-100 Health Score.
 */
export function failProbToHealthScore(failProb: number): number {
  const k = 0.04;
  const score = 100 * Math.exp(-k * failProb);
  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate failure probability from biological age using Weibull distribution.
 */
export function bioAgeToFailProb(bioAge: number): number {
  const eta = 11.5;
  const beta = 2.2;
  const statisticalCap = 85.0;
  
  const t = Math.max(0, bioAge);
  const rNow = Math.exp(-Math.pow(t / eta, beta));
  const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
  
  const failProb = (1 - (rNext / rNow)) * 100;
  return Math.min(failProb, statisticalCap);
}

/**
 * HARDNESS RESOLVER v7.6 - "Digital-First" Logic
 */
export interface ResolvedHardness {
  streetHardness: number;
  effectiveHardness: number;
  source: 'MEASURED' | 'INFERRED' | 'API';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function resolveHardness(data: ForensicInputs): ResolvedHardness {
  const streetHardness = data.streetHardnessGPG ?? data.hardnessGPG;
  
  let effectiveHardness = streetHardness;
  let source: ResolvedHardness['source'] = 'API';
  let confidence: ResolvedHardness['confidence'] = 'MEDIUM';
  
  if (data.measuredHardnessGPG !== undefined) {
    effectiveHardness = data.measuredHardnessGPG;
    source = 'MEASURED';
    confidence = 'HIGH';
  } else if (data.hasSoftener) {
    if (data.softenerSaltStatus === 'EMPTY') {
      effectiveHardness = streetHardness;
      source = 'INFERRED';
      confidence = 'MEDIUM';
    } else if (data.softenerSaltStatus === 'OK') {
      effectiveHardness = 0.5;
      source = 'INFERRED';
      confidence = 'MEDIUM';
    } else {
      effectiveHardness = 3.0;
      source = 'INFERRED';
      confidence = 'LOW';
    }
  } else if (data.measuredHardnessGPG !== undefined && data.measuredHardnessGPG <= 1.5) {
    effectiveHardness = data.measuredHardnessGPG;
    source = 'MEASURED';
    confidence = 'HIGH';
  }
  
  return { streetHardness, effectiveHardness, source, confidence };
}

/**
 * Project future health metrics based on current state and aging rate.
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

// --- CONSTANTS ---

export const CONSTANTS = {
  // Weibull Reliability Parameters
  ETA: 13.0,
  BETA: 3.2,
  
  // Physics Baselines
  PSI_SAFE_LIMIT: 80,
  PSI_SCALAR: 20,
  PSI_QUADRATIC_EXP: 2.0,
  PSI_THERMAL_SPIKE: 140,
  
  // Sediment Accumulation
  SEDIMENT_FACTOR_GAS: 0.044,
  SEDIMENT_FACTOR_ELEC: 0.08,
  SEDIMENT_FACTOR_HYBRID: 0.06,
  FLUSH_EFFICIENCY: 0.5,
  FLUSH_EFFICIENCY_HARDITE: 0.05,
  
  // Temperature Multipliers
  TEMP_SEDIMENT_MULTIPLIER_LOW: 0.8,
  TEMP_SEDIMENT_MULTIPLIER_NORMAL: 1.0,
  TEMP_SEDIMENT_MULTIPLIER_HOT: 1.75,
  
  // Limits
  MAX_STRESS_CAP: 12.0,
  MAX_BIO_AGE: 50,
  STATISTICAL_CAP: 85.0,
  VISUAL_CAP: 99.9,
  
  LIMIT_PSI_SAFE: 80,
  LIMIT_PSI_CRITICAL: 100,
  LIMIT_PSI_EXPLOSION: 150,
  
  // Sediment Thresholds
  LIMIT_SEDIMENT_OPTIMAL: 0.5,
  LIMIT_SEDIMENT_ADVISORY: 2.0,
  LIMIT_SEDIMENT_DUE: 5.0,
  LIMIT_SEDIMENT_CRITICAL: 10.0,
  LIMIT_SEDIMENT_LOCKOUT: 10.0,
  LIMIT_SEDIMENT_FLUSH: 2.0,
  LIMIT_AGE_FRAGILE: 10,
  LIMIT_FAILPROB_FRAGILE: 45, // v9.1 Fix: Lowered from 60 to make End of Service Life reachable before age-out
  LIMIT_AGE_MAX: 20,
  
  // Economic Thresholds
  AGE_ECONOMIC_REPAIR_LIMIT: 10,
  AGE_ANODE_LIMIT: 8,
  
  // Risk Levels
  RISK_LOW: 1 as RiskLevel,
  RISK_MED: 2 as RiskLevel,
  RISK_HIGH: 3 as RiskLevel,
  RISK_EXTREME: 4 as RiskLevel,
};

// --- TIER PROFILES ---

export const TIER_PROFILES: Record<QualityTier, TierProfile> = {
  BUILDER: {
    tier: 'BUILDER',
    tierLabel: 'Builder Grade',
    warrantyYears: 6,
    ventType: 'ATMOSPHERIC',
    features: ['Basic glass-lined tank', 'Single anode rod', 'Standard thermostat'],
    insulationQuality: 'LOW',
    anodeType: 'SINGLE',
    failureMode: 'CATASTROPHIC',
    expectedLife: 10,
    baseCostGas: 1400,
    baseCostElectric: 1200,
    baseCostHybrid: 2800,
  },
  STANDARD: {
    tier: 'STANDARD',
    tierLabel: 'Standard',
    warrantyYears: 9,
    ventType: 'ATMOSPHERIC',
    features: ['Premium glass lining', 'Larger anode rod', 'Self-cleaning dip tube'],
    insulationQuality: 'MEDIUM',
    anodeType: 'SINGLE_LARGE',
    failureMode: 'GRADUAL',
    expectedLife: 12,
    baseCostGas: 1900,
    baseCostElectric: 1600,
    baseCostHybrid: 3400,
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    tierLabel: 'Professional',
    warrantyYears: 12,
    ventType: 'ATMOSPHERIC',
    features: ['Dual anode rods', 'High-recovery burner', 'Brass drain valve', 'Commercial-grade thermostat'],
    insulationQuality: 'HIGH',
    anodeType: 'DUAL',
    failureMode: 'SLOW_LEAK',
    expectedLife: 14,
    baseCostGas: 2600,
    baseCostElectric: 2200,
    baseCostHybrid: 4200,
  },
  PREMIUM: {
    tier: 'PREMIUM',
    tierLabel: 'Premium / Lifetime',
    warrantyYears: 15,
    ventType: 'ATMOSPHERIC',
    features: ['Stainless steel tank OR Lifetime warranty', 'Powered anode', 'WiFi monitoring', 'Leak detection'],
    insulationQuality: 'VERY_HIGH',
    anodeType: 'POWERED',
    failureMode: 'CONTROLLED',
    expectedLife: 18,
    baseCostGas: 3500,
    baseCostElectric: 3000,
    baseCostHybrid: 5200,
  },
};

// --- VENT COST ADDERS ---

export const VENT_COST_ADDERS: Record<VentType, number> = {
  ATMOSPHERIC: 0,
  POWER_VENT: 800,
  DIRECT_VENT: 600,
};

export const VENTING_SCENARIO_ADDERS: Record<VentingScenario, number> = {
  SHARED_FLUE: 0,
  ORPHANED_FLUE: 2000,
  DIRECT_VENT: 0,
};

export const CODE_UPGRADE_COSTS = {
  EXPANSION_TANK: 250,
  DRAIN_PAN: 150,
  SEISMIC_STRAPS: 100,
  VACUUM_BREAKER: 75,
};
