import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek } from 'date-fns';

export interface WeeklyStats {
  jobsBooked: number;
  revenue: number;
  fromAutomation: number;
  trend: number;
}

interface NurturingSequenceRow {
  id: string;
  outcome: string | null;
  completed_at: string | null;
  revenue_usd: number | null;
}

export function useWeeklyStats() {
  return useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async (): Promise<WeeklyStats> => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Get converted sequences this week with revenue data
      const { data, error: convError } = await supabase
        .from('nurturing_sequences')
        .select('id, outcome, completed_at, revenue_usd')
        .eq('outcome', 'converted')
        .gte('completed_at', weekStart.toISOString());

      if (convError) {
        console.error('Error fetching conversions:', convError);
      }

      const conversions = (data || []) as unknown as NurturingSequenceRow[];
      const jobsBooked = conversions.length;
      
      // Sum actual revenue from logged conversions
      // Only count revenue that was manually entered via the celebration modal
      const revenue = conversions.reduce(
        (sum, c) => sum + (c.revenue_usd || 0), 
        0
      );
      
      // All booked jobs this week came from automation (in this demo)
      const fromAutomation = jobsBooked;
      
      // Mock trend for demo (would compare to previous week)
      const trend = jobsBooked > 0 ? 15 : 0;

      return {
        jobsBooked,
        revenue,
        fromAutomation,
        trend,
      };
    },
    staleTime: 60_000, // 1 minute
  });
}
