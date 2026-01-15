import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, DollarSign, Bell, Clock, Info, Wrench, AlertTriangle, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotifyMeModal } from './NotifyMeModal';
import { getMaintenancePrices, getMaintenancePriceByType, MaintenancePrice } from '@/lib/maintenancePricingService';
import { calculateMaintenanceSchedule, MaintenanceSchedule, MaintenanceTask, getInfrastructureMaintenanceTasks } from '@/lib/maintenanceCalculations';
import { ForensicInputs, OpterraMetrics, isTankless } from '@/lib/opterraAlgorithm';
import { addMonths } from 'date-fns';

interface MaintenanceEducationCardProps {
  currentInputs: ForensicInputs;
  metrics: OpterraMetrics;
  contractorId?: string;
  propertyId?: string;
  waterHeaterId?: string;
}

interface ScheduledTask extends MaintenanceTask {
  price: number;
  dueDate: Date;
}

export function MaintenanceEducationCard({
  currentInputs,
  metrics,
  contractorId,
  propertyId,
  waterHeaterId,
}: MaintenanceEducationCardProps) {
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [prices, setPrices] = useState<MaintenancePrice[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

  // Determine unit type
  const unitType = useMemo(() => {
    if (isTankless(currentInputs.fuelType)) return 'tankless';
    if (currentInputs.fuelType === 'HYBRID') return 'hybrid';
    return 'tank';
  }, [currentInputs.fuelType]);

  // Fetch contractor pricing
  useEffect(() => {
    async function fetchPrices() {
      setIsLoadingPrices(true);
      const fetchedPrices = await getMaintenancePrices(contractorId || null, unitType);
      setPrices(fetchedPrices);
      setIsLoadingPrices(false);
    }
    fetchPrices();
  }, [contractorId, unitType]);

  // Calculate maintenance schedule
  const maintenanceSchedule: MaintenanceSchedule = useMemo(() => {
    return calculateMaintenanceSchedule(currentInputs, metrics);
  }, [currentInputs, metrics]);

  // Get infrastructure tasks (critical priority issues like missing expansion tank)
  const infrastructureTasks: MaintenanceTask[] = useMemo(() => {
    return getInfrastructureMaintenanceTasks(currentInputs, metrics);
  }, [currentInputs, metrics]);

  // Build scheduled tasks with pricing and due dates
  const scheduledTasks: ScheduledTask[] = useMemo(() => {
    const tasks: ScheduledTask[] = [];
    const now = new Date();

    // Helper to add a task with pricing
    const addTask = (task: MaintenanceTask) => {
      const priceInfo = getMaintenancePriceByType(prices, task.type);
      const dueDate = addMonths(now, task.monthsUntilDue);

      tasks.push({
        ...task,
        price: priceInfo?.price || 100,
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
  }, [maintenanceSchedule, infrastructureTasks, prices]);

  // Calculate total annual maintenance cost
  const annualCost = useMemo(() => {
    let total = 0;
    scheduledTasks.forEach((task) => {
      // Estimate frequency based on task type
      const intervalsMonths: Record<string, number> = {
        flush: 12,
        anode: 48,
        descale: 12,
        filter: 12,
        air_filter: 12,
        condensate: 12,
        tp_valve: 12,
        isolation_valve: 24,
      };
      const interval = intervalsMonths[task.type] || 12;
      const timesPerYear = 12 / interval;
      total += task.price * timesPerYear;
    });
    return Math.round(total);
  }, [scheduledTasks]);

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

  // Build modal tasks
  const modalTasks = scheduledTasks.map((task) => ({
    id: task.type,
    label: task.label,
    dueDate: task.dueDate,
  }));

  if (isLoadingPrices) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                    Pricing is based on {contractorId ? "your plumber's price book" : 'typical market rates'}.
                    Actual costs may vary based on your specific situation.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Maintenance tasks list */}
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
                        className={`mb-1 ${getUrgencyColor(task.urgency)}`}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {task.monthsUntilDue === 0 && task.isInfrastructure ? 'Immediate' : formatDueIn(task.monthsUntilDue)}
                      </Badge>
                      <div className="flex items-center justify-end gap-1 text-sm font-semibold">
                        <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                        <span>{!contractorId && '~'}${task.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Annual cost summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <span className="text-sm text-muted-foreground">Estimated annual maintenance:</span>
            <span className="font-semibold">
              {!contractorId && '~'}${annualCost}/year
            </span>
          </div>

          {/* Notify Me CTA */}
          <div className="pt-2">
            <Button
              onClick={() => setNotifyModalOpen(true)}
              variant="default"
              className="w-full gap-2"
            >
              <Bell className="w-4 h-4" />
              Notify Me When Due
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              We'll have your plumber reach out 2 weeks before each service is needed.
            </p>
          </div>
        </CardContent>
      </Card>

      <NotifyMeModal
        open={notifyModalOpen}
        onOpenChange={setNotifyModalOpen}
        tasks={modalTasks}
        propertyId={propertyId}
        waterHeaterId={waterHeaterId}
        contractorId={contractorId}
      />
    </>
  );
}
