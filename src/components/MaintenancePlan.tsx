import { ArrowLeft, Plus, History, ChevronDown, Droplets, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { ForensicInputs, calculateOpterraRisk, calculateHealth, failProbToHealthScore } from '@/lib/opterraAlgorithm';
import { ServiceEvent } from '@/types/serviceHistory';
import { SmartMaintenanceCard, UpcomingTask, HealthSummary } from './SmartMaintenanceCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface MaintenancePlanProps {
  onBack: () => void;
  onScheduleService: () => void;
  currentInputs: ForensicInputs;
  serviceHistory?: ServiceEvent[];
  onAddServiceEvent?: (event: ServiceEvent) => void;
}

export function MaintenancePlan({ onBack, onScheduleService, currentInputs, serviceHistory = [], onAddServiceEvent }: MaintenancePlanProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  
  // Add event form state
  const [newEventType, setNewEventType] = useState<'flush' | 'anode_replacement' | 'inspection' | 'repair'>('flush');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventCost, setNewEventCost] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  
  // Calculate metrics from algorithm
  const opterraResult = calculateOpterraRisk(currentInputs);
  const recommendation = opterraResult.verdict;
  const { failProb } = opterraResult.metrics;
  const currentScore = failProbToHealthScore(failProb);
  
  // Handle critical states
  const isCriticalOrReplace = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE';
  
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
              Your unit requires {recommendation.badge === 'CRITICAL' ? 'immediate attention' : 'replacement'} before a maintenance plan can be established.
            </p>
            <Button onClick={onScheduleService} variant="destructive" className="w-full">
              View Required Action
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate maintenance timeline
  const healthMetrics = useMemo(() => calculateHealth(currentInputs), [currentInputs]);
  const { shieldLife, monthsToFlush, sedimentLbs, flushStatus } = healthMetrics;

  // Cap maintenance timelines at 3 years (36 months)
  // But if flushStatus is 'due' or 'lockout', flush is needed NOW (0 months)
  const MAX_MONTHS = 36;
  const isFlushDueNow = flushStatus === 'due' || flushStatus === 'lockout';
  const cappedMonthsToFlush = isFlushDueNow ? 0 : (monthsToFlush !== null ? Math.min(Math.max(0, monthsToFlush), MAX_MONTHS) : 6);
  const monthsToAnodeReplacement = shieldLife > 1 ? Math.round((shieldLife - 1) * 12) : 0;
  const cappedMonthsToAnode = Math.min(Math.max(0, monthsToAnodeReplacement), MAX_MONTHS);
  
  // Determine which task is next
  const flushIsNext = cappedMonthsToFlush <= cappedMonthsToAnode;
  
  // Calculate total saved from service history
  const totalSaved = serviceHistory.reduce((sum, e) => {
    const healthGain = (e.healthScoreAfter || 0) - (e.healthScoreBefore || 0);
    return sum + (healthGain > 0 ? healthGain * 50 : 0);
  }, 0);

  const handleAddEvent = () => {
    if (!newEventDate) {
      toast.error('Please select a date');
      return;
    }
    
    const event: ServiceEvent = {
      id: `event-${Date.now()}`,
      type: newEventType,
      date: newEventDate,
      cost: newEventCost ? parseFloat(newEventCost) : 0,
      notes: newEventNotes || undefined,
      healthScoreBefore: currentScore,
      healthScoreAfter: newEventType === 'flush' ? Math.min(100, currentScore + 5) : 
                        newEventType === 'anode_replacement' ? Math.min(100, currentScore + 8) : currentScore,
    };
    
    onAddServiceEvent?.(event);
    toast.success('Service event added');
    setShowAddEventModal(false);
    
    // Reset form
    setNewEventType('flush');
    setNewEventDate(new Date().toISOString().split('T')[0]);
    setNewEventCost('');
    setNewEventNotes('');
  };

  const handleSchedule = () => {
    setShowContactModal(true);
  };

  const handleRemind = () => {
    toast.success("Reminder set!", {
      description: "We'll notify you when maintenance is due"
    });
  };

  const handleContactSubmit = () => {
    if (!contactName || !contactPhone) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Service request submitted!', {
      description: "A technician will contact you within 24 hours"
    });
    setShowContactModal(false);
    setContactName('');
    setContactPhone('');
  };

  // Format a simple history list
  const formatEventType = (type: string) => {
    switch (type) {
      case 'flush': return 'Tank Flush';
      case 'anode_replacement': return 'Anode Replacement';
      case 'anode_check': return 'Anode Check';
      case 'inspection': return 'Inspection';
      case 'repair': return 'Repair';
      default: return type;
    }
  };

  const getEventIcon = (type: string) => {
    if (type === 'flush') return Droplets;
    return Shield;
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
        
        {/* Warm Intro - Celebrate their good standing */}
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-3">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Your system is in great shape</h2>
          <p className="text-sm text-muted-foreground">
            A little preventive care goes a long way. Here's how to keep it that way.
          </p>
        </div>
        
        {/* Health Summary */}
        <HealthSummary 
          healthScore={currentScore}
          totalSaved={totalSaved}
          servicesCompleted={serviceHistory.length}
        />
        
        {/* Primary Action Card */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Priority Maintenance
          </h2>
          <SmartMaintenanceCard
            taskType={flushIsNext ? 'flush' : 'anode'}
            monthsUntilDue={flushIsNext ? cappedMonthsToFlush : cappedMonthsToAnode}
            sedimentLbs={sedimentLbs}
            waterHardnessGPG={currentInputs.hardnessGPG}
            usageType={currentInputs.usageType}
            onSchedule={handleSchedule}
            onRemind={handleRemind}
          />
        </div>

        {/* Coming Up Next */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Also Scheduled
          </h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <UpcomingTask 
              taskType={flushIsNext ? 'anode' : 'flush'}
              timeframe={`${Math.round(flushIsNext ? cappedMonthsToAnode : cappedMonthsToFlush)} months`}
            />
          </div>
        </div>

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

      {/* Contact Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={contactName} 
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={contactPhone} 
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="h-11"
              />
            </div>
            <Button onClick={handleContactSubmit} className="w-full h-11">
              Request Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Event Modal */}
      <Dialog open={showAddEventModal} onOpenChange={setShowAddEventModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Log Past Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={newEventType} onValueChange={(v: any) => setNewEventType(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flush">Tank Flush</SelectItem>
                  <SelectItem value="anode_replacement">Anode Replacement</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
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
