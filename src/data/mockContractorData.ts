import type { ForensicInputs } from '@/lib/opterraTypes';

// ============ Types ============

export type OpportunityType = 
  | 'replacement_urgent' 
  | 'replacement_recommended' 
  | 'warranty_expiring' 
  | 'anode_due' 
  | 'flush_due' 
  | 'descale_due' 
  | 'annual_checkup';

export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type JobComplexity = 'STANDARD' | 'ELEVATED' | 'COMPLEX';
export type CloseCategory = 'maintenance' | 'code_fixes' | 'replacements';

export interface TankAsset {
  id: string;
  brand: string;
  model: string;
  serialNumber: string;
  calendarAge: number;
  location: string;
  capacity: number;
  fuelType: 'GAS' | 'ELECTRIC';
  ventType: string;
  warrantyYears: number;
}

export interface MaintenanceBreakdown {
  flush: number;
  anode: number;
  descale: number;
  inspection: number;
}

export interface CodeFixBreakdown {
  expTank: number;
  prv: number;
  softener: number;
}

export interface ServiceCloseMetrics {
  maintenance: {
    total: number;
    breakdown: MaintenanceBreakdown;
  };
  codeFixes: {
    total: number;
    breakdown: CodeFixBreakdown;
  };
  replacements: {
    total: number;
  };
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'flat';
}

export interface MockOpportunity {
  id: string;
  propertyAddress: string;
  customerName?: string;
  customerPhone?: string;
  opportunityType: OpportunityType;
  priority: Priority;
  healthScore: number;
  failProbability: number;
  jobComplexity: JobComplexity;
  context: string;
  createdAt: Date;
  status: 'pending' | 'viewed' | 'contacted' | 'converted' | 'dismissed';
  asset: TankAsset;
  forensicInputs: ForensicInputs;
}

export interface PipelineStage {
  name: string;
  count: number;
}

export interface MockPipeline {
  stages: PipelineStage[];
  conversionRate: number;
  closes: ServiceCloseMetrics;
}

// ============ Mock Data - Tank Water Heaters Only ============

export const mockOpportunities: MockOpportunity[] = [
  // CRITICAL - Active Issues
  {
    id: 'opp-001',
    propertyAddress: '1847 Sunset Dr, Phoenix, AZ 85001',
    customerName: 'Johnson Family',
    customerPhone: '(602) 555-0142',
    opportunityType: 'replacement_urgent',
    priority: 'critical',
    healthScore: 24,
    failProbability: 0.78,
    jobComplexity: 'COMPLEX',
    context: 'Active leak detected at base. Tank is 12 years old with no anode service history. High pressure system.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-001',
      brand: 'Rheem',
      model: 'PROG50-36N-RH67',
      serialNumber: 'RH-2012-5567-P',
      calendarAge: 12,
      location: 'Attic',
      capacity: 50,
      fuelType: 'GAS',
      ventType: 'Atmospheric',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 12,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 50,
      hasSoftener: false,
      measuredHardness: 18,
      streetHardness: 22,
      housePsi: 95,
      hasPrv: true,
      hasExpTank: false,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'HIGH',
      peopleCount: 4,
      lastFlushYearsAgo: null,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ATMOSPHERIC',
      isLeaking: true,
      leakSource: 'BASE',
      visualRust: true,
      anodeStatus: 'UNKNOWN',
    },
  },
  {
    id: 'opp-002',
    propertyAddress: '2301 E Camelback Rd, Phoenix, AZ 85016',
    customerName: 'Williams Residence',
    customerPhone: '(602) 555-0298',
    opportunityType: 'replacement_urgent',
    priority: 'critical',
    healthScore: 18,
    failProbability: 0.85,
    jobComplexity: 'ELEVATED',
    context: 'Severe corrosion on tank exterior. T&P valve weeping. Electric unit in garage - 15 years old.',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-002',
      brand: 'Bradford White',
      model: 'RE350S6-1NCWW',
      serialNumber: 'BW-2009-8823-E',
      calendarAge: 15,
      location: 'Garage',
      capacity: 50,
      fuelType: 'ELECTRIC',
      ventType: 'N/A',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'ELECTRIC',
      calendarAge: 15,
      warrantyYears: 6,
      qualityTier: 'ENTRY',
      tankCapacity: 50,
      hasSoftener: false,
      measuredHardness: 24,
      streetHardness: 24,
      housePsi: 72,
      hasPrv: false,
      hasExpTank: false,
      isClosedLoop: false,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 2,
      lastFlushYearsAgo: null,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ELECTRIC',
      isLeaking: true,
      leakSource: 'TPR',
      visualRust: true,
      anodeStatus: 'DEPLETED',
    },
  },

  // HIGH - Warranty/Anode Issues
  {
    id: 'opp-003',
    propertyAddress: '456 Oak Ave, Scottsdale, AZ 85251',
    customerName: 'Martinez Residence',
    customerPhone: '(480) 555-0187',
    opportunityType: 'warranty_expiring',
    priority: 'high',
    healthScore: 62,
    failProbability: 0.38,
    jobComplexity: 'STANDARD',
    context: 'Warranty expires in 6 months. 5-year-old A.O. Smith in good condition. Recommend anode inspection.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-003',
      brand: 'A.O. Smith',
      model: 'GPVX-50',
      serialNumber: 'AOS-2019-4421-G',
      calendarAge: 5,
      location: 'Utility Room',
      capacity: 50,
      fuelType: 'GAS',
      ventType: 'Power Vent',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 5,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 50,
      hasSoftener: true,
      measuredHardness: 8,
      streetHardness: 18,
      housePsi: 65,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 3,
      lastFlushYearsAgo: 2,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'POWER_VENT',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'UNKNOWN',
    },
  },
  {
    id: 'opp-004',
    propertyAddress: '789 Mesquite Ln, Tempe, AZ 85281',
    customerName: 'Chen Family',
    customerPhone: '(480) 555-0334',
    opportunityType: 'anode_due',
    priority: 'high',
    healthScore: 45,
    failProbability: 0.52,
    jobComplexity: 'ELEVATED',
    context: 'Anode confirmed depleted during last visit. High sediment detected. 10-year unit in hard water area.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'viewed',
    asset: {
      id: 'asset-004',
      brand: 'State Select',
      model: 'GS650YBRT',
      serialNumber: 'SS-2014-7756-G',
      calendarAge: 10,
      location: 'Closet',
      capacity: 50,
      fuelType: 'GAS',
      ventType: 'Atmospheric',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 10,
      warrantyYears: 6,
      qualityTier: 'ENTRY',
      tankCapacity: 50,
      hasSoftener: false,
      measuredHardness: 22,
      streetHardness: 22,
      housePsi: 78,
      hasPrv: true,
      hasExpTank: false,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 5,
      lastFlushYearsAgo: 4,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ATMOSPHERIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'DEPLETED',
    },
  },
  {
    id: 'opp-012',
    propertyAddress: '1122 Palm Desert Way, Gilbert, AZ 85234',
    customerName: 'Thompson Home',
    customerPhone: '(480) 555-0912',
    opportunityType: 'replacement_recommended',
    priority: 'high',
    healthScore: 52,
    failProbability: 0.48,
    jobComplexity: 'ELEVATED',
    context: 'House PSI at 105 - no PRV installed. 8-year-old unit showing stress signs. Closed loop system.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-012',
      brand: 'Bradford White',
      model: 'RG240T6N',
      serialNumber: 'BW-2016-3312-G',
      calendarAge: 8,
      location: 'Garage',
      capacity: 40,
      fuelType: 'GAS',
      ventType: 'Atmospheric',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 8,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 40,
      hasSoftener: false,
      measuredHardness: 16,
      streetHardness: 18,
      housePsi: 105,
      hasPrv: false,
      hasExpTank: false,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 4,
      lastFlushYearsAgo: 3,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ATMOSPHERIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'FAIR',
    },
  },

  // MEDIUM - Maintenance Due
  {
    id: 'opp-005',
    propertyAddress: '3344 Saguaro Blvd, Mesa, AZ 85201',
    customerName: 'Rodriguez Family',
    customerPhone: '(480) 555-0456',
    opportunityType: 'anode_due',
    priority: 'medium',
    healthScore: 71,
    failProbability: 0.28,
    jobComplexity: 'STANDARD',
    context: 'Anode replacement due based on 6-year cycle. Well-maintained unit with softener.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-005',
      brand: 'Rheem',
      model: 'PROG40-38N-RH60',
      serialNumber: 'RH-2018-2234-G',
      calendarAge: 6,
      location: 'Utility Room',
      capacity: 40,
      fuelType: 'GAS',
      ventType: 'Atmospheric',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 6,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 40,
      hasSoftener: true,
      measuredHardness: 6,
      streetHardness: 20,
      housePsi: 62,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 4,
      lastFlushYearsAgo: 1,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ATMOSPHERIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'FAIR',
    },
  },
  {
    id: 'opp-006',
    propertyAddress: '5566 Ironwood Dr, Chandler, AZ 85226',
    customerName: 'Patel Residence',
    customerPhone: '(480) 555-0567',
    opportunityType: 'flush_due',
    priority: 'medium',
    healthScore: 78,
    failProbability: 0.22,
    jobComplexity: 'STANDARD',
    context: 'Annual flush due. 18 GPG hard water with no softener - recommend flush + softener discussion.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-006',
      brand: 'A.O. Smith',
      model: 'GPVL-40',
      serialNumber: 'AOS-2020-6678-G',
      calendarAge: 4,
      location: 'Garage',
      capacity: 40,
      fuelType: 'GAS',
      ventType: 'Power Vent',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 4,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 40,
      hasSoftener: false,
      measuredHardness: 18,
      streetHardness: 18,
      housePsi: 58,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 3,
      lastFlushYearsAgo: 2,
      lastAnodeReplaceYearsAgo: 3,
      ventType: 'POWER_VENT',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'GOOD',
    },
  },
  {
    id: 'opp-007',
    propertyAddress: '9900 Cactus Wren Ln, Peoria, AZ 85382',
    customerName: 'Anderson Home',
    customerPhone: '(623) 555-0678',
    opportunityType: 'flush_due',
    priority: 'medium',
    healthScore: 68,
    failProbability: 0.32,
    jobComplexity: 'STANDARD',
    context: 'Flush overdue by 18 months. Electric unit in garage. Moderate hard water area.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-007',
      brand: 'Bradford White',
      model: 'RE340S6-1NCWW',
      serialNumber: 'BW-2017-9912-E',
      calendarAge: 7,
      location: 'Garage',
      capacity: 40,
      fuelType: 'ELECTRIC',
      ventType: 'N/A',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'ELECTRIC',
      calendarAge: 7,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 40,
      hasSoftener: false,
      measuredHardness: 14,
      streetHardness: 16,
      housePsi: 68,
      hasPrv: true,
      hasExpTank: false,
      isClosedLoop: false,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 2,
      lastFlushYearsAgo: 3,
      lastAnodeReplaceYearsAgo: 4,
      ventType: 'ELECTRIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'FAIR',
    },
  },
  {
    id: 'opp-008',
    propertyAddress: '2233 Quail Run, Scottsdale, AZ 85255',
    customerName: 'Davis Residence',
    customerPhone: '(480) 555-0789',
    opportunityType: 'anode_due',
    priority: 'medium',
    healthScore: 74,
    failProbability: 0.26,
    jobComplexity: 'STANDARD',
    context: 'Anode inspection recommended. 5-year-old unit, softener installed. Good maintenance history.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'contacted',
    asset: {
      id: 'asset-008',
      brand: 'State Select',
      model: 'GS640YBRT',
      serialNumber: 'SS-2019-1145-G',
      calendarAge: 5,
      location: 'Utility Room',
      capacity: 40,
      fuelType: 'GAS',
      ventType: 'Atmospheric',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 5,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 40,
      hasSoftener: true,
      measuredHardness: 5,
      streetHardness: 18,
      housePsi: 55,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: true,
      tempSetting: 'NORMAL',
      peopleCount: 3,
      lastFlushYearsAgo: 1,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ATMOSPHERIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'UNKNOWN',
    },
  },

  // LOW - Routine Checkups
  {
    id: 'opp-009',
    propertyAddress: '4455 Dove Valley Rd, Cave Creek, AZ 85331',
    customerName: 'Miller Family',
    customerPhone: '(480) 555-0890',
    opportunityType: 'annual_checkup',
    priority: 'low',
    healthScore: 92,
    failProbability: 0.08,
    jobComplexity: 'STANDARD',
    context: 'Annual checkup due. 2-year-old unit in excellent condition. Premium install with all components.',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-009',
      brand: 'Rheem',
      model: 'PROG50-42N-RH95',
      serialNumber: 'RH-2022-8834-G',
      calendarAge: 2,
      location: 'Garage',
      capacity: 50,
      fuelType: 'GAS',
      ventType: 'Direct Vent',
      warrantyYears: 12,
    },
    forensicInputs: {
      fuelType: 'GAS',
      calendarAge: 2,
      warrantyYears: 12,
      qualityTier: 'PREMIUM',
      tankCapacity: 50,
      hasSoftener: true,
      measuredHardness: 4,
      streetHardness: 16,
      housePsi: 58,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: true,
      tempSetting: 'NORMAL',
      peopleCount: 4,
      lastFlushYearsAgo: 1,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'DIRECT_VENT',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'GOOD',
    },
  },
  {
    id: 'opp-010',
    propertyAddress: '6677 Desert Sage Way, Fountain Hills, AZ 85268',
    customerName: 'Taylor Home',
    customerPhone: '(480) 555-0901',
    opportunityType: 'annual_checkup',
    priority: 'low',
    healthScore: 88,
    failProbability: 0.12,
    jobComplexity: 'STANDARD',
    context: 'Annual inspection recommended. 3-year-old electric unit. Customer enrolled in maintenance plan.',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-010',
      brand: 'A.O. Smith',
      model: 'ENS-50',
      serialNumber: 'AOS-2021-5567-E',
      calendarAge: 3,
      location: 'Laundry Room',
      capacity: 50,
      fuelType: 'ELECTRIC',
      ventType: 'N/A',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'ELECTRIC',
      calendarAge: 3,
      warrantyYears: 6,
      qualityTier: 'MID',
      tankCapacity: 50,
      hasSoftener: true,
      measuredHardness: 6,
      streetHardness: 14,
      housePsi: 62,
      hasPrv: true,
      hasExpTank: true,
      isClosedLoop: true,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 2,
      lastFlushYearsAgo: 1,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ELECTRIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'GOOD',
    },
  },
  {
    id: 'opp-011',
    propertyAddress: '8899 Thunderbird Rd, Surprise, AZ 85374',
    customerName: 'Garcia Residence',
    customerPhone: '(623) 555-0234',
    opportunityType: 'annual_checkup',
    priority: 'low',
    healthScore: 85,
    failProbability: 0.15,
    jobComplexity: 'STANDARD',
    context: 'Routine annual check. 4-year-old electric unit. No issues reported.',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    status: 'pending',
    asset: {
      id: 'asset-011',
      brand: 'Whirlpool',
      model: 'E50H6-45',
      serialNumber: 'WP-2020-3345-E',
      calendarAge: 4,
      location: 'Garage',
      capacity: 50,
      fuelType: 'ELECTRIC',
      ventType: 'N/A',
      warrantyYears: 6,
    },
    forensicInputs: {
      fuelType: 'ELECTRIC',
      calendarAge: 4,
      warrantyYears: 6,
      qualityTier: 'ENTRY',
      tankCapacity: 50,
      hasSoftener: false,
      measuredHardness: 12,
      streetHardness: 14,
      housePsi: 65,
      hasPrv: true,
      hasExpTank: false,
      isClosedLoop: false,
      hasCircPump: false,
      tempSetting: 'NORMAL',
      peopleCount: 3,
      lastFlushYearsAgo: 2,
      lastAnodeReplaceYearsAgo: null,
      ventType: 'ELECTRIC',
      isLeaking: false,
      visualRust: false,
      anodeStatus: 'GOOD',
    },
  },
];

// ============ Pipeline Data ============

export const mockPipeline: MockPipeline = {
  stages: [
    { name: 'New', count: 8 },
    { name: 'Contacted', count: 5 },
    { name: 'Scheduled', count: 3 },
    { name: 'Completed', count: 12 },
  ],
  conversionRate: 0.42,
  closes: {
    maintenance: {
      total: 18,
      breakdown: {
        flush: 8,
        anode: 5,
        descale: 3,
        inspection: 2,
      },
    },
    codeFixes: {
      total: 7,
      breakdown: {
        expTank: 3,
        prv: 2,
        softener: 2,
      },
    },
    replacements: {
      total: 4,
    },
    thisMonth: 29,
    lastMonth: 24,
    trend: 'up',
  },
};

// ============ Helper Functions ============

export function getOpportunityCountsByPriority(opportunities: MockOpportunity[]): Record<Priority, number> {
  const counts: Record<Priority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  
  for (const opp of opportunities) {
    counts[opp.priority]++;
  }
  
  return counts;
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

export function getOpportunityTypeLabel(type: OpportunityType): string {
  const labels: Record<OpportunityType, string> = {
    replacement_urgent: 'Urgent Replacement',
    replacement_recommended: 'Replacement Recommended',
    warranty_expiring: 'Warranty Expiring',
    anode_due: 'Anode Service Due',
    flush_due: 'Flush Due',
    descale_due: 'Descale Due',
    annual_checkup: 'Annual Checkup',
  };
  return labels[type];
}

export function getUnitSummary(asset: TankAsset): string {
  const fuelLabel = asset.fuelType === 'GAS' ? 'Gas' : 'Electric';
  return `${asset.calendarAge}yr ${asset.brand} ${fuelLabel} ${asset.capacity}gal in ${asset.location}`;
}
