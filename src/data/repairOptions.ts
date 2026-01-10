// Repair options and simulation logic for the "Simulate Your Fix" feature
// Supports Tank, Tankless, and Hybrid water heaters

import { ForensicInputs, OpterraMetrics, Recommendation, isTankless, FuelType } from '@/lib/opterraAlgorithm';

export interface RepairOption {
  id: string;
  name: string;
  description: string;
  costMin: number;
  costMax: number;
  impact: {
    healthScoreBoost: number;
    agingFactorReduction: number;
    failureProbReduction: number;
  };
  isFullReplacement?: boolean;
  // Which unit types this repair applies to
  unitTypes: ('tank' | 'tankless' | 'hybrid')[];
}

export interface SimulatedResult {
  newScore: number;
  newStatus: 'critical' | 'warning' | 'optimal';
  newAgingFactor: number;
  newFailureProb: number;
  totalCostMin: number;
  totalCostMax: number;
}

// Helper to get unit category from fuel type
export function getUnitCategory(fuelType: FuelType): 'tank' | 'tankless' | 'hybrid' {
  if (isTankless(fuelType)) return 'tankless';
  if (fuelType === 'HYBRID') return 'hybrid';
  return 'tank';
}

// ===== TANK WATER HEATER REPAIRS =====
const tankRepairs: RepairOption[] = [
  {
    id: 'replace_tank',
    name: 'Replace Water Heater',
    description: 'Full tank system replacement with code-compliant installation',
    costMin: 2800,
    costMax: 4500,
    impact: {
      healthScoreBoost: 100,
      agingFactorReduction: 100,
      failureProbReduction: 100,
    },
    isFullReplacement: true,
    unitTypes: ['tank'],
  },
  {
    id: 'prv',
    name: 'Install PRV',
    description: 'Pressure reducing valve to control inlet pressure',
    costMin: 350,
    costMax: 550,
    impact: {
      healthScoreBoost: 20,
      agingFactorReduction: 25,
      failureProbReduction: 30,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'prv_exp_package',
    name: 'Install PRV + Expansion Tank',
    description: 'Required together: PRV creates closed loop, expansion tank prevents thermal spikes',
    costMin: 600,
    costMax: 950,
    impact: {
      healthScoreBoost: 35,
      agingFactorReduction: 45,
      failureProbReduction: 55,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'exp_tank',
    name: 'Install Expansion Tank',
    description: 'Absorbs thermal expansion in closed loop system',
    costMin: 250,
    costMax: 400,
    impact: {
      healthScoreBoost: 15,
      agingFactorReduction: 20,
      failureProbReduction: 25,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'replace_prv',
    name: 'Replace Failed PRV',
    description: 'Replace malfunctioning pressure reducing valve',
    costMin: 350,
    costMax: 550,
    impact: {
      healthScoreBoost: 22,
      agingFactorReduction: 28,
      failureProbReduction: 35,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'replace_exp',
    name: 'Replace Expansion Tank',
    description: 'Replace failed or waterlogged expansion tank',
    costMin: 250,
    costMax: 400,
    impact: {
      healthScoreBoost: 18,
      agingFactorReduction: 22,
      failureProbReduction: 28,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'flush',
    name: 'Flush Sediment',
    description: 'Professional tank flush & drain',
    costMin: 150,
    costMax: 250,
    impact: {
      healthScoreBoost: 15,
      agingFactorReduction: 25,
      failureProbReduction: 20,
    },
    unitTypes: ['tank', 'hybrid'],
  },
  {
    id: 'anode',
    name: 'Replace Anode Rod',
    description: 'New sacrificial anode installation',
    costMin: 200,
    costMax: 350,
    impact: {
      healthScoreBoost: 18,
      agingFactorReduction: 35,
      failureProbReduction: 25,
    },
    unitTypes: ['tank'],
  },
];

// ===== TANKLESS WATER HEATER REPAIRS =====
const tanklessRepairs: RepairOption[] = [
  {
    id: 'replace_tankless',
    name: 'Replace Tankless Unit',
    description: 'Full tankless system replacement with code-compliant installation',
    costMin: 3500,
    costMax: 5500,
    impact: {
      healthScoreBoost: 100,
      agingFactorReduction: 100,
      failureProbReduction: 100,
    },
    isFullReplacement: true,
    unitTypes: ['tankless'],
  },
  {
    id: 'descale',
    name: 'Descale Heat Exchanger',
    description: 'Professional vinegar flush to remove mineral scale buildup',
    costMin: 200,
    costMax: 350,
    impact: {
      healthScoreBoost: 20,
      agingFactorReduction: 30,
      failureProbReduction: 25,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'isolation_valves',
    name: 'Install Isolation Valves',
    description: 'Service valves to enable future descaling maintenance',
    costMin: 400,
    costMax: 650,
    impact: {
      healthScoreBoost: 10,
      agingFactorReduction: 15,
      failureProbReduction: 20,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'inlet_filter',
    name: 'Clean/Replace Inlet Filter',
    description: 'Remove debris from water inlet screen to restore flow',
    costMin: 75,
    costMax: 150,
    impact: {
      healthScoreBoost: 8,
      agingFactorReduction: 10,
      failureProbReduction: 12,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'igniter_service',
    name: 'Service Igniter/Flame Rod',
    description: 'Clean or replace ignition components (gas units)',
    costMin: 150,
    costMax: 300,
    impact: {
      healthScoreBoost: 12,
      agingFactorReduction: 15,
      failureProbReduction: 18,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'flow_sensor',
    name: 'Replace Flow Sensor',
    description: 'Restore accurate flow detection and proper firing',
    costMin: 200,
    costMax: 400,
    impact: {
      healthScoreBoost: 15,
      agingFactorReduction: 20,
      failureProbReduction: 22,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'vent_cleaning',
    name: 'Vent System Cleaning',
    description: 'Clear blocked or restricted exhaust venting',
    costMin: 150,
    costMax: 300,
    impact: {
      healthScoreBoost: 10,
      agingFactorReduction: 12,
      failureProbReduction: 15,
    },
    unitTypes: ['tankless'],
  },
  {
    id: 'recirculation_service',
    name: 'Recirculation System Service',
    description: 'Optimize recirc timing to reduce excessive cycling',
    costMin: 200,
    costMax: 400,
    impact: {
      healthScoreBoost: 8,
      agingFactorReduction: 20,
      failureProbReduction: 15,
    },
    unitTypes: ['tankless'],
  },
];

// ===== HYBRID WATER HEATER REPAIRS =====
const hybridRepairs: RepairOption[] = [
  {
    id: 'replace_hybrid',
    name: 'Replace Hybrid Unit',
    description: 'Full heat pump water heater replacement',
    costMin: 3800,
    costMax: 5800,
    impact: {
      healthScoreBoost: 100,
      agingFactorReduction: 100,
      failureProbReduction: 100,
    },
    isFullReplacement: true,
    unitTypes: ['hybrid'],
  },
  {
    id: 'air_filter_service',
    name: 'Clean/Replace Air Filter',
    description: 'Restore heat pump efficiency with clean airflow',
    costMin: 50,
    costMax: 100,
    impact: {
      healthScoreBoost: 10,
      agingFactorReduction: 15,
      failureProbReduction: 10,
    },
    unitTypes: ['hybrid'],
  },
  {
    id: 'condensate_clear',
    name: 'Clear Condensate Drain',
    description: 'Restore proper condensate drainage',
    costMin: 100,
    costMax: 200,
    impact: {
      healthScoreBoost: 8,
      agingFactorReduction: 10,
      failureProbReduction: 12,
    },
    unitTypes: ['hybrid'],
  },
  {
    id: 'compressor_service',
    name: 'Compressor Service',
    description: 'Diagnose and service heat pump compressor',
    costMin: 300,
    costMax: 600,
    impact: {
      healthScoreBoost: 20,
      agingFactorReduction: 25,
      failureProbReduction: 30,
    },
    unitTypes: ['hybrid'],
  },
  {
    id: 'refrigerant_check',
    name: 'Refrigerant Check & Recharge',
    description: 'Verify refrigerant levels and recharge if needed',
    costMin: 200,
    costMax: 400,
    impact: {
      healthScoreBoost: 15,
      agingFactorReduction: 20,
      failureProbReduction: 18,
    },
    unitTypes: ['hybrid'],
  },
];

// Combined repair options (for backwards compatibility)
export const repairOptions: RepairOption[] = [
  ...tankRepairs,
  ...tanklessRepairs,
  ...hybridRepairs,
];

// Get repairs filtered by unit type
export function getRepairsByUnitType(fuelType: FuelType): RepairOption[] {
  const category = getUnitCategory(fuelType);
  return repairOptions.filter(r => r.unitTypes.includes(category));
}

/**
 * Get dynamically available repairs based on current system state.
 * Now supports Tank, Tankless, and Hybrid water heaters.
 */
export function getAvailableRepairs(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation
): RepairOption[] {
  const unitCategory = getUnitCategory(inputs.fuelType);
  
  // Route to unit-specific logic
  if (unitCategory === 'tankless') {
    return getTanklessRepairs(inputs, metrics, recommendation);
  }
  if (unitCategory === 'hybrid') {
    return getHybridRepairs(inputs, metrics, recommendation);
  }
  return getTankRepairs(inputs, metrics, recommendation);
}

// ===== TANK REPAIR LOGIC =====
function getTankRepairs(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation
): RepairOption[] {
  const options: RepairOption[] = [];
  const tankOptions = getRepairsByUnitType(inputs.fuelType);

  // If replacement is REQUIRED (physical failure), only that option
  if (recommendation.action === 'REPLACE') {
    const replacement = tankOptions.find(r => r.id === 'replace_tank');
    if (replacement) options.push(replacement);
    return options;
  }

  // Determine closed loop status
  const isActuallyClosed = inputs.isClosedLoop || inputs.hasPrv;

  // PRV Logic - CRITICAL: Cannot install PRV without expansion tank
  if (!inputs.hasPrv && inputs.housePsi >= 70) {
    if (!inputs.hasExpTank) {
      const prvPackage = tankOptions.find(r => r.id === 'prv_exp_package');
      if (prvPackage) options.push(prvPackage);
    } else if (inputs.housePsi > 80) {
      const prvPackage = tankOptions.find(r => r.id === 'prv_exp_package');
      if (prvPackage) options.push(prvPackage);
    } else {
      const prv = tankOptions.find(r => r.id === 'prv');
      if (prv) options.push(prv);
    }
  }

  // PRV replacement if PRV exists but pressure still high (failed PRV)
  if (inputs.hasPrv && inputs.housePsi > 75) {
    if (!inputs.hasExpTank) {
      const replacePrv = tankOptions.find(r => r.id === 'replace_prv');
      const expTank = tankOptions.find(r => r.id === 'exp_tank');
      if (replacePrv) options.push(replacePrv);
      if (expTank) options.push(expTank);
    } else {
      const replacePrv = tankOptions.find(r => r.id === 'replace_prv');
      if (replacePrv) options.push(replacePrv);
    }
  }

  // Expansion tank needed if closed loop and no tank
  if (isActuallyClosed && !inputs.hasExpTank && inputs.hasPrv && inputs.housePsi <= 75) {
    const expTank = tankOptions.find(r => r.id === 'exp_tank');
    if (expTank) options.push(expTank);
  }

  // Expansion tank replacement if tank exists but pressure still very high
  if (inputs.hasExpTank && inputs.housePsi > 80 && inputs.hasPrv) {
    const replaceExp = tankOptions.find(r => r.id === 'replace_exp');
    if (replaceExp) options.push(replaceExp);
  }

  // SAFE FLUSH LOGIC GATES
  const isFragile = metrics.failProb > 60 || inputs.calendarAge > 12;
  const isLockedOut = metrics.sedimentLbs > 15;
  const isServiceable = metrics.sedimentLbs >= 5 && metrics.sedimentLbs <= 15;

  if (!isFragile && !isLockedOut && isServiceable) {
    const flush = tankOptions.find(r => r.id === 'flush');
    if (flush) options.push(flush);
  }

  // Anode replacement if shield life is depleted AND tank is young enough
  if (metrics.shieldLife < 1 && inputs.calendarAge < 8) {
    const anode = tankOptions.find(r => r.id === 'anode');
    if (anode) options.push(anode);
  }

  return options;
}

// ===== TANKLESS REPAIR LOGIC =====
function getTanklessRepairs(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation
): RepairOption[] {
  const options: RepairOption[] = [];
  const tanklessOptions = getRepairsByUnitType(inputs.fuelType);

  // If replacement is REQUIRED, only that option
  if (recommendation.action === 'REPLACE') {
    const replacement = tanklessOptions.find(r => r.id === 'replace_tankless');
    if (replacement) options.push(replacement);
    return options;
  }

  const scaleBuildupScore = metrics.scaleBuildupScore ?? 0;
  const flowDegradation = metrics.flowDegradation ?? 0;
  const descaleStatus = metrics.descaleStatus ?? 'optimal';
  const hasIsolationValves = inputs.hasIsolationValves ?? false;

  // PRIORITY 1: Isolation Valves (if missing - enables all other maintenance)
  if (!hasIsolationValves) {
    const valves = tanklessOptions.find(r => r.id === 'isolation_valves');
    if (valves) options.push(valves);
  }

  // PRIORITY 2: Descale Service (if valves exist and scale is building)
  if (hasIsolationValves) {
    const needsDescale = descaleStatus === 'due' || descaleStatus === 'critical' || scaleBuildupScore > 10;
    if (needsDescale) {
      const descale = tanklessOptions.find(r => r.id === 'descale');
      if (descale) options.push(descale);
    }
  }

  // PRIORITY 3: Inlet Filter (if dirty/clogged or flow degraded)
  const filterStatus = inputs.inletFilterStatus ?? 'CLEAN';
  if (filterStatus === 'DIRTY' || filterStatus === 'CLOGGED' || flowDegradation > 15) {
    const filter = tanklessOptions.find(r => r.id === 'inlet_filter');
    if (filter) options.push(filter);
  }

  // Igniter/Flame Rod Service (gas units with ignition issues)
  const isGas = inputs.fuelType === 'TANKLESS_GAS';
  const igniterHealth = inputs.igniterHealth ?? 100;
  const flameRodStatus = inputs.flameRodStatus ?? 'GOOD';
  
  if (isGas && (igniterHealth < 70 || flameRodStatus === 'WORN' || flameRodStatus === 'FAILING')) {
    const igniter = tanklessOptions.find(r => r.id === 'igniter_service');
    if (igniter) options.push(igniter);
  }

  // Vent Cleaning (gas units with vent issues)
  const ventStatus = inputs.tanklessVentStatus ?? 'CLEAR';
  if (isGas && (ventStatus === 'RESTRICTED' || ventStatus === 'BLOCKED')) {
    const vent = tanklessOptions.find(r => r.id === 'vent_cleaning');
    if (vent) options.push(vent);
  }

  // Flow Sensor (if significant flow degradation not explained by filter/scale)
  if (flowDegradation > 25 && filterStatus === 'CLEAN' && scaleBuildupScore < 20) {
    const flowSensor = tanklessOptions.find(r => r.id === 'flow_sensor');
    if (flowSensor) options.push(flowSensor);
  }

  // Recirculation Service (if recirc is causing excessive cycling)
  const hasRecirc = inputs.hasRecirculationLoop || inputs.hasCircPump;
  if (hasRecirc && inputs.calendarAge > 3) {
    const recircService = tanklessOptions.find(r => r.id === 'recirculation_service');
    if (recircService) options.push(recircService);
  }

  return options;
}

// ===== HYBRID REPAIR LOGIC =====
function getHybridRepairs(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation
): RepairOption[] {
  const options: RepairOption[] = [];
  const hybridOptions = getRepairsByUnitType(inputs.fuelType);

  // If replacement is REQUIRED, only that option
  if (recommendation.action === 'REPLACE') {
    const replacement = hybridOptions.find(r => r.id === 'replace_hybrid');
    if (replacement) options.push(replacement);
    return options;
  }

  // Air Filter Service
  const airFilterStatus = inputs.airFilterStatus ?? 'CLEAN';
  if (airFilterStatus === 'DIRTY' || airFilterStatus === 'CLOGGED') {
    const airFilter = hybridOptions.find(r => r.id === 'air_filter_service');
    if (airFilter) options.push(airFilter);
  }

  // Condensate Drain
  const isCondensateClear = inputs.isCondensateClear ?? true;
  if (!isCondensateClear) {
    const condensate = hybridOptions.find(r => r.id === 'condensate_clear');
    if (condensate) options.push(condensate);
  }

  // Compressor Service (if compressor health is degraded)
  const compressorHealth = inputs.compressorHealth ?? 100;
  if (compressorHealth < 70) {
    const compressor = hybridOptions.find(r => r.id === 'compressor_service');
    if (compressor) options.push(compressor);
  }

  // Refrigerant Check (if compressor working but efficiency low)
  if (compressorHealth >= 70 && compressorHealth < 90) {
    const refrigerant = hybridOptions.find(r => r.id === 'refrigerant_check');
    if (refrigerant) options.push(refrigerant);
  }

  // Tank maintenance (hybrids have tanks too)
  // Use same logic as tank repairs for flush/PRV/expansion tank
  const isActuallyClosed = inputs.isClosedLoop || inputs.hasPrv;

  if (!inputs.hasPrv && inputs.housePsi >= 70) {
    if (!inputs.hasExpTank) {
      const prvPackage = hybridOptions.find(r => r.id === 'prv_exp_package');
      if (prvPackage) options.push(prvPackage);
    } else {
      const prv = hybridOptions.find(r => r.id === 'prv');
      if (prv) options.push(prv);
    }
  }

  if (isActuallyClosed && !inputs.hasExpTank && inputs.hasPrv) {
    const expTank = hybridOptions.find(r => r.id === 'exp_tank');
    if (expTank) options.push(expTank);
  }

  // Flush for hybrids
  const isFragile = metrics.failProb > 60 || inputs.calendarAge > 12;
  const isLockedOut = metrics.sedimentLbs > 15;
  const isServiceable = metrics.sedimentLbs >= 5 && metrics.sedimentLbs <= 15;

  if (!isFragile && !isLockedOut && isServiceable) {
    const flush = hybridOptions.find(r => r.id === 'flush');
    if (flush) options.push(flush);
  }

  return options;
}

export function simulateRepairs(
  currentScore: number,
  currentAgingFactor: number,
  currentFailureProb: number,
  selectedRepairs: RepairOption[]
): SimulatedResult {
  // If full replacement is selected, return perfect score
  if (selectedRepairs.some(r => r.isFullReplacement)) {
    const replacement = selectedRepairs.find(r => r.isFullReplacement)!;
    return {
      newScore: 100,
      newStatus: 'optimal',
      newAgingFactor: 1.0,
      newFailureProb: 0.5,
      totalCostMin: replacement.costMin,
      totalCostMax: replacement.costMax,
    };
  }

  // Calculate cumulative impact with diminishing returns
  let scoreBoost = 0;
  let agingReduction = 0;
  let failureReduction = 0;
  let totalCostMin = 0;
  let totalCostMax = 0;

  selectedRepairs.forEach((repair, index) => {
    const diminishingFactor = 1 / (1 + index * 0.2);
    scoreBoost += repair.impact.healthScoreBoost * diminishingFactor;
    agingReduction += repair.impact.agingFactorReduction * diminishingFactor;
    failureReduction += repair.impact.failureProbReduction * diminishingFactor;
    totalCostMin += repair.costMin;
    totalCostMax += repair.costMax;
  });

  // Cap the improvements (can't reach 100 without replacement)
  const newScore = Math.min(85, currentScore + scoreBoost);
  const newAgingFactor = Math.max(1.0, currentAgingFactor * (1 - agingReduction / 100));
  const newFailureProb = Math.max(2, currentFailureProb * (1 - failureReduction / 100));

  // Determine new status
  let newStatus: 'critical' | 'warning' | 'optimal';
  if (newScore >= 70) {
    newStatus = 'optimal';
  } else if (newScore >= 40) {
    newStatus = 'warning';
  } else {
    newStatus = 'critical';
  }

  return {
    newScore: Math.round(newScore),
    newStatus,
    newAgingFactor: Math.round(newAgingFactor * 10) / 10,
    newFailureProb: Math.round(newFailureProb * 10) / 10,
    totalCostMin,
    totalCostMax,
  };
}