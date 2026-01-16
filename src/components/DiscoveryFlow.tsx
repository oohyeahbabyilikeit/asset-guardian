import { ChevronRight, Droplets, Gauge, Shield, Thermometer, Zap, AlertOctagon, CheckCircle2, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type ForensicInputs, calculateOpterraRisk, isTankless } from '@/lib/opterraAlgorithm';

interface DiscoveryFlowProps {
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

export function DiscoveryFlow({ inputs, onComplete }: DiscoveryFlowProps) {
  // Calculate metrics and verdict
  const result = calculateOpterraRisk(inputs);
  const metrics = result.metrics;
  const verdict = result.verdict;
  
  // Is this a critical case that needs immediate replacement?
  const isCritical = verdict.action === 'REPLACE' || inputs.isLeaking || inputs.visualRust;
  
  // Build issues list - only items that need attention
  const issues: Issue[] = [];

  // Add replacement recommendation at top if critical
  if (verdict.action === 'REPLACE') {
    issues.push({
      id: 'replacement',
      icon: <AlertOctagon className="w-5 h-5" />,
      title: 'Replacement Recommended',
      value: 'Critical',
      explanation: verdict.reason,
      severity: 'concern',
    });
  }

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

  // Tankless: use scaleBuildupScore (%) | Tank: use sedimentLbs
  const isTanklessUnit = isTankless(inputs.fuelType);
  const scalePercent = metrics.scaleBuildupScore ?? 0;
  
  if (isTanklessUnit) {
    // Tankless: Show scale buildup as percentage
    if (scalePercent > 25) {
      issues.push({
        id: 'scale',
        icon: <Flame className="w-5 h-5" />,
        title: 'Heavy Scale Buildup',
        value: `${scalePercent.toFixed(0)}%`,
        explanation: 'Significant scale in heat exchanger reduces efficiency. Descaling recommended.',
        severity: 'concern',
      });
    } else if (scalePercent > 10) {
      issues.push({
        id: 'scale',
        icon: <Flame className="w-5 h-5" />,
        title: 'Scale Buildup',
        value: `${scalePercent.toFixed(0)}%`,
        explanation: 'Moderate scale accumulation. Consider descaling to maintain efficiency.',
        severity: 'attention',
      });
    }
  } else {
    // Tank: Show sediment in pounds
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

  // Single screen - show issues, then go to dashboard
  const renderContent = () => {
    if (hasIssues) {
      return <KeyIssuesScreen issues={issues} />;
    }
    
    // No issues - show quick success message
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Looking Good!</h2>
          <p className="text-sm text-muted-foreground">
            No immediate issues found. We'll help you keep it that way.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Assessment Complete
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {renderContent()}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="p-4 border-t border-border/50">
        <div className="max-w-md mx-auto">
          <Button 
            onClick={onComplete} 
            className={cn(
              "w-full gap-2",
              isCritical && "bg-red-600 hover:bg-red-700"
            )}
          >
            View Dashboard
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
