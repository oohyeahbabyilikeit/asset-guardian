// Hook for fetching pricing across multiple tiers in parallel
// with infrastructure issue bundling
import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateQuote, TotalQuote } from '@/lib/pricingService';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';
import { 
  InfrastructureIssue, 
  getIssuesForTier, 
  calculateIssueCosts 
} from '@/lib/infrastructureIssues';

export const DISPLAY_TIERS: QualityTier[] = ['BUILDER', 'STANDARD', 'PROFESSIONAL'];

export interface TierPricing {
  tier: QualityTier;
  quote: TotalQuote | null;
  loading: boolean;
  error: string | null;
  // NEW: Infrastructure bundling
  includedIssues: InfrastructureIssue[];
  issuesCost: { low: number; high: number };
  bundleTotal: { low: number; high: number; median: number } | null;
}

export interface UseTieredPricingResult {
  tiers: Record<QualityTier, TierPricing>;
  allLoading: boolean;
  refetchAll: () => void;
}

const DEMO_CONTRACTOR_ID = '00000000-0000-0000-0000-000000000001';

const TIER_CONFIG: Record<QualityTier, { label: string; warranty: number }> = {
  BUILDER: { label: 'Good', warranty: 6 },
  STANDARD: { label: 'Better', warranty: 9 },
  PROFESSIONAL: { label: 'Best', warranty: 12 },
  PREMIUM: { label: 'Premium', warranty: 15 },
};

const createEmptyTierPricing = (tier: QualityTier): TierPricing => ({
  tier,
  quote: null,
  loading: false,
  error: null,
  includedIssues: [],
  issuesCost: { low: 0, high: 0 },
  bundleTotal: null,
});

export function useTieredPricing(
  baseInputs: ForensicInputs,
  contractorId: string = DEMO_CONTRACTOR_ID,
  complexity: 'STANDARD' | 'CODE_UPGRADE' | 'DIFFICULT_ACCESS' | 'NEW_INSTALL' = 'STANDARD',
  enabled: boolean = true,
  infrastructureIssues: InfrastructureIssue[] = []
): UseTieredPricingResult {
  const [tiers, setTiers] = useState<Record<QualityTier, TierPricing>>({
    BUILDER: createEmptyTierPricing('BUILDER'),
    STANDARD: createEmptyTierPricing('STANDARD'),
    PROFESSIONAL: createEmptyTierPricing('PROFESSIONAL'),
    PREMIUM: createEmptyTierPricing('PREMIUM'),
  });

  // Pre-compute issues for each tier
  const tierIssues = useMemo(() => ({
    BUILDER: getIssuesForTier(infrastructureIssues, 'BUILDER'),
    STANDARD: getIssuesForTier(infrastructureIssues, 'STANDARD'),
    PROFESSIONAL: getIssuesForTier(infrastructureIssues, 'PROFESSIONAL'),
    PREMIUM: getIssuesForTier(infrastructureIssues, 'PREMIUM'),
  }), [infrastructureIssues]);

  const fetchTierPricing = useCallback(async (tier: QualityTier) => {
    const tierConfig = TIER_CONFIG[tier];
    const issues = tierIssues[tier];
    const issuesCost = calculateIssueCosts(issues);
    
    // Override warrantyYears to match the tier (this controls pricing lookup)
    const tierInputs: ForensicInputs = {
      ...baseInputs,
      warrantyYears: tierConfig.warranty,
    };

    setTiers(prev => ({
      ...prev,
      [tier]: { ...prev[tier], loading: true, error: null },
    }));

    try {
      const quote = await generateQuote(tierInputs, contractorId, complexity);
      
      // Calculate bundle total (base quote + infrastructure issues)
      const bundleTotal = quote.grandTotalRange ? {
        low: quote.grandTotalRange.low + issuesCost.low,
        high: quote.grandTotalRange.high + issuesCost.high,
        median: quote.grandTotalRange.median + Math.round((issuesCost.low + issuesCost.high) / 2),
      } : {
        low: quote.grandTotal + issuesCost.low,
        high: quote.grandTotal + issuesCost.high,
        median: quote.grandTotal + Math.round((issuesCost.low + issuesCost.high) / 2),
      };
      
      setTiers(prev => ({
        ...prev,
        [tier]: { 
          tier, 
          quote, 
          loading: false, 
          error: null,
          includedIssues: issues,
          issuesCost,
          bundleTotal,
        },
      }));
    } catch (err) {
      console.error(`Tier ${tier} pricing failed:`, err);
      setTiers(prev => ({
        ...prev,
        [tier]: { 
          tier, 
          quote: null, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Failed to load pricing',
          includedIssues: issues,
          issuesCost,
          bundleTotal: null,
        },
      }));
    }
  }, [baseInputs.fuelType, baseInputs.tankCapacity, baseInputs.ventType, contractorId, complexity, tierIssues]);

  const refetchAll = useCallback(() => {
    if (!enabled) return;
    DISPLAY_TIERS.forEach(tier => fetchTierPricing(tier));
  }, [fetchTierPricing, enabled]);

  useEffect(() => {
    if (enabled) {
      refetchAll();
    }
  }, [
    baseInputs.fuelType,
    baseInputs.tankCapacity,
    baseInputs.ventType,
    contractorId,
    complexity,
    enabled,
  ]);

  const allLoading = DISPLAY_TIERS.some(tier => tiers[tier].loading);

  return {
    tiers,
    allLoading,
    refetchAll,
  };
}

export { TIER_CONFIG };
