import { 
  Droplets, Shield, Bell, Clock, Sparkles, 
  Flame, Filter, Wrench, Wind, Phone, AlertTriangle, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MaintenanceTask } from '@/lib/maintenanceCalculations';

interface UnifiedMaintenanceCardProps {
  task: MaintenanceTask;
  onSchedule: () => void;
  onRemind: () => void;
}

export function UnifiedMaintenanceCard({
  task,
  onSchedule,
  onRemind
}: UnifiedMaintenanceCardProps) {
  const { type, label, monthsUntilDue, urgency, benefit, whyExplanation, icon, isInfrastructure } = task;
  
  const isOverdue = urgency === 'overdue' || monthsUntilDue <= 0;
  const isDueSoon = urgency === 'due' || (monthsUntilDue <= 2 && monthsUntilDue > 0);
  const isImpossible = urgency === 'impossible';
  const isFarOut = monthsUntilDue > 3 && !isOverdue && !isImpossible;
  const isViolation = isInfrastructure === true;
  
  // Calculate urgency percentage (inverse - higher when due sooner)
  const maxMonths = 12;
  const urgencyPercent = Math.max(0, Math.min(100, ((maxMonths - monthsUntilDue) / maxMonths) * 100));
  
  // Format the timeframe
  const getTimeframe = () => {
    if (isImpossible) return 'Setup Required';
    if (isOverdue) return 'Overdue';
    if (monthsUntilDue < 1) return 'This month';
    if (monthsUntilDue === 1) return '1 month';
    if (monthsUntilDue < 12) return `${Math.round(monthsUntilDue)} months`;
    const years = monthsUntilDue / 12;
    return `${years.toFixed(1)} years`;
  };

  // Get the target month/year
  const getTargetDate = () => {
    if (isImpossible) return 'Install valves first';
    const target = new Date();
    target.setMonth(target.getMonth() + monthsUntilDue);
    return target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getIcon = () => {
    if (isViolation) {
      if (type.includes('exp_tank')) return Droplets;
      if (type.includes('prv')) return Gauge;
      return AlertTriangle;
    }
    switch (icon) {
      case 'droplets': return Droplets;
      case 'shield': return Shield;
      case 'flame': return Flame;
      case 'filter': return Filter;
      case 'valve': return Wrench;
      case 'wind': return Wind;
      case 'wrench': return Wrench;
      default: return Droplets;
    }
  };

  const IconComponent = getIcon();

  const urgencyStyles = isViolation
    ? { border: 'border-destructive/40', bg: 'bg-destructive/5', accent: 'text-destructive', progressColor: 'bg-destructive' }
    : isImpossible
      ? { border: 'border-orange-500/40', bg: 'bg-orange-500/5', accent: 'text-orange-500', progressColor: 'bg-orange-500' }
      : isOverdue 
        ? { border: 'border-amber-500/40', bg: 'bg-amber-500/5', accent: 'text-amber-500', progressColor: 'bg-amber-500' }
        : isDueSoon 
          ? { border: 'border-amber-500/30', bg: 'bg-amber-500/5', accent: 'text-amber-400', progressColor: 'bg-amber-400' }
          : { border: 'border-primary/20', bg: 'bg-card', accent: 'text-primary', progressColor: 'bg-primary' };

  const iconBg = isViolation
    ? 'bg-destructive/15 text-destructive border-destructive/20'
    : isImpossible
      ? 'bg-orange-500/15 text-orange-500 border-orange-500/20'
      : isOverdue
        ? 'bg-amber-500/15 text-amber-500 border-amber-500/20'
        : isDueSoon
          ? 'bg-amber-400/15 text-amber-400 border-amber-400/20'
          : 'bg-primary/15 text-primary border-primary/20';

  const getStatusLabel = () => {
    if (isViolation) return 'Code Violation';
    if (isImpossible) return 'Setup Required';
    if (isOverdue) return 'Action Required';
    if (isDueSoon) return 'Due Soon';
    return 'Upcoming Service';
  };

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
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            {isViolation && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white mb-1 mr-2">
                VIOLATION
              </span>
            )}
            <p className={cn("text-xs font-medium uppercase tracking-wider mb-0.5", urgencyStyles.accent)}>
              {getStatusLabel()}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {label}
            </h3>
          </div>
        </div>
        
        {/* Countdown Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
          isImpossible ? "bg-orange-500/20 text-orange-500" :
          isOverdue ? "bg-destructive/20 text-destructive" :
          isDueSoon ? "bg-amber-500/20 text-amber-500" :
          "bg-secondary text-muted-foreground"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {isOverdue ? 'Now' : getTimeframe()}
        </div>
      </div>

      {/* Timeline Progress (hidden for impossible state) */}
      {!isImpossible && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {isOverdue ? 'Maintenance overdue' : `Due ${getTargetDate()}`}
            </span>
            <span className={cn("font-medium", urgencyStyles.accent)}>
              {benefit}
            </span>
          </div>
          <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", urgencyStyles.progressColor)}
              style={{ width: `${urgencyPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Why Section */}
      <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {whyExplanation}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={onRemind}
          variant="outline"
          className="w-full gap-2 h-11"
        >
          <Bell className="w-4 h-4" />
          {isFarOut ? 'Remind Me When Due' : 'Set a Reminder'}
        </Button>
        <Button 
          onClick={onSchedule}
          className={cn(
            "w-full gap-2 h-11",
            isImpossible && "bg-orange-600 hover:bg-orange-500 text-white",
            isOverdue && !isImpossible && "bg-amber-600 hover:bg-amber-500 text-white"
          )}
          variant={(isOverdue || isImpossible) ? undefined : "default"}
        >
          <Phone className="w-4 h-4" />
          {isImpossible ? 'Have My Plumber Reach Out' : 'Have My Plumber Reach Out'}
        </Button>
      </div>
    </div>
  );
}

// Compact task item for secondary/upcoming tasks
interface UpcomingMaintenanceTaskProps {
  task: MaintenanceTask;
  isComplete?: boolean;
}

export function UpcomingMaintenanceTask({ task, isComplete }: UpcomingMaintenanceTaskProps) {
  const { label, monthsUntilDue, icon, urgency } = task;
  
  const getIcon = () => {
    switch (icon) {
      case 'droplets': return Droplets;
      case 'shield': return Shield;
      case 'flame': return Flame;
      case 'filter': return Filter;
      case 'valve': return Wrench;
      case 'wind': return Wind;
      case 'wrench': return Wrench;
      default: return Droplets;
    }
  };

  const IconComponent = getIcon();
  const timeframe = monthsUntilDue < 1 
    ? 'This month' 
    : monthsUntilDue === 1 
      ? '1 month' 
      : `${Math.round(monthsUntilDue)} months`;
  
  return (
    <div className="flex items-center gap-4 py-4">
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center border",
        isComplete 
          ? "bg-green-500/10 border-green-500/20 text-green-500"
          : urgency === 'impossible'
            ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
            : "bg-secondary/50 border-border text-muted-foreground"
      )}>
        <IconComponent className="w-4 h-4" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "font-medium text-sm",
          isComplete ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">
          {isComplete ? 'Completed' : urgency === 'impossible' ? 'Requires setup' : `Due in ${timeframe}`}
        </p>
      </div>
      
      {/* Timeframe Badge */}
      <div className={cn(
        "px-2.5 py-1 rounded-md text-xs font-medium",
        isComplete 
          ? "bg-green-500/10 text-green-500" 
          : urgency === 'impossible'
            ? "bg-orange-500/10 text-orange-500"
            : "bg-secondary text-muted-foreground"
      )}>
        {isComplete ? '✓ Done' : urgency === 'impossible' ? 'Setup' : timeframe}
      </div>
    </div>
  );
}
