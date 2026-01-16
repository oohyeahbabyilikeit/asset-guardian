import { Droplets, Shield, Calendar, Bell, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface SmartMaintenanceCardProps {
  taskType: 'flush' | 'anode';
  monthsUntilDue: number;
  sedimentLbs?: number;
  waterHardnessGPG?: number;
  usageType?: 'light' | 'normal' | 'heavy';
  onSchedule: () => void;
  onRemind: () => void;
}

export function SmartMaintenanceCard({
  taskType,
  monthsUntilDue,
  sedimentLbs = 0,
  waterHardnessGPG = 10,
  usageType = 'normal',
  onSchedule,
  onRemind
}: SmartMaintenanceCardProps) {
  const isFlush = taskType === 'flush';
  const isOverdue = monthsUntilDue <= 0;
  const isDueSoon = monthsUntilDue <= 2 && monthsUntilDue > 0;
  
  // Calculate urgency percentage (inverse - higher when due sooner)
  const maxMonths = 12;
  const urgencyPercent = Math.max(0, Math.min(100, ((maxMonths - monthsUntilDue) / maxMonths) * 100));
  
  // Format the timeframe
  const getTimeframe = () => {
    if (isOverdue) return 'Overdue';
    if (monthsUntilDue < 1) return 'This month';
    if (monthsUntilDue === 1) return '1 month';
    if (monthsUntilDue < 12) return `${Math.round(monthsUntilDue)} months`;
    const years = monthsUntilDue / 12;
    return `${years.toFixed(1)} years`;
  };

  // Get the target month/year
  const getTargetDate = () => {
    const target = new Date();
    target.setMonth(target.getMonth() + monthsUntilDue);
    return target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Generate the "why" explanation based on their data
  // Note: This component is only used for tank water heaters (flush/anode tasks)
  // Tankless units use different maintenance tasks (descale, filter_clean, etc.)
  const getWhyExplanation = () => {
    if (isFlush) {
      if (sedimentLbs > 1) {
        return `Approximately ${sedimentLbs.toFixed(1)} lbs of mineral buildup has accumulated. Flushing restores heating efficiency and prevents damage to the tank lining.`;
      }
      if (waterHardnessGPG > 10) {
        return 'Your water hardness accelerates sediment buildup. Regular flushing prevents efficiency loss and extends equipment lifespan.';
      }
      if (usageType === 'heavy') {
        return 'Higher hot water demand increases sediment accumulation. Routine flushing maintains optimal performance.';
      }
      return 'Periodic flushing removes mineral deposits that reduce heating efficiency and can cause premature tank failure.';
    } else {
      return 'The sacrificial anode rod protects your tank from corrosion. Inspection ensures it\'s still providing protection before rust can develop.';
    }
  };

  // Get benefit text
  const getBenefit = () => {
    if (isFlush) {
      return sedimentLbs > 0 
        ? `Restore up to ${Math.round(sedimentLbs * 3)}% efficiency`
        : 'Maintain peak efficiency';
    }
    return 'Prevent tank corrosion';
  };

  const urgencyStyles = isOverdue 
    ? { border: 'border-amber-500/40', bg: 'bg-amber-500/5', accent: 'text-amber-500', progressColor: 'bg-amber-500' }
    : isDueSoon 
      ? { border: 'border-amber-500/30', bg: 'bg-amber-500/5', accent: 'text-amber-400', progressColor: 'bg-amber-400' }
      : { border: 'border-primary/20', bg: 'bg-card', accent: 'text-primary', progressColor: 'bg-primary' };

  const iconBg = isOverdue
    ? 'bg-amber-500/15 text-amber-500 border-amber-500/20'
    : isDueSoon
      ? 'bg-amber-400/15 text-amber-400 border-amber-400/20'
      : 'bg-primary/15 text-primary border-primary/20';

  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-5 transition-all shadow-sm",
      urgencyStyles.border,
      urgencyStyles.bg
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl border", iconBg)}>
            {isFlush ? (
              <Droplets className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-wider mb-0.5", urgencyStyles.accent)}>
              {isOverdue ? 'Action Required' : isDueSoon ? 'Due Soon' : 'Upcoming Service'}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {isFlush ? 'Tank Flush' : 'Anode Rod Inspection'}
            </h3>
          </div>
        </div>
        
        {/* Countdown Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
          isOverdue ? "bg-destructive/20 text-destructive" :
          isDueSoon ? "bg-amber-500/20 text-amber-500" :
          "bg-secondary text-muted-foreground"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {isOverdue ? 'Now' : getTimeframe()}
        </div>
      </div>

      {/* Timeline Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isOverdue ? 'Maintenance overdue' : `Due ${getTargetDate()}`}
          </span>
          <span className={cn("font-medium", urgencyStyles.accent)}>
            {getBenefit()}
          </span>
        </div>
        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", urgencyStyles.progressColor)}
            style={{ width: `${urgencyPercent}%` }}
          />
        </div>
      </div>

      {/* Why Section */}
      <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getWhyExplanation()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={onSchedule}
          className={cn(
            "flex-1 gap-2 h-11",
            isOverdue && "bg-amber-600 hover:bg-amber-500 text-white"
          )}
          variant={isOverdue ? undefined : "default"}
        >
          <Calendar className="w-4 h-4" />
          Schedule Service
        </Button>
        <Button 
          onClick={onRemind}
          variant="outline"
          className="gap-2 h-11 px-4"
        >
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Remind</span>
        </Button>
      </div>
    </div>
  );
}

// Timeline task item for "Coming Up" section
interface UpcomingTaskProps {
  taskType: 'flush' | 'anode';
  timeframe: string;
  isComplete?: boolean;
}

export function UpcomingTask({ taskType, timeframe, isComplete }: UpcomingTaskProps) {
  const isFlush = taskType === 'flush';
  
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center border",
        isComplete 
          ? "bg-green-500/10 border-green-500/20 text-green-500"
          : "bg-secondary/50 border-border text-muted-foreground"
      )}>
        {isFlush ? <Droplets className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          isComplete ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {isFlush ? 'Tank Flush' : 'Anode Rod Inspection'}
        </p>
        <p className="text-xs text-muted-foreground">
          {isComplete ? 'Completed' : `Due in ${timeframe}`}
        </p>
      </div>
      
      {/* Timeframe Badge */}
      <div className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium",
        isComplete ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground"
      )}>
        {isComplete ? '✓ Done' : timeframe}
      </div>
    </div>
  );
}

// Health Summary Card
interface HealthSummaryProps {
  healthScore: number;
  totalSaved: number;
  servicesCompleted: number;
}

export function HealthSummary({ healthScore, totalSaved, servicesCompleted }: HealthSummaryProps) {
  const getScoreColor = () => {
    if (healthScore >= 80) return 'text-green-500';
    if (healthScore >= 60) return 'text-amber-500';
    return 'text-destructive';
  };

  const getScoreLabel = () => {
    if (healthScore >= 80) return 'Excellent';
    if (healthScore >= 60) return 'Good';
    if (healthScore >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-secondary/20 p-5">
      <div className="flex items-center justify-between">
        {/* Health Score */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-secondary"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${healthScore}, 100`}
                className={getScoreColor()}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("text-lg font-bold", getScoreColor())}>{healthScore}</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Health Score</p>
            <p className={cn("text-sm font-semibold", getScoreColor())}>{getScoreLabel()}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="text-right space-y-2">
          {totalSaved > 0 && (
            <div>
              <p className="text-lg font-bold text-green-500">${totalSaved.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Est. Savings</p>
            </div>
          )}
          {servicesCompleted > 0 && (
            <div className="flex items-center gap-1.5 justify-end text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs">{servicesCompleted} services logged</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
