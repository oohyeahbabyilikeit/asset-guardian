import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Shield, AlertTriangle, XCircle, CheckCircle, Cpu, Wind, Droplets, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeatPumpHealthGaugeProps {
  overallScore: number;
  compressorHealth: number;
  filterCondition: 'clean' | 'dirty' | 'clogged';
  condensateClear: boolean;
  ambientTemp: number;
  action: string;
  badge: string;
  reason: string;
}

interface StressFactorItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'optimal' | 'warning' | 'critical';
}

function StressFactorItem({ icon: Icon, label, value, status }: StressFactorItemProps) {
  const statusConfig = {
    optimal: { color: 'text-status-optimal', bg: 'bg-status-optimal/10', icon: CheckCircle },
    warning: { color: 'text-status-warning', bg: 'bg-status-warning/10', icon: AlertTriangle },
    critical: { color: 'text-status-critical', bg: 'bg-status-critical/10', icon: XCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", config.bg)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-sm font-medium", config.color)}>{value}</span>
        <StatusIcon className={cn("w-4 h-4", config.color)} />
      </div>
    </div>
  );
}

export function HeatPumpHealthGauge({
  overallScore,
  compressorHealth,
  filterCondition,
  condensateClear,
  ambientTemp,
  action,
  badge,
  reason,
}: HeatPumpHealthGaugeProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine overall status
  const getStatus = (): 'optimal' | 'warning' | 'critical' => {
    if (overallScore >= 70) return 'optimal';
    if (overallScore >= 40) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  const statusConfig = {
    optimal: {
      label: 'Healthy',
      color: 'text-status-optimal',
      bg: 'bg-status-optimal',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
      message: 'Your heat pump is operating efficiently.',
    },
    warning: {
      label: 'Needs Attention',
      color: 'text-status-warning',
      bg: 'bg-status-warning',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]',
      message: 'Some components need maintenance soon.',
    },
    critical: {
      label: 'Service Required',
      color: 'text-status-critical',
      bg: 'bg-status-critical',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
      message: 'Immediate attention recommended.',
    },
  };

  const config = statusConfig[status];

  // Calculate component statuses
  const getCompressorStatus = (): 'optimal' | 'warning' | 'critical' => {
    if (compressorHealth >= 80) return 'optimal';
    if (compressorHealth >= 50) return 'warning';
    return 'critical';
  };

  const getFilterStatus = (): 'optimal' | 'warning' | 'critical' => {
    switch (filterCondition) {
      case 'clean': return 'optimal';
      case 'dirty': return 'warning';
      case 'clogged': return 'critical';
    }
  };

  const getAmbientStatus = (): 'optimal' | 'warning' | 'critical' => {
    if (ambientTemp >= 40 && ambientTemp <= 90) return 'optimal';
    if (ambientTemp >= 35 || ambientTemp <= 95) return 'warning';
    return 'critical';
  };

  return (
    <Card className={cn("overflow-hidden border-border/50", config.glow)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="p-4">
            {/* Health bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className={cn("w-5 h-5", config.color)} />
                <span className="font-semibold text-foreground">System Health</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-2xl font-bold", config.color)}>{overallScore}</span>
                <span className="text-muted-foreground text-sm">/100</span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", config.bg)}
                style={{ width: `${overallScore}%` }}
              />
            </div>

            {/* Status label */}
            <div className="flex items-center justify-between mt-3">
              <span className={cn("text-sm font-medium", config.color)}>{config.label}</span>
              <span className="text-xs text-muted-foreground">{config.message}</span>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Divider */}
            <div className="h-px bg-border/50" />

            {/* Component breakdown */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Component Status
              </h4>
              <div className="bg-muted/30 rounded-lg p-3">
                <StressFactorItem
                  icon={Cpu}
                  label="Compressor Unit"
                  value={`${compressorHealth}%`}
                  status={getCompressorStatus()}
                />
                <StressFactorItem
                  icon={Wind}
                  label="Air Filter"
                  value={filterCondition.charAt(0).toUpperCase() + filterCondition.slice(1)}
                  status={getFilterStatus()}
                />
                <StressFactorItem
                  icon={Droplets}
                  label="Condensate Drain"
                  value={condensateClear ? 'Clear' : 'Blocked'}
                  status={condensateClear ? 'optimal' : 'critical'}
                />
                <StressFactorItem
                  icon={Thermometer}
                  label="Ambient Temperature"
                  value={`${ambientTemp}°F`}
                  status={getAmbientStatus()}
                />
              </div>
            </div>

            {/* Assessment */}
            {reason && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Assessment
                </h4>
                <p className="text-sm text-foreground/80 bg-muted/30 rounded-lg p-3">
                  {reason}
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
