/**
 * Maintenance Calculations
 * 
 * Provides unit-type-aware maintenance scheduling for:
 * - Tank water heaters: Flush + Anode replacement
 * - Tankless units: Descale + Inlet filter cleaning + Isolation valve check
 * - Hybrid units: Filter cleaning + Condensate drain
 */

import { ForensicInputs, isTankless, OpterraMetrics } from './opterraAlgorithm';

// Task types by unit category
export type TankTaskType = 'flush' | 'anode';
export type TanklessTaskType = 'descale' | 'filter_clean' | 'isolation_valves';
export type HybridTaskType = 'air_filter' | 'condensate' | 'flush';

export type MaintenanceTaskType = TankTaskType | TanklessTaskType | HybridTaskType | 'inspection';

export interface MaintenanceTask {
  type: MaintenanceTaskType;
  label: string;
  description: string;
  monthsUntilDue: number;
  urgency: 'optimal' | 'schedule' | 'due' | 'overdue' | 'impossible';
  benefit: string;
  whyExplanation: string;
  icon: 'droplets' | 'shield' | 'flame' | 'filter' | 'valve' | 'wind' | 'wrench';
}

export interface MaintenanceSchedule {
  unitType: 'tank' | 'tankless' | 'hybrid';
  primaryTask: MaintenanceTask;
  secondaryTask: MaintenanceTask | null;
  additionalTasks: MaintenanceTask[];
}

// --- TANK WATER HEATER MAINTENANCE ---

function calculateTankMaintenance(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceSchedule {
  const { monthsToFlush, flushStatus, shieldLife, sedimentLbs } = metrics;
  
  // Calculate months to flush
  const isFlushDueNow = flushStatus === 'due' || flushStatus === 'lockout';
  const cappedMonthsToFlush = isFlushDueNow 
    ? 0 
    : Math.min(Math.max(0, monthsToFlush ?? 6), 36);
  
  // Calculate months to anode replacement
  const monthsToAnodeReplacement = shieldLife > 1 ? Math.round((shieldLife - 1) * 12) : 0;
  const cappedMonthsToAnode = Math.min(Math.max(0, monthsToAnodeReplacement), 36);
  
  const flushTask: MaintenanceTask = {
    type: 'flush',
    label: 'Tank Flush',
    description: 'Drain sediment from tank bottom',
    monthsUntilDue: cappedMonthsToFlush,
    urgency: flushStatus === 'lockout' ? 'overdue' : flushStatus,
    benefit: sedimentLbs > 0 
      ? `Restore up to ${Math.round(sedimentLbs * 3)}% efficiency`
      : 'Maintain peak efficiency',
    whyExplanation: getFlushExplanation(sedimentLbs, inputs.hardnessGPG, inputs.usageType),
    icon: 'droplets',
  };
  
  const anodeTask: MaintenanceTask = {
    type: 'anode',
    label: 'Anode Rod Inspection',
    description: 'Check sacrificial anode for corrosion protection',
    monthsUntilDue: cappedMonthsToAnode,
    urgency: cappedMonthsToAnode <= 0 ? 'due' : cappedMonthsToAnode <= 6 ? 'schedule' : 'optimal',
    benefit: 'Prevent tank corrosion',
    whyExplanation: 'The sacrificial anode rod protects your tank from rust. Inspection ensures it\'s still providing protection before corrosion can develop.',
    icon: 'shield',
  };
  
  // Determine priority
  const flushIsNext = cappedMonthsToFlush <= cappedMonthsToAnode;
  
  return {
    unitType: 'tank',
    primaryTask: flushIsNext ? flushTask : anodeTask,
    secondaryTask: flushIsNext ? anodeTask : flushTask,
    additionalTasks: [],
  };
}

function getFlushExplanation(sedimentLbs: number, hardnessGPG: number, usageType: string): string {
  if (sedimentLbs > 1) {
    return `Approximately ${sedimentLbs.toFixed(1)} lbs of mineral buildup has accumulated. Flushing restores heating efficiency and prevents damage to the tank lining.`;
  }
  if (hardnessGPG > 10) {
    return 'Your water hardness accelerates sediment buildup. Regular flushing prevents efficiency loss and extends equipment lifespan.';
  }
  if (usageType === 'heavy') {
    return 'Higher hot water demand increases sediment accumulation. Routine flushing maintains optimal performance.';
  }
  return 'Periodic flushing removes mineral deposits that reduce heating efficiency and can cause premature tank failure.';
}

// --- TANKLESS WATER HEATER MAINTENANCE ---

function calculateTanklessMaintenance(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceSchedule {
  const { scaleBuildupScore = 0, flowDegradation = 0, descaleStatus = 'optimal' } = metrics;
  const hasIsolationValves = inputs.hasIsolationValves ?? false;
  
  // Calculate months to descale based on scale buildup
  const DESCALE_INTERVAL_MONTHS = inputs.hardnessGPG > 10 ? 12 : 18;
  const yearsSinceDescale = inputs.lastDescaleYearsAgo ?? inputs.calendarAge;
  const monthsSinceDescale = yearsSinceDescale * 12;
  const monthsToDescale = Math.max(0, DESCALE_INTERVAL_MONTHS - monthsSinceDescale);
  
  // Determine descale urgency
  let descaleUrgency: MaintenanceTask['urgency'] = 'optimal';
  if (!hasIsolationValves) {
    descaleUrgency = 'impossible';
  } else if (descaleStatus === 'lockout' || descaleStatus === 'critical') {
    descaleUrgency = 'overdue';
  } else if (descaleStatus === 'due') {
    descaleUrgency = 'due';
  } else if (scaleBuildupScore > 5) {
    descaleUrgency = 'schedule';
  }
  
  const descaleTask: MaintenanceTask = {
    type: 'descale',
    label: 'Descale Heat Exchanger',
    description: 'Flush heat exchanger with vinegar solution',
    monthsUntilDue: hasIsolationValves ? Math.min(monthsToDescale, 36) : 0,
    urgency: descaleUrgency,
    benefit: scaleBuildupScore > 5 
      ? `Remove ${Math.round(scaleBuildupScore)}% scale buildup`
      : 'Maintain heat transfer efficiency',
    whyExplanation: getDescaleExplanation(scaleBuildupScore, inputs.hardnessGPG, hasIsolationValves),
    icon: 'flame',
  };
  
  // Inlet Filter Cleaning
  const filterStatus = inputs.inletFilterStatus ?? 'CLEAN';
  const filterMonthsUntilDue = filterStatus === 'CLOGGED' ? 0 
    : filterStatus === 'DIRTY' ? 1 
    : 6;
  
  const filterTask: MaintenanceTask = {
    type: 'filter_clean',
    label: 'Clean Inlet Filter',
    description: 'Remove debris from water inlet screen',
    monthsUntilDue: filterMonthsUntilDue,
    urgency: filterStatus === 'CLOGGED' ? 'overdue' 
      : filterStatus === 'DIRTY' ? 'due' 
      : 'optimal',
    benefit: flowDegradation > 10 
      ? `Restore ${Math.round(flowDegradation)}% flow capacity`
      : 'Maintain optimal water flow',
    whyExplanation: 'The inlet filter catches debris before it enters the heat exchanger. A clogged filter reduces flow rate and can trigger error codes.',
    icon: 'filter',
  };
  
  // Isolation Valve Installation (if missing)
  const valveTask: MaintenanceTask | null = !hasIsolationValves ? {
    type: 'isolation_valves',
    label: 'Install Isolation Valves',
    description: 'Add service valves for descaling capability',
    monthsUntilDue: 0,
    urgency: 'due',
    benefit: 'Enable descaling maintenance',
    whyExplanation: 'Without isolation valves, your tankless unit cannot be properly descaled. This one-time upgrade enables essential maintenance that extends unit lifespan by 5+ years.',
    icon: 'valve',
  } : null;
  
  // Prioritize: Valve installation > Filter > Descale
  let primaryTask = descaleTask;
  let secondaryTask: MaintenanceTask | null = filterTask;
  const additionalTasks: MaintenanceTask[] = [];
  
  if (valveTask) {
    // No isolation valves - this is the priority
    primaryTask = valveTask;
    secondaryTask = filterTask;
    additionalTasks.push(descaleTask);
  } else if (filterStatus === 'CLOGGED' || filterStatus === 'DIRTY') {
    // Filter needs attention first
    primaryTask = filterTask;
    secondaryTask = descaleTask;
  }
  
  return {
    unitType: 'tankless',
    primaryTask,
    secondaryTask,
    additionalTasks,
  };
}

function getDescaleExplanation(scaleBuildupScore: number, hardnessGPG: number, hasValves: boolean): string {
  if (!hasValves) {
    return 'Your unit lacks isolation valves, making descaling impossible. We recommend installing service valves to enable this essential maintenance.';
  }
  if (scaleBuildupScore > 20) {
    return `Significant mineral scale (${Math.round(scaleBuildupScore)}%) is insulating the heat exchanger. Descaling restores efficiency and prevents overheating damage.`;
  }
  if (hardnessGPG > 10) {
    return `With ${hardnessGPG} GPG water hardness, scale accumulates quickly on the heat exchanger. Annual descaling prevents efficiency loss and extends unit life.`;
  }
  return 'Periodic descaling removes mineral deposits from the heat exchanger, maintaining peak efficiency and preventing premature failure.';
}

// --- HYBRID WATER HEATER MAINTENANCE ---

function calculateHybridMaintenance(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceSchedule {
  const airFilterStatus = inputs.airFilterStatus ?? 'CLEAN';
  const isCondensateClear = inputs.isCondensateClear ?? true;
  const { monthsToFlush, flushStatus, sedimentLbs } = metrics;
  
  // Air Filter Task
  const filterMonthsUntilDue = airFilterStatus === 'CLOGGED' ? 0 
    : airFilterStatus === 'DIRTY' ? 1 
    : 3;
  
  const airFilterTask: MaintenanceTask = {
    type: 'air_filter',
    label: 'Clean Air Filter',
    description: 'Wash or replace heat pump air filter',
    monthsUntilDue: filterMonthsUntilDue,
    urgency: airFilterStatus === 'CLOGGED' ? 'overdue' 
      : airFilterStatus === 'DIRTY' ? 'due' 
      : 'optimal',
    benefit: 'Maximize heat pump efficiency',
    whyExplanation: 'The air filter ensures efficient heat transfer to the heat pump evaporator. A dirty filter forces the unit to use less-efficient resistance heating.',
    icon: 'wind',
  };
  
  // Condensate Drain Task
  const condensateTask: MaintenanceTask = {
    type: 'condensate',
    label: 'Clear Condensate Drain',
    description: 'Ensure condensate line is flowing freely',
    monthsUntilDue: isCondensateClear ? 6 : 0,
    urgency: isCondensateClear ? 'optimal' : 'due',
    benefit: 'Prevent water damage',
    whyExplanation: 'Heat pump water heaters produce condensation. A blocked drain can cause overflow and water damage around the unit.',
    icon: 'droplets',
  };
  
  // Tank Flush (hybrids still have tanks)
  const isFlushDueNow = flushStatus === 'due' || flushStatus === 'lockout';
  const cappedMonthsToFlush = isFlushDueNow 
    ? 0 
    : Math.min(Math.max(0, monthsToFlush ?? 12), 36);
    
  const flushTask: MaintenanceTask = {
    type: 'flush',
    label: 'Tank Flush',
    description: 'Drain sediment from tank bottom',
    monthsUntilDue: cappedMonthsToFlush,
    urgency: flushStatus === 'lockout' ? 'overdue' : flushStatus,
    benefit: sedimentLbs > 0 
      ? `Remove ${sedimentLbs.toFixed(1)} lbs sediment`
      : 'Maintain tank health',
    whyExplanation: 'Hybrid units still have a storage tank that accumulates sediment. Regular flushing maintains efficiency and tank longevity.',
    icon: 'droplets',
  };
  
  // Prioritize: Air Filter > Condensate > Flush
  let primaryTask = airFilterTask;
  let secondaryTask: MaintenanceTask | null = condensateTask;
  const additionalTasks: MaintenanceTask[] = [flushTask];
  
  if (!isCondensateClear) {
    primaryTask = condensateTask;
    secondaryTask = airFilterTask;
  } else if (airFilterStatus === 'CLEAN' && cappedMonthsToFlush < 3) {
    primaryTask = flushTask;
    secondaryTask = airFilterTask;
    additionalTasks.pop();
    additionalTasks.push(condensateTask);
  }
  
  return {
    unitType: 'hybrid',
    primaryTask,
    secondaryTask,
    additionalTasks,
  };
}

// --- MAIN EXPORT ---

export function calculateMaintenanceSchedule(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceSchedule {
  if (isTankless(inputs.fuelType)) {
    return calculateTanklessMaintenance(inputs, metrics);
  }
  
  if (inputs.fuelType === 'HYBRID') {
    return calculateHybridMaintenance(inputs, metrics);
  }
  
  return calculateTankMaintenance(inputs, metrics);
}

// Service event types by unit category
export function getServiceEventTypes(fuelType: ForensicInputs['fuelType']): Array<{
  value: string;
  label: string;
}> {
  if (isTankless(fuelType)) {
    return [
      { value: 'descale', label: 'Descale Service' },
      { value: 'filter_clean', label: 'Filter Cleaning' },
      { value: 'valve_install', label: 'Isolation Valve Install' },
      { value: 'inspection', label: 'Inspection' },
      { value: 'repair', label: 'Repair' },
    ];
  }
  
  if (fuelType === 'HYBRID') {
    return [
      { value: 'air_filter', label: 'Air Filter Service' },
      { value: 'condensate', label: 'Condensate Drain Clear' },
      { value: 'flush', label: 'Tank Flush' },
      { value: 'inspection', label: 'Inspection' },
      { value: 'repair', label: 'Repair' },
    ];
  }
  
  // Tank water heaters
  return [
    { value: 'flush', label: 'Tank Flush' },
    { value: 'anode_replacement', label: 'Anode Replacement' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'repair', label: 'Repair' },
  ];
}
