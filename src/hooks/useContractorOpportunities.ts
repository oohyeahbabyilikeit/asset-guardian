import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapDemoRowToMockOpportunity } from '@/lib/opportunityMapper';
import type { MockOpportunity, Priority } from '@/data/mockContractorData';

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Fetches all opportunities from the demo_opportunities table
 */
export function useContractorOpportunities() {
  return useQuery({
    queryKey: ['contractor-opportunities'],
    queryFn: async (): Promise<MockOpportunity[]> => {
      const { data, error } = await supabase
        .from('demo_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities:', error);
        throw error;
      }

      // Map DB rows to MockOpportunity type
      const opportunities = (data || []).map(mapDemoRowToMockOpportunity);

      // Sort by priority (critical first), then by date (oldest first within priority)
      return opportunities.sort((a, b) => {
        const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 3) - (PRIORITY_ORDER[b.priority] ?? 3);
        if (priorityDiff !== 0) return priorityDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    },
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });
}

/**
 * Fetches a single opportunity by ID
 */
export function useOpportunityById(id: string | null) {
  return useQuery({
    queryKey: ['contractor-opportunity', id],
    queryFn: async (): Promise<MockOpportunity | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('demo_opportunities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching opportunity:', error);
        throw error;
      }

      return data ? mapDemoRowToMockOpportunity(data) : null;
    },
    enabled: !!id,
  });
}

/**
 * Calculate priority counts from opportunities array
 */
export function getOpportunityCountsByPriority(
  opportunities: MockOpportunity[]
): Record<Priority, number> {
  const counts: Record<Priority, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const opp of opportunities) {
    if (opp.status !== 'dismissed' && opp.status !== 'converted') {
      counts[opp.priority] = (counts[opp.priority] || 0) + 1;
    }
  }

  return counts;
}
