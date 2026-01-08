/**
 * OPTERRA v6.9 Risk Calculation Engine
 * 
 * A physics-based reliability algorithm with economic optimization logic.
 * 
 * CHANGES v6.9:
 * - USAGE CALIBRATION: peopleCount and usageType now affect ALL calculations:
 *   - Anode rod depletion accelerated by usage intensity (sqrt dampening)
 *   - Thermal cycling stress scales with hot water draw frequency
 *   - Tank undersizing penalty for small tanks serving large households
 * - NEW STRESS FACTORS: Added usageIntensity and undersizing to stressFactors output
 * 
 * CHANGES v6.6:
 * - PHYSICS FIX: Implemented "Duty Cycle" logic (0.25 dampener) for Thermal Expansion.
 *   (Distinguishes between constant high pressure vs. transient thermal spikes).
 *   (Prevents false condemnation of young tanks).
 * - SAFETY: Added specific warnings for Attic units in the Repair workflow.
 * 
 * CHANGES v6.5:
 * - ARRHENIUS ADJUSTMENT: Lowered 'HOT' (140°F) penalty from 2.0x to 1.5x.
 * - PHYSICS: Retained 1.05x Soft-Start for Sediment (Quadratic Curve).
 * - FINANCIAL: Includes Financial Forecasting Engine.
 * 
 * CHANGES v6.4:
 * - PHYSICS FIX: Quadratic Sediment Stress (Soft Start curve)
 * - NEW FEATURE: Financial Forecasting Engine (Budget & Date Prediction)
 * 
 * CHANGES v6.2:
 * - ARCHITECTURE: Split recommendation into getRawRecommendation + optimizeEconomicDecision
 * - ECONOMIC LAYER: Added ROI logic for repair vs. replacement decisions
 * 
 * CHANGES v6.1:
 * - PHYSICS ADAPTER: Added 'getEffectivePressure' to calculate internal tank stress
 */

// --- TYPES & INTERFACES ---

export type FuelType = 'GAS' | 'ELECTRIC';
export type TempSetting = 'LOW' | 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'UPPER_FLOOR' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE' | 'EXTERIOR' | 'CRAWLSPACE';
export type RiskLevel = 1 | 2 | 3 | 4;
export type UsageType = 'light' | 'normal' | 'heavy';

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
  
  // Usage Calibration (NEW v6.8)
  peopleCount: number;     // 1-8+ people in household
  usageType: UsageType;    // light, normal, heavy (shower habits)
  tankCapacity: number;    // Gallons (from model # or user input)
  
  // Equipment Flags
  hasSoftener: boolean;
  hasCircPump: boolean;
  hasExpTank: boolean;
  hasPrv: boolean;         // Pressure Reducing Valve present?
  isClosedLoop: boolean;   // Check valve or backflow preventer present?
  
  // Visual Inspection
  visualRust: boolean;     
  isLeaking?: boolean;
  
  // Service History Resets (null/undefined = never serviced)
  lastAnodeReplaceYearsAgo?: number;  // Years since last anode replacement
  lastFlushYearsAgo?: number;         // Years since last tank flush
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
    // NEW v6.9: Usage-based stress factors
    usageIntensity: number;   // Combined people + usage type factor
    undersizing: number;      // Tank too small for household penalty
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

// Financial Forecasting Interface (NEW v6.4)
export interface FinancialForecast {
  targetReplacementDate: string;  // "June 2028"
  monthsUntilTarget: number;
  estReplacementCost: number;     // Mid-range estimate (for backwards compat)
  estReplacementCostMin: number;  // Low end of contractor range
  estReplacementCostMax: number;  // High end of contractor range
  monthlyBudget: number;          // Recommended savings (based on max)
  budgetUrgency: 'LOW' | 'MED' | 'HIGH' | 'IMMEDIATE';
  recommendation: string;
}

// Hard Water Tax Interface (NEW v6.7)
export interface HardWaterTax {
  hardnessGPG: number;
  hasSoftener: boolean;
  
  // Annual Loss Breakdown
  energyLoss: number;           // From sediment barrier
  applianceDepreciation: number; // Accelerated aging
  detergentOverspend: number;   // Excess soap usage
  totalAnnualLoss: number;      // Sum of all losses
  
  // ROI Analysis
  softenerAnnualCost: number;   // ~$250/year
  netAnnualSavings: number;     // Loss - Softener Cost
  paybackYears: number;         // Install cost / annual savings
  
  // Recommendation
  recommendation: 'NONE' | 'CONSIDER' | 'RECOMMEND';
  reason: string;
  badgeColor: 'green' | 'yellow' | 'orange';
}

export interface OpterraResult {
  metrics: OpterraMetrics;
  verdict: Recommendation;
  financial: FinancialForecast;
  hardWaterTax: HardWaterTax;  // NEW v6.7
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
  FLUSH_EFFICIENCY: 0.5,  // 50% sediment removal per flush (conservative estimate)
  
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
 * PHYSICS ADAPTER v6.6 - Duty Cycle Logic
 * Determines both the EFFECTIVE PSI and whether it's TRANSIENT (duty cycle).
 * 
 * Scenario 1: House PSI is 60, Closed Loop, No Exp Tank
 * -> Spikes to 120 during heating, but only ~25% duty cycle
 * -> Returns { effectivePsi: 120, isTransient: true }
 * 
 * Scenario 2: House PSI is 110 (PRV failed)
 * -> Tank is always at 110 PSI
 * -> Returns { effectivePsi: 110, isTransient: false }
 * 
 * The Duty Cycle dampener (0.25x) prevents false condemnation of young tanks
 * that experience thermal expansion spikes vs. constant static pressure.
 */
function getPressureProfile(data: ForensicInputs): { effectivePsi: number; isTransient: boolean } {
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  let effectivePsi = data.housePsi;
  let isTransient = false;

  // Scenario 1: House pressure is normal (e.g. 60), but Closed Loop creates spikes
  if (isActuallyClosed && !data.hasExpTank) {
    if (data.housePsi < CONSTANTS.PSI_THERMAL_SPIKE) {
      effectivePsi = CONSTANTS.PSI_THERMAL_SPIKE; // Spike to 120
      isTransient = true; // This is a Duty Cycle spike (not constant)
    }
  }
  
  // Scenario 2: House pressure is ALREADY high (e.g. 110)
  // This is NOT transient; the tank is always under this load.
  if (data.housePsi >= CONSTANTS.PSI_THERMAL_SPIKE) {
    effectivePsi = data.housePsi;
    isTransient = false;
  }

  return { effectivePsi, isTransient };
}

// --- CORE CALCULATION ENGINE ---

export function calculateHealth(data: ForensicInputs): OpterraMetrics {
  
  // ============================================
  // USAGE INTENSITY CALCULATION (NEW v6.9)
  // Unified factor applied across all calculations
  // ============================================
  const usageMultipliers = { light: 0.6, normal: 1.0, heavy: 1.8 };
  const usageMultiplier = usageMultipliers[data.usageType] || 1.0;
  
  // Occupancy factor (normalized to average 2.5-person household)
  const occupancyFactor = Math.max(1, data.peopleCount / 2.5);
  
  // Combined usage intensity (1.0 = baseline 2.5-person normal use)
  // Range: 0.6 (1-person light) to ~5.8 (8-person heavy)
  const usageIntensity = usageMultiplier * occupancyFactor;
  
  // Tank undersizing penalty - small tank serving large household cycles more frequently
  // Rule of thumb: ~15 gallons per person for adequate recovery
  const expectedCapacity = data.peopleCount * 15;
  const sizingRatio = expectedCapacity / Math.max(data.tankCapacity, 30);
  // Penalty kicks in when tank is undersized by >20%
  const undersizingPenalty = sizingRatio > 1.2 ? 1 + (sizingRatio - 1) * 0.25 : 1.0;
  
  // 1. ANODE SHIELD LIFE (Quality Credit - use warranty as baseline)
  // A 12-year warranty tank has ~2x the sacrificial metal mass of a 6-year tank
  const baseAnodeLife = data.warrantyYears > 0 ? data.warrantyYears : 6;
  
  // Decay rate multiplier (higher = faster anode consumption)
  let anodeDecayRate = 1.0;
  if (data.hasSoftener) anodeDecayRate += 1.4;  // Conductivity accelerates consumption
  if (data.hasCircPump) anodeDecayRate += 0.5;  // Erosion/amperage
  
  // NEW v6.9: Usage intensity accelerates electrochemical reactions
  // More hot water draws = more anode consumption (sqrt dampening for realism)
  anodeDecayRate *= Math.pow(usageIntensity, 0.5);
  
  // Effective shield duration (how long the anode protects the steel)
  const effectiveShieldDuration = baseAnodeLife / anodeDecayRate;
  
  // SERVICE HISTORY: If anode was replaced, use time since replacement; otherwise use tank age
  const anodeAge = data.lastAnodeReplaceYearsAgo ?? data.calendarAge;
  
  // Remaining shield life (can't go below 0)
  const shieldLife = Math.max(0, effectiveShieldDuration - anodeAge);

  // 2. SEDIMENT CALCULATION (Needed for stress factor)
  const sedFactor = data.fuelType === 'ELECTRIC' 
    ? CONSTANTS.SEDIMENT_FACTOR_ELEC 
    : CONSTANTS.SEDIMENT_FACTOR_GAS;
  
  // If softener is present, use near-zero hardness (anode sludge only)
  // Softened water removes 95%+ of minerals; remaining sediment is primarily anode byproduct
  const effectiveHardness = data.hasSoftener ? 0.5 : data.hardnessGPG;
  
  // Volume factor now uses the pre-calculated usageIntensity
  const volumeFactor = usageIntensity;
  
  // SERVICE HISTORY: Residual Sediment Model (v6.7)
  // Flushing removes ~50% of sediment (conservative estimate for DIY flushes)
  // Residual sediment remains and new sediment accumulates on top
  let sedimentLbs: number;
  if (data.lastFlushYearsAgo !== undefined && data.lastFlushYearsAgo !== null) {
    // Tank was flushed - calculate residual + new accumulation
    const ageAtFlush = data.calendarAge - data.lastFlushYearsAgo;
    const sedimentAtFlush = ageAtFlush * effectiveHardness * sedFactor * volumeFactor;
    const residualLbs = sedimentAtFlush * (1 - CONSTANTS.FLUSH_EFFICIENCY);
    const newAccumulationLbs = data.lastFlushYearsAgo * effectiveHardness * sedFactor * volumeFactor;
    sedimentLbs = residualLbs + newAccumulationLbs;
  } else {
    // Never flushed - full lifetime accumulation
    sedimentLbs = data.calendarAge * effectiveHardness * sedFactor * volumeFactor;
  }
  
  // Sediment rate (lbs per year based on EFFECTIVE water hardness AND volume factor)
  // Guard against division by zero - use minimum rate of 0.1 lbs/year
  const sedimentRate = Math.max(0.1, effectiveHardness * sedFactor * volumeFactor);
  
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
  
  // A. Pressure (Buffer Zone Model) - v6.6 Duty Cycle Logic
  // Uses getPressureProfile() to distinguish constant vs transient pressure
  const { effectivePsi, isTransient } = getPressureProfile(data);
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;

  let pressureStress = 1.0;
  if (effectivePsi > CONSTANTS.PSI_SAFE_LIMIT) {
    const excessPsi = effectivePsi - CONSTANTS.PSI_SAFE_LIMIT;
    let rawPenalty = Math.pow(excessPsi / CONSTANTS.PSI_SCALAR, CONSTANTS.PSI_QUADRATIC_EXP);
    
    // DUTY CYCLE DAMPENER (v6.6)
    // If this is a transient spike (heating only), apply 0.25x dampener (25% Duty Cycle).
    // If this is static pressure (PRV failure), apply full 1.0x penalty.
    if (isTransient) {
      rawPenalty = rawPenalty * 0.25; 
    }
    
    pressureStress = 1.0 + rawPenalty;
  }

  // B. Sediment (Thermal Stress / Overheating) - 100% mechanical
  // QUADRATIC SEDIMENT FIX (v6.4): "Soft Start" curve
  // - OLD Linear: 1.0 + (lbs * 0.05) = 1.2x at 4 lbs (Too harsh for healthy tanks)
  // - NEW Quadratic: Keeps 0-5 lbs near 1.0x, but spikes at 15+ lbs
  // Calibrated: 4 lbs = 1.05x, 10 lbs = 1.33x, 15 lbs = 1.75x (Lockout Threshold)
  const sedimentStress = 1.0 + ((sedimentLbs * sedimentLbs) / 300);

  // Combine mechanical stresses - these hurt the tank from Day 1
  // NEW v6.9: Include undersizing penalty (more cycling = more fatigue)
  const mechanicalStress = pressureStress * sedimentStress * undersizingPenalty;


  // === CHEMICAL STRESS (Corrosion - Anode CAN Prevent) ===
  // These accelerate electrochemical rust, which the anode fights

  // C. Temperature - Split 50/50 (expansion = mechanical, rust = chemical)
  // --- ARRHENIUS CALIBRATION v6.5 ---
  // Adjusted 'HOT' factor from 2.0 -> 1.5.
  // This represents a 50% acceleration in aging, rather than 100%.
  // Physics Logic: While chemical corrosion might double, the mechanical structure
  // (steel thickness, welds) does not degrade at that same exponential speed.
  // The Anode Rod acts as a chemical buffer, absorbing much of that accelerated corrosion.
  let tempStressRaw = 1.0;  // NORMAL baseline (120°F)
  if (data.tempSetting === 'HOT') tempStressRaw = 1.5;   // 140°F+ (was 2.0, now calibrated to 1.5)
  if (data.tempSetting === 'LOW') tempStressRaw = 0.8;   // 110°F eco mode life extension
  
  // Split the factor between mechanical (expansion) and chemical (rust)
  // sqrt(1.5) = 1.22x multiplier for each component.
  // NEW v6.9: Thermal cycling scales with usage - more hot water draws = more expansion cycles
  // A heavy-use 6-person family might cycle 8-10x/day vs 2-3x for light use
  const thermalCycleMultiplier = 1 + (usageIntensity - 1) * 0.12;
  const tempMechanical = Math.sqrt(tempStressRaw) * thermalCycleMultiplier;  // 50% mechanical (expansion cycles)
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
  
  // SERVICE HISTORY: anodeAge already defined above for shield life calculation
  // Time with anode protection vs exposed steel
  // New anode provides fresh protection for effectiveShieldDuration years
  const timeProtected = Math.min(age, effectiveShieldDuration + (age - anodeAge));
  const timeNaked = Math.max(0, age - timeProtected);

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
  // PRIORITY: Containment breach is ALWAYS the primary stressor if present
  let primaryStressor: string;
  if (isBreach) {
    primaryStressor = 'Containment Breach';
  } else {
    const stressorFactors = [
      { name: 'High Pressure', value: pressureStress },
      { name: 'High Temperature', value: tempStressRaw },
      { name: 'Sediment Buildup', value: sedimentStress },
      { name: 'Thermal Expansion', value: loopPenalty },
      { name: 'Circulation Pump', value: circStress }
    ];
    primaryStressor = stressorFactors.reduce((max, f) => f.value > max.value ? f : max, stressorFactors[0]).name;
  }

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
      sediment: parseFloat(sedimentStress.toFixed(2)),
      // NEW v6.9: Usage-based stress factors
      usageIntensity: parseFloat(usageIntensity.toFixed(2)),
      undersizing: parseFloat(undersizingPenalty.toFixed(2))
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

  // 2C. Repair ROI Threshold: Unit is physically intact but too old/stressed for repairs to be economical
  // Catches units like 12-year-old tanks with high biological wear where repair investment is wasted
  const isEconomicallyFragile = data.calendarAge >= 10 && metrics.agingRate > 1.5;
  const isAnodeDepleted = metrics.shieldLife < 1;
  const hasHighBioAge = metrics.bioAge > data.calendarAge * 1.8;

  if ((isEconomicallyFragile || (isAnodeDepleted && data.calendarAge >= 8) || (hasHighBioAge && data.calendarAge >= 8)) 
      && metrics.failProb > 25) {
    return {
      action: 'REPLACE',
      title: 'Repair Not Economical',
      reason: `At ${data.calendarAge} years with ${metrics.bioAge.toFixed(1)} years of biological wear, repair costs outweigh remaining service life.`,
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
  // v6.6: Enhanced with Attic Safety Warning
  if (isActuallyClosed && !data.hasExpTank) {
    const reasonText = data.hasCircPump 
      ? 'Circulation pump detected without expansion tank. Check valves in the loop are trapping pressure.'
      : 'Closed-loop system detected without an expansion tank. Pressure spikes to ~120 PSI during heating.';
    
    // SAFETY OVERRIDE: Attics are always Urgent with specific warning
    const isAttic = data.location === 'ATTIC' || data.location === 'UPPER_FLOOR';
    const atticWarning = isAttic 
      ? ' ATTIC LOCATION RISK: Thermal expansion may cause relief valve discharge or tank rupture in finished space.'
      : '';

    return {
      action: 'REPAIR',
      title: 'Missing Thermal Expansion',
      reason: reasonText + atticWarning,
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
  // TIER 4: PASS (No Immediate Issues Detected)
  // ============================================
  
  return {
    action: 'PASS',
    title: 'No Issues Detected',
    reason: 'No immediate concerns identified. Professional inspection and routine maintenance recommended.',
    urgent: false,
    badgeColor: 'green',
    badge: 'MONITOR'
  };
}

// --- ECONOMIC OPTIMIZATION ENGINE ---

function optimizeEconomicDecision(
  rec: Recommendation, 
  data: ForensicInputs, 
  metrics: OpterraMetrics
): Recommendation {
  const isOld = data.calendarAge > CONSTANTS.AGE_ECONOMIC_REPAIR_LIMIT;
  
  // High Risk Location Logic (e.g. Attic) - v6.6
  const isHighRisk = metrics.riskLevel >= CONSTANTS.RISK_HIGH;

  // SAFETY OVERRIDE: If unit is in Attic/Upper Floor and needs repair, force urgency
  if (isHighRisk && rec.action === 'REPAIR') {
    rec.urgent = true;
    rec.note = 'Safety override: High risk location increases repair urgency.';
  }
  
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

  // BUDGETING ADVICE (Past Warranty)
  if (rec.action === 'PASS' && data.calendarAge > data.warrantyYears) {
    return {
      action: 'PASS',
      title: 'Warranty Expired',
      reason: `Unit is past its ${data.warrantyYears}-year manufacturer warranty. Professional inspection and replacement budgeting recommended.`,
      urgent: false,
      badgeColor: 'blue',
      badge: 'MONITOR'
    };
  }

  return rec;
}

// --- FINANCIAL FORECASTING ENGINE (NEW v6.4) ---

/**
 * Calculates a monthly savings plan based on Accelerated Aging.
 * 
 * Formula: (Target Life - Current Age) / Aging Rate = Real Time Remaining
 * 
 * Example:
 * - Healthy tank (Age 4, Rate 1.0x): (13 - 4) / 1.0 = 9 years left
 * - Stressed tank (Age 4, Rate 2.0x): (13 - 4) / 2.0 = 4.5 years left
 * 
 * The stressed tank owner must save money twice as fast!
 */
function calculateFinancialForecast(data: ForensicInputs, metrics: OpterraMetrics): FinancialForecast {
  
  // 1. Establish Financial Targets
  // We plan for replacement at year 13 (typical end of financial life, not 25-year physics max)
  const TARGET_SERVICE_LIFE = 13;
  
  // Contractor pricing ranges (based on market data)
  // Low: budget contractors, mid: standard, high: premium/specialized
  const BASE_COST_LOW = data.fuelType === 'GAS' ? 1800 : 1600;
  const BASE_COST_MID = data.fuelType === 'GAS' ? 2400 : 2100;
  const BASE_COST_HIGH = data.fuelType === 'GAS' ? 3200 : 2800;
  
  // Add Granular Cost Adders based on location
  let costAdder = 0;
  if (data.location === 'ATTIC' || data.location === 'UPPER_FLOOR') costAdder += 600;
  if (data.location === 'CRAWLSPACE') costAdder += 400;
  
  // If system needs code upgrades (PRV/ExpTank), the *next* install will be more expensive
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  const needsCodeUpgrade = (!data.hasPrv && data.housePsi > 80) || (!data.hasExpTank && isActuallyClosed);
  if (needsCodeUpgrade) costAdder += 450;

  const totalCostLow = BASE_COST_LOW + costAdder;
  const totalCostMid = BASE_COST_MID + costAdder;
  const totalCostHigh = BASE_COST_HIGH + costAdder;

  const INFLATION_RATE = 0.03;

  // 2. Calculate Real Time Remaining
  // Use the agingRate (Stress) to accelerate the timeline
  const rawYearsRemaining = Math.max(0, TARGET_SERVICE_LIFE - data.calendarAge);
  
  // If unit is already dead or past target, give it a 6-month emergency horizon
  let adjustedYearsRemaining = 0.5;
  
  if (rawYearsRemaining > 0) {
    adjustedYearsRemaining = rawYearsRemaining / metrics.agingRate;
  }
  
  // Override for failed units - immediate action needed
  if (data.visualRust || data.isLeaking || metrics.failProb > 60) {
    adjustedYearsRemaining = 0;
  }

  // 3. Calculate Future Cost (inflation adjusted) for all tiers
  const inflationMultiplier = Math.pow(1 + INFLATION_RATE, Math.max(0, adjustedYearsRemaining));
  const futureCostLow = totalCostLow * inflationMultiplier;
  const futureCostMid = totalCostMid * inflationMultiplier;
  const futureCostHigh = totalCostHigh * inflationMultiplier;

  // 4. Calculate Monthly Budget (based on high estimate to be safe)
  const monthsUntilTarget = Math.max(0, Math.ceil(adjustedYearsRemaining * 12));
  let monthlyBudget = 0;
  
  if (monthsUntilTarget <= 0) {
    monthlyBudget = Math.ceil(futureCostHigh); // Lump sum needed
  } else {
    monthlyBudget = Math.ceil(futureCostHigh / monthsUntilTarget);
  }

  // 5. Determine Urgency & Messaging
  let urgency: 'LOW' | 'MED' | 'HIGH' | 'IMMEDIATE' = 'LOW';
  let recommendation = '';

  if (monthsUntilTarget <= 0) {
    urgency = 'IMMEDIATE';
    recommendation = `Unit is past its financial end-of-life. Budget $${Math.ceil(futureCostLow).toLocaleString()} - $${Math.ceil(futureCostHigh).toLocaleString()} for replacement.`;
  } else if (monthsUntilTarget < 12) {
    urgency = 'HIGH';
    recommendation = `Replacement likely within 12 months. Save $${monthlyBudget}/mo to cover the high end.`;
  } else if (monthsUntilTarget < 36) {
    urgency = 'MED';
    const targetYear = new Date(Date.now() + monthsUntilTarget * 30 * 24 * 60 * 60 * 1000).getFullYear();
    recommendation = `Plan to replace by ${targetYear}. Budget $${monthlyBudget}/mo to stay ahead.`;
  } else {
    urgency = 'LOW';
    recommendation = `No immediate issues. A maintenance fund of $${monthlyBudget}/mo prepares for eventual replacement.`;
  }

  // Generate Target Date String
  const targetDate = new Date(Date.now() + monthsUntilTarget * 30 * 24 * 60 * 60 * 1000);
  const dateString = monthsUntilTarget <= 0 
    ? "Immediate Action" 
    : targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    targetReplacementDate: dateString,
    monthsUntilTarget,
    estReplacementCost: Math.round(futureCostMid),
    estReplacementCostMin: Math.round(futureCostLow),
    estReplacementCostMax: Math.round(futureCostHigh),
    monthlyBudget,
    budgetUrgency: urgency,
    recommendation
  };
}

// --- HARD WATER TAX CALCULATION (NEW v6.7) ---

const HARD_WATER_CONSTANTS = {
  // GPG Recommendation Thresholds
  GPG_FLOOR: 7,           // Below this: Do NOT recommend (ROI too slow)
  GPG_CONSIDER: 10,       // 7-10: "Consider" (soft sell)
  GPG_RECOMMEND: 10,      // Above 10: Recommend (math proves ROI)
  
  // Softener Economics
  SOFTENER_INSTALL_COST: 2500,
  SOFTENER_LIFESPAN: 15,
  ANNUAL_SALT_COST: 100,
  ANNUAL_COST_OF_OWNERSHIP: 250, // ~$167 amortized + $83 salt/maintenance
  
  // Appliance Package Values
  APPLIANCE_PACKAGE_VALUE: 4000, // Water heater + dishwasher + washer
  NORMAL_LIFESPAN: 12,           // Years (soft water)
  
  // Detergent Multiplier (conservative estimate)
  DETERGENT_ANNUAL_PER_PERSON: 75, // $75/person/year extra in hard water
  DEFAULT_HOUSEHOLD_SIZE: 2.5,
  
  // Base energy cost for water heating
  BASE_ENERGY_COST: 400,
};

export function calculateHardWaterTax(
  data: ForensicInputs,
  metrics: OpterraMetrics
): HardWaterTax {
  const { hardnessGPG, hasSoftener } = data;
  const C = HARD_WATER_CONSTANTS;
  
  // Skip if softener already installed
  if (hasSoftener) {
    return {
      hardnessGPG,
      hasSoftener: true,
      energyLoss: 0,
      applianceDepreciation: 0,
      detergentOverspend: 0,
      totalAnnualLoss: 0,
      softenerAnnualCost: 0,
      netAnnualSavings: 0,
      paybackYears: 0,
      recommendation: 'NONE',
      reason: 'Water softener already installed.',
      badgeColor: 'green'
    };
  }
  
  // A. Energy Loss (from sediment barrier)
  // Sediment acts as insulator - ~1% efficiency loss per lb
  const sedimentPenalty = metrics.sedimentLbs * 0.01;
  const energyLoss = Math.round(C.BASE_ENERGY_COST * sedimentPenalty);
  
  // B. Appliance Depreciation ("Asset Value Loss")
  // Hard water reduces lifespan - concrete GPG-to-lifespan mapping
  let hardWaterLifespan: number;
  if (hardnessGPG < 10) {
    hardWaterLifespan = 11;      // Minor reduction
  } else if (hardnessGPG < 15) {
    hardWaterLifespan = 9;       // Moderate reduction
  } else if (hardnessGPG < 20) {
    hardWaterLifespan = 8;       // Significant reduction
  } else {
    hardWaterLifespan = 7;       // Severe reduction (>20 GPG)
  }
  
  const normalCostPerYear = C.APPLIANCE_PACKAGE_VALUE / C.NORMAL_LIFESPAN; // ~$333
  const hardCostPerYear = C.APPLIANCE_PACKAGE_VALUE / hardWaterLifespan;
  const applianceDepreciation = Math.round(hardCostPerYear - normalCostPerYear);
  
  // C. Detergent & Soap Overspend
  // Battelle Institute: families in hard water use 2x-4x more soap
  // Scale by actual household size AND usage intensity
  const householdSize = data.peopleCount || C.DEFAULT_HOUSEHOLD_SIZE;
  const usageMultipliers = { light: 0.6, normal: 1.0, heavy: 1.8 };
  const usageIntensity = usageMultipliers[data.usageType] || 1.0;
  const detergentOverspend = Math.round(householdSize * C.DETERGENT_ANNUAL_PER_PERSON * usageIntensity);
  
  // Total Annual Loss ("Hard Water Tax")
  const totalAnnualLoss = energyLoss + applianceDepreciation + detergentOverspend;
  
  // ROI Calculation
  const softenerAnnualCost = C.ANNUAL_COST_OF_OWNERSHIP;
  const netAnnualSavings = totalAnnualLoss - softenerAnnualCost;
  const paybackYears = netAnnualSavings > 0 
    ? Math.round((C.SOFTENER_INSTALL_COST / netAnnualSavings) * 10) / 10 
    : 99;
  
  // Determine Recommendation
  let recommendation: 'NONE' | 'CONSIDER' | 'RECOMMEND' = 'NONE';
  let reason = '';
  let badgeColor: 'green' | 'yellow' | 'orange' = 'green';
  
  if (hardnessGPG < C.GPG_FLOOR) {
    recommendation = 'NONE';
    reason = 'Water hardness is low. Softener not cost-effective.';
    badgeColor = 'green';
  } else if (hardnessGPG >= C.GPG_FLOOR && hardnessGPG < C.GPG_RECOMMEND) {
    recommendation = 'CONSIDER';
    reason = `Moderate hardness (${hardnessGPG} GPG). Consider for skin/hair comfort.`;
    badgeColor = 'yellow';
  } else if (totalAnnualLoss > softenerAnnualCost && hardnessGPG >= C.GPG_RECOMMEND) {
    recommendation = 'RECOMMEND';
    reason = `High hardness (${hardnessGPG} GPG) costs $${totalAnnualLoss}/yr. Softener pays for itself.`;
    badgeColor = 'orange';
  } else {
    recommendation = 'CONSIDER';
    reason = 'Hard water detected. Softener may improve comfort and appliance life.';
    badgeColor = 'yellow';
  }
  
  return {
    hardnessGPG,
    hasSoftener: false,
    energyLoss,
    applianceDepreciation,
    detergentOverspend,
    totalAnnualLoss,
    softenerAnnualCost,
    netAnnualSavings,
    paybackYears,
    recommendation,
    reason,
    badgeColor
  };
}

// --- MAIN ENTRY POINT ---

export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  const metrics = calculateHealth(data);
  const rawVerdict = getRawRecommendation(metrics, data);
  const verdict = optimizeEconomicDecision(rawVerdict, data, metrics);
  const financial = calculateFinancialForecast(data, metrics);
  const hardWaterTax = calculateHardWaterTax(data, metrics);
  
  return { metrics, verdict, financial, hardWaterTax };
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
