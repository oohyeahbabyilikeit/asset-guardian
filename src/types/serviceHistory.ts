export interface ServiceEvent {
  id: string;
  type: 'flush' | 'anode_replacement' | 'inspection' | 'repair';
  date: string;
  technicianName?: string;
  notes?: string;
  cost: number;
  healthScoreBefore?: number;
  healthScoreAfter?: number;
  findings?: string[];
}

// Convert service history to algorithm inputs
export function deriveInputsFromServiceHistory(
  serviceHistory: ServiceEvent[],
  currentDate: Date = new Date()
): { lastFlushYearsAgo: number | null; lastAnodeReplaceYearsAgo: number | null } {
  // Find most recent flush
  const flushEvents = serviceHistory
    .filter(e => e.type === 'flush')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const lastFlush = flushEvents[0];
  const lastFlushYearsAgo = lastFlush 
    ? (currentDate.getTime() - new Date(lastFlush.date).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : null;

  // Find most recent anode replacement
  const anodeEvents = serviceHistory
    .filter(e => e.type === 'anode_replacement')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const lastAnode = anodeEvents[0];
  const lastAnodeReplaceYearsAgo = lastAnode 
    ? (currentDate.getTime() - new Date(lastAnode.date).getTime()) / (1000 * 60 * 60 * 24 * 365)
    : null;

  return { 
    lastFlushYearsAgo: lastFlushYearsAgo !== null ? Math.round(lastFlushYearsAgo * 10) / 10 : null,
    lastAnodeReplaceYearsAgo: lastAnodeReplaceYearsAgo !== null ? Math.round(lastAnodeReplaceYearsAgo * 10) / 10 : null
  };
}
