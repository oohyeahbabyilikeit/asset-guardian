/**
 * Unit Type Content Maps
 * Centralized content definitions for TANK, TANKLESS, and HYBRID water heaters.
 * This ensures all UI components display unit-appropriate terminology and features.
 */

import { FuelType } from './opterraAlgorithm';

export type UnitCategory = 'TANK' | 'TANKLESS' | 'HYBRID';

/**
 * Determine unit category from fuel type
 */
export function getUnitCategory(fuelType: FuelType): UnitCategory {
  if (fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC') {
    return 'TANKLESS';
  }
  if (fuelType === 'HYBRID') {
    return 'HYBRID';
  }
  return 'TANK';
}

/**
 * Check if unit is tankless
 */
export function isTankless(fuelType: FuelType): boolean {
  return fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
}

/**
 * Check if unit is hybrid/heat pump
 */
export function isHybrid(fuelType: FuelType): boolean {
  return fuelType === 'HYBRID';
}

/**
 * Service types by unit category
 */
export const SERVICE_TYPES = {
  TANK: {
    primary: { id: 'flush', label: 'Tank Flush', verb: 'flush', pastTense: 'flushed' },
    secondary: { id: 'anode_replacement', label: 'Anode Replacement', verb: 'replace anode', pastTense: 'anode replaced' },
    eventTypes: ['flush', 'anode_replacement', 'inspection', 'repair', 'prv_install', 'exp_tank_install'] as const,
  },
  TANKLESS: {
    primary: { id: 'descale', label: 'Descaling', verb: 'descale', pastTense: 'descaled' },
    secondary: { id: 'inlet_filter', label: 'Inlet Filter Clean', verb: 'clean filter', pastTense: 'filter cleaned' },
    eventTypes: ['descale', 'inlet_filter', 'isolation_valve_install', 'igniter_service', 'flame_rod', 'inspection', 'repair'] as const,
  },
  HYBRID: {
    primary: { id: 'air_filter', label: 'Air Filter Service', verb: 'clean air filter', pastTense: 'air filter cleaned' },
    secondary: { id: 'condensate_clear', label: 'Condensate Drain Clear', verb: 'clear condensate', pastTense: 'condensate cleared' },
    eventTypes: ['air_filter', 'condensate_clear', 'compressor_service', 'flush', 'anode_replacement', 'inspection', 'repair'] as const,
  },
} as const;

/**
 * Get service types for a unit
 */
export function getServiceTypes(fuelType: FuelType) {
  const category = getUnitCategory(fuelType);
  return SERVICE_TYPES[category];
}

/**
 * CTA Labels by unit type and urgency
 */
export const CTA_LABELS = {
  TANK: {
    serviceOverdue: "Time to Flush Your Tank",
    serviceDueSoon: "Schedule Your Flush",
    critical: "View Safety Recommendations",
    replace: "Show Me My Options",
    service: "View Service Options",
    optimal: "View Maintenance Plan",
    default: "Explore My Options",
  },
  TANKLESS: {
    serviceOverdue: "Time to Descale",
    serviceDueSoon: "Schedule Descaling",
    critical: "View Safety Recommendations",
    replace: "Show Me My Options",
    service: "View Service Options",
    optimal: "View Maintenance Plan",
    default: "Explore My Options",
  },
  HYBRID: {
    serviceOverdue: "Air Filter Service Needed",
    serviceDueSoon: "Schedule Filter Service",
    critical: "View Safety Recommendations",
    replace: "Show Me My Options",
    service: "View Service Options",
    optimal: "View Maintenance Plan",
    default: "Explore My Options",
  },
} as const;

/**
 * Get CTA label for unit
 */
export function getCTALabel(
  fuelType: FuelType,
  situation: 'serviceOverdue' | 'serviceDueSoon' | 'critical' | 'replace' | 'service' | 'optimal' | 'default'
): string {
  const category = getUnitCategory(fuelType);
  return CTA_LABELS[category][situation];
}

/**
 * Stress factor definitions by unit type
 */
export const STRESS_FACTORS = {
  TANK: {
    pressure: {
      label: "Water Pressure",
      icon: "Gauge",
      descriptions: {
        elevated: "Water pressure above 70 PSI accelerates wear on tank walls and fittings",
        critical: "Dangerously high pressure stresses the tank beyond design limits",
      },
      remedy: "Install a Pressure Reducing Valve (PRV) set to 55-60 PSI",
      lifespanBenefit: "+2-4 years",
    },
    sediment: {
      label: "Sediment Buildup",
      icon: "Layers",
      descriptions: {
        elevated: "Mineral buildup creates thermal barrier, causing overheating",
        critical: "Heavy sediment has damaged the tank bottom — flushing risks leaks",
      },
      remedy: "Schedule annual tank flushes (every 6 months in hard water areas)",
      lifespanBenefit: "+3-5 years",
    },
    anodeDepletion: {
      label: "Anode Depletion",
      icon: "Shield",
      descriptions: {
        elevated: "Sacrificial anode is depleted, reducing corrosion protection",
        critical: "Anode is completely depleted — tank has been corroding directly",
      },
      remedy: "Replace anode rod every 3-5 years (or use powered anode)",
      lifespanBenefit: "+5-8 years",
    },
    thermalExpansion: {
      label: "Thermal Expansion",
      icon: "Maximize2",
      descriptions: {
        elevated: "Without expansion tank, pressure spikes occur every heating cycle",
        critical: "Chronic pressure cycling has fatigued tank walls",
      },
      remedy: "Install an expansion tank with your water heater",
      lifespanBenefit: "+2-3 years",
    },
    temperature: {
      label: "Temperature Stress",
      icon: "Thermometer",
      descriptions: {
        elevated: "Operating above 130°F accelerates corrosion and scaling",
        critical: "Extreme temperature settings degrading components",
      },
      remedy: "Set unit to 120°F — safer and extends equipment life",
      lifespanBenefit: "+1-2 years",
    },
    recirculation: {
      label: "Recirculation Loop",
      icon: "RefreshCw",
      descriptions: {
        elevated: "Continuous recirculation increases thermal cycling stress",
        critical: "24/7 recirculation causing excessive wear",
      },
      remedy: "Add timer or demand-based control to recirculation pump",
      lifespanBenefit: "+2-3 years",
    },
  },
  TANKLESS: {
    scale: {
      label: "Scale Buildup",
      icon: "Layers",
      descriptions: {
        elevated: "Mineral deposits reducing heat exchanger efficiency",
        critical: "Heavy scale blocking heat exchanger — descaling critical",
      },
      remedy: "Annual descaling with isolation valves (or install valves first)",
      lifespanBenefit: "+5-8 years",
    },
    flowRestriction: {
      label: "Flow Restriction",
      icon: "Droplets",
      descriptions: {
        elevated: "Flow rate reduced from scale or clogged inlet filter",
        critical: "Severe flow loss — unit cannot meet demand",
      },
      remedy: "Clean inlet filter and descale heat exchanger",
      lifespanBenefit: "+3-5 years",
    },
    isolationValves: {
      label: "Isolation Valves",
      icon: "Wrench",
      descriptions: {
        elevated: "Missing isolation valves make descaling difficult",
        critical: "Cannot service unit without isolation valves — install required",
      },
      remedy: "Install service isolation valves ($200-400)",
      lifespanBenefit: "+5-10 years (enables maintenance)",
    },
    igniterHealth: {
      label: "Igniter Health",
      icon: "Flame",
      descriptions: {
        elevated: "Igniter showing wear — ignition may become unreliable",
        critical: "Igniter failing — unit may stop working",
      },
      remedy: "Replace igniter assembly",
      lifespanBenefit: "Prevents failure",
    },
    flameRod: {
      label: "Flame Sensor",
      icon: "Zap",
      descriptions: {
        elevated: "Flame rod buildup affecting flame detection",
        critical: "Flame rod failing — causing error codes and shutdowns",
      },
      remedy: "Clean or replace flame sensor rod",
      lifespanBenefit: "Prevents lockouts",
    },
    ventStatus: {
      label: "Vent Condition",
      icon: "Wind",
      descriptions: {
        elevated: "Vent showing restriction — efficiency reduced",
        critical: "Vent obstruction — safety risk and error codes",
      },
      remedy: "Inspect and clear vent system",
      lifespanBenefit: "+2-3 years",
    },
    recirculationFatigue: {
      label: "Recirculation Fatigue",
      icon: "RefreshCw",
      descriptions: {
        elevated: "Continuous recirculation increasing heat exchanger cycles",
        critical: "24/7 recirculation causing excessive wear on heat exchanger",
      },
      remedy: "Add timer or demand-based control to recirculation",
      lifespanBenefit: "+3-5 years",
    },
  },
  HYBRID: {
    airFilter: {
      label: "Air Filter Status",
      icon: "Wind",
      descriptions: {
        elevated: "Air filter restricting airflow — efficiency reduced",
        critical: "Clogged air filter — compressor working overtime",
      },
      remedy: "Clean or replace air filter quarterly",
      lifespanBenefit: "+3-5 years",
    },
    condensateDrain: {
      label: "Condensate Drain",
      icon: "Droplets",
      descriptions: {
        elevated: "Condensate drain partially blocked",
        critical: "Condensate backup — water damage and compressor risk",
      },
      remedy: "Clear condensate drain line monthly",
      lifespanBenefit: "+2-3 years",
    },
    compressorHealth: {
      label: "Compressor Health",
      icon: "Cpu",
      descriptions: {
        elevated: "Compressor showing signs of wear",
        critical: "Compressor failing — heat pump mode compromised",
      },
      remedy: "Professional compressor service",
      lifespanBenefit: "Prevents failure",
    },
    // Hybrid also has tank stressors (inherits from tank)
    sediment: {
      label: "Tank Sediment",
      icon: "Layers",
      descriptions: {
        elevated: "Mineral buildup in tank section",
        critical: "Heavy sediment affecting heating efficiency",
      },
      remedy: "Annual tank flush",
      lifespanBenefit: "+2-3 years",
    },
    anodeDepletion: {
      label: "Anode Depletion",
      icon: "Shield",
      descriptions: {
        elevated: "Sacrificial anode depleting",
        critical: "Anode depleted — tank corroding",
      },
      remedy: "Replace anode rod every 3-5 years",
      lifespanBenefit: "+3-5 years",
    },
    thermalExpansion: {
      label: "Thermal Expansion",
      icon: "Maximize2",
      descriptions: {
        elevated: "Missing expansion tank causing pressure spikes",
        critical: "Chronic pressure cycling stressing tank",
      },
      remedy: "Install expansion tank",
      lifespanBenefit: "+2-3 years",
    },
  },
} as const;

/**
 * Get stress factors for a unit type
 */
export function getStressFactors(fuelType: FuelType) {
  const category = getUnitCategory(fuelType);
  return STRESS_FACTORS[category];
}

/**
 * Tier display features by unit type
 */
export const TIER_FEATURES = {
  TANK: {
    STANDARD: [
      "Enhanced corrosion protection",
      "6-year parts warranty",
      "Standard tank lining",
      "Brass drain valve",
    ],
    PROFESSIONAL: [
      "Premium glass-lined tank",
      "9-year parts warranty",
      "Powered anode rod option",
      "Stainless steel connections",
    ],
    PREMIUM: [
      "Lifetime tank warranty",
      "12-year parts warranty",
      "Self-cleaning system",
      "Smart diagnostics",
    ],
  },
  TANKLESS: {
    STANDARD: [
      "Copper heat exchanger",
      "10-year warranty",
      "Digital temperature control",
      "Self-diagnostic codes",
    ],
    PROFESSIONAL: [
      "Commercial-grade heat exchanger",
      "12-year warranty",
      "WiFi connectivity",
      "Recirculation ready",
    ],
    PREMIUM: [
      "Premium condensing technology",
      "15-year warranty",
      "Smart home integration",
      "Built-in recirculation",
    ],
  },
  HYBRID: {
    STANDARD: [
      "Premium compressor",
      "10-year warranty",
      "Smart efficiency modes",
      "Leak detection",
    ],
    PROFESSIONAL: [
      "Variable-speed compressor",
      "12-year warranty",
      "WiFi diagnostics",
      "Vacation mode",
    ],
    PREMIUM: [
      "Ultra-quiet operation",
      "Lifetime compressor warranty",
      "Full smart home integration",
      "Grid-ready demand response",
    ],
  },
} as const;

/**
 * Get tier features for a unit type
 */
export function getTierFeatures(fuelType: FuelType, tier: 'STANDARD' | 'PROFESSIONAL' | 'PREMIUM'): readonly string[] {
  const category = getUnitCategory(fuelType);
  return TIER_FEATURES[category][tier];
}

/**
 * Unit type labels for display
 */
export const UNIT_TYPE_LABELS = {
  TANK: {
    full: "Water Heater",
    short: "Tank",
    article: "a",
  },
  TANKLESS: {
    full: "Tankless Water Heater",
    short: "Tankless",
    article: "a",
  },
  HYBRID: {
    full: "Heat Pump Water Heater",
    short: "Heat Pump",
    article: "a",
  },
} as const;

/**
 * Get unit type label
 */
export function getUnitTypeLabel(fuelType: FuelType, format: 'full' | 'short' = 'full'): string {
  const category = getUnitCategory(fuelType);
  return UNIT_TYPE_LABELS[category][format];
}

/**
 * Metrics display config by unit type
 * Defines which metrics to show in dashboards and reports
 */
export const METRICS_DISPLAY = {
  TANK: {
    primary: [
      { key: 'sedimentLbs', label: 'Sediment Load', unit: 'lbs', icon: 'Layers' },
      { key: 'shieldLife', label: 'Anode Life', unit: 'years', icon: 'Shield' },
    ],
    vitals: ['pressure', 'sediment', 'anode', 'expansion', 'temperature'],
  },
  TANKLESS: {
    primary: [
      { key: 'scaleBuildup', label: 'Scale Buildup', unit: '%', icon: 'Layers' },
      { key: 'flowCapacity', label: 'Flow Capacity', unit: '%', icon: 'Droplets' },
    ],
    vitals: ['scale', 'flow', 'igniter', 'flameRod', 'vent', 'isolationValves'],
  },
  HYBRID: {
    primary: [
      { key: 'airFilterStatus', label: 'Air Filter', unit: 'status', icon: 'Wind' },
      { key: 'compressorHealth', label: 'Compressor Health', unit: '%', icon: 'Cpu' },
    ],
    vitals: ['airFilter', 'condensate', 'compressor', 'sediment', 'anode'],
  },
} as const;

/**
 * Get metrics display config
 */
export function getMetricsDisplay(fuelType: FuelType) {
  const category = getUnitCategory(fuelType);
  return METRICS_DISPLAY[category];
}

/**
 * Service status calculation helpers
 */
export function getServiceStatus(
  fuelType: FuelType,
  metrics: {
    flushStatus?: 'optimal' | 'schedule' | 'due' | 'lockout';
    monthsToFlush?: number | null;
    // Tankless algorithm produces: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible'
    descaleStatus?: 'optimal' | 'schedule' | 'due' | 'critical' | 'lockout' | 'impossible';
    monthsToDescale?: number | null;
    airFilterStatus?: 'CLEAN' | 'DIRTY' | 'CLOGGED';
  }
): { isOverdue: boolean; isDueSoon: boolean; label: string } {
  const category = getUnitCategory(fuelType);
  
  if (category === 'TANKLESS') {
    // Handle all algorithm-produced descaleStatus values
    const isOverdue = metrics.descaleStatus === 'due' || 
                      metrics.descaleStatus === 'critical' || 
                      metrics.descaleStatus === 'lockout' || 
                      metrics.descaleStatus === 'impossible';
    const isDueSoon = metrics.descaleStatus === 'schedule' || 
      (metrics.monthsToDescale !== null && metrics.monthsToDescale !== undefined && metrics.monthsToDescale <= 6 && metrics.monthsToDescale > 0);
    
    // Provide specific labels for each status
    let label = 'Maintenance OK';
    if (metrics.descaleStatus === 'impossible') {
      label = 'Isolation Valves Needed';
    } else if (metrics.descaleStatus === 'lockout') {
      label = 'Scale Lockout';
    } else if (isOverdue) {
      label = 'Descaling Overdue';
    } else if (isDueSoon) {
      label = 'Descaling Due Soon';
    }
    
    return { isOverdue, isDueSoon, label };
  }
  
  if (category === 'HYBRID') {
    const isOverdue = metrics.airFilterStatus === 'CLOGGED';
    const isDueSoon = metrics.airFilterStatus === 'DIRTY';
    return { 
      isOverdue, 
      isDueSoon, 
      label: isOverdue ? 'Filter Service Needed' : isDueSoon ? 'Filter Due Soon' : 'Maintenance OK' 
    };
  }
  
  // TANK
  const isOverdue = metrics.flushStatus === 'due' || metrics.flushStatus === 'lockout';
  const isDueSoon = metrics.flushStatus === 'schedule' || 
    (metrics.monthsToFlush !== null && metrics.monthsToFlush !== undefined && metrics.monthsToFlush <= 6 && metrics.monthsToFlush > 0);
  return { 
    isOverdue, 
    isDueSoon, 
    label: isOverdue ? 'Flush Overdue' : isDueSoon ? 'Flush Due Soon' : 'Maintenance OK' 
  };
}

/**
 * Contextual recommendations by stressor and unit type
 */
export function getContextualRecommendation(
  fuelType: FuelType,
  stressorKey: string,
  level: 'low' | 'moderate' | 'elevated' | 'critical'
): string {
  const category = getUnitCategory(fuelType);
  const stressors = STRESS_FACTORS[category] as Record<string, { remedy?: string }>;
  
  if (stressors[stressorKey]?.remedy) {
    return stressors[stressorKey].remedy;
  }
  
  // Fallback generic recommendations
  const fallbacks: Record<UnitCategory, string> = {
    TANK: "Schedule a professional inspection and annual maintenance",
    TANKLESS: "Schedule descaling service and filter inspection",
    HYBRID: "Schedule air filter cleaning and system checkup",
  };
  
  return fallbacks[category];
}
