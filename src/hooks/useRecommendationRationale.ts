import { useState, useEffect, useCallback, useRef } from 'react';
import { ForensicInputs, OpterraResult, OpterraMetrics, isTankless } from '@/lib/opterraAlgorithm';

export interface RationaleSection {
  heading: string;
  content: string;
}

export interface RecommendationRationale {
  sections: RationaleSection[];
  isAIGenerated: boolean;
}

type RecommendationType = 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR';

interface BaseContext {
  unitType: 'tank' | 'tankless' | 'hybrid';
  manufacturer?: string;
  model?: string;
  calendarAge: number;
  bioAge: number;
  fuelType: string;
  tankCapacity?: number;
  warrantyYears?: number;
  warrantyRemaining: number;
  healthScore: number;
  failProb: number;
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  hardnessGPG: number;
  hasSoftener: boolean;
  housePsi: number;
  installLocation: string;
  isFinishedArea: boolean;
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  recommendationType: RecommendationType;
  recommendationTitle?: string;
}

interface ReplaceContext extends BaseContext {
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON';
  visualRust: boolean;
  isLeaking: boolean;
  leakSource?: string;
  estimatedRepairCost: number;
  estimatedReplacementCost: number;
  stressFactors?: {
    pressure?: number;
    chemical?: number;
    mechanical?: number;
    sediment?: number;
  };
}

interface MaintainContext extends BaseContext {
  recommendationType: 'MAINTAIN' | 'MONITOR';
  upcomingMaintenance?: {
    type: string;
    dueIn: string;
  }[];
}

// Cache for generated rationales
const rationaleCache = new Map<string, RecommendationRationale>();

function getCacheKey(inputs: ForensicInputs, recommendationType: RecommendationType): string {
  return `rationale-${recommendationType}-${inputs.calendarAge}-${inputs.hardnessGPG}-${inputs.housePsi}-${inputs.location}-${inputs.manufacturer || 'unknown'}`;
}

function buildReplaceContext(
  inputs: ForensicInputs,
  result: OpterraResult,
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON',
  estimatedRepairCost: number,
  estimatedReplacementCost: number
): ReplaceContext {
  const isTanklessUnit = isTankless(inputs.fuelType);
  const isHybrid = inputs.fuelType === 'HYBRID';
  const metrics = result.metrics;
  const warrantyRemaining = Math.max(0, (inputs.warrantyYears ?? 6) - inputs.calendarAge);
  
  return {
    unitType: isTanklessUnit ? 'tankless' : isHybrid ? 'hybrid' : 'tank',
    manufacturer: inputs.manufacturer,
    model: inputs.modelNumber,
    calendarAge: inputs.calendarAge,
    bioAge: metrics.bioAge,
    fuelType: inputs.fuelType,
    tankCapacity: inputs.tankCapacity,
    warrantyYears: inputs.warrantyYears,
    warrantyRemaining,
    healthScore: metrics.healthScore,
    failProb: metrics.failProb,
    sedimentLbs: metrics.sedimentLbs,
    shieldLife: metrics.shieldLife,
    scaleBuildupScore: metrics.scaleBuildupScore,
    hardnessGPG: inputs.hardnessGPG,
    hasSoftener: inputs.hasSoftener,
    housePsi: inputs.housePsi,
    installLocation: inputs.location,
    isFinishedArea: inputs.isFinishedArea ?? false,
    visualRust: inputs.visualRust,
    isLeaking: inputs.isLeaking ?? false,
    leakSource: inputs.leakSource,
    lastFlushYearsAgo: inputs.lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo: inputs.lastAnodeReplaceYearsAgo,
    lastDescaleYearsAgo: inputs.lastDescaleYearsAgo,
    estimatedRepairCost,
    estimatedReplacementCost,
    recommendationType,
    recommendationTitle: result.verdict.title,
    stressFactors: metrics.stressFactors,
  };
}

function buildMaintainContext(
  inputs: ForensicInputs,
  result: OpterraResult,
  recommendationType: 'MAINTAIN' | 'MONITOR'
): MaintainContext {
  const isTanklessUnit = isTankless(inputs.fuelType);
  const isHybrid = inputs.fuelType === 'HYBRID';
  const metrics = result.metrics;
  const warrantyRemaining = Math.max(0, (inputs.warrantyYears ?? 6) - inputs.calendarAge);
  
  return {
    unitType: isTanklessUnit ? 'tankless' : isHybrid ? 'hybrid' : 'tank',
    manufacturer: inputs.manufacturer,
    model: inputs.modelNumber,
    calendarAge: inputs.calendarAge,
    bioAge: metrics.bioAge,
    fuelType: inputs.fuelType,
    tankCapacity: inputs.tankCapacity,
    warrantyYears: inputs.warrantyYears,
    warrantyRemaining,
    healthScore: metrics.healthScore,
    failProb: metrics.failProb,
    sedimentLbs: metrics.sedimentLbs,
    shieldLife: metrics.shieldLife,
    scaleBuildupScore: metrics.scaleBuildupScore,
    hardnessGPG: inputs.hardnessGPG,
    hasSoftener: inputs.hasSoftener,
    housePsi: inputs.housePsi,
    installLocation: inputs.location,
    isFinishedArea: inputs.isFinishedArea ?? false,
    lastFlushYearsAgo: inputs.lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo: inputs.lastAnodeReplaceYearsAgo,
    lastDescaleYearsAgo: inputs.lastDescaleYearsAgo,
    recommendationType,
    recommendationTitle: result.verdict.title,
  };
}

async function generateReplaceRationale(context: ReplaceContext): Promise<RecommendationRationale | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-replacement-rationale`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ context }),
      }
    );

    if (!response.ok) {
      console.warn('[useRecommendationRationale] Replace generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn('[useRecommendationRationale] Error:', data.error);
      return null;
    }

    return { sections: data.sections, isAIGenerated: true };
  } catch (error) {
    console.warn('[useRecommendationRationale] Exception:', error);
    return null;
  }
}

async function generateMaintainRationale(context: MaintainContext): Promise<RecommendationRationale | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-maintain-rationale`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ context }),
      }
    );

    if (!response.ok) {
      console.warn('[useRecommendationRationale] Maintain generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn('[useRecommendationRationale] Error:', data.error);
      return null;
    }

    return { sections: data.sections, isAIGenerated: true };
  } catch (error) {
    console.warn('[useRecommendationRationale] Exception:', error);
    return null;
  }
}

// Static fallback content
function getStaticRationale(recommendationType: RecommendationType): RecommendationRationale {
  if (recommendationType === 'REPLACE_NOW') {
    return {
      sections: [
        {
          heading: "The Economics",
          content: "At this stage, repair costs often exceed their value. Investing in a new, efficient unit typically makes more financial sense than continuing to maintain aging equipment.",
        },
        {
          heading: "Peace of Mind",
          content: "A new water heater comes with a fresh warranty, improved efficiency, and modern safety features. You'll have reliable hot water for years to come.",
        },
        {
          heading: "Plan on Your Terms",
          content: "Replacing proactively means you choose the timing, compare options, and find the best fit for your home—rather than making a rushed decision later.",
        },
      ],
      isAIGenerated: false,
    };
  }
  
  if (recommendationType === 'REPLACE_SOON') {
    return {
      sections: [
        {
          heading: "The Planning Advantage",
          content: "Your unit still has some life left, but the wear patterns we measured suggest it's approaching end-of-life. Planning now means you control the timing and budget.",
        },
        {
          heading: "Budget Without Stress",
          content: "By setting aside funds monthly, you'll have the money ready when it's time. No emergency financing, no scrambling—just a smooth transition to a new unit.",
        },
        {
          heading: "Watch for Warning Signs",
          content: "In the meantime, watch for: rusty water, rumbling sounds, moisture around the base, or inconsistent temperatures. These signal it's time to act on your plan.",
        },
      ],
      isAIGenerated: false,
    };
  }
  
  if (recommendationType === 'MAINTAIN') {
    return {
      sections: [
        {
          heading: "Your Unit Is Healthy",
          content: "Based on our analysis, your water heater is performing well. With regular maintenance, you can expect many more years of reliable service.",
        },
        {
          heading: "What's Working",
          content: "The key factors keeping your unit healthy: proper water conditions, reasonable usage patterns, and the unit's current age puts it well within expected lifespan.",
        },
        {
          heading: "Keep It Running Strong",
          content: "Continue with regular maintenance—annual inspections, timely flushes, and anode rod checks will maximize your unit's lifespan and efficiency.",
        },
      ],
      isAIGenerated: false,
    };
  }
  
  // MONITOR
  return {
    sections: [
      {
        heading: "Monitor Your Unit",
        content: "Your water heater is functioning, but we've identified some areas to watch. With proper attention, you can extend its useful life.",
      },
      {
        heading: "Areas to Watch",
        content: "Pay attention to water temperature consistency, any unusual sounds, and check periodically for moisture around the base of the unit.",
      },
      {
        heading: "Recommended Actions",
        content: "Schedule maintenance soon to address any developing issues before they become problems. Regular checkups will help catch issues early.",
      },
    ],
    isAIGenerated: false,
  };
}

export interface UseRecommendationRationaleResult {
  rationale: RecommendationRationale | null;
  isLoading: boolean;
  error: string | null;
}

export function useRecommendationRationale(
  inputs: ForensicInputs | null,
  result: OpterraResult | null,
  recommendationType: RecommendationType,
  estimatedRepairCost: number = 500,
  estimatedReplacementCost: number = 2500
): UseRecommendationRationaleResult {
  const [rationale, setRationale] = useState<RecommendationRationale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationStartedRef = useRef(false);

  useEffect(() => {
    if (!inputs || !result || generationStartedRef.current) return;
    
    generationStartedRef.current = true;
    
    const generate = async () => {
      // Check cache first
      const cacheKey = getCacheKey(inputs, recommendationType);
      const cached = rationaleCache.get(cacheKey);
      if (cached) {
        console.log('[useRecommendationRationale] Using cached rationale');
        setRationale(cached);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      let generated: RecommendationRationale | null = null;
      
      if (recommendationType === 'REPLACE_NOW' || recommendationType === 'REPLACE_SOON') {
        const context = buildReplaceContext(inputs, result, recommendationType, estimatedRepairCost, estimatedReplacementCost);
        generated = await generateReplaceRationale(context);
      } else {
        const context = buildMaintainContext(inputs, result, recommendationType);
        generated = await generateMaintainRationale(context);
      }
      
      if (generated) {
        rationaleCache.set(cacheKey, generated);
        setRationale(generated);
      } else {
        // Use static fallback
        const fallback = getStaticRationale(recommendationType);
        setRationale(fallback);
      }
      
      setIsLoading(false);
    };
    
    generate().catch(err => {
      console.error('[useRecommendationRationale] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRationale(getStaticRationale(recommendationType));
      setIsLoading(false);
    });
  }, [inputs, result, recommendationType, estimatedRepairCost, estimatedReplacementCost]);

  return { rationale, isLoading, error };
}

// Prefetch function to generate rationale in background
export function usePrefetchRationale() {
  const prefetchedRef = useRef<Set<string>>(new Set());
  
  const prefetch = useCallback(async (
    inputs: ForensicInputs,
    result: OpterraResult,
    recommendationType: RecommendationType,
    estimatedRepairCost: number = 500,
    estimatedReplacementCost: number = 2500
  ) => {
    const cacheKey = getCacheKey(inputs, recommendationType);
    
    if (prefetchedRef.current.has(cacheKey) || rationaleCache.has(cacheKey)) {
      console.log('[usePrefetchRationale] Already cached');
      return;
    }
    
    prefetchedRef.current.add(cacheKey);
    console.log('[usePrefetchRationale] Starting background prefetch...');
    
    let generated: RecommendationRationale | null = null;
    
    if (recommendationType === 'REPLACE_NOW' || recommendationType === 'REPLACE_SOON') {
      const context = buildReplaceContext(inputs, result, recommendationType, estimatedRepairCost, estimatedReplacementCost);
      generated = await generateReplaceRationale(context);
    } else {
      const context = buildMaintainContext(inputs, result, recommendationType);
      generated = await generateMaintainRationale(context);
    }
    
    if (generated) {
      rationaleCache.set(cacheKey, generated);
      console.log('[usePrefetchRationale] Cached rationale');
    }
  }, []);

  return { prefetch };
}

// Get cached rationale
export function getCachedRationale(inputs: ForensicInputs, recommendationType: RecommendationType): RecommendationRationale | null {
  const cacheKey = getCacheKey(inputs, recommendationType);
  return rationaleCache.get(cacheKey) || null;
}

// Check if rationale is cached
export function isRationaleCached(inputs: ForensicInputs, recommendationType: RecommendationType): boolean {
  const cacheKey = getCacheKey(inputs, recommendationType);
  return rationaleCache.has(cacheKey);
}
