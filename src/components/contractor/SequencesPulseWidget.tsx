import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, Users, Activity, Eye, CheckCircle2 } from 'lucide-react';
import { usePulseMetrics } from '@/hooks/useNurturingSequences';
import { Skeleton } from '@/components/ui/skeleton';

export function SequencesPulseWidget() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = usePulseMetrics();

  const handleClick = () => {
    navigate('/contractor/sequences');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left command-card hover-glow transition-all group"
    >
      {/* Header */}
      <div className="command-header-sm">
        <div className="command-icon-sm bg-violet-500/10 border-violet-500/25">
          <Zap className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">
            Automated Outreach
          </h3>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>

      {/* Metrics Grid */}
      <div className="command-content-sm">
        <div className="grid grid-cols-4 gap-3">
          {/* Enrolled */}
          <MetricCell
            icon={Users}
            label="Enrolled"
            sublabel="7 days"
            value={metrics?.enrolled7Days}
            isLoading={isLoading}
            color="text-sky-400"
          />

          {/* Active Now */}
          <MetricCell
            icon={Activity}
            label="Active"
            sublabel="Now"
            value={metrics?.activeNow}
            isLoading={isLoading}
            color="text-emerald-400"
          />

          {/* Engaged */}
          <MetricCell
            icon={Eye}
            label="Engaged"
            sublabel="24h"
            value={metrics?.engaged24h}
            isLoading={isLoading}
            color="text-amber-400"
          />

          {/* Converted */}
          <MetricCell
            icon={CheckCircle2}
            label="Converted"
            sublabel=""
            value={metrics?.converted}
            isLoading={isLoading}
            color="text-violet-400"
          />
        </div>
      </div>
    </button>
  );
}

interface MetricCellProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: number | undefined;
  isLoading: boolean;
  color: string;
}

function MetricCell({ icon: Icon, label, sublabel, value, isLoading, color }: MetricCellProps) {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-1.5">
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-8 mx-auto mb-1" />
      ) : (
        <div className="text-xl font-bold text-foreground">
          {value ?? 0}
        </div>
      )}
      <div className="text-[10px] text-muted-foreground leading-tight">
        {label}
        {sublabel && <span className="block text-[9px] opacity-70">({sublabel})</span>}
      </div>
    </div>
  );
}
