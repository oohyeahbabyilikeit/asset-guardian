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

/**
 * Pipeline stage metrics derived from opportunity statuses
 */
export interface PipelineMetrics {
  stages: { name: string; count: number }[];
  conversionRate: number;
  closes: {
    thisMonth: number;
    lastMonth: number;
    trend: 'up' | 'down' | 'flat';
  };
}

export function getPipelineMetrics(opportunities: MockOpportunity[]): PipelineMetrics {
  const newCount = opportunities.filter(o => o.status === 'pending').length;
  const contactedCount = opportunities.filter(o => o.status === 'viewed' || o.status === 'contacted').length;
  const scheduledCount = 0; // Reserved for future status
  const completedCount = opportunities.filter(o => o.status === 'converted').length;
  
  const total = opportunities.length;
  const conversionRate = total > 0 
    ? Math.round(((contactedCount + scheduledCount + completedCount) / total) * 100) 
    : 0;

  return {
    stages: [
      { name: 'New', count: newCount },
      { name: 'Contacted', count: contactedCount },
      { name: 'Scheduled', count: scheduledCount },
      { name: 'Done', count: completedCount },
    ],
    conversionRate,
    closes: {
      thisMonth: completedCount,
      lastMonth: Math.max(0, completedCount - 2), // Simulated for demo
      trend: completedCount >= 2 ? 'up' : 'flat',
    },
  };
}

/**
 * Service closes breakdown derived from opportunity types and forensic inputs
 */
export interface ClosesMetrics {
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'flat';
  maintenance: {
    total: number;
    breakdown: { flush: number; anode: number; descale: number };
  };
  codeFixes: {
    total: number;
    breakdown: { expTank: number; prv: number; softener: number };
  };
  replacements: {
    total: number;
  };
}

export function getClosesMetrics(opportunities: MockOpportunity[]): ClosesMetrics {
  // Maintenance counts by opportunity type
  const flushCount = opportunities.filter(o => o.opportunityType === 'flush_due').length;
  const anodeCount = opportunities.filter(o => o.opportunityType === 'anode_due').length;
  const descaleCount = opportunities.filter(o => o.opportunityType === 'descale_due').length;
  const maintenanceTotal = flushCount + anodeCount + descaleCount;

  // Code fixes derived from forensic inputs
  let expTankCount = 0;
  let prvCount = 0;
  let softenerCount = 0;

  for (const opp of opportunities) {
    const fi = opp.forensicInputs;
    if (fi) {
      if (!fi.hasExpTank && fi.isClosedLoop) expTankCount++;
      if (!fi.hasPrv && (fi.housePsi ?? 0) > 80) prvCount++;
      if (!fi.hasSoftener && (fi.hardnessGPG ?? 0) > 15) softenerCount++;
    }
  }
  const codeFixTotal = expTankCount + prvCount + softenerCount;

  // Replacements
  const replacementCount = opportunities.filter(
    o => o.opportunityType === 'replacement_urgent' || o.opportunityType === 'replacement_recommended'
  ).length;

  const thisMonth = maintenanceTotal + codeFixTotal + replacementCount;
  const lastMonth = Math.max(0, thisMonth - 3); // Simulated for demo

  return {
    thisMonth,
    lastMonth,
    trend: thisMonth > lastMonth ? 'up' : thisMonth < lastMonth ? 'down' : 'flat',
    maintenance: {
      total: maintenanceTotal,
      breakdown: { flush: flushCount, anode: anodeCount, descale: descaleCount },
    },
    codeFixes: {
      total: codeFixTotal,
      breakdown: { expTank: expTankCount, prv: prvCount, softener: softenerCount },
    },
    replacements: {
      total: replacementCount,
    },
  };
}
