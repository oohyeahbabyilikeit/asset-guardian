import { Activity, ShieldAlert, CheckCircle2, Clock, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type VitalsData } from '@/data/mockAsset';

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
}

function ActionItem({ icon, iconBgClass, title, subtitle, subtitleClass, isPassed, status }: ActionItemProps) {
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
          <div className="font-bold text-foreground">{title}</div>
          <div className={cn("text-xs font-bold font-data", subtitleClass)}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export function VitalsGrid({ vitals }: VitalsGridProps) {
  const issueCount = [
    vitals.pressure.status !== 'optimal',
    vitals.biologicalAge.status !== 'optimal',
    vitals.sedimentLoad.status !== 'optimal',
    vitals.liabilityStatus.status !== 'optimal',
  ].filter(Boolean).length;

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

  // Format damage estimate for display
  const formatDamage = (amount?: number) => {
    if (!amount) return 'High damage potential';
    return amount >= 1000 ? `$${Math.round(amount / 1000)}K damage potential` : `$${amount} damage potential`;
  };

  const items = [
    {
      status: vitals.pressure.status,
      icon: <Gauge className="w-5 h-5" />,
      title: vitals.pressure.status === 'optimal' ? 'Pressure Normal' : 'High Pressure',
      subtitle: vitals.pressure.status === 'optimal' 
        ? 'Within safe range' 
        : `${vitals.pressure.current} PSI (Limit: ${vitals.pressure.limit})`,
    },
    {
      status: vitals.biologicalAge.status,
      icon: <Clock className="w-5 h-5" />,
      title: vitals.biologicalAge.status === 'optimal' ? 'Age Normal' : 'Accelerated Aging',
      subtitle: vitals.biologicalAge.status === 'optimal'
        ? 'Within expected range'
        : `Bio Age: ${vitals.biologicalAge.real} yrs (Actual: ${vitals.biologicalAge.paper})`,
    },
    {
      status: vitals.liabilityStatus.status,
      icon: <ShieldAlert className="w-5 h-5" />,
      title: vitals.liabilityStatus.status === 'optimal' 
        ? 'Coverage Verified' 
        : `${vitals.liabilityStatus.location} Installation Risk`,
      subtitle: vitals.liabilityStatus.status === 'optimal'
        ? 'Liability insured'
        : formatDamage(vitals.liabilityStatus.estDamage),
    },
  ];

  const issues = items.filter(item => item.status !== 'optimal');
  const passed = items.filter(item => item.status === 'optimal');

  return (
    <div className="px-4 space-y-5">
      {/* Issues Section */}
      {issues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1 flex items-center gap-2 font-data">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]"></span>
            Insights ({issues.length})
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
