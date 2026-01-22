import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Clock, Info, Wrench, AlertTriangle, Gauge, Phone, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateMaintenanceSchedule, MaintenanceSchedule, MaintenanceTask, getInfrastructureMaintenanceTasks, VerdictAction } from '@/lib/maintenanceCalculations';
import { ForensicInputs, OpterraMetrics, isTankless } from '@/lib/opterraAlgorithm';
import { addMonths } from 'date-fns';

interface MaintenanceEducationCardProps {
  currentInputs: ForensicInputs;
  metrics: OpterraMetrics;
  contractorId?: string;
  propertyId?: string;
  waterHeaterId?: string;
  onScheduleService?: () => void;
  /** Algorithm verdict - controls whether maintenance is shown */
  verdictAction?: VerdictAction;
  /** Reason for PASS verdict (used for monitor-only messaging) */
  verdictTitle?: string;
  /** Estimated years remaining (for PASS verdicts) */
  yearsRemaining?: number;
}

interface ScheduledTask extends MaintenanceTask {
  dueDate: Date;
}

export function MaintenanceEducationCard({
  currentInputs,
  metrics,
  contractorId,
  propertyId,
  waterHeaterId,
  onScheduleService,
  verdictAction,
  verdictTitle,
  yearsRemaining,
}: MaintenanceEducationCardProps) {
  // Determine unit type
  const unitType = useMemo(() => {
    if (isTankless(currentInputs.fuelType)) return 'tankless';
    if (currentInputs.fuelType === 'HYBRID') return 'hybrid';
    return 'tank';
  }, [currentInputs.fuelType]);

  // Calculate maintenance schedule - now verdict-aware
  const maintenanceSchedule: MaintenanceSchedule = useMemo(() => {
    return calculateMaintenanceSchedule(currentInputs, metrics, verdictAction);
  }, [currentInputs, metrics, verdictAction]);

  // Get infrastructure tasks (critical priority issues like missing expansion tank)
  // Only show if NOT a PASS verdict (infrastructure issues are still important for REPAIR/MAINTAIN)
  const infrastructureTasks: MaintenanceTask[] = useMemo(() => {
    if (verdictAction === 'PASS') return [];
    return getInfrastructureMaintenanceTasks(currentInputs, metrics);
  }, [currentInputs, metrics, verdictAction]);

  // Build scheduled tasks with due dates (NO PRICES)
  const scheduledTasks: ScheduledTask[] = useMemo(() => {
    // If monitor-only, no tasks to show
    if (maintenanceSchedule.monitorOnly) return [];
    
    const tasks: ScheduledTask[] = [];
    const now = new Date();

    // Helper to add a task
    const addTask = (task: MaintenanceTask) => {
      const dueDate = addMonths(now, task.monthsUntilDue);

      tasks.push({
        ...task,
        dueDate,
      });
    };

    // Add infrastructure tasks FIRST (critical priority)
    infrastructureTasks.forEach(addTask);

    // Add primary task
    if (maintenanceSchedule.primaryTask) {
      addTask(maintenanceSchedule.primaryTask);
    }

    // Add secondary task
    if (maintenanceSchedule.secondaryTask) {
      addTask(maintenanceSchedule.secondaryTask);
    }

    // Add additional tasks
    maintenanceSchedule.additionalTasks?.forEach(addTask);

    // Sort: infrastructure first (by urgency), then by due date
    return tasks.sort((a, b) => {
      // Infrastructure tasks always come first
      if (a.isInfrastructure && !b.isInfrastructure) return -1;
      if (!a.isInfrastructure && b.isInfrastructure) return 1;
      // Within same category, sort by urgency then due date
      if (a.urgency === 'overdue' && b.urgency !== 'overdue') return -1;
      if (b.urgency === 'overdue' && a.urgency !== 'overdue') return 1;
      return a.monthsUntilDue - b.monthsUntilDue;
    });
  }, [maintenanceSchedule, infrastructureTasks]);
  
  // Get monitor-only message based on verdict title
  const getMonitorMessage = (): { title: string; subtitle: string } => {
    if (verdictTitle?.includes('Fused')) {
      return {
        title: 'Anode may be fused',
        subtitle: 'Standard inspection could cause damage. We recommend monitoring.',
      };
    }
    if (verdictTitle?.includes('Fragile')) {
      return {
        title: 'Unit is fragile',
        subtitle: 'Maintenance could cause more harm than good at this stage.',
      };
    }
    if (verdictTitle?.includes('Run to Failure')) {
      return {
        title: 'Monitor & plan ahead',
        subtitle: 'Your unit is stable. Budget for replacement when ready.',
      };
    }
    return {
      title: 'Your unit is stable',
      subtitle: 'No maintenance recommended at this time.',
    };
  };

  // Format months until due
  const formatDueIn = (months: number): string => {
    if (months <= 0) return 'Now';
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years}y ${remainingMonths}m`;
  };

  // Get urgency color
  const getUrgencyColor = (urgency: MaintenanceTask['urgency']): string => {
    switch (urgency) {
      case 'overdue':
      case 'impossible':
        return 'bg-destructive text-destructive-foreground';
      case 'due':
        return 'bg-warning text-warning-foreground';
      case 'schedule':
        return 'bg-amber-500/20 text-amber-700';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Handle "All Caught Up" / Monitor Only state
  if (maintenanceSchedule.monitorOnly) {
    const { title, subtitle } = getMonitorMessage();
    
    return (
      <Card className="border-emerald-500/20 shadow-md bg-emerald-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-emerald-500/20">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-emerald-700 dark:text-emerald-400">
                {title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {yearsRemaining !== undefined && yearsRemaining > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Plan for replacement in approximately <strong>{yearsRemaining} year{yearsRemaining === 1 ? '' : 's'}</strong>. 
                We'll be here when you need us.
              </p>
            </div>
          )}
          
          <Button
            onClick={onScheduleService}
            variant="outline"
            className="w-full gap-2"
          >
            <Phone className="w-4 h-4" />
            Questions? Reach Out
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Your Maintenance Schedule
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">
                  Keeping up with maintenance extends the life of your water heater and prevents unexpected failures.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Maintenance tasks list - NO PRICES */}
        <div className="space-y-3">
          {scheduledTasks.map((task, index) => {
            const isInfrastructureCritical = task.isInfrastructure && task.urgency === 'overdue';
            
            return (
              <div
                key={task.type}
                className={`p-3 rounded-lg border ${
                  isInfrastructureCritical 
                    ? 'bg-destructive/10 border-destructive/40' 
                    : index === 0 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isInfrastructureCritical ? (
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      ) : task.icon === 'gauge' ? (
                        <Gauge className="w-4 h-4 text-warning shrink-0" />
                      ) : (
                        <Wrench className="w-4 h-4 text-primary shrink-0" />
                      )}
                      <span className={`font-medium text-sm ${isInfrastructureCritical ? 'text-destructive' : ''}`}>
                        {task.label}
                      </span>
                      {isInfrastructureCritical && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    
                    {/* Show aging multiplier for infrastructure issues */}
                    {task.agingMultiplier && task.agingMultiplier > 1 && (
                      <div className="flex items-center gap-1 text-xs text-destructive mt-1.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-semibold">{task.agingMultiplier}x accelerated aging</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`${getUrgencyColor(task.urgency)}`}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {task.monthsUntilDue === 0 && task.isInfrastructure ? 'Immediate' : formatDueIn(task.monthsUntilDue)}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why maintenance matters - educational (replaces pricing) */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Regular maintenance can extend your water heater's life by 3-5 years and prevent costly emergency repairs.
          </p>
        </div>

        {/* CTA - simplified to single action */}
        <div className="pt-2">
          <Button
            onClick={onScheduleService}
            variant="default"
            className="w-full gap-2"
          >
            <Phone className="w-4 h-4" />
            Have My Plumber Reach Out
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Your plumber will contact you to discuss your maintenance needs.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}