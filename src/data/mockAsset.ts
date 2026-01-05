// Mock Asset Data for Opterra Home Asset Vault MVP
// All data is configurable here for demo flexibility

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
    status: 'critical' | 'warning' | 'optimal';
  };
  biologicalAge: {
    real: number;
    paper: number;
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
  failureProbability: number; // Percentage
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

// Demo Water Heater Asset
export const demoAsset: AssetData = {
  id: "RH-9942-X",
  type: "Water Heater",
  brand: "Rheem",
  model: "Professional Classic Plus",
  serialNumber: "RH-2018-9942-X",
  installDate: "2018-03-15",
  paperAge: 6.0,
  biologicalAge: 14.1,
  location: "Attic",
  specs: {
    capacity: "50-Gal",
    fuelType: "Natural Gas",
    ventType: "Power Vent (PVC)",
    piping: "3/4\" Copper",
  },
};

// Demo Vitals
export const demoVitals: VitalsData = {
  pressure: {
    current: 96,
    limit: 80,
    status: 'critical',
  },
  sedimentLoad: {
    pounds: 10.5,
    gasLossEstimate: 48,
    status: 'critical',
  },
  liabilityStatus: {
    insured: false,
    location: "Attic",
    status: 'critical',
  },
  biologicalAge: {
    real: 14.1,
    paper: 6.0,
    status: 'critical',
  },
};

// Demo Health Score (Calculated from vitals)
export const demoHealthScore: HealthScore = {
  score: 12,
  status: 'critical',
  failureProbability: 38.4,
  recommendation: "REPLACEMENT",
};

// Demo Audit Findings
export const demoAuditFindings: AuditFinding[] = [
  {
    id: "pressure",
    name: "Static Pressure",
    value: "96 PSI",
    passed: false,
    details: "Limit: 80psi. Warranty Voided. High pressure accelerates wear on all water-using appliances and increases risk of catastrophic failure.",
    photoUrl: "/placeholder.svg",
  },
  {
    id: "expansion",
    name: "Thermal Expansion Tank",
    value: "MISSING",
    passed: false,
    details: "No thermal expansion protection detected. This causes pressure spikes during heating cycles, significantly reducing tank lifespan.",
  },
  {
    id: "anode",
    name: "Anode Rod",
    value: "DEPLETED",
    passed: false,
    details: "Sacrificial anode is more than 80% consumed. Tank corrosion is now accelerated. Replacement critical within 30 days.",
  },
  {
    id: "venting",
    name: "Gas Venting",
    value: "COMPLIANT",
    passed: true,
    details: "Power vent system operating within normal parameters. CO levels undetectable.",
  },
  {
    id: "drainage",
    name: "T&P Drain Line",
    value: "COMPLIANT",
    passed: true,
    details: "Temperature and Pressure relief valve drain line properly routed to exterior.",
  },
];

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
