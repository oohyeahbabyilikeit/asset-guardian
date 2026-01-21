import { Activity, ShieldAlert, CheckCircle2, Clock, Gauge, Container, Info, Users, Droplets, AlertTriangle, Wrench, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type VitalsData } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel, type FuelType, isTankless } from '@/lib/opterraAlgorithm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VitalsGridProps {
  vitals: VitalsData;
  fuelType?: FuelType;
  // Tankless-specific props (v8.0 aligned)
  scaleBuildupScore?: number;
  descaleStatus?: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible' | 'run_to_failure';
  hasIsolationValves?: boolean;
  errorCodeCount?: number;
  // NEW: Algorithm outputs for tankless
  healthScore?: number;
  primaryStressor?: string;
  riskLevel?: RiskLevel;
}

interface ActionItemProps {
  icon: React.ReactNode;
  iconBgClass: string;
  title: string;
  subtitle: string;
  subtitleClass: string;
  isPassed?: boolean;
  status?: 'critical' | 'warning' | 'optimal';
  tooltip?: string | null;
}

function ActionItem({ icon, iconBgClass, title, subtitle, subtitleClass, isPassed, status, tooltip }: ActionItemProps) {
  return (
    <div 
      className={cn(
        "action-item py-2.5 px-3",
        status === 'critical' && "action-item-critical",
        status === 'warning' && "action-item-warning",
        isPassed && "action-item-optimal"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border", iconBgClass)}>
          {icon}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{title}</span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={cn("text-xs font-medium", subtitleClass)}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export function VitalsGrid({ 
  vitals, 
  fuelType = 'GAS',
  scaleBuildupScore = 0,
  descaleStatus = 'optimal',
  hasIsolationValves = true,
  errorCodeCount = 0,
  // NEW: Algorithm outputs
  healthScore = 100,
  primaryStressor = 'Normal Wear',
  riskLevel = 1 as RiskLevel, // 1 = LOW (contained)
}: VitalsGridProps) {
  const isTanklessUnit = isTankless(fuelType);
  
  const getStatusIcon = (status: 'critical' | 'warning' | 'optimal') => {
    if (status === 'critical') return <Activity className="w-5 h-5" />;
    if (status === 'warning') return <ShieldAlert className="w-5 h-5" />;
    return <CheckCircle2 className="w-5 h-5" />;
  };

  const getIconBgClass = (status: 'critical' | 'warning' | 'optimal') => {
    if (status === 'critical') return 'status-icon-critical';
    if (status === 'warning') return 'status-icon-warning';
    return 'status-icon-optimal';
  };

  const getSubtitleClass = (status: 'critical' | 'warning' | 'optimal') => {
    if (status === 'critical') return 'text-red-400';
    if (status === 'warning') return 'text-amber-400';
    return 'text-green-400';
  };

  // Format risk level for display (v5.2)
  const formatRiskLevel = (level: RiskLevel) => {
    const info = getRiskLevelInfo(level);
    return `${info.label} RISK`;
  };

  // === TANKLESS-SPECIFIC VITALS (v8.0 Safe Mode) ===
  if (isTanklessUnit) {
    // Health score status (primary metric from algorithm)
    const healthStatus: 'critical' | 'warning' | 'optimal' = 
      healthScore < 40 ? 'critical' : 
      healthScore < 70 ? 'warning' : 'optimal';
    
    // Scale buildup status
    const scaleStatus: 'critical' | 'warning' | 'optimal' = 
      scaleBuildupScore > 35 ? 'critical' : 
      scaleBuildupScore > 15 ? 'warning' : 'optimal';
    
    // Descale status mapping
    const descaleStatusMapping: Record<string, 'critical' | 'warning' | 'optimal'> = {
      'impossible': 'critical',
      'lockout': 'critical',
      'run_to_failure': 'critical',
      'critical': 'critical',
      'due': 'warning',
      'optimal': 'optimal'
    };
    const descaleVitalStatus = descaleStatusMapping[descaleStatus] || 'optimal';
    
    // Isolation valves status
    const valveStatus: 'critical' | 'warning' | 'optimal' = 
      !hasIsolationValves ? 'critical' : 'optimal';
    
    // Error code status
    const errorStatus: 'critical' | 'warning' | 'optimal' = 
      errorCodeCount > 5 ? 'critical' : 
      errorCodeCount > 0 ? 'warning' : 'optimal';
    
    // Location risk status (1=LOW, 2=MOD, 3=HIGH, 4=EXTREME)
    const locationRiskStatus: 'critical' | 'warning' | 'optimal' = 
      riskLevel >= 3 ? 'critical' :
      riskLevel >= 2 ? 'warning' : 'optimal';

    const tanklessItems = [
      // System Health (primary - from algorithm)
      {
        status: healthStatus,
        icon: <Heart className="w-5 h-5" />,
        title: healthStatus === 'critical' ? 'System Critical' :
               healthStatus === 'warning' ? 'System Stressed' : 'System Healthy',
        subtitle: healthStatus === 'critical' ? `Poor condition • ${primaryStressor}` : healthStatus === 'warning' ? `Fair condition • ${primaryStressor}` : `Good condition`,
        tooltip: healthStatus !== 'optimal' 
          ? `Primary issue: ${primaryStressor}. Address to improve system health.`
          : 'Unit is operating within normal parameters.',
      },
      // Scale Buildup (heat exchanger)
      {
        status: scaleStatus,
        icon: <Droplets className="w-5 h-5" />,
        title: scaleStatus === 'optimal' ? 'Heat Exchanger Clear' : 'Scale Buildup',
        subtitle: scaleStatus === 'optimal' ? 'Minimal buildup' : scaleStatus === 'critical' ? 'Severe blockage' : 'Moderate buildup',
        tooltip: scaleStatus !== 'optimal' 
          ? 'Scale insulates the heat exchanger, reducing efficiency and causing overheating.'
          : 'Heat exchanger efficiency is good.',
      },
      // Descale Status
      {
        status: descaleVitalStatus,
        icon: <Wrench className="w-5 h-5" />,
        title: descaleStatus === 'optimal' ? 'Descale Not Needed' :
               descaleStatus === 'due' ? 'Descale Due' :
               descaleStatus === 'critical' ? 'Descale Critical' :
               descaleStatus === 'lockout' ? 'Descale Risky' : 
               descaleStatus === 'run_to_failure' ? 'Run to Failure' : 'Descale Impossible',
        subtitle: descaleStatus === 'optimal' ? 'Heat exchanger clean' :
                  descaleStatus === 'due' ? 'Schedule maintenance flush' :
                  descaleStatus === 'critical' ? 'Immediate service needed' :
                  descaleStatus === 'lockout' ? 'Risk of damage if flushed' : 
                  descaleStatus === 'run_to_failure' ? 'Scale too severe to service' : 'No isolation valves',
        tooltip: descaleStatus === 'lockout' || descaleStatus === 'run_to_failure'
          ? 'Scale buildup is too severe. Acid flush may cause pinhole leaks.'
          : descaleStatus === 'impossible'
          ? 'Without isolation valves, the unit cannot be serviced.'
          : null,
      },
      // Isolation Valves (serviceability)
      {
        status: valveStatus,
        icon: <Container className="w-5 h-5" />,
        title: hasIsolationValves ? 'Isolation Valves' : 'No Isolation Valves',
        subtitle: hasIsolationValves ? 'Serviceable' : 'Cannot be descaled',
        tooltip: !hasIsolationValves 
          ? 'Isolation valves are required to flush the heat exchanger. Install valves to enable maintenance.'
          : null,
      },
      // Error Codes (only show if present)
      ...(errorCodeCount > 0 ? [{
        status: errorStatus,
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Error Codes',
        subtitle: `${errorCodeCount} recent error${errorCodeCount > 1 ? 's' : ''} logged`,
        tooltip: 'Error codes indicate system issues requiring diagnostics.',
      }] : []),
      // Location Risk (from algorithm)
      {
        status: locationRiskStatus,
        icon: <ShieldAlert className="w-5 h-5" />,
        title: locationRiskStatus === 'optimal' 
          ? 'Contained Location' 
          : locationRiskStatus === 'warning'
          ? 'Recoverable Location'
          : 'High-Risk Location',
        subtitle: locationRiskStatus === 'optimal'
          ? 'Leak damage would be minimal'
          : formatRiskLevel(riskLevel),
        tooltip: locationRiskStatus !== 'optimal'
          ? 'Unit location increases potential damage costs if a leak occurs.'
          : null,
      },
    ];

    const issues = tanklessItems.filter(item => item.status !== 'optimal');
    const passed = tanklessItems.filter(item => item.status === 'optimal');

    return (
      <div className="space-y-4">
        {issues.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></span>
              Items to Review ({issues.length})
            </h3>
            <div className="space-y-2">
              {issues.map((item, idx) => (
                <ActionItem
                  key={idx}
                  icon={getStatusIcon(item.status)}
                  iconBgClass={getIconBgClass(item.status)}
                  title={item.title}
                  subtitle={item.subtitle}
                  subtitleClass={getSubtitleClass(item.status)}
                  status={item.status}
                  tooltip={item.tooltip}
                />
              ))}
            </div>
          </div>
        )}

        {passed.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Verified Systems
            </h3>
            <div className="space-y-2">
              {passed.map((item, idx) => (
                <ActionItem
                  key={idx}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  iconBgClass="status-icon-optimal"
                  title={item.title}
                  subtitle={item.subtitle}
                  subtitleClass="text-green-400"
                  isPassed
                  tooltip={item.tooltip}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // === TANK WATER HEATER VITALS (Original Logic) ===

  // Get PRV display info - context-aware
  const getPrvInfo = () => {
    if (!vitals.prv.required && !vitals.prv.present) {
      return { title: 'PRV Optional', subtitle: 'Pressure currently acceptable', tooltip: 'PRV installation may extend equipment life' };
    }
    if (!vitals.prv.required && vitals.prv.present) {
      return { title: 'PRV Installed', subtitle: 'Extra protection (optional)', tooltip: null };
    }
    if (vitals.prv.present && vitals.prv.functional) {
      return { title: 'PRV Active', subtitle: 'Pressure regulated to ~60 PSI', tooltip: 'Reducing inlet pressure to 60 PSI cuts plumbing strain by ~50%' };
    }
    if (vitals.prv.present && !vitals.prv.functional) {
      return { title: 'PRV Failed', subtitle: 'High pressure despite PRV', tooltip: 'PRV not regulating — system under full strain' };
    }
    return { 
      title: 'PRV Recommended', 
      subtitle: 'Cuts strain by ~50%', 
      tooltip: 'Installing a PRV reduces inlet pressure to 60 PSI, cutting plumbing strain by approximately 50%' 
    };
  };

  // Get expansion tank display info - context-aware
  const getExpansionTankInfo = () => {
    if (!vitals.expansionTank.required) {
      if (vitals.expansionTank.present) {
        return { title: 'Expansion Tank', subtitle: 'Installed (optional)' };
      }
      return { title: 'Expansion Tank', subtitle: 'Not required (open loop)' };
    }
    if (vitals.expansionTank.present) {
      return { title: 'Expansion Tank', subtitle: 'Present & verified' };
    }
    return { title: 'Missing Expansion Tank', subtitle: 'Required for closed loop' };
  };

  // Get usage impact display info
  const getUsageImpactInfo = () => {
    const { usageIntensity, undersizing, peopleCount, usageType, tankCapacity } = vitals.usageImpact;
    const usageLabel = usageType === 'heavy' ? 'Heavy' : usageType === 'light' ? 'Light' : 'Normal';
    
    if (undersizing > 1.2) {
      const recommendedSize = Math.ceil(peopleCount * 15);
      return { 
        title: 'Tank Undersized', 
        subtitle: `${tankCapacity}gal for ${peopleCount} people`,
        tooltip: `Tank is undersized by ${((undersizing - 1) * 100).toFixed(0)}%. Consider upgrading to ${recommendedSize}+ gallons for your household.`
      };
    }
    if (usageIntensity > 1.5) {
      return { 
        title: 'High Usage Impact', 
        subtitle: `${usageIntensity.toFixed(1)}× baseline wear`,
        tooltip: `${peopleCount} people with ${usageLabel.toLowerCase()} usage accelerates wear. This affects anode depletion and thermal cycling.`
      };
    }
    return { 
      title: 'Usage Impact', 
      subtitle: `${usageIntensity.toFixed(1)}× baseline`,
      tooltip: `${peopleCount} ${peopleCount === 1 ? 'person' : 'people'} with ${usageLabel.toLowerCase()} usage. Tank capacity is adequate.`
    };
  };

  const prvInfo = getPrvInfo();
  const expTankInfo = getExpansionTankInfo();
  const usageInfo = getUsageImpactInfo();

  const items = [
    {
      status: vitals.pressure.status,
      icon: <Gauge className="w-5 h-5" />,
      title: vitals.pressure.status === 'optimal' ? 'Pressure Acceptable' : 'Elevated Pressure',
      subtitle: vitals.pressure.status === 'optimal' 
        ? 'Within typical range' 
        : `${vitals.pressure.current} PSI (Limit: ${vitals.pressure.limit})`,
    },
    {
      status: vitals.prv.status,
      icon: <Gauge className="w-5 h-5" />,
      title: prvInfo.title,
      subtitle: prvInfo.subtitle,
      tooltip: prvInfo.tooltip,
    },
    {
      status: vitals.expansionTank.status,
      icon: <Container className="w-5 h-5" />,
      title: expTankInfo.title,
      subtitle: expTankInfo.subtitle,
    },
    {
      status: vitals.biologicalAge.status,
      icon: <Clock className="w-5 h-5" />,
      title: vitals.biologicalAge.agingRate > 1.8 ? 'High Stress' : vitals.biologicalAge.agingRate > 1.3 ? 'Elevated Stress' : 'Normal Wear',
      subtitle: vitals.biologicalAge.agingRate > 1.8 ? 'Significant accelerated wear' : vitals.biologicalAge.agingRate > 1.3 ? 'Faster than normal aging' : 'Healthy aging rate',
      tooltip: vitals.biologicalAge.agingRate > 1.2 
        ? `${vitals.biologicalAge.primaryStressor} is causing accelerated wear. Addressing this can extend service life.`
        : 'Your tank is aging at a healthy rate.',
    },
    {
      status: vitals.usageImpact.status,
      icon: <Users className="w-5 h-5" />,
      title: usageInfo.title,
      subtitle: usageInfo.subtitle,
      tooltip: usageInfo.tooltip,
    },
    {
      status: vitals.liabilityStatus.status,
      icon: <ShieldAlert className="w-5 h-5" />,
      title: vitals.liabilityStatus.status === 'optimal' 
        ? 'Coverage Verified' 
        : `${vitals.liabilityStatus.location} Installation`,
      subtitle: vitals.liabilityStatus.status === 'optimal'
        ? 'Liability insured'
        : formatRiskLevel(vitals.liabilityStatus.riskLevel),
    },
  ];

  const issues = items.filter(item => item.status !== 'optimal');
  const passed = items.filter(item => item.status === 'optimal');

  return (
    <div className="space-y-4">
      {/* Observations Section */}
      {issues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70"></span>
            Items to Review ({issues.length})
          </h3>
          <div className="space-y-2">
            {issues.map((item, idx) => (
              <ActionItem
                key={idx}
                icon={getStatusIcon(item.status)}
                iconBgClass={getIconBgClass(item.status)}
                title={item.title}
                subtitle={item.subtitle}
                subtitleClass={getSubtitleClass(item.status)}
                status={item.status}
                tooltip={item.tooltip}
              />
            ))}
          </div>
        </div>
      )}

      {/* Passed Items Section */}
      {passed.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Verified Systems
          </h3>
          <div className="space-y-2">
            {passed.map((item, idx) => (
              <ActionItem
                key={idx}
                icon={<CheckCircle2 className="w-5 h-5" />}
                iconBgClass="status-icon-optimal"
                title={item.title}
                subtitle={item.subtitle}
                subtitleClass="text-green-400"
                isPassed
                tooltip={item.tooltip}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
