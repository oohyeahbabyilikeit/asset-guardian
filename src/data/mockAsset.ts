// Mock Asset Data for Opterra Home Asset Vault MVP
// All data is configurable here for demo flexibility

import type { ForensicInputs, FuelType, TempSetting, LocationType, RiskLevel } from '@/lib/opterraAlgorithm';

export interface AssetData {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  installDate: string;
  paperAge: number; // Years since install
  biologicalAge: number; // Calculated wear age
  location: string;
  specs: {
    capacity: string;
    fuelType: string;
    ventType: string;
    piping: string;
  };
}

export interface VitalsData {
  pressure: {
    current: number;
    limit: number;
    status: 'critical' | 'warning' | 'optimal';
  };
  sedimentLoad: {
    pounds: number;
    gasLossEstimate: number;
    status: 'critical' | 'warning' | 'optimal';
  };
  liabilityStatus: {
    insured: boolean;
    location: string;
    riskLevel: RiskLevel;  // v5.2: Replaced estDamage with qualitative risk
    status: 'critical' | 'warning' | 'optimal';
  };
  biologicalAge: {
    real: number | string;  // Can be "20+" when capped
    paper: number;
    agingRate: number;         // Stress multiplier (e.g., 3.1x)
    lifeExtension: number;     // Years gained by fixing issues
    primaryStressor: string;   // Main cause of accelerated aging
    status: 'critical' | 'warning' | 'optimal';
  };
  expansionTank: {
    present: boolean;
    required: boolean; // true if closed loop system (isClosedLoop OR hasPrv)
    status: 'critical' | 'warning' | 'optimal';
  };
  prv: {
    present: boolean;
    required: boolean; // true if psi >= 65
    functional: boolean; // false if present but psi > 75
    status: 'critical' | 'warning' | 'optimal';
  };
}

export interface AuditFinding {
  id: string;
  name: string;
  value: string;
  passed: boolean;
  details: string;
  photoUrl?: string;
}

export interface ContractorData {
  name: string;
  logo?: string;
  accentColor: string;
  phone: string;
  emergencyPhone: string;
}

export interface HealthScore {
  score: number; // 0-100
  status: 'critical' | 'warning' | 'optimal';
  failureProbability: number | 'FAIL';  // Percentage or "FAIL" for breach scenarios
  recommendation: string;
}

export interface BurstCostScenario {
  min: number;
  max: number;
  label: string;
}

export interface BurstCostData {
  label: string; // e.g., "ATTIC INSTALLATION"
  scenarioA: BurstCostScenario; // "Lucky" outcome
  scenarioB: BurstCostScenario; // "Nightmare" outcome
  whyCostJumps: string;
}

export const burstCostByLocation: Record<string, BurstCostData> = {
  'Garage': {
    label: 'Garage Installation',
    scenarioA: { min: 0, max: 500, label: 'Minor / Unfinished' },
    scenarioB: { min: 2500, max: 6000, label: 'Major / Finished' },
    whyCostJumps: 'The "Fire Wall" Trap. If water hits the shared wall, it wicks into fire-rated drywall that must be replaced for code compliance.',
  },
  'Basement': {
    label: 'Basement Installation',
    scenarioA: { min: 1500, max: 3500, label: 'Minor / Unfinished' },
    scenarioB: { min: 15000, max: 40000, label: 'Major / Finished' },
    whyCostJumps: 'The "Sponge" Effect. Finished basements require gutting carpet and a "Flood Cut" removing bottom 2ft of drywall.',
  },
  'Attic': {
    label: 'Attic Installation',
    scenarioA: { min: 5000, max: 12000, label: 'Minor / Unfinished' },
    scenarioB: { min: 45000, max: 80000, label: 'Major / Finished' },
    whyCostJumps: 'The Gravity Multiplier. Water flows down, destroying ceiling, insulation, 2nd-floor carpet, and 1st-floor hardwoods. Mold risk is 100%.',
  },
  'Utility Closet': {
    label: 'Utility Closet Installation',
    scenarioA: { min: 4000, max: 8000, label: 'Minor / Unfinished' },
    scenarioB: { min: 15000, max: 35000, label: 'Major / Finished' },
    whyCostJumps: 'The "Cabinet Killer." Main floor closets connect to hallways or kitchens. Water wicks into hardwood and cabinets instantly.',
  },
};

export function getBurstCostByLocation(location: string): BurstCostData {
  return burstCostByLocation[location] || burstCostByLocation['Garage'];
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount.toLocaleString();
}

// Demo Contractor
export const demoContractor: ContractorData = {
  name: "Bob's Plumbing",
  accentColor: "#FF4400",
  phone: "(555) 123-4567",
  emergencyPhone: "(555) 911-PIPE",
};

// Demo Scenarios for testing various risk profiles
export interface DemoScenario {
  name: string;
  asset: AssetData;
  inputs: ForensicInputs;
}

const scenarios: DemoScenario[] = [
  // === HEALTHY / MONITOR SCENARIOS ===
  {
    name: "The Perfect Install",
    asset: {
      id: "BR-1122-A",
      type: "Water Heater",
      brand: "Bradford White",
      model: "Defender Safety System",
      serialNumber: "BW-2022-1122-A",
      installDate: "2022-09-10",
      paperAge: 2.3,
      biologicalAge: 2.1,
      location: "Garage",
      specs: { capacity: "50-Gal", fuelType: "Natural Gas", ventType: "Direct Vent", piping: "3/4\" PEX" },
    },
    inputs: {
      calendarAge: 2, psi: 55, warrantyYears: 12, fuelType: 'GAS' as FuelType,
      hardnessGPG: 8, hasSoftener: false, hasCircPump: false, isClosedLoop: false,
      hasExpTank: true, hasPrv: true, location: 'GARAGE' as LocationType, isFinishedArea: false,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },
  {
    name: "The Garage Sleeper",
    asset: {
      id: "WH-2201-G",
      type: "Water Heater",
      brand: "Whirlpool",
      model: "Energy Smart",
      serialNumber: "WH-2020-2201-G",
      installDate: "2020-02-28",
      paperAge: 4.8,
      biologicalAge: 4.5,
      location: "Garage",
      specs: { capacity: "50-Gal", fuelType: "Electric", ventType: "N/A", piping: "3/4\" PEX" },
    },
    inputs: {
      calendarAge: 4, psi: 62, warrantyYears: 9, fuelType: 'ELECTRIC' as FuelType,
      hardnessGPG: 12, hasSoftener: false, hasCircPump: false, isClosedLoop: false,
      hasExpTank: true, hasPrv: true, location: 'GARAGE' as LocationType, isFinishedArea: false,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },
  {
    name: "The Low-Risk Rental",
    asset: {
      id: "AO-3345-R",
      type: "Water Heater",
      brand: "A.O. Smith",
      model: "Signature 300",
      serialNumber: "AO-2021-3345-R",
      installDate: "2021-06-15",
      paperAge: 3.5,
      biologicalAge: 3.2,
      location: "Basement",
      specs: { capacity: "40-Gal", fuelType: "Natural Gas", ventType: "Atmospheric", piping: "3/4\" Copper" },
    },
    inputs: {
      calendarAge: 3, psi: 58, warrantyYears: 6, fuelType: 'GAS' as FuelType,
      hardnessGPG: 10, hasSoftener: false, hasCircPump: false, isClosedLoop: false,
      hasExpTank: false, hasPrv: false, location: 'BASEMENT' as LocationType, isFinishedArea: false,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },

  // === MAINTENANCE / REPAIR SCENARIOS ===
  {
    name: "The Pressure Cooker",
    asset: {
      id: "RH-5567-P",
      type: "Water Heater",
      brand: "Rheem",
      model: "Performance Platinum",
      serialNumber: "RH-2019-5567-P",
      installDate: "2019-11-20",
      paperAge: 5.1,
      biologicalAge: 8.2,
      location: "Utility Closet",
      specs: { capacity: "50-Gal", fuelType: "Natural Gas", ventType: "Atmospheric", piping: "3/4\" Copper" },
    },
    inputs: {
      calendarAge: 5, psi: 95, warrantyYears: 6, fuelType: 'GAS' as FuelType,
      hardnessGPG: 18, hasSoftener: false, hasCircPump: false, isClosedLoop: false,
      hasExpTank: true, hasPrv: false, location: 'MAIN_LIVING' as LocationType, isFinishedArea: true,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },
  {
    name: "The Missing Tank",
    asset: {
      id: "BR-7788-E",
      type: "Water Heater",
      brand: "Bradford White",
      model: "eF Series",
      serialNumber: "BW-2020-7788-E",
      installDate: "2020-08-05",
      paperAge: 4.4,
      biologicalAge: 5.8,
      location: "Utility Closet",
      specs: { capacity: "50-Gal", fuelType: "Electric", ventType: "N/A", piping: "3/4\" PEX" },
    },
    inputs: {
      calendarAge: 4, psi: 68, warrantyYears: 6, fuelType: 'ELECTRIC' as FuelType,
      hardnessGPG: 14, hasSoftener: false, hasCircPump: false, isClosedLoop: true,
      hasExpTank: false, hasPrv: false, location: 'MAIN_LIVING' as LocationType, isFinishedArea: true,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },
  {
    name: "The Softener Accelerator",
    asset: {
      id: "RH-9942-X",
      type: "Water Heater",
      brand: "Rheem",
      model: "Professional Classic Plus",
      serialNumber: "RH-2017-9942-X",
      installDate: "2017-03-15",
      paperAge: 7.0,
      biologicalAge: 11.3,
      location: "Attic",
      specs: { capacity: "50-Gal", fuelType: "Natural Gas", ventType: "Power Vent (PVC)", piping: "3/4\" Copper" },
    },
    inputs: {
      calendarAge: 7, psi: 58, warrantyYears: 6, fuelType: 'GAS' as FuelType,
      hardnessGPG: 15, hasSoftener: true, hasCircPump: false, isClosedLoop: false,
      hasExpTank: true, hasPrv: true, location: 'ATTIC' as LocationType, isFinishedArea: false,
      visualRust: false, tempSetting: 'NORMAL' as TempSetting,
    },
  },

  // === REPLACEMENT SCENARIOS ===
  {
    name: "The Basement Time Bomb",
    asset: {
      id: "AO-4471-K",
      type: "Water Heater",
      brand: "A.O. Smith",
      model: "ProLine XE",
      serialNumber: "AO-2014-4471-K",
      installDate: "2014-06-22",
      paperAge: 11.5,
      biologicalAge: 14.8,
      location: "Basement",
      specs: { capacity: "40-Gal", fuelType: "Electric", ventType: "N/A", piping: "3/4\" PEX" },
    },
    inputs: {
      calendarAge: 11, psi: 82, warrantyYears: 6, fuelType: 'ELECTRIC' as FuelType,
      hardnessGPG: 22, hasSoftener: false, hasCircPump: true, isClosedLoop: true,
      hasExpTank: false, hasPrv: false, location: 'BASEMENT' as LocationType, isFinishedArea: true,
      visualRust: true, tempSetting: 'HIGH' as TempSetting,
    },
  },
  {
    name: "The Double Whammy",
    asset: {
      id: "KE-8834-D",
      type: "Water Heater",
      brand: "Kenmore",
      model: "Power Miser 9",
      serialNumber: "KE-2016-8834-D",
      installDate: "2016-04-12",
      paperAge: 8.7,
      biologicalAge: 16.4,
      location: "Attic",
      specs: { capacity: "40-Gal", fuelType: "Electric", ventType: "N/A", piping: "3/4\" CPVC" },
    },
    inputs: {
      calendarAge: 9, psi: 78, warrantyYears: 6, fuelType: 'ELECTRIC' as FuelType,
      hardnessGPG: 25, hasSoftener: true, hasCircPump: true, isClosedLoop: true,
      hasExpTank: false, hasPrv: false, location: 'ATTIC' as LocationType, isFinishedArea: false,
      visualRust: true, tempSetting: 'HIGH' as TempSetting,
    },
  },
  {
    name: "The Zombie Tank",
    asset: {
      id: "GE-1156-Z",
      type: "Water Heater",
      brand: "GE",
      model: "SmartWater",
      serialNumber: "GE-2013-1156-Z",
      installDate: "2013-01-20",
      paperAge: 12.0,
      biologicalAge: 19.5,
      location: "Crawlspace",
      specs: { capacity: "40-Gal", fuelType: "Natural Gas", ventType: "Atmospheric", piping: "3/4\" Copper" },
    },
    inputs: {
      calendarAge: 12, psi: 88, warrantyYears: 6, fuelType: 'GAS' as FuelType,
      hardnessGPG: 20, hasSoftener: false, hasCircPump: false, isClosedLoop: false,
      hasExpTank: false, hasPrv: false, location: 'CRAWLSPACE' as LocationType, isFinishedArea: false,
      visualRust: false, tempSetting: 'HIGH' as TempSetting,
    },
  },
];

// Get a random scenario
export function getRandomScenario(): DemoScenario {
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

// Current demo data (starts with first scenario)
const initialScenario = scenarios[0];
export const demoAsset: AssetData = initialScenario.asset;
export const demoForensicInputs: ForensicInputs = initialScenario.inputs;

// DEPRECATED: These are now calculated dynamically in CommandCenter.tsx
// Kept for reference only - do not use in production code
// Demo Vitals - Reference values (actual values come from algorithm)
// export const demoVitals: VitalsData = { ... }
// Demo Health Score - Reference values (actual values come from algorithm)
// export const demoHealthScore: HealthScore = { ... }

// Demo Audit Findings - DEPRECATED: Use generateAuditFindings() instead
export const demoAuditFindings: AuditFinding[] = [];

/**
 * Generate dynamic audit findings based on current inputs and algorithm metrics.
 * This ensures the Evidence Locker matches the dashboard diagnostics.
 */
export function generateAuditFindings(
  inputs: ForensicInputs,
  metrics: {
    sedimentLbs: number;
    shieldLife: number;
    bioAge: number;
    stressFactors: { pressure: number; temp: number; circ: number; loop: number; total: number };
  }
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  // Pressure check
  const pressurePassed = inputs.psi <= 80;
  findings.push({
    id: 'pressure',
    name: 'Static Pressure',
    value: `${inputs.psi} PSI`,
    passed: pressurePassed,
    details: pressurePassed
      ? inputs.psi >= 70 
        ? 'Elevated but within warranty threshold. Consider PRV to reduce strain by ~50%.'
        : 'Within safe operating range. No action required.'
      : `Exceeds 80 PSI warranty threshold. High pressure accelerates tank wear by ${((metrics.stressFactors.pressure - 1) * 100).toFixed(0)}%.`,
    photoUrl: '/placeholder.svg',
  });

  // PRV check
  if (inputs.psi >= 70) {
    findings.push({
      id: 'prv',
      name: 'Pressure Reducing Valve',
      value: inputs.hasPrv ? (inputs.psi <= 75 ? 'FUNCTIONAL' : 'FAILED') : 'NOT INSTALLED',
      passed: inputs.hasPrv && inputs.psi <= 75,
      details: inputs.hasPrv
        ? inputs.psi <= 75
          ? 'PRV is actively regulating inlet pressure to ~60 PSI.'
          : 'PRV installed but not regulating pressure effectively. Replacement recommended.'
        : 'No PRV installed. Installing one would reduce system pressure to ~60 PSI, cutting plumbing strain by approximately 50%.',
    });
  }

  // Expansion tank check (only relevant for closed loop)
  const isClosedLoop = inputs.isClosedLoop || inputs.hasPrv;
  if (isClosedLoop) {
    findings.push({
      id: 'expansion',
      name: 'Thermal Expansion Tank',
      value: inputs.hasExpTank ? 'INSTALLED' : 'MISSING',
      passed: inputs.hasExpTank,
      details: inputs.hasExpTank
        ? 'Thermal expansion protection present. Prevents pressure spikes during heating cycles.'
        : 'Required for closed loop system. Missing tank causes pressure spikes that stress tank welds.',
    });
  }

  // Anode rod check
  const anodePassed = metrics.shieldLife > 1;
  findings.push({
    id: 'anode',
    name: 'Anode Rod (Shield Life)',
    value: metrics.shieldLife > 1 ? `${metrics.shieldLife.toFixed(1)} YRS REMAINING` : 'DEPLETED',
    passed: anodePassed,
    details: anodePassed
      ? `Sacrificial anode providing active protection. Estimated ${metrics.shieldLife.toFixed(1)} years of corrosion protection remaining.`
      : inputs.hasSoftener
        ? `Water softener accelerated anode consumption (2.4x decay rate). Tank has been unprotected. ${inputs.calendarAge < 8 ? 'Replacement recommended.' : 'Tank too old for cost-effective anode replacement.'}`
        : `Anode rod depleted based on age and water conditions. Tank interior is now corroding directly.`,
  });

  // Water softener impact
  if (inputs.hasSoftener) {
    findings.push({
      id: 'softener',
      name: 'Water Softener',
      value: 'ACTIVE',
      passed: false,
      details: 'Softener increases water conductivity, accelerating galvanic corrosion. Anode life reduced from ~6 years to ~2.5 years. More frequent anode inspection recommended.',
    });
  }

  // Sediment check
  const sedimentPassed = metrics.sedimentLbs <= 5;
  findings.push({
    id: 'sediment',
    name: 'Sediment Accumulation',
    value: `${metrics.sedimentLbs.toFixed(1)} LBS`,
    passed: sedimentPassed,
    details: sedimentPassed
      ? 'Sediment levels within acceptable range. Annual flush recommended for maintenance.'
      : `Heavy sediment buildup detected. Reduces efficiency and insulates heating element from water. Professional flush recommended.`,
  });

  // Temperature setting check
  const tempPassed = inputs.tempSetting !== 'HOT';
  findings.push({
    id: 'temp',
    name: 'Temperature Setting',
    value: inputs.tempSetting === 'HOT' ? 'HOT (140°F+)' : inputs.tempSetting === 'LOW' ? 'LOW' : 'NORMAL (120°F)',
    passed: tempPassed,
    details: tempPassed
      ? 'Temperature at recommended setting. Balances comfort with efficiency and safety.'
      : 'High temperature setting accelerates tank wear by 20% and increases scald risk.',
  });

  // Circulation pump check (if present)
  if (inputs.hasCircPump) {
    findings.push({
      id: 'circpump',
      name: 'Recirculation Pump',
      value: 'ACTIVE',
      passed: false,
      details: 'Circulation pump increases thermal cycling stress. Tank experiences 15% additional wear from constant temperature fluctuations.',
    });
  }

  // Location risk check
  const locationMap: Record<string, string> = {
    'ATTIC': 'Attic',
    'GARAGE': 'Garage',
    'BASEMENT': 'Basement',
    'MAIN_LIVING': 'Main Living Area',
    'CRAWLSPACE': 'Crawlspace',
  };
  const locationName = locationMap[inputs.location] || inputs.location;
  const isHighRiskLocation = inputs.location === 'ATTIC' || (inputs.location === 'MAIN_LIVING' && inputs.isFinishedArea);
  findings.push({
    id: 'location',
    name: 'Installation Location',
    value: `${locationName}${inputs.isFinishedArea ? ' (Finished)' : ''}`,
    passed: !isHighRiskLocation,
    details: isHighRiskLocation
      ? inputs.location === 'ATTIC'
        ? 'Attic installation has highest damage potential. Water flows down through multiple floors. Leak detection and pan drain strongly recommended.'
        : 'Finished living area installation. Water damage costs significantly higher than garage/basement locations.'
      : 'Location has acceptable damage potential in case of leak.',
  });

  // Visual rust check
  if (inputs.visualRust) {
    findings.push({
      id: 'rust',
      name: 'Visual Corrosion',
      value: 'DETECTED',
      passed: false,
      details: 'Visible rust or corrosion detected on tank exterior. This indicates internal corrosion has progressed significantly. Replacement recommended.',
      photoUrl: '/placeholder.svg',
    });
  }

  return findings;
}

// Helper function to get status color class
export function getStatusClass(status: 'critical' | 'warning' | 'optimal'): string {
  switch (status) {
    case 'critical':
      return 'status-critical';
    case 'warning':
      return 'status-warning';
    case 'optimal':
      return 'status-optimal';
  }
}

// Helper function to get glow class
export function getGlowClass(status: 'critical' | 'warning' | 'optimal'): string {
  switch (status) {
    case 'critical':
      return 'glow-critical';
    case 'warning':
      return 'glow-warning';
    case 'optimal':
      return 'glow-optimal';
  }
}

// Calculate aging factor for display
export function getAgingFactor(paperAge: number, biologicalAge: number): string {
  const factor = biologicalAge / paperAge;
  return factor.toFixed(1) + "x";
}

// Re-export ForensicInputs type for backwards compatibility
export type { ForensicInputs } from '@/lib/opterraAlgorithm';
