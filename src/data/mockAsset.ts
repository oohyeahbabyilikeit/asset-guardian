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
