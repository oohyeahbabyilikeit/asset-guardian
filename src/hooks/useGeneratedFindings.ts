import { useState, useEffect, useCallback, useRef } from 'react';
import { ForensicInputs, OpterraResult, isTankless } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue } from '@/lib/infrastructureIssues';

interface GeneratedFinding {
  title: string;
  measurement: string;
  explanation: string;
}

interface FindingContext {
  unitType: 'tank' | 'tankless' | 'hybrid';
  manufacturer?: string;
  model?: string;
  calendarAge: number;
  bioAge: number;
  fuelType: string;
  tankCapacity?: number;
  warrantyYears?: number;
  hardnessGPG: number;
  hasSoftener: boolean;
  housePsi: number;
  hasPrv: boolean;
  hasExpTank: boolean;
  expTankStatus?: string;
  isClosedLoop: boolean;
  lastFlushYearsAgo?: number;
  lastAnodeReplaceYearsAgo?: number;
  lastDescaleYearsAgo?: number;
  visualRust: boolean;
  isLeaking: boolean;
  leakSource?: string;
  healthScore: number;
  failProb: number;
  sedimentLbs?: number;
  shieldLife?: number;
  scaleBuildupScore?: number;
  stressFactors: {
    pressure?: number;
    chemical?: number;
    mechanical?: number;
    sediment?: number;
  };
  isReplacementRecommended: boolean;
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR';
}

// In-memory cache for generated findings
const findingsCache = new Map<string, GeneratedFinding>();

function getCacheKey(findingType: string, inputs: ForensicInputs): string {
  // Create a cache key based on finding type and key inputs that affect content
  return `${findingType}-${inputs.calendarAge}-${inputs.hardnessGPG}-${inputs.housePsi}-${inputs.manufacturer || 'unknown'}`;
}

function buildContext(
  inputs: ForensicInputs,
  result: OpterraResult,
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR'
): FindingContext {
  const isTanklessUnit = isTankless(inputs.fuelType);
  const isHybrid = inputs.fuelType === 'HYBRID';
  
  return {
    unitType: isTanklessUnit ? 'tankless' : isHybrid ? 'hybrid' : 'tank',
    manufacturer: inputs.manufacturer,
    model: inputs.modelNumber,
    calendarAge: inputs.calendarAge,
    bioAge: result.metrics.bioAge,
    fuelType: inputs.fuelType,
    tankCapacity: inputs.tankCapacity,
    warrantyYears: inputs.warrantyYears,
    hardnessGPG: inputs.hardnessGPG,
    hasSoftener: inputs.hasSoftener,
    housePsi: inputs.housePsi,
    hasPrv: inputs.hasPrv,
    hasExpTank: inputs.hasExpTank,
    expTankStatus: inputs.expTankStatus,
    isClosedLoop: inputs.isClosedLoop,
    lastFlushYearsAgo: inputs.lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo: inputs.lastAnodeReplaceYearsAgo,
    lastDescaleYearsAgo: inputs.lastDescaleYearsAgo,
    visualRust: inputs.visualRust,
    isLeaking: inputs.isLeaking ?? false,
    leakSource: inputs.leakSource,
    healthScore: result.metrics.healthScore,
    failProb: result.metrics.failProb,
    sedimentLbs: result.metrics.sedimentLbs,
    shieldLife: result.metrics.shieldLife,
    scaleBuildupScore: result.metrics.scaleBuildupScore,
    stressFactors: {
      pressure: result.metrics.stressFactors?.pressure,
      chemical: result.metrics.stressFactors?.chemical,
      mechanical: result.metrics.stressFactors?.mechanical,
      sediment: result.metrics.stressFactors?.sediment,
    },
    isReplacementRecommended: result.verdict.action === 'REPLACE',
    recommendationType,
  };
}

async function generateFinding(
  findingType: string,
  context: FindingContext
): Promise<GeneratedFinding | null> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-findings`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ findingType, context }),
      }
    );

    if (!response.ok) {
      console.warn(`[useGeneratedFindings] Failed to generate ${findingType}:`, response.status);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn(`[useGeneratedFindings] Error for ${findingType}:`, data.error);
      return null;
    }

    return data as GeneratedFinding;
  } catch (error) {
    console.warn(`[useGeneratedFindings] Exception for ${findingType}:`, error);
    return null;
  }
}

// Determine which finding types to generate based on the assessment
function determineFindingTypes(inputs: ForensicInputs, result: OpterraResult): string[] {
  const findings: string[] = [];
  const isTanklessUnit = isTankless(inputs.fuelType);
  const isReplacementRecommended = result.verdict.action === 'REPLACE';
  const metrics = result.metrics;
  
  // Leak findings
  if (inputs.isLeaking && inputs.leakSource) {
    if (inputs.leakSource === 'TANK_BODY') {
      findings.push(isTanklessUnit ? 'leak-heat-exchanger' : 'leak-tank-body');
    } else if (inputs.leakSource === 'FITTING_VALVE') {
      findings.push('leak-fitting');
    } else if (inputs.leakSource === 'DRAIN_PAN') {
      findings.push('leak-drain-pan');
    }
  } else if (inputs.isLeaking) {
    findings.push('leak-tank-body'); // Legacy fallback
  }

  // Pressure findings
  if (inputs.housePsi > 80) {
    findings.push('pressure-critical');
  } else if (inputs.housePsi >= 70) {
    findings.push('pressure-high');
  }

  // Expansion tank issues
  const isClosedSystem = inputs.isClosedLoop || inputs.hasPrv || inputs.hasCircPump;
  const hasWorkingExpTank = inputs.expTankStatus === 'FUNCTIONAL' || 
    (inputs.hasExpTank && inputs.expTankStatus !== 'WATERLOGGED' && inputs.expTankStatus !== 'MISSING');
  if (isClosedSystem && !hasWorkingExpTank) {
    findings.push('expansion-tank');
  }

  // Hardness findings
  if (inputs.hardnessGPG > 15) {
    findings.push('hardness-critical');
  } else if (inputs.hardnessGPG > 10) {
    findings.push('hardness-moderate');
  }

  // Aging findings
  const maxLifespan = isTanklessUnit ? 18 : 12;
  if (metrics.bioAge >= maxLifespan * 0.8 || metrics.failProb > 0.5) {
    findings.push('aging');
  }

  // Visual rust (tank only)
  if (inputs.visualRust && !isTanklessUnit) {
    findings.push('rust');
  }

  // Maintenance findings
  if (!isTanklessUnit) {
    // Anode rod
    if (metrics.shieldLife !== undefined && metrics.shieldLife < 30 && !isReplacementRecommended && inputs.calendarAge <= 8) {
      findings.push('anode-rod');
    }
    // Sediment
    const lastFlush = inputs.lastFlushYearsAgo ?? 99;
    if (lastFlush >= 5 && inputs.hardnessGPG > 7) {
      findings.push('sediment');
    }
  } else {
    // Tankless descale
    const lastDescale = inputs.lastDescaleYearsAgo ?? 99;
    if (lastDescale >= 2 && inputs.hardnessGPG > 7) {
      findings.push('descale');
    }
  }

  // If no significant issues, add healthy finding
  if (findings.length === 0) {
    findings.push('healthy');
  }

  // Always add economic guidance
  findings.push('economic-guidance');

  return findings;
}

export interface GeneratedFindingsState {
  findings: Map<string, GeneratedFinding>;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
}

export function useGeneratedFindings(
  inputs: ForensicInputs | null,
  result: OpterraResult | null,
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR' = 'MONITOR'
): GeneratedFindingsState {
  const [state, setState] = useState<GeneratedFindingsState>({
    findings: new Map(),
    isLoading: false,
    isComplete: false,
    error: null,
  });
  
  const generationStartedRef = useRef(false);

  useEffect(() => {
    if (!inputs || !result || generationStartedRef.current) return;
    
    generationStartedRef.current = true;
    
    const generateAll = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const findingTypes = determineFindingTypes(inputs, result);
      const context = buildContext(inputs, result, recommendationType);
      const generated = new Map<string, GeneratedFinding>();
      
      // Generate findings in parallel (batch of 3 at a time to avoid rate limits)
      const batchSize = 3;
      for (let i = 0; i < findingTypes.length; i += batchSize) {
        const batch = findingTypes.slice(i, i + batchSize);
        const promises = batch.map(async (type) => {
          // Check cache first
          const cacheKey = getCacheKey(type, inputs);
          const cached = findingsCache.get(cacheKey);
          if (cached) {
            return { type, finding: cached };
          }
          
          const finding = await generateFinding(type, context);
          if (finding) {
            findingsCache.set(cacheKey, finding);
          }
          return { type, finding };
        });
        
        const results = await Promise.all(promises);
        results.forEach(({ type, finding }) => {
          if (finding) {
            generated.set(type, finding);
          }
        });
        
        // Update state progressively
        setState(prev => ({
          ...prev,
          findings: new Map([...prev.findings, ...generated]),
        }));
      }
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isComplete: true,
      }));
    };
    
    generateAll().catch(error => {
      console.error('[useGeneratedFindings] Generation failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    });
  }, [inputs, result, recommendationType]);

  return state;
}

// Hook for prefetching findings in background
export function usePrefetchFindings() {
  const prefetchedRef = useRef<Set<string>>(new Set());
  
  const prefetch = useCallback(async (
    inputs: ForensicInputs,
    result: OpterraResult,
    recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR' = 'MONITOR'
  ) => {
    // Create a unique key for this assessment
    const assessmentKey = `${inputs.calendarAge}-${inputs.housePsi}-${inputs.hardnessGPG}-${inputs.manufacturer || 'unknown'}`;
    
    if (prefetchedRef.current.has(assessmentKey)) {
      console.log('[usePrefetchFindings] Already prefetched for this assessment');
      return;
    }
    
    prefetchedRef.current.add(assessmentKey);
    console.log('[usePrefetchFindings] Starting background prefetch...');
    
    const findingTypes = determineFindingTypes(inputs, result);
    const context = buildContext(inputs, result, recommendationType);
    
    // Generate in background without blocking
    const batchSize = 3;
    for (let i = 0; i < findingTypes.length; i += batchSize) {
      const batch = findingTypes.slice(i, i + batchSize);
      const promises = batch.map(async (type) => {
        const cacheKey = getCacheKey(type, inputs);
        if (findingsCache.has(cacheKey)) {
          return; // Already cached
        }
        
        const finding = await generateFinding(type, context);
        if (finding) {
          findingsCache.set(cacheKey, finding);
          console.log(`[usePrefetchFindings] Cached: ${type}`);
        }
      });
      
      await Promise.all(promises);
    }
    
    console.log('[usePrefetchFindings] Prefetch complete');
  }, []);

  return { prefetch };
}

// Get a single finding from cache (for use in FindingsSummaryPage)
export function getCachedFinding(findingType: string, inputs: ForensicInputs): GeneratedFinding | null {
  const cacheKey = getCacheKey(findingType, inputs);
  return findingsCache.get(cacheKey) || null;
}

// Check if all findings are cached
export function areFindingsCached(inputs: ForensicInputs, result: OpterraResult): boolean {
  const findingTypes = determineFindingTypes(inputs, result);
  return findingTypes.every(type => {
    const cacheKey = getCacheKey(type, inputs);
    return findingsCache.has(cacheKey);
  });
}
