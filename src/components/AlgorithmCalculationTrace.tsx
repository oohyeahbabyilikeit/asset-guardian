import { useState } from 'react';
import { ChevronDown, ChevronRight, Calculator, Beaker, Gauge, Shield, Thermometer, Activity, Clock, Droplets, AlertTriangle } from 'lucide-react';
import { type ForensicInputs, type OpterraResult, isTankless, resolveHardness } from '@/lib/opterraAlgorithm';

interface AlgorithmCalculationTraceProps {
  inputs: ForensicInputs;
  result: OpterraResult;
}

interface CalculationStep {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  formula?: string;
  inputs: { label: string; value: string | number; highlight?: boolean }[];
  result: { label: string; value: string | number; unit?: string };
  impact: 'neutral' | 'positive' | 'negative' | 'critical';
}

function StepCard({ step, isExpanded, onToggle }: { step: CalculationStep; isExpanded: boolean; onToggle: () => void }) {
  const impactColors = {
    neutral: 'border-border bg-card',
    positive: 'border-emerald-500/30 bg-emerald-500/5',
    negative: 'border-yellow-500/30 bg-yellow-500/5',
    critical: 'border-destructive/30 bg-destructive/5',
  };

  const impactBadge = {
    neutral: 'bg-muted text-muted-foreground',
    positive: 'bg-emerald-500/20 text-emerald-600',
    negative: 'bg-yellow-500/20 text-yellow-700',
    critical: 'bg-destructive/20 text-destructive',
  };

  return (
    <div className={`rounded-lg border ${impactColors[step.impact]} overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="text-muted-foreground">{step.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{step.name}</div>
          <div className="text-xs text-muted-foreground truncate">{step.description}</div>
        </div>
        <div className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold ${impactBadge[step.impact]}`}>
          {step.result.value}{step.result.unit && ` ${step.result.unit}`}
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/50 bg-muted/20">
          {step.formula && (
            <div className="mt-2 p-2 rounded bg-card font-mono text-xs text-muted-foreground border border-border">
              <span className="text-primary/70">Formula:</span> {step.formula}
            </div>
          )}
          
          <div className="mt-2 grid grid-cols-2 gap-2">
            {step.inputs.map((input, i) => (
              <div 
                key={i} 
                className={`p-2 rounded text-xs ${input.highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}
              >
                <div className="text-muted-foreground">{input.label}</div>
                <div className="font-mono font-medium">{input.value}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-2 p-2 rounded bg-card border border-border">
            <div className="text-xs text-muted-foreground">{step.result.label}</div>
            <div className="text-lg font-bold font-mono">
              {step.result.value}{step.result.unit && <span className="text-sm text-muted-foreground ml-1">{step.result.unit}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlgorithmCalculationTrace({ inputs, result }: AlgorithmCalculationTraceProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const isTanklessUnit = isTankless(inputs.fuelType);
  const { metrics } = result;
  
  // Resolve hardness the same way the algorithm does
  const { effectiveHardness, streetHardness, source: hardnessSource } = resolveHardness(inputs);

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(calculationSteps.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  // Build calculation steps based on unit type
  const calculationSteps: CalculationStep[] = isTanklessUnit 
    ? buildTanklessSteps(inputs, metrics, effectiveHardness, hardnessSource)
    : buildTankSteps(inputs, metrics, effectiveHardness, hardnessSource);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Calculation Trace
        </h3>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs text-primary hover:underline">Expand All</button>
          <span className="text-muted-foreground">·</span>
          <button onClick={collapseAll} className="text-xs text-primary hover:underline">Collapse All</button>
        </div>
      </div>

      <div className="space-y-2">
        {calculationSteps.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isExpanded={expandedSteps.has(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>

      {/* Final Result Summary */}
      <div className="mt-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Health Score</div>
          <div className={`text-4xl font-bold font-mono ${
            metrics.healthScore >= 70 ? 'text-emerald-500' :
            metrics.healthScore >= 40 ? 'text-yellow-600' :
            'text-destructive'
          }`}>
            {metrics.healthScore}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Bio Age: {metrics.bioAge.toFixed(1)} yrs · Fail Prob: {metrics.failProb.toFixed(1)}% · Primary Stressor: {metrics.primaryStressor}
          </div>
        </div>
      </div>
    </div>
  );
}

// Build calculation steps for tank water heaters
function buildTankSteps(
  inputs: ForensicInputs, 
  metrics: any,
  effectiveHardness: number,
  hardnessSource: string
): CalculationStep[] {
  const steps: CalculationStep[] = [];

  // Step 1: Usage Intensity
  const usageMultipliers = { light: 0.7, normal: 1.0, heavy: 1.3 };
  const usageMultiplier = usageMultipliers[inputs.usageType] || 1.0;
  const occupancyFactor = Math.max(0.4, inputs.peopleCount / 3);
  const usageIntensity = Math.min(4.0, usageMultiplier * occupancyFactor);
  
  steps.push({
    id: 'usage_intensity',
    name: 'Usage Intensity',
    icon: <Activity className="w-4 h-4" />,
    description: 'Household demand multiplier based on people count and usage habits',
    formula: 'min(4.0, usageMultiplier × occupancyFactor)',
    inputs: [
      { label: 'People Count', value: inputs.peopleCount },
      { label: 'Usage Type', value: inputs.usageType },
      { label: 'Usage Multiplier', value: usageMultiplier.toFixed(2) },
      { label: 'Occupancy Factor', value: occupancyFactor.toFixed(2) },
    ],
    result: { label: 'Usage Intensity', value: usageIntensity.toFixed(2), unit: '×' },
    impact: usageIntensity > 2 ? 'negative' : usageIntensity > 1.5 ? 'negative' : 'neutral',
  });

  // Step 2: Water Hardness Resolution
  steps.push({
    id: 'hardness_resolve',
    name: 'Water Hardness',
    icon: <Droplets className="w-4 h-4" />,
    description: `Effective hardness for physics calculations (source: ${hardnessSource})`,
    inputs: [
      { label: 'Street Hardness', value: `${inputs.streetHardnessGPG ?? inputs.hardnessGPG} GPG` },
      { label: 'Measured', value: inputs.measuredHardnessGPG ? `${inputs.measuredHardnessGPG} GPG` : 'N/A' },
      { label: 'Has Softener', value: inputs.hasSoftener ? 'Yes' : 'No', highlight: inputs.hasSoftener },
      { label: 'Salt Status', value: inputs.softenerSaltStatus ?? 'Unknown' },
    ],
    result: { label: 'Effective Hardness', value: effectiveHardness.toFixed(1), unit: 'GPG' },
    impact: effectiveHardness > 15 ? 'critical' : effectiveHardness > 7 ? 'negative' : 'positive',
  });

  // Step 3: Anode Shield Life (v9.0 Physics Model with Burn Rate Transparency)
  // v9.0: 4-year baseline, multiplicative burn rate, history-aware
  const baseMassYears = (inputs.anodeCount === 2 || inputs.warrantyYears >= 12) ? 7.5 : 4.0;
  const softenerFactor = inputs.hasSoftener ? 3.0 : 1.0;
  const recircFactor = inputs.hasCircPump ? 1.25 : 1.0;
  const galvanicFactor = inputs.connectionType === 'DIRECT_COPPER' ? 2.5 : 1.0;
  const chloramineFactor = inputs.sanitizerType === 'CHLORAMINE' ? 1.2 : 1.0;
  const currentBurnRate = Math.min(8.0, softenerFactor * galvanicFactor * recircFactor * chloramineFactor);
  
  const anodeAge = inputs.lastAnodeReplaceYearsAgo ?? inputs.calendarAge;
  
  // History-aware: split years before/after softener
  const yearsWithSoftener = inputs.yearsWithoutSoftener !== undefined
    ? Math.max(0, anodeAge - inputs.yearsWithoutSoftener)
    : (inputs.hasSoftener ? anodeAge : 0);
  const yearsNormal = anodeAge - yearsWithSoftener;
  const historicalBurnRate = galvanicFactor * recircFactor * chloramineFactor;
  
  const consumedMass = (yearsNormal * historicalBurnRate) + (yearsWithSoftener * currentBurnRate);
  const remainingMass = baseMassYears - consumedMass;
  const calculatedShieldLife = remainingMass <= 0 ? 0 : Math.max(0.5, remainingMass / currentBurnRate);
  
  // Build active factors list for display
  const activeBurnFactors: string[] = [];
  if (softenerFactor > 1) activeBurnFactors.push(`Softener (${softenerFactor}×)`);
  if (galvanicFactor > 1) activeBurnFactors.push(`Direct Copper (${galvanicFactor}×)`);
  if (recircFactor > 1) activeBurnFactors.push(`Recirc Pump (${recircFactor}×)`);
  if (chloramineFactor > 1) activeBurnFactors.push(`Chloramine (${chloramineFactor}×)`);
  
  steps.push({
    id: 'anode_shield',
    name: 'Anode Shield Life (v9.0)',
    icon: <Shield className="w-4 h-4" />,
    description: 'Physics-corrected anode protection model (4yr baseline, multiplicative burn)',
    formula: '(baseMass - consumedMass) / currentBurnRate',
    inputs: [
      { label: 'Base Capacity', value: baseMassYears.toFixed(1) + ' yrs', highlight: true },
      { label: 'Anode Age', value: anodeAge.toFixed(1) + ' yrs' },
      { label: 'Current Burn Rate', value: currentBurnRate.toFixed(2) + '×', highlight: currentBurnRate > 2 },
      { label: 'Active Accelerators', value: activeBurnFactors.length > 0 ? activeBurnFactors.join(', ') : 'None', highlight: activeBurnFactors.length > 0 },
      { label: 'Mass Consumed', value: consumedMass.toFixed(1) + ' yrs' },
      { label: 'Mass Remaining', value: remainingMass.toFixed(1) + ' yrs' },
    ],
    result: { label: 'Shield Life Remaining', value: metrics.shieldLife.toFixed(1), unit: 'yrs' },
    impact: metrics.shieldLife <= 0 ? 'critical' : metrics.shieldLife < 1 ? 'negative' : 'positive',
  });

  // Step 4: Sediment Accumulation
  const sedimentFactor = inputs.fuelType === 'ELECTRIC' ? 0.08 : 0.044;
  // FIX v7.10: Cap yearsSinceFlush to calendarAge - can't have sediment from before unit existed
  const yearsSinceFlush = Math.min(inputs.lastFlushYearsAgo ?? inputs.calendarAge, inputs.calendarAge);
  const sedimentLbs = sedimentFactor * effectiveHardness * yearsSinceFlush * usageIntensity;
  
  steps.push({
    id: 'sediment',
    name: 'Sediment Accumulation',
    icon: <Beaker className="w-4 h-4" />,
    description: 'Mineral deposit buildup in tank bottom',
    formula: 'sedimentFactor × hardness × yearsSinceFlush × usageIntensity',
    inputs: [
      { label: 'Fuel Type Factor', value: sedimentFactor },
      { label: 'Effective Hardness', value: `${effectiveHardness.toFixed(1)} GPG` },
      { label: 'Years Since Flush', value: yearsSinceFlush.toFixed(1) },
      { label: 'Usage Intensity', value: usageIntensity.toFixed(2) + '×' },
    ],
    result: { label: 'Sediment', value: metrics.sedimentLbs.toFixed(1), unit: 'lbs' },
    impact: metrics.sedimentLbs > 15 ? 'critical' : metrics.sedimentLbs > 5 ? 'negative' : 'neutral',
  });

  // Step 5: Pressure Stress
  const basePsi = inputs.housePsi;
  const isClosedLoop = inputs.isClosedLoop;
  const hasExpTank = inputs.hasExpTank && inputs.expTankStatus !== 'WATERLOGGED';
  const thermalSpike = isClosedLoop && !hasExpTank ? 40 : 0;
  const effectivePsi = basePsi + thermalSpike;
  const pressureStress = Math.max(1.0, 1 + Math.pow((effectivePsi - 80) / 20, 2));
  
  steps.push({
    id: 'pressure',
    name: 'Pressure Stress',
    icon: <Gauge className="w-4 h-4" />,
    description: 'Tank pressure load including thermal expansion',
    formula: 'max(1.0, 1 + ((effectivePsi - 80) / 20)²)',
    inputs: [
      { label: 'House PSI', value: basePsi },
      { label: 'Closed Loop', value: isClosedLoop ? 'Yes' : 'No', highlight: isClosedLoop && !hasExpTank },
      { label: 'Exp Tank Working', value: hasExpTank ? 'Yes' : 'No' },
      { label: 'Thermal Spike', value: `+${thermalSpike} PSI` },
    ],
    result: { label: 'Pressure Stress', value: metrics.stressFactors.pressure.toFixed(2), unit: '×' },
    impact: effectivePsi > 100 ? 'critical' : effectivePsi > 80 ? 'negative' : 'neutral',
  });

  // Step 6: Thermal Stress
  const tempPenalties = { LOW: 0.9, NORMAL: 1.0, HOT: 1.5 };
  const tempStress = tempPenalties[inputs.tempSetting] || 1.0;
  
  steps.push({
    id: 'thermal',
    name: 'Thermal Stress (Arrhenius)',
    icon: <Thermometer className="w-4 h-4" />,
    description: 'Temperature setting impact on chemical reaction rates',
    inputs: [
      { label: 'Temp Setting', value: inputs.tempSetting, highlight: inputs.tempSetting === 'HOT' },
      { label: 'LOW (110°F)', value: '0.9×' },
      { label: 'NORMAL (120°F)', value: '1.0×' },
      { label: 'HOT (140°F)', value: '1.5×' },
    ],
    result: { label: 'Thermal Multiplier', value: tempStress.toFixed(1), unit: '×' },
    impact: tempStress > 1.2 ? 'negative' : tempStress < 1 ? 'positive' : 'neutral',
  });

  // Step 7: Bio Age Calculation
  const totalStress = metrics.stressFactors.total;
  const bioAge = inputs.calendarAge * totalStress;
  
  steps.push({
    id: 'bio_age',
    name: 'Biological Age',
    icon: <Clock className="w-4 h-4" />,
    description: 'Effective age after applying all stress factors',
    formula: 'calendarAge × totalStress',
    inputs: [
      { label: 'Calendar Age', value: `${inputs.calendarAge} yrs` },
      { label: 'Total Stress', value: totalStress.toFixed(2) + '×' },
      { label: 'Mechanical', value: metrics.stressFactors.mechanical.toFixed(2) + '×' },
      { label: 'Chemical', value: metrics.stressFactors.chemical.toFixed(2) + '×' },
    ],
    result: { label: 'Bio Age', value: metrics.bioAge.toFixed(1), unit: 'yrs' },
    impact: metrics.bioAge >= 20 ? 'critical' : metrics.bioAge >= 12 ? 'negative' : 'neutral',
  });

  // Step 8: Weibull Failure Probability
  const eta = 11.5;
  const beta = 2.2;
  
  steps.push({
    id: 'weibull',
    name: 'Weibull Failure Probability',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Statistical failure probability using Weibull distribution',
    formula: '(1 - R(t+1)/R(t)) × 100, where R(t) = e^(-(t/η)^β)',
    inputs: [
      { label: 'Bio Age (t)', value: `${metrics.bioAge.toFixed(1)} yrs` },
      { label: 'Eta (η)', value: eta, highlight: true },
      { label: 'Beta (β)', value: beta, highlight: true },
      { label: 'Reliability R(t)', value: Math.exp(-Math.pow(metrics.bioAge / eta, beta)).toFixed(4) },
    ],
    result: { label: 'Failure Probability', value: metrics.failProb.toFixed(1), unit: '%' },
    impact: metrics.failProb >= 50 ? 'critical' : metrics.failProb >= 20 ? 'negative' : 'neutral',
  });

  return steps;
}

// Build calculation steps for tankless water heaters
function buildTanklessSteps(
  inputs: ForensicInputs, 
  metrics: any,
  effectiveHardness: number,
  hardnessSource: string
): CalculationStep[] {
  const steps: CalculationStep[] = [];

  // Step 1: Cycle Intensity
  const usageMultipliers = { light: 0.7, normal: 1.0, heavy: 1.6 };
  const usageMultiplier = usageMultipliers[inputs.usageType] || 1.0;
  const occupancyFactor = Math.max(0.4, inputs.peopleCount / 2.5);
  const recircPenalty = (inputs.hasRecirculationLoop || inputs.hasCircPump) ? 2.5 : 1.0;
  const cycleStress = Math.min(4.0, usageMultiplier * occupancyFactor * recircPenalty);
  
  steps.push({
    id: 'cycle_intensity',
    name: 'Cycle Intensity',
    icon: <Activity className="w-4 h-4" />,
    description: 'ON/OFF cycle stress from usage patterns',
    formula: 'min(4.0, usageMultiplier × occupancyFactor × recircPenalty)',
    inputs: [
      { label: 'Usage Type', value: inputs.usageType },
      { label: 'People Count', value: inputs.peopleCount },
      { label: 'Recirc Pump', value: inputs.hasRecirculationLoop || inputs.hasCircPump ? 'Yes (2.5×)' : 'No' },
      { label: 'Occupancy Factor', value: occupancyFactor.toFixed(2) },
    ],
    result: { label: 'Cycle Stress', value: cycleStress.toFixed(2), unit: '×' },
    impact: cycleStress > 2.5 ? 'critical' : cycleStress > 1.5 ? 'negative' : 'neutral',
  });

  // Step 2: Scale Accumulation
  const tanklessHardness = (inputs.hasSoftener && effectiveHardness < 1.5) ? 0.2 : effectiveHardness;
  const yearsSinceDescale = inputs.lastDescaleYearsAgo ?? inputs.calendarAge;
  const scaleFactor = inputs.fuelType === 'TANKLESS_ELECTRIC' ? 0.8 : 1.1;
  const tempPenalty = inputs.tempSetting === 'HOT' ? 1.5 : 1.0;
  const rawScale = tanklessHardness * yearsSinceDescale * cycleStress * scaleFactor * tempPenalty;
  
  steps.push({
    id: 'scale_buildup',
    name: 'Scale Buildup',
    icon: <Beaker className="w-4 h-4" />,
    description: 'Heat exchanger blockage percentage from mineral deposits',
    formula: 'hardness × yearsSinceDescale × cycleStress × scaleFactor × tempPenalty',
    inputs: [
      { label: 'Effective Hardness', value: `${tanklessHardness.toFixed(1)} GPG`, highlight: tanklessHardness > 10 },
      { label: 'Years Since Descale', value: yearsSinceDescale.toFixed(1) },
      { label: 'Scale Factor', value: scaleFactor },
      { label: 'Temp Penalty', value: tempPenalty + '×' },
    ],
    result: { label: 'Scale Buildup', value: (metrics.scaleBuildupScore ?? rawScale).toFixed(0), unit: '%' },
    impact: (metrics.scaleBuildupScore ?? 0) > 60 ? 'critical' : (metrics.scaleBuildupScore ?? 0) > 25 ? 'negative' : 'neutral',
  });

  // Step 3: Flow Degradation
  const flowLoss = metrics.flowDegradation ?? 0;
  
  steps.push({
    id: 'flow_loss',
    name: 'Flow Degradation',
    icon: <Gauge className="w-4 h-4" />,
    description: 'GPM loss compared to rated flow capacity',
    formula: '((ratedGPM - currentGPM) / ratedGPM) × 100',
    inputs: [
      { label: 'Rated Flow', value: `${inputs.ratedFlowGPM ?? 9.5} GPM` },
      { label: 'Current Flow', value: inputs.flowRateGPM !== undefined ? `${inputs.flowRateGPM} GPM` : 'Not Measured' },
      { label: 'Inlet Filter', value: inputs.inletFilterStatus ?? 'Unknown' },
    ],
    result: { label: 'Flow Loss', value: flowLoss.toFixed(0), unit: '%' },
    impact: flowLoss > 30 ? 'critical' : flowLoss > 15 ? 'negative' : 'neutral',
  });

  // Step 4: Descale Status
  const descaleStatus = metrics.descaleStatus ?? 'unknown';
  
  steps.push({
    id: 'descale_status',
    name: 'Descale Eligibility',
    icon: <Shield className="w-4 h-4" />,
    description: 'Whether unit can be safely descaled',
    inputs: [
      { label: 'Has Isolation Valves', value: inputs.hasIsolationValves ? 'Yes' : 'No', highlight: !inputs.hasIsolationValves },
      { label: 'Scale Level', value: `${(metrics.scaleBuildupScore ?? 0).toFixed(0)}%` },
      { label: 'Unit Age', value: `${inputs.calendarAge} yrs` },
      { label: 'Ever Descaled', value: inputs.lastDescaleYearsAgo !== undefined ? 'Yes' : 'Never' },
    ],
    result: { label: 'Status', value: descaleStatus.toUpperCase() },
    impact: descaleStatus === 'lockout' || descaleStatus === 'impossible' ? 'critical' : 
            descaleStatus === 'critical' || descaleStatus === 'run_to_failure' ? 'negative' : 'neutral',
  });

  // Step 5: Scale Stress
  const scaleStress = 1.0 + Math.pow((metrics.scaleBuildupScore ?? 0) / 30, 2.0);
  
  steps.push({
    id: 'scale_stress',
    name: 'Scale Stress Factor',
    icon: <Thermometer className="w-4 h-4" />,
    description: 'Heat exchanger thermal insulation penalty',
    formula: '1 + (scalePercent / 30)²',
    inputs: [
      { label: 'Scale Buildup', value: `${(metrics.scaleBuildupScore ?? 0).toFixed(0)}%` },
      { label: 'Divisor', value: 30 },
    ],
    result: { label: 'Scale Stress', value: scaleStress.toFixed(2), unit: '×' },
    impact: scaleStress > 5 ? 'critical' : scaleStress > 2 ? 'negative' : 'neutral',
  });

  // Step 6: Bio Age
  steps.push({
    id: 'bio_age',
    name: 'Biological Age',
    icon: <Clock className="w-4 h-4" />,
    description: 'Effective age after applying all stress factors',
    formula: 'calendarAge × totalStress',
    inputs: [
      { label: 'Calendar Age', value: `${inputs.calendarAge} yrs` },
      { label: 'Total Stress', value: metrics.stressFactors.total.toFixed(2) + '×' },
      { label: 'Max Bio Age Cap', value: '25 yrs' },
    ],
    result: { label: 'Bio Age', value: metrics.bioAge.toFixed(1), unit: 'yrs' },
    impact: metrics.bioAge >= 20 ? 'critical' : metrics.bioAge >= 12 ? 'negative' : 'neutral',
  });

  // Step 7: Weibull
  const eta = inputs.fuelType === 'TANKLESS_GAS' ? 15.5 : 14.0;
  const beta = 2.8;
  
  steps.push({
    id: 'weibull',
    name: 'Weibull Failure Probability',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Statistical failure probability (tankless uses steeper β)',
    formula: '(1 - R(t+1)/R(t)) × 100',
    inputs: [
      { label: 'Bio Age (t)', value: `${metrics.bioAge.toFixed(1)} yrs` },
      { label: 'Eta (η) - Gas', value: 15.5 },
      { label: 'Eta (η) - Electric', value: 14.0 },
      { label: 'Beta (β)', value: beta, highlight: true },
    ],
    result: { label: 'Failure Probability', value: metrics.failProb.toFixed(1), unit: '%' },
    impact: metrics.failProb >= 50 ? 'critical' : metrics.failProb >= 20 ? 'negative' : 'neutral',
  });

  return steps;
}
