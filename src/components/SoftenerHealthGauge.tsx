import { useState } from 'react';
import { Activity, ChevronDown, Gauge, Droplets, Zap, AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SoftenerHealthGaugeProps {
  resinHealth: number;
  odometer: number;
  action: string;
  badge: string;
  reason: string;
  saltLevelPercent?: number;
  isCityWater?: boolean;
  hasCarbonFilter?: boolean;
}

interface StressFactorItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'optimal' | 'warning' | 'critical';
}

function StressFactorItem({ icon: Icon, label, value, status }: StressFactorItemProps) {
  // Accessibility: pair status with icon for colorblind users
  const StatusIcon = status === 'critical' ? XCircle : status === 'warning' ? AlertCircle : CheckCircle;
  
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <Icon className={cn(
          "w-3.5 h-3.5",
          status === 'critical' ? "text-red-400" : 
          status === 'warning' ? "text-amber-400" : 
          "text-muted-foreground"
        )} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <StatusIcon className={cn(
          "w-3 h-3",
          status === 'critical' ? "text-red-400" : 
          status === 'warning' ? "text-amber-400" : 
          "text-emerald-400"
        )} />
        <span className={cn(
          "text-xs font-mono font-medium",
          status === 'critical' ? "text-red-400" : 
          status === 'warning' ? "text-amber-400" : 
          "text-muted-foreground"
        )}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function SoftenerHealthGauge({
  resinHealth,
  odometer,
  action,
  badge,
  reason,
  saltLevelPercent = 75,
  isCityWater = true,
  hasCarbonFilter = false,
}: SoftenerHealthGaugeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate overall score (weighted average)
  const odometerScore = Math.max(0, 100 - (odometer / 15)); // 0 at 1500 cycles
  const overallScore = Math.round((resinHealth * 0.6) + (odometerScore * 0.4));

  // Determine status
  const getStatus = () => {
    if (overallScore >= 70) return 'optimal';
    if (overallScore >= 40) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  const getResinStatus = () => {
    if (resinHealth >= 75) return 'optimal';
    if (resinHealth >= 40) return 'warning';
    return 'critical';
  };

  const getOdometerStatus = () => {
    if (odometer < 600) return 'optimal';
    if (odometer < 1500) return 'warning';
    return 'critical';
  };

  const getSaltStatus = () => {
    if (saltLevelPercent >= 50) return 'optimal';
    if (saltLevelPercent >= 25) return 'warning';
    return 'critical';
  };

  // Intelligent status message
  const getIntelligentStatus = (): { message: string; severity: 'critical' | 'warning' | 'info' | 'good' } => {
    // Check for chlorine attack
    if (isCityWater && !hasCarbonFilter && resinHealth < 60) {
      return { message: 'Chlorine Killing Resin', severity: 'warning' };
    }

    // Critical conditions
    if (badge === 'RESIN_FAILURE' || badge === 'MECHANICAL_FAILURE') {
      return { message: 'Replace Unit', severity: 'critical' };
    }

    if (resinHealth < 25) {
      return { message: 'Resin Exhausted', severity: 'critical' };
    }

    if (odometer >= 1500) {
      return { message: 'Seals Worn Out', severity: 'critical' };
    }

    // Warning conditions
    if (saltLevelPercent < 25) {
      return { message: 'Salt Running Low', severity: 'warning' };
    }

    if (resinHealth < 50) {
      return { message: 'Resin Degrading', severity: 'warning' };
    }

    if (odometer >= 600) {
      return { message: 'Valve Service Due', severity: 'warning' };
    }

    if (badge === 'SEAL_WEAR' || badge === 'RESIN_DEGRADED') {
      return { message: 'Monitor Closely', severity: 'info' };
    }

    // Good conditions
    return { message: 'Running Strong', severity: 'good' };
  };

  const intelligentStatus = getIntelligentStatus();

  const getRingColor = () => {
    if (status === 'critical') return 'hsl(0 55% 48%)';
    if (status === 'warning') return 'hsl(32 65% 48%)';
    return 'hsl(158 45% 42%)';
  };

  const getStatusColor = () => {
    if (status === 'critical') return 'text-red-400';
    if (status === 'warning') return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "command-card overflow-hidden",
        status === 'critical' && "border-red-500/40",
        status === 'warning' && "border-amber-500/40"
      )}>
        {/* Status gradient bar at top */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          status === 'critical' && "bg-gradient-to-r from-red-500/60 via-red-400/80 to-red-500/60",
          status === 'warning' && "bg-gradient-to-r from-amber-500/60 via-amber-400/80 to-amber-500/60",
          status === 'optimal' && "bg-gradient-to-r from-emerald-500/60 via-emerald-400/80 to-emerald-500/60"
        )} />
        
        <CollapsibleTrigger className="w-full p-3 text-left">
          {/* Header with Score */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center",
                status === 'critical' && "bg-gradient-to-br from-red-500/25 to-red-600/15 border border-red-500/30",
                status === 'warning' && "bg-gradient-to-br from-amber-500/25 to-amber-600/15 border border-amber-500/30",
                status === 'optimal' && "bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 border border-emerald-500/30"
              )}>
                <Activity className={cn(
                  "w-3.5 h-3.5",
                  status === 'critical' && "text-red-400",
                  status === 'warning' && "text-amber-400",
                  status === 'optimal' && "text-emerald-400"
                )} />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                System Health
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-lg font-bold font-data", getStatusColor())}>
                  {overallScore}
                </span>
                <span className="text-[8px] text-muted-foreground">/100</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </div>

          {/* Health Bar */}
          <div className="relative h-3.5 rounded-full bg-secondary/60 overflow-hidden mb-2">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-px h-full bg-background/30" style={{ left: `${i * 5}%` }} />
              ))}
            </div>
            
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                status === 'critical' && "bg-gradient-to-r from-red-600 via-red-500 to-red-400",
                status === 'warning' && "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400",
                status === 'optimal' && "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
              )}
              style={{ 
                width: `${overallScore}%`,
                boxShadow: `0 0 16px ${getRingColor()}50, inset 0 1px 0 rgba(255,255,255,0.2)`
              }}
            />
          </div>

          {/* Status Label */}
          <div className={cn(
            "text-[10px] font-bold uppercase tracking-wider text-center px-3 py-1 rounded-full w-fit mx-auto",
            intelligentStatus.severity === 'critical' ? "bg-red-500/15 text-red-400 border border-red-500/20" :
            intelligentStatus.severity === 'warning' ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
            intelligentStatus.severity === 'info' ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
            "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
          )}>
            {intelligentStatus.message}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/30">
            {/* Component Status Breakdown */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Component Status
                </span>
              </div>
              <div className="bg-secondary/20 rounded-lg p-2 space-y-0.5">
                <StressFactorItem 
                  icon={Droplets} 
                  label="Resin Bed Health" 
                  value={`${resinHealth}%`}
                  status={getResinStatus()}
                />
                <StressFactorItem 
                  icon={Gauge} 
                  label="Valve Odometer" 
                  value={`${odometer.toLocaleString()} cycles`}
                  status={getOdometerStatus()}
                />
                <StressFactorItem 
                  icon={Zap} 
                  label="Salt Level" 
                  value={`${saltLevelPercent}%`}
                  status={getSaltStatus()}
                />
                
                {/* Chlorine exposure warning */}
                {isCityWater && !hasCarbonFilter && (
                  <div className="flex items-center justify-between py-1.5 border-t border-border/20 mt-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-xs text-muted-foreground">Chlorine Exposure</span>
                    </div>
                    <span className="text-xs font-mono text-red-400">
                      UNPROTECTED
                    </span>
                  </div>
                )}
                
                {hasCarbonFilter && (
                  <div className="flex items-center justify-between py-1.5 border-t border-border/20 mt-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-muted-foreground">Chlorine Protection</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      ACTIVE
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendation */}
            {reason && (
              <div className="bg-secondary/20 rounded-lg p-2">
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Assessment
                </div>
                <p className="text-xs text-foreground">{reason}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
