/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  SOFTENER FORENSIC ALGORITHM v1.0                                         ║
 * ║  "The Odometer" — Predicting softener failure from usage, not age         ║
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

export interface SoftenerInputs {
  ageYears: number;           // How old the unit is
  hardnessGPG: number;        // Water hardness (Grains Per Gallon)
  people: number;             // Household occupancy
  isCityWater: boolean;       // True = Chlorine Risk
  hasCarbonFilter: boolean;   // True = Shield Up (protects resin)
  capacity: number;           // Grain capacity (default 32000)
}

export type SoftenerAction = 
  | 'MONITOR' 
  | 'VALVE_REBUILD' 
  | 'RESIN_DETOX'
  | 'REBED_OR_REPLACE' 
  | 'REPLACE_UNIT'
  | 'UPGRADE_EFFICIENCY';

export type SoftenerBadge = 
  | 'HEALTHY' 
  | 'SEAL_WEAR' 
  | 'RESIN_DEGRADED'
  | 'RESIN_FAILURE' 
  | 'MECHANICAL_FAILURE'
  | 'HIGH_WASTE';

export interface SoftenerMetrics {
  odometer: number;           // Total regeneration cycles
  resinHealth: number;        // 0-100%
  saltUsageLbsPerMonth: number;
  regenIntervalDays: number;
  dailyLoadGrains: number;
  regensPerYear: number;
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
  CITY_WATER_DECAY: 10.0,     // Chlorine kills resin
  CITY_WATER_CARBON_DECAY: 5.0, // Carbon filter protects
  WELL_WATER_DECAY: 12.0,     // Iron/sediment coating

  // Clock C: Salt
  SALT_PER_REGEN_LBS: 9,      // Average lbs per regeneration
  SALT_BAG_LBS: 40,           // Standard bag size

  // Usage
  GALLONS_PER_PERSON_PER_DAY: 75,
  CAPACITY_SAFETY_FACTOR: 0.9, // Reserve capacity

  // Service Pricing
  VALVE_REBUILD_COST: 350,
  RESIN_DETOX_COST: 199,
  RESIN_REBED_COST: 600,
  UNIT_REPLACEMENT_COST: 2500,
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
  capacity: 32000,
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CALCULATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function calculateSoftenerHealth(data: SoftenerInputs): SoftenerResult {
  const metrics = calculateMetrics(data);
  const recommendation = generateRecommendation(data, metrics);
  const serviceMenu = generateServiceMenu(data, metrics, recommendation);
  const saltCalculator = calculateSaltSchedule(metrics);

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
} {
  // Daily grain load = People × Gallons × Hardness
  const dailyLoad = data.people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * data.hardnessGPG;
  
  // Safety check to prevent divide by zero
  const safeLoad = Math.max(dailyLoad, 1);
  
  // Days between regenerations (with safety factor)
  const daysPerCycle = (data.capacity * CONSTANTS.CAPACITY_SAFETY_FACTOR) / safeLoad;
  
  // Regenerations per year
  const regensPerYear = 365 / daysPerCycle;
  
  // Current odometer reading
  const currentOdometer = data.ageYears * regensPerYear;

  return {
    dailyLoad,
    daysPerCycle,
    regensPerYear,
    currentOdometer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOCK B: THE ENGINE (Resin Bed)
// ─────────────────────────────────────────────────────────────────────────────

function calculateResinHealth(data: SoftenerInputs): number {
  let decayRate: number;

  if (data.isCityWater) {
    // Chlorine kills resin. Carbon blocks Chlorine.
    // No Carbon = 10% rot/year. With Carbon = 5% rot/year.
    decayRate = data.hasCarbonFilter 
      ? CONSTANTS.CITY_WATER_CARBON_DECAY 
      : CONSTANTS.CITY_WATER_DECAY;
  } else {
    // Well Water (Iron/Sediment) - 12% decay/year
    decayRate = CONSTANTS.WELL_WATER_DECAY;
  }

  // Resin health degrades linearly with age
  const resinHealth = Math.max(0, 100 - (data.ageYears * decayRate));
  
  return resinHealth;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOCK C: THE FUEL (Salt)
// ─────────────────────────────────────────────────────────────────────────────

function calculateSaltUsage(daysPerCycle: number): number {
  // Lbs per month = (30 days / days per cycle) × lbs per regen
  const regensPerMonth = 30 / daysPerCycle;
  const lbsPerMonth = regensPerMonth * CONSTANTS.SALT_PER_REGEN_LBS;
  
  return lbsPerMonth;
}

function calculateSaltSchedule(metrics: SoftenerMetrics): SaltCalculator {
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
  const saltUsage = calculateSaltUsage(odometer.daysPerCycle);

  return {
    odometer: Math.round(odometer.currentOdometer),
    resinHealth: Math.round(resinHealth),
    saltUsageLbsPerMonth: Math.round(saltUsage),
    regenIntervalDays: Math.round(odometer.daysPerCycle * 10) / 10,
    dailyLoadGrains: Math.round(odometer.dailyLoad),
    regensPerYear: Math.round(odometer.regensPerYear),
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

  // Rule A: Resin Failure (Mush) — HIGHEST PRIORITY
  if (metrics.resinHealth < 40) {
    action = 'REBED_OR_REPLACE';
    badge = 'RESIN_FAILURE';
    reason = data.isCityWater && !data.hasCarbonFilter
      ? 'Chlorine oxidation has destroyed resin beads (Mush). Capacity lost.'
      : 'Resin bed life exceeded. Salt is being wasted.';
  }
  // Rule B: Motor/Body End of Life
  else if (metrics.odometer > CONSTANTS.MOTOR_LIMIT) {
    action = 'REPLACE_UNIT';
    badge = 'MECHANICAL_FAILURE';
    reason = 'Valve motor and body wear exceed cost-to-repair.';
  }
  // Rule C: Seal Failure (Maintenance)
  else if (metrics.odometer > CONSTANTS.SEAL_LIMIT) {
    action = 'VALVE_REBUILD';
    badge = 'SEAL_WEAR';
    reason = `Odometer reads ${metrics.odometer} cycles. Piston seals likely leaking.`;
  }
  // Rule D: Resin Degraded (Detox opportunity)
  else if (metrics.resinHealth < 75 && metrics.resinHealth >= 40) {
    action = 'RESIN_DETOX';
    badge = 'RESIN_DEGRADED';
    reason = 'Resin beads are coated in mineral buildup. Chemical detox can restore flow.';
  }
  // Rule E: Undersized (Inefficient)
  else if (metrics.regenIntervalDays < 3.0) {
    action = 'UPGRADE_EFFICIENCY';
    badge = 'HIGH_WASTE';
    reason = 'Unit regenerating every 2 days. Wasting water and salt.';
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

  // Valve Rebuild
  if (metrics.odometer > CONSTANTS.SEAL_LIMIT && metrics.odometer < CONSTANTS.MOTOR_LIMIT) {
    menu.push({
      id: 'valve-rebuild',
      name: 'Valve Rebuild',
      trigger: `Odometer > ${CONSTANTS.SEAL_LIMIT} cycles`,
      price: CONSTANTS.VALVE_REBUILD_COST,
      pitch: `Your softener transmission has shifted ${metrics.odometer} times. The rubber seals are rated for ${CONSTANTS.SEAL_LIMIT}. It is likely leaking water down the drain 24/7.`,
      priority: recommendation.action === 'VALVE_REBUILD' ? 'critical' : 'recommended',
    });
  }

  // Resin Detox
  if (metrics.resinHealth >= 40 && metrics.resinHealth < 75) {
    menu.push({
      id: 'resin-detox',
      name: 'Resin Detox',
      trigger: 'Resin Health 40-75%',
      price: CONSTANTS.RESIN_DETOX_COST,
      pitch: 'Your resin beads are coated in city grime. A chemical detox restores factory flow rates.',
      priority: recommendation.action === 'RESIN_DETOX' ? 'critical' : 'recommended',
    });
  }

  // Resin Rebed
  if (metrics.resinHealth < 50) {
    menu.push({
      id: 'resin-rebed',
      name: 'Resin Re-Bed',
      trigger: 'Resin Health < 50%',
      price: CONSTANTS.RESIN_REBED_COST,
      pitch: 'Your resin has lost over half its capacity. The unit burns salt but doesn\'t soften water. Fresh resin restores full performance.',
      priority: recommendation.action === 'REBED_OR_REPLACE' ? 'critical' : 'recommended',
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

  // Unit Replacement
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
  const resinDecayRate = data.isCityWater
    ? (data.hasCarbonFilter ? CONSTANTS.CITY_WATER_CARBON_DECAY : CONSTANTS.CITY_WATER_DECAY)
    : CONSTANTS.WELL_WATER_DECAY;
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
  const capacity = 32000;
  
  const baseLoad = people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * baseGPG;
  const compareLoad = people * CONSTANTS.GALLONS_PER_PERSON_PER_DAY * compareGPG;
  
  const baseDays = (capacity * 0.9) / baseLoad;
  const compareDays = (capacity * 0.9) / compareLoad;
  
  const baseRegens = 365 / baseDays;
  const compareRegens = 365 / compareDays;

  return {
    baseRegensPerYear: Math.round(baseRegens),
    compareRegensPerYear: Math.round(compareRegens),
    agingMultiplier: Math.round((compareRegens / baseRegens) * 10) / 10,
  };
}
