import { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplets, Gauge, Shield, Thermometer, AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk, failProbToHealthScore } from '@/lib/opterraAlgorithm';

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

// Step 1: Unit Profile
function UnitProfileStep({ asset, inputs }: { asset: AssetData; inputs: ForensicInputs }) {
  const equipmentItems = [
    { label: 'Pressure Reducing Valve', present: inputs.hasPrv },
    { label: 'Expansion Tank', present: inputs.hasExpTank },
    { label: 'Water Softener', present: inputs.hasSoftener },
    { label: 'Recirculation Pump', present: inputs.hasCircPump },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Let's Look at Your Water Heater</h2>
        <p className="text-sm text-muted-foreground">Here's what we know about your unit</p>
      </div>

      {/* Professional Tank Visual */}
      <div className="flex justify-center py-4">
        <div className="relative">
          <svg 
            viewBox="0 0 160 240" 
            className="w-40 h-60 animate-fade-in"
            style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}
          >
            <defs>
              {/* Tank body gradient */}
              <linearGradient id="tankBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#374151" />
                <stop offset="20%" stopColor="#4b5563" />
                <stop offset="50%" stopColor="#6b7280" />
                <stop offset="80%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              
              {/* Tank jacket gradient */}
              <linearGradient id="jacketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="50%" stopColor="#374151" />
                <stop offset="100%" stopColor="#1f2937" />
              </linearGradient>
              
              {/* Top dome gradient */}
              <radialGradient id="domeGradient" cx="50%" cy="100%" r="100%">
                <stop offset="0%" stopColor="#6b7280" />
                <stop offset="70%" stopColor="#4b5563" />
                <stop offset="100%" stopColor="#374151" />
              </radialGradient>
              
              {/* Copper pipe gradient */}
              <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              
              {/* Water gradient */}
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
                <stop offset="100%" stopColor="rgba(59, 130, 246, 0.25)" />
              </linearGradient>
              
              {/* Glow filter */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Shadow ellipse */}
            <ellipse cx="80" cy="232" rx="45" ry="6" fill="rgba(0,0,0,0.3)" />

            {/* Tank stand/legs */}
            <rect x="35" y="200" width="90" height="10" rx="2" fill="#1f2937" />
            <rect x="42" y="210" width="16" height="12" rx="2" fill="#111827" />
            <rect x="102" y="210" width="16" height="12" rx="2" fill="#111827" />

            {/* Outer jacket */}
            <rect x="28" y="38" width="104" height="164" rx="4" fill="url(#jacketGradient)" stroke="#111827" strokeWidth="1" />

            {/* Tank top dome */}
            <ellipse cx="80" cy="40" rx="52" ry="14" fill="url(#domeGradient)" stroke="#374151" strokeWidth="1.5" />

            {/* Main tank body */}
            <rect x="32" y="40" width="96" height="160" fill="url(#tankBodyGradient)" />
            
            {/* Highlight edge for 3D effect */}
            <rect x="36" y="48" width="4" height="144" rx="2" fill="rgba(255,255,255,0.08)" />

            {/* Seam lines */}
            <line x1="32" y1="70" x2="128" y2="70" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
            <line x1="32" y1="170" x2="128" y2="170" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />

            {/* Rivets */}
            {[45, 65, 85, 105, 120].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy="70" r="2" fill="#4b5563" />
                <circle cx={x} cy="70" r="0.8" fill="#6b7280" />
                <circle cx={x} cy="170" r="2" fill="#4b5563" />
                <circle cx={x} cy="170" r="0.8" fill="#6b7280" />
              </g>
            ))}

            {/* Water inside tank */}
            <rect x="36" y="50" width="88" height="140" rx="2" fill="url(#waterGradient)" opacity="0.6" />

            {/* Copper pipes on top */}
            <rect x="50" y="18" width="12" height="16" rx="2" fill="url(#copperGradient)" />
            <ellipse cx="56" cy="18" rx="6" ry="2.5" fill="#d97706" />
            <rect x="98" y="18" width="12" height="16" rx="2" fill="url(#copperGradient)" />
            <ellipse cx="104" cy="18" rx="6" ry="2.5" fill="#d97706" />

            {/* Thermostat control box */}
            <rect x="130" y="100" width="16" height="32" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
            <circle cx="138" cy="112" r="4" fill="#111827" stroke="#4b5563" strokeWidth="0.5" />
            <line x1="138" y1="109" x2="138" y2="112" stroke="#ef4444" strokeWidth="1" />
            <circle cx="138" cy="124" r="2.5" fill="#22c55e" filter="url(#glow)" className="animate-pulse" />

            {/* Temperature/Pressure gauge */}
            <circle cx="80" cy="120" r="12" fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
            <circle cx="80" cy="120" r="8" fill="#111827" />
            <line x1="80" y1="120" x2="80" y2="114" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            
            {/* Brand label area */}
            <rect x="50" y="85" width="60" height="20" rx="2" fill="#111827" opacity="0.5" />
            <rect x="52" y="87" width="56" height="16" rx="1" fill="none" stroke="#4b5563" strokeWidth="0.5" />
          </svg>

          {/* Age badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-background border border-border rounded-full text-sm font-semibold shadow-lg">
            {inputs.calendarAge} years old
          </div>
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

  // Calculate metrics
  const result = calculateOpterraRisk(inputs);
  const metrics = result.metrics;
  
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

  const totalSteps = 4;

  const handleNext = () => {
    if (step === 1) {
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
    if (step === 1 && observationIndex > 0) {
      setObservationIndex(observationIndex - 1);
    } else if (step > 0) {
      setStep(step - 1);
      if (step === 2) {
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

          {step === 0 && <UnitProfileStep asset={asset} inputs={inputs} />}
          
          {step === 1 && (
            <ObservationsStep
              observations={observations}
              currentIndex={observationIndex}
              onNext={handleNext}
              onPrev={handleBack}
              isLast={observationIndex === observations.length - 1}
            />
          )}
          
          {step === 2 && <BenchmarksStep inputs={inputs} bioAge={metrics.bioAge} />}
          
          {step === 3 && (
            <SummaryStep 
              score={failProbToHealthScore(metrics.failProb)} 
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
          {step > 0 && step !== 1 && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          
          {step !== 1 && (
            <Button onClick={handleNext} className="flex-1 gap-2">
              {step === totalSteps - 1 ? 'View Full Dashboard' : 'Continue'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
