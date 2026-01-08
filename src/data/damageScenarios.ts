// Damage scenarios based on water heater location
export const DAMAGE_SCENARIOS = {
  ATTIC: {
    waterDamage: { min: 8000, max: 25000, average: 15000 },
    description: "Water cascades through ceilings, damaging drywall, insulation, and flooring on multiple levels",
    timeline: "Can cause $1,000+ damage per hour if undetected",
    secondaryRisks: [
      "Ceiling collapse risk within hours",
      "Electrical system damage",
      "Mold growth begins within 24-48 hours",
      "Structural damage to framing"
    ]
  },
  BASEMENT: {
    waterDamage: { min: 2000, max: 8000, average: 3500 },
    description: "Flooding damages flooring, walls, stored items, and can compromise foundation",
    timeline: "50 gallons can flood in under 10 minutes",
    secondaryRisks: [
      "Foundation damage if prolonged",
      "Mold in walls and carpet",
      "HVAC equipment damage",
      "Electrical panel exposure risk"
    ]
  },
  GARAGE: {
    waterDamage: { min: 1500, max: 5000, average: 2500 },
    description: "Water damages stored items, vehicles, and can seep into adjacent living spaces",
    timeline: "Adjacent rooms at risk within hours",
    secondaryRisks: [
      "Vehicle damage if parked nearby",
      "Tool and equipment corrosion",
      "Seepage into home foundation",
      "Electrical hazard from outlets"
    ]
  },
  UTILITY_CLOSET: {
    waterDamage: { min: 3000, max: 12000, average: 6000 },
    description: "Enclosed space concentrates damage to adjacent rooms and hidden wall cavities",
    timeline: "Hidden damage accumulates rapidly",
    secondaryRisks: [
      "Damage often hidden until severe",
      "Adjacent room flooring destroyed",
      "Wall cavity mold (expensive remediation)",
      "May not be discovered for days"
    ]
  },
  LIVING_AREA: {
    waterDamage: { min: 5000, max: 18000, average: 10000 },
    description: "Direct damage to living space flooring, furniture, and personal belongings",
    timeline: "Immediate visible damage, rapid escalation",
    secondaryRisks: [
      "Hardwood/carpet replacement required",
      "Furniture and electronics destroyed",
      "Personal items and documents lost",
      "Temporary displacement may be needed"
    ]
  }
} as const;

// Stress factor explanations and remediation advice
export const STRESS_FACTOR_EXPLANATIONS = {
  pressure: {
    label: "Water Pressure",
    icon: "Gauge",
    elevated: {
      description: "Water pressure above 70 PSI accelerates wear on tank walls, fittings, and the T&P valve",
      impact: "Reduces tank lifespan by 2-4 years"
    },
    critical: {
      description: "Dangerously high pressure has been stressing the tank beyond its design limits continuously",
      impact: "Can reduce lifespan by 5+ years and increases rupture risk"
    },
    remedy: "Install a Pressure Reducing Valve (PRV) set to 55-60 PSI to protect your new unit",
    remedyCost: "$150-350 installed",
    lifespanBenefit: "+2-4 years"
  },
  sediment: {
    label: "Sediment Buildup",
    icon: "Layers",
    elevated: {
      description: "Mineral buildup creates a thermal barrier at the tank bottom, causing the burner to overwork and overheat",
      impact: "Increases energy costs 15-25% and accelerates corrosion"
    },
    critical: {
      description: "Heavy sediment (hardite) has likely damaged the tank bottom — attempting to flush now risks causing leaks",
      impact: "Tank bottom integrity compromised"
    },
    remedy: "Schedule annual tank flushes for your new unit (every 6 months in hard water areas)",
    remedyCost: "$100-150 per flush or DIY",
    lifespanBenefit: "+3-5 years"
  },
  temperature: {
    label: "Temperature Stress",
    icon: "Thermometer",
    elevated: {
      description: "Operating temperature above 130°F accelerates anode rod depletion and tank corrosion",
      impact: "Increases scaling and burn risk"
    },
    critical: {
      description: "Extreme temperature settings have been degrading internal components at an accelerated rate",
      impact: "Anode depletes 40% faster"
    },
    remedy: "Set new unit to 120°F — safer, more efficient, and extends equipment life",
    remedyCost: "Free adjustment",
    lifespanBenefit: "+1-2 years"
  },
  thermalExpansion: {
    label: "Thermal Expansion",
    icon: "Maximize2",
    elevated: {
      description: "Without an expansion tank, pressure spikes occur every heating cycle, stressing the tank",
      impact: "Causes T&P valve dripping and premature wear"
    },
    critical: {
      description: "Chronic pressure cycling has been fatiguing tank walls and connections",
      impact: "Significantly increases leak risk at fittings"
    },
    remedy: "Install an expansion tank with your new water heater (often required by code)",
    remedyCost: "$150-300 installed",
    lifespanBenefit: "+2-3 years"
  },
  recirculation: {
    label: "Recirculation Loop",
    icon: "RefreshCw",
    elevated: {
      description: "Continuous recirculation keeps the tank working harder than intermittent use",
      impact: "Increases wear by 20-30%"
    },
    critical: {
      description: "24/7 recirculation has been causing excessive thermal cycling and energy use",
      impact: "Dramatically shortens equipment life"
    },
    remedy: "Add a timer or demand-based control to your recirculation pump",
    remedyCost: "$50-150 for timer",
    lifespanBenefit: "+2-3 years"
  },
  anodeDepletion: {
    label: "Anode Depletion",
    icon: "Shield",
    elevated: {
      description: "The sacrificial anode is significantly depleted, reducing tank protection from corrosion",
      impact: "Tank walls now corroding directly"
    },
    critical: {
      description: "Anode is completely depleted — the tank itself has been corroding for an extended period",
      impact: "Internal rust damage is irreversible"
    },
    remedy: "Replace anode rod every 3-5 years on your new unit (or use powered anode)",
    remedyCost: "$20-50 DIY, $150-250 professional",
    lifespanBenefit: "+5-8 years"
  },
  hardWater: {
    label: "Hard Water",
    icon: "Droplets",
    elevated: {
      description: "High mineral content accelerates sediment buildup and scaling throughout the system",
      impact: "Compounds all other stress factors"
    },
    critical: {
      description: "Extremely hard water has caused severe scaling, reducing efficiency and promoting corrosion",
      impact: "Makes other interventions less effective"
    },
    remedy: "Consider a whole-house water softener to protect your new unit and all fixtures",
    remedyCost: "$500-2,000 installed",
    lifespanBenefit: "+4-6 years"
  }
} as const;

// Damage types and their visual/urgency characteristics
export const DAMAGE_TYPE_INFO = {
  LEAK_ACTIVE: {
    title: "Active Water Leak Detected",
    urgency: "IMMEDIATE",
    timeframe: "Hours, not days",
    icon: "Droplets",
    color: "destructive",
    description: "Water is actively escaping from your water heater. Every hour increases damage potential."
  },
  LEAK_IMMINENT: {
    title: "Leak Risk Critical",
    urgency: "URGENT",
    timeframe: "Days to weeks",
    icon: "AlertTriangle",
    color: "destructive",
    description: "Multiple indicators suggest a leak could occur at any time. The tank's integrity is compromised."
  },
  RUST_SEVERE: {
    title: "Severe Internal Corrosion",
    urgency: "URGENT",
    timeframe: "Weeks to months",
    icon: "CircleAlert",
    color: "destructive",
    description: "Internal rust indicates the tank wall is actively deteriorating. Failure is a matter of when, not if."
  },
  SEDIMENT_LOCKOUT: {
    title: "Sediment Damage Irreversible",
    urgency: "SOON",
    timeframe: "1-3 months",
    icon: "Layers",
    color: "warning",
    description: "Heavy sediment has damaged the tank beyond safe repair. Flushing now could trigger a leak."
  },
  AGE_CRITICAL: {
    title: "End of Safe Service Life",
    urgency: "SOON",
    timeframe: "1-6 months",
    icon: "Clock",
    color: "warning",
    description: "This unit has exceeded its expected lifespan. Component failure probability increases daily."
  }
} as const;

// Insurance and financial implications
export const INSURANCE_WARNINGS = [
  "Many homeowner policies exclude 'gradual damage' from water heater failures",
  "Damage from a known-defective appliance may not be covered",
  "Mold remediation is often excluded or capped at low limits",
  "Claims history can increase premiums for 3-5 years",
  "Deductibles often range $1,000-2,500 for water damage"
];

// Get appropriate damage type based on recommendation reason
export function getDamageTypeFromReason(reason: string): keyof typeof DAMAGE_TYPE_INFO {
  const lowerReason = reason.toLowerCase();
  
  if (lowerReason.includes('active leak') || lowerReason.includes('water detected')) {
    return 'LEAK_ACTIVE';
  }
  if (lowerReason.includes('leak') || lowerReason.includes('breach') || lowerReason.includes('containment')) {
    return 'LEAK_IMMINENT';
  }
  if (lowerReason.includes('rust') || lowerReason.includes('corrosion')) {
    return 'RUST_SEVERE';
  }
  if (lowerReason.includes('sediment') || lowerReason.includes('hardite')) {
    return 'SEDIMENT_LOCKOUT';
  }
  return 'AGE_CRITICAL';
}

// Map location input to damage scenario key
export function getLocationKey(location: string): keyof typeof DAMAGE_SCENARIOS {
  const loc = location.toUpperCase().replace(/\s+/g, '_');
  if (loc.includes('ATTIC')) return 'ATTIC';
  if (loc.includes('BASEMENT')) return 'BASEMENT';
  if (loc.includes('GARAGE')) return 'GARAGE';
  if (loc.includes('CLOSET') || loc.includes('UTILITY')) return 'UTILITY_CLOSET';
  if (loc.includes('LIVING') || loc.includes('KITCHEN') || loc.includes('LAUNDRY')) return 'LIVING_AREA';
  return 'BASEMENT'; // Default fallback
}
