import { useState } from 'react';
import { ChevronRight, Droplets, Gauge, Shield, Thermometer, AlertTriangle, Zap, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type AssetData } from '@/data/mockAsset';
import { type ForensicInputs, calculateOpterraRisk, failProbToHealthScore, type OpterraMetrics } from '@/lib/opterraAlgorithm';
import { SafetyReplacementAlert } from './SafetyReplacementAlert';
import containmentBreachImage from '@/assets/containment-breach.png';

interface DiscoveryFlowProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onComplete: () => void;
}

interface Issue {
  id: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  explanation: string;
  severity: 'attention' | 'concern';
}

// Helper function to convert algorithm stress factors to the format expected by SafetyReplacementAlert
function convertStressFactors(metrics: OpterraMetrics): { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] {
  const factors: { name: string; level: 'low' | 'moderate' | 'elevated' | 'critical'; value: number; description: string }[] = [];
  
  const getLevel = (value: number): 'low' | 'moderate' | 'elevated' | 'critical' => {
    if (value >= 2.0) return 'critical';
    if (value >= 1.5) return 'elevated';
    if (value >= 1.2) return 'moderate';
    return 'low';
  };

  if (metrics.stressFactors.pressure > 1.0) {
    factors.push({
      name: 'Water Pressure',
      level: getLevel(metrics.stressFactors.pressure),
      value: metrics.stressFactors.pressure,
      description: `Pressure stress factor of ${metrics.stressFactors.pressure.toFixed(2)}x`
    });
  }

  if (metrics.stressFactors.sediment > 1.0) {
    factors.push({
      name: 'Sediment Buildup',
      level: metrics.sedimentLbs > 15 ? 'critical' : metrics.sedimentLbs > 8 ? 'elevated' : 'moderate',
      value: metrics.stressFactors.sediment,
      description: `${metrics.sedimentLbs.toFixed(1)} lbs of sediment accumulated`
    });
  }

  if (metrics.stressFactors.temp > 1.0) {
    factors.push({
      name: 'Temperature Stress',
      level: getLevel(metrics.stressFactors.temp),
      value: metrics.stressFactors.temp,
      description: `Temperature stress factor of ${metrics.stressFactors.temp.toFixed(2)}x`
    });
  }

  if (metrics.stressFactors.loop > 1.0) {
    factors.push({
      name: 'Thermal Expansion (Closed Loop)',
      level: getLevel(metrics.stressFactors.loop),
      value: metrics.stressFactors.loop,
      description: 'Missing expansion tank causes pressure spikes'
    });
  }

  if (metrics.stressFactors.circ > 1.0) {
    factors.push({
      name: 'Recirculation Loop',
      level: getLevel(metrics.stressFactors.circ),
      value: metrics.stressFactors.circ,
      description: 'Continuous circulation increases wear'
    });
  }

  if (metrics.shieldLife <= 0) {
    factors.push({
      name: 'Anode Depletion',
      level: 'critical',
      value: 0,
      description: 'Sacrificial anode is fully depleted'
    });
  } else if (metrics.shieldLife < 2) {
    factors.push({
      name: 'Anode Depletion',
      level: 'elevated',
      value: metrics.shieldLife,
      description: `Only ${metrics.shieldLife.toFixed(1)} years of protection remaining`
    });
  }

  return factors;
}

// Critical Alert Screen - Only shown when replacement is needed
function CriticalAlertScreen({ 
  reason, 
  isLeaking,
  hasVisualRust,
  metrics,
  inputs
}: { 
  reason: string;
  isLeaking?: boolean;
  hasVisualRust?: boolean;
  metrics: OpterraMetrics;
  inputs: ForensicInputs;
}) {
  const stressFactors = convertStressFactors(metrics);
  
  return (
    <div className="space-y-4">
      {/* Containment Breach Image for leaks */}
      {isLeaking && (
        <div className="relative rounded-xl overflow-hidden border-2 border-red-500/50 mb-2">
          <img 
            src={containmentBreachImage} 
            alt="Water heater leak damage" 
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      )}

      <SafetyReplacementAlert
        reason={reason}
        location={inputs.location}
        stressFactors={stressFactors}
        agingRate={metrics.stressFactors.total}
        bioAge={metrics.bioAge}
        chronoAge={inputs.calendarAge}
        breachDetected={isLeaking || hasVisualRust}
      />
    </div>
  );
}

// Key Issues Screen - Shows only non-good observations as a list
function KeyIssuesScreen({ issues }: { issues: Issue[] }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">What Needs Attention</h2>
        <p className="text-sm text-muted-foreground">
          {issues.length} item{issues.length !== 1 ? 's' : ''} to address
        </p>
      </div>

      <div className="space-y-3">
        {issues.map((issue) => (
          <Card 
            key={issue.id}
            className={cn(
              "p-4 border-l-4",
              issue.severity === 'concern' 
                ? "border-l-red-500 bg-red-500/5" 
                : "border-l-amber-500 bg-amber-500/5"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                issue.severity === 'concern' ? "bg-red-500/10" : "bg-amber-500/10"
              )}>
                <div className={issue.severity === 'concern' ? "text-red-500" : "text-amber-500"}>
                  {issue.icon}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-foreground">{issue.title}</h3>
                  <span className={cn(
                    "text-sm font-semibold",
                    issue.severity === 'concern' ? "text-red-500" : "text-amber-500"
                  )}>
                    {issue.value}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue.explanation}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Health Summary Screen
function HealthSummaryScreen({ 
  score, 
  status,
  hasIssues
}: { 
  score: number; 
  status: 'critical' | 'warning' | 'optimal';
  hasIssues: boolean;
}) {
  const statusConfig = {
    optimal: { label: 'Looking Good', color: 'text-green-500', bg: 'bg-green-500', icon: CheckCircle2 },
    warning: { label: 'Needs Attention', color: 'text-amber-500', bg: 'bg-amber-500', icon: AlertTriangle },
    critical: { label: 'Action Needed', color: 'text-red-500', bg: 'bg-red-500', icon: AlertOctagon },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          {status === 'optimal' && !hasIssues ? "You're All Set" : "Your Assessment"}
        </h2>
      </div>

      {/* Score display */}
      <div className="flex justify-center py-4">
        <div className="relative">
          <div className={cn(
            "w-32 h-32 rounded-full border-8 flex items-center justify-center",
            status === 'critical' ? "border-red-500/30" :
            status === 'warning' ? "border-amber-500/30" : "border-green-500/30"
          )}>
            <div className="text-center">
              <span className={cn("text-4xl font-bold", config.color)}>{score}</span>
              <span className="block text-xs text-muted-foreground">health score</span>
            </div>
          </div>
          {/* Progress arc */}
          <svg className="absolute inset-0 w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={352}
              strokeDashoffset={352 - (score / 100) * 352}
              strokeLinecap="round"
              className={cn("transition-all duration-1000", config.color)}
            />
          </svg>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex justify-center">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
          status === 'critical' ? "bg-red-500/10 text-red-500" :
          status === 'warning' ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
        )}>
          <Icon className="w-4 h-4" />
          {config.label}
        </div>
      </div>

      {/* Quick message */}
      <Card className="p-4 bg-muted/30">
        <p className="text-sm text-center text-muted-foreground">
          {status === 'optimal' && !hasIssues
            ? "Your water heater is performing well. We'll help you keep it that way."
            : status === 'optimal'
            ? "Minor items to address, but overall your system is healthy."
            : status === 'warning'
            ? "Some maintenance items need attention. View your dashboard for recommendations."
            : "We've identified issues that need prompt attention. Let's review your options."
          }
        </p>
      </Card>
    </div>
  );
}

export function DiscoveryFlow({ asset, inputs, onComplete }: DiscoveryFlowProps) {
  const [step, setStep] = useState(0);

  // Calculate metrics and verdict
  const result = calculateOpterraRisk(inputs);
  const metrics = result.metrics;
  const verdict = result.verdict;
  const healthScore = failProbToHealthScore(metrics.failProb);
  
  // Determine status
  const status = metrics.failProb > 50 ? 'critical' : metrics.failProb > 25 ? 'warning' : 'optimal';
  
  // Is this a critical case that needs immediate replacement?
  const isCritical = verdict.action === 'REPLACE' || inputs.isLeaking || inputs.visualRust;
  
  // Build issues list - only items that need attention
  const issues: Issue[] = [];

  if (inputs.isLeaking) {
    issues.push({
      id: 'breach',
      icon: <AlertOctagon className="w-5 h-5" />,
      title: 'Active Leak',
      value: 'Urgent',
      explanation: 'Water around your heater indicates tank failure. Requires immediate inspection.',
      severity: 'concern',
    });
  }

  if (inputs.visualRust) {
    issues.push({
      id: 'rust',
      icon: <AlertOctagon className="w-5 h-5" />,
      title: 'Visible Corrosion',
      value: 'Critical',
      explanation: 'External rust often indicates internal corrosion that can lead to leaks.',
      severity: 'concern',
    });
  }

  if (inputs.housePsi > 80) {
    issues.push({
      id: 'pressure',
      icon: <Gauge className="w-5 h-5" />,
      title: 'High Pressure',
      value: `${inputs.housePsi} PSI`,
      explanation: 'Pressure above 80 PSI stresses tank components. A pressure reducing valve can help.',
      severity: 'concern',
    });
  } else if (inputs.housePsi > 70) {
    issues.push({
      id: 'pressure',
      icon: <Gauge className="w-5 h-5" />,
      title: 'Elevated Pressure',
      value: `${inputs.housePsi} PSI`,
      explanation: 'Slightly elevated. Monitoring recommended, target under 70 PSI.',
      severity: 'attention',
    });
  }

  if ((inputs.isClosedLoop || inputs.hasPrv) && !inputs.hasExpTank) {
    issues.push({
      id: 'expansion',
      icon: <Shield className="w-5 h-5" />,
      title: 'No Expansion Tank',
      value: 'At Risk',
      explanation: 'Closed systems need an expansion tank to absorb pressure spikes during heating.',
      severity: 'concern',
    });
  }

  if (metrics.sedimentLbs > 10) {
    issues.push({
      id: 'sediment',
      icon: <Droplets className="w-5 h-5" />,
      title: 'Heavy Sediment',
      value: `${metrics.sedimentLbs.toFixed(0)} lbs`,
      explanation: 'Significant buildup reduces efficiency. Flushing recommended.',
      severity: 'concern',
    });
  } else if (metrics.sedimentLbs > 5) {
    issues.push({
      id: 'sediment',
      icon: <Droplets className="w-5 h-5" />,
      title: 'Sediment Buildup',
      value: `${metrics.sedimentLbs.toFixed(0)} lbs`,
      explanation: 'Moderate accumulation. Consider flushing to maintain efficiency.',
      severity: 'attention',
    });
  }

  if (metrics.shieldLife <= 0) {
    issues.push({
      id: 'anode',
      icon: <Zap className="w-5 h-5" />,
      title: 'Anode Depleted',
      value: 'Replace',
      explanation: 'The sacrificial anode is exhausted. Tank is unprotected from corrosion.',
      severity: 'concern',
    });
  } else if (metrics.shieldLife < 2) {
    issues.push({
      id: 'anode',
      icon: <Zap className="w-5 h-5" />,
      title: 'Low Anode Life',
      value: `~${metrics.shieldLife.toFixed(0)}yr left`,
      explanation: 'Anode rod protection is running low. Plan for replacement soon.',
      severity: 'attention',
    });
  }

  if (inputs.tempSetting !== 'NORMAL' && inputs.tempSetting !== 'LOW') {
    issues.push({
      id: 'temp',
      icon: <Thermometer className="w-5 h-5" />,
      title: 'High Temperature',
      value: 'Elevated',
      explanation: 'Higher settings accelerate mineral buildup and energy costs.',
      severity: 'attention',
    });
  }

  const hasIssues = issues.length > 0;
  
  // Determine flow:
  // - Critical: Alert → Issues (if any beyond critical) → Summary
  // - Has issues: Issues → Summary  
  // - Healthy: Summary only
  
  let totalSteps: number;
  if (isCritical) {
    totalSteps = hasIssues ? 3 : 2; // Alert, Issues (optional), Summary
  } else if (hasIssues) {
    totalSteps = 2; // Issues, Summary
  } else {
    totalSteps = 1; // Just Summary
  }

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  // Determine what to show at current step
  const renderCurrentStep = () => {
    if (isCritical) {
      // Critical flow
      if (step === 0) {
        return (
          <CriticalAlertScreen
            reason={verdict.reason}
            isLeaking={inputs.isLeaking}
            hasVisualRust={inputs.visualRust}
            metrics={metrics}
            inputs={inputs}
          />
        );
      } else if (step === 1 && hasIssues) {
        // Filter out the critical issues already shown in alert
        const additionalIssues = issues.filter(i => i.id !== 'breach' && i.id !== 'rust');
        if (additionalIssues.length > 0) {
          return <KeyIssuesScreen issues={additionalIssues} />;
        }
        return <HealthSummaryScreen score={healthScore} status={status} hasIssues={hasIssues} />;
      } else {
        return <HealthSummaryScreen score={healthScore} status={status} hasIssues={hasIssues} />;
      }
    } else if (hasIssues) {
      // Issues flow
      if (step === 0) {
        return <KeyIssuesScreen issues={issues} />;
      } else {
        return <HealthSummaryScreen score={healthScore} status={status} hasIssues={hasIssues} />;
      }
    } else {
      // Healthy flow - just summary
      return <HealthSummaryScreen score={healthScore} status={status} hasIssues={hasIssues} />;
    }
  };

  const getButtonText = () => {
    if (step === totalSteps - 1) {
      return 'View Dashboard';
    }
    if (isCritical && step === 0) {
      return 'See Full Assessment';
    }
    return 'Continue';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            {totalSteps > 1 ? `Step ${step + 1} of ${totalSteps}` : 'Assessment Complete'}
          </span>
          <Button variant="ghost" size="sm" onClick={onComplete} className="text-xs">
            Skip to Dashboard
          </Button>
        </div>
      </div>

      {/* Step indicator */}
      {totalSteps > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === step ? "w-8 bg-primary" : i < step ? "bg-primary/60" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-md mx-auto">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="p-4 border-t border-border/50">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={handleNext} 
            className={cn(
              "w-full gap-2",
              isCritical && step === 0 && "bg-red-600 hover:bg-red-700"
            )}
          >
            {getButtonText()}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
