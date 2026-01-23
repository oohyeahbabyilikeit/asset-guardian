import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays } from 'date-fns';

export type ActivityType = 'opened' | 'clicked' | 'booked' | 'started' | 'stopped';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  customerName: string;
  propertyAddress: string;
  sequenceType: string;
  messageContent?: string;
  timestamp: Date;
}

export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const sevenDaysAgo = subDays(new Date(), 7);
      const activities: ActivityItem[] = [];

      // Fetch sequence events with engagement
      const { data: events, error: eventsError } = await supabase
        .from('sequence_events')
        .select(`
          id,
          opened_at,
          clicked_at,
          executed_at,
          message_content,
          sequence_id
        `)
        .or(`opened_at.not.is.null,clicked_at.not.is.null,executed_at.gte.${sevenDaysAgo.toISOString()}`)
        .order('executed_at', { ascending: false })
        .limit(50);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        return [];
      }

      // Get unique sequence IDs
      const sequenceIds = [...new Set((events || []).map(e => e.sequence_id))];
      
      if (sequenceIds.length === 0) return [];

      // Fetch sequences with opportunity data
      const { data: sequences, error: seqError } = await supabase
        .from('nurturing_sequences')
        .select(`
          id,
          sequence_type,
          status,
          outcome,
          started_at,
          completed_at,
          opportunity_id
        `)
        .in('id', sequenceIds);

      if (seqError) {
        console.error('Error fetching sequences:', seqError);
        return [];
      }

      // Get opportunity IDs
      const opportunityIds = [...new Set((sequences || []).map(s => s.opportunity_id))];
      
      // Fetch opportunities
      const { data: opportunities, error: oppError } = await supabase
        .from('demo_opportunities')
        .select('id, customer_name, property_address')
        .in('id', opportunityIds);

      if (oppError) {
        console.error('Error fetching opportunities:', oppError);
      }

      // Create lookup maps
      const sequenceMap = new Map((sequences || []).map(s => [s.id, s]));
      const opportunityMap = new Map((opportunities || []).map(o => [o.id, o]));

      // Build activity items from events
      for (const event of (events || [])) {
        const sequence = sequenceMap.get(event.sequence_id);
        if (!sequence) continue;
        
        const opportunity = opportunityMap.get(sequence.opportunity_id);
        if (!opportunity) continue;

        // Clicked events
        if (event.clicked_at) {
          activities.push({
            id: `${event.id}-clicked`,
            type: 'clicked',
            customerName: opportunity.customer_name,
            propertyAddress: opportunity.property_address,
            sequenceType: sequence.sequence_type,
            messageContent: event.message_content || undefined,
            timestamp: new Date(event.clicked_at),
          });
        }

        // Opened events (only add if not already clicked)
        if (event.opened_at && !event.clicked_at) {
          activities.push({
            id: `${event.id}-opened`,
            type: 'opened',
            customerName: opportunity.customer_name,
            propertyAddress: opportunity.property_address,
            sequenceType: sequence.sequence_type,
            messageContent: event.message_content || undefined,
            timestamp: new Date(event.opened_at),
          });
        }
      }

      // Add sequence started events
      for (const sequence of (sequences || [])) {
        const opportunity = opportunityMap.get(sequence.opportunity_id);
        if (!opportunity) continue;
        
        const startedAt = new Date(sequence.started_at);
        if (startedAt >= sevenDaysAgo) {
          activities.push({
            id: `${sequence.id}-started`,
            type: 'started',
            customerName: opportunity.customer_name,
            propertyAddress: opportunity.property_address,
            sequenceType: sequence.sequence_type,
            timestamp: startedAt,
          });
        }

        // Booked/Converted events
        if (sequence.outcome === 'converted' && sequence.completed_at) {
          activities.push({
            id: `${sequence.id}-booked`,
            type: 'booked',
            customerName: opportunity.customer_name,
            propertyAddress: opportunity.property_address,
            sequenceType: sequence.sequence_type,
            timestamp: new Date(sequence.completed_at),
          });
        }

        // Stopped events
        if (sequence.status === 'cancelled' && sequence.completed_at) {
          activities.push({
            id: `${sequence.id}-stopped`,
            type: 'stopped',
            customerName: opportunity.customer_name,
            propertyAddress: opportunity.property_address,
            sequenceType: sequence.sequence_type,
            timestamp: new Date(sequence.completed_at),
          });
        }
      }

      // Sort by timestamp descending and limit
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    },
    staleTime: 30_000, // 30 seconds
  });
}
