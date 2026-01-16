/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  SOFTENER FORENSIC ALGORITHM v1.2                                         ║
 * ║  "The Odometer" — Predicting softener failure from usage, not age         ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  CHANGES v1.2:                                                            ║
 * ║  - CARBON EXPIRY: Weighted decay for saturated carbon (>5 years)          ║
 * ║  - SALT SCALING: 6/9/15 lbs per regen based on tank size                  ║
 * ║  - TOTALED RULE: Force replacement if repairs > $700                      ║
 * ║  - BRINE FAILURE: Detect flooded salt tank (HIGH_WATER state)             ║
 * ║  - CARBON REBED: New service item for expired carbon filters              ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  CHANGES v1.1:                                                            ║
 * ║  - ANALOG TIMER FIX: Timer units regen every ~3.5 days regardless of use  ║
 * ║  - CAPACITY TRAP FIX: 9lbs salt = 75% of rated capacity (0.75 factor)     ║
 * ║  - SNAKE OIL FIX: RESIN_DETOX only for well water (iron), not city (mush) ║
 * ║  - IRON DETECTION: visualIron flag accelerates well water resin decay     ║
 * ║  - VISUAL PROXIES: visualHeight replaces raw capacity input               ║
 * ║  - SALT WASTE: Analog units apply 1.3x salt waste factor                  ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Unlike water heaters (catastrophic failure), softeners fail like cars:   ║
 * ║  • Clock A: Valve Seals (Odometer) — Mechanical wear from cycling         ║
 * ║  • Clock B: Resin Bed (Engine) — Chemical decay from chlorine/iron        ║
 * ║  • Clock C: Salt (Fuel) — Predictable consumption rate                    ║
 * ╠═══════════════════════════════════════════════════════════════════════════╣
 * ║  Key Insight: A softener in 20 GPG water ages 4x faster than in 5 GPG     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ─────────────────────────────────────────────────────────────────────────────

export type VisualHeight = 'KNEE' | 'WAIST' | 'CHEST';
export type ControlHead = 'DIGITAL' | 'ANALOG';

export type SaltLevelState = 'OK' | 'LOW' | 'HIGH_WATER';

// FIX v1.3: Quality tier for dynamic "totaled" thresholds ("Disposable Softener" Fix)
export type SoftenerQualityTier = 'CABINET' | 'STANDARD' | 'PREMIUM';

export interface SoftenerInputs {
  ageYears: number;           // How old the unit is
  hardnessGPG: number;        // Water hardness (Grains Per Gallon)
  people: number;             // Household occupancy
  isCityWater: boolean;       // True = Chlorine Risk
  hasCarbonFilter: boolean;   // True = Shield Up (protects resin)
  
  // NEW v1.1: Visual Proxies (replaces raw capacity)
  visualHeight: VisualHeight; // Capacity Proxy: KNEE=24k, WAIST=32k, CHEST=48k
  controlHead: ControlHead;   // Efficiency Proxy: DIGITAL=metered, ANALOG=timer
  visualIron: boolean;        // Rust Staining? (Well water iron indicator)
  
  // NEW v1.2: Carbon Filter Age (null if no filter or unknown)
  carbonAgeYears: number | null;
  
  // NEW v1.2: Brine Tank Visual Check
  saltLevelState: SaltLevelState;
  
  // NEW v1.3: Quality Tier (for dynamic "totaled" threshold)
  qualityTier?: SoftenerQualityTier;  // CABINET=$300, STANDARD=$500, PREMIUM=$800
  
  // NEW v1.4: Professional Service Flag (suppresses salt alerts if true)
  hasProfessionalService?: boolean;
  
  // NEW v1.5: Sanitizer Type ("Chloramine Meltdown" Fix)
  // Chloramines (Ammonia + Chlorine) destroy standard resin 2x faster than chlorine
  sanitizerType?: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
  
  // Legacy field (now derived from visualHeight)
  capacity: number;           // Grain capacity (default 32000)
}

export type SoftenerAction = 
  | 'MONITOR' 
  | 'VALVE_REBUILD' 
  | 'RESIN_DETOX'
  | 'REBED_OR_REPLACE' 
  | 'REPLACE_UNIT'
  | 'UPGRADE_EFFICIENCY'
  | 'CARBON_REBED';           // NEW v1.2

export type SoftenerBadge = 
  | 'HEALTHY' 
  | 'SEAL_WEAR' 
  | 'RESIN_DEGRADED'
  | 'RESIN_FAILURE' 
  | 'MECHANICAL_FAILURE'
  | 'HIGH_WASTE'
  | 'BRINE_FAILURE'           // NEW v1.2
  | 'CARBON_EXPIRED'          // NEW v1.2
  | 'TOTALED';                // NEW v1.2

export interface SoftenerMetrics {
  odometer: number;           // Total regeneration cycles
  resinHealth: number;        // 0-100%
  saltUsageLbsPerMonth: number;
  regenIntervalDays: number;
  dailyLoadGrains: number;
  regensPerYear: number;
  isAnalog: boolean;          // NEW v1.1: Flag for UI display
  effectiveCapacity: number;  // NEW v1.1: Actual working capacity
}

export interface SoftenerRecommendation {
  action: SoftenerAction;
  badge: SoftenerBadge;
  reason: string;
}

export interface SoftenerResult {
  metrics: SoftenerMetrics;
  recommendation: SoftenerRecommendation;
  serviceMenu: ServiceMenuItem[];
  saltCalculator: SaltCalculator;
}

export interface ServiceMenuItem {
  id: string;
  name: string;
  trigger: string;
  price: number;
  pitch: string;
  priority: 'critical' | 'recommended' | 'optional';
}

export interface SaltCalculator {
  burnRateLbsPerMonth: number;
  daysUntilRefill: number;
  nextRefillDate: Date;
  monthlyBags40Lb: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const CONSTANTS = {
  // Clock A: Valve/Seal Limits (Cycles)
  SEAL_LIMIT: 600,            // Cycles before rebuild recommended
  MOTOR_LIMIT: 1500,          // Cycles before replacement

  // Clock B: Resin Decay Rates (% per year)
  // FIX v8.0: Modern 8-10% cross-link resin lasts 15-20 years on city water
  // Reduced base rates to reflect actual industry lifespan data
  CITY_WATER_DECAY: 6.0,          // Chlorine (reduced from 10.0)
  CITY_WATER_CARBON_DECAY: 3.0,   // Carbon filter protects (50% reduction)
  
  // FIX v8.0 "Chloramine Meltdown": Chloramine is the REAL killer
  // Chloramines (NH2Cl) are 2x more destructive than chlorine
  // - Swells rubber seals and O-rings
  // - Turns resin beads to mush
  // - Carbon helps but can't fully neutralize
  CITY_WATER_CHLORAMINE_DECAY: 12.0,         // Chloramine without carbon filter
  CITY_WATER_CHLORAMINE_CARBON_DECAY: 6.0,   // Carbon cuts damage in half
  
  WELL_WATER_DECAY: 12.0,         // Iron/sediment coating
  WELL_WATER_IRON_DECAY: 20.0,    // Iron staining = faster decay

  // Clock C: Salt — v1.2 SCALED BY SIZE
  SALT_KNEE: 6,               // NEW v1.2: 24k unit = 6 lbs/regen
  SALT_WAIST: 9,              // NEW v1.2: 32k unit = 9 lbs/regen
  SALT_CHEST: 15,             // NEW v1.2: 48k unit = 15 lbs/regen
  SALT_BAG_LBS: 40,           // Standard bag size
  ANALOG_WASTE_FACTOR: 1.3,   // NEW v1.1: Timers waste 30% more salt

  // Usage
  GALLONS_PER_PERSON_PER_DAY: 75,
  CAPACITY_SAFETY_FACTOR: 0.9,    // Reserve capacity
  CAPACITY_EFFICIENCY_FACTOR: 0.75, // NEW v1.1: 9lbs salt = 75% of rated

  // NEW v1.1: Timer Logic
  ANALOG_FIXED_INTERVAL_DAYS: 3.5,  // Analog timers regen every ~3.5 days
  DIGITAL_MAX_INTERVAL_DAYS: 14,    // Day override prevents bacteria

  // Visual Capacity Mapping
  CAPACITY_KNEE: 24000,
  CAPACITY_WAIST: 32000,
  CAPACITY_CHEST: 48000,

  // Service Pricing
  VALVE_REBUILD_COST: 350,
  RESIN_DETOX_COST: 199,
  RESIN_REBED_COST: 600,
  CARBON_REBED_COST: 300,         // NEW v1.2
  UNIT_REPLACEMENT_COST: 2500,
  
  // NEW v1.2: Financial Safety Caps
  MAX_REPAIR_CABINET: 300,        // FIX v1.3: Cabinet/big-box units (GE, Whirlpool)
  MAX_REPAIR_STANDARD: 500,       // FIX v1.3: Mid-range units
  MAX_REPAIR_PREMIUM: 800,        // FIX v1.3: Premium units (Kinetico, Fleck, etc.)
  CARBON_LIFE_YEARS: 5,           // Carbon media saturates after 5 years
};

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT INPUTS
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SOFTENER_INPUTS: SoftenerInputs = {
  ageYears: 5,
  hardnessGPG: 15,
  people: 3,
  isCityWater: true,
  hasCarbonFilter: false,
  visualHeight: 'WAIST',
  controlHead: 'DIGITAL',
  visualIron: false,
  carbonAgeYears: null,           // NEW v1.2
  saltLevelState: 'OK',           // NEW v1.2
  qualityTier: 'STANDARD',        // NEW v1.3: Default to mid-range
  capacity: 32000, // Legacy field, now derived from visualHeight
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Map Visual Height to Capacity
// ─────────────────────────────────────────────────────────────────────────────

function getRatedCapacity(visualHeight: VisualHeight): number {
  switch (visualHeight) {
    case 'KNEE': return CONSTANTS.CAPACITY_KNEE;
    case 'WAIST': return CONSTANTS.CAPACITY_WAIST;
    case 'CHEST': return CONSTANTS.CAPACITY_CHEST;
    default: return CONSTANTS.CAPACITY_WAIST;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Salt Per Regen (v1.2 Scaled by Tank Size)
// ─────────────────────────────────────────────────────────────────────────────

function getSaltPerRegen(visualHeight: VisualHeight): number {
  switch (visualHeight) {
    case 'KNEE': return CONSTANTS.SALT_KNEE;
    case 'WAIST': return CONSTANTS.SALT_WAIST;
    case 'CHEST': return CONSTANTS.SALT_CHEST;
    default: return CONSTANTS.SALT_WAIST;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSoftenerHealth(data: SoftenerInputs): SoftenerResult {
  const metrics = calculateMetrics(data);
  const recommendation = generateRecommendation(data, metrics);
  const serviceMenu = generateServiceMenu(data, metrics, recommendation);
  const saltCalculator = calculateSaltSchedule(data, metrics);

  return {
    metrics,
    recommendation,
    serviceMenu,
    saltCalculator,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOCK A: THE ODOMETER (Valve Seals)
// ─────────────────────────────────────────────────────────────────────────────

function calculateOdometer(data: SoftenerInputs): {
  dailyLoad: number;
  daysPerCycle: number;
  regensPerYear: number;
  currentOdometer: number;
  effectiveCapacity: number;
} {
  // --- 1. ESTABLISH CAPACITY (Visual Proxy) ---
  const ratedCapacity = getRatedCapacity(data.visualHeight);
  
  // PHYSICS PATCH v1.1: Effective Capacity
  // 9lbs salt only regenerates ~75% of rated capacity.
  // We use the *programmed* capacity to calculate cycles accurately.
  const effectiveCapacity = ratedCapacity * CONSTANTS.CAPACITY_EFFICIENCY_FACTOR;

  // Daily grain load = People × Gallons × Hardness
  const dailyLoad = data.people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * data.hardnessGPG;
  
  // Safety check to prevent divide by zero
  const safeLoad = Math.max(dailyLoad, 1);
  
  // --- 2. CALCULATE INTERVAL (With Timer Logic) ---
  // A. Theoretical (Metered) Interval
  let daysPerCycle = (effectiveCapacity * CONSTANTS.CAPACITY_SAFETY_FACTOR) / safeLoad;

  // B. Physics Corrections based on control head type
  if (data.controlHead === 'ANALOG') {
    // ANALOG PATCH v1.1: Timers are dumb. They regen every ~3.5 days.
    // Regardless of actual water usage
    daysPerCycle = CONSTANTS.ANALOG_FIXED_INTERVAL_DAYS;
  } else {
    // DIGITAL PATCH v1.1: Day override prevents bacteria (Max 14 days)
    // Even if water usage is low, modern units regen at least every 2 weeks
    daysPerCycle = Math.min(daysPerCycle, CONSTANTS.DIGITAL_MAX_INTERVAL_DAYS);
  }
  
  // Regenerations per year
  const regensPerYear = 365 / daysPerCycle;
  
  // Current odometer reading
  const currentOdometer = data.ageYears * regensPerYear;

  return {
    dailyLoad,
    daysPerCycle,
    regensPerYear,
    currentOdometer,
    effectiveCapacity,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOCK B: THE ENGINE (Resin Bed)
// ─────────────────────────────────────────────────────────────────────────────

function calculateResinHealth(data: SoftenerInputs): number {
  let decayRate: number;

  if (data.isCityWater) {
    // FIX v1.5 "Chloramine Meltdown": Check sanitizer type
    const isChloramine = data.sanitizerType === 'CHLORAMINE';
    
    if (data.hasCarbonFilter) {
      // v1.2: CARBON EXPIRY — Carbon only protects for first 5 years
      const carbonLife = CONSTANTS.CARBON_LIFE_YEARS;
      const carbonAge = data.carbonAgeYears ?? data.ageYears; // Assume same age as unit if unknown
      
      // Select base rates based on sanitizer type
      const protectedRate = isChloramine 
        ? CONSTANTS.CITY_WATER_CHLORAMINE_CARBON_DECAY 
        : CONSTANTS.CITY_WATER_CARBON_DECAY;
      const nakedRate = isChloramine 
        ? CONSTANTS.CITY_WATER_CHLORAMINE_DECAY 
        : CONSTANTS.CITY_WATER_DECAY;
      
      if (carbonAge <= carbonLife) {
        // Fully Protected — Carbon is fresh
        decayRate = protectedRate;
      } else {
        // Partially Protected — Weighted Average Decay
        // A 10yr old unit was protected for 5 years, naked for 5 years.
        const protectedYears = Math.min(carbonLife, data.ageYears);
        const nakedYears = Math.max(0, data.ageYears - carbonLife);
        
        // Calculate total damage points then average
        const totalDamage = (protectedYears * protectedRate) + (nakedYears * nakedRate);
        decayRate = totalDamage / data.ageYears;
      }
    } else {
      // No Carbon = full exposure to sanitizer
      // FIX v1.5: Chloramine is 2x more destructive than chlorine
      decayRate = isChloramine 
        ? CONSTANTS.CITY_WATER_CHLORAMINE_DECAY 
        : CONSTANTS.CITY_WATER_DECAY;
    }
  } else {
    // Well Water - Check for iron staining
    // NEW v1.1: If Iron is present, it coats resin much faster
    decayRate = data.visualIron 
      ? CONSTANTS.WELL_WATER_IRON_DECAY 
      : CONSTANTS.WELL_WATER_DECAY;
  }

  // Resin health degrades linearly with age
  const resinHealth = Math.max(0, 100 - (data.ageYears * decayRate));
  
  return resinHealth;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOCK C: THE FUEL (Salt)
// ─────────────────────────────────────────────────────────────────────────────

function calculateSaltUsage(data: SoftenerInputs, daysPerCycle: number): number {
  // Lbs per month = (30 days / days per cycle) × lbs per regen
  const regensPerMonth = 30 / daysPerCycle;
  
  // v1.2: SALT SCALING — Use tank-size-appropriate salt amount
  const saltPerRegen = getSaltPerRegen(data.visualHeight);
  
  // NEW v1.1: Timers waste salt. Apply waste factor to analog units.
  const wasteFactor = data.controlHead === 'ANALOG' 
    ? CONSTANTS.ANALOG_WASTE_FACTOR 
    : 1.0;
  
  const lbsPerMonth = regensPerMonth * saltPerRegen * wasteFactor;
  
  return lbsPerMonth;
}

function calculateSaltSchedule(data: SoftenerInputs, metrics: SoftenerMetrics): SaltCalculator {
  // NEW v1.4: Suppress salt alerts for users with professional service (Culligan, Kinetico, etc.)
  if (data.hasProfessionalService) {
    return {
      burnRateLbsPerMonth: 0,
      daysUntilRefill: Infinity,
      nextRefillDate: new Date('9999-12-31'),  // Never - service handles it
      monthlyBags40Lb: 0,
    };
  }
  
  const burnRate = metrics.saltUsageLbsPerMonth;
  
  // Assume 120 lbs tank capacity (3 bags worth)
  const tankCapacityLbs = 120;
  const daysOfSalt = (tankCapacityLbs / burnRate) * 30;
  
  const nextRefillDate = new Date();
  nextRefillDate.setDate(nextRefillDate.getDate() + Math.round(daysOfSalt));

  return {
    burnRateLbsPerMonth: Math.round(burnRate),
    daysUntilRefill: Math.round(daysOfSalt),
    nextRefillDate,
    monthlyBags40Lb: Math.ceil(burnRate / CONSTANTS.SALT_BAG_LBS),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// METRICS AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────

function calculateMetrics(data: SoftenerInputs): SoftenerMetrics {
  const odometer = calculateOdometer(data);
  const resinHealth = calculateResinHealth(data);
  const saltUsage = calculateSaltUsage(data, odometer.daysPerCycle);

  return {
    odometer: Math.round(odometer.currentOdometer),
    resinHealth: Math.round(resinHealth),
    saltUsageLbsPerMonth: Math.round(saltUsage),
    regenIntervalDays: Math.round(odometer.daysPerCycle * 10) / 10,
    dailyLoadGrains: Math.round(odometer.dailyLoad),
    regensPerYear: Math.round(odometer.regensPerYear),
    isAnalog: data.controlHead === 'ANALOG',
    effectiveCapacity: Math.round(odometer.effectiveCapacity),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function generateRecommendation(
  data: SoftenerInputs, 
  metrics: SoftenerMetrics
): SoftenerRecommendation {
  let action: SoftenerAction = 'MONITOR';
  let badge: SoftenerBadge = 'HEALTHY';
  let reason = 'System cycling normally.';

  // Precalculate daily load for efficiency check
  const dailyLoad = data.people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * data.hardnessGPG;

  // v1.2: Rule 0 — BRINE FAILURE CHECK (Highest Priority Visual Failure)
  // If the brine tank is full of water, the unit is not regenerating.
  if (data.saltLevelState === 'HIGH_WATER') {
    return {
      action: 'VALVE_REBUILD',
      badge: 'BRINE_FAILURE',
      reason: 'Salt tank flooded. Injector clogged or brine piston failed.',
    };
  }

  // Rule A: Resin Failure (Mush/Iron) — HIGHEST PRIORITY
  if (metrics.resinHealth < 40) {
    action = 'REBED_OR_REPLACE';
    badge = 'RESIN_FAILURE';
    // NEW v1.1: Different messaging based on water source
    reason = data.isCityWater
      ? 'Chlorine has turned resin to mush (Irreversible).'
      : 'Iron fouling has suffocated the resin bed.';
  }
  // Rule B: Motor/Body End of Life
  else if (metrics.odometer > CONSTANTS.MOTOR_LIMIT) {
    action = 'REPLACE_UNIT';
    badge = 'MECHANICAL_FAILURE';
    reason = 'Valve motor wear exceeds repair value.';
  }
  // Rule C: Seal Failure (Maintenance)
  else if (metrics.odometer > CONSTANTS.SEAL_LIMIT) {
    action = 'VALVE_REBUILD';
    badge = 'SEAL_WEAR';
    reason = `Odometer: ${metrics.odometer} cycles. Seals likely leaking.`;
  }
  // Rule D: Resin Degraded (Detox opportunity)
  // SNAKE OIL FIX v1.1: Only trigger RESIN_DETOX for Well Water!
  // Chlorine damage (city water) cannot be fixed by phosphoric acid cleaners.
  // Detox only works by stripping Iron buildup.
  else if (metrics.resinHealth < 75 && metrics.resinHealth >= 40 && !data.isCityWater) {
    action = 'RESIN_DETOX';
    badge = 'RESIN_DEGRADED';
    reason = 'Iron buildup detected. Chemical detox needed.';
  }
  // v1.2: Rule D2 — Carbon Expired (city water with old carbon)
  else if (data.isCityWater && data.hasCarbonFilter) {
    const carbonAge = data.carbonAgeYears ?? data.ageYears;
    if (carbonAge >= CONSTANTS.CARBON_LIFE_YEARS) {
      action = 'CARBON_REBED';
      badge = 'CARBON_EXPIRED';
      reason = `Carbon filter expired (${carbonAge} years). Chlorine now attacking resin.`;
    }
  }
  // Rule E: High Waste (The "Analog" Upgrade or Undersized)
  // NEW v1.1: Catch analog units that are wasting salt
  if (action === 'MONITOR' && (
    metrics.regenIntervalDays < 3.0 || 
    (data.controlHead === 'ANALOG' && dailyLoad < 3000)
  )) {
    action = 'UPGRADE_EFFICIENCY';
    badge = 'HIGH_WASTE';
    reason = data.controlHead === 'ANALOG'
      ? 'Unit regenerates based on Time, not Usage. Wasting salt.'
      : 'Unit regenerating every 2 days. Wasting water and salt.';
  }

  return { action, badge, reason };
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE MENU GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

function generateServiceMenu(
  data: SoftenerInputs,
  metrics: SoftenerMetrics,
  recommendation: SoftenerRecommendation
): ServiceMenuItem[] {
  const menu: ServiceMenuItem[] = [];
  let totalRepairCost = 0;

  // v1.2: BRINE FAILURE (Highest Priority)
  if (data.saltLevelState === 'HIGH_WATER') {
    totalRepairCost += CONSTANTS.VALVE_REBUILD_COST;
    menu.push({
      id: 'brine-repair',
      name: 'Brine System Repair',
      trigger: 'Salt tank flooded (HIGH_WATER)',
      price: CONSTANTS.VALVE_REBUILD_COST,
      pitch: 'Your salt tank is flooded with water. The brine injector is clogged or the piston failed. Unit cannot regenerate until fixed.',
      priority: 'critical',
    });
  }

  // Valve Rebuild
  if (metrics.odometer > CONSTANTS.SEAL_LIMIT && metrics.odometer < CONSTANTS.MOTOR_LIMIT) {
    totalRepairCost += CONSTANTS.VALVE_REBUILD_COST;
    menu.push({
      id: 'valve-rebuild',
      name: 'Valve Rebuild',
      trigger: `Odometer > ${CONSTANTS.SEAL_LIMIT} cycles`,
      price: CONSTANTS.VALVE_REBUILD_COST,
      pitch: `Your softener transmission has shifted ${metrics.odometer} times. The rubber seals are rated for ${CONSTANTS.SEAL_LIMIT}. It is likely leaking water down the drain 24/7.`,
      priority: recommendation.action === 'VALVE_REBUILD' ? 'critical' : 'recommended',
    });
  }

  // Resin Detox - ONLY for well water, and only if resin is salvageable (v1.1 Snake Oil Fix)
  // Below 50% = too degraded for detox to help, go straight to re-bed
  if (metrics.resinHealth >= 50 && metrics.resinHealth < 75 && !data.isCityWater) {
    totalRepairCost += CONSTANTS.RESIN_DETOX_COST;
    menu.push({
      id: 'resin-detox',
      name: 'Resin Detox',
      trigger: 'Iron Buildup (Well Water)',
      price: CONSTANTS.RESIN_DETOX_COST,
      pitch: 'Your resin beads are coated in iron deposits. A phosphoric acid detox strips the iron and restores exchange capacity.',
      priority: recommendation.action === 'RESIN_DETOX' ? 'critical' : 'recommended',
    });
  }

  // Resin Rebed
  if (metrics.resinHealth < 50) {
    totalRepairCost += CONSTANTS.RESIN_REBED_COST;
    menu.push({
      id: 'resin-rebed',
      name: 'Resin Re-Bed',
      trigger: 'Resin Health < 50%',
      price: CONSTANTS.RESIN_REBED_COST,
      pitch: data.isCityWater
        ? 'Chlorine has destroyed your resin (Mush). Fresh resin is the only fix.'
        : 'Iron fouling has exceeded what detox can fix. Fresh resin restores full performance.',
      priority: recommendation.action === 'REBED_OR_REPLACE' ? 'critical' : 'recommended',
    });
  }

  // v1.2: Carbon Rebed (for expired carbon filters on city water)
  const carbonAge = data.carbonAgeYears ?? data.ageYears;
  if (data.isCityWater && data.hasCarbonFilter && carbonAge >= CONSTANTS.CARBON_LIFE_YEARS) {
    totalRepairCost += CONSTANTS.CARBON_REBED_COST;
    menu.push({
      id: 'carbon-rebed',
      name: 'Carbon Media Replacement',
      trigger: `Carbon filter expired (${carbonAge} years)`,
      price: CONSTANTS.CARBON_REBED_COST,
      pitch: 'Your carbon filter has been protecting your resin, but it is now saturated. Fresh carbon restores chlorine protection.',
      priority: recommendation.action === 'CARBON_REBED' ? 'critical' : 'recommended',
    });
  }

  // Carbon Filter (Upsell for unprotected city water)
  if (data.isCityWater && !data.hasCarbonFilter) {
    menu.push({
      id: 'carbon-filter',
      name: 'Carbon Pre-Filter',
      trigger: 'City water without chlorine protection',
      price: 299,
      pitch: 'City chlorine is cutting your resin life in half. A carbon filter doubles the lifespan of your softener.',
      priority: metrics.resinHealth < 60 ? 'critical' : 'optional',
    });
  }

  // Digital Upgrade (for analog units)
  if (data.controlHead === 'ANALOG') {
    menu.push({
      id: 'digital-upgrade',
      name: 'Digital Control Head',
      trigger: 'Analog timer wasting salt',
      price: 450,
      pitch: 'Your timer regenerates every 3.5 days regardless of usage. A digital head regenerates on-demand, cutting salt use by 30%.',
      priority: recommendation.action === 'UPGRADE_EFFICIENCY' ? 'critical' : 'recommended',
    });
  }

  // FIX v1.3: TOTALED RULE — Dynamic threshold based on unit quality tier ("Disposable Softener" Fix)
  // A $500 cabinet softener shouldn't get a $350 repair recommendation.
  const getTotaledThreshold = (tier: SoftenerQualityTier | undefined): number => {
    switch (tier) {
      case 'CABINET': return CONSTANTS.MAX_REPAIR_CABINET;   // $300
      case 'PREMIUM': return CONSTANTS.MAX_REPAIR_PREMIUM;   // $800
      default: return CONSTANTS.MAX_REPAIR_STANDARD;         // $500
    }
  };
  const totaledLimit = getTotaledThreshold(data.qualityTier);
  
  if (totalRepairCost > totaledLimit) {
    return [{
      id: 'replacement-totaled',
      name: 'Unit Replacement (Recommended)',
      trigger: `Cumulative repairs ($${totalRepairCost}) exceed ${Math.round(totaledLimit / CONSTANTS.UNIT_REPLACEMENT_COST * 100)}% of ${data.qualityTier || 'STANDARD'} unit value`,
      price: CONSTANTS.UNIT_REPLACEMENT_COST,
      pitch: `Your ${data.qualityTier === 'CABINET' ? 'cabinet-style' : data.qualityTier === 'PREMIUM' ? 'premium' : ''} softener needs $${totalRepairCost} in repairs. Threshold for this unit tier is $${totaledLimit}. Replacement is the smarter investment.`,
      priority: 'critical',
    }];
  }

  // Unit Replacement (for end-of-life units)
  if (metrics.odometer > CONSTANTS.MOTOR_LIMIT || metrics.resinHealth < 30) {
    menu.push({
      id: 'replacement',
      name: 'Unit Replacement',
      trigger: 'End of serviceable life',
      price: CONSTANTS.UNIT_REPLACEMENT_COST,
      pitch: 'Repair costs exceed replacement value. A new high-efficiency unit will pay for itself in salt and water savings.',
      priority: 'critical',
    });
  }

  return menu;
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Estimate Remaining Life
// ─────────────────────────────────────────────────────────────────────────────

export function estimateSoftenerLifespan(data: SoftenerInputs): {
  resinDeathYears: number;
  mechanicalDeathYears: number;
  effectiveDeathYears: number;
} {
  const odometer = calculateOdometer(data);
  
  // Resin death: when resinHealth hits 40%
  // v1.2: Use weighted carbon decay calculation
  let resinDecayRate: number;
  if (data.isCityWater) {
    if (data.hasCarbonFilter) {
      const carbonLife = CONSTANTS.CARBON_LIFE_YEARS;
      const carbonAge = data.carbonAgeYears ?? data.ageYears;
      
      if (carbonAge <= carbonLife) {
        resinDecayRate = CONSTANTS.CITY_WATER_CARBON_DECAY;
      } else {
        // Weighted average for remaining lifespan calculation
        const protectedYears = Math.min(carbonLife, data.ageYears);
        const nakedYears = Math.max(0, data.ageYears - carbonLife);
        const totalDamage = (protectedYears * CONSTANTS.CITY_WATER_CARBON_DECAY) + 
                           (nakedYears * CONSTANTS.CITY_WATER_DECAY);
        resinDecayRate = totalDamage / data.ageYears;
      }
    } else {
      resinDecayRate = CONSTANTS.CITY_WATER_DECAY;
    }
  } else {
    resinDecayRate = data.visualIron 
      ? CONSTANTS.WELL_WATER_IRON_DECAY 
      : CONSTANTS.WELL_WATER_DECAY;
  }
  const resinDeathYears = (100 - 40) / resinDecayRate; // Years until 40% health

  // Mechanical death: when odometer hits MOTOR_LIMIT
  const cyclesRemaining = Math.max(0, CONSTANTS.MOTOR_LIMIT - odometer.currentOdometer);
  const mechanicalDeathYears = data.ageYears + (cyclesRemaining / odometer.regensPerYear);

  // Effective death: whichever comes first
  const effectiveDeathYears = Math.min(resinDeathYears, mechanicalDeathYears);

  return {
    resinDeathYears: Math.round(resinDeathYears * 10) / 10,
    mechanicalDeathYears: Math.round(mechanicalDeathYears * 10) / 10,
    effectiveDeathYears: Math.round(effectiveDeathYears * 10) / 10,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY: Compare GPG Impact
// ─────────────────────────────────────────────────────────────────────────────

export function compareHardnessImpact(
  baseGPG: number, 
  compareGPG: number, 
  people: number
): {
  baseRegensPerYear: number;
  compareRegensPerYear: number;
  agingMultiplier: number;
} {
  // Use effective capacity (v1.1 fix)
  const effectiveCapacity = CONSTANTS.CAPACITY_WAIST * CONSTANTS.CAPACITY_EFFICIENCY_FACTOR;
  
  const baseLoad = people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * baseGPG;
  const compareLoad = people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * compareGPG;
  
  const baseDays = (effectiveCapacity * CONSTANTS.CAPACITY_SAFETY_FACTOR) / baseLoad;
  const compareDays = (effectiveCapacity * CONSTANTS.CAPACITY_SAFETY_FACTOR) / compareLoad;
  
  const baseRegens = 365 / baseDays;
  const compareRegens = 365 / compareDays;

  return {
    baseRegensPerYear: Math.round(baseRegens),
    compareRegensPerYear: Math.round(compareRegens),
    agingMultiplier: Math.round((compareRegens / baseRegens) * 10) / 10,
  };
}
