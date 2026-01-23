import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SequenceEvent {
  id: string;
  sequenceId: string;
  stepNumber: number;
  actionType: 'sms' | 'email' | 'call_reminder';
  scheduledAt: Date;
  executedAt: Date | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  messageContent: string | null;
  openedAt: Date | null;
  clickedAt: Date | null;
}

// Raw DB row type
interface SequenceEventRow {
  id: string;
  sequence_id: string;
  step_number: number;
  action_type: string;
  scheduled_at: string;
  executed_at: string | null;
  status: string;
  delivery_status: string | null;
  message_content: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
}

/**
 * Fetch all events for a sequence
 */
export function useSequenceEvents(sequenceId: string | null) {
  return useQuery({
    queryKey: ['sequence-events', sequenceId],
    queryFn: async (): Promise<SequenceEvent[]> => {
      if (!sequenceId) return [];
      
      const { data, error } = await supabase
        .from('sequence_events' as any)
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('step_number', { ascending: true });
      
      if (error) throw error;
      
      const rows = (data || []) as unknown as SequenceEventRow[];
      return rows.map(row => ({
        id: row.id,
        sequenceId: row.sequence_id,
        stepNumber: row.step_number,
        actionType: row.action_type as SequenceEvent['actionType'],
        scheduledAt: new Date(row.scheduled_at),
        executedAt: row.executed_at ? new Date(row.executed_at) : null,
        status: row.status as SequenceEvent['status'],
        deliveryStatus: (row.delivery_status || 'pending') as SequenceEvent['deliveryStatus'],
        messageContent: row.message_content,
        openedAt: row.opened_at ? new Date(row.opened_at) : null,
        clickedAt: row.clicked_at ? new Date(row.clicked_at) : null,
      }));
    },
    enabled: !!sequenceId,
    staleTime: 30_000,
  });
}

/**
 * Mutation to skip a step in a sequence
 */
export function useSkipStep() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sequenceId, 
      eventId,
      currentStep,
      totalSteps 
    }: { 
      sequenceId: string;
      eventId: string;
      currentStep: number;
      totalSteps: number;
    }) => {
      // Mark the event as skipped
      const { error: eventError } = await supabase
        .from('sequence_events' as any)
        .update({ 
          status: 'skipped',
          executed_at: new Date().toISOString()
        })
        .eq('id', eventId);
      
      if (eventError) throw eventError;
      
      // Advance to next step or complete
      const nextStep = currentStep + 1;
      const isComplete = nextStep > totalSteps;
      
      const { error: seqError } = await supabase
        .from('nurturing_sequences' as any)
        .update({
          current_step: isComplete ? totalSteps : nextStep,
          status: isComplete ? 'completed' : 'active',
          completed_at: isComplete ? new Date().toISOString() : null,
        })
        .eq('id', sequenceId);
      
      if (seqError) throw seqError;
    },
    onSuccess: (_, { sequenceId }) => {
      queryClient.invalidateQueries({ queryKey: ['sequence-events', sequenceId] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequence'] });
    },
  });
}

/**
 * Mutation to send the current step immediately
 */
export function useSendNow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sequenceId, 
      eventId,
      currentStep,
      totalSteps 
    }: { 
      sequenceId: string;
      eventId: string;
      currentStep: number;
      totalSteps: number;
    }) => {
      // Mark the event as sent
      const now = new Date().toISOString();
      const { error: eventError } = await supabase
        .from('sequence_events' as any)
        .update({ 
          status: 'sent',
          executed_at: now,
          delivery_status: 'delivered'
        })
        .eq('id', eventId);
      
      if (eventError) throw eventError;
      
      // Advance to next step or complete
      const nextStep = currentStep + 1;
      const isComplete = nextStep > totalSteps;
      
      // Calculate next action date (next step's scheduled time)
      const nextActionAt = new Date();
      nextActionAt.setDate(nextActionAt.getDate() + 1);
      
      const { error: seqError } = await supabase
        .from('nurturing_sequences' as any)
        .update({
          current_step: isComplete ? totalSteps : nextStep,
          status: isComplete ? 'completed' : 'active',
          completed_at: isComplete ? now : null,
          next_action_at: isComplete ? null : nextActionAt.toISOString(),
        })
        .eq('id', sequenceId);
      
      if (seqError) throw seqError;
    },
    onSuccess: (_, { sequenceId }) => {
      queryClient.invalidateQueries({ queryKey: ['sequence-events', sequenceId] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequences'] });
      queryClient.invalidateQueries({ queryKey: ['nurturing-sequence'] });
    },
  });
}

/**
 * Mutation to stop a sequence entirely
 */
export function useStopSequence() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sequenceId, 
      reason 
    }: { 
      sequenceId: string;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('nurturing_sequences' as any)
        .update({
          status: 'cancelled',
          outcome: 'stopped',
          outcome_reason: reason || 'Manually stopped',
          outcome_at: new Date().toISOString(),
        })
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
 * Mutation to mark sequence outcome (converted/lost)
 */
export function useMarkOutcome() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sequenceId, 
      outcome,
      reason,
      currentStep 
    }: { 
      sequenceId: string;
      outcome: 'converted' | 'lost';
      reason?: string;
      currentStep: number;
    }) => {
      const { error } = await supabase
        .from('nurturing_sequences' as any)
        .update({
          status: 'completed',
          outcome,
          outcome_reason: reason,
          outcome_step: currentStep,
          outcome_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
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
 * Get action type icon label
 */
export function getActionTypeLabel(actionType: string): string {
  switch (actionType) {
    case 'sms':
      return 'SMS';
    case 'email':
      return 'Email';
    case 'call_reminder':
      return 'Call';
    default:
      return actionType;
  }
}

/**
 * Format a scheduled date relative to now
 */
export function formatScheduledDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (diff < 0) {
    return 'Overdue';
  }
  
  if (days === 0) {
    return 'Today';
  }
  
  if (days === 1) {
    return 'Tomorrow';
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}
