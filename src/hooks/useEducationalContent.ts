import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EducationalTopic } from '@/components/EducationalDrawer';
import { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';

export interface EducationalContent {
  title: string;
  description: string;
  sections: { heading: string; content: string }[];
  source?: string;
}

export interface EducationalContext {
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
}

interface UseEducationalContentOptions {
  topic: EducationalTopic;
  context?: EducationalContext;
  enabled?: boolean;
}

interface UseEducationalContentResult {
  content: EducationalContent | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Session cache to avoid redundant API calls
const contentCache = new Map<string, EducationalContent>();

// Generate cache key based on topic and key context values
function getCacheKey(topic: EducationalTopic, context?: EducationalContext): string {
  if (!context) return topic;
  
  const { inputs, metrics } = context;
  const keyParts = [
    topic,
    inputs.calendarAge?.toString() || '',
    inputs.hardnessGPG?.toString() || '',
    inputs.housePsi?.toString() || '',
    inputs.fuelType || '',
    Math.round(metrics.bioAge || 0).toString(),
    Math.round(metrics.sedimentLbs || 0).toString(),
  ];
  return keyParts.join('-');
}

// Transform context for the API
function transformContext(context?: EducationalContext) {
  if (!context) return {};
  
  const { inputs, metrics } = context;
  
  return {
    calendarAge: inputs.calendarAge,
    bioAge: metrics.bioAge,
    manufacturer: inputs.manufacturer,
    modelNumber: inputs.modelNumber,
    fuelType: inputs.fuelType,
    tankCapacity: inputs.tankCapacity,
    warrantyYears: inputs.warrantyYears,
    hardnessGPG: inputs.hardnessGPG,
    hasSoftener: inputs.hasSoftener,
    housePsi: inputs.housePsi,
    hasPrv: inputs.hasPrv,
    isClosedLoop: inputs.isClosedLoop,
    hasExpTank: inputs.hasExpTank,
    expTankStatus: inputs.expTankStatus,
    lastFlushYearsAgo: inputs.lastFlushYearsAgo,
    lastAnodeReplaceYearsAgo: inputs.lastAnodeReplaceYearsAgo,
    lastDescaleYearsAgo: inputs.lastDescaleYearsAgo,
    sedimentLbs: metrics.sedimentLbs,
    shieldLife: metrics.shieldLife,
    scaleBuildupScore: metrics.scaleBuildupScore,
    failProb: metrics.failProb,
    healthScore: metrics.healthScore,
    errorCodeCount: inputs.errorCodeCount,
    descaleStatus: metrics.descaleStatus,
  };
}

export function useEducationalContent({
  topic,
  context,
  enabled = true,
}: UseEducationalContentOptions): UseEducationalContentResult {
  const [content, setContent] = useState<EducationalContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheKey = getCacheKey(topic, context);
  
  const fetchContent = useCallback(async () => {
    // Check cache first
    const cached = contentCache.get(cacheKey);
    if (cached) {
      setContent(cached);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-educational-content',
        {
          body: {
            topic,
            context: transformContext(context),
          },
        }
      );
      
      if (fnError) {
        console.error('Error fetching educational content:', fnError);
        setError(fnError.message || 'Failed to generate content');
        return;
      }
      
      if (data?.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return;
      }
      
      const generatedContent: EducationalContent = {
        title: data.title,
        description: data.description,
        sections: data.sections || [],
        source: data.source,
      };
      
      // Cache the result
      contentCache.set(cacheKey, generatedContent);
      setContent(generatedContent);
      
    } catch (err) {
      console.error('Failed to fetch educational content:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [topic, cacheKey, context]);
  
  useEffect(() => {
    if (enabled && topic) {
      fetchContent();
    }
  }, [enabled, topic, fetchContent]);
  
  return {
    content,
    isLoading,
    error,
    refetch: fetchContent,
  };
}

// Pre-fetch multiple topics at once (useful for page load)
export function usePrefetchEducationalContent(
  topics: EducationalTopic[],
  context?: EducationalContext
) {
  const [loadingCount, setLoadingCount] = useState(0);
  
  useEffect(() => {
    if (!context || topics.length === 0) return;
    
    const fetchAll = async () => {
      const transformedContext = transformContext(context);
      
      const promises = topics.map(async (topic) => {
        const cacheKey = getCacheKey(topic, context);
        
        // Skip if already cached
        if (contentCache.has(cacheKey)) return;
        
        setLoadingCount(prev => prev + 1);
        
        try {
          const { data, error } = await supabase.functions.invoke(
            'generate-educational-content',
            {
              body: { topic, context: transformedContext },
            }
          );
          
          if (!error && data && !data.error) {
            contentCache.set(cacheKey, {
              title: data.title,
              description: data.description,
              sections: data.sections || [],
              source: data.source,
            });
          }
        } catch (err) {
          console.error(`Failed to prefetch ${topic}:`, err);
        } finally {
          setLoadingCount(prev => prev - 1);
        }
      });
      
      await Promise.allSettled(promises);
    };
    
    fetchAll();
  }, [topics, context]);
  
  return { isLoading: loadingCount > 0 };
}

// Clear cache (useful for testing or refresh)
export function clearEducationalContentCache() {
  contentCache.clear();
}
