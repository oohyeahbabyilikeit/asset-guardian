import { useNavigate } from 'react-router-dom';
import { Bot, Users, Radio, Mail, PartyPopper, ArrowRight, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { usePulseMetrics } from '@/hooks/useNurturingSequences';
import { useContractorOpportunities } from '@/hooks/useContractorOpportunities';

interface MetricCardProps {
  icon: React.ElementType;
  value: number | undefined;
  label: string;
  sublabel: string;
  isLoading: boolean;
  color: string;
  bgColor: string;
  trend?: string;
}

function MetricCard({ 
  icon: Icon, 
  value, 
  label, 
  sublabel, 
  isLoading, 
  color, 
  bgColor,
  trend 
}: MetricCardProps) {
  return (
    <div className={cn(
      'flex flex-col items-center p-4 rounded-xl border transition-all',
      bgColor,
      'hover:scale-[1.02]'
    )}>
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', color.replace('text-', 'bg-').replace('400', '500/20'))}>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-12 mb-1" />
      ) : (
        <span className={cn('text-3xl font-bold', color)}>
          {value ?? 0}
        </span>
      )}
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{sublabel}</span>
      {trend && (
        <span className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
  );
}

export function DashboardPulseHero() {
  const navigate = useNavigate();
  const { data: metrics, isLoading } = usePulseMetrics();
  const { data: opportunities = [] } = useContractorOpportunities();
  
  // Calculate pipeline percentage
  const activeOpps = opportunities.filter(o => o.status !== 'dismissed' && o.status !== 'converted');
  const inSequenceCount = metrics?.activeNow ?? 0;
  const pipelinePercentage = activeOpps.length > 0 
    ? Math.round((inSequenceCount / activeOpps.length) * 100)
    : 0;

  return (
    <button
      onClick={() => navigate('/contractor/sequences')}
      className={cn(
        'w-full text-left rounded-2xl p-6 transition-all group',
        'bg-gradient-to-br from-card via-card to-violet-950/20',
        'border border-border hover:border-violet-500/30',
        'shadow-lg hover:shadow-violet-500/10'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Automated Outreach</h2>
            <p className="text-xs text-muted-foreground">Your marketing machine status</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-violet-400 transition-colors">
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon={Users}
          value={metrics?.enrolled7Days}
          label="Enrolled"
          sublabel="Last 7 days"
          isLoading={isLoading}
          color="text-sky-400"
          bgColor="bg-sky-500/5 border-sky-500/20"
        />
        <MetricCard
          icon={Radio}
          value={metrics?.activeNow}
          label="Active"
          sublabel="Now"
          isLoading={isLoading}
          color="text-emerald-400"
          bgColor="bg-emerald-500/5 border-emerald-500/20"
        />
        <MetricCard
          icon={Mail}
          value={metrics?.engaged24h}
          label="Engaged"
          sublabel="Last 24h"
          isLoading={isLoading}
          color="text-amber-400"
          bgColor="bg-amber-500/5 border-amber-500/20"
        />
        <MetricCard
          icon={PartyPopper}
          value={metrics?.converted}
          label="Converted"
          sublabel="All time"
          isLoading={isLoading}
          color="text-violet-400"
          bgColor="bg-violet-500/5 border-violet-500/20"
        />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
            style={{ width: `${Math.min(pipelinePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          <span className="text-violet-400 font-medium">{pipelinePercentage}%</span> of pipeline in active sequence
        </p>
      </div>
    </button>
  );
}
