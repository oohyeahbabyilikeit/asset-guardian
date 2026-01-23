import { type MockOpportunity } from '@/data/mockContractorData';

export type LeadCategory = 'replacements' | 'codeFixes' | 'maintenance';

export interface CodeFixIssue {
  type: 'missing_prv' | 'missing_exp_tank' | 'softener_recommended' | 'high_pressure' | 'closed_loop_risk';
  label: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface CategorizedOpportunity extends MockOpportunity {
  category: LeadCategory;
  codeFixIssues?: CodeFixIssue[];
  categoryLabel: string;
}

export interface CategorizedOpportunities {
  replacements: CategorizedOpportunity[];
  codeFixes: CategorizedOpportunity[];
  maintenance: CategorizedOpportunity[];
}

/**
 * Detect code fix issues from forensic inputs
 */
export function detectCodeFixIssues(opportunity: MockOpportunity): CodeFixIssue[] {
  const issues: CodeFixIssue[] = [];
  const forensic = opportunity.forensicInputs;
  
  if (!forensic) return issues;
  
  // High pressure without PRV
  const psi = forensic.housePsi ?? 0;
  const hasPrv = forensic.hasPrv ?? false;
  
  if (psi > 80 && !hasPrv) {
    issues.push({
      type: 'missing_prv',
      label: `${psi} PSI - No PRV`,
      severity: psi > 100 ? 'critical' : 'warning',
    });
  } else if (psi > 80) {
    issues.push({
      type: 'high_pressure',
      label: `High pressure: ${psi} PSI`,
      severity: 'warning',
    });
  }
  
  // Closed loop without expansion tank
  const isClosedLoop = forensic.isClosedLoop ?? false;
  const hasExpTank = forensic.hasExpTank ?? false;
  
  if (isClosedLoop && !hasExpTank) {
    issues.push({
      type: 'missing_exp_tank',
      label: 'Closed loop - No expansion tank',
      severity: 'critical',
    });
  }
  
  // High hardness without softener
  const hardness = forensic.hardnessGPG ?? forensic.streetHardnessGPG ?? 0;
  const hasSoftener = forensic.hasSoftener ?? false;
  
  if (hardness > 15 && !hasSoftener) {
    issues.push({
      type: 'softener_recommended',
      label: `${hardness} GPG - No softener`,
      severity: 'warning',
    });
  }
  
  return issues;
}

/**
 * Determine the primary category for an opportunity
 */
export function categorizeOpportunity(opportunity: MockOpportunity): LeadCategory {
  const { opportunityType, opterraResult, asset, forensicInputs } = opportunity;
  
  // Check for replacement indicators
  const isReplacement = 
    opportunityType === 'replacement_urgent' ||
    opportunityType === 'replacement_recommended' ||
    opportunityType === 'warranty_expiring' ||
    opterraResult?.verdictAction === 'REPLACE' ||
    forensicInputs?.isLeaking === true;
  
  if (isReplacement) {
    return 'replacements';
  }
  
  // Check for code fix indicators
  const codeFixIssues = detectCodeFixIssues(opportunity);
  if (codeFixIssues.length > 0) {
    return 'codeFixes';
  }
  
  // Check maintenance types
  const isMaintenanceType = 
    opportunityType === 'flush_due' ||
    opportunityType === 'anode_due' ||
    opportunityType === 'descale_due' ||
    opportunityType === 'annual_checkup' ||
    opportunityType === 'maintenance';
  
  if (isMaintenanceType) {
    return 'maintenance';
  }
  
  // Default based on health score and age
  const healthScore = opportunity.healthScore ?? 100;
  const age = asset.calendarAge ?? 0;
  
  if (healthScore <= 40 || age >= 12) {
    return 'replacements';
  }
  
  return 'maintenance';
}

/**
 * Get a human-readable label for the category
 */
export function getCategoryLabel(category: LeadCategory): string {
  switch (category) {
    case 'replacements':
      return 'Replacement';
    case 'codeFixes':
      return 'Code Fix';
    case 'maintenance':
      return 'Maintenance';
  }
}

/**
 * Categorize all opportunities into lanes
 */
export function categorizeOpportunities(opportunities: MockOpportunity[]): CategorizedOpportunities {
  const result: CategorizedOpportunities = {
    replacements: [],
    codeFixes: [],
    maintenance: [],
  };
  
  for (const opp of opportunities) {
    // Skip dismissed or converted
    if (opp.status === 'dismissed' || opp.status === 'converted') {
      continue;
    }
    
    const category = categorizeOpportunity(opp);
    const codeFixIssues = category === 'codeFixes' ? detectCodeFixIssues(opp) : undefined;
    
    const categorized: CategorizedOpportunity = {
      ...opp,
      category,
      codeFixIssues,
      categoryLabel: getCategoryLabel(category),
    };
    
    result[category].push(categorized);
  }
  
  // Sort each lane by priority then date
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortFn = (a: CategorizedOpportunity, b: CategorizedOpportunity) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.createdAt.getTime() - b.createdAt.getTime();
  };
  
  result.replacements.sort(sortFn);
  result.codeFixes.sort(sortFn);
  result.maintenance.sort(sortFn);
  
  return result;
}

/**
 * Get category-specific context string for display
 */
export function getCategoryContext(opp: CategorizedOpportunity): string {
  switch (opp.category) {
    case 'replacements':
      if (opp.forensicInputs?.isLeaking) return 'LEAKING';
      if (opp.opterraResult?.verdictAction === 'REPLACE') return 'Replace recommended';
      if (opp.opportunityType === 'warranty_expiring') return 'Warranty expiring';
      return `${opp.asset.calendarAge}yr old unit`;
      
    case 'codeFixes':
      if (opp.codeFixIssues && opp.codeFixIssues.length > 0) {
        return opp.codeFixIssues.map(i => i.label).join(' · ');
      }
      return 'Code violation detected';
      
    case 'maintenance':
      if (opp.opportunityType === 'flush_due') return 'Flush due';
      if (opp.opportunityType === 'anode_due') return 'Anode replacement due';
      if (opp.opportunityType === 'descale_due') return 'Descale needed';
      return 'Annual maintenance';
  }
}
