import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
}

interface SequenceTemplateRow {
  id: string;
  name: string;
  trigger_type: string;
  steps: unknown;
  is_active: boolean;
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
      return rows.map(row => ({
        id: row.id,
        opportunityId: row.opportunity_id,
        sequenceType: row.sequence_type,
        status: row.status as NurturingSequence['status'],
        currentStep: row.current_step,
        totalSteps: row.total_steps,
        nextActionAt: row.next_action_at ? new Date(row.next_action_at) : null,
        startedAt: new Date(row.started_at),
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
      }));
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
      };
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
 */
export function useStartSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      opportunityId, 
      sequenceType, 
      totalSteps 
    }: { 
      opportunityId: string; 
      sequenceType: string; 
      totalSteps: number;
    }) => {
      const nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + 1);
      
      const { error } = await supabase
        .from('nurturing_sequences' as any)
        .insert({
          opportunity_id: opportunityId,
          sequence_type: sequenceType,
          status: 'active',
          current_step: 1,
          total_steps: totalSteps,
          next_action_at: nextActionAt.toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequence'] });
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
