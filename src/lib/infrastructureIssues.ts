/**
 * Infrastructure Issue Detection for Tiered Pricing
 * 
 * Detects system infrastructure issues that should be bundled with water heater replacement.
 * These are NOT repairs for the old unit being replaced, but infrastructure work
 * that protects the NEW unit.
 * 
 * Categories:
 * - VIOLATION: Code-required fixes (included in ALL tiers)
 * - INFRASTRUCTURE: Recommended protective work (included in BETTER + BEST)
 * - OPTIMIZATION: Premium protection (included in BEST only)
 */

import type { ForensicInputs, OpterraMetrics, QualityTier } from './opterraAlgorithm';

export type IssueCategory = 'VIOLATION' | 'INFRASTRUCTURE' | 'OPTIMIZATION';

export interface InfrastructureIssue {
  id: string;
  name: string;
  category: IssueCategory;
  costMin: number;
  costMax: number;
  description: string;
  includedInTiers: QualityTier[];
}

// Which tiers include each category
const TIER_CATEGORY_MAP: Record<IssueCategory, QualityTier[]> = {
  VIOLATION: ['BUILDER', 'STANDARD', 'PROFESSIONAL', 'PREMIUM'],
  INFRASTRUCTURE: ['STANDARD', 'PROFESSIONAL', 'PREMIUM'],
  OPTIMIZATION: ['PROFESSIONAL', 'PREMIUM'],
};

/**
 * Detect infrastructure issues that should be bundled with replacement
 */
export function getInfrastructureIssues(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): InfrastructureIssue[] {
  const issues: InfrastructureIssue[] = [];

  // =====================================================
  // VIOLATIONS - Must be fixed for code compliance (ALL TIERS)
  // =====================================================

  // Missing Expansion Tank in closed loop system
  const isActuallyClosed = inputs.isClosedLoop || inputs.hasPrv || inputs.hasCircPump;
  if (isActuallyClosed && !inputs.hasExpTank) {
    issues.push({
      id: 'exp_tank_required',
      name: 'Expansion Tank Install',
      category: 'VIOLATION',
      costMin: 250,
      costMax: 400,
      description: 'Required in closed loop systems to prevent thermal expansion damage',
      includedInTiers: TIER_CATEGORY_MAP.VIOLATION,
    });
  }

  // PRV has failed (pressure > 80 PSI with PRV already installed)
  if (inputs.hasPrv && inputs.housePsi > 80) {
    issues.push({
      id: 'prv_failed',
      name: 'PRV Replacement',
      category: 'VIOLATION',
      costMin: 350,
      costMax: 550,
      description: 'Existing PRV has failed - pressure exceeds safe limits',
      includedInTiers: TIER_CATEGORY_MAP.VIOLATION,
    });
  }

  // Critical pressure without PRV (> 80 PSI, no PRV)
  if (!inputs.hasPrv && inputs.housePsi > 80) {
    issues.push({
      id: 'prv_critical',
      name: 'PRV Installation (Critical)',
      category: 'VIOLATION',
      costMin: 350,
      costMax: 550,
      description: 'Water pressure exceeds safe limits - PRV required',
      includedInTiers: TIER_CATEGORY_MAP.VIOLATION,
    });
  }

  // =====================================================
  // INFRASTRUCTURE - Recommended for protection (BETTER + BEST)
  // =====================================================

  // PRV recommended for high-but-safe pressure (70-80 PSI)
  if (!inputs.hasPrv && inputs.housePsi >= 70 && inputs.housePsi <= 80) {
    issues.push({
      id: 'prv_recommended',
      name: 'PRV Installation',
      category: 'INFRASTRUCTURE',
      costMin: 350,
      costMax: 550,
      description: 'Pressure is technically safe but high - PRV reduces stress on new unit',
      includedInTiers: TIER_CATEGORY_MAP.INFRASTRUCTURE,
    });
  }

  // Water softener needs service (softener present but hard water detected)
  if (inputs.hasSoftener && inputs.hardnessGPG > 10 && inputs.hardnessGPG <= 15) {
    issues.push({
      id: 'softener_service',
      name: 'Water Softener Service',
      category: 'INFRASTRUCTURE',
      costMin: 200,
      costMax: 350,
      description: 'Softener not working effectively - service restores protection',
      includedInTiers: TIER_CATEGORY_MAP.INFRASTRUCTURE,
    });
  }

  // Existing expansion tank may be waterlogged (has tank but still seeing pressure issues)
  if (inputs.hasExpTank && isActuallyClosed && metrics.stressFactors.loop > 1.2) {
    issues.push({
      id: 'exp_tank_replace',
      name: 'Expansion Tank Replacement',
      category: 'INFRASTRUCTURE',
      costMin: 250,
      costMax: 400,
      description: 'Existing expansion tank may be waterlogged - replacement recommended',
      includedInTiers: TIER_CATEGORY_MAP.INFRASTRUCTURE,
    });
  }

  // =====================================================
  // OPTIMIZATION - Premium protection (BEST only)
  // =====================================================

  // Water softener replacement (softener is failing badly)
  if (inputs.hasSoftener && inputs.hardnessGPG > 15) {
    // Remove the service recommendation if we're replacing
    const serviceIndex = issues.findIndex(i => i.id === 'softener_service');
    if (serviceIndex > -1) {
      issues.splice(serviceIndex, 1);
    }
    
    issues.push({
      id: 'softener_replace',
      name: 'Water Softener Replacement',
      category: 'OPTIMIZATION',
      costMin: 2200,
      costMax: 3000,
      description: 'Softener is no longer effective - replacement provides full protection',
      includedInTiers: TIER_CATEGORY_MAP.OPTIMIZATION,
    });
  }

  // PRV for longevity even at moderate pressure (60-69 PSI)
  if (!inputs.hasPrv && inputs.housePsi >= 60 && inputs.housePsi < 70) {
    issues.push({
      id: 'prv_longevity',
      name: 'PRV for Extended Life',
      category: 'OPTIMIZATION',
      costMin: 350,
      costMax: 550,
      description: 'Proactive PRV installation reduces wear and extends new unit lifespan',
      includedInTiers: TIER_CATEGORY_MAP.OPTIMIZATION,
    });
  }

  // No softener and hard water - recommend softener for best tier
  if (!inputs.hasSoftener && inputs.hardnessGPG > 10) {
    issues.push({
      id: 'softener_new',
      name: 'Water Softener Installation',
      category: 'OPTIMIZATION',
      costMin: 2400,
      costMax: 3200,
      description: 'Hard water detected - softener protects new unit from scale buildup',
      includedInTiers: TIER_CATEGORY_MAP.OPTIMIZATION,
    });
  }

  return issues;
}

/**
 * Filter issues to only those included in a specific tier
 */
export function getIssuesForTier(
  issues: InfrastructureIssue[],
  tier: QualityTier
): InfrastructureIssue[] {
  return issues.filter(issue => issue.includedInTiers.includes(tier));
}

/**
 * Calculate total cost range for issues in a tier
 */
export function calculateIssueCosts(issues: InfrastructureIssue[]): { low: number; high: number } {
  return issues.reduce(
    (acc, issue) => ({
      low: acc.low + issue.costMin,
      high: acc.high + issue.costMax,
    }),
    { low: 0, high: 0 }
  );
}

/**
 * Get issues by category
 */
export function getIssuesByCategory(
  issues: InfrastructureIssue[],
  category: IssueCategory
): InfrastructureIssue[] {
  return issues.filter(issue => issue.category === category);
}
