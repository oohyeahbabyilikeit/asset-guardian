import { Activity, ShieldAlert, CheckCircle2, ChevronRight, Clock, Gauge } from 'lucide-react';
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
}

function ActionItem({ icon, iconBgClass, title, subtitle, subtitleClass, isPassed }: ActionItemProps) {
  return (
    <button 
      className={cn(
        "action-item group",
        isPassed && "opacity-60 grayscale hover:grayscale-0"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform", iconBgClass)}>
          {icon}
        </div>
        <div className="text-left">
          <div className="font-bold text-foreground">{title}</div>
          <div className={cn("text-xs font-bold", subtitleClass)}>{subtitle}</div>
        </div>
      </div>
      {!isPassed && <ChevronRight className="w-5 h-5 text-muted-foreground/50" />}
    </button>
  );
}

export function VitalsGrid({ vitals }: VitalsGridProps) {
  // Count issues for the header
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
    if (status === 'critical') return 'bg-red-50 text-red-600';
    if (status === 'warning') return 'bg-amber-50 text-amber-600';
    return 'bg-green-50 text-green-600';
  };

  const getSubtitleClass = (status: 'critical' | 'warning' | 'optimal') => {
    if (status === 'critical') return 'text-red-600';
    if (status === 'warning') return 'text-amber-600';
    return 'text-green-600';
  };

  // Separate issues from passed items
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
      title: vitals.liabilityStatus.status === 'optimal' ? 'Coverage Verified' : 'Missing Expansion Tank',
      subtitle: vitals.liabilityStatus.status === 'optimal'
        ? 'Liability insured'
        : 'Code Violation',
    },
  ];

  const issues = items.filter(item => item.status !== 'optimal');
  const passed = items.filter(item => item.status === 'optimal');

  return (
    <div className="px-4 space-y-4">
      {/* Issues Section */}
      {issues.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 ml-1">
            Required Actions ({issues.length})
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Passed Items Section */}
      {passed.length > 0 && (
        <div className="space-y-3">
          {passed.map((item, idx) => (
            <ActionItem
              key={idx}
              icon={<CheckCircle2 className="w-5 h-5" />}
              iconBgClass="bg-green-50 text-green-600"
              title={item.title}
              subtitle={item.subtitle}
              subtitleClass="text-green-600"
              isPassed
            />
          ))}
        </div>
      )}
    </div>
  );
}
