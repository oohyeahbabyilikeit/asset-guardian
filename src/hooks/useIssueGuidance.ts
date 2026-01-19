import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { IssueGuidanceContext } from '@/lib/issueGuidanceContext';
import { getStaticGuidance } from '@/lib/issueGuidanceContext';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';

export interface IssueGuidance {
  headline: string;
  explanation: string;
  yourSituation: string;
  recommendation: string;
  economicContext: string;
  actionItems: string[];
  shouldFix: boolean;
}

interface UseIssueGuidanceResult {
  guidance: IssueGuidance | null;
  isLoading: boolean;
  error: string | null;
  fetchGuidance: (context: IssueGuidanceContext) => Promise<void>;
  getStaticFallback: (
    issue: InfrastructureIssue,
    isServiceable: boolean,
    healthScore: number,
    location: string
  ) => IssueGuidance;
}

export function useIssueGuidance(): UseIssueGuidanceResult {
  const [guidance, setGuidance] = useState<IssueGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuidance = useCallback(async (context: IssueGuidanceContext) => {
    setIsLoading(true);
    setError(null);
    setGuidance(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-issue-guidance', {
        body: { context },
      });

      if (fnError) {
        throw fnError;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.guidance) {
        setGuidance(data.guidance);
      } else {
        throw new Error('No guidance returned');
      }
    } catch (err) {
      console.error('Error fetching issue guidance:', err);
      setError(err instanceof Error ? err.message : 'Failed to load guidance');
      
      // Use static fallback on error
      // Note: Caller should use getStaticFallback with full context
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStaticFallback = useCallback((
    issue: InfrastructureIssue,
    isServiceable: boolean,
    healthScore: number,
    location: string
  ): IssueGuidance => {
    return getStaticGuidance(issue, isServiceable, healthScore, location);
  }, []);

  return {
    guidance,
    isLoading,
    error,
    fetchGuidance,
    getStaticFallback,
  };
}
