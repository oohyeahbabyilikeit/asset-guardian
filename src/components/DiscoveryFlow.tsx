import { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Gauge, Shield, Thermometer, AlertTriangle, CheckCircle2, Info, Zap, AlertOctagon, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk, failProbToHealthScore, type ActionType } from '@/lib/opterraAlgorithm';
import { InteractiveWaterHeaterDiagram } from './InteractiveWaterHeaterDiagram';

interface DiscoveryFlowProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onComplete: () => void;
}

interface Observation {
  id: string;
  icon: React.ReactNode;
  title: string;
  yourValue: string;
  benchmark: string;
  explanation: string;
  status: 'good' | 'attention' | 'concern';
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            i === currentStep ? "w-8 bg-primary" : i < currentStep ? "bg-primary/60" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

// Urgent Alert Step - Shows first when replacement is needed
function UrgentAlertStep({ 
  action, 
  title, 
  reason, 
  healthScore,
  isLeaking,
  hasVisualRust 
}: { 
  action: ActionType;
  title: string;
  reason: string;
  healthScore: number;
  isLeaking?: boolean;
  hasVisualRust?: boolean;
}) {
  const isReplace = action === 'REPLACE';
  const isBreach = isLeaking;
  
  return (
    <div className="space-y-6">
      {/* Alert Icon */}
      <div className="flex justify-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center",
          isBreach 
            ? "bg-red-500/20 animate-pulse" 
            : isReplace 
            ? "bg-red-500/15" 
            : "bg-amber-500/15"
        )}>
          {isBreach ? (
            <XCircle className="w-10 h-10 text-red-500" />
          ) : (
            <AlertOctagon className={cn(
              "w-10 h-10",
              isReplace ? "text-red-500" : "text-amber-500"
            )} />
          )}
        </div>
      </div>

      {/* Alert Title */}
      <div className="text-center space-y-2">
        <h2 className={cn(
          "text-2xl font-bold",
          isBreach || isReplace ? "text-red-500" : "text-amber-500"
        )}>
          {isBreach ? "Active Leak Detected" : title}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          {isBreach 
            ? "Your water heater requires immediate attention. An active leak can cause significant water damage."
            : reason
          }
        </p>
      </div>

      {/* Health Score */}
      <Card className={cn(
        "p-4 border-2",
        isBreach || isReplace ? "border-red-500/50 bg-red-500/5" : "border-amber-500/50 bg-amber-500/5"
      )}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Health Score</span>
          <span className={cn(
            "text-3xl font-bold",
            healthScore < 30 ? "text-red-500" : healthScore < 50 ? "text-amber-500" : "text-foreground"
          )}>
            {healthScore}
          </span>
        </div>
        <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              healthScore < 30 ? "bg-red-500" : healthScore < 50 ? "bg-amber-500" : "bg-green-500"
            )}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </Card>

      {/* Key Issues */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Issues</p>
        <div className="space-y-2">
          {isLeaking && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-400">Active leak requiring immediate action</span>
            </div>
          )}
          {hasVisualRust && (
            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-sm font-medium text-red-400">Visible rust or corrosion detected</span>
            </div>
          )}
          {action === 'REPLACE' && !isLeaking && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm font-medium text-amber-400">Unit has exceeded recommended service life</span>
            </div>
          )}
        </div>
      </div>

      {/* Recommendation */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground mb-1">What This Means</p>
            <p className="text-sm text-muted-foreground">
              {isBreach 
                ? "Stop using the unit if safe to do so. Contact a licensed plumber immediately. Continue to see the full assessment."
                : action === 'REPLACE'
                ? "Based on age, condition, and stress factors, replacement is more cost-effective than continued repairs. Continue to see the full assessment."
                : "Your unit would benefit from professional service. Continue to learn what's affecting your water heater."
              }
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 1: Unit Profile
function UnitProfileStep({ asset, inputs, metrics }: { asset: AssetData; inputs: ForensicInputs; metrics: { sedimentLbs: number; shieldLife: number } }) {
  const equipmentItems = [
    { label: 'Pressure Reducing Valve', present: inputs.hasPrv },
    { label: 'Expansion Tank', present: inputs.hasExpTank },
    { label: 'Water Softener', present: inputs.hasSoftener },
    { label: 'Recirculation Pump', present: inputs.hasCircPump },
  ];

  // Calculate anode percentage from shield life (rough estimate)
  // If shieldLife > 0, estimate percentage based on typical 6-year lifespan
  const typicalAnodeLife = inputs.warrantyYears || 6;
  const anodePercent = Math.max(0, Math.min(100, (metrics.shieldLife / typicalAnodeLife) * 100));

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Let's Look at Your Water Heater</h2>
        <p className="text-sm text-muted-foreground">Explore the components that affect your unit's health</p>
      </div>

      {/* Interactive Educational Diagram */}
      <InteractiveWaterHeaterDiagram
        anodePercent={Math.round(anodePercent)}
        sedimentLbs={metrics.sedimentLbs}
        fuelType={inputs.fuelType}
        hasExpansionTank={inputs.hasExpTank}
        hasPRV={inputs.hasPrv}
      />

      {/* Age indicator */}
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-card border border-border rounded-full text-sm font-semibold">
          Your unit: {inputs.calendarAge} years old
        </div>
      </div>

      {/* Unit specs */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Brand</span>
            <p className="font-medium">{asset.brand}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Capacity</span>
            <p className="font-medium">{asset.specs.capacity}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Fuel Type</span>
            <p className="font-medium">{asset.specs.fuelType}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Location</span>
            <p className="font-medium">{asset.location}</p>
          </div>
        </div>
      </Card>

      {/* Equipment present */}
      <Card className="p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Equipment Present</h3>
        <div className="grid grid-cols-2 gap-2">
          {equipmentItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                item.present ? "bg-green-500/20" : "bg-muted"
              )}>
                {item.present ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                )}
              </div>
              <span className={item.present ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Step 2: Observations (one at a time)
function ObservationsStep({ 
  observations, 
  currentIndex, 
  onNext, 
  onPrev,
  isLast 
}: { 
  observations: Observation[]; 
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  isLast: boolean;
}) {
  const obs = observations[currentIndex];
  
  const statusColors = {
    good: 'text-green-500 bg-green-500/10 border-green-500/20',
    attention: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    concern: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">What We Measured</h2>
        <p className="text-sm text-muted-foreground">
          Observation {currentIndex + 1} of {observations.length}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5">
        {observations.map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              i === currentIndex ? "w-4 bg-primary" : i < currentIndex ? "bg-primary/50" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Observation card */}
      <Card className={cn("p-5 border-2", statusColors[obs.status])}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            statusColors[obs.status]
          )}>
            {obs.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{obs.title}</h3>
            <p className="text-2xl font-bold mt-1">{obs.yourValue}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Industry benchmark:</span>
            <span className="font-medium">{obs.benchmark}</span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {obs.explanation}
          </p>
        </div>
      </Card>

      {/* Navigation within observations */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="gap-1"
        >
          {isLast ? 'Continue' : 'Next'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Industry Benchmarks
function BenchmarksStep({ inputs, bioAge }: { inputs: ForensicInputs; bioAge: number }) {
  const averageLifespan = inputs.fuelType === 'GAS' ? 10 : 12;
  const lifespanProgress = Math.min((inputs.calendarAge / averageLifespan) * 100, 100);
  
  const agingFactors = [
    { 
      label: 'Water Pressure', 
      impact: inputs.housePsi > 80 ? 'high' : inputs.housePsi > 70 ? 'moderate' : 'low',
      detail: `${inputs.housePsi} PSI (target: <70 PSI)`
    },
    { 
      label: 'Water Hardness', 
      impact: inputs.hardnessGPG > 15 ? 'high' : inputs.hardnessGPG > 10 ? 'moderate' : 'low',
      detail: `${inputs.hardnessGPG} GPG`
    },
    { 
      label: 'Thermal Expansion', 
      impact: (inputs.isClosedLoop || inputs.hasPrv) && !inputs.hasExpTank ? 'high' : 'low',
      detail: inputs.hasExpTank ? 'Protected' : 'Not managed'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">How Does This Compare?</h2>
        <p className="text-sm text-muted-foreground">Industry context for your water heater</p>
      </div>

      {/* Lifespan comparison */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Industry Average Lifespan</span>
          <span className="text-sm font-medium">{averageLifespan}-{averageLifespan + 3} years</span>
        </div>
        
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full"
            style={{ width: '100%' }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-foreground rounded-sm border-2 border-background shadow-lg transition-all duration-500"
            style={{ left: `calc(${lifespanProgress}% - 6px)` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>0 years</span>
          <span className="font-medium text-foreground">Your unit: {inputs.calendarAge} years</span>
          <span>{averageLifespan + 3}+ years</span>
        </div>
      </Card>

      {/* Aging factors */}
      <Card className="p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Factors Affecting Your Unit</h3>
        <div className="space-y-3">
          {agingFactors.map((factor) => (
            <div key={factor.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  factor.impact === 'high' ? "bg-red-500" :
                  factor.impact === 'moderate' ? "bg-amber-500" : "bg-green-500"
                )} />
                <span className="text-sm">{factor.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{factor.detail}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Effective age */}
      <Card className="p-5 bg-muted/30">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium">Effective Age Estimate</p>
            <p className="text-xs text-muted-foreground">
              Based on stress factors, your {inputs.calendarAge}-year-old unit shows wear similar to a {Math.round(bioAge)}-year-old unit.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Step 4: Summary
function SummaryStep({ 
  score, 
  status,
  inputs,
  averageScore 
}: { 
  score: number; 
  status: 'critical' | 'warning' | 'optimal';
  inputs: ForensicInputs;
  averageScore: string;
}) {
  const statusConfig = {
    optimal: { label: 'Good Condition', color: 'text-green-500', bg: 'bg-green-500' },
    warning: { label: 'Needs Attention', color: 'text-amber-500', bg: 'bg-amber-500' },
    critical: { label: 'Action Recommended', color: 'text-red-500', bg: 'bg-red-500' },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Your Summary</h2>
        <p className="text-sm text-muted-foreground">Based on everything above</p>
      </div>

      {/* Score display */}
      <div className="flex justify-center py-6">
        <div className="relative">
          <div className={cn(
            "w-36 h-36 rounded-full border-8 flex items-center justify-center",
            status === 'critical' ? "border-red-500/30" :
            status === 'warning' ? "border-amber-500/30" : "border-green-500/30"
          )}>
            <div className="text-center">
              <span className={cn("text-5xl font-bold", config.color)}>{score}</span>
              <span className="block text-sm text-muted-foreground">/100</span>
            </div>
          </div>
          {/* Progress arc */}
          <svg className="absolute inset-0 w-36 h-36 -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="64"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={402}
              strokeDashoffset={402 - (score / 100) * 402}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                config.color
              )}
            />
          </svg>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex justify-center">
        <div className={cn(
          "px-4 py-2 rounded-full text-sm font-medium",
          status === 'critical' ? "bg-red-500/10 text-red-500" :
          status === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
        )}>
          {config.label}
        </div>
      </div>

      {/* Context */}
      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-center text-muted-foreground">
          Industry average for {inputs.calendarAge}-year-old units: <span className="font-medium text-foreground">{averageScore}</span>
        </p>
      </Card>

      {/* Disclaimer */}
      <p className="text-xs text-center text-muted-foreground/60 px-4">
        This assessment is based on industry data and the information provided. 
        Individual results may vary. Always consult a licensed professional for specific recommendations.
      </p>
    </div>
  );
}

export function DiscoveryFlow({ asset, inputs, onComplete }: DiscoveryFlowProps) {
  const [step, setStep] = useState(0);
  const [observationIndex, setObservationIndex] = useState(0);

  // Calculate metrics and verdict
  const result = calculateOpterraRisk(inputs);
  const metrics = result.metrics;
  const verdict = result.verdict;
  const healthScore = failProbToHealthScore(metrics.failProb);
  
  // Determine if we need to show urgent alert first
  const needsUrgentAlert = verdict.action === 'REPLACE' || inputs.isLeaking || inputs.visualRust;
  
  // Build observations list
  const observations: Observation[] = [];

  // Water pressure
  observations.push({
    id: 'pressure',
    icon: <Gauge className="w-6 h-6" />,
    title: 'Water Pressure',
    yourValue: `${inputs.housePsi} PSI`,
    benchmark: 'Below 70 PSI ideal, max 80 PSI',
    explanation: inputs.housePsi > 80 
      ? 'High pressure stresses tank components and can shorten equipment lifespan. A pressure reducing valve can help.'
      : inputs.housePsi > 70
      ? 'Slightly elevated but within typical range. Monitoring recommended.'
      : 'Your water pressure is within the optimal range for equipment longevity.',
    status: inputs.housePsi > 80 ? 'concern' : inputs.housePsi > 70 ? 'attention' : 'good',
  });

  // Expansion tank (if closed loop)
  if (inputs.isClosedLoop || inputs.hasPrv) {
    observations.push({
      id: 'expansion',
      icon: <Shield className="w-6 h-6" />,
      title: 'Thermal Expansion',
      yourValue: inputs.hasExpTank ? 'Protected' : 'Not Protected',
      benchmark: 'Expansion tank required for closed systems',
      explanation: inputs.hasExpTank
        ? 'Your expansion tank absorbs pressure spikes when water heats and expands.'
        : 'Without an expansion tank, pressure builds each heating cycle, stressing tank welds over time.',
      status: inputs.hasExpTank ? 'good' : 'concern',
    });
  }

  // Sediment
  observations.push({
    id: 'sediment',
    icon: <Droplets className="w-6 h-6" />,
    title: 'Estimated Sediment',
    yourValue: `${metrics.sedimentLbs.toFixed(1)} lbs`,
    benchmark: 'Flush recommended above 5 lbs',
    explanation: metrics.sedimentLbs <= 5
      ? 'Sediment levels appear manageable. Annual flushing helps maintain efficiency.'
      : 'Accumulated sediment can insulate heating elements and reduce efficiency.',
    status: metrics.sedimentLbs <= 5 ? 'good' : metrics.sedimentLbs <= 10 ? 'attention' : 'concern',
  });

  // Anode rod
  observations.push({
    id: 'anode',
    icon: <Zap className="w-6 h-6" />,
    title: 'Anode Rod Life',
    yourValue: metrics.shieldLife > 0 ? `~${metrics.shieldLife.toFixed(1)} years left` : 'Depleted',
    benchmark: 'Replace when depleted (every 4-6 years)',
    explanation: metrics.shieldLife > 1
      ? 'The anode rod is still providing corrosion protection for your tank.'
      : 'The sacrificial anode may be depleted. This rod protects your tank from rust.',
    status: metrics.shieldLife > 2 ? 'good' : metrics.shieldLife > 0 ? 'attention' : 'concern',
  });

  // Temperature
  if (inputs.tempSetting !== 'NORMAL') {
    observations.push({
      id: 'temp',
      icon: <Thermometer className="w-6 h-6" />,
      title: 'Temperature Setting',
      yourValue: inputs.tempSetting === 'HOT' ? 'Very Hot' : 'High',
      benchmark: '120°F recommended (Normal setting)',
      explanation: 'Higher temperatures accelerate mineral buildup and increase energy costs.',
      status: 'attention',
    });
  }

  // Total steps depends on whether we show urgent alert
  const totalSteps = needsUrgentAlert ? 5 : 4;
  
  // Map step indices based on whether urgent alert is shown
  const getStepContent = (currentStep: number) => {
    if (needsUrgentAlert) {
      // Steps: 0=Alert, 1=Profile, 2=Observations, 3=Benchmarks, 4=Summary
      return currentStep;
    } else {
      // Steps: 0=Profile, 1=Observations, 2=Benchmarks, 3=Summary (add 1 to skip alert)
      return currentStep + 1;
    }
  };
  
  const contentStep = getStepContent(step);
  const isObservationsStep = contentStep === 2;

  const handleNext = () => {
    if (isObservationsStep) {
      // In observations step
      if (observationIndex < observations.length - 1) {
        setObservationIndex(observationIndex + 1);
      } else {
        setStep(step + 1);
        setObservationIndex(0);
      }
    } else if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (isObservationsStep && observationIndex > 0) {
      setObservationIndex(observationIndex - 1);
    } else if (step > 0) {
      setStep(step - 1);
      if (contentStep === 3) {
        setObservationIndex(observations.length - 1);
      }
    }
  };

  // Calculate score for summary
  const averageScore = inputs.calendarAge <= 5 ? '75-85' : inputs.calendarAge <= 10 ? '60-75' : '45-60';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Step {step + 1} of {totalSteps}
          </span>
          <Button variant="ghost" size="sm" onClick={onComplete} className="text-xs">
            Skip to Dashboard
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto">
          <StepIndicator currentStep={step} totalSteps={totalSteps} />

          {/* Urgent Alert - Step 0 when needed */}
          {contentStep === 0 && needsUrgentAlert && (
            <UrgentAlertStep
              action={verdict.action}
              title={verdict.title}
              reason={verdict.reason}
              healthScore={healthScore}
              isLeaking={inputs.isLeaking}
              hasVisualRust={inputs.visualRust}
            />
          )}

          {/* Unit Profile - Step 1 */}
          {contentStep === 1 && <UnitProfileStep asset={asset} inputs={inputs} metrics={metrics} />}
          
          {/* Observations - Step 2 */}
          {contentStep === 2 && (
            <ObservationsStep
              observations={observations}
              currentIndex={observationIndex}
              onNext={handleNext}
              onPrev={handleBack}
              isLast={observationIndex === observations.length - 1}
            />
          )}
          
          {/* Benchmarks - Step 3 */}
          {contentStep === 3 && <BenchmarksStep inputs={inputs} bioAge={metrics.bioAge} />}
          
          {/* Summary - Step 4 */}
          {contentStep === 4 && (
            <SummaryStep 
              score={healthScore} 
              status={metrics.failProb > 50 ? 'critical' : metrics.failProb > 25 ? 'warning' : 'optimal'}
              inputs={inputs}
              averageScore={averageScore}
            />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="p-4 border-t border-border/50">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step > 0 && !isObservationsStep && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {!isObservationsStep && (
            <Button 
              onClick={handleNext} 
              className={cn(
                "flex-1 gap-2",
                contentStep === 0 && needsUrgentAlert && "bg-red-600 hover:bg-red-700"
              )}
            >
              {step === totalSteps - 1 
                ? 'View Full Dashboard' 
                : contentStep === 0 && needsUrgentAlert 
                ? 'See Full Assessment'
                : 'Continue'
              }
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
