// Mock data for contractor dashboard - based on realistic scenarios from mockAsset.ts

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
  unitSummary: string;
  healthScore: number;
  failProbability: number;
  jobComplexity: JobComplexity;
  context: string;
  createdAt: Date;
  status: 'pending' | 'viewed' | 'contacted' | 'converted' | 'dismissed';
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

// Generate realistic mock opportunities based on existing scenarios
export const mockOpportunities: MockOpportunity[] = [
  {
    id: '1',
    propertyAddress: '1847 Sunset Dr, Phoenix AZ',
    customerName: 'Johnson Family',
    customerPhone: '(602) 555-0142',
    opportunityType: 'replacement_urgent',
    priority: 'critical',
    unitSummary: '12yr Rheem Gas Tank in Attic',
    healthScore: 24,
    failProbability: 78,
    jobComplexity: 'ELEVATED',
    context: 'Active leak detected during routine inspection',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '2',
    propertyAddress: '2301 E Camelback Rd, Phoenix AZ',
    customerName: 'Williams Residence',
    customerPhone: '(480) 555-0198',
    opportunityType: 'replacement_urgent',
    priority: 'critical',
    unitSummary: '15yr Bradford White Electric in Finished Basement',
    healthScore: 18,
    failProbability: 85,
    jobComplexity: 'COMPLEX',
    context: 'Severe corrosion + T&P valve weeping - imminent failure risk',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '3',
    propertyAddress: '456 Oak Ave, Scottsdale AZ',
    customerName: 'Martinez Residence',
    customerPhone: '(480) 555-0234',
    opportunityType: 'warranty_expiring',
    priority: 'high',
    unitSummary: '5yr A.O. Smith Power Vent in Garage',
    healthScore: 62,
    failProbability: 18,
    jobComplexity: 'STANDARD',
    context: 'Factory warranty expires in 6 months - proactive replacement opportunity',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '4',
    propertyAddress: '789 Mesquite Ln, Tempe AZ',
    customerName: 'Chen Family',
    customerPhone: '(602) 555-0876',
    opportunityType: 'replacement_recommended',
    priority: 'high',
    unitSummary: '10yr State Select Gas Tank in Closet',
    healthScore: 45,
    failProbability: 42,
    jobComplexity: 'ELEVATED',
    context: 'Anode fully depleted + high sediment - replacement more economical than repair',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'viewed',
  },
  {
    id: '5',
    propertyAddress: '1122 Palm Desert Way, Gilbert AZ',
    customerName: 'Thompson Home',
    customerPhone: '(480) 555-0345',
    opportunityType: 'replacement_recommended',
    priority: 'high',
    unitSummary: '8yr Navien Tankless in Utility Room',
    healthScore: 52,
    failProbability: 35,
    jobComplexity: 'STANDARD',
    context: 'Multiple error codes + descale overdue - upgrade to newer model recommended',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '6',
    propertyAddress: '3344 Saguaro Blvd, Mesa AZ',
    customerName: 'Rodriguez Family',
    customerPhone: '(602) 555-0567',
    opportunityType: 'anode_due',
    priority: 'medium',
    unitSummary: '6yr Rheem Hybrid in Garage',
    healthScore: 71,
    failProbability: 12,
    jobComplexity: 'STANDARD',
    context: 'Anode replacement due - last replaced 5 years ago',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '7',
    propertyAddress: '5566 Ironwood Dr, Chandler AZ',
    customerName: 'Patel Residence',
    customerPhone: '(480) 555-0789',
    opportunityType: 'flush_due',
    priority: 'medium',
    unitSummary: '4yr A.O. Smith Gas Tank in Garage',
    healthScore: 78,
    failProbability: 8,
    jobComplexity: 'STANDARD',
    context: 'Annual flush due - hard water area (18 GPG)',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '8',
    propertyAddress: '7788 Ocotillo St, Glendale AZ',
    customerName: 'Kim Family',
    customerPhone: '(623) 555-0123',
    opportunityType: 'descale_due',
    priority: 'medium',
    unitSummary: '3yr Rinnai Tankless in Garage',
    healthScore: 82,
    failProbability: 6,
    jobComplexity: 'STANDARD',
    context: 'Descale service due - manufacturer recommended every 2 years',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: 'contacted',
  },
  {
    id: '9',
    propertyAddress: '9900 Cactus Wren Ln, Peoria AZ',
    customerName: 'Anderson Home',
    customerPhone: '(623) 555-0456',
    opportunityType: 'flush_due',
    priority: 'medium',
    unitSummary: '7yr Bradford White Electric in Utility',
    healthScore: 68,
    failProbability: 15,
    jobComplexity: 'STANDARD',
    context: 'Flush overdue by 18 months + moderate sediment detected',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '10',
    propertyAddress: '2233 Quail Run, Scottsdale AZ',
    customerName: 'Davis Residence',
    customerPhone: '(480) 555-0901',
    opportunityType: 'anode_due',
    priority: 'medium',
    unitSummary: '5yr State Select Gas in Attic',
    healthScore: 74,
    failProbability: 11,
    jobComplexity: 'ELEVATED',
    context: 'Anode inspection recommended - no service history on record',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '11',
    propertyAddress: '4455 Dove Valley Rd, Cave Creek AZ',
    customerName: 'Miller Family',
    customerPhone: '(480) 555-0234',
    opportunityType: 'annual_checkup',
    priority: 'low',
    unitSummary: '2yr Rheem Gas Tank in Garage',
    healthScore: 92,
    failProbability: 3,
    jobComplexity: 'STANDARD',
    context: 'Annual maintenance checkup - healthy unit',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '12',
    propertyAddress: '6677 Desert Sage Way, Fountain Hills AZ',
    customerName: 'Taylor Home',
    customerPhone: '(480) 555-0567',
    opportunityType: 'annual_checkup',
    priority: 'low',
    unitSummary: '3yr A.O. Smith Hybrid in Garage',
    healthScore: 88,
    failProbability: 4,
    jobComplexity: 'STANDARD',
    context: 'Annual inspection due - no issues reported',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
  {
    id: '13',
    propertyAddress: '8899 Thunderbird Rd, Surprise AZ',
    customerName: 'Garcia Residence',
    customerPhone: '(623) 555-0789',
    opportunityType: 'annual_checkup',
    priority: 'low',
    unitSummary: '4yr Noritz Tankless in Utility',
    healthScore: 85,
    failProbability: 5,
    jobComplexity: 'STANDARD',
    context: 'Routine check recommended - filter inspection',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    status: 'pending',
  },
];

// Mock pipeline data - service-based closes (no revenue)
export const mockPipeline: MockPipeline = {
  stages: [
    { name: 'New', count: 8 },
    { name: 'Contacted', count: 4 },
    { name: 'Scheduled', count: 2 },
    { name: 'Completed', count: 12 },
  ],
  conversionRate: 46,
  closes: {
    maintenance: {
      total: 8,
      breakdown: { flush: 4, anode: 2, descale: 1, inspection: 1 }
    },
    codeFixes: {
      total: 3,
      breakdown: { expTank: 1, prv: 1, softener: 1 }
    },
    replacements: {
      total: 1,
    },
    thisMonth: 12,
    lastMonth: 9,
    trend: 'up',
  }
};

// Helper to get counts by priority
export function getOpportunityCountsByPriority(opportunities: MockOpportunity[]) {
  return {
    critical: opportunities.filter(o => o.priority === 'critical').length,
    high: opportunities.filter(o => o.priority === 'high').length,
    medium: opportunities.filter(o => o.priority === 'medium').length,
    low: opportunities.filter(o => o.priority === 'low').length,
  };
}

// Helper to format time ago
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

// Get opportunity type label
export function getOpportunityTypeLabel(type: OpportunityType): string {
  const labels: Record<OpportunityType, string> = {
    replacement_urgent: 'Urgent Replacement',
    replacement_recommended: 'Replacement Recommended',
    warranty_expiring: 'Warranty Expiring',
    anode_due: 'Anode Service Due',
    flush_due: 'Flush Service Due',
    descale_due: 'Descale Service Due',
    annual_checkup: 'Annual Checkup',
  };
  return labels[type];
}
