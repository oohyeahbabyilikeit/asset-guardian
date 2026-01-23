import { useMemo, useState, useCallback } from 'react';
import { type CategorizedOpportunity } from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';

interface UseHotLeadOptions {
  opportunities: CategorizedOpportunity[];
  sequencesByOpp: Record<string, NurturingSequence>;
}

/**
 * Returns the #1 priority lead requiring action
 * Priority order:
 * 1. Critical + leaking + no sequence
 * 2. Critical + no sequence
 * 3. High priority + no sequence  
 * 4. Any with sequence step due today
 * 5. Oldest critical/high lead
 */
export function useHotLead({ opportunities, sequencesByOpp }: UseHotLeadOptions) {
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  
  const hotLead = useMemo(() => {
    // Filter out skipped leads
    const available = opportunities.filter(o => !skippedIds.has(o.id));
    
    if (available.length === 0) return null;
    
    // Score each opportunity
    const scored = available.map(opp => {
      let score = 0;
      const seq = sequencesByOpp[opp.id];
      const hasActiveSequence = seq && (seq.status === 'active' || seq.status === 'paused');
      
      // Priority scoring
      if (opp.priority === 'critical') score += 100;
      else if (opp.priority === 'high') score += 50;
      else if (opp.priority === 'medium') score += 20;
      
      // Urgency indicators
      if (opp.forensicInputs?.isLeaking) score += 200;
      if (opp.category === 'replacements') score += 30;
      
      // No sequence = needs action
      if (!hasActiveSequence) score += 25;
      
      // Sequence due today gets priority
      if (seq && seq.nextActionAt) {
        const now = new Date();
        const nextAction = new Date(seq.nextActionAt);
        if (nextAction <= now || nextAction.toDateString() === now.toDateString()) {
          score += 40;
        }
      }
      
      // Older leads need more attention
      const ageHours = (Date.now() - opp.createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > 48) score += 15;
      if (ageHours > 72) score += 10;
      
      return { opportunity: opp, score, sequence: seq || null };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0] || null;
  }, [opportunities, sequencesByOpp, skippedIds]);
  
  const skipCurrentLead = useCallback(() => {
    if (hotLead) {
      setSkippedIds(prev => new Set([...prev, hotLead.opportunity.id]));
    }
  }, [hotLead]);
  
  const resetSkipped = useCallback(() => {
    setSkippedIds(new Set());
  }, []);
  
  return {
    hotLead: hotLead?.opportunity ?? null,
    hotLeadSequence: hotLead?.sequence ?? null,
    skipCurrentLead,
    resetSkipped,
    skippedCount: skippedIds.size,
  };
}
