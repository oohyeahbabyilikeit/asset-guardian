import { ArrowLeft, Plus, History, ChevronDown, Droplets, Shield, Flame, Filter, Wrench, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { ForensicInputs, calculateOpterraRisk, failProbToHealthScore, isTankless } from '@/lib/opterraAlgorithm';
import { ServiceEvent } from '@/types/serviceHistory';
import { UnifiedMaintenanceCard, UpcomingMaintenanceTask } from './UnifiedMaintenanceCard';
import { BundledServiceCard } from './BundledServiceCard';
import { calculateMaintenanceSchedule, getServiceEventTypes } from '@/lib/maintenanceCalculations';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { EducationPage } from './EducationPage';
import { ContactFormPage } from './ContactFormPage';
import { cn } from '@/lib/utils';

interface MaintenancePlanProps {
  onBack: () => void;
  onScheduleService: () => void;
  currentInputs: ForensicInputs;
  serviceHistory?: ServiceEvent[];
  onAddServiceEvent?: (event: ServiceEvent) => void;
}

export function MaintenancePlan({ onBack, onScheduleService, currentInputs, serviceHistory = [], onAddServiceEvent }: MaintenancePlanProps) {
  const [flowStep, setFlowStep] = useState<'none' | 'education' | 'contact'>('none');
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
  
  // Handle critical states - block maintenance plan for units that need replacement
  const isScaleLockout = isTanklessUnit && descaleStatus === 'lockout';
  const isCriticalOrReplace = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE' || isScaleLockout;
  
  if (isCriticalOrReplace) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
          
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Maintenance Plan Unavailable</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Your {unitTypeLabel.toLowerCase()} unit requires {recommendation.badge === 'CRITICAL' ? 'immediate attention' : 'replacement'} before a maintenance plan can be established.
            </p>
            <Button onClick={onScheduleService} variant="destructive" className="w-full">
              View Required Action
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate unit-type-aware maintenance schedule
  const maintenanceSchedule = useMemo(
    () => calculateMaintenanceSchedule(currentInputs, opterraResult.metrics),
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
    setFlowStep('education');
  };

  const handleRemind = () => {
    toast.success("Reminder set!", {
      description: "We'll notify you when maintenance is due"
    });
  };

  const handleEducationContinue = () => {
    setFlowStep('contact');
  };

  const handleLeadCaptureComplete = () => {
    setFlowStep('none');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Keeping Things Running</h1>
            <p className="text-xs text-muted-foreground">Your personalized care plan</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-5 pb-8">
        
        {/* Compact Health Summary with Score Badge */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl",
              currentScore < 30 ? 'bg-destructive/10 text-destructive' : 
              currentScore < 60 ? 'bg-amber-500/10 text-amber-500' : 
              'bg-emerald-500/10 text-emerald-500'
            )}>
              {currentScore}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Health Score</p>
              <p className="text-xs text-muted-foreground">
                {currentScore < 30 ? 'Needs attention' : 
                 currentScore < 60 ? 'Fair condition' : 
                 'Good condition'}
              </p>
            </div>
          </div>
          {serviceHistory.length > 0 && (
            <div className="text-right">
              <p className="text-sm font-medium text-primary">${totalSaved.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Saved</p>
            </div>
          )}
        </div>
        
        {/* Bundled Service Visit OR Individual Tasks */}
        {maintenanceSchedule.isBundled && maintenanceSchedule.bundledTasks ? (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Recommended Service Visit
            </h2>
            <BundledServiceCard
              tasks={maintenanceSchedule.bundledTasks}
              bundleReason={maintenanceSchedule.bundleReason || 'Save time with one service call'}
              onSchedule={handleSchedule}
              onRemind={handleRemind}
            />
          </div>
        ) : (
          <>
            {/* Primary Action Card */}
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Priority Maintenance
              </h2>
              <UnifiedMaintenanceCard
                task={maintenanceSchedule.primaryTask}
                onSchedule={handleSchedule}
                onRemind={handleRemind}
              />
            </div>

            {/* Secondary Task */}
            {maintenanceSchedule.secondaryTask && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
                  Also Scheduled
                </h2>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <UpcomingMaintenanceTask task={maintenanceSchedule.secondaryTask} />
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Additional Tasks (for complex units like tankless needing valve install) */}
        {maintenanceSchedule.additionalTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Other Maintenance
            </h2>
            <div className="rounded-2xl border border-border bg-card divide-y divide-border">
              {maintenanceSchedule.additionalTasks.map((task) => (
                <div key={task.type} className="px-4">
                  <UpcomingMaintenanceTask task={task} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service History */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between py-3 px-1 group">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Service History
                </span>
                {serviceHistory.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-xs text-muted-foreground">
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
                          "flex items-center gap-4 p-4",
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
              <div className="rounded-2xl border border-dashed border-border bg-secondary/20 p-6 text-center">
                <History className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No service history yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Log past services to track your maintenance</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => setShowAddEventModal(true)}
            >
              <Plus className="w-4 h-4" />
              Log Past Service
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Education Page - Full Screen */}
      {flowStep === 'education' && (
        <div className="fixed inset-0 z-50 bg-background">
          <EducationPage
            urgencyLevel="green"
            inputs={currentInputs}
            metrics={opterraResult.metrics}
            onContinue={handleEducationContinue}
            onBack={() => setFlowStep('none')}
          />
        </div>
      )}

      {/* Contact Form - Full Screen */}
      {flowStep === 'contact' && (
        <div className="fixed inset-0 z-50 bg-background">
          <ContactFormPage
            captureSource="maintenance_notify"
            captureContext={{
              fuelType: currentInputs.fuelType,
              calendarAge: currentInputs.calendarAge,
              healthScore: currentScore,
              primaryTask: maintenanceSchedule.primaryTask?.type,
            }}
            urgencyLevel="green"
            onComplete={handleLeadCaptureComplete}
            onBack={() => setFlowStep('education')}
          />
        </div>
      )}

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
