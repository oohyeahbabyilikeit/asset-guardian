import { Activity, ShieldAlert, CheckCircle2, Clock, Gauge, Container, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type VitalsData } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel } from '@/lib/opterraAlgorithm';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VitalsGridProps {
  vitals: VitalsData;
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
        "action-item",
        status === 'critical' && "action-item-critical",
        status === 'warning' && "action-item-warning",
        isPassed && "action-item-optimal"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-full flex items-center justify-center border", iconBgClass)}>
          {icon}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{title}</span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className={cn("text-xs font-bold font-data", subtitleClass)}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export function VitalsGrid({ vitals }: VitalsGridProps) {
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

  const prvInfo = getPrvInfo();
  const expTankInfo = getExpansionTankInfo();

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
      title: vitals.biologicalAge.agingRate > 1.5 ? 'Accelerated Wear' : 'Aging Rate',
      subtitle: `${vitals.biologicalAge.agingRate.toFixed(1)}x Normal Speed`,
      tooltip: vitals.biologicalAge.agingRate > 1.2 
        ? `${vitals.biologicalAge.primaryStressor} is causing accelerated wear.${vitals.biologicalAge.lifeExtension > 0.5 ? ` Fix to gain ~${vitals.biologicalAge.lifeExtension.toFixed(1)} years.` : ''}`
        : 'Your tank is aging at a healthy rate.',
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
    <div className="px-4 space-y-5">
      {/* Observations Section */}
      {issues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1 flex items-center gap-2 font-data">
            <span className="w-2 h-2 rounded-full bg-amber-500/70"></span>
            Items to Review ({issues.length})
          </h3>
          <div className="space-y-3">
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
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1 font-data">
            Verified Systems
          </h3>
          <div className="space-y-3">
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
