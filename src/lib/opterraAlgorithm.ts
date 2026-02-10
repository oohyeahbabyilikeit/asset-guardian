/**
 * OPTERRA v9.1.2 Risk Calculation Engine
 * 
 * A physics-based reliability algorithm with economic optimization logic.
 * 
 * v9.1.2 Gemini Physics Audit Fixes:
 * - FIX "Unreachable Verdict": Lowered failProb threshold from 60% to 45% (reachable before age-out)
 * - FIX "Dynamic ETA": Weibull ETA now scales with warranty tier (6yr=13.0, 12yr=16.0)
 * - FIX "Soft Water Physics": Increased naked conductivity penalty from 2.5x to 4.0x
 * - FIX "Pressure Duty Cycle": Increased closed-loop dampener from 0.25 to 0.50
 *
 * v8.1 Bug Fixes:
 * - FIX "Statistical Ceiling": Raised MAX_BIO_AGE from 25 to 50 (allows 85% failProb)
 * - FIX "Silent Killer": Transient pressure penalty now independent of static PSI
 * - FIX "Suppressible Fatigue": loopPenalty moved to mechanical stress (not anode-suppressible)
 * - FIX "Doomsday Projection": Phase-aware aging projection for new tanks
 * 
 * v8.0 Bug Fixes:
 * - FIX "Perfect Tank Inversion": Protected phase now uses multiplicative formula
 * - FIX "Lazarus Effect": Added history tracking for anode/softener installation
 * - FIX "Softener Double Dip": Hardness penalty now uses effectiveHardness
 * - FIX "Hybrid Suffocation Category Error": Removed from chemicalStress (efficiency only)
 * - FIX "Sediment Cliff": Linear interpolation replaces discrete jumps
 * 
 * @see docs/algorithm-changelog.md for version history
 */

// --- TYPES & INTERFACES ---

export type FuelType = 'GAS' | 'ELECTRIC' | 'HYBRID' | 'TANKLESS_GAS' | 'TANKLESS_ELECTRIC';
export type AirFilterStatus = 'CLEAN' | 'DIRTY' | 'CLOGGED';
export type InletFilterStatus = 'CLEAN' | 'DIRTY' | 'CLOGGED';
export type FlameRodStatus = 'GOOD' | 'WORN' | 'FAILING';
export type VentStatus = 'CLEAR' | 'RESTRICTED' | 'BLOCKED';
export type TempSetting = 'LOW' | 'NORMAL' | 'HOT';
export type LocationType = 'ATTIC' | 'UPPER_FLOOR' | 'MAIN_LIVING' | 'BASEMENT' | 'GARAGE' | 'EXTERIOR' | 'CRAWLSPACE';
export type RiskLevel = 1 | 2 | 3 | 4;
export type UsageType = 'light' | 'normal' | 'heavy';
export type VentType = 'ATMOSPHERIC' | 'POWER_VENT' | 'DIRECT_VENT';

// NEW v7.2: Quality Tier System
export type QualityTier = 'BUILDER' | 'STANDARD' | 'PROFESSIONAL' | 'PREMIUM';

// NEW v7.8: Expansion Tank Status ("Zombie Tank" Fix)
// A waterlogged tank provides ZERO protection despite being visually present
export type ExpansionTankStatus = 'FUNCTIONAL' | 'WATERLOGGED' | 'MISSING';

// NEW v7.8: Leak Source Classification ("Leak False Positive" Fix)
// Only TANK_BODY leaks warrant 99.9% failure - fittings are repairable
export type LeakSource = 'NONE' | 'TANK_BODY' | 'FITTING_VALVE' | 'DRAIN_PAN';

// NEW v7.9: Connection Type ("Galvanic Blind Spot" Fix)
// Direct copper connections cause accelerated galvanic corrosion
export type ConnectionType = 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER';

// NEW v7.9: Room Volume Type ("Hybrid Suffocation" Fix)
// Heat pump units need ~700 cu ft of air volume to work efficiently
export type RoomVolumeType = 'OPEN' | 'CLOSET_LOUVERED' | 'CLOSET_SEALED';

// NEW v9.0: TierProfile focuses on physical characteristics, not pricing
export type InsulationQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type AnodeType = 'SINGLE' | 'SINGLE_LARGE' | 'DUAL' | 'POWERED';
export type FailureMode = 'CATASTROPHIC' | 'GRADUAL' | 'SLOW_LEAK' | 'CONTROLLED';

export interface TierProfile {
  tier: QualityTier;
  tierLabel: string;
  warrantyYears: number;
  ventType: VentType;
  features: string[];
  // NEW v9.0: Physical traits for risk assessment (replace pricing)
  insulationQuality: InsulationQuality;  // Affects standby loss
  anodeType: AnodeType;                  // Affects protection duration
  failureMode: FailureMode;              // How tanks typically fail
  expectedLife: number;                  // Statistical mean lifespan in years
  /** @deprecated - kept for backwards compatibility during migration */
  baseCostGas: number;
  /** @deprecated - kept for backwards compatibility during migration */
  baseCostElectric: number;
  /** @deprecated - kept for backwards compatibility during migration */
  baseCostHybrid: number;
}

// Helper to detect tankless fuel types
export function isTankless(fuelType: FuelType): boolean {
  return fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
}

/**
 * NEW v9.1: Dynamic Age Calculation
 * 
 * Calculates the current age of a water heater from its install date.
 * Falls back to stored static age if install date is not available.
 * 
 * This enables "self-updating" records where age is always current
 * rather than frozen at inspection time.
 * 
 * @param installDate - The date the unit was installed (from DB or serial decode)
 * @param storedAge - Fallback: the static calendar_age_years from inspection
 * @returns Current age in years (fractional)
 */
export function calculateCurrentAge(installDate: Date | string | null, storedAge?: number): number {
  if (installDate) {
    const installDateObj = typeof installDate === 'string' ? new Date(installDate) : installDate;
    if (!isNaN(installDateObj.getTime())) {
      const now = new Date();
      const ageMs = now.getTime() - installDateObj.getTime();
      const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
      return Math.max(0, ageYears); // Never return negative age
    }
  }
  return storedAge ?? 0;
}

// Softener Salt Status for "Digital-First" hardness detection
export type SoftenerSaltStatus = 'OK' | 'EMPTY' | 'UNKNOWN';

// NEW v7.10: Sanitizer Type ("Chloramine Corrosion" Fix)
// Chloramine (NH2Cl) is more stable than chlorine but more corrosive to copper, brass,
// and rubber components. It also accelerates deterioration of softener resin by 30-50%.
export type SanitizerType = 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';

export interface ForensicInputs {
  calendarAge: number;     // Years
  warrantyYears: number;   // Standard is 6, 9, or 12
  
  // CHANGED: Technician inputs the Static Pressure measured at a fixture (Hose Bib)
  housePsi: number;        
  
  // NEW v8.0: Asset identification for pricing lookup
  modelNumber?: string;         // From OCR or manual input
  manufacturer?: string;        // Brand name for accurate pricing
  
  tempSetting: TempSetting;
  location: LocationType;
  isFinishedArea: boolean; 
  fuelType: FuelType;
  
  // HARDNESS INPUTS (v7.6 "Digital-First" Split Architecture)
  // streetHardnessGPG: From API/Zip (Required - pre-filled, used for Financial ROI)
  // measuredHardnessGPG: From Test Strip (Optional override, used for Physics if provided)
  // hardnessGPG: Legacy field, treated as streetHardnessGPG for backwards compatibility
  streetHardnessGPG?: number;        // NEW: From API (pre-filled from USGS/EPA)
  measuredHardnessGPG?: number;      // NEW: From Test Strip (optional tech verification)
  hardnessGPG: number;               // Legacy: Used as fallback if streetHardnessGPG not set
  
  // Usage Calibration (NEW v6.8)
  peopleCount: number;     // 1-8+ people in household
  usageType: UsageType;    // light, normal, heavy (shower habits)
  tankCapacity: number;    // Gallons (from model # or user input) - for tankless, use 0
  
  // NEW v7.2: Venting Type (affects replacement cost)
  ventType?: VentType;     // Atmospheric, Power Vent, or Direct Vent
  
  // Equipment Flags
  hasSoftener: boolean;
  softenerSaltStatus?: SoftenerSaltStatus;  // NEW v7.6: Visual salt check (faster than test strip)
  sanitizerType?: SanitizerType;            // NEW v7.10: Chlorine vs Chloramine (from ZIP lookup)
  hasCircPump: boolean;
  hasExpTank: boolean;
  // NEW v7.8: Expansion Tank Status ("Zombie Tank" Fix)
  // Waterlogged tanks are functionally MISSING - bladder rupture is common after 5-7 years
  expTankStatus?: ExpansionTankStatus;  // FUNCTIONAL, WATERLOGGED, or MISSING (legacy: derived from hasExpTank)
  hasPrv: boolean;         // Pressure Reducing Valve present?
  isClosedLoop: boolean;   // Check valve or backflow preventer present?
  
  // NEW v7.8: Drain Pan ("Attic Bomb" Fix)
  hasDrainPan?: boolean;   // Leak containment in high-risk locations
  
  // Visual Inspection
  visualRust: boolean;     
  isLeaking?: boolean;
  // NEW v7.8: Leak Source Classification ("Leak False Positive" Fix)
  // Only TANK_BODY leaks warrant condemnation - fitting leaks are repairable
  leakSource?: LeakSource;  // NONE, TANK_BODY, FITTING_VALVE, or DRAIN_PAN
  
  // Service History Resets (null/undefined = never serviced)
  lastAnodeReplaceYearsAgo?: number;  // Years since last anode replacement
  lastFlushYearsAgo?: number;         // Years since last tank flush
  
  // NEW v7.7: Sediment History ("Sediment Amnesia" Fix)
  isAnnuallyMaintained?: boolean;     // Has tank been flushed yearly throughout its life?
  
  // NEW v8.0: History Tracking ("Lazarus Effect" Fix)
  // These fields track ACTUAL exposure history to prevent retroactive healing
  yearsWithoutAnode?: number;         // Years tank ran with depleted anode before replacement
  yearsWithoutSoftener?: number;      // Years before softener was installed
  
  // NEW v7.3: Hybrid (Heat Pump) specific fields
  airFilterStatus?: AirFilterStatus;  // HYBRID only: air filter condition
  isCondensateClear?: boolean;        // HYBRID only: condensate drain clear?
  compressorHealth?: number;          // HYBRID only: 0-100 health percentage
  
  // NEW v7.4: Tankless-specific fields
  flowRateGPM?: number;               // Current flow rate capability
  ratedFlowGPM?: number;              // Factory rated flow (e.g., 9.5 GPM)
  lastDescaleYearsAgo?: number;       // Years since last descale/flush
  igniterHealth?: number;             // 0-100% (gas tankless only)
  flameRodStatus?: FlameRodStatus;    // Gas tankless only
  elementHealth?: number;             // 0-100% (electric tankless only)
  inletFilterStatus?: InletFilterStatus;
  hasRecirculationLoop?: boolean;     // Built-in recirc pump
  errorCodeCount?: number;            // Recent error code occurrences
  tanklessVentStatus?: VentStatus;    // Gas tankless only
  scaleBuildup?: number;              // 0-100% heat exchanger efficiency loss
  
  // NEW v7.5: Tankless isolation valves (critical for maintenance eligibility)
  hasIsolationValves?: boolean;       // Can the unit be descaled?
  
  // NEW v7.7: Winter Flow Diagnosis
  inletWaterTemp?: number;            // Inlet water temperature (degrees F) for winter flow calculation
  
  // NEW v7.8: Gas Starvation Detection ("Gas Starvation" Fix)
  gasLineSize?: '1/2' | '3/4' | '1';  // Inch diameter
  gasRunLength?: number;              // Feet from meter
  btuRating?: number;                 // Unit BTU rating (e.g., 199000)
  
  // NEW v7.9: Connection Type ("Galvanic Blind Spot" Fix)
  // Direct copper-to-steel connections cause accelerated galvanic corrosion
  connectionType?: 'DIELECTRIC' | 'BRASS' | 'DIRECT_COPPER';
  
  // NEW v7.10: Nipple Material ("Smart Galvanic Detection")
  // Eliminates false positives for modern units with factory dielectric nipples
  // Only relevant when connectionType is DIRECT_COPPER
  nippleMaterial?: 'STEEL' | 'STAINLESS_BRASS' | 'FACTORY_PROTECTED';
  
  // NEW v7.9: Venting Scenario ("Orphaned Vent Liability" Fix)
  // Orphaned flues require expensive chimney liners during replacement
  ventingScenario?: 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';
  
  // NEW v7.9: Room Volume for Hybrid ("Hybrid Suffocation" Fix)
  // Heat pump units need ~700 cu ft of air to harvest heat efficiently
  roomVolumeType?: 'OPEN' | 'CLOSET_LOUVERED' | 'CLOSET_SEALED';
  
  // NEW v7.9: Anode Count ("Sticker Slap" Fix)
  // A 12-year tank is often the same steel vessel as a 6-year with an extra anode rod
  anodeCount?: 1 | 2;
  
  // NEW v9.4: Inspection Photo URLs
  // URLs from uploaded inspection photos for visual evidence display
  photoUrls?: {
    condition?: string;   // Photo of unit condition (rust, leak evidence)
    dataplate?: string;   // Photo of data plate
    pressure?: string;    // Photo of pressure gauge reading
  };
}

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
  
  // NEW: The calculated max pressure the tank actually experiences
  effectivePsi: number;
  // True if pressure cycles between normal and spike (cyclic fatigue is worse than static)
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
    // NEW v6.9: Usage-based stress factors
    usageIntensity: number;   // Combined people + usage type factor
    undersizing: number;      // Tank too small for household penalty
  };
  riskLevel: RiskLevel;
  
  // Sediment Projection metrics (v9.1 Pro-Grade 5-Tier System)
  sedimentRate: number;        
  monthsToFlush: number | null; 
  monthsToLockout: number | null; 
  // NEW v9.1: Pro-Grade 5-Tier Flush Status
  // - optimal: 0-0.5 lbs (ideal efficiency range)
  // - advisory: 0.5-2.0 lbs (plan flush soon)
  // - due: 2.0-5.0 lbs (maintenance trigger - flush while loose)
  // - critical: 5.0-10.0 lbs (performance degradation, drain valve likely clogged)
  // - lockout: >10 lbs (do not flush - vac or replace required)
  flushStatus: 'optimal' | 'advisory' | 'due' | 'critical' | 'lockout';
  
  // Aging Speedometer metrics
  agingRate: number;           
  optimizedRate: number;       
  yearsLeftCurrent: number;    
  yearsLeftOptimized: number;  
  lifeExtension: number;       
  primaryStressor: string;
  
  // NEW v7.5: Tankless-specific metrics
  scaleBuildupScore?: number;    // 0-100% heat exchanger blockage
  flowDegradation?: number;      // % GPM loss vs rated
  descaleStatus?: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible' | 'run_to_failure';
  
  // NEW v7.8: Safety Warnings ("Legionella Liability" Fix)
  bacterialGrowthWarning?: boolean;  // True if temp setting creates Legionella risk
  
  // NEW v8.0: Hybrid Efficiency (separated from leak risk)
  hybridEfficiency?: number;  // 0-100% operating efficiency (null for non-hybrid)
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


export type RecommendationBadge = 'CRITICAL' | 'REPLACE' | 'SERVICE' | 'MONITOR' | 'OPTIMAL';

// NEW v9.0: Plumber Handshake Interface (Triage & Outreach Engine)
// Replaces FinancialForecast - provides scripts instead of prices
export interface PlumberHandshake {
  // The "Hook" - Why the homeowner should act NOW
  urgency: 'EMERGENCY' | 'PRIORITY' | 'ROUTINE' | 'MONITOR';
  headline: string; // e.g., "Critical Failure Risk: Anode Depleted"
  
  // The "Brief" - What the plumber needs to know (Lead Quality)
  technicalSummary: string; // e.g. "12yo Gas Unit, Basement, Atmospheric Vent"
  jobComplexity: 'STANDARD' | 'ELEVATED' | 'COMPLEX'; 
  codeAlerts: string[];     // e.g. ["Missing Thermal Expansion Tank"]
  
  // The "Script" - Questions homeowner should ask
  talkingPoints: string[];
  
  // Estimated timeline (no dollars)
  yearsRemaining: number;
  planningHorizon: 'IMMEDIATE' | 'THIS_YEAR' | '1_TO_3_YEARS' | '3_PLUS_YEARS';
}

// DEPRECATED: FinancialForecast - kept for backwards compatibility during migration
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

// Hard Water Tax Interface (NEW v6.7, UPDATED v7.7 for Electric Burnout Risk)
export interface HardWaterTax {
  hardnessGPG: number;          // Street hardness (for display)
  hasSoftener: boolean;
  
  // Annual Loss Breakdown
  energyLoss: number;           // From sediment barrier (GAS ONLY - Electric is always 0)
  applianceDepreciation: number; // Accelerated aging
  detergentOverspend: number;   // Excess soap usage
  plumbingProtection: number;   // Fixture/pipe mineral damage (NEW v7.0)
  totalAnnualLoss: number;      // Sum of all losses
  
  // NEW v7.7: Electric/Hybrid tanks - sediment causes burnout, not efficiency loss
  elementBurnoutRisk?: number;  // 0-100% risk scale for electric/hybrid tanks
  
  // ROI Analysis
  softenerAnnualCost: number;   // ~$250/year
  netAnnualSavings: number;     // Loss - Softener Cost
  paybackYears: number;         // Install cost / annual savings
  
  // Recommendation
  recommendation: 'NONE' | 'CONSIDER' | 'RECOMMEND' | 'PROTECTED';  // NEW v7.6: PROTECTED for working softener
  reason: string;
  badgeColor: 'green' | 'yellow' | 'orange';
  
  // NEW v7.6: For softener users, show what they're saving
  protectedAmount?: number;     // Annual $ saved by softener
}

export interface OpterraResult {
  metrics: OpterraMetrics;
  verdict: Recommendation;
  handshake: PlumberHandshake;  // NEW v9.0: Replaces financial
  hardWaterTax: HardWaterTax;
  /** @deprecated Use handshake instead - kept for backwards compatibility */
  financial: FinancialForecast;
}

// --- CONSTANTS & CONFIGURATION ---

// NEW v9.0: Quality Tier Database - Physical characteristics for risk assessment
const TIER_PROFILES: Record<QualityTier, TierProfile> = {
  BUILDER: {
    tier: 'BUILDER',
    tierLabel: 'Builder Grade',
    warrantyYears: 6,
    ventType: 'ATMOSPHERIC',
    features: ['Basic glass-lined tank', 'Single anode rod', 'Standard thermostat'],
    // Physical traits for risk assessment
    insulationQuality: 'LOW',
    anodeType: 'SINGLE',
    failureMode: 'CATASTROPHIC',  // Cheap tanks tend to burst
    expectedLife: 10,
    // Deprecated: kept for backwards compat
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
    failureMode: 'GRADUAL',  // Tends to weep before burst
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
    failureMode: 'SLOW_LEAK',  // Well-protected tanks leak slowly first
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
    anodeType: 'POWERED',  // Never depletes
    failureMode: 'CONTROLLED',  // Built-in leak detection
    expectedLife: 18,
    baseCostGas: 3500,
    baseCostElectric: 3000,
    baseCostHybrid: 5200,
  },
};

// Venting cost adders (labor + materials)
const VENT_COST_ADDERS: Record<VentType, number> = {
  ATMOSPHERIC: 0,
  POWER_VENT: 800,    // Blower motor, PVC venting, electrical
  DIRECT_VENT: 600,   // Concentric vent kit, wall termination
};

// NEW v7.9: Venting Scenario cost adders ("Orphaned Vent Liability" Fix)
// When a gas water heater is the only appliance on a masonry chimney (furnace upgraded to HE),
// the single unit cannot generate enough heat to draft properly → CO backdraft risk.
// Code requires a chimney liner during replacement.
export type VentingScenario = 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT';
const VENTING_SCENARIO_ADDERS: Record<VentingScenario, number> = {
  SHARED_FLUE: 0,           // Shared with furnace - adequate draft
  ORPHANED_FLUE: 2000,      // Chimney liner required ($1,500-$2,500)
  DIRECT_VENT: 0,           // Already self-contained
};

// NEW v7.9: Code Upgrade Adders ("codeAdder Ghost Variable" Fix)
// Mandatory code upgrades when replacing water heaters (often missed in quotes)
const CODE_UPGRADE_COSTS = {
  EXPANSION_TANK: 250,      // Required if closed loop / PRV
  DRAIN_PAN: 150,           // Required in attic / upper floor
  SEISMIC_STRAPS: 100,      // Required in earthquake zones (CA, WA, etc.)
  VACUUM_BREAKER: 75,       // Required on drain valves in some jurisdictions
};

const CONSTANTS = {
  // Weibull Reliability Parameters
  // FIX v8.2: Recalibrated for corrosion fatigue failure mode
  // Beta 3.2 = "Cliff edge" failure (tanks don't slowly degrade - they suddenly fail)
  // Eta 13.0 = Slightly longer characteristic life (compensates for stricter input factors)
  ETA: 13.0,               
  BETA: 3.2,
  
  // Physics Baselines
  PSI_SAFE_LIMIT: 80,      
  PSI_SCALAR: 20,          
  PSI_QUADRATIC_EXP: 2.0,  
  
   // Thermal Expansion Spike Baseline
   // In a closed loop without an expansion tank, pressure rises until 
   // the T&P weeps or a fixture leaks. We model this as a chronic 140 PSI spike.
   // v9.1.8: Corrected from 120 to 140 PSI (T&P relief valves set at 150 PSI)
   PSI_THERMAL_SPIKE: 140, 
  
  // Sediment Accumulation
  SEDIMENT_FACTOR_GAS: 0.044, 
  SEDIMENT_FACTOR_ELEC: 0.08,
  SEDIMENT_FACTOR_HYBRID: 0.06,  // NEW v7.3: Heat pumps - lower than electric due to efficiency
  FLUSH_EFFICIENCY: 0.5,  // 50% sediment removal per flush (conservative estimate)
  FLUSH_EFFICIENCY_HARDITE: 0.05,  // NEW v7.9: Calcified sediment (>5 years) is nearly permanent
  
  // NEW v9.1: Temperature Multipliers for Sediment Accumulation
  // Scale precipitation is exponential - 140°F precipitates 2-3x faster than 120°F
  TEMP_SEDIMENT_MULTIPLIER_LOW: 0.8,    // <120°F - slower precipitation
  TEMP_SEDIMENT_MULTIPLIER_NORMAL: 1.0, // 120°F baseline
  TEMP_SEDIMENT_MULTIPLIER_HOT: 1.75,   // 140°F+ - accelerated precipitation
  
  // Limits
  MAX_STRESS_CAP: 12.0,    
  MAX_BIO_AGE: 50,         // FIX v8.1: Raised from 25 to allow Weibull to reach STATISTICAL_CAP (85%)
  STATISTICAL_CAP: 85.0,
  VISUAL_CAP: 99.9,        
  
  LIMIT_PSI_SAFE: 80,      
  LIMIT_PSI_CRITICAL: 100, 
  LIMIT_PSI_EXPLOSION: 150, // T&P Rating (Safety Limit)
  
  // NEW v9.1: Pro-Grade 5-Tier Sediment Thresholds
  // Shifted from "wait until full" to "keep it clean"
  LIMIT_SEDIMENT_OPTIMAL: 0.5,    // Max lbs for "System Healthy" status
  LIMIT_SEDIMENT_ADVISORY: 2.0,   // Max lbs before "Plan Flush Soon"
  LIMIT_SEDIMENT_DUE: 5.0,        // Max lbs before "Maintenance Due" (was LIMIT_SEDIMENT_FLUSH)
  LIMIT_SEDIMENT_CRITICAL: 10.0,  // Max lbs before "High Buildup / Energy Loss"
  LIMIT_SEDIMENT_LOCKOUT: 10.0,   // Do Not Flush threshold (was 15)
  
  // DEPRECATED: kept for backwards compat
  LIMIT_SEDIMENT_FLUSH: 2.0,      // UPDATED v9.1: Trigger now at 2 lbs (was 5)
  LIMIT_AGE_FRAGILE: 10,       // CHANGED v6.2: Was 12, now 10
  LIMIT_FAILPROB_FRAGILE: 60,  
  LIMIT_AGE_MAX: 20,       // Hard cap for service life (Fixes Highlander Bug)
  
  // Economic Thresholds (NEW v6.2)
  AGE_ECONOMIC_REPAIR_LIMIT: 10, // Don't recommend heavy repairs past this age
  AGE_ANODE_LIMIT: 8,            // Age limit for anode refresh recommendation (unified with repairOptions)
  
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
  const statisticalCap = 85.0;
  
  // Use actual bioAge for calculation to show meaningful progression
  const t = Math.max(0, bioAge);
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
 * HARDNESS RESOLVER v7.6 - "Digital-First" Logic
 * 
 * Returns TWO values for TWO different purposes:
 * - streetHardness: Used for Financial ROI (what they WOULD face without treatment)
 * - effectiveHardness: Used for Physics (what the tank ACTUALLY experiences)
 * 
 * Priority Order:
 * 1. measuredHardnessGPG (Test Strip) - Ultimate truth if provided
 * 2. Inferred from softener + salt status - Zero friction assumption
 * 3. streetHardnessGPG (API) or hardnessGPG (Legacy) - Baseline
 */
export interface ResolvedHardness {
  streetHardness: number;      // For: Hard Water Tax, ROI, softener recommendation
  effectiveHardness: number;   // For: Sediment, anode decay, scale buildup
  source: 'MEASURED' | 'INFERRED' | 'API';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function resolveHardness(data: ForensicInputs): ResolvedHardness {
  // 1. BASELINE (Street Water) - Always from API or legacy field
  const streetHardness = data.streetHardnessGPG ?? data.hardnessGPG;
  
  // 2. EFFECTIVE (Tank Water) - Logic tree
  let effectiveHardness = streetHardness;
  let source: ResolvedHardness['source'] = 'API';
  let confidence: ResolvedHardness['confidence'] = 'MEDIUM';
  
  // SCENARIO A: Tech verified with test strip (Ultimate Truth)
  if (data.measuredHardnessGPG !== undefined) {
    effectiveHardness = data.measuredHardnessGPG;
    source = 'MEASURED';
    confidence = 'HIGH';
  }
  // SCENARIO B: Frictionless assumption based on softener + salt status
  // FIX v7.7 "Salt Blind Spot": Unverified softeners default to 3.0 GPG, not 0.5
  else if (data.hasSoftener) {
    if (data.softenerSaltStatus === 'EMPTY') {
      // Softener is dead → Use Street Hardness
      effectiveHardness = streetHardness;
      source = 'INFERRED';
      confidence = 'MEDIUM';
    } else if (data.softenerSaltStatus === 'OK') {
      // Salt VERIFIED full → Likely working (0.5 GPG for tank)
      effectiveHardness = 0.5;
      source = 'INFERRED';
      confidence = 'MEDIUM';  // Upgraded from LOW since salt was verified
    } else {
      // Salt status UNKNOWN → Could be bridged or failing
      // FIX v7.7: Default to 3.0 GPG (partial treatment), not 0.5
      // A bridged softener looks full but produces hard water
      effectiveHardness = 3.0;
      source = 'INFERRED';
      confidence = 'LOW';  // Very low confidence - softener status unknown
    }
  }
  // SCENARIO C: Measured hardness is low despite "no softener" checkbox
  // (User might not know they have a softener, or neighbor's softener, etc.)
  else if (data.measuredHardnessGPG !== undefined && data.measuredHardnessGPG <= 1.5) {
    effectiveHardness = data.measuredHardnessGPG;
    source = 'MEASURED';
    confidence = 'HIGH';
  }
  
  return { streetHardness, effectiveHardness, source, confidence };
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

  // FIX v7.8 "Zombie Expansion Tank": Check FUNCTIONAL status, not just presence
  // A waterlogged tank (dead bladder) provides ZERO protection
  // FIX v9.1.8: Must gate on hasExpTank — expTankStatus can default to FUNCTIONAL even when no tank exists
  const hasWorkingExpTank = data.hasExpTank && data.expTankStatus !== 'WATERLOGGED';

  // Scenario 1: House pressure is normal (e.g. 60), but Closed Loop creates spikes
  if (isActuallyClosed && !hasWorkingExpTank) {
    if (data.housePsi < CONSTANTS.PSI_THERMAL_SPIKE) {
      effectivePsi = CONSTANTS.PSI_THERMAL_SPIKE; // Spike to 140 PSI (v9.1.8)
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

// --- SMART PROXY LAYER v8.0 ("5-Minute Tech Flow" Optimization) ---

/**
 * SMART PROXY LAYER
 * 
 * Automatically infers missing fields from available data, allowing technicians
 * to skip high-effort/low-value inputs while maintaining algorithm accuracy.
 * 
 * Philosophy: "Observe, don't measure" - Techs are Data Verifiers, not Forensic Engineers.
 * 
 * PROXY MAPPING:
 * - flameRodStatus → Inferred from errorCodeCount (gas tankless)
 * - igniterHealth → Inferred from errorCodeCount (gas tankless)
 * - elementHealth → Inferred from errorCodeCount (electric tankless/tank)
 * - compressorHealth → Inferred from errorCodeCount (hybrid)
 * - anodeCount → Inferred from warrantyYears (tank units)
 * - isClosedLoop → Inferred from hasPrv || hasExpTank
 * - flowRateGPM → Derived from ratedFlowGPM + scaleBuildup (tankless)
 * - inletWaterTemp → Default to 55°F national average
 */
export function applySmartProxies(inputs: ForensicInputs): ForensicInputs {
  const proxied = { ...inputs };
  
  // PROXY 1: Flame Rod Status from Error Codes (Gas Tankless)
  // Logic: If no errors, flame sensor is likely OK. If errors, likely failing.
  if (proxied.flameRodStatus === undefined && isTankless(proxied.fuelType) && proxied.fuelType === 'TANKLESS_GAS') {
    proxied.flameRodStatus = (proxied.errorCodeCount ?? 0) > 0 ? 'FAILING' : 'GOOD';
  }
  
  // PROXY 2: Igniter Health from Error Codes (Gas Tankless)
  // Logic: No errors = 100%, Any errors = 50% (conservative assumption)
  if (proxied.igniterHealth === undefined && proxied.fuelType === 'TANKLESS_GAS') {
    proxied.igniterHealth = (proxied.errorCodeCount ?? 0) === 0 ? 100 : 50;
  }
  
  // PROXY 3: Element Health from Error Codes (Electric Tank/Tankless)
  // Logic: No errors = 100%, Errors = 75% (elements are more robust than igniters)
  if (proxied.elementHealth === undefined && 
      (proxied.fuelType === 'TANKLESS_ELECTRIC' || proxied.fuelType === 'ELECTRIC')) {
    proxied.elementHealth = (proxied.errorCodeCount ?? 0) === 0 ? 100 : 75;
  }
  
  // PROXY 4: Compressor Health from Error Codes (Hybrid)
  // Logic: No errors = 100%, Errors = 60% (compressor issues often throw codes)
  if (proxied.compressorHealth === undefined && proxied.fuelType === 'HYBRID') {
    proxied.compressorHealth = (proxied.errorCodeCount ?? 0) === 0 ? 100 : 60;
  }
  
  // PROXY 5: Anode Count from Warranty Years (Tank Units)
  // Logic: 6-8yr warranty = 1 anode, 9+ year warranty = 2 anodes
  // This is physically accurate: "premium" tanks have extra anodes, not thicker steel
  if (proxied.anodeCount === undefined && !isTankless(proxied.fuelType)) {
    proxied.anodeCount = (proxied.warrantyYears ?? 6) >= 9 ? 2 : 1;
  }
  
  // PROXY 6: House PSI Default
  // v9.1.7 FIX "Silent Pressure": If housePsi is not provided, default to 60 PSI
  // (national average residential pressure). Without this, closed-loop systems
  // with no expansion tank silently skip ALL pressure penalties.
  if (proxied.housePsi === undefined || proxied.housePsi === null) {
    proxied.housePsi = 60;
  }

  // PROXY 7: Closed Loop from PRV/Expansion Tank Presence
  // Logic: If either exists, system is likely closed (check valve somewhere)
  if (proxied.isClosedLoop === undefined || proxied.isClosedLoop === null) {
    proxied.isClosedLoop = proxied.hasPrv || proxied.hasExpTank;
  }
  
  // PROXY 7: Flow Rate from Scale Buildup (Tankless)
  // Logic: Scale restricts flow. Use rated flow * (1 - scaleLoss)
  // Max 50% flow loss at 100% scale buildup
  if (proxied.flowRateGPM === undefined && isTankless(proxied.fuelType)) {
    const ratedFlow = proxied.ratedFlowGPM ?? 8; // Default 8 GPM for unknown tankless
    const scalePercent = proxied.scaleBuildup ?? 0;
    const scaleLoss = (scalePercent / 100) * 0.5; // Max 50% loss
    proxied.flowRateGPM = ratedFlow * (1 - scaleLoss);
  }
  
  // PROXY 8: Inlet Water Temp Default
  // Logic: 55°F is national average groundwater temp. 
  // TODO: Could enhance with ZIP + season API lookup
  if (proxied.inletWaterTemp === undefined) {
    proxied.inletWaterTemp = 55;
  }
  
  // PROXY 9: Room Volume Type → Confined Space (Hybrid Simplification)
  // If roomVolumeType not specified, assume OPEN (most common)
  // This was a toggle simplification - sealed closets are rare
  if (proxied.roomVolumeType === undefined && proxied.fuelType === 'HYBRID') {
    proxied.roomVolumeType = 'OPEN';
  }
  
  return proxied;
}

// --- CORE CALCULATION ENGINE ---

export function calculateHealth(rawInputs: ForensicInputs): OpterraMetrics {
  // STEP 0: Apply smart proxies to fill missing fields
  const data = applySmartProxies(rawInputs);
  
  // ============================================
  // USAGE INTENSITY CALCULATION (NEW v6.9)
  // Unified factor applied across all calculations
  // ============================================
  const usageMultipliers = { light: 0.6, normal: 1.0, heavy: 1.8 };
  const usageMultiplier = usageMultipliers[data.usageType] || 1.0;
  
  // Occupancy factor (normalized to average 2.5-person household)
  // FIX v7.0 "GRANDMA PARADOX": Lower floor to 0.4 so single residents get credit for low wear
  // (1-person: 0.4, 2-person: 0.8, 3-person: 1.2, 4-person: 1.6, etc.)
  const occupancyFactor = Math.max(0.4, data.peopleCount / 2.5);
  
  // Combined usage intensity (1.0 = baseline 2.5-person normal use)
  // FIX v7.0 "FRAT HOUSE": Cap at 4.0x to prevent extreme households from breaking the math
  // Range: 0.24 (1-person light) to 4.0 (capped)
  const usageIntensity = Math.min(4.0, usageMultiplier * occupancyFactor);
  
  // Tank undersizing penalty - small tank serving large household cycles more frequently
  // Rule of thumb: ~15 gallons per person for adequate recovery
  const expectedCapacity = data.peopleCount * 15;
  const sizingRatio = expectedCapacity / Math.max(data.tankCapacity, 30);
  // Penalty kicks in when tank is undersized by >20%
  const undersizingPenalty = sizingRatio > 1.2 ? 1 + (sizingRatio - 1) * 0.25 : 1.0;
  
  // ============================================
  // 1. ANODE SHIELD LIFE v9.0 (Physics-Corrected Model)
  // ============================================
  // 
  // FIXES in v9.0:
  // - FIX "Marketing Math": 6yr → 4yr baseline (forensic reality)
  // - FIX "Hard Water Penalty": REMOVED (passivation protects anode)
  // - FIX "Time Machine Bug": History-aware burn rate using yearsWithoutSoftener
  // - CHANGE: Additive decay → Multiplicative burn rate
  //
  // Physics: A standard magnesium anode rod lasts 3-5 years.
  // Manufacturers use "6-year warranty" knowing rod dies at Year 4,
  // and the steel tank survives Years 4-6 "naked" until first leak.
  
  // v9.0 Constants (aligned with NACE/AWWA research)
  const ANODE_CONSTANTS = {
    BASE_LIFE_SINGLE: 4.0,      // Years for single Mg rod (was 6.0)
    BASE_LIFE_DUAL: 7.5,        // Years for dual rods (parallel surface area reduces effectiveness)
    BASE_LIFE_POWERED: 15,      // Powered anode (actively regenerates)
    SOFTENER_MULTIPLIER: 3.0,   // Soft water = 3x consumption rate
    GALVANIC_MULTIPLIER: 2.5,   // Direct copper + steel nipple
    RECIRC_MULTIPLIER: 1.25,    // Turbulence prevents passivation
    CHLORAMINE_MULTIPLIER: 1.2, // Ammonia byproducts accelerate corrosion
    MAX_BURN_RATE: 8.0,         // Cap for compound effects
  };
  
  // v7.6: Resolve effective hardness early (needed for anode decay AND sediment)
  const { effectiveHardness, streetHardness } = resolveHardness(data);
  
  // --- STEP 1: ESTABLISH BASE MASS (The "Fuel Tank") ---
  // Use anode count if known; else infer from warranty
  let baseMassYears: number;
  if (data.anodeCount === 2 || data.warrantyYears >= 12) {
    baseMassYears = ANODE_CONSTANTS.BASE_LIFE_DUAL; // 7.5 years
  } else {
    baseMassYears = ANODE_CONSTANTS.BASE_LIFE_SINGLE; // 4.0 years
  }
  
  // --- STEP 2: DEFINE BURN RATES (Multiplicative Physics) ---
  // Softener: Soft water is highly conductive, dissolves anode 3x faster
  const softenerFactor = data.hasSoftener ? ANODE_CONSTANTS.SOFTENER_MULTIPLIER : 1.0;
  
  // Recirc pump: Turbulence prevents passivation layer
  const recircFactor = data.hasCircPump ? ANODE_CONSTANTS.RECIRC_MULTIPLIER : 1.0;
  
  // Galvanic: Direct copper-to-steel creates electrochemical cell
  let galvanicFactor = 1.0;
  if (data.connectionType === 'DIRECT_COPPER') {
    if (data.nippleMaterial === 'STEEL' || data.nippleMaterial === undefined) {
      galvanicFactor = ANODE_CONSTANTS.GALVANIC_MULTIPLIER; // 2.5x
    }
    // STAINLESS_BRASS or FACTORY_PROTECTED = no penalty
  } else if (data.connectionType === 'BRASS') {
    galvanicFactor = 1.3; // Brass is better but not ideal
  }
  // DIELECTRIC unions block galvanic current - no penalty
  
  // Chloramine: More aggressive than chlorine
  const chloramineFactor = data.sanitizerType === 'CHLORAMINE' 
    ? ANODE_CONSTANTS.CHLORAMINE_MULTIPLIER : 1.0;
  
  // CURRENT burn rate (multiplicative - all factors compound)
  let currentBurnRate = softenerFactor * galvanicFactor * recircFactor * chloramineFactor;
  
  // Cap to prevent extreme compound effects
  currentBurnRate = Math.min(ANODE_CONSTANTS.MAX_BURN_RATE, currentBurnRate);
  
  // HISTORICAL burn rate (before softener was installed)
  // Galvanic and recirc were always there, but softener might be new
  const historicalBurnRate = Math.min(
    ANODE_CONSTANTS.MAX_BURN_RATE, 
    galvanicFactor * recircFactor * chloramineFactor
  );
  
  // --- STEP 3: CALCULATE FUEL CONSUMED (History-Aware) ---
  // SERVICE HISTORY: If anode was replaced, use time since replacement; otherwise use tank age
  const anodeAge = data.lastAnodeReplaceYearsAgo ?? data.calendarAge;
  
  // How long has the softener been active?
  // FIX v9.0 "Time Machine Bug": Don't retroactively apply softener burn to pre-softener years
  let yearsWithSoftener: number;
  let yearsNormal: number;
  
  if (data.yearsWithoutSoftener !== undefined) {
    // We know when softener was installed
    yearsWithSoftener = Math.max(0, anodeAge - data.yearsWithoutSoftener);
    yearsNormal = anodeAge - yearsWithSoftener;
  } else if (data.hasSoftener) {
    // Has softener but unknown when installed - assume worst case (always had it)
    yearsWithSoftener = anodeAge;
    yearsNormal = 0;
  } else {
    // No softener
    yearsWithSoftener = 0;
    yearsNormal = anodeAge;
  }
  
  // Total "Anode Mass Years" consumed
  // (yearsNormal × historical burn) + (yearsWithSoftener × current burn)
  const consumedMass = (yearsNormal * historicalBurnRate) + (yearsWithSoftener * currentBurnRate);
  
  // --- STEP 4: PREDICT REMAINING LIFE ---
  const remainingMass = baseMassYears - consumedMass;
  
  // v9.0: Remaining mass divided by CURRENT burn rate = time until depletion
  // If remainingMass <= 0, tank is "naked" (anode depleted)
  let shieldLife: number;
  if (remainingMass <= 0) {
    shieldLife = 0; // Naked tank
  } else {
    // Add 0.5 year floor for non-depleted anodes (per v8.3 rule)
    shieldLife = Math.max(0.5, remainingMass / currentBurnRate);
  }
  
  // Store legacy values for backwards compatibility
  const baseAnodeLife = baseMassYears;
  const anodeDecayRate = currentBurnRate;
  // effectiveShieldDuration is used by phase-aware aging calculations later
  const effectiveShieldDuration = baseMassYears / currentBurnRate;

  // 2. SEDIMENT CALCULATION (Needed for stress factor)
  // NEW v7.3: Added HYBRID fuel type with lower sediment rate
  let sedFactor: number;
  if (data.fuelType === 'HYBRID') {
    sedFactor = CONSTANTS.SEDIMENT_FACTOR_HYBRID;
  } else if (data.fuelType === 'ELECTRIC') {
    sedFactor = CONSTANTS.SEDIMENT_FACTOR_ELEC;
  } else {
    sedFactor = CONSTANTS.SEDIMENT_FACTOR_GAS;
  }
  
  // v7.6: effectiveHardness already resolved above for anode decay calculation
  // (Moved earlier to fix "Softener Double Dip" bug)
  
  // Volume factor now uses the pre-calculated usageIntensity
  const volumeFactor = usageIntensity;
  
  // SERVICE HISTORY: Residual Sediment Model (v6.7)
  // Flushing removes ~50% of sediment (conservative estimate for DIY flushes)
  // Residual sediment remains and new sediment accumulates on top
  // FIX v7.7 "Sediment Amnesia": Account for lifetime maintenance, not just last flush
  // FIX v7.9 "Concrete Flush Fallacy": Calcified sediment (>5 years) is nearly permanent
  let sedimentLbs: number;
  if (data.isAnnuallyMaintained) {
    // FIX v7.7: Well-maintained tank - each annual flush removes 50%
    // After N years of annual flushing, approaches steady-state residual
    // Geometric series: newAccum + 0.5*newAccum + 0.25*newAccum + ... ≈ 2*yearlyAccum
    const yearlyAccumulation = effectiveHardness * sedFactor * volumeFactor;
    const steadyStateResidual = yearlyAccumulation * 2; // Geometric series limit
    // Well-maintained tanks stay in 1.5-2x yearly range, never exceed steady-state
    sedimentLbs = Math.min(steadyStateResidual, yearlyAccumulation * 1.5);
  } else if (data.lastFlushYearsAgo !== undefined && data.lastFlushYearsAgo !== null) {
    // Tank was flushed once - calculate residual + new accumulation
    // FIX v7.10: Cap lastFlushYearsAgo to calendarAge - can't have sediment from before unit existed
    const effectiveYearsSinceFlush = Math.min(data.lastFlushYearsAgo, data.calendarAge);
    const ageAtFlush = Math.max(0, data.calendarAge - effectiveYearsSinceFlush);
    const sedimentAtFlush = ageAtFlush * effectiveHardness * sedFactor * volumeFactor;
    
    // FIX v8.0 "Sediment Cliff": Linear interpolation replaces discrete jumps
    // Fresh sediment (age 0): 50% removable (loose calcium carbite sand)
    // Ancient sediment (age 8+): 5% removable (hardened calcium carbonate "hardite")
    // Linear decay between these points prevents scoring cliffs
    const maxEfficiency = CONSTANTS.FLUSH_EFFICIENCY;  // 0.50
    const minEfficiency = CONSTANTS.FLUSH_EFFICIENCY_HARDITE;  // 0.05
    const decayEndAge = 8;  // Years after which efficiency bottoms out
    
    const flushEfficiency = Math.max(
      minEfficiency,
      maxEfficiency - (ageAtFlush / decayEndAge) * (maxEfficiency - minEfficiency)
    );
    
    const residualLbs = sedimentAtFlush * (1 - flushEfficiency);
    const newAccumulationLbs = effectiveYearsSinceFlush * effectiveHardness * sedFactor * volumeFactor;
    sedimentLbs = residualLbs + newAccumulationLbs;
  } else {
    // Never flushed - calculate lifetime accumulation
    // FIX v8.0 "Lazarus Effect": Account for pre-softener hard water years
    if (data.hasSoftener && data.yearsWithoutSoftener !== undefined && data.yearsWithoutSoftener > 0) {
      // Split calculation: hard water years + soft water years
      const hardWaterYears = Math.min(data.yearsWithoutSoftener, data.calendarAge);
      const softWaterYears = Math.max(0, data.calendarAge - hardWaterYears);
      const preSoftenerSediment = hardWaterYears * streetHardness * sedFactor * volumeFactor;
      const postSoftenerSediment = softWaterYears * effectiveHardness * sedFactor * volumeFactor;
      sedimentLbs = preSoftenerSediment + postSoftenerSediment;
    } else {
      // No history tracking - use current effective hardness for full lifetime
      sedimentLbs = data.calendarAge * effectiveHardness * sedFactor * volumeFactor;
    }
  }
  
  // NEW v9.1: Temperature multiplier for sediment accumulation
  // Scale precipitation is exponential - higher temps accelerate mineral dropout
  let tempSedimentMultiplier: number;
  switch (data.tempSetting) {
    case 'LOW':
      tempSedimentMultiplier = CONSTANTS.TEMP_SEDIMENT_MULTIPLIER_LOW;    // 0.8x
      break;
    case 'HOT':
      tempSedimentMultiplier = CONSTANTS.TEMP_SEDIMENT_MULTIPLIER_HOT;    // 1.75x
      break;
    default: // NORMAL
      tempSedimentMultiplier = CONSTANTS.TEMP_SEDIMENT_MULTIPLIER_NORMAL; // 1.0x
  }
  
  // Sediment rate (lbs per year based on EFFECTIVE water hardness, volume, AND temperature)
  // Guard against division by zero - use minimum rate of 0.1 lbs/year
  const sedimentRate = Math.max(0.1, effectiveHardness * sedFactor * volumeFactor * tempSedimentMultiplier);
  
  // NEW v9.1: Pro-Grade 5-Tier Thresholds
  // Calculate months until maintenance thresholds
  const lbsToAdvisory = CONSTANTS.LIMIT_SEDIMENT_ADVISORY - sedimentLbs;
  const lbsToFlush = CONSTANTS.LIMIT_SEDIMENT_DUE - sedimentLbs;
  const lbsToCritical = CONSTANTS.LIMIT_SEDIMENT_CRITICAL - sedimentLbs;
  const lbsToLockout = CONSTANTS.LIMIT_SEDIMENT_LOCKOUT - sedimentLbs;
  
  // monthsToFlush = time until DUE threshold (2.0 lbs)
  const monthsToFlush = lbsToFlush > 0 ? Math.ceil((lbsToFlush / sedimentRate) * 12) : null;
  const monthsToLockout = lbsToLockout > 0 ? Math.ceil((lbsToLockout / sedimentRate) * 12) : null;
  
  // NEW v9.1: Pro-Grade 5-Tier Flush Status Determination
  // Shifted from "wait until full" to "keep it clean"
  let flushStatus: 'optimal' | 'advisory' | 'due' | 'critical' | 'lockout';
  if (sedimentLbs > CONSTANTS.LIMIT_SEDIMENT_LOCKOUT) {
    // >10 lbs: Risk of failure - sediment may be sealing rust. Do NOT standard flush.
    flushStatus = 'lockout';
  } else if (sedimentLbs > CONSTANTS.LIMIT_SEDIMENT_CRITICAL) {
    // 5-10 lbs: Performance degradation, drain valve likely clogged
    flushStatus = 'critical';
  } else if (sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_DUE) {
    // 2-5 lbs: Flush while sediment is still loose (sludge), before it hardens (scale)
    flushStatus = 'due';
  } else if (sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_ADVISORY) {
    // 0.5-2 lbs: Accumulation usually speeds up here as surface area grows
    flushStatus = 'advisory';
  } else {
    // 0-0.5 lbs: Ideal efficiency range
    flushStatus = 'optimal';
  }

  // 3. STRESS FACTORS (Split into MECHANICAL vs. CHEMICAL)

  // === MECHANICAL STRESS (Fatigue - Anode CANNOT Prevent) ===
  // These hurt the tank from Day 1, regardless of anode status
  
  // A. Pressure (Buffer Zone Model) - v6.6 Duty Cycle Logic
  // Uses getPressureProfile() to distinguish constant vs transient pressure
  const { effectivePsi, isTransient } = getPressureProfile(data);
  const isActuallyClosed = data.isClosedLoop || data.hasPrv;
  // v9.1.7 FIX "Zombie Expansion Tank Bypass": Use functional status, not just presence
  // A waterlogged tank (dead bladder) provides ZERO thermal expansion protection
  // FIX v9.1.8: Must gate on hasExpTank — expTankStatus can default to FUNCTIONAL even when no tank exists
  const hasWorkingExpTank = data.hasExpTank && data.expTankStatus !== 'WATERLOGGED';

  let pressureStress = 1.0;
  
   // FIX v8.1 "Silent Killer": Transient pressure penalty applies INDEPENDENTLY
   // A tank cycling 60→140→60 PSI suffers cyclic fatigue EVEN IF static pressure is safe
   // The Thermal Expansion spike (PSI_THERMAL_SPIKE = 140) is the damage source (v9.1.8)
   if (isTransient && !hasWorkingExpTank) {
     // Calculate penalty based on thermal spike magnitude, not static PSI
     const spikePsi = CONSTANTS.PSI_THERMAL_SPIKE; // 140 PSI (v9.1.8)
     const spikeExcess = spikePsi - CONSTANTS.PSI_SAFE_LIMIT; // 140 - 80 = 60
    const cyclicFatiguePenalty = Math.pow(spikeExcess / CONSTANTS.PSI_SCALAR, CONSTANTS.PSI_QUADRATIC_EXP);
    // v9.1 FIX "Pressure Duty Cycle": Increased from 0.25 to 0.50 for closed-loop
    // Daily 60→140→60 PSI cycles are more damaging than 0.25 implies
    // Fatigue failure follows power law (S^N) - cyclic stress is cumulative
    const closedLoopDampener = 0.50;
    const openLoopDampener = 0.25;
    const effectiveDampener = (data.isClosedLoop || data.hasPrv || data.hasCircPump) 
      ? closedLoopDampener 
      : openLoopDampener;
    pressureStress = 1.0 + (cyclicFatiguePenalty * effectiveDampener);
  }

  // THEN check static high pressure (additive if both present)
  if (effectivePsi > CONSTANTS.PSI_SAFE_LIMIT) {
    const excessPsi = effectivePsi - CONSTANTS.PSI_SAFE_LIMIT;
    const staticPenalty = Math.pow(excessPsi / CONSTANTS.PSI_SCALAR, CONSTANTS.PSI_QUADRATIC_EXP);
    // FIX v7.7 "Transient Pressure Inversion": CYCLIC stress is WORSE than static
    // If also transient (high static + cycling), compound the damage
    const transientMultiplier = isTransient ? 1.5 : 1.0;
    pressureStress += staticPenalty * transientMultiplier;
  }

  // B. Sediment (Thermal Stress / Overheating) - 100% mechanical
  // QUADRATIC SEDIMENT FIX (v6.4): "Soft Start" curve
  // - OLD Linear: 1.0 + (lbs * 0.05) = 1.2x at 4 lbs (Too harsh for healthy tanks)
  // - NEW Quadratic: Keeps 0-5 lbs near 1.0x, but spikes at 15+ lbs
  // Calibrated: 4 lbs = 1.05x, 10 lbs = 1.33x, 15 lbs = 1.75x (Lockout Threshold)
  
  // FIX v8.2 "Sediment Fuel-Type Differentiation":
  // Sediment risk varies dramatically by fuel type:
  // - Gas: Sediment insulates bottom from flames → thermal runaway → BURST risk (100%)
  // - Electric: Sediment buries lower element → component failure, NOT burst (20%)
  // - Hybrid: Lower operating temps reduce thermal stress (40%)
  const SEDIMENT_RISK_FACTOR: Record<string, number> = {
    GAS: 1.0,           // Full burst risk
    PROPANE: 1.0,       // Same as gas (propane burner)
    ELECTRIC: 0.2,      // Element failure, not burst
    HYBRID: 0.4,        // Heat pump = lower temps
    TANKLESS_GAS: 0.1,  // Minimal tank risk (no storage)
    TANKLESS_ELECTRIC: 0.1
  };
  const sedimentRiskFactor = SEDIMENT_RISK_FACTOR[data.fuelType] ?? 1.0;
  const sedimentStress = 1.0 + (((sedimentLbs * sedimentLbs) / 300) * sedimentRiskFactor);

  // E. Closed Loop (Thermal Expansion Fatigue)
  // FIX v8.1 "Suppressible Fatigue": This is MECHANICAL (metal flexing), not chemical
  // The anode CANNOT prevent thermal expansion stress - it's pure physics, not corrosion
  const loopPenalty = (isActuallyClosed && !hasWorkingExpTank) ? 1.2 : 1.0;
  
  // Combine mechanical stresses - these hurt the tank from Day 1
  // NEW v6.9: Include undersizing penalty (more cycling = more fatigue)
  // FIX v8.1: Include loopPenalty (thermal expansion is mechanical fatigue)
  const mechanicalStress = pressureStress * sedimentStress * undersizingPenalty * loopPenalty;


  // === CHEMICAL STRESS (Corrosion - Anode CAN Prevent) ===
  // These accelerate electrochemical rust, which the anode fights

  // C. Temperature - Split between mechanical (expansion) and chemical (rust)
  // --- FIX v8.2 "Arrhenius Violation" ---
  // The Arrhenius Equation dictates that reaction rates double every 10°C (18°F).
  // OLD (WRONG): sqrt(1.5) = 1.22x at 140°F - dramatically underestimates heat damage
  // NEW (CORRECT): 2^((140-120)/18) = 2.15x at 140°F - proper thermodynamic scaling
  
  // Temperature mapping
  const TEMP_MAP: Record<string, number> = {
    LOW: 110,      // Eco mode
    NORMAL: 120,   // Factory default
    MEDIUM: 130,   // Slightly elevated (for future use)
    HOT: 140,      // Bacteria-free / high demand
    VERY_HIGH: 150 // Commercial / extreme (for future use)
  };
  const tankTemp = TEMP_MAP[data.tempSetting] ?? 120;
  
  // Store raw temp stress for backward compatibility and stressor identification
  let tempStressRaw = 1.0;
  if (data.tempSetting === 'HOT') tempStressRaw = 2.15;   // Arrhenius-calculated
  if (data.tempSetting === 'LOW') tempStressRaw = 0.68;   // 2^(-0.56)
  
  // FIX v7.8 "Legionella Liability": Track bacterial growth risk for LOW temp
  // The 95°F-115°F range is ideal for Legionella Pneumophila growth
  // We still give the physical stress benefit, but flag the biological hazard
  const bacterialGrowthWarning = tankTemp < 120;
  
  // ARRHENIUS LAW: Chemical corrosion rate doubles every 10°C (18°F)
  // At 140°F: 2^((140-120)/18) = 2^1.11 = 2.15x corrosion rate
  // At 110°F: 2^((110-120)/18) = 2^(-0.56) = 0.68x corrosion rate
  const tempChemical = Math.pow(2.0, (tankTemp - 120) / 18.0);
  
  // Mechanical thermal expansion scales linearly with Delta-T, not exponentially
  // Higher temp = more expansion per cycle, but not exponentially
  // NEW v6.9: Thermal cycling scales with usage - more hot water draws = more expansion cycles
  const thermalCycleMultiplier = 1 + (usageIntensity - 1) * 0.12;
  const tempMechanical = (1.0 + ((tankTemp - 120) / 100)) * thermalCycleMultiplier;

  // D. Circulation (Erosion-Corrosion & Duty Cycle) - 100% chemical
  const circStress = data.hasCircPump ? 1.4 : 1.0;
  
  // FIX v8.0 "Hybrid Suffocation Category Error": Heat pump efficiency penalty
  // REMOVED from chemicalStress - suffocation affects EFFICIENCY, not TANK CORROSION
  // A sealed closet suffocates the compressor (performance), not the steel tank (leaks)
  let hybridSuffocationPenalty = 1.0;
  let hybridEfficiencyPercent: number | null = null;
  if (data.fuelType === 'HYBRID') {
    if (data.roomVolumeType === 'CLOSET_SEALED') {
      hybridSuffocationPenalty = 2.0;  // Unit runs on expensive resistance heat
    } else if (data.roomVolumeType === 'CLOSET_LOUVERED') {
      hybridSuffocationPenalty = 1.2;  // Some efficiency loss
    }
    // OPEN = 1.0 (full efficiency)
  }
  
  // FIX v7.9 "Hybrid Vampire": Use compressorHealth if provided (dead = resistance mode)
  let compressorPenalty = 1.0;
  if (data.fuelType === 'HYBRID' && data.compressorHealth !== undefined) {
    if (data.compressorHealth < 25) {
      compressorPenalty = 2.5;  // Dead compressor = expensive resistance-only operation
    } else if (data.compressorHealth < 50) {
      compressorPenalty = 1.5;  // Degraded heat pump efficiency
    } else if (data.compressorHealth < 75) {
      compressorPenalty = 1.2;  // Minor efficiency loss
    }
  }
  
  // Calculate hybrid efficiency as a percentage (for UI display, not tank health)
  if (data.fuelType === 'HYBRID') {
    hybridEfficiencyPercent = Math.round((1.0 / (hybridSuffocationPenalty * compressorPenalty)) * 100);
  }

  // Combine chemical stresses
  // FIX v8.0: REMOVED hybridSuffocationPenalty and compressorPenalty from chemicalStress
  // FIX v8.1: REMOVED loopPenalty (moved to mechanicalStress - it's metal fatigue, not corrosion)
  const chemicalStress = tempChemical * circStress;

  // Legacy: corrosionStress for backward compatibility (includes all old factors)
  // Note: loopPenalty is now in mechanical, but kept here for API compatibility
  const corrosionStress = tempStressRaw * circStress * sedimentStress;
  
  // Combined stress for UI display (Aging Speedometer)
  const mechanicalWithTempExpansion = mechanicalStress * tempMechanical;
  const rawStress = mechanicalWithTempExpansion * chemicalStress;
  const totalStress = Math.min(rawStress, CONSTANTS.MAX_STRESS_CAP);

  // 4. BIOLOGICAL AGE (Mechanical vs. Chemical Split)
  const age = data.calendarAge;
  
  // FIX v8.0 "Lazarus Effect": Track ACTUAL naked exposure history
  // If yearsWithoutAnode is provided, use it; otherwise infer from anode replacement timing
  // The old formula assumed a new anode retroactively protected the past - WRONG
  let timeProtected: number;
  let timeNaked: number;
  
  if (data.yearsWithoutAnode !== undefined && data.yearsWithoutAnode > 0) {
    // Explicit history: we know how long the tank ran without protection
    const historicalNakedYears = Math.min(data.yearsWithoutAnode, age);
    // Current anode protection = min(time since replacement, effective shield duration)
    const currentAnodeAge = data.lastAnodeReplaceYearsAgo ?? 0;
    const currentProtectionYears = Math.min(currentAnodeAge, effectiveShieldDuration);
    // Remaining years under original anode (before it depleted)
    const originalProtectionYears = Math.max(0, age - historicalNakedYears - currentAnodeAge);
    
    timeProtected = originalProtectionYears + currentProtectionYears;
    timeNaked = Math.max(0, age - timeProtected);
  } else {
    // Fallback: Assume worst case if anode was replaced (old one was depleted)
    // If never replaced (lastAnodeReplaceYearsAgo === undefined), use original shield duration
    if (data.lastAnodeReplaceYearsAgo !== undefined && data.lastAnodeReplaceYearsAgo < age) {
      // Anode was replaced - assume old one depleted, new one provides fresh protection
      const timeSinceReplacement = data.lastAnodeReplaceYearsAgo;
      const newAnodeProtection = Math.min(timeSinceReplacement, effectiveShieldDuration);
      // Assume original anode provided effectiveShieldDuration years, then depleted
      const originalProtection = Math.min(effectiveShieldDuration, age - timeSinceReplacement);
      timeProtected = originalProtection + newAnodeProtection;
      timeNaked = Math.max(0, age - timeProtected);
    } else {
      // Never replaced - single anode lifetime calculation
      timeProtected = Math.min(age, effectiveShieldDuration);
      timeNaked = Math.max(0, age - timeProtected);
    }
  }

  // === PHASE 1: PROTECTED (Anode Active) ===
  // FIX v8.0 "Perfect Tank Inversion": Use MULTIPLICATIVE formula, not additive
  // OLD (WRONG): mech + (chem * 0.1) = 1.1 when both are 1.0 (protected ages FASTER!)
  // NEW (CORRECT): mech * (1 + (chem - 1) * 0.1) = 1.0 when both are 1.0
  // The anode suppresses 90% of the EXCESS chemical stress above baseline (1.0)
  const chemicalSuppression = 1.0 + (chemicalStress - 1.0) * 0.1;
  const protectedStress = mechanicalWithTempExpansion * chemicalSuppression;
  const protectedAging = timeProtected * protectedStress;

  // === PHASE 2: NAKED (Anode Depleted) ===
  // Everything applies 100%
  // FIX v8.2 "Naked Gap": Soft water is BENEFICIAL for anode phase (less scale) but
  // DANGEROUS for naked phase (high conductivity accelerates bare steel corrosion).
  // Physics: Hard water forms protective mineral film; soft water corrodes 2-3x faster.
  // Nernst's Principle: High conductivity = higher corrosion current (I_corr)
  // v9.1 FIX "Soft Water Physics": Increased from 2.5x to 4.0x
  // Research shows carbon steel corrosion in soft water is 4.0-5.0x faster
  // than in hard water (0.25 mm/y vs 0.05 mm/y) due to lack of passivation.
  // Nernst's Principle: High conductivity = higher corrosion current
  const waterConductivity = data.hasSoftener ? 4.0 : 1.0;
  const nakedStress = Math.min(mechanicalWithTempExpansion * chemicalStress * waterConductivity, CONSTANTS.MAX_STRESS_CAP);
  const nakedAging = timeNaked * nakedStress;

  // Final biological age (capped for extreme cases)
  const rawBioAge = protectedAging + nakedAging;
  const bioAge = Math.min(rawBioAge, CONSTANTS.MAX_BIO_AGE);

  // 5. WEIBULL FAILURE PROBABILITY
  // v9.1 FIX "Dynamic ETA": Warranty-aware characteristic life
  // Base ETA 13.0 is for 6-year warranty. Add 0.5 years per tier above baseline.
  // Result: 6yr=13.0, 9yr=14.5, 12yr=16.0, 15yr=17.5
  // Reflects physical reality: premium tanks have better glass lining and dual anodes
  const warrantyBonus = ((data.warrantyYears ?? 6) - 6) * 0.5;
  const dynamicEta = CONSTANTS.ETA + warrantyBonus;
  
  const t = bioAge;
  const eta = dynamicEta;
  const beta = CONSTANTS.BETA;
  
  const rNow = Math.exp(-Math.pow(t / eta, beta));
  const rNext = Math.exp(-Math.pow((t + 1) / eta, beta));
  
  let failProb = (1 - (rNext / rNow)) * 100;

  // Caps & Overrides
  // FIX v7.8 "Leak False Positive": Only TANK_BODY leaks warrant 99.9% failure
  // Fitting leaks and drain pan moisture are repairable, not death sentences
  const isTankBodyLeak = data.leakSource === 'TANK_BODY' || 
    (data.isLeaking && data.leakSource === undefined);  // Legacy: assume tank body if not specified
  
  if (data.visualRust || isTankBodyLeak) {
    failProb = CONSTANTS.VISUAL_CAP;
  } else {
    failProb = Math.min(failProb, CONSTANTS.STATISTICAL_CAP);
  }
  
  // FIX v7.8 "Legionella Liability": Cap health score if bacterial risk exists
  // User still gets physical benefit of low temp, but score is capped at 85
  let healthScoreCap = 100;
  if (bacterialGrowthWarning) {
    healthScoreCap = 85;  // Can't be "optimal" with Legionella risk
  }

  // AGING SPEEDOMETER CALCULATIONS
  // FIX v8.1 "Doomsday Projection": Use PHASE-AWARE aging rate
  // If anode is still active, project using protected rate
  // Only switch to naked rate when anode is projected to deplete
  
  const anodeRemainingYears = Math.max(0, effectiveShieldDuration - (data.lastAnodeReplaceYearsAgo ?? age));
  const isAnodeActive = anodeRemainingYears > 0 && timeNaked === 0;
  
  // Calculate current aging rate based on anode status
  const currentAgingRate = isAnodeActive ? protectedStress : nakedStress;

  // Calculate OPTIMIZED stress (what if we fix pressure + expansion tank?)
  const optimizedPressureStress = 1.0;  // Fixed to 60 PSI
  const optimizedLoopPenalty = 1.0;     // Expansion tank installed
  const optimizedMechanical = optimizedPressureStress * sedimentStress * tempMechanical * optimizedLoopPenalty;
  const optimizedChemical = tempChemical * circStress;
  const optimizedStressRaw = optimizedMechanical * optimizedChemical;
  const optimizedProtectedStress = optimizedMechanical * (1.0 + (optimizedChemical - 1.0) * 0.1);
  const optimizedNakedStress = Math.min(optimizedStressRaw, CONSTANTS.MAX_STRESS_CAP);
  const optimizedAgingRate = isAnodeActive ? optimizedProtectedStress : optimizedNakedStress;

  // Calculate remaining capacity and life projection
  // v9.1.3 FIX: Use dynamic ETA (warranty-aware Weibull) as practical life ceiling
  // instead of MAX_BIO_AGE (50). No tank realistically survives to bioAge 50.
  // The Weibull characteristic life (dynamicEta) represents the 63.2% failure point,
  // which is the appropriate engineering ceiling for "expected remaining life".
  const practicalLifeCeiling = dynamicEta * 1.25; // Allow up to 25% beyond characteristic life
  const remainingCapacity = Math.max(0, practicalLifeCeiling - bioAge);
  
  // CRITICAL: If tank is breached (leaking or rust), remaining life is ZERO
  const isBreach = data.visualRust || data.isLeaking;

  // Project years remaining using phase-aware rates
  let yearsLeftCurrent: number;
  let yearsLeftOptimized: number;

  if (isBreach) {
    yearsLeftCurrent = 0;
    yearsLeftOptimized = 0;
  } else if (remainingCapacity <= 0) {
    yearsLeftCurrent = 0;
    yearsLeftOptimized = 0;
  } else {
    // v9.1.4: Hard cap projections to prevent absurd numbers
    const MAX_YEARS_LEFT = 15;

    // v9.1.5 FIX "Flat Projection": Use iterative year-by-year simulation
    // Each year of naked exposure slightly increases the degradation rate
    // due to compounding sediment, wall thinning, and scale buildup.
    // Acceleration factor: 3% per year of additional naked time (conservative)
    const ANNUAL_ACCELERATION = 0.03; // 3% compounding per year
    // v9.1.6 FIX "Sediment Blindspot": Naked floor scales with sediment load.
    // More sediment = more insulation = faster hot-spot corrosion on bare steel.
    // 0 lbs → floor 2.0x, 5.5 lbs → floor 2.825x, 10 lbs → floor 3.5x
    const SEDIMENT_NAKED_PENALTY = 0.15; // per lb of sediment
    const sedimentAwareFloor = 2.0 + sedimentLbs * SEDIMENT_NAKED_PENALTY;
    const sedimentAwareOptFloor = 1.5 + sedimentLbs * SEDIMENT_NAKED_PENALTY * 0.5; // Optimized gets half penalty (maintenance reduces sediment impact)
    const effectiveNakedRate = Math.max(nakedStress, sedimentAwareFloor);
    const effectiveOptNakedRate = Math.max(optimizedNakedStress, sedimentAwareOptFloor);

    // Helper: iterative compounding projection for naked phase
    const projectWithAcceleration = (capacity: number, baseRate: number): number => {
      if (capacity <= 0) return 0;
      let capLeft = capacity;
      let years = 0;
      while (capLeft > 0 && years < MAX_YEARS_LEFT) {
        const yearRate = baseRate * (1 + ANNUAL_ACCELERATION * years);
        capLeft -= yearRate;
        years++;
      }
      // Fractional last year interpolation
      if (years > 0 && capLeft < 0) {
        const lastYearRate = baseRate * (1 + ANNUAL_ACCELERATION * (years - 1));
        return years - 1 + (capLeft + lastYearRate) / lastYearRate;
      }
      return years;
    };

    if (isAnodeActive) {
      // Two-phase projection: protected years (linear) + naked years (compounding)
      const protectedCapacityUsed = anodeRemainingYears * currentAgingRate;
      const capacityAfterProtection = Math.max(0, remainingCapacity - protectedCapacityUsed);
      const nakedYearsAfter = projectWithAcceleration(capacityAfterProtection, effectiveNakedRate);
      yearsLeftCurrent = anodeRemainingYears + nakedYearsAfter;
      
      // Same for optimized
      const optProtectedUsed = anodeRemainingYears * optimizedAgingRate;
      const optCapacityAfter = Math.max(0, remainingCapacity - optProtectedUsed);
      const optNakedAfter = projectWithAcceleration(optCapacityAfter, effectiveOptNakedRate);
      yearsLeftOptimized = anodeRemainingYears + optNakedAfter;
    } else {
      // Anode depleted: full compounding projection
      yearsLeftCurrent = projectWithAcceleration(remainingCapacity, effectiveNakedRate);
      yearsLeftOptimized = projectWithAcceleration(remainingCapacity, effectiveOptNakedRate);
    }
  }
  
  
  // Apply hard cap (MAX_YEARS_LEFT already enforced inside projectWithAcceleration)
  const MAX_YEARS_LEFT_CAP = 15;
  yearsLeftCurrent = Math.min(yearsLeftCurrent, MAX_YEARS_LEFT_CAP);
  yearsLeftOptimized = Math.min(yearsLeftOptimized, MAX_YEARS_LEFT_CAP);
  
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

  // Calculate health score with Legionella cap if applicable
  const rawHealthScore = failProbToHealthScore(failProb);
  const cappedHealthScore = Math.min(rawHealthScore, healthScoreCap);
  
  // NEW v9.2: Calculate anode depletion percentage and status
  // Uses mass-percentage-based thresholds for predictive maintenance alerting
  // - 0-40% depletion: "protected" (system healthy)
  // - 40-50% depletion: "inspect" (upcoming service / plan ahead)
  // - 50-100% depletion: "replace" (service due now)
  // - 100%+ depletion: "naked" (tank unprotected)
  const anodeDepletionPercent = Math.min(100, Math.max(0, (consumedMass / baseMassYears) * 100));
  const anodeMassRemaining = Math.max(0, remainingMass / baseMassYears);
  
  let anodeStatus: 'protected' | 'inspect' | 'replace' | 'naked';
  if (anodeDepletionPercent <= 40) {
    anodeStatus = 'protected';
  } else if (anodeDepletionPercent <= 50) {
    anodeStatus = 'inspect';  // "Upcoming Service" / "Plan for Service"
  } else if (anodeMassRemaining > 0) {
    anodeStatus = 'replace';  // "Service Due Now"
  } else {
    anodeStatus = 'naked';    // Tank unprotected - critical
  }
  
  // NEW v9.3: Build burn factors object for transparency
  const anodeBurnFactors = {
    softener: softenerFactor > 1.0,
    galvanic: galvanicFactor > 1.0,
    recircPump: recircFactor > 1.0,
    chloramine: chloramineFactor > 1.0,
  };
  
  return {
    bioAge: parseFloat(bioAge.toFixed(1)),
    failProb: parseFloat(failProb.toFixed(1)),
    healthScore: cappedHealthScore,
    sedimentLbs: parseFloat(sedimentLbs.toFixed(1)),
    shieldLife: parseFloat(shieldLife.toFixed(1)),
    // NEW v9.2: Percentage-based anode metrics
    anodeDepletionPercent: parseFloat(anodeDepletionPercent.toFixed(1)),
    anodeStatus,
    anodeMassRemaining: parseFloat(anodeMassRemaining.toFixed(2)),
    // NEW v9.3: Burn rate transparency
    anodeBurnRate: parseFloat(currentBurnRate.toFixed(2)),
    anodeBurnFactors,
    effectivePsi: parseFloat(effectivePsi.toFixed(1)), // Derived PSI
    isTransientPressure: isTransient, // True if cycling between normal and spike
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
    optimizedRate: parseFloat(optimizedAgingRate.toFixed(2)),
    yearsLeftCurrent: parseFloat(yearsLeftCurrent.toFixed(1)),
    yearsLeftOptimized: parseFloat(yearsLeftOptimized.toFixed(1)),
    lifeExtension: parseFloat(lifeExtension.toFixed(1)),
    primaryStressor,
    // NEW v7.8: Safety Warnings
    bacterialGrowthWarning,
    // NEW v8.0: Hybrid Efficiency (separated from leak risk)
    hybridEfficiency: hybridEfficiencyPercent
  };
}

// --- RAW RECOMMENDATION ENGINE ---
// Strict Tiered Decision Tree v7.0
// Priority: Safety → Economic → Service → Pass
// Units that pass Tiers 1 & 2 are SAVEABLE

export function getRawRecommendation(metrics: OpterraMetrics, data: ForensicInputs): Recommendation {
  
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
  // TIER 0.5: HYBRID-SPECIFIC FAILURE MODES (NEW v7.3)
  // ============================================
  // Filter Clog - Heat pump cannot draw air, compressor damage imminent
  if (data.fuelType === 'HYBRID' && data.airFilterStatus === 'CLOGGED') {
    return {
      action: 'REPAIR',
      title: 'Filter Clog',
      reason: 'Clogged air filter is starving the heat pump compressor. Immediate cleaning required to prevent compressor failure.',
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }
  
  // Condensate Blockage - water backing up can damage electronics
  if (data.fuelType === 'HYBRID' && data.isCondensateClear === false) {
    return {
      action: 'REPAIR',
      title: 'Condensate Blockage',
      reason: 'Condensate drain is blocked. Water backup can damage control board and create mold. Clear drain immediately.',
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }

  // ============================================
  // TIER 1: SAFETY & PHYSICAL LOCKOUT (Must Replace)
  // Only these conditions warrant immediate replacement
  // ============================================
  
  // FIX v7.8 "Leak False Positive": Differentiate leak sources
  // Only TANK_BODY leaks warrant condemnation - fitting leaks are repairable
  const isTankBodyLeak = data.leakSource === 'TANK_BODY' || 
    (data.isLeaking && data.leakSource === undefined);  // Legacy fallback
  const isFittingLeak = data.leakSource === 'FITTING_VALVE' || data.leakSource === 'DRAIN_PAN';
  
  // 1A. Containment Breach: Visual rust OR TANK BODY leak
  if (data.visualRust || isTankBodyLeak) {
    return {
      action: 'REPLACE',
      title: 'Containment Breach',
      reason: 'Visual evidence of tank failure. Leak is imminent or active.',
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }
  
  // FIX v8.4: Fitting leaks moved to Tier 3 (after economic checks)
  // See "The Valve Trap" bug: Don't recommend REPAIR on zombie tanks

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
  // TIER 1.9: YOUNG TANK OVERRIDE (v9.1)
  // Physical age trumps statistical age for tanks ≤6 years
  // A depleted anode is NOT end-of-life - it's a serviceable part
  // ============================================
  const YOUNG_TANK_ABSOLUTE_THRESHOLD = 6; // Years
  const isPhysicalBreach = data.visualRust || isTankBodyLeak;
  
  if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !isPhysicalBreach) {
    // Young tank cannot hit "End of Service Life" - anode is replaceable
    const isAnodeDepletedYoung = metrics.shieldLife <= 0;
    
    // v9.1.1 FIX: Use same closed-loop logic as infrastructureIssues.ts
    // PRV and recirc pump CREATE closed-loop conditions even if isClosedLoop is false
    const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
    const needsExpansionTank = isActuallyClosed && !data.hasExpTank;
    const needsPrv = (data.housePsi ?? 0) > 80 && !data.hasPrv;
    const needsInfrastructure = needsExpansionTank || needsPrv;
    
    if (isAnodeDepletedYoung || needsInfrastructure) {
      const primaryIssue = isAnodeDepletedYoung ? 'anode' : 'infrastructure';
      const title = isAnodeDepletedYoung 
        ? 'Anode Service Required' 
        : 'Infrastructure Upgrade Required';
      const reason = `Your ${data.calendarAge}-year-old tank is young enough to protect. ${
        isAnodeDepletedYoung 
          ? 'The sacrificial anode has been consumed faster than expected - replacement will restore corrosion protection.'
          : 'Installing code-required infrastructure will reduce stress and extend useful life.'
      }`;
      
      return {
        action: 'REPAIR',
        title,
        reason,
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE',
        note: `Young tank with correctable ${primaryIssue} issues - worth protecting.`
      };
    }
  }

  // ============================================
  // TIER 2: ECONOMIC REPLACEMENT (Risk > Value)
  // Only if failProb exceeds strict thresholds
  // ============================================
  
  // 2A. Statistical End-of-Life (Patched Highlander Loophole)
  // We added || age > 20 to ensure old tanks don't slip through the math
  // v9.1.1 SAFETY NET: Young tanks cannot hit "End of Service Life"
  // If they have high failProb but no specific issue was caught above, redirect to MAINTAIN
  if (data.calendarAge <= YOUNG_TANK_ABSOLUTE_THRESHOLD && !isPhysicalBreach && metrics.failProb > CONSTANTS.LIMIT_FAILPROB_FRAGILE) {
    return {
      action: 'MAINTAIN',
      title: 'Elevated Wear Detected',
      reason: `Your ${data.calendarAge}-year-old tank is showing higher-than-expected wear. Professional inspection recommended to identify the root cause.`,
      urgent: true,
      badgeColor: 'orange',
      badge: 'SERVICE'
    };
  }
  
  if (metrics.failProb > CONSTANTS.LIMIT_FAILPROB_FRAGILE || data.calendarAge > CONSTANTS.LIMIT_AGE_MAX) {
    return {
      action: 'REPLACE',
      title: 'End of Service Life',
      reason: `Your unit has reached the end of its expected service life and is no longer reliable.`,
      urgent: false,
      badgeColor: 'red',
      badge: 'REPLACE'
    };
  }

  // 2B. Liability Hazard: High/Extreme risk location + failProb > 30%
  // Applies to: Attics, Upper Floors, Main Living Areas, Finished Basements
  // Lower threshold for finished areas where water damage is catastrophic
  // FIX v7.8 "Attic Bomb": Even LOWER threshold for unprotected high-risk locations
  const isAtticOrUpper = data.location === 'ATTIC' || data.location === 'UPPER_FLOOR';
  const hasNoDrainPan = !data.hasDrainPan;
  
  // v8.4: Tightened to 15% (consequence severity - High Consequence Location)
  // Risk = Probability × Consequence. Attic burst = $15k+ damage.
  if (isAtticOrUpper && hasNoDrainPan && metrics.failProb > 15) {
    return {
      action: 'REPLACE',
      title: 'Attic Liability',
      reason: `Attic unit without drain pan protection. The risk of water damage to your home is unacceptably high.`,
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }
  
  if (metrics.riskLevel >= CONSTANTS.RISK_HIGH && metrics.failProb > 30) {
    return {
      action: 'REPLACE',
      title: 'Liability Hazard',
      reason: `Unit is in a high-damage zone. The failure risk exceeds the safety threshold for finished areas.`,
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

  // v8.5: "Infrastructure First" Gate for Young Tanks
  // Young tanks with high bio-age due to CORRECTABLE stress (missing infra)
  // can be saved with infrastructure upgrades, even if anode is depleted
  const YOUNG_TANK_THRESHOLD = 6; // Years - within this range, infrastructure fixes are worthwhile
  const isYoungTank = data.calendarAge <= YOUNG_TANK_THRESHOLD;
  // v9.1.1 FIX: Use unified closed-loop detection
  const isActuallyClosedV2 = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  const hasCorrectableStress = 
    (isActuallyClosedV2 && !data.hasExpTank) ||  // Missing expansion tank in closed loop
    ((data.housePsi ?? 0) > 80 && !data.hasPrv);       // Missing PRV with high pressure

  // Young tank with high stress that can be reduced via infrastructure
  if (isYoungTank && hasHighBioAge && hasCorrectableStress && metrics.failProb < 50) {
    // Calculate projected life WITH infrastructure fixes
    const wouldExtendLife = metrics.yearsLeftOptimized > metrics.yearsLeftCurrent + 2;
    
    if (wouldExtendLife) {
      return {
        action: 'REPAIR',
        title: 'Protect Your Investment',
        reason: `Tank is ${data.calendarAge} years old with elevated stress. Installing code-required infrastructure will reduce wear rate and extend useful life.`,
        urgent: true,
        badgeColor: 'orange',
        badge: 'SERVICE',
        note: 'Unit has some wear but is worth protecting with infrastructure upgrades.'
      };
    }
  }

  // v8.5: "Managed Decline" for Low-Risk Young Tanks with Depleted Anodes
  // Young tanks in low-risk locations can run to failure if infrastructure is OK
  const isLowRiskLocation = metrics.riskLevel <= 2; // Garage, Basement, Utility
  const hasInfrastructureOk = data.hasExpTank || (!data.isClosedLoop && !data.hasCircPump);

  if (isYoungTank && isAnodeDepleted && isLowRiskLocation && hasInfrastructureOk && !hasCorrectableStress) {
    return {
      action: 'PASS',
      title: 'Run to Failure OK',
      reason: `Anode is depleted but tank is young (${data.calendarAge} yrs) in a protected location. Safe to monitor and budget for replacement.`,
      urgent: false,
      badgeColor: 'blue',
      badge: 'MONITOR',
      note: `Estimated ${Math.round(metrics.yearsLeftCurrent)} years remaining. No structural risk from location.`
    };
  }

  if ((isEconomicallyFragile || (isAnodeDepleted && data.calendarAge >= 8) || (hasHighBioAge && data.calendarAge >= 8)) 
      && metrics.failProb > 25) {
    return {
      action: 'REPLACE',
      title: 'Repair Not Economical',
      reason: `Your unit shows significant wear. At this stage, repairs won't meaningfully extend its life.`,
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
  
  // FIX v7.8 "Zombie Expansion Tank": Check FUNCTIONAL status, not just presence
  const hasWorkingExpTank = data.expTankStatus === 'FUNCTIONAL' || 
    (data.hasExpTank && data.expTankStatus !== 'WATERLOGGED');

  // 3A. Missing or Dead Thermal Expansion (Closed Loop without working Expansion Tank) - URGENT
  // v7.8: Enhanced to catch waterlogged "zombie" tanks
  if (isActuallyClosed && !hasWorkingExpTank) {
    const isWaterlogged = data.expTankStatus === 'WATERLOGGED';
    const reasonText = isWaterlogged
      ? 'Expansion tank is WATERLOGGED (bladder ruptured). Provides zero protection. Pressure spikes to ~120 PSI during heating.'
      : data.hasCircPump 
        ? 'Circulation pump detected without expansion tank. Check valves in the loop are trapping pressure.'
        : 'Closed-loop system detected without an expansion tank. Pressure spikes to ~120 PSI during heating.';
    
    // SAFETY OVERRIDE: Attics are always Urgent with specific warning
    const isAttic = data.location === 'ATTIC' || data.location === 'UPPER_FLOOR';
    const atticWarning = isAttic 
      ? ' ATTIC LOCATION RISK: Thermal expansion may cause relief valve discharge or tank rupture in finished space.'
      : '';

    return {
      action: 'REPAIR',
      title: isWaterlogged ? 'Waterlogged Expansion Tank' : 'Missing Thermal Expansion',
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

  // ============================================
  // TIER 3A: FITTING REPAIRS (with Fragility Filter)
  // v8.4: Moved here from Tier 1 to ensure economic checks run first
  // Only recommend repair if tank is robust enough to handle torque
  // ============================================
  if (isFittingLeak) {
    // FRAGILITY FILTER: If tank is too old/risky, don't apply torque to fittings
    // Torque on rusted nipples can shear tank body or crack glass lining
    const isTooFragileToService = data.calendarAge > 12 || metrics.failProb > 50;
    
    if (isTooFragileToService) {
      return {
        action: 'REPLACE',
        title: 'Too Fragile to Service',
        reason: `Fitting leak detected, but tank age (${data.calendarAge} yrs) and condition (${metrics.failProb.toFixed(0)}% risk) make repairs dangerous. Torque on corroded fittings may cause tank rupture.`,
        urgent: true,
        badgeColor: 'red',
        badge: 'REPLACE'
      };
    }
    
    // Tank is young/healthy enough to safely repair
    return {
      action: 'REPAIR',
      title: 'Fitting Leak Detected',
      reason: `Water detected at ${data.leakSource === 'DRAIN_PAN' ? 'drain pan' : 'fitting/valve'}. Tank is serviceable - repair is safe.`,
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
  // v8.4: Narrowed safe band from 5-15 lbs to 5-10 lbs (>10 lbs risks clogging valve open)
  const LIMIT_SEDIMENT_SAFE_FLUSH = 10;
  const isServiceable = metrics.sedimentLbs >= CONSTANTS.LIMIT_SEDIMENT_FLUSH 
                     && metrics.sedimentLbs <= LIMIT_SEDIMENT_SAFE_FLUSH;
  
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

  // v8.4: Heavy sediment (10-15 lbs) - too risky to flush, may clog valve open
  if (!isFragile && metrics.sedimentLbs > LIMIT_SEDIMENT_SAFE_FLUSH && metrics.sedimentLbs <= CONSTANTS.LIMIT_SEDIMENT_LOCKOUT) {
    return {
      action: 'PASS',
      title: 'Sediment Present - Do Not Disturb',
      reason: `Sediment load (${metrics.sedimentLbs.toFixed(1)} lbs) is too heavy for safe flushing. Disturbance may clog drain valve open. Monitor for leaks.`,
      urgent: false,
      badgeColor: 'yellow',
      badge: 'MONITOR'
    };
  }

  // Safe to flush (5-10 lbs)
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
  // FIX v7.8 "Impossible Maintenance": Don't recommend anode refresh on fused rods
  // After ~6 years without service, the anode hex head is often fused to the tank body.
  // Attempting to remove it can spin the tank, snap plumbing, or crack the glass lining.
  const neverServiced = data.lastAnodeReplaceYearsAgo === undefined || data.lastAnodeReplaceYearsAgo === null;
  const isFusedRisk = neverServiced && data.calendarAge > 6;
  
  if (metrics.shieldLife < 1 && data.calendarAge < CONSTANTS.AGE_ANODE_LIMIT && !isFusedRisk) {
    return {
      action: 'MAINTAIN',
      title: 'Anode Refresh',
      reason: 'Cathodic protection depleted. Replace anode to extend warranty life.',
      urgent: false,
      badgeColor: 'green',
      badge: 'MONITOR'
    };
  }
  
  // FIX v7.8: Warn about fused anode risk on old never-serviced tanks
  if (metrics.shieldLife < 1 && data.calendarAge < CONSTANTS.AGE_ANODE_LIMIT && isFusedRisk) {
    return {
      action: 'PASS',
      title: 'Anode Possibly Fused',
      reason: `Tank is ${data.calendarAge} years old with no service history. Anode rod may be fused to tank. Removal attempt could damage plumbing or crack glass lining.`,
      urgent: false,
      badgeColor: 'yellow',
      badge: 'MONITOR',
      note: 'Do Not Touch Gate: Risk of breaking tank outweighs maintenance benefit'
    };
  }

  // ============================================
  // TIER 3.5: "FALSE SECURITY" GAP FIX (v7.6)
  // Old tanks with depleted anodes can't be safely serviced, but they're NOT healthy.
  // ============================================
  if (metrics.shieldLife < 1 && data.calendarAge >= CONSTANTS.AGE_ANODE_LIMIT) {
    return {
      action: 'PASS',
      title: 'Protection Depleted',
      reason: 'Anode rod is depleted, but tank is too old to safely service. Monitor for leaks and budget for replacement.',
      urgent: false,
      badgeColor: 'yellow',
      badge: 'MONITOR'
    };
  }

  // ============================================
  // TIER 4: PASS (No Immediate Issues Detected)
  // ============================================
  
  return {
    action: 'PASS',
    title: 'No Issues Detected',
    reason: 'No immediate concerns identified. Continue regular maintenance to keep your unit running well.',
    urgent: false,
    badgeColor: 'green',
    badge: 'MONITOR'
  };
}

// --- TECHNICAL NECESSITY ENGINE (v9.0 - Replaces Economic Optimization) ---

/**
 * Applies physical responsibility checks instead of economic calculations.
 * This focuses on whether repairs are technically sound, not whether they're "worth it".
 */
export function optimizeTechnicalNecessity(
  rec: Recommendation, 
  data: ForensicInputs, 
  metrics: OpterraMetrics
): Recommendation {
  const isOld = data.calendarAge > CONSTANTS.AGE_ECONOMIC_REPAIR_LIMIT;
  
  // High Risk Location Logic (e.g. Attic) - v6.6
  const isHighRisk = metrics.riskLevel >= CONSTANTS.RISK_HIGH;

  // RULE 1: The "Naked" Rule (Liability Protection)
  // If the tank has no anode protection, repairs are professionally irresponsible
  // v8.5 Exception: Young tanks can still benefit from infrastructure fixes
  const isYoungEnoughToSave = data.calendarAge <= 6;
  const hasInfrastructureRepair = rec.action === 'REPAIR' && 
    (rec.title.includes('Expansion') || rec.title.includes('PRV') || 
     rec.title.includes('Pressure') || rec.title.includes('Investment'));

  if (metrics.shieldLife <= 0 && rec.action === 'MAINTAIN' && !isYoungEnoughToSave) {
    return {
      action: 'REPLACE',
      title: 'End of Service Life',
      reason: 'Internal protection is depleted. Repairs at this stage typically fail within 6 months.',
      urgent: true,
      badgeColor: 'red',
      badge: 'CRITICAL'
    };
  }

  // v8.5: Allow infrastructure repairs to proceed for young naked tanks
  if (metrics.shieldLife <= 0 && hasInfrastructureRepair && isYoungEnoughToSave) {
    rec.note = (rec.note || '') + ' Anode protection is depleted. Infrastructure fix will extend remaining life but monitor closely.';
    // Don't override - let the REPAIR recommendation through
  }

  // RULE 2: The "Code Trap" (Complexity Protection)
  // If an old tank needs major code upgrades, push toward replacement consultation
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  if (metrics.riskLevel >= 3 && data.calendarAge > 8 && !data.hasExpTank && isActuallyClosed) {
    return {
      action: 'REPLACE',
      title: 'System Upgrade Required',
      reason: 'Unit requires critical safety upgrades that are best bundled with replacement.',
      urgent: false,
      badgeColor: 'orange',
      badge: 'REPLACE'
    };
  }

  // RULE 3: The "High Risk Location" Rule
  // Attic/upper floor with moderate failure risk = urgent action
  if (isHighRisk && rec.action !== 'PASS') {
    if (rec.action === 'REPAIR' || rec.action === 'UPGRADE') {
      rec.urgent = true;
      rec.note = 'Location increases urgency—water damage risk is significant.';
    }
    
    // If already recommending REPLACE in high-risk location, ensure it's marked urgent
    if (rec.action === 'REPLACE' && !rec.urgent && metrics.failProb > 30) {
      rec.urgent = true;
      rec.note = 'High-risk location with elevated failure probability.';
    }
  }

  // RULE 4: Heavy Repair Optimization for Old Tanks
  // Certain repairs don't make sense on old tanks regardless of economics
  if (rec.action === 'REPAIR' || rec.action === 'UPGRADE') {
    const isHeavyRepair = rec.title.includes('PRV') 
                       || rec.title.includes('Expansion') 
                       || rec.title.includes('Pressure');
    
    if (isHeavyRepair && isOld) {
      // Low Risk Location -> Run to failure (repairs don't extend life significantly)
      if (metrics.riskLevel <= CONSTANTS.RISK_MED) {
        return {
          action: 'PASS',
          title: 'Run to Failure',
          reason: `Tank age (${data.calendarAge} yrs) does not justify major repairs in this low-risk location. Monitor and budget for replacement.`,
          urgent: false,
          badgeColor: 'yellow',
          badge: 'MONITOR'
        };
      }
      
      // High Risk Location -> Push toward replacement
      if (isHighRisk) {
        return {
          action: 'REPLACE',
          title: 'Strategic Replacement',
          reason: `System requires major repairs. Given tank age (${data.calendarAge} yrs) and high-risk location, replacement is the safer choice.`,
          urgent: false,
          badgeColor: 'orange',
          badge: 'REPLACE'
        };
      }
    }
  }

  // RULE 5: Warranty expired advisory
  if (rec.action === 'PASS' && data.calendarAge > data.warrantyYears) {
    return {
      action: 'PASS',
      title: 'Warranty Expired',
      reason: `Unit is past its ${data.warrantyYears}-year manufacturer warranty. Continue maintenance while planning for eventual replacement.`,
      urgent: false,
      badgeColor: 'blue',
      badge: 'MONITOR'
    };
  }

  return rec;
}

// --- FINANCIAL FORECASTING ENGINE (NEW v6.4, UPDATED v7.2) ---

/**
 * NEW v7.2: Detects the quality tier of the existing unit based on warranty and features.
 * 
 * Tier Mapping:
 * - BUILDER (6-year): Basic contractor-grade, single anode
 * - STANDARD (9-year): Mid-range, improved lining and anode
 * - PROFESSIONAL (12-year): Commercial-grade, dual anodes, brass fittings
 * - PREMIUM (15+ year): Stainless/plastic tank, powered anode, lifetime warranty
 */
export function detectQualityTier(data: ForensicInputs): TierProfile {
  const { warrantyYears, ventType } = data;
  
  // Primary signal: warranty term
  let detectedTier: QualityTier;
  
  if (warrantyYears >= 15) {
    detectedTier = 'PREMIUM';
  } else if (warrantyYears >= 10) {
    detectedTier = 'PROFESSIONAL';
  } else if (warrantyYears >= 8) {
    detectedTier = 'STANDARD';
  } else {
    detectedTier = 'BUILDER';
  }
  
  // Get base profile and overlay actual vent type
  const baseProfile = { ...TIER_PROFILES[detectedTier] };
  
  // Override vent type if specified (affects cost calculation)
  if (ventType) {
    baseProfile.ventType = ventType;
  }
  
  return baseProfile;
}

/**
 * NEW v7.2: Get the next tier up for upgrade recommendation
 */
function getUpgradeTier(currentTier: QualityTier): TierProfile | undefined {
  const tierOrder: QualityTier[] = ['BUILDER', 'STANDARD', 'PROFESSIONAL', 'PREMIUM'];
  const currentIndex = tierOrder.indexOf(currentTier);
  
  if (currentIndex < tierOrder.length - 1) {
    return TIER_PROFILES[tierOrder[currentIndex + 1]];
  }
  return undefined; // Already at premium
}

/**
 * NEW v7.2: Calculate tier-aware replacement cost with venting
 * UPDATED v7.3: Added HYBRID fuel type support
 */
function calculateTierCost(profile: TierProfile, data: ForensicInputs): number {
  // Select base cost by fuel type
  let baseCost: number;
  if (data.fuelType === 'HYBRID') {
    baseCost = profile.baseCostHybrid;
  } else if (data.fuelType === 'GAS') {
    baseCost = profile.baseCostGas;
  } else {
    baseCost = profile.baseCostElectric;
  }
  
  const ventAdder = VENT_COST_ADDERS[data.ventType || profile.ventType];
  
  // Location adders
  let locationAdder = 0;
  if (data.location === 'ATTIC' || data.location === 'UPPER_FLOOR') locationAdder = 600;
  else if (data.location === 'CRAWLSPACE') locationAdder = 400;
  
  // FIX v7.9 "codeAdder Ghost Variable": Itemized code upgrade adders instead of undefined
  // These are mandatory code upgrades that contractors must include but often miss in quotes
  let codeAdder = 0;
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  
  // Expansion tank required if closed loop / PRV and missing
  if (!data.hasExpTank && isActuallyClosed) {
    codeAdder += CODE_UPGRADE_COSTS.EXPANSION_TANK;
  }
  
  // Drain pan required in attic / upper floor locations
  if ((data.location === 'ATTIC' || data.location === 'UPPER_FLOOR') && !data.hasDrainPan) {
    codeAdder += CODE_UPGRADE_COSTS.DRAIN_PAN;
  }
  
  // Vacuum breaker on drain (some jurisdictions)
  codeAdder += CODE_UPGRADE_COSTS.VACUUM_BREAKER;
  
  // FIX v7.9 "Orphaned Vent Liability": Add chimney liner cost for orphaned flues
  // This is the "$2,000 Surprise" that contractors often miss
  const ventingScenarioAdder = data.ventingScenario 
    ? VENTING_SCENARIO_ADDERS[data.ventingScenario] 
    : 0;
  
  return baseCost + ventAdder + locationAdder + codeAdder + ventingScenarioAdder;
}

/**
 * Calculates a monthly savings plan based on Accelerated Aging.
 * 
 * UPDATED v7.2: Now includes tier-aware pricing for like-for-like and upgrade options.
 * 
 * Formula: (Target Life - Current Age) / Aging Rate = Real Time Remaining
 * 
 * Example:
 * - Healthy tank (Age 4, Rate 1.0x): (13 - 4) / 1.0 = 9 years left
 * - Stressed tank (Age 4, Rate 2.0x): (13 - 4) / 2.0 = 4.5 years left
 * 
 * The stressed tank owner must save money twice as fast!
 */
export function calculateFinancialForecast(data: ForensicInputs, metrics: OpterraMetrics): FinancialForecast {
  
  // 1. Establish Financial Targets
  // We plan for replacement at year 13 (typical end of financial life, not 25-year physics max)
  const TARGET_SERVICE_LIFE = 13;
  
  // NEW v7.2: Detect quality tier and calculate tier-aware costs
  const currentTier = detectQualityTier(data);
  let likeForLikeCost = calculateTierCost(currentTier, data);
  
  // FIX v7.8 "Sizing Infinite Loop": If tank is undersized, quote MUST be for correct size
  // Otherwise we're selling them the same problem that caused failure
  const expectedCapacity = data.peopleCount * 15;  // 15 gallons per person rule of thumb
  const sizingRatio = expectedCapacity / Math.max(data.tankCapacity, 30);
  const isUndersized = sizingRatio > 1.2;
  
  // Sizing upgrade cost: ~$200 per 10 gallons of additional capacity
  const sizingUpgradeCost = isUndersized 
    ? Math.ceil((expectedCapacity - data.tankCapacity) / 10) * 200
    : 0;
  
  // Add sizing upgrade to like-for-like cost if undersized
  if (isUndersized) {
    likeForLikeCost += sizingUpgradeCost;
  }
  
  // Check for upgrade opportunity
  const upgradeTierProfile = getUpgradeTier(currentTier.tier);
  const upgradeCost = upgradeTierProfile 
    ? calculateTierCost(upgradeTierProfile, data) + sizingUpgradeCost 
    : undefined;
  
  // Generate upgrade value proposition
  let upgradeValueProp: string | undefined;
  if (upgradeTierProfile && upgradeCost) {
    const costDiff = upgradeCost - likeForLikeCost;
    const warrantyDiff = upgradeTierProfile.warrantyYears - currentTier.warrantyYears;
    upgradeValueProp = `Upgrade to ${upgradeTierProfile.tierLabel} for +$${costDiff} → ${warrantyDiff} extra years of protection`;
  }
  
  // FIX v7.8: Add sizing upgrade note if applicable
  let sizingNote: string | undefined;
  if (isUndersized) {
    const recommendedSize = Math.ceil(expectedCapacity / 10) * 10;  // Round to nearest 10 gallons
    sizingNote = `Current ${data.tankCapacity}gal tank is undersized for ${data.peopleCount} people. Quote includes upgrade to ${recommendedSize}gal (+$${sizingUpgradeCost}).`;
  }
  
  // Use tier-aware costs for low/mid/high estimates
  // Low: current tier, Mid: +10%, High: +25% (labor variance)
  const totalCostLow = likeForLikeCost;
  const totalCostMid = Math.round(likeForLikeCost * 1.1);
  const totalCostHigh = Math.round(likeForLikeCost * 1.25);

  const INFLATION_RATE = 0.03;

  // 2. Calculate Real Time Remaining
  // Use the agingRate (Stress) to accelerate the timeline
  const rawYearsRemaining = Math.max(0, TARGET_SERVICE_LIFE - data.calendarAge);
  
  // If unit is already dead or past target, give it a 6-month emergency horizon
  let adjustedYearsRemaining = 0.5;
  
  if (rawYearsRemaining > 0) {
    // INFRASTRUCTURE FIRST GATE (v8.3): For young tanks with correctable issues,
    // use the optimized rate instead of current stressed rate.
    // This assumes the recommended infrastructure fix IS applied.
    const isYoungWithCorrectableIssues = data.calendarAge < 8 && metrics.optimizedRate < metrics.agingRate;
    const effectiveRate = isYoungWithCorrectableIssues ? metrics.optimizedRate : metrics.agingRate;
    adjustedYearsRemaining = rawYearsRemaining / effectiveRate;
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
  const futureUpgradeCost = upgradeCost ? upgradeCost * inflationMultiplier : undefined;

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
    recommendation = `Unit is past its expected service life. Expect to budget $${Math.ceil(futureCostLow).toLocaleString()} - $${Math.ceil(futureCostHigh).toLocaleString()} for like-for-like ${currentTier.tierLabel} replacement.`;
  } else if (monthsUntilTarget < 12) {
    urgency = 'HIGH';
    recommendation = `Replacement likely within 12 months. Your ${currentTier.tierLabel} unit will cost ~$${Math.round(likeForLikeCost).toLocaleString()} to replace.`;
  } else if (monthsUntilTarget < 36) {
    urgency = 'MED';
    const targetYear = new Date(Date.now() + monthsUntilTarget * 30 * 24 * 60 * 60 * 1000).getFullYear();
    recommendation = `Plan to replace by ${targetYear}. Budget ~$${monthlyBudget}/month for a ${currentTier.tierLabel} replacement.`;
  } else {
    urgency = 'LOW';
    recommendation = `No rush—just something to keep in mind for future planning.`;
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
    recommendation,
    // NEW v7.2: Tier-aware fields
    currentTier,
    likeForLikeCost: Math.round(likeForLikeCost),
    upgradeTier: upgradeTierProfile,
    upgradeCost: futureUpgradeCost ? Math.round(futureUpgradeCost) : undefined,
    upgradeValueProp,
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
  const C = HARD_WATER_CONSTANTS;
  
  // v7.6: Use Digital-First hardness resolver
  // streetHardness = what they WOULD face without treatment (for ROI calc)
  // effectiveHardness = what the tank ACTUALLY sees (for physics)
  const { streetHardness, effectiveHardness } = resolveHardness(data);
  
  // Use streetHardness for financial calculations (what they'd pay without treatment)
  const hardnessGPG = streetHardness;
  
  // v7.6: SOFTENER WORKING - Show what they're SAVING
  // If softener exists AND effective hardness is low, the softener is working
  if (data.hasSoftener && effectiveHardness < 1.5) {
    // Calculate what they WOULD pay without the softener (using street hardness)
    const wouldBeEnergyLoss = Math.round(C.BASE_ENERGY_COST * (streetHardness * 0.01) * 3); // Estimated sediment if no softener
    
    let wouldBeLifespan: number;
    if (streetHardness < 10) wouldBeLifespan = 11;
    else if (streetHardness < 15) wouldBeLifespan = 9;
    else if (streetHardness < 20) wouldBeLifespan = 8;
    else wouldBeLifespan = 7;
    
    const normalCostPerYear = C.APPLIANCE_PACKAGE_VALUE / C.NORMAL_LIFESPAN;
    const wouldBeCostPerYear = C.APPLIANCE_PACKAGE_VALUE / wouldBeLifespan;
    const wouldBeDepreciation = Math.round(wouldBeCostPerYear - normalCostPerYear);
    
    const householdSize = data.peopleCount || C.DEFAULT_HOUSEHOLD_SIZE;
    const styleMultipliers = { light: 0.6, normal: 1.0, heavy: 1.8 };
    const styleMultiplier = styleMultipliers[data.usageType] || 1.0;
    const wouldBeDetergent = Math.round(householdSize * C.DETERGENT_ANNUAL_PER_PERSON * styleMultiplier);
    
    const wouldBePlumbing = Math.round(streetHardness * 10);
    
    const totalProtected = wouldBeEnergyLoss + wouldBeDepreciation + wouldBeDetergent + wouldBePlumbing;
    const netSavings = totalProtected - C.ANNUAL_COST_OF_OWNERSHIP;
    
    return {
      hardnessGPG: streetHardness,
      hasSoftener: true,
      energyLoss: 0,           // They're not losing this
      applianceDepreciation: 0,
      detergentOverspend: 0,
      plumbingProtection: 0,
      totalAnnualLoss: 0,
      softenerAnnualCost: C.ANNUAL_COST_OF_OWNERSHIP,
      netAnnualSavings: netSavings,
      paybackYears: 0,
      recommendation: 'PROTECTED',
      reason: `Your softener protects you from $${totalProtected}/yr in hard water damage.`,
      badgeColor: 'green',
      protectedAmount: totalProtected
    };
  }
  
  // v7.6: SOFTENER BROKEN or NO SOFTENER - Calculate actual losses
  
  // A. Energy Loss (from sediment barrier)
  // FIX v7.7 "Electric Efficiency Lie": Sediment only causes efficiency loss for GAS
  // Electric immersion elements are 100% efficient (First Law of Thermodynamics).
  // For Electric/Hybrid: Sediment causes ELEMENT BURNOUT, not efficiency loss.
  let energyLoss = 0;
  let elementBurnoutRisk = 0;
  
  if (data.fuelType === 'ELECTRIC' || data.fuelType === 'HYBRID') {
    // Electric/Hybrid: Sediment causes element overheating → burnout
    // Risk scales with sediment accumulation (0-100% scale)
    energyLoss = 0;  // NO energy loss - physics doesn't work that way
    elementBurnoutRisk = Math.min(100, metrics.sedimentLbs * 5); // 20 lbs = 100% risk
  } else {
    // GAS: Sediment insulates water from flame = real efficiency loss
    const sedimentPenalty = metrics.sedimentLbs * 0.01;
    energyLoss = Math.round(C.BASE_ENERGY_COST * sedimentPenalty);
  }
  
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
  // Scale by actual household size AND usage style (NOT full usageIntensity which includes population)
  // FIX v7.0 "SOAP MATH": Renamed to styleMultiplier to avoid confusion with population factor
  const householdSize = data.peopleCount || C.DEFAULT_HOUSEHOLD_SIZE;
  const styleMultipliers = { light: 0.6, normal: 1.0, heavy: 1.8 };
  const styleMultiplier = styleMultipliers[data.usageType] || 1.0;
  const detergentOverspend = Math.round(householdSize * C.DETERGENT_ANNUAL_PER_PERSON * styleMultiplier);
  
  // D. Plumbing Protection (NEW v7.0)
  // Hard water causes pinhole leaks, faucet failures, and fixture damage
  // Conservative estimate: ~$10 per Grain of Hardness annually
  const plumbingProtection = Math.round(hardnessGPG * 10);
  
  // Total Annual Loss ("Hard Water Tax")
  const totalAnnualLoss = energyLoss + applianceDepreciation + detergentOverspend + plumbingProtection;
  
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
    plumbingProtection,
    totalAnnualLoss,
    softenerAnnualCost,
    netAnnualSavings,
    paybackYears,
    recommendation,
    reason,
    badgeColor,
    // NEW v7.7: Include element burnout risk for electric/hybrid tanks
    elementBurnoutRisk: elementBurnoutRisk > 0 ? elementBurnoutRisk : undefined
  };
}

// --- PLUMBER HANDSHAKE GENERATOR (NEW v9.0) ---

/**
 * Generates a "Plumber Handshake" - a technical briefing for plumbers
 * that replaces dollar-based financial forecasts with actionable scripts.
 */
export function generatePlumberHandshake(
  data: ForensicInputs, 
  metrics: OpterraMetrics,
  verdict: Recommendation
): PlumberHandshake {
  const codeAlerts: string[] = [];
  const talkingPoints: string[] = [];
  let complexityScore = 0;

  // 1. Detect Complexity (The "Gotchas")
  const isActuallyClosed = data.isClosedLoop || data.hasPrv || data.hasCircPump;
  
  if (!data.hasExpTank && isActuallyClosed) {
    codeAlerts.push("Code Upgrade: Thermal Expansion Tank required");
    talkingPoints.push("Ask if my closed-loop system needs an expansion tank.");
    complexityScore += 2;
  }
  
  if (data.location === 'ATTIC' || data.location === 'CRAWLSPACE') {
    codeAlerts.push("Access: Difficult location - may require 2 technicians");
    complexityScore += 3;
  }
  
  if (data.location === 'UPPER_FLOOR') {
    codeAlerts.push("Location: Upper floor - extra care for water damage risk");
    complexityScore += 2;
  }
  
  if (data.ventType === 'POWER_VENT') {
    codeAlerts.push("Electrical: Power vent requires 120V outlet");
    complexityScore += 1;
  }
  
  if (data.ventingScenario === 'ORPHANED_FLUE') {
    codeAlerts.push("Venting: Orphaned flue - chimney liner likely required");
    complexityScore += 3;
  }
  
  if (data.fuelType === 'HYBRID' && data.roomVolumeType === 'CLOSET_SEALED') {
    codeAlerts.push("Airflow: Heat pump in sealed closet - ventilation needed");
    complexityScore += 2;
  }
  
  // Connection type alerts
  if (data.connectionType === 'DIRECT_COPPER' && data.nippleMaterial !== 'FACTORY_PROTECTED') {
    codeAlerts.push("Galvanic: Direct copper connection - dielectric unions needed");
    complexityScore += 1;
  }
  
  // Generate talking points based on metrics
  if (metrics.shieldLife <= 0) {
    talkingPoints.push("My anode is depleted—can you check for internal rust?");
  }
  
  if (metrics.sedimentLbs > 10) {
    talkingPoints.push("There may be significant sediment—is flushing safe?");
  }
  
  if (metrics.isTransientPressure) {
    talkingPoints.push("I may have thermal expansion issues—what should I look for?");
  }
  
  if (data.housePsi > 80) {
    talkingPoints.push("My water pressure seems high—should I be concerned?");
  }

  // 2. Determine Urgency from verdict
  let urgency: PlumberHandshake['urgency'] = 'ROUTINE';
  if (verdict.action === 'REPLACE' && verdict.urgent) urgency = 'EMERGENCY';
  else if (verdict.action === 'REPLACE') urgency = 'PRIORITY';
  else if (verdict.action === 'REPAIR' && verdict.urgent) urgency = 'PRIORITY';
  else if (verdict.action === 'PASS') urgency = 'MONITOR';
  else if (verdict.action === 'MAINTAIN') urgency = 'ROUTINE';
  else if (verdict.action === 'UPGRADE') urgency = 'ROUTINE';

  // 3. Planning horizon (no dollars, just timeline)
  const TARGET_SERVICE_LIFE = 13;
  const yearsRemaining = Math.max(0, Math.round(TARGET_SERVICE_LIFE - metrics.bioAge));
  
  let planningHorizon: PlumberHandshake['planningHorizon'] = '3_PLUS_YEARS';
  if (yearsRemaining <= 0 || verdict.action === 'REPLACE') planningHorizon = 'IMMEDIATE';
  else if (yearsRemaining <= 1) planningHorizon = 'THIS_YEAR';
  else if (yearsRemaining <= 3) planningHorizon = '1_TO_3_YEARS';

  // 4. Build technical summary
  const manufacturer = data.manufacturer || 'Unknown';
  const fuelLabel = data.fuelType === 'HYBRID' ? 'Heat Pump' : data.fuelType;
  const ventLabel = data.ventType || 'Atmospheric';
  const technicalSummary = `${data.calendarAge}yr ${manufacturer} ${fuelLabel} in ${data.location}, ${ventLabel} vent`;

  return {
    urgency,
    headline: verdict.title,
    technicalSummary,
    jobComplexity: complexityScore > 4 ? 'COMPLEX' : (complexityScore > 1 ? 'ELEVATED' : 'STANDARD'),
    codeAlerts,
    talkingPoints,
    yearsRemaining,
    planningHorizon
  };
}

// --- TANKLESS ENGINE IMPORT ---

import { 
  calculateTanklessHealth, 
  getTanklessRecommendation, 
  getTanklessFinancials 
} from './opterraTanklessAlgorithm';

// --- MAIN ENTRY POINTS ---

/**
 * Standard Tank Heater Risk Calculation (GAS and ELECTRIC only)
 * This is the isolated tank engine for shipping.
 */
export function calculateOpterraTankRisk(data: ForensicInputs): OpterraResult {
  const metrics = calculateHealth(data);
  const rawVerdict = getRawRecommendation(metrics, data);
  const verdict = optimizeTechnicalNecessity(rawVerdict, data, metrics);
  const financial = calculateFinancialForecast(data, metrics);
  const hardWaterTax = calculateHardWaterTax(data, metrics);
  const handshake = generatePlumberHandshake(data, metrics, verdict);
  
  return { metrics, verdict, handshake, hardWaterTax, financial };
}

/**
 * Main Entry Point (routes to appropriate engine)
 * Kept for backwards compatibility - use calculateOpterraTankRisk directly for tank-only work.
 */
export function calculateOpterraRisk(data: ForensicInputs): OpterraResult {
  // ROUTING LOGIC: Direct tankless units to tankless algorithm
  const isTanklessUnit = data.fuelType === 'TANKLESS_GAS' || data.fuelType === 'TANKLESS_ELECTRIC';

  if (isTanklessUnit) {
    const metrics = calculateTanklessHealth(data);
    const verdict = getTanklessRecommendation(metrics, data);
    const financial = getTanklessFinancials(metrics, data);
    const hardWaterTax = calculateHardWaterTax(data, metrics);
    const handshake = generatePlumberHandshake(data, metrics, verdict);
    
    return { metrics, verdict, handshake, hardWaterTax, financial };
  }
  
  // v9.2: Route HYBRID to hybrid engine
  if (data.fuelType === 'HYBRID') {
    // Note: Hybrid algorithm is imported dynamically to avoid circular deps
    // For now, fall through to tank logic (hybrid has tank-like failure modes)
    // The router (opterraRouter.ts) will handle proper routing
  }

  // Standard tank heater logic (GAS, ELECTRIC)
  return calculateOpterraTankRisk(data);
}


