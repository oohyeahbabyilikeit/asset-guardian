// Repair options and simulation logic for the "Simulate Your Fix" feature

import { ForensicInputs, OpterraMetrics, Recommendation } from '@/lib/opterraAlgorithm';

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
}

export interface SimulatedResult {
  newScore: number;
  newStatus: 'critical' | 'warning' | 'optimal';
  newAgingFactor: number;
  newFailureProb: number;
  totalCostMin: number;
  totalCostMax: number;
}

// All possible repair options (static definitions)
export const repairOptions: RepairOption[] = [
  {
    id: 'replace',
    name: 'Replace Water Heater',
    description: 'Full system replacement with new unit',
    costMin: 2800,
    costMax: 4500,
    impact: {
      healthScoreBoost: 100,
      agingFactorReduction: 100,
      failureProbReduction: 100,
    },
    isFullReplacement: true,
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
  },
];

/**
 * Get dynamically available repairs based on current system state.
 * Only returns repairs that are actually needed for this specific unit.
 */
export function getAvailableRepairs(
  inputs: ForensicInputs,
  metrics: OpterraMetrics,
  recommendation: Recommendation
): RepairOption[] {
  const options: RepairOption[] = [];

  // If replacement is REQUIRED (physical failure), only that option
  if (recommendation.action === 'REPLACE') {
    const replacement = repairOptions.find(r => r.id === 'replace');
    if (replacement) options.push(replacement);
    return options;
  }

  // Full replacement is ONLY available when algorithm requires it
  // Do NOT offer replacement for REPAIR/UPGRADE recommendations

  // Determine closed loop status
  const isActuallyClosed = inputs.isClosedLoop || inputs.hasPrv;

  // PRV recommended at 70+ PSI - reduces strain by ~50% when cut to 60 PSI
  if (!inputs.hasPrv && inputs.psi >= 70) {
    const prv = repairOptions.find(r => r.id === 'prv');
    if (prv) options.push(prv);
  }

  // PRV replacement if PRV exists but pressure still high (failed PRV)
  if (inputs.hasPrv && inputs.psi > 75) {
    const replacePrv = repairOptions.find(r => r.id === 'replace_prv');
    if (replacePrv) options.push(replacePrv);
  }

  // Expansion tank needed if closed loop and no tank
  if (isActuallyClosed && !inputs.hasExpTank) {
    const expTank = repairOptions.find(r => r.id === 'exp_tank');
    if (expTank) options.push(expTank);
  }

  // Expansion tank replacement if tank exists but pressure still very high
  if (inputs.hasExpTank && inputs.psi > 80) {
    const replaceExp = repairOptions.find(r => r.id === 'replace_exp');
    if (replaceExp) options.push(replaceExp);
  }

  // SAFE FLUSH LOGIC GATES
  // Prevents: "Killer Flush" (locked out), "Ghost Flush" (fragile tank)
  const isFragile = metrics.failProb > 60 || inputs.calendarAge > 12;
  const isLockedOut = metrics.sedimentLbs > 15;  // Sediment too hardite flush
  const isServiceable = metrics.sedimentLbs >= 5 && metrics.sedimentLbs <= 15;

  // Only offer flush if tank is safe to service AND dirty enough to need it
  if (!isFragile && !isLockedOut && isServiceable) {
    const flush = repairOptions.find(r => r.id === 'flush');
    if (flush) options.push(flush);
  }
  // Anode replacement if shield life is depleted AND tank is young enough to be worth it
  if (metrics.shieldLife < 1 && inputs.calendarAge < 8) {
    const anode = repairOptions.find(r => r.id === 'anode');
    if (anode) options.push(anode);
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