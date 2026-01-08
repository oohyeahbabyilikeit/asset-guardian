import { useState, useMemo } from 'react';
import { ArrowLeft, ShieldCheck, Calendar, PiggyBank, History, MessageSquare, Phone, AlertTriangle, Plus } from 'lucide-react';
import { MaintenanceChatInterface } from './MaintenanceChatInterface';
import { CostSavingsTracker } from './CostSavingsTracker';
import { MaintenanceCalendar } from './MaintenanceCalendar';
import { ServiceHistoryLog } from './ServiceHistoryLog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { calculateOpterraRisk, failProbToHealthScore, calculateHealth, ForensicInputs } from '@/lib/opterraAlgorithm';
import { ServiceEvent } from '@/types/serviceHistory';

interface MaintenancePlanProps {
  onBack: () => void;
  onScheduleService: () => void;
  currentInputs: ForensicInputs;
  serviceHistory?: ServiceEvent[];
  onAddServiceEvent?: (event: ServiceEvent) => void;
}

export function MaintenancePlan({ onBack, onScheduleService, currentInputs, serviceHistory = [], onAddServiceEvent }: MaintenancePlanProps) {
  // Calculate metrics first to check for critical state
  const opterraResult = calculateOpterraRisk(currentInputs);
  const recommendation = opterraResult.verdict;
  
  // Critical/Replace units should not be here - show locked out message
  const isCriticalOrReplace = recommendation.badge === 'CRITICAL' || recommendation.action === 'REPLACE';
  
  if (isCriticalOrReplace) {
    return (
      <div className="h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Maintenance Plan Unavailable</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          Your unit requires {recommendation.badge === 'CRITICAL' ? 'immediate attention' : 'replacement'} before a maintenance plan can be established.
        </p>
        <Button onClick={onScheduleService} className="bg-destructive hover:bg-destructive/90">
          <AlertTriangle className="w-4 h-4 mr-2" />
          View Required Action
        </Button>
        <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [addEventModalOpen, setAddEventModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    maintenanceType: [] as string[],
  });
  const [newEventForm, setNewEventForm] = useState({
    type: 'flush' as 'flush' | 'anode_replacement' | 'inspection' | 'repair',
    date: new Date().toISOString().split('T')[0],
    technicianName: '',
    cost: '',
    notes: '',
  });


  const { failProb } = opterraResult.metrics;
  const financial = opterraResult.financial;
  const currentScore = failProbToHealthScore(failProb);

  // Calculate maintenance timeline
  const healthMetrics = useMemo(() => calculateHealth(currentInputs), [currentInputs]);
  const { shieldLife, monthsToFlush, sedimentRate } = healthMetrics;

  // Cap maintenance timelines at 3 years (36 months)
  const MAX_MONTHS = 36;
  const cappedMonthsToFlush = monthsToFlush !== null ? Math.min(monthsToFlush, MAX_MONTHS) : null;
  const monthsToAnodeReplacement = shieldLife > 1 ? Math.round((shieldLife - 1) * 12) : 0;
  const cappedMonthsToAnode = Math.min(monthsToAnodeReplacement, MAX_MONTHS);

  // Calculate values for cost tracker
  const rawReplacementCost = financial?.estReplacementCost;
  const projectedReplacementCost = typeof rawReplacementCost === 'number' 
    ? { min: rawReplacementCost, max: rawReplacementCost * 1.5 } 
    : rawReplacementCost || { min: 2500, max: 4500 };

  // Use prop service history (combined with any existing events)
  const allServiceEvents = serviceHistory;

  // Calculate total saved from service history
  const totalSaved = allServiceEvents.reduce((sum, e) => {
    const healthGain = (e.healthScoreAfter || 0) - (e.healthScoreBefore || 0);
    return sum + (healthGain > 0 ? healthGain * 50 : 0);
  }, 0);

  const handleAddEvent = () => {
    if (!newEventForm.date) {
      toast.error('Please select a date');
      return;
    }
    
    const newEvent: ServiceEvent = {
      id: `event-${Date.now()}`,
      type: newEventForm.type,
      date: newEventForm.date,
      technicianName: newEventForm.technicianName || undefined,
      cost: parseFloat(newEventForm.cost) || 0,
      notes: newEventForm.notes || undefined,
      healthScoreBefore: currentScore,
      healthScoreAfter: newEventForm.type === 'flush' ? Math.min(100, currentScore + 5) : 
                        newEventForm.type === 'anode_replacement' ? Math.min(100, currentScore + 8) : currentScore,
    };
    
    onAddServiceEvent?.(newEvent);
    setAddEventModalOpen(false);
    setNewEventForm({
      type: 'flush',
      date: new Date().toISOString().split('T')[0],
      technicianName: '',
      cost: '',
      notes: '',
    });
    toast.success(`${newEventForm.type === 'flush' ? 'Tank Flush' : 
                    newEventForm.type === 'anode_replacement' ? 'Anode Replacement' : 
                    newEventForm.type === 'inspection' ? 'Inspection' : 'Repair'} logged successfully!`);
  };

  const toggleMaintenanceType = (type: string) => {
    setContactForm(prev => ({
      ...prev,
      maintenanceType: prev.maintenanceType.includes(type)
        ? prev.maintenanceType.filter(t => t !== type)
        : [...prev.maintenanceType, type]
    }));
  };

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.phone) {
      toast.error('Please enter your name and phone number');
      return;
    }
    toast.success('Service request submitted! A plumber will reach out soon.');
    setContactModalOpen(false);
    setContactForm({ name: '', phone: '', maintenanceType: [] });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground text-sm">Maintenance Plan</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto pb-24">
        <div className="p-3 max-w-md mx-auto w-full space-y-3">
          {/* Health Score Header */}
          <div className="clean-card p-4 bg-gradient-to-br from-green-500/10 via-card to-transparent border-green-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                  <ShieldCheck className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Your Protection Plan</p>
                  <p className="font-bold text-foreground text-2xl font-mono">{currentScore}<span className="text-muted-foreground text-sm">/100</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400 font-mono">
                  ${totalSaved.toLocaleString()}
                </p>
                <p className="text-[9px] text-muted-foreground">Total Saved</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
                style={{ width: `${currentScore}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Monitored since {new Date(Date.now() - currentInputs.calendarAge * 365 * 24 * 60 * 60 * 1000).getFullYear()} • {allServiceEvents.length} services completed
            </p>
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-10 bg-muted/50 p-1">
              <TabsTrigger value="calendar" className="text-[10px] data-[state=active]:bg-background">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                Schedule
              </TabsTrigger>
              <TabsTrigger value="savings" className="text-[10px] data-[state=active]:bg-background">
                <PiggyBank className="w-3.5 h-3.5 mr-1" />
                Savings
              </TabsTrigger>
              <TabsTrigger value="history" className="text-[10px] data-[state=active]:bg-background">
                <History className="w-3.5 h-3.5 mr-1" />
                History
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-[10px] data-[state=active]:bg-background">
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                Ask
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-3 tab-content-enter">
              <MaintenanceCalendar
                monthsToFlush={cappedMonthsToFlush}
                monthsToAnode={cappedMonthsToAnode}
                lastFlushDate="Jan 7, 2026"
                lastAnodeDate="Jun 15, 2025"
                onScheduleEarly={(type) => {
                  setContactModalOpen(true);
                  setContactForm(prev => ({
                    ...prev,
                    maintenanceType: [type === 'flush' ? 'Tank Flush' : 'Anode Check']
                  }));
                }}
              />
            </TabsContent>

            <TabsContent value="savings" className="mt-3 tab-content-enter">
              <CostSavingsTracker
                unitAge={currentInputs.calendarAge}
                maintenanceHistory={allServiceEvents}
                projectedReplacementCost={projectedReplacementCost}
                currentHealthScore={currentScore}
                metrics={healthMetrics}
                fuelType={currentInputs.fuelType}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-3 tab-content-enter">
              <ServiceHistoryLog
                events={allServiceEvents}
                onAddEvent={() => setAddEventModalOpen(true)}
                onExportPDF={() => toast.success('PDF export coming soon!')}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-3 tab-content-enter">
              <MaintenanceChatInterface
                flushMonths={cappedMonthsToFlush}
                anodeMonths={cappedMonthsToAnode}
                sedimentRate={sedimentRate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => setContactModalOpen(true)}
            className="w-full h-12 text-base font-semibold"
          >
            <Phone className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clean-card p-5 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Schedule Service</h3>
              </div>
              <button 
                onClick={() => setContactModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="contact-name" className="text-xs">Name *</Label>
                  <Input
                    id="contact-name"
                    placeholder="John Smith"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone" className="text-xs">Phone *</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs mb-2 block">Service Needed:</Label>
                <div className="flex flex-wrap gap-2">
                  {['Tank Flush', 'Anode Check', 'Full Inspection'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleMaintenanceType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        contactForm.maintenanceType.includes(type)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleContactSubmit} className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Request Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Event Modal */}
      {addEventModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="clean-card p-5 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Log Service Event</h3>
              </div>
              <button 
                onClick={() => setAddEventModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="event-type" className="text-xs">Service Type *</Label>
                <Select
                  value={newEventForm.type}
                  onValueChange={(value) => setNewEventForm(prev => ({ ...prev, type: value as typeof prev.type }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flush">Tank Flush</SelectItem>
                    <SelectItem value="anode_replacement">Anode Replacement</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="event-date" className="text-xs">Date *</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="event-cost" className="text-xs">Cost ($)</Label>
                  <Input
                    id="event-cost"
                    type="number"
                    placeholder="0"
                    value={newEventForm.cost}
                    onChange={(e) => setNewEventForm(prev => ({ ...prev, cost: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="event-tech" className="text-xs">Technician Name</Label>
                <Input
                  id="event-tech"
                  placeholder="Optional"
                  value={newEventForm.technicianName}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, technicianName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="event-notes" className="text-xs">Notes</Label>
                <Input
                  id="event-notes"
                  placeholder="Optional notes about the service"
                  value={newEventForm.notes}
                  onChange={(e) => setNewEventForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <Button onClick={handleAddEvent} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Log Service
              </Button>
              
              <p className="text-[10px] text-muted-foreground text-center">
                This will update your tank health calculations
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
