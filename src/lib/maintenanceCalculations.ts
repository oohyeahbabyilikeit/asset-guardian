/**
 * Maintenance Calculations
 * 
 * Provides unit-type-aware maintenance scheduling for:
 * - Tank water heaters: Flush + Anode replacement
 * - Tankless units: Descale + Inlet filter cleaning + Isolation valve check
 * - Hybrid units: Filter cleaning + Condensate drain
 */

import { ForensicInputs, isTankless, OpterraMetrics } from './opterraAlgorithm';
import { getInfrastructureIssues, InfrastructureIssue } from './infrastructureIssues';

// Task types by unit category
export type TankTaskType = 'flush' | 'anode';
export type TanklessTaskType = 'descale' | 'filter_clean' | 'isolation_valves';
export type HybridTaskType = 'air_filter' | 'condensate' | 'flush';
export type InfrastructureTaskType = 'exp_tank_install' | 'exp_tank_replace' | 'prv_install' | 'prv_replace';
export type ReplacementTaskType = 'replacement_consult';

export type MaintenanceTaskType = TankTaskType | TanklessTaskType | HybridTaskType | InfrastructureTaskType | ReplacementTaskType | 'inspection';

export interface MaintenanceTask {
  type: MaintenanceTaskType;
  label: string;
  description: string;
  monthsUntilDue: number;
  urgency: 'optimal' | 'advisory' | 'schedule' | 'due' | 'critical' | 'overdue' | 'impossible';
  benefit: string;
  whyExplanation: string;
  icon: 'droplets' | 'shield' | 'flame' | 'filter' | 'valve' | 'wind' | 'wrench' | 'gauge' | 'alert' | 'lightbulb';
  /** For infrastructure issues, the aging multiplier this fixes */
  agingMultiplier?: number;
  /** Whether this is a critical infrastructure issue */
  isInfrastructure?: boolean;
}

export interface MaintenanceSchedule {
  unitType: 'tank' | 'tankless' | 'hybrid';
  primaryTask: MaintenanceTask | null;  // Nullable for PASS verdicts
  secondaryTask: MaintenanceTask | null;
  additionalTasks: MaintenanceTask[];
  // Bundling for tasks due close together
  isBundled: boolean;
  bundledTasks?: MaintenanceTask[];
  bundleReason?: string;
  /** When true, algorithm said don't recommend service (PASS verdict) */
  monitorOnly?: boolean;
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
  
  // Map 5-tier flushStatus to task urgency
  const mapFlushStatusToUrgency = (status: typeof flushStatus): MaintenanceTask['urgency'] => {
    if (status === 'lockout') return 'overdue';
    if (status === 'critical') return 'critical';
    if (status === 'due') return 'due';
    if (status === 'advisory') return 'advisory';
    return 'optimal';
  };
  
  const flushTask: MaintenanceTask = {
    type: 'flush',
    label: 'Tank Flush',
    description: 'Drain sediment from tank bottom',
    monthsUntilDue: cappedMonthsToFlush,
    urgency: mapFlushStatusToUrgency(flushStatus),
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
  
  // Bundling logic: if both tasks are due within 2 months of each other, bundle them
  const BUNDLE_THRESHOLD_MONTHS = 2;
  const monthsDiff = Math.abs(cappedMonthsToFlush - cappedMonthsToAnode);
  const shouldBundle = monthsDiff <= BUNDLE_THRESHOLD_MONTHS;
  
  if (shouldBundle) {
    const earliestDue = Math.min(cappedMonthsToFlush, cappedMonthsToAnode);
    const bundleReason = earliestDue <= 0 
      ? 'Complete both in one service visit'
      : `Both due within ${BUNDLE_THRESHOLD_MONTHS} months`;
    
    return {
      unitType: 'tank',
      primaryTask: flushIsNext ? flushTask : anodeTask,
      secondaryTask: null,
      additionalTasks: [],
      isBundled: true,
      bundledTasks: [flushTask, anodeTask],
      bundleReason,
    };
  }
  
  return {
    unitType: 'tank',
    primaryTask: flushIsNext ? flushTask : anodeTask,
    secondaryTask: flushIsNext ? anodeTask : flushTask,
    additionalTasks: [],
    isBundled: false,
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
  
  // CRITICAL: If scale is at lockout level (40%+), unit needs replacement - not maintenance
  // This should route to SafetyAssessmentPage for replacement guidance
  if (descaleStatus === 'lockout') {
    const replacementTask: MaintenanceTask = {
      type: 'inspection',
      label: 'Unit Replacement Required',
      description: 'Scale damage too severe for maintenance',
      monthsUntilDue: 0,
      urgency: 'overdue',
      benefit: 'Avoid system failure',
      whyExplanation: `Scale buildup has exceeded 40% (currently ${Math.round(scaleBuildupScore)}%). Descaling at this level risks creating pinhole leaks in the heat exchanger. Replacement is the safest option.`,
      icon: 'wrench',
    };
    return {
      unitType: 'tankless',
      primaryTask: replacementTask,
      secondaryTask: null,
      additionalTasks: [],
      isBundled: false,
    };
  }
  
  // Calculate months to descale based on scale buildup
  const DESCALE_INTERVAL_MONTHS = inputs.hardnessGPG > 10 ? 12 : 18;
  const yearsSinceDescale = inputs.lastDescaleYearsAgo ?? inputs.calendarAge;
  const monthsSinceDescale = yearsSinceDescale * 12;
  const monthsToDescale = Math.max(0, DESCALE_INTERVAL_MONTHS - monthsSinceDescale);
  
  // Determine descale urgency
  let descaleUrgency: MaintenanceTask['urgency'] = 'optimal';
  if (!hasIsolationValves) {
    descaleUrgency = 'impossible';
  } else if (descaleStatus === 'critical') {
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
  
  // Isolation Valve Installation (if missing and scale not at lockout)
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
  // Note: Don't show descale as additional task if valves are missing (it's impossible anyway)
  let primaryTask = descaleTask;
  let secondaryTask: MaintenanceTask | null = filterTask;
  const additionalTasks: MaintenanceTask[] = [];
  
  if (valveTask) {
    // No isolation valves - this is the priority
    primaryTask = valveTask;
    secondaryTask = filterTask;
    // Don't add descale to additionalTasks - it's impossible without valves
    // and showing it creates confusing mixed messages
  } else if (filterStatus === 'CLOGGED' || filterStatus === 'DIRTY') {
    // Filter needs attention first
    primaryTask = filterTask;
    secondaryTask = descaleTask;
  }
  
  // Bundle descale + filter if both due within 2 months
  const BUNDLE_THRESHOLD_MONTHS = 2;
  const descaleMonths = descaleTask.monthsUntilDue;
  const filterMonths = filterTask.monthsUntilDue;
  const monthsDiff = Math.abs(descaleMonths - filterMonths);
  const canBundle = !valveTask && monthsDiff <= BUNDLE_THRESHOLD_MONTHS;
  
  if (canBundle && secondaryTask) {
    const earliestDue = Math.min(descaleMonths, filterMonths);
    return {
      unitType: 'tankless',
      primaryTask,
      secondaryTask: null,
      additionalTasks,
      isBundled: true,
      bundledTasks: [descaleTask, filterTask],
      bundleReason: earliestDue <= 0 
        ? 'Complete both in one service visit'
        : `Both due within ${BUNDLE_THRESHOLD_MONTHS} months`,
    };
  }
  
  return {
    unitType: 'tankless',
    primaryTask,
    secondaryTask,
    additionalTasks,
    isBundled: false,
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
    
  // Map 5-tier flushStatus to task urgency (same logic as tank)
  const mapFlushStatusToUrgency = (status: typeof flushStatus): MaintenanceTask['urgency'] => {
    if (status === 'lockout') return 'overdue';
    if (status === 'critical') return 'critical';
    if (status === 'due') return 'due';
    if (status === 'advisory') return 'advisory';
    return 'optimal';
  };
  
  const flushTask: MaintenanceTask = {
    type: 'flush',
    label: 'Tank Flush',
    description: 'Drain sediment from tank bottom',
    monthsUntilDue: cappedMonthsToFlush,
    urgency: mapFlushStatusToUrgency(flushStatus),
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
  
  // Bundle logic for hybrid: air filter + condensate if both due soon
  const BUNDLE_THRESHOLD_MONTHS = 2;
  const airFilterMonths = airFilterTask.monthsUntilDue;
  const condensateMonths = condensateTask.monthsUntilDue;
  const monthsDiff = Math.abs(airFilterMonths - condensateMonths);
  const shouldBundle = monthsDiff <= BUNDLE_THRESHOLD_MONTHS && 
    Math.min(airFilterMonths, condensateMonths) <= 3;
  
  if (shouldBundle) {
    const earliestDue = Math.min(airFilterMonths, condensateMonths);
    return {
      unitType: 'hybrid',
      primaryTask,
      secondaryTask: null,
      additionalTasks: [flushTask],
      isBundled: true,
      bundledTasks: [airFilterTask, condensateTask],
      bundleReason: earliestDue <= 0 
        ? 'Complete both in one service visit'
        : `Both due within ${BUNDLE_THRESHOLD_MONTHS} months`,
    };
  }
  
  return {
    unitType: 'hybrid',
    primaryTask,
    secondaryTask,
    additionalTasks,
    isBundled: false,
  };
}

// --- MAIN EXPORT ---

/** Verdict action types that control maintenance behavior */
export type VerdictAction = 'MAINTAIN' | 'REPAIR' | 'REPLACE' | 'PASS' | 'UPGRADE';

/**
 * Calculate unit-type-aware maintenance schedule
 * 
 * The verdictAction parameter aligns maintenance recommendations with the algorithm's verdict:
 * - PASS: Return empty schedule with monitorOnly=true (algorithm says "don't touch")
 * - REPLACE: Return empty schedule (skip maintenance, replacing anyway)
 * - MAINTAIN/REPAIR/UPGRADE: Proceed with normal calculation
 */
export function calculateMaintenanceSchedule(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  verdictAction?: VerdictAction
): MaintenanceSchedule {
  const unitType: MaintenanceSchedule['unitType'] = isTankless(inputs.fuelType) 
    ? 'tankless' 
    : inputs.fuelType === 'HYBRID' 
      ? 'hybrid' 
      : 'tank';
  
  // PASS verdict = algorithm says "don't touch" - no maintenance recommended
  if (verdictAction === 'PASS') {
    return {
      unitType,
      primaryTask: null,
      secondaryTask: null,
      additionalTasks: [],
      isBundled: false,
      monitorOnly: true,
    };
  }
  
  // REPLACE verdict = skip maintenance, replacing anyway
  if (verdictAction === 'REPLACE') {
    return {
      unitType,
      primaryTask: null,
      secondaryTask: null,
      additionalTasks: [],
      isBundled: false,
      monitorOnly: false,
    };
  }
  
  // MAINTAIN/REPAIR/UPGRADE = proceed with normal calculation
  if (isTankless(inputs.fuelType)) {
    return calculateTanklessMaintenance(inputs, metrics);
  }
  
  if (inputs.fuelType === 'HYBRID') {
    return calculateHybridMaintenance(inputs, metrics);
  }
  
  return calculateTankMaintenance(inputs, metrics);
}

// Service event types by unit category
// Returns all service types that affect algorithm calculations, with category grouping
export function getServiceEventTypes(fuelType: ForensicInputs['fuelType']): Array<{
  value: string;
  label: string;
  category?: 'maintenance' | 'infrastructure';
  impactNote?: string;
}> {
  // Infrastructure services apply to all unit types
  const infrastructureServices = [
    { value: 'softener_install', label: 'Softener Installation', category: 'infrastructure' as const, impactNote: 'Affects anode decay (+1.4x in soft water)' },
    { value: 'circ_pump_install', label: 'Circulation Pump Install', category: 'infrastructure' as const, impactNote: 'Affects anode decay (+0.5x)' },
    { value: 'exp_tank_install', label: 'Expansion Tank Install', category: 'infrastructure' as const, impactNote: 'Reduces aging rate (up to 7x)' },
    { value: 'exp_tank_replace', label: 'Expansion Tank Replace', category: 'infrastructure' as const, impactNote: 'Restores pressure protection' },
    { value: 'prv_install', label: 'PRV Install', category: 'infrastructure' as const, impactNote: 'Reduces pressure stress' },
    { value: 'prv_replace', label: 'PRV Replace', category: 'infrastructure' as const, impactNote: 'Restores pressure regulation' },
  ];

  if (isTankless(fuelType)) {
    return [
      { value: 'descale', label: 'Descale Service', category: 'maintenance' as const },
      { value: 'filter_clean', label: 'Filter Cleaning', category: 'maintenance' as const },
      { value: 'valve_install', label: 'Isolation Valve Install', category: 'infrastructure' as const, impactNote: 'Enables descaling maintenance' },
      { value: 'inspection', label: 'Inspection', category: 'maintenance' as const },
      { value: 'repair', label: 'Repair', category: 'maintenance' as const },
      ...infrastructureServices,
    ];
  }
  
  if (fuelType === 'HYBRID') {
    return [
      { value: 'air_filter', label: 'Air Filter Service', category: 'maintenance' as const },
      { value: 'condensate', label: 'Condensate Drain Clear', category: 'maintenance' as const },
      { value: 'flush', label: 'Tank Flush', category: 'maintenance' as const },
      { value: 'inspection', label: 'Inspection', category: 'maintenance' as const },
      { value: 'repair', label: 'Repair', category: 'maintenance' as const },
      ...infrastructureServices,
    ];
  }
  
  // Tank water heaters
  return [
    { value: 'flush', label: 'Tank Flush', category: 'maintenance' as const, impactNote: 'Removes sediment buildup' },
    { value: 'anode_replacement', label: 'Anode Replacement', category: 'maintenance' as const, impactNote: 'Resets shield life (~6 years)' },
    { value: 'inspection', label: 'Inspection', category: 'maintenance' as const },
    { value: 'repair', label: 'Repair', category: 'maintenance' as const },
    ...infrastructureServices,
  ];
}

/**
 * Get the impact description for a service event type
 * Used to show users how a service affected their unit's calculations
 */
export function getServiceImpactDescription(eventType: string): string | null {
  const impactMap: Record<string, string> = {
    'anode_replacement': 'Resets shield life to ~6 years',
    'flush': 'Removes sediment, restores efficiency',
    'softener_install': 'Anode decay +1.4x (soft water is more conductive)',
    'circ_pump_install': 'Anode decay +0.5x (erosion/amperage effects)',
    'exp_tank_install': 'Aging rate reduced (absorbs thermal expansion)',
    'exp_tank_replace': 'Restores thermal expansion protection',
    'prv_install': 'Reduces pressure stress on equipment',
    'prv_replace': 'Restores pressure regulation',
    'descale': 'Removes scale buildup from heat exchanger',
    'filter_clean': 'Restores water flow capacity',
    'valve_install': 'Enables future descaling maintenance',
  };
  return impactMap[eventType] || null;
}

/**
 * Convert infrastructure issues into high-priority maintenance tasks
 * These should be shown FIRST in any maintenance schedule when present
 */
export function getInfrastructureMaintenanceTasks(
  inputs: ForensicInputs,
  metrics: OpterraMetrics
): MaintenanceTask[] {
  const issues = getInfrastructureIssues(inputs, metrics);
  const tasks: MaintenanceTask[] = [];
  
  // Calculate actual aging multiplier from stress factors
  const pressureStress = metrics.stressFactors?.pressure || 1;
  const loopStress = metrics.stressFactors?.loop || 1;
  const agingMultiplier = Math.round(pressureStress * loopStress * 10) / 10;
  
  // Missing expansion tank in closed loop = CRITICAL (7x aging)
  const expTankRequired = issues.find(i => i.id === 'exp_tank_required');
  if (expTankRequired) {
    tasks.push({
      type: 'exp_tank_install',
      label: 'Expansion Tank Installation',
      description: 'CRITICAL: Unmanaged thermal expansion',
      monthsUntilDue: 0,
      urgency: 'overdue',
      benefit: `Reduce aging rate by ${agingMultiplier}x`,
      whyExplanation: `Your closed-loop plumbing causes water pressure to spike to ${inputs.housePsi > 80 ? inputs.housePsi : '120+'} PSI every time the heater cycles. This cyclic stress causes metal fatigue ${agingMultiplier}x faster than normal. An expansion tank absorbs this pressure and protects your equipment.`,
      icon: 'alert',
      agingMultiplier,
      isInfrastructure: true,
    });
  }
  
  // Waterlogged expansion tank = still urgent but not as severe
  const expTankReplace = issues.find(i => i.id === 'exp_tank_replace');
  if (expTankReplace) {
    tasks.push({
      type: 'exp_tank_replace',
      label: 'Expansion Tank Replacement',
      description: 'Tank appears waterlogged (dead bladder)',
      monthsUntilDue: 0,
      urgency: 'due',
      benefit: 'Restore thermal protection',
      whyExplanation: 'Your existing expansion tank may have a failed bladder, providing zero protection. A functional tank prevents the pressure spikes that accelerate aging.',
      icon: 'valve',
      isInfrastructure: true,
    });
  }
  
  // Failed PRV with high pressure
  const prvFailed = issues.find(i => i.id === 'prv_failed');
  if (prvFailed) {
    tasks.push({
      type: 'prv_replace',
      label: 'Pressure Regulator Replacement',
      description: `Pressure at ${inputs.housePsi} PSI (PRV failed)`,
      monthsUntilDue: 0,
      urgency: 'overdue',
      benefit: 'Stop excessive pressure damage',
      whyExplanation: `Your pressure regulating valve has failed. At ${inputs.housePsi} PSI, your equipment is under constant stress that accelerates wear on valves, fittings, and tank welds.`,
      icon: 'gauge',
      agingMultiplier: pressureStress > 1 ? pressureStress : undefined,
      isInfrastructure: true,
    });
  }
  
  // Critical pressure without PRV
  const prvCritical = issues.find(i => i.id === 'prv_critical');
  if (prvCritical) {
    tasks.push({
      type: 'prv_install',
      label: 'Pressure Regulator Installation',
      description: `Pressure at ${inputs.housePsi} PSI (unsafe)`,
      monthsUntilDue: 0,
      urgency: 'overdue',
      benefit: 'Stop excessive pressure damage',
      whyExplanation: `Water pressure above 80 PSI accelerates wear on valves, fittings, and tank welds. At ${inputs.housePsi} PSI, your equipment is under constant stress.`,
      icon: 'gauge',
      agingMultiplier: pressureStress > 1 ? pressureStress : undefined,
      isInfrastructure: true,
    });
  }
  
  return tasks;
}
