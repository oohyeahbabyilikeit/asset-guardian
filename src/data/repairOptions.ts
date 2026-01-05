// Repair options and simulation logic for the "Simulate Your Fix" feature

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
    id: 'pressure',
    name: 'Fix High Pressure',
    description: 'Install PRV + Expansion Tank',
    costMin: 450,
    costMax: 650,
    impact: {
      healthScoreBoost: 25,
      agingFactorReduction: 30,
      failureProbReduction: 40,
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
