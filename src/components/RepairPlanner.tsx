import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Check, Sparkles, Wrench, AlertTriangle, CheckCircle2, TrendingDown, Calendar, ChevronDown, ChevronUp, Info, Bell, Phone, MessageSquare, Droplets, Shield, Clock, ShieldCheck, HelpCircle, DollarSign, PiggyBank, TrendingUp, Target } from 'lucide-react';
import { MaintenanceChatInterface } from './MaintenanceChatInterface';
import { Button } from '@/components/ui/button';
import { RepairOption, getAvailableRepairs, simulateRepairs } from '@/data/repairOptions';
import { calculateOpterraRisk, failProbToHealthScore, projectFutureHealth, ForensicInputs, calculateHealth } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RepairPlannerProps {
  onBack: () => void;
  onSchedule: (selectedRepairs: RepairOption[]) => void;
  currentInputs: ForensicInputs;
}

function useAnimatedNumber(target: number, duration: number = 400) {
  const [current, setCurrent] = useState(target);
  const [prevTarget, setPrevTarget] = useState(target);

  useEffect(() => {
    if (target === prevTarget) return;
    
    const startValue = current;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      
      setCurrent(Math.round(value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setPrevTarget(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, prevTarget, current, duration]);

  return current;
}

export function RepairPlanner({ onBack, onSchedule, currentInputs }: RepairPlannerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [doNothingOpen, setDoNothingOpen] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState<'now' | 'later' | null>(null);

  // Calculate metrics
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb, agingRate } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;
  const financial = opterraResult.financial;

  const currentScore = failProbToHealthScore(failProb);
  const currentAgingFactor = bioAge / currentInputs.calendarAge;
  const currentFailureProb = Math.round(failProb * 10) / 10;

  const replacementRequired = recommendation.action === 'REPLACE';
  
  // Distinguish between safety replacement and economic replacement
  const isSafetyReplacement = replacementRequired && recommendation.badge === 'CRITICAL';
  const isEconomicReplacement = replacementRequired && recommendation.badge !== 'CRITICAL';
  
  const availableRepairs = getAvailableRepairs(currentInputs, opterraResult.metrics, recommendation);

  // Auto-select replacement if required (safety only)
  useEffect(() => {
    if (isSafetyReplacement && !selectedIds.has('replace')) {
      setSelectedIds(new Set(['replace']));
    }
  }, [isSafetyReplacement]);

  const fullReplacement = availableRepairs.find(r => r.isFullReplacement);
  const individualRepairs = availableRepairs.filter(r => !r.isFullReplacement);
  const isReplacementSelected = selectedIds.has('replace');

  const toggleRepair = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (id === 'replace') {
        if (next.has('replace')) {
          next.delete('replace');
        } else {
          next.clear();
          next.add('replace');
        }
      } else {
        next.delete('replace');
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
      }
      return next;
    });
  };

  const selectedRepairs = availableRepairs.filter(r => selectedIds.has(r.id));

  // Simulate impact in real-time
  const result = useMemo(() => 
    simulateRepairs(currentScore, currentAgingFactor, currentFailureProb, selectedRepairs),
    [currentScore, currentAgingFactor, currentFailureProb, selectedRepairs]
  );

  const animatedNewScore = useAnimatedNumber(selectedRepairs.length > 0 ? result.newScore : currentScore);
  const scoreImprovement = result.newScore - currentScore;

  // Do Nothing projections
  const projection6 = projectFutureHealth(bioAge, agingRate, 6);
  const projection12 = projectFutureHealth(bioAge, agingRate, 12);
  const projection24 = projectFutureHealth(bioAge, agingRate, 24);

  const getStatusColor = (status: 'critical' | 'warning' | 'optimal') => {
    switch (status) {
      case 'critical': return 'text-red-400';
      case 'warning': return 'text-amber-400';
      case 'optimal': return 'text-green-400';
    }
  };

  const getStatusBg = (status: 'critical' | 'warning' | 'optimal') => {
    switch (status) {
      case 'critical': return 'bg-red-500/20 border-red-500/30';
      case 'warning': return 'bg-amber-500/20 border-amber-500/30';
      case 'optimal': return 'bg-green-500/20 border-green-500/30';
    }
  };

  const currentStatus = failProb >= 20 ? 'critical' : failProb >= 10 ? 'warning' : 'optimal';
  const projectedStatus = selectedRepairs.length > 0 ? result.newStatus : currentStatus;

  // Calculate maintenance timeline for optimal state
  const healthMetrics = useMemo(() => calculateHealth(currentInputs), [currentInputs]);
  const { shieldLife, monthsToFlush, flushStatus, sedimentRate } = healthMetrics;
  
  // Cap maintenance timelines at 3 years (36 months)
  const MAX_MONTHS = 36;
  const cappedMonthsToFlush = monthsToFlush !== null ? Math.min(monthsToFlush, MAX_MONTHS) : null;
  
  // Calculate months until anode needs replacement (when shieldLife < 1 year)
  const monthsToAnodeReplacement = shieldLife > 1 ? Math.round((shieldLife - 1) * 12) : 0;
  const cappedMonthsToAnode = Math.min(monthsToAnodeReplacement, MAX_MONTHS);
  const anodeNeedsAttention = shieldLife < 1;

  // State for reminder form
  const [reminderMode, setReminderMode] = useState<'none' | 'sms' | 'contact'>('none');
  const [reminderForm, setReminderForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    unitDetails: '',
    maintenanceType: [] as string[],
    preferredTime: '',
    notes: ''
  });

  const handleReminderSubmit = () => {
    if (reminderMode === 'sms') {
      if (!reminderForm.phone) {
        toast.error('Please enter your phone number');
        return;
      }
      toast.success('SMS reminder set! We\'ll text you when maintenance is due.');
    } else {
      if (!reminderForm.name || !reminderForm.phone) {
        toast.error('Please enter your name and phone number');
        return;
      }
      toast.success('Contact request submitted! A plumber will reach out soon.');
    }
    setReminderMode('none');
    setReminderForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      unitDetails: '',
      maintenanceType: [],
      preferredTime: '',
      notes: ''
    });
  };

  const toggleMaintenanceType = (type: string) => {
    setReminderForm(prev => ({
      ...prev,
      maintenanceType: prev.maintenanceType.includes(type)
        ? prev.maintenanceType.filter(t => t !== type)
        : [...prev.maintenanceType, type]
    }));
  };

  // Handle "No Repairs Needed" state with maintenance timeline
  if (recommendation.action === 'PASS' && availableRepairs.length === 0) {
    const hasUpcomingMaintenance = (cappedMonthsToFlush !== null && flushStatus === 'optimal') || cappedMonthsToAnode > 0;
    
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

        <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-3 px-4 flex-shrink-0">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-foreground text-sm">Maintenance Plan</h1>
            <div className="w-10" />
          </div>
        </header>

        <div className="relative flex-1 p-3 max-w-md mx-auto w-full flex flex-col gap-3 overflow-hidden">
          {/* Health Score at Top */}
          <div className="clean-card p-3 flex-shrink-0 bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plumbing Health Score</p>
                  <p className="font-bold text-foreground text-lg font-mono">{currentScore}<span className="text-muted-foreground text-sm">/100</span></p>
                </div>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${currentScore}%` }}
              />
            </div>
          </div>

          {/* Combined Maintenance & Monitoring Card */}
          <div className="clean-card p-4 flex-shrink-0">
            {/* Recommended Maintenance Section */}
            {hasUpcomingMaintenance && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">Recommended Maintenance</h3>
                </div>
                
                <div className="space-y-2 mb-4">
                  {/* Tank Flush */}
                  {cappedMonthsToFlush !== null && flushStatus === 'optimal' && (
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">Tank Flush</p>
                            <p className="text-[10px] text-muted-foreground">Remove sediment</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-foreground text-sm">
                            {cappedMonthsToFlush >= 12 
                              ? `${(cappedMonthsToFlush / 12).toFixed(1)} yrs` 
                              : `${cappedMonthsToFlush} mo`}
                          </p>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1.5 pl-[42px]">
                        Last performed: Jan 7, 2026 by Mike T.
                      </p>
                    </div>
                  )}

                  {cappedMonthsToAnode > 0 && !anodeNeedsAttention && (
                    <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">Anode Rod Check</p>
                            <p className="text-[10px] text-muted-foreground">Inspect anode</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-semibold text-foreground text-sm">
                            {cappedMonthsToAnode >= 12 
                              ? `${(cappedMonthsToAnode / 12).toFixed(1)} yrs` 
                              : `${cappedMonthsToAnode} mo`}
                          </p>
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1.5 pl-[42px]">
                        Last performed: Jan 7, 2026 by Mike T.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-border/50 pt-3" />
              </>
            )}

            {/* Protection Status - Replaces "Set a Reminder" */}
            {reminderMode === 'none' && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">Auto-Reminders Active</p>
                    <p className="text-[10px] text-muted-foreground">We'll text you automatically when service is due. No action needed.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setReminderMode('contact')}
                  className="flex items-center justify-center gap-1.5 mt-2 w-full py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  Need help sooner? Contact Plumber Support
                </button>
              </>
            )}

            {/* SMS Reminder Form - Inline */}
            {reminderMode === 'sms' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">SMS Reminder</h3>
                  </div>
                  <button 
                    onClick={() => setReminderMode('none')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sms-phone" className="text-xs">Phone Number *</Label>
                    <Input
                      id="sms-phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={reminderForm.phone}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-2 block">Remind me about:</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Tank Flush', 'Anode Check', 'Annual Inspection'].map(type => (
                        <button
                          key={type}
                          onClick={() => toggleMaintenanceType(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            reminderForm.maintenanceType.includes(type)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button onClick={handleReminderSubmit} className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Set Reminder
                  </Button>
                </div>
              </>
            )}

            {/* Contact Request Form - Inline */}
            {reminderMode === 'contact' && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-foreground">Request a Call</h3>
                  </div>
                  <button 
                    onClick={() => setReminderMode('none')}
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
                        value={reminderForm.name}
                        onChange={(e) => setReminderForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact-phone" className="text-xs">Phone *</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={reminderForm.phone}
                        onChange={(e) => setReminderForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-email" className="text-xs">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      value={reminderForm.email}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-address" className="text-xs">Address</Label>
                    <Input
                      id="contact-address"
                      placeholder="123 Main St, City, State"
                      value={reminderForm.address}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, address: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-unit" className="text-xs">Water Heater Details</Label>
                    <Input
                      id="contact-unit"
                      placeholder="e.g., 50 gal gas, located in garage"
                      value={reminderForm.unitDetails}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, unitDetails: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs mb-2 block">Service Needed:</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Tank Flush', 'Anode Replacement', 'Full Inspection', 'Repair Quote', 'Other'].map(type => (
                        <button
                          key={type}
                          onClick={() => toggleMaintenanceType(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            reminderForm.maintenanceType.includes(type)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-time" className="text-xs">Preferred Contact Time</Label>
                    <Input
                      id="contact-time"
                      placeholder="e.g., Weekday mornings"
                      value={reminderForm.preferredTime}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="contact-notes" className="text-xs">Additional Notes</Label>
                    <Textarea
                      id="contact-notes"
                      placeholder="Any other details..."
                      value={reminderForm.notes}
                      onChange={(e) => setReminderForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                  
                  <Button onClick={handleReminderSubmit} className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Request Contact
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Chat Interface - Now at bottom */}
          <div className="mb-6">
            <MaintenanceChatInterface
              flushMonths={cappedMonthsToFlush}
              anodeMonths={cappedMonthsToAnode}
              sedimentRate={sedimentRate}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground">
            {isEconomicReplacement ? 'Plan Your Upgrade' : 'Understanding Your Options'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Sticky Impact Preview - Only show for non-economic replacement */}
        {!isEconomicReplacement && (
          <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-4 bg-background/95 backdrop-blur-sm">
            <div className="clean-card border-primary/30">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 text-center">Impact Preview</p>
              
              <div className="flex items-center justify-center gap-4">
                {/* Current Score */}
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-xl border-2 ${getStatusBg(currentStatus)} flex flex-col items-center justify-center`}>
                    <span className={`text-xl font-bold font-data ${getStatusColor(currentStatus)}`}>{currentScore}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Now</p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center">
                  <div className={`text-xl transition-colors duration-300 ${selectedRepairs.length > 0 ? 'text-primary' : 'text-muted-foreground/30'}`}>→</div>
                  {selectedRepairs.length > 0 && scoreImprovement > 0 && (
                    <span className="text-xs text-green-400 font-medium">+{scoreImprovement}</span>
                  )}
                </div>

                {/* Projected Score */}
                <div className="text-center">
                  <div 
                    className={`w-16 h-16 rounded-xl border-2 transition-all duration-300 ${getStatusBg(projectedStatus)} flex flex-col items-center justify-center`}
                    style={{
                      boxShadow: selectedRepairs.length > 0 && projectedStatus === 'optimal' 
                        ? '0 0 20px -4px rgba(34, 197, 94, 0.4)' 
                        : undefined
                    }}
                  >
                    <span className={`text-xl font-bold font-data transition-colors duration-300 ${getStatusColor(projectedStatus)}`}>
                      {animatedNewScore}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">After</p>
                </div>
              </div>

              {selectedRepairs.length > 0 && !isReplacementSelected && (
                <div className="flex items-center justify-center gap-4 mt-3 text-xs">
                  <span className="text-muted-foreground">
                    <TrendingDown className="w-3 h-3 inline mr-1" />
                    Aging: <span className="text-green-400">{result.newAgingFactor.toFixed(1)}x</span>
                  </span>
                  <span className="text-muted-foreground">
                    Risk: <span className="text-green-400">{result.newFailureProb.toFixed(1)}%</span>
                  </span>
                </div>
              )}

              {isReplacementSelected && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Sparkles className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">All risks eliminated with new unit</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Replacement Banner - Different for Safety vs Economic */}
        {isSafetyReplacement && (
          <div className="mb-4 p-4 rounded-xl border-2 border-red-500/50 bg-red-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-400 text-sm mb-1">Replacement Required</p>
                <p className="text-xs text-muted-foreground">
                  {recommendation.reason} Individual repairs are not available for this unit.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Economic Replacement - Proactive Planning Framing */}
        {isEconomicReplacement && (
          <>
            {/* Upgrade Recommended Banner */}
            <div className="mb-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-primary text-sm mb-1">Upgrade Recommended</p>
                  <p className="text-xs text-muted-foreground">
                    {recommendation.reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Why Repairs Aren't Recommended */}
            <div className="clean-card mb-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-foreground">Why Repairs Aren't Recommended</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Unit is aging at <strong className="text-foreground">{agingRate.toFixed(1)}x</strong> normal rate</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Biological wear: <strong className="text-foreground">{Math.round(bioAge)} years</strong> on a {currentInputs.calendarAge}-year unit</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span className="text-muted-foreground">Repairs would extend life by only <strong className="text-foreground">1-2 years</strong> at current wear rate</span>
                </div>
              </div>
            </div>

            {/* Financial Planning Section */}
            <div className="clean-card mb-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <PiggyBank className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Financial Planning</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Replacement Cost</span>
                  <span className="font-bold text-foreground">${financial.estReplacementCost.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Target Replacement</span>
                  <span className="font-medium text-foreground">{financial.targetReplacementDate}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Savings Goal</span>
                  <span className="font-medium text-primary">${financial.monthlyBudget}/mo</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50">
                {financial.recommendation}
              </p>
            </div>

            {/* Timeline Options */}
            <div className="space-y-3 mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Choose Your Timeline</p>
              
              {/* Option 1: Replace Now */}
              <button
                onClick={() => {
                  setSelectedTimeline('now');
                  setSelectedIds(new Set(['replace']));
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTimeline === 'now'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/50 hover:border-primary/50'
                }`}
                style={{
                  boxShadow: selectedTimeline === 'now' ? '0 0 20px -4px hsl(var(--primary) / 0.4)' : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedTimeline === 'now' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}>
                    {selectedTimeline === 'now' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">Replace Now</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Schedule on your terms, avoid emergency pricing</p>
                    <p className="text-xs text-green-400 mt-1.5">Best for peace of mind</p>
                  </div>
                </div>
              </button>
              
              {/* Option 2: Replace Within 12 Months */}
              <button
                onClick={() => {
                  setSelectedTimeline('later');
                  setSelectedIds(new Set(['replace']));
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedTimeline === 'later'
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card/50 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    selectedTimeline === 'later' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                  }`}>
                    {selectedTimeline === 'later' && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-foreground mb-1">Replace Within 12 Months</div>
                    <p className="text-sm text-muted-foreground">Start saving now, schedule when ready</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Save <span className="text-primary font-medium">${financial.monthlyBudget}/mo</span> to prepare
                    </p>
                  </div>
                </div>
              </button>

              {/* Continue Monitoring Option - Collapsible */}
              <Collapsible open={doNothingOpen} onOpenChange={setDoNothingOpen}>
                <CollapsibleTrigger asChild>
                  <button className="w-full clean-card border-zinc-700/50 bg-zinc-900/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">I'll take my chances</span>
                      </div>
                      {doNothingOpen ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="clean-card border-red-500/30 bg-red-500/5 -mt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-foreground">Projected Decline</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Without replacement, here's what to expect:
                    </p>
                    <div className="space-y-3">
                      {[
                        { months: 6, ...projection6 },
                        { months: 12, ...projection12 },
                        { months: 24, ...projection24 },
                      ].map((projection) => (
                        <div key={projection.months} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">In {projection.months} months</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className={`text-sm font-bold font-data ${projection.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                                {projection.healthScore}
                              </span>
                              <span className="text-xs text-muted-foreground"> score</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold font-data text-red-400">
                                {projection.failProb.toFixed(0)}%
                              </span>
                              <span className="text-xs text-muted-foreground"> risk</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-red-500/20">
                      <p className="text-xs text-red-400">
                        At {agingRate.toFixed(1)}x aging rate, failure risk increases significantly each year.
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}

        {/* Full Replacement Option - Only for SAFETY replacement */}
        {fullReplacement && isSafetyReplacement && (
          <button
            onClick={() => toggleRepair(fullReplacement.id)}
            className={`w-full text-left mb-4 p-4 rounded-xl border-2 transition-all ${
              isReplacementSelected
                ? 'border-red-500 bg-red-500/10'
                : 'border-red-500/50 bg-red-500/5 hover:border-red-500/70'
            }`}
            style={{
              boxShadow: isReplacementSelected ? '0 0 20px -4px rgba(239, 68, 68, 0.4)' : undefined,
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isReplacementSelected ? 'border-red-500 bg-red-500 text-white' : 'border-red-500/50'
              }`}>
                {isReplacementSelected && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-foreground">{fullReplacement.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    REQUIRED
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{fullReplacement.description}</p>
              </div>
            </div>
          </button>
        )}

        {/* Individual Repairs */}
        {!replacementRequired && individualRepairs.length > 0 && (
          <div className="space-y-3 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Repairs</p>
            {individualRepairs.map((repair) => {
              const isSelected = selectedIds.has(repair.id);
              return (
                <button
                  key={repair.id}
                  onClick={() => toggleRepair(repair.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card/50 hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{repair.name}</span>
                          <Tooltip>
                            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] p-3">
                              <p className="font-semibold text-foreground text-xs mb-2">Impact Breakdown</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Health Score</span>
                                  <span className="text-green-400">+{repair.impact.healthScoreBoost} pts</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Aging Slowdown</span>
                                  <span className="text-green-400">-{repair.impact.agingFactorReduction}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Failure Risk</span>
                                  <span className="text-green-400">-{repair.impact.failureProbReduction}%</span>
                                </div>
                                <div className="pt-1.5 border-t border-border mt-1.5">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Est. Lifespan Ext.</span>
                                    <span className="text-primary font-medium">+{Math.round(repair.impact.agingFactorReduction / 10)}-{Math.round(repair.impact.agingFactorReduction / 6)} mo</span>
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-xs text-green-400/80">+{repair.impact.healthScoreBoost} pts</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{repair.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Continue Monitoring Projection - Collapsible */}
        {!replacementRequired && (
          <Collapsible open={doNothingOpen} onOpenChange={setDoNothingOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full clean-card border-zinc-700/50 bg-zinc-900/30 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">If You Continue Monitoring</span>
                  </div>
                  {doNothingOpen ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="clean-card border-zinc-700/50 bg-zinc-900/30 mb-4 -mt-2">
                <p className="text-xs text-muted-foreground mb-4">
                  Without maintenance, here's the projected timeline:
                </p>
                <div className="space-y-3">
                  {[
                    { months: 6, ...projection6 },
                    { months: 12, ...projection12 },
                    { months: 24, ...projection24 },
                  ].map((projection) => (
                    <div key={projection.months} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">In {projection.months} months</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`text-sm font-bold font-data ${projection.healthScore >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                            {projection.healthScore}
                          </span>
                          <span className="text-xs text-muted-foreground"> score</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold font-data text-red-400">
                            {projection.failProb.toFixed(0)}%
                          </span>
                          <span className="text-xs text-muted-foreground"> risk</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Cost Estimate */}
        {selectedRepairs.length > 0 && (
          <div className="clean-card mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Cost</span>
              <span className="font-semibold text-foreground">
                ${result.totalCostMin.toLocaleString()} - ${result.totalCostMax.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Warning Note */}
        {selectedRepairs.length > 0 && !isReplacementSelected && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80">
              These repairs extend life but don't reset the {currentInputs.calendarAge}-year paper age.
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => onSchedule(selectedRepairs)}
            disabled={selectedRepairs.length === 0 && !selectedTimeline}
            className="w-full h-14 text-base font-semibold"
          >
            {isEconomicReplacement 
              ? (selectedTimeline === 'now' ? 'Get Upgrade Options' : selectedTimeline === 'later' ? 'Start My Savings Plan' : 'Choose a Timeline')
              : isReplacementSelected 
                ? 'Request Replacement Quote' 
                : 'Schedule These Repairs'}
          </Button>
        </div>
      </div>
    </div>
  );
}
