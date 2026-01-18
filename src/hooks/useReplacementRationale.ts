import { useState, useEffect, useCallback, useRef } from 'react';
import { ForensicInputs, OpterraResult, OpterraMetrics, isTankless } from '@/lib/opterraAlgorithm';

export interface RationaleSection {
  heading: string;
  content: string;
}

export interface ReplacementRationale {
  sections: RationaleSection[];
}

interface RationaleContext {
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
  visualRust: boolean;
  isLeaking: boolean;
  leakSource?: string;
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  estimatedRepairCost: number;
  estimatedReplacementCost: number;
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON';
  recommendationTitle?: string;
  stressFactors?: {
    pressure?: number;
    chemical?: number;
    mechanical?: number;
    sediment?: number;
  };
}

// Cache for generated rationales
const rationaleCache = new Map<string, ReplacementRationale>();

function getCacheKey(inputs: ForensicInputs): string {
  return `rationale-${inputs.calendarAge}-${inputs.hardnessGPG}-${inputs.housePsi}-${inputs.location}-${inputs.manufacturer || 'unknown'}`;
}

function buildContext(
  inputs: ForensicInputs,
  result: OpterraResult,
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON',
  estimatedRepairCost: number,
  estimatedReplacementCost: number
): RationaleContext {
  const isTanklessUnit = isTankless(inputs.fuelType);
  const isHybrid = inputs.fuelType === 'HYBRID';
  const metrics = result.metrics;
  
  // Calculate warranty remaining
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

async function generateRationale(context: RationaleContext): Promise<ReplacementRationale | null> {
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
      console.warn('[useReplacementRationale] Failed to generate:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn('[useReplacementRationale] Error:', data.error);
      return null;
    }

    return data as ReplacementRationale;
  } catch (error) {
    console.warn('[useReplacementRationale] Exception:', error);
    return null;
  }
}

// Static fallback content
function getStaticRationale(recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON'): ReplacementRationale {
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
    };
  }
  
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
  };
}

export interface UseReplacementRationaleResult {
  rationale: ReplacementRationale | null;
  isLoading: boolean;
  error: string | null;
}

export function useReplacementRationale(
  inputs: ForensicInputs | null,
  result: OpterraResult | null,
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON',
  estimatedRepairCost: number = 500,
  estimatedReplacementCost: number = 2500
): UseReplacementRationaleResult {
  const [rationale, setRationale] = useState<ReplacementRationale | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generationStartedRef = useRef(false);

  useEffect(() => {
    if (!inputs || !result || generationStartedRef.current) return;
    
    generationStartedRef.current = true;
    
    const generate = async () => {
      // Check cache first
      const cacheKey = getCacheKey(inputs);
      const cached = rationaleCache.get(cacheKey);
      if (cached) {
        console.log('[useReplacementRationale] Using cached rationale');
        setRationale(cached);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      const context = buildContext(inputs, result, recommendationType, estimatedRepairCost, estimatedReplacementCost);
      const generated = await generateRationale(context);
      
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
      console.error('[useReplacementRationale] Error:', err);
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
    recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON',
    estimatedRepairCost: number = 500,
    estimatedReplacementCost: number = 2500
  ) => {
    const cacheKey = getCacheKey(inputs);
    
    if (prefetchedRef.current.has(cacheKey) || rationaleCache.has(cacheKey)) {
      console.log('[usePrefetchRationale] Already cached');
      return;
    }
    
    prefetchedRef.current.add(cacheKey);
    console.log('[usePrefetchRationale] Starting background prefetch...');
    
    const context = buildContext(inputs, result, recommendationType, estimatedRepairCost, estimatedReplacementCost);
    const generated = await generateRationale(context);
    
    if (generated) {
      rationaleCache.set(cacheKey, generated);
      console.log('[usePrefetchRationale] Cached rationale');
    }
  }, []);

  return { prefetch };
}

// Get cached rationale
export function getCachedRationale(inputs: ForensicInputs): ReplacementRationale | null {
  const cacheKey = getCacheKey(inputs);
  return rationaleCache.get(cacheKey) || null;
}

// Check if rationale is cached
export function isRationaleCached(inputs: ForensicInputs): boolean {
  const cacheKey = getCacheKey(inputs);
  return rationaleCache.has(cacheKey);
}
