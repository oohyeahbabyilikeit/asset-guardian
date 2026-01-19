import { 
  Droplets, Shield, Bell, Clock, CheckCircle, 
  Flame, Filter, Wrench, Wind, Sparkles, Phone, AlertTriangle, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MaintenanceTask } from '@/lib/maintenanceCalculations';

interface BundledServiceCardProps {
  tasks: MaintenanceTask[];
  bundleReason: string;
  onSchedule: () => void;
  onRemind: () => void;
}

export function BundledServiceCard({
  tasks,
  bundleReason,
  onSchedule,
  onRemind
}: BundledServiceCardProps) {
  const isAnyOverdue = tasks.some(t => t.urgency === 'overdue' || t.monthsUntilDue <= 0);
  const isAnyDueSoon = tasks.some(t => t.urgency === 'due' || (t.monthsUntilDue <= 2 && t.monthsUntilDue > 0));
  const hasViolations = tasks.some(t => t.isInfrastructure);
  const earliestDue = Math.min(...tasks.map(t => t.monthsUntilDue));
  
  const combinedLabel = tasks.map(t => t.label).join(' + ');
  
  const getIcon = (iconName?: string) => {
    switch (iconName) {
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
  
  const getTimeframe = () => {
    if (earliestDue <= 0) return 'Now';
    if (earliestDue < 1) return 'This month';
    if (earliestDue === 1) return '1 month';
    return `${Math.round(earliestDue)} months`;
  };
  
  const urgencyStyles = isAnyOverdue 
    ? { border: 'border-amber-500/40', bg: 'bg-amber-500/5', accent: 'text-amber-500' }
    : isAnyDueSoon 
      ? { border: 'border-amber-400/30', bg: 'bg-amber-400/5', accent: 'text-amber-400' }
      : { border: 'border-primary/20', bg: 'bg-card', accent: 'text-primary' };
  
  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-5 transition-all shadow-sm",
      urgencyStyles.border,
      urgencyStyles.bg
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl border",
            isAnyOverdue 
              ? "bg-amber-500/15 text-amber-500 border-amber-500/20"
              : "bg-primary/15 text-primary border-primary/20"
          )}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className={cn("text-xs font-medium uppercase tracking-wider mb-0.5", urgencyStyles.accent)}>
              Recommended Service Visit
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {combinedLabel}
            </h3>
          </div>
        </div>
        
        {/* Countdown Badge */}
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
          isAnyOverdue ? "bg-destructive/20 text-destructive" :
          isAnyDueSoon ? "bg-amber-500/20 text-amber-500" :
          "bg-secondary text-muted-foreground"
        )}>
          <Clock className="w-3.5 h-3.5" />
          {getTimeframe()}
        </div>
      </div>
      
      {/* Bundle Reason Banner */}
      <div className="bg-primary/10 text-primary rounded-lg px-4 py-2.5 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 flex-shrink-0" />
        <p className="text-sm font-medium">{bundleReason}</p>
      </div>
      
      {/* Task Benefits Checklist - violations first */}
      <div className="space-y-3">
        {[...tasks].sort((a, b) => (b.isInfrastructure ? 1 : 0) - (a.isInfrastructure ? 1 : 0)).map(task => {
          const IconComponent = task.isInfrastructure 
            ? (task.type.includes('exp_tank') ? Droplets : task.type.includes('prv') ? Gauge : AlertTriangle)
            : getIcon(task.icon);
          return (
            <div key={task.type} className={cn(
              "flex items-start gap-3 p-3 rounded-xl",
              task.isInfrastructure 
                ? "bg-destructive/10 border border-destructive/20" 
                : "bg-secondary/30"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                task.isInfrastructure 
                  ? "bg-destructive/20 text-destructive" 
                  : "bg-secondary text-muted-foreground"
              )}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {task.isInfrastructure && (
                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-destructive text-white">
                      VIOLATION
                    </span>
                  )}
                  <p className={cn(
                    "font-medium text-sm",
                    task.isInfrastructure ? "text-destructive" : "text-foreground"
                  )}>{task.label}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{task.benefit}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={onRemind}
          variant="outline"
          className="w-full gap-2 h-11"
        >
          <Bell className="w-4 h-4" />
          Remind Me When Due
        </Button>
        <Button 
          onClick={onSchedule}
          className={cn(
            "w-full gap-2 h-11",
            isAnyOverdue && "bg-amber-600 hover:bg-amber-500 text-white"
          )}
          variant={isAnyOverdue ? undefined : "default"}
        >
          <Phone className="w-4 h-4" />
          Have My Plumber Reach Out
        </Button>
      </div>
    </div>
  );
}