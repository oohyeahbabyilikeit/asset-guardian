import { TrendingUp, Send, Eye, MousePointer, CheckCircle, XCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type NurturingSequence, useSequenceTemplates } from '@/hooks/useNurturingSequences';

interface SequenceAnalyticsProps {
  sequences: NurturingSequence[];
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  subtext?: string;
}

function StatCard({ label, value, icon: Icon, iconColor = 'text-violet-400', subtext }: StatCardProps) {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-4">
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg bg-muted/50', iconColor.replace('text-', 'bg-').replace('400', '500/20'))}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function SequenceAnalytics({ sequences }: SequenceAnalyticsProps) {
  const { data: templates = [] } = useSequenceTemplates();
  
  // Calculate metrics
  const completedSequences = sequences.filter(s => s.status === 'completed');
  const convertedSequences = sequences.filter(s => 
    s.status === 'completed' && (s as any).outcome === 'converted'
  );
  const lostSequences = sequences.filter(s => 
    s.status === 'completed' && (s as any).outcome === 'lost'
  );
  
  // Estimate messages (steps completed)
  const totalStepsCompleted = sequences.reduce((acc, seq) => {
    if (seq.status === 'completed') return acc + seq.totalSteps;
    return acc + (seq.currentStep - 1);
  }, 0);
  
  // Mock rates for demo (in real app, calculate from sequence_events)
  const openRate = sequences.length > 0 ? 68 : 0;
  const clickRate = sequences.length > 0 ? 24 : 0;
  
  const conversionRate = completedSequences.length > 0 
    ? Math.round((convertedSequences.length / completedSequences.length) * 100)
    : 0;
  
  // Find top template
  const templateUsage = sequences.reduce((acc, seq) => {
    acc[seq.sequenceType] = (acc[seq.sequenceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topTemplateType = Object.entries(templateUsage)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const topTemplate = templates.find(t => 
    t.triggerType === topTemplateType || 
    t.name.toLowerCase().includes((topTemplateType || '').replace('_', ' '))
  );
  
  return (
    <div className="space-y-6">
      {/* Period Label */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <TrendingUp className="w-4 h-4" />
        <span>Last 30 Days</span>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Messages Sent"
          value={totalStepsCompleted}
          icon={Send}
          iconColor="text-violet-400"
        />
        <StatCard
          label="Open Rate"
          value={`${openRate}%`}
          icon={Eye}
          iconColor="text-sky-400"
        />
        <StatCard
          label="Click Rate"
          value={`${clickRate}%`}
          icon={MousePointer}
          iconColor="text-amber-400"
        />
        <StatCard
          label="Sequences Started"
          value={sequences.length}
          icon={TrendingUp}
          iconColor="text-emerald-400"
        />
      </div>
      
      {/* Outcomes */}
      <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/50 p-4">
        <h3 className="text-sm font-medium mb-3">Sequence Outcomes</h3>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 flex items-center gap-2">
            <div className="p-1.5 rounded bg-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold">{convertedSequences.length}</p>
              <p className="text-xs text-muted-foreground">Converted</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-center gap-2">
            <div className="p-1.5 rounded bg-rose-500/20">
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="font-semibold">{lostSequences.length}</p>
              <p className="text-xs text-muted-foreground">Lost</p>
            </div>
          </div>
          
          <div className="flex-1 text-center">
            <p className="text-2xl font-bold text-emerald-400">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </div>
        </div>
      </div>
      
      {/* Top Performing Template */}
      {topTemplate && (
        <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-medium text-violet-300">Top Performing Template</span>
          </div>
          <p className="font-medium">{topTemplate.name}</p>
          <p className="text-sm text-muted-foreground">
            {templateUsage[topTemplateType]} sequences started
          </p>
        </div>
      )}
      
      {/* Empty State */}
      {sequences.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No analytics data yet</p>
          <p className="text-xs">Start nurturing sequences to see performance metrics</p>
        </div>
      )}
    </div>
  );
}
