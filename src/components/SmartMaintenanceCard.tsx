import { Droplets, Shield, Calendar, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  
  // Format the timeframe
  const getTimeframe = () => {
    if (isOverdue) return 'Overdue';
    if (monthsUntilDue < 1) return 'This month';
    if (monthsUntilDue === 1) return 'in 1 month';
    if (monthsUntilDue < 12) return `in ${Math.round(monthsUntilDue)} months`;
    const years = monthsUntilDue / 12;
    return `in ${years.toFixed(1)} years`;
  };

  // Get the target month/year
  const getTargetDate = () => {
    const target = new Date();
    target.setMonth(target.getMonth() + monthsUntilDue);
    return target.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Generate the "why" explanation based on their data
  const getWhyExplanation = () => {
    if (isFlush) {
      const reasons: string[] = [];
      
      if (sedimentLbs > 0) {
        reasons.push(`Remove ~${sedimentLbs.toFixed(1)} lbs of sediment buildup`);
      }
      
      // Convert GPG to descriptive levels (7+ is hard, 10+ is very hard)
      if (waterHardnessGPG > 10) {
        reasons.push('Your hard water causes faster mineral buildup');
      } else if (waterHardnessGPG > 7) {
        reasons.push('Moderate mineral content in your water adds buildup over time');
      }
      
      if (usageType === 'heavy') {
        reasons.push('High hot water usage means more sediment accumulation');
      }
      
      if (reasons.length === 0) {
        reasons.push('Regular flushing prevents efficiency loss and extends lifespan');
      }
      
      return reasons[0];
    } else {
      return 'The anode rod protects your tank from rust. Checking it prevents leaks and costly damage.';
    }
  };

  const urgencyColor = isOverdue 
    ? 'border-red-500/30 bg-red-500/5' 
    : isDueSoon 
      ? 'border-amber-500/30 bg-amber-500/5'
      : 'border-border bg-card';

  const iconBg = isOverdue
    ? 'bg-red-500/20 text-red-400'
    : isDueSoon
      ? 'bg-amber-500/20 text-amber-400'
      : 'bg-blue-500/20 text-blue-400';

  return (
    <div className={cn(
      "rounded-xl border-2 p-6 space-y-4 transition-colors",
      urgencyColor
    )}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          isOverdue ? "text-red-400" : isDueSoon ? "text-amber-400" : "text-muted-foreground"
        )}>
          {isOverdue ? '⚠️ Action Needed' : 'Next Up'}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", iconBg)}>
          {isFlush ? (
            <Droplets className="w-6 h-6" />
          ) : (
            <Shield className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          <h3 className="text-xl font-semibold text-foreground">
            {isFlush ? 'Flush Your Tank' : 'Check Anode Rod'}
          </h3>
          <p className="text-lg text-muted-foreground">
            {getTimeframe()}
            {!isOverdue && <span className="text-sm ml-2 opacity-70">({getTargetDate()})</span>}
          </p>
        </div>
      </div>

      {/* Why Section */}
      <div className="bg-secondary/30 rounded-lg p-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getWhyExplanation()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button 
          onClick={onSchedule}
          className="flex-1 gap-2"
          variant={isOverdue ? "destructive" : "default"}
        >
          <Calendar className="w-4 h-4" />
          Schedule Service
        </Button>
        <Button 
          onClick={onRemind}
          variant="outline"
          className="gap-2"
        >
          <Bell className="w-4 h-4" />
          Remind Me
        </Button>
      </div>
    </div>
  );
}

// Simple upcoming task item
interface UpcomingTaskProps {
  label: string;
  timeframe: string;
  isComplete?: boolean;
}

export function UpcomingTask({ label, timeframe, isComplete }: UpcomingTaskProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
        )}
        <span className={cn(
          "text-sm",
          isComplete ? "text-muted-foreground line-through" : "text-foreground"
        )}>
          {label}
        </span>
      </div>
      <span className="text-sm text-muted-foreground">{timeframe}</span>
    </div>
  );
}
