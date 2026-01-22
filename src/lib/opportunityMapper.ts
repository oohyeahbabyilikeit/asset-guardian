import type { Tables } from '@/integrations/supabase/types';
import type { ForensicInputs } from '@/lib/opterraTypes';
import type { 
  MockOpportunity, 
  TankAsset, 
  OpportunityType, 
  Priority, 
  JobComplexity,
  OpterraResultSummary 
} from '@/data/mockContractorData';

type DemoOpportunityRow = Tables<'demo_opportunities'>;

/**
 * Maps a database row from demo_opportunities to the MockOpportunity type used by UI components
 */
export function mapDemoRowToMockOpportunity(row: DemoOpportunityRow): MockOpportunity {
  // Construct the full address
  const propertyAddress = [
    row.property_address,
    row.property_city,
    `${row.property_state} ${row.property_zip}`
  ].filter(Boolean).join(', ');

  // Map the asset from flat columns
  const asset: TankAsset = {
    id: row.id,
    brand: row.asset_brand,
    model: row.asset_model || '',
    serialNumber: row.asset_serial || '',
    calendarAge: Number(row.asset_age_years) || 0,
    location: row.asset_location || 'Unknown',
    capacity: row.asset_capacity,
    fuelType: (row.asset_fuel_type as 'GAS' | 'ELECTRIC') || 'GAS',
    ventType: row.asset_vent_type || 'Atmospheric',
    warrantyYears: row.asset_warranty_years,
  };

  // Parse forensic_inputs JSONB - it's already in camelCase format
  // Cast through unknown to handle the JSONB type from Supabase
  const forensicInputs = row.forensic_inputs as unknown as ForensicInputs;

  // Construct opterraResult from denormalized fields
  const opterraResult: OpterraResultSummary | undefined = row.health_score != null ? {
    healthScore: row.health_score,
    bioAge: Number(row.bio_age) || 0,
    failProb: Number(row.fail_probability) || 0,
    shieldLife: Number(row.shield_life) || 0,
    riskLevel: row.risk_level || 0,
    verdictAction: (row.verdict_action as 'MAINTAIN' | 'MONITOR' | 'REPLACE') || 'MONITOR',
    verdictTitle: row.verdict_title || '',
    anodeRemaining: row.anode_remaining != null ? Number(row.anode_remaining) : undefined,
  } : undefined;

  // Parse photo_urls JSONB
  const photoUrls = Array.isArray(row.photo_urls) 
    ? (row.photo_urls as string[]) 
    : [];

  // Map priority from DB (could be uppercase) to lowercase
  const priority = (row.priority?.toLowerCase() || 'medium') as Priority;

  // Map opportunity_type
  const opportunityType = (row.opportunity_type || 'annual_checkup') as OpportunityType;

  // Map job_complexity
  const jobComplexity = (row.job_complexity || 'STANDARD') as JobComplexity;

  // Map status
  const status = (row.status || 'pending') as MockOpportunity['status'];

  return {
    id: row.id,
    propertyAddress,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    customerEmail: row.customer_email || undefined,
    opportunityType,
    priority,
    healthScore: row.health_score || 0,
    failProbability: Number(row.fail_probability) || 0,
    jobComplexity,
    context: row.context_description || '',
    createdAt: new Date(row.created_at),
    status,
    asset,
    forensicInputs: forensicInputs,
    photoUrls,
    opterraResult,
    inspectionNotes: row.inspection_notes || undefined,
  };
}

/**
 * Maps a MockOpportunity to the format expected by the Sales Coach edge function
 */
export function mapMockOpportunityToSalesCoachOpportunity(opp: MockOpportunity) {
  // Check for symptoms in extended forensic data (if available from JSONB)
  const extendedForensics = opp.forensicInputs as ForensicInputs & { 
    symptoms?: { notEnoughHotWater?: boolean; lukewarmWater?: boolean } 
  };
  
  return {
    id: opp.id,
    propertyAddress: opp.propertyAddress,
    customerName: opp.customerName,
    opportunityType: opp.opportunityType,
    priority: opp.priority,
    healthScore: opp.healthScore,
    failProbability: opp.failProbability,
    jobComplexity: opp.jobComplexity,
    context: opp.context,
    asset: opp.asset,
    forensicInputs: {
      // Plumbing environment
      psiReading: opp.forensicInputs?.housePsi,
      hardness: opp.forensicInputs?.hardnessGPG ?? opp.forensicInputs?.streetHardnessGPG,
      hasExpansionTank: opp.forensicInputs?.hasExpTank,
      hasSoftener: opp.forensicInputs?.hasSoftener,
      ventType: opp.forensicInputs?.ventType,
      // Usage context for sizing analysis
      peopleCount: opp.forensicInputs?.peopleCount,
      usageType: opp.forensicInputs?.usageType,
      // Symptom flags (if available from extended JSONB data)
      runsOutOfHotWater: extendedForensics?.symptoms?.notEnoughHotWater,
      lukewarmWater: extendedForensics?.symptoms?.lukewarmWater,
    },
    opterraResult: opp.opterraResult,
    inspectionNotes: opp.inspectionNotes,
  };
}
