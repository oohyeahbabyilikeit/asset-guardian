// Service event types that affect algorithm calculations
export type ServiceEventType = 
  // Core maintenance
  | 'flush' 
  | 'anode_replacement' 
  | 'inspection' 
  | 'repair'
  // Infrastructure changes (affect anode decay / aging multipliers)
  | 'softener_install'    // Affects anode decay rate (+1.4x in soft water)
  | 'circ_pump_install'   // Affects anode decay rate (+0.5x erosion)
  | 'exp_tank_install'    // Reduces pressure stress (up to 7x aging reduction)
  | 'exp_tank_replace'    // Replaces failed expansion tank
  | 'prv_install'         // Reduces pressure stress
  | 'prv_replace'         // Replaces failed PRV
  // Tankless maintenance
  | 'descale'
  | 'filter_clean'
  | 'valve_install';      // Isolation valve installation

export interface ServiceEvent {
  id: string;
  type: ServiceEventType;
  date: string;
  technicianName?: string;
  notes?: string;
  cost: number;
  healthScoreBefore?: number;
  healthScoreAfter?: number;
  findings?: string[];
  // Impact description for display
  impactDescription?: string;
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
