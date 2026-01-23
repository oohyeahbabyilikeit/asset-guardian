import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface NurturingSequence {
  id: string;
  opportunityId: string;
  sequenceType: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  currentStep: number;
  totalSteps: number;
  nextActionAt: Date | null;
  startedAt: Date;
  completedAt: Date | null;
  outcome: 'converted' | 'lost' | 'stopped' | null;
  outcomeReason: string | null;
  outcomeAt: Date | null;
}

export interface EnrichedSequence extends NurturingSequence {
  customerName: string;
  propertyAddress: string;
  opportunityType: string;
}

export interface SequenceTemplate {
  id: string;
  name: string;
  triggerType: string;
  steps: SequenceStep[];
  isActive: boolean;
}

export interface SequenceStep {
  step: number;
  day: number;
  action: 'sms' | 'email' | 'call_reminder';
  message: string;
}

export interface SequenceStats {
  active: number;
  paused: number;
  completed: number;
  total: number;
}

// Raw DB row types (since types.ts hasn't been regenerated yet)
interface NurturingSequenceRow {
  id: string;
  opportunity_id: string;
  sequence_type: string;
  status: string;
  current_step: number;
  total_steps: number;
  next_action_at: string | null;
  started_at: string;
  completed_at: string | null;
  outcome: string | null;
  outcome_reason: string | null;
  outcome_at: string | null;
}

interface DemoOpportunityRow {
  id: string;
  customer_name: string;
  property_address: string;
  opportunity_type: string;
}

interface SequenceTemplateRow {
  id: string;
  name: string;
  trigger_type: string;
  steps: unknown;
  is_active: boolean;
}

/**
 * Normalize sequence type for consistent matching between sequences and templates
 */
export function normalizeSequenceType(type: string): string {
  const mappings: Record<string, string> = {
    'urgent_replace': 'replacement_urgent',
    'replacement_urgent': 'replacement_urgent',
    'maintenance_reminder': 'maintenance',
    'maintenance': 'maintenance',
    'code_violation': 'code_violation',
  };
  return mappings[type] || type;
}

function mapSequenceRow(row: NurturingSequenceRow): NurturingSequence {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    sequenceType: row.sequence_type,
    status: row.status as NurturingSequence['status'],
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    nextActionAt: row.next_action_at ? new Date(row.next_action_at) : null,
    startedAt: new Date(row.started_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    outcome: row.outcome as NurturingSequence['outcome'],
    outcomeReason: row.outcome_reason,
    outcomeAt: row.outcome_at ? new Date(row.outcome_at) : null,
  };
}

/**
 * Fetch all nurturing sequences, optionally filtered by opportunity
 */
export function useNurturingSequences(opportunityId?: string) {
  return useQuery({
    queryKey: ['nurturing-sequences', opportunityId],
    queryFn: async (): Promise<NurturingSequence[]> => {
      let query = supabase
        .from('nurturing_sequences' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const rows = (data || []) as unknown as NurturingSequenceRow[];
      return rows.map(mapSequenceRow);
    },
    staleTime: 30_000,
  });
}

/**
 * Fetch enriched sequences with customer data from demo_opportunities
 */
export function useEnrichedSequences() {
  return useQuery({
    queryKey: ['enriched-sequences'],
    queryFn: async (): Promise<EnrichedSequence[]> => {
      // Fetch sequences
      const { data: sequenceData, error: seqError } = await supabase
        .from('nurturing_sequences' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (seqError) throw seqError;
      
      // Fetch opportunities for enrichment
      const { data: opportunityData, error: oppError } = await supabase
        .from('demo_opportunities' as any)
        .select('id, customer_name, property_address, opportunity_type');
      
      if (oppError) throw oppError;
      
      const sequences = (sequenceData || []) as unknown as NurturingSequenceRow[];
      const opportunities = (opportunityData || []) as unknown as DemoOpportunityRow[];
      
      // Create lookup map
      const opportunityMap = new Map(
        opportunities.map(o => [o.id, o])
      );
      
      // Enrich sequences with customer data
      return sequences.map(row => {
        const opp = opportunityMap.get(row.opportunity_id);
        return {
          ...mapSequenceRow(row),
          customerName: opp?.customer_name || 'Unknown Customer',
          propertyAddress: opp?.property_address || 'Unknown Address',
          opportunityType: opp?.opportunity_type || 'unknown',
        };
      });
    },
    staleTime: 30_000,
  });
}

/**
 * Get sequence for a specific opportunity
 */
export function useOpportunitySequence(opportunityId: string | null) {
  return useQuery({
    queryKey: ['nurturing-sequence', opportunityId],
    queryFn: async (): Promise<NurturingSequence | null> => {
      if (!opportunityId) return null;
      
      const { data, error } = await supabase
        .from('nurturing_sequences' as any)
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const row = data as unknown as NurturingSequenceRow;
      return mapSequenceRow(row);
    },
    enabled: !!opportunityId,
    staleTime: 30_000,
  });
}

/**
 * Fetch sequence templates
 */
export function useSequenceTemplates() {
  return useQuery({
    queryKey: ['sequence-templates'],
    queryFn: async (): Promise<SequenceTemplate[]> => {
      const { data, error } = await supabase
        .from('sequence_templates' as any)
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      const rows = (data || []) as unknown as SequenceTemplateRow[];
      return rows.map(row => ({
        id: row.id,
        name: row.name,
        triggerType: row.trigger_type,
        steps: (row.steps as SequenceStep[]) || [],
        isActive: row.is_active,
      }));
    },
    staleTime: 60_000,
  });
}

/**
 * Fetch pulse metrics for the dashboard widget
 */
export function usePulseMetrics() {
  return useQuery({
    queryKey: ['pulse-metrics'],
    queryFn: async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Fetch sequences
      const { data: sequenceData, error: seqError } = await supabase
        .from('nurturing_sequences' as any)
        .select('id, status, outcome, created_at');

      if (seqError) throw seqError;

      const sequences = (sequenceData || []) as unknown as {
        id: string;
        status: string;
        outcome: string | null;
        created_at: string;
      }[];

      // Calculate enrolled (created in last 7 days)
      const enrolled7Days = sequences.filter(s => 
        new Date(s.created_at) >= sevenDaysAgo
      ).length;

      // Calculate active now
      const activeNow = sequences.filter(s => s.status === 'active').length;

      // Calculate converted
      const converted = sequences.filter(s => s.outcome === 'converted').length;

      // Fetch events for engagement (opened or clicked in last 24h)
      const { data: eventData, error: evtError } = await supabase
        .from('sequence_events' as any)
        .select('id, opened_at, clicked_at')
        .or(`opened_at.gte.${oneDayAgo.toISOString()},clicked_at.gte.${oneDayAgo.toISOString()}`);

      if (evtError) {
        // If there's an error (e.g., no events), just return 0 for engaged
        console.warn('Could not fetch events for engagement:', evtError);
        return { enrolled7Days, activeNow, engaged24h: 0, converted };
      }

      const engaged24h = (eventData || []).length;

      return {
        enrolled7Days,
        activeNow,
        engaged24h,
        converted,
      };
    },
    staleTime: 30_000,
  });
}

/**
 * Calculate sequence statistics
 */
export function getSequenceStats(sequences: NurturingSequence[]): SequenceStats {
  return {
    active: sequences.filter(s => s.status === 'active').length,
    paused: sequences.filter(s => s.status === 'paused').length,
    completed: sequences.filter(s => s.status === 'completed').length,
    total: sequences.length,
  };
}

/**
 * Mutation to pause/resume a sequence
 */
export function useToggleSequenceStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sequenceId, newStatus }: { sequenceId: string; newStatus: 'active' | 'paused' }) => {
      const { error } = await supabase
        .from('nurturing_sequences' as any)
        .update({ status: newStatus })
        .eq('id', sequenceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequence'] });
    },
  });
}

/**
 * Mutation to start a new sequence for an opportunity
 * Creates both the sequence AND the corresponding events for each step
 */
export function useStartSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      opportunityId, 
      sequenceType, 
      totalSteps,
      templateSteps,
    }: { 
      opportunityId: string; 
      sequenceType: string; 
      totalSteps: number;
      templateSteps?: SequenceStep[];
    }) => {
      const startDate = new Date();
      const firstStepDate = addDays(startDate, 1);
      
      // Insert the sequence
      const { data: seqData, error: seqError } = await supabase
        .from('nurturing_sequences' as any)
        .insert({
          opportunity_id: opportunityId,
          sequence_type: sequenceType,
          status: 'active',
          current_step: 1,
          total_steps: totalSteps,
          next_action_at: firstStepDate.toISOString(),
        })
        .select('id')
        .single();
      
      if (seqError) throw seqError;
      
      const sequenceId = (seqData as any).id;
      
      // If we have template steps, create sequence_events for each step
      if (templateSteps && templateSteps.length > 0) {
        const events = templateSteps.map(step => ({
          sequence_id: sequenceId,
          step_number: step.step,
          action_type: step.action,
          scheduled_at: addDays(startDate, step.day).toISOString(),
          status: 'pending',
          message_content: step.message,
        }));
        
        const { error: eventsError } = await supabase
          .from('sequence_events' as any)
          .insert(events);
        
        if (eventsError) {
          console.error('Failed to create sequence events:', eventsError);
          // Don't throw - sequence was created, events can be added later
        }
      }
      
      return { sequenceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequence'] });
      queryClient.invalidateQueries({ queryKey: ['enriched-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-events'] });
    },
  });
}

/**
 * Mutation to create a new sequence template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      name, 
      triggerType, 
      steps 
    }: { 
      name: string; 
      triggerType: string; 
      steps: SequenceStep[];
    }) => {
      const { error } = await supabase
        .from('sequence_templates' as any)
        .insert({
          name,
          trigger_type: triggerType,
          steps: steps as any,
          is_active: true,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-templates'] });
    },
  });
}

/**
 * Mutation to update an existing sequence template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id,
      name, 
      triggerType, 
      steps 
    }: { 
      id: string;
      name: string; 
      triggerType: string; 
      steps: SequenceStep[];
    }) => {
      const { error } = await supabase
        .from('sequence_templates' as any)
        .update({
          name,
          trigger_type: triggerType,
          steps: steps as any,
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sequence-templates'] });
    },
  });
}

/**
 * Get a user-friendly label for sequence type
 */
export function getSequenceTypeLabel(sequenceType: string): string {
  switch (sequenceType) {
    case 'replacement_urgent':
    case 'urgent_replace':
      return 'Urgent Replace';
    case 'code_violation':
      return 'Code Violation';
    case 'maintenance':
    case 'maintenance_reminder':
      return 'Maintenance';
    default:
      return sequenceType.replace(/_/g, ' ');
  }
}

/**
 * Format next action timing for display
 */
export function formatNextAction(nextActionAt: Date | null): string {
  if (!nextActionAt) return 'No action scheduled';
  
  const now = new Date();
  const diff = nextActionAt.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (diff < 0) return 'Overdue';
  if (days === 0) {
    if (hours <= 1) return 'Next: Within 1 hour';
    return `Next: ${hours} hours`;
  }
  if (days === 1) return 'Next: Tomorrow';
  return `Next: ${days} days`;
}
