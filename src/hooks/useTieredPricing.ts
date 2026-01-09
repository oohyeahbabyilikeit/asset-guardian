// Hook for fetching pricing across multiple tiers in parallel
import { useState, useEffect, useCallback } from 'react';
import { generateQuote, TotalQuote } from '@/lib/pricingService';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';

export const DISPLAY_TIERS: QualityTier[] = ['BUILDER', 'STANDARD', 'PROFESSIONAL'];

export interface TierPricing {
  tier: QualityTier;
  quote: TotalQuote | null;
  loading: boolean;
  error: string | null;
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

export function useTieredPricing(
  baseInputs: ForensicInputs,
  contractorId: string = DEMO_CONTRACTOR_ID,
  complexity: 'STANDARD' | 'CODE_UPGRADE' | 'DIFFICULT_ACCESS' | 'NEW_INSTALL' = 'STANDARD',
  enabled: boolean = true
): UseTieredPricingResult {
  const [tiers, setTiers] = useState<Record<QualityTier, TierPricing>>({
    BUILDER: { tier: 'BUILDER', quote: null, loading: false, error: null },
    STANDARD: { tier: 'STANDARD', quote: null, loading: false, error: null },
    PROFESSIONAL: { tier: 'PROFESSIONAL', quote: null, loading: false, error: null },
    PREMIUM: { tier: 'PREMIUM', quote: null, loading: false, error: null },
  });

  const fetchTierPricing = useCallback(async (tier: QualityTier) => {
    const tierConfig = TIER_CONFIG[tier];
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
      setTiers(prev => ({
        ...prev,
        [tier]: { tier, quote, loading: false, error: null },
      }));
    } catch (err) {
      console.error(`Tier ${tier} pricing failed:`, err);
      setTiers(prev => ({
        ...prev,
        [tier]: { 
          tier, 
          quote: null, 
          loading: false, 
          error: err instanceof Error ? err.message : 'Failed to load pricing' 
        },
      }));
    }
  }, [baseInputs.fuelType, baseInputs.tankCapacity, baseInputs.ventType, contractorId, complexity]);

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
