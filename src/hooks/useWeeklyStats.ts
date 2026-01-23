import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek } from 'date-fns';

export interface WeeklyStats {
  jobsBooked: number;
  revenue: number;
  fromAutomation: number;
  trend: number;
}

export function useWeeklyStats() {
  return useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async (): Promise<WeeklyStats> => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Get converted sequences this week
      const { data: conversions, error: convError } = await supabase
        .from('nurturing_sequences')
        .select('id, outcome, completed_at')
        .eq('outcome', 'converted')
        .gte('completed_at', weekStart.toISOString());

      if (convError) {
        console.error('Error fetching conversions:', convError);
      }

      const jobsBooked = conversions?.length ?? 0;
      
      // Estimate revenue based on conversions (demo purposes)
      // In production this would come from actual booking/invoice data
      const avgJobValue = 1400;
      const revenue = jobsBooked * avgJobValue;
      
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
