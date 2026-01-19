import { ArrowLeft, Plus, History, ChevronDown, Droplets, Shield, Flame, Filter, Wrench, Wind, Zap, TrendingUp, Award, AlertTriangle, Phone, Bell, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ForensicInputs, calculateOpterraRisk, failProbToHealthScore, isTankless } from '@/lib/opterraAlgorithm';
import { ServiceEvent } from '@/types/serviceHistory';
import { UnifiedMaintenanceCard, UpcomingMaintenanceTask } from './UnifiedMaintenanceCard';
import { BundledServiceCard } from './BundledServiceCard';
import { calculateMaintenanceSchedule, getServiceEventTypes, getInfrastructureMaintenanceTasks, MaintenanceTask } from '@/lib/maintenanceCalculations';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HealthRing } from './HealthRing';
import { CriticalAssessmentPage } from './CriticalAssessmentPage';
import { cn } from '@/lib/utils';

// ViolationCard - dedicated card for code violations with red styling
function ViolationCard({ 
  task, 
  onSchedule, 
  onRemind 
}: { 
  task: MaintenanceTask; 
  onSchedule: () => void; 
  onRemind: () => void; 
}) {
  const getIcon = () => {
    if (task.type.includes('exp_tank')) return Droplets;
    if (task.type.includes('prv')) return Gauge;
    return AlertTriangle;
  };
  const IconComponent = getIcon();
  
  return (
    <div className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/20">
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-destructive text-white mb-1">
              CODE VIOLATION
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {task.label}
            </h3>
          </div>
        </div>
      </div>
      
      {/* Explanation */}
      <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
        <p className="text-sm text-foreground/90 leading-relaxed">
          {task.whyExplanation}
        </p>
        {task.agingMultiplier && task.agingMultiplier > 1 && (
          <p className="text-xs text-destructive font-medium mt-2">
            ⚠️ Accelerating aging by {task.agingMultiplier}x until fixed
          </p>
        )}
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <Button 
          onClick={onRemind}
          variant="outline"
          className="w-full gap-2 h-11 border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Bell className="w-4 h-4" />
          Set Reminder
        </Button>
        <Button 
          onClick={onSchedule}
          className="w-full gap-2 h-11 bg-destructive hover:bg-destructive/90 text-white"
        >
          <Phone className="w-4 h-4" />
          Have My Plumber Reach Out
        </Button>
      </div>
    </div>
  );
}

interface MaintenancePlanProps {
  onBack: () => void;
  onScheduleService: () => void;
  currentInputs: ForensicInputs;
  serviceHistory?: ServiceEvent[];
  onAddServiceEvent?: (event: ServiceEvent) => void;
}

export function MaintenancePlan({ onBack, onScheduleService, currentInputs, serviceHistory = [], onAddServiceEvent }: MaintenancePlanProps) {
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Get unit-specific service event types
  const serviceEventTypes = useMemo(() => getServiceEventTypes(currentInputs.fuelType), [currentInputs.fuelType]);
  
  // Add event form state - default to first available event type for this unit
  const [newEventType, setNewEventType] = useState(serviceEventTypes[0]?.value || 'inspection');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventCost, setNewEventCost] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  
  // Calculate metrics from algorithm
  const opterraResult = calculateOpterraRisk(currentInputs);
  const recommendation = opterraResult.verdict;
  const { failProb, descaleStatus } = opterraResult.metrics;
  const currentScore = failProbToHealthScore(failProb);
  
  // Unit type info for UI
  const isTanklessUnit = isTankless(currentInputs.fuelType);
  const isHybridUnit = currentInputs.fuelType === 'HYBRID';
  const unitTypeLabel = isTanklessUnit ? 'Tankless' : isHybridUnit ? 'Hybrid Heat Pump' : 'Tank';
  const brandLabel = currentInputs.manufacturer || 'Your';
  const ageLabel = currentInputs.calendarAge ? `${currentInputs.calendarAge}-Year-Old` : '';
  const capacityLabel = currentInputs.tankCapacity ? `${currentInputs.tankCapacity} Gal` : '';
  
  // Handle critical states - block maintenance plan for units that need replacement
  const isScaleLockout = isTanklessUnit && descaleStatus === 'lockout';
  const isCriticalOrReplace = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE' || isScaleLockout;
  
  if (isCriticalOrReplace) {
    return (
      <CriticalAssessmentPage
        inputs={currentInputs}
        opterraResult={opterraResult}
        onBack={onBack}
        onScheduleService={onScheduleService}
      />
    );
  }

  // Calculate unit-type-aware maintenance schedule
  const maintenanceSchedule = useMemo(
    () => calculateMaintenanceSchedule(currentInputs, opterraResult.metrics),
    [currentInputs, opterraResult.metrics]
  );
  
  // Get infrastructure violations (code violations) that need to be fixed first
  const infrastructureTasks = useMemo(
    () => getInfrastructureMaintenanceTasks(currentInputs, opterraResult.metrics),
    [currentInputs, opterraResult.metrics]
  );
  
  // Calculate total saved from service history
  const totalSaved = serviceHistory.reduce((sum, e) => {
    const healthGain = (e.healthScoreAfter || 0) - (e.healthScoreBefore || 0);
    return sum + (healthGain > 0 ? healthGain * 50 : 0);
  }, 0);

  // Calculate health score boost based on event type
  const getHealthBoost = (eventType: string): number => {
    const boosts: Record<string, number> = {
      flush: 5,
      anode_replacement: 8,
      descale: 7,
      filter_clean: 3,
      valve_install: 2,
      air_filter: 4,
      condensate: 2,
      inspection: 1,
      repair: 5,
    };
    return boosts[eventType] || 0;
  };

  const handleAddEvent = () => {
    if (!newEventDate) {
      toast.error('Please select a date');
      return;
    }
    
    const healthBoost = getHealthBoost(newEventType);
    
    const event: ServiceEvent = {
      id: `event-${Date.now()}`,
      type: newEventType as ServiceEvent['type'],
      date: newEventDate,
      cost: newEventCost ? parseFloat(newEventCost) : 0,
      notes: newEventNotes || undefined,
      healthScoreBefore: currentScore,
      healthScoreAfter: Math.min(100, currentScore + healthBoost),
    };
    
    onAddServiceEvent?.(event);
    toast.success('Service event added');
    setShowAddEventModal(false);
    
    // Reset form
    setNewEventType(serviceEventTypes[0]?.value || 'inspection');
    setNewEventDate(new Date().toISOString().split('T')[0]);
    setNewEventCost('');
    setNewEventNotes('');
  };

  const handleSchedule = () => {
    // Education has already been shown before this page, go directly to contact
    onScheduleService();
  };

  const handleRemind = () => {
    toast.success("Reminder set!", {
      description: "We'll notify you when maintenance is due"
    });
  };

  // Format a simple history list - unit-type aware
  const formatEventType = (type: string) => {
    const labels: Record<string, string> = {
      // Tank events
      flush: 'Tank Flush',
      anode_replacement: 'Anode Replacement',
      anode_check: 'Anode Check',
      // Tankless events
      descale: 'Descale Service',
      filter_clean: 'Filter Cleaning',
      valve_install: 'Isolation Valve Install',
      // Hybrid events
      air_filter: 'Air Filter Service',
      condensate: 'Condensate Drain Clear',
      // Common events
      inspection: 'Inspection',
      repair: 'Repair',
    };
    return labels[type] || type;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'flush':
      case 'condensate':
        return Droplets;
      case 'anode_replacement':
      case 'anode_check':
        return Shield;
      case 'descale':
        return Flame;
      case 'filter_clean':
        return Filter;
      case 'valve_install':
      case 'repair':
        return Wrench;
      case 'air_filter':
        return Wind;
      default:
        return Shield;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Get gradient colors based on health score
  const getGradientColors = () => {
    if (currentScore < 30) return 'from-destructive/20 via-destructive/10 to-transparent';
    if (currentScore < 60) return 'from-amber-500/20 via-amber-500/10 to-transparent';
    return 'from-emerald-500/20 via-emerald-500/10 to-transparent';
  };

  // Stats for the hero section
  const servicesCompleted = serviceHistory.length;
  const nextServiceMonths = maintenanceSchedule.primaryTask?.monthsUntilDue || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Gradient */}
      <div className={cn("relative overflow-hidden", `bg-gradient-to-b ${getGradientColors()}`)}>
        {/* Back button */}
        <div className="max-w-lg mx-auto px-4 pt-4">
          <motion.button 
            onClick={onBack} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </motion.button>
        </div>
        
        {/* Hero Content */}
        <div className="max-w-lg mx-auto px-4 py-6 pb-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Unit Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border mb-4">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                {ageLabel} {brandLabel} {unitTypeLabel} {capacityLabel && `· ${capacityLabel}`}
              </span>
            </div>
            
            <h1 className="text-xl font-bold text-foreground mb-2">
              Your Maintenance Plan
            </h1>
            <p className="text-sm text-muted-foreground">
              Personalized care to extend your unit's life
            </p>
          </motion.div>
          
          {/* Health Ring */}
          <motion.div 
            className="flex justify-center py-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <HealthRing score={currentScore} size="lg" />
          </motion.div>
          
          {/* Quick Stats Row */}
          <motion.div 
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg font-bold text-foreground">{servicesCompleted}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Services Done</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-foreground">${totalSaved > 0 ? totalSaved.toLocaleString() : '0'}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saved</p>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <History className="w-4 h-4 text-accent" />
              </div>
              <p className="text-lg font-bold text-foreground">
                {nextServiceMonths <= 0 ? 'Now' : `${Math.round(nextServiceMonths)}mo`}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Next Service</p>
            </div>
          </motion.div>
        </div>
      </div>
        
      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-5 pb-8">
        
        {/* Code Violations - ALWAYS FIRST when present */}
        {infrastructureTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-sm font-medium text-destructive uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Code Violations – Fix First
            </h2>
            <div className="space-y-3">
              {infrastructureTasks.map((task) => (
                <ViolationCard key={task.type} task={task} onSchedule={handleSchedule} onRemind={handleRemind} />
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Bundled Service Visit OR Individual Tasks */}
        {maintenanceSchedule.isBundled && maintenanceSchedule.bundledTasks ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: infrastructureTasks.length > 0 ? 0.6 : 0.5 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Recommended Service Visit
            </h2>
            <BundledServiceCard
              tasks={maintenanceSchedule.bundledTasks}
              bundleReason={maintenanceSchedule.bundleReason || 'Save time with one service call'}
              onSchedule={handleSchedule}
              onRemind={handleRemind}
            />
          </motion.div>
        ) : (
          <>
            {/* Primary Action Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Priority Maintenance
              </h2>
              <UnifiedMaintenanceCard
                task={maintenanceSchedule.primaryTask}
                onSchedule={handleSchedule}
                onRemind={handleRemind}
              />
            </motion.div>

            {/* Secondary Task */}
            {maintenanceSchedule.secondaryTask && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  Also Scheduled
                </h2>
                <div className="rounded-2xl border border-border bg-card p-4 hover:border-border/80 transition-colors">
                  <UpcomingMaintenanceTask task={maintenanceSchedule.secondaryTask} />
                </div>
              </motion.div>
            )}
          </>
        )}
        
        {/* Additional Tasks (for complex units like tankless needing valve install) */}
        {maintenanceSchedule.additionalTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
              Other Maintenance
            </h2>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border hover:border-border/80 transition-colors">
              {maintenanceSchedule.additionalTasks.map((task) => (
                <div key={task.type} className="px-4">
                  <UpcomingMaintenanceTask task={task} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Service History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between py-3 px-1 group">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-secondary/50 flex items-center justify-center">
                    <History className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Service History
                  </span>
                  {serviceHistory.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-xs text-primary font-medium">
                      {serviceHistory.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  historyOpen && "rotate-180"
                )} />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-3 pt-2">
              {serviceHistory.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {serviceHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((event, index) => {
                      const EventIcon = getEventIcon(event.type);
                      return (
                        <div 
                          key={event.id} 
                          className={cn(
                            "flex items-center gap-4 p-4 hover:bg-secondary/30 transition-colors",
                            index !== 0 && "border-t border-border"
                          )}
                        >
                          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                            <EventIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{formatEventType(event.type)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                          </div>
                          {event.cost !== undefined && event.cost > 0 && (
                            <span className="text-sm font-medium text-muted-foreground">${event.cost}</span>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-gradient-to-br from-secondary/20 to-transparent p-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Start Your Journey</p>
                  <p className="text-xs text-muted-foreground">Log past services to track maintenance and unlock savings insights</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2 border-dashed hover:border-solid hover:bg-secondary/30"
                onClick={() => setShowAddEventModal(true)}
              >
                <Plus className="w-4 h-4" />
                Log Past Service
              </Button>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>
      </div>
      {/* Add Event Modal */}
      <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log Past Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={newEventType} onValueChange={(v) => setNewEventType(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceEventTypes.map((eventType) => (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      {eventType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input 
                id="date" 
                type="date"
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost (optional)</Label>
              <Input 
                id="cost" 
                type="number"
                value={newEventCost}
                onChange={(e) => setNewEventCost(e.target.value)}
                placeholder="150"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes"
                value={newEventNotes}
                onChange={(e) => setNewEventNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={2}
              />
            </div>
            <Button onClick={handleAddEvent} className="w-full h-11">
              Add Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
