import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, AlertTriangle, CheckCircle, Clock, Eye, CircleAlert, Wrench, Lightbulb, Info, Bell, MessageSquare, Mail, Droplets, Shield, Loader2, Sparkles, Camera } from 'lucide-react';
import { ForensicInputs, OpterraMetrics, calculateOpterraRisk } from '@/lib/opterraAlgorithm';
import type { IssueCategory } from '@/lib/infrastructureIssues';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { CorrtexChatOverlay } from '@/components/CorrtexChatOverlay';
import { calculateMaintenanceSchedule, MaintenanceTask } from '@/lib/maintenanceCalculations';
import { submitLead, markLeadCaptured, hasLeadBeenCaptured } from '@/lib/leadService';
import { toast } from 'sonner';
import { useReplacementRationale } from '@/hooks/useReplacementRationale';

// Local type for verdict action - matches Recommendation interface
type VerdictAction = 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS';

// Priority finding from infrastructure issues
interface PriorityFinding {
  id: string;
  name: string;
  friendlyName: string;
  description: string;
  category: IssueCategory;
  severity: 'critical' | 'warning' | 'info';
}

// Preview of what's on the next page
interface NextPagePreview {
  violationCount: number;
  urgentActionCount: number;
  addOnCount: number;
  hasReplacement: boolean;
  isUrgentReplacement: boolean;
}

interface OptionsAssessmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  verdictAction: VerdictAction;
  healthScore: number;
  // Priority findings for education
  priorityFindings?: PriorityFinding[];
  // Preview of next page content
  nextPagePreview?: NextPagePreview;
  // PASS verdict props
  isPassVerdict?: boolean;
  verdictReason?: string;
  verdictTitle?: string;
  yearsRemaining?: number;
}

type UrgencyTier = 'critical' | 'attention' | 'healthy' | 'monitor';

function getUrgencyTier(
  healthScore: number, 
  verdictAction: VerdictAction, 
  isPassVerdict: boolean,
  priorityFindings: PriorityFinding[]
): UrgencyTier {
  // REPLACE verdict always takes priority - the algorithm has spoken
  if (verdictAction === 'REPLACE') return 'critical';
  
  // Check for critical findings - violations override PASS verdict
  const hasCriticalFinding = priorityFindings.some(f => f.severity === 'critical');
  const hasWarningFinding = priorityFindings.some(f => f.severity === 'warning');
  
  if (hasCriticalFinding) return 'critical';  // Violations = immediate attention
  if (hasWarningFinding) return 'attention';  // Infrastructure issues = proactive
  
  // Only show "stable" if PASS verdict AND no findings
  if (isPassVerdict) return 'monitor';
  
  // Existing logic for health score thresholds
  if (healthScore < 40) return 'critical';
  if (healthScore < 70 || verdictAction === 'REPAIR') return 'attention';
  return 'healthy';
}

function getRecommendation(tier: UrgencyTier, verdictAction?: VerdictAction) {
  switch (tier) {
    case 'critical':
      // Use replacement-specific language when REPLACE is the verdict
      const isReplacement = verdictAction === 'REPLACE';
      return {
        headline: isReplacement 
          ? 'Replacement Recommended' 
          : 'Immediate Attention Needed',
        subheadline: isReplacement
          ? 'Your water heater has reached the end of its serviceable life.'
          : 'We found issues that need prompt professional attention.',
        icon: AlertTriangle,
        iconColor: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/40',
      };
    case 'attention':
      return {
        headline: 'Proactive Maintenance Recommended',
        subheadline: 'Your unit is showing signs that warrant attention to prevent future issues.',
        icon: Clock,
        iconColor: 'text-amber-400',
        bgColor: 'bg-amber-950/40',
        borderColor: 'border-amber-800/30',
      };
    case 'monitor':
      return {
        headline: 'Your Unit Is Stable',
        subheadline: 'No service is recommended at this time. Continue monitoring.',
        icon: Eye,
        iconColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
      };
    case 'healthy':
      return {
        headline: 'Routine Maintenance Available',
        subheadline: 'Your water heater is in good condition. Regular maintenance will keep it that way.',
        icon: CheckCircle,
        iconColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
      };
  }
}

// Get styling for priority finding cards based on category/severity - humanized labels
function getFindingStyle(finding: PriorityFinding) {
  if (finding.category === 'VIOLATION' || finding.severity === 'critical') {
    return {
      label: 'NEEDS ATTENTION',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/40',
      labelColor: 'text-destructive',
      icon: CircleAlert,
    };
  }
  if (finding.category === 'INFRASTRUCTURE' || finding.severity === 'warning') {
    return {
      label: 'WORTH ADDRESSING',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/40',
      labelColor: 'text-warning',
      icon: Wrench,
    };
  }
  return {
    label: 'RECOMMENDATION',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/40',
    labelColor: 'text-accent-foreground',
    icon: Lightbulb,
  };
}

// Map finding IDs to educational topics
function getEducationalTopic(findingId: string): EducationalTopic | null {
  const topicMap: Record<string, EducationalTopic> = {
    // Expansion tank issues
    'exp_tank_required': 'thermal-expansion',
    'exp_tank_failed': 'thermal-expansion',
    'EXP_TANK_MISSING': 'thermal-expansion',
    'EXP_TANK_FAILED': 'thermal-expansion',
    // PRV issues
    'prv_failed': 'prv',
    'prv_critical': 'prv',
    'prv_recommended': 'prv',
    'PRV_MISSING': 'prv',
    'PRV_FAILED': 'prv',
    // Pressure issues
    'PRESSURE_HIGH': 'pressure',
    'PRESSURE_CRITICAL': 'pressure',
    // Anode issues
    'ANODE_DEPLETED': 'anode-rod',
    'ANODE_FUSED': 'anode-rod-fused',
    // Sediment issues
    'SEDIMENT_HEAVY': 'sediment',
    'SEDIMENT_RISKY': 'sediment-risky',
    // Water quality
    'hardness_extreme': 'hardness',
    'HARDNESS_EXTREME': 'hardness',
    'softener_recommended': 'hardness',
    'softener_service': 'hardness',
    'SCALE_BUILDUP': 'scale-tankless',
    // Temperature
    'TEMP_HIGH': 'temperature',
    // Tank issues
    'TANK_FAILURE': 'tank-failure',
    'AGE_CRITICAL': 'aging',
    'FAILURE_RATE_HIGH': 'failure-rate',
    // Replacement consultation
    'replacement_urgent': 'replacement-consultation',
    'REPLACEMENT_CONSULTATION': 'replacement-consultation',
    'URGENT_REPLACEMENT': 'replacement-consultation',
  };
  return topicMap[findingId] || null;
}

// Fallback situation summary - conversational, no technical jargon
function getFallbackSummary(inputs: ForensicInputs, metrics: OpterraMetrics, tier: UrgencyTier, verdictReason?: string): string[] {
  const points: string[] = [];
  
  if (tier === 'monitor' && verdictReason) {
    points.push(verdictReason);
  }
  
  if (metrics.bioAge >= 12) {
    points.push('Your water heater is older and showing signs of wear.');
  } else if (metrics.bioAge >= 8) {
    points.push('Your unit is entering the age where issues become more common.');
  } else if (tier !== 'monitor') {
    points.push('Your unit is still in its prime years.');
  }
  
  if (tier === 'healthy' && points.length < 2) {
    points.push('Regular maintenance helps prevent unexpected problems.');
  }
  
  return points.slice(0, 3);
}

export function OptionsAssessmentDrawer({
  open,
  onOpenChange,
  onContinue,
  inputs,
  metrics,
  verdictAction,
  healthScore,
  priorityFindings = [],
  nextPagePreview,
  isPassVerdict = false,
  verdictReason,
  yearsRemaining = 0,
}: OptionsAssessmentDrawerProps) {
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic | null>(null);
  const [reminderMethod, setReminderMethod] = useState<'sms' | 'email'>('sms');
  const [contactInfo, setContactInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(() => hasLeadBeenCaptured('maintenance_reminder'));
  const [showCorrtexChat, setShowCorrtexChat] = useState(false);
  const [findingsExpanded, setFindingsExpanded] = useState(false);
  
  const tier = getUrgencyTier(healthScore, verdictAction, isPassVerdict, priorityFindings);
  const recommendation = getRecommendation(tier, verdictAction);
  const Icon = recommendation.icon;
  
  // Get the full opterra result for rationale generation
  const opterraResult = verdictAction === 'REPLACE' ? calculateOpterraRisk(inputs) : null;
  
  // Fetch personalized rationale for replacement recommendations
  const { rationale, isLoading: rationaleLoading } = useReplacementRationale(
    verdictAction === 'REPLACE' ? inputs : null,
    opterraResult,
    opterraResult?.verdict.urgent ? 'REPLACE_NOW' : 'REPLACE_SOON'
  );
  
  // Calculate maintenance schedule for monitor tier
  const schedule = tier === 'monitor' ? calculateMaintenanceSchedule(inputs, metrics) : null;
  
  // Use priority findings if available, otherwise fall back to generic content
  const hasPriorityFindings = priorityFindings.length > 0;
  const fallbackPoints = !hasPriorityFindings ? getFallbackSummary(inputs, metrics, tier, verdictReason) : [];
  
  const handleFindingClick = (finding: PriorityFinding) => {
    const topic = getEducationalTopic(finding.id);
    if (topic) {
      setSelectedTopic(topic);
    }
  };
  
  const handleReminderSubmit = async () => {
    if (!contactInfo.trim()) {
      toast.error(`Please enter your ${reminderMethod === 'sms' ? 'phone number' : 'email'}`);
      return;
    }
    
    setIsSubmitting(true);
    const result = await submitLead({
      customerName: 'Homeowner',
      customerPhone: reminderMethod === 'sms' ? contactInfo : '',
      customerEmail: reminderMethod === 'email' ? contactInfo : undefined,
      captureSource: 'maintenance_reminder',
      captureContext: {
        healthScore,
        yearsRemaining,
        nextMaintenanceType: schedule?.primaryTask?.type,
        monthsUntilDue: schedule?.primaryTask?.monthsUntilDue,
      },
      optInAlerts: true,
      preferredContactMethod: reminderMethod,
    });
    
    setIsSubmitting(false);
    if (result.success) {
      setReminderEnabled(true);
      markLeadCaptured('maintenance_reminder');
      toast.success(`Reminders enabled! We'll ${reminderMethod === 'sms' ? 'text' : 'email'} you before maintenance is due.`);
    } else {
      toast.error('Something went wrong. Please try again.');
    }
  };
  
  // Different CTAs based on tier
  const ctaText = tier === 'monitor'
    ? 'Got It'
    : tier === 'critical' 
      ? 'See My Options' 
      : tier === 'attention' 
        ? 'Explore Services' 
        : 'View Maintenance Options';
  
  const handleCTA = () => {
    if (tier === 'monitor') {
      onOpenChange(false);
    } else {
      onContinue();
    }
  };
  
  // Helper to format due date
  const formatDueDate = (months: number) => {
    if (months <= 0) return 'Now';
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}.${Math.round(remainingMonths / 1.2)} years`;
  };
  
  // Get icon for task type
  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'flush': return Droplets;
      case 'anode': return Shield;
      default: return Wrench;
    }
  };
  
  // Map maintenance task types to educational topics
  const getTaskEducationalTopic = (taskType: string): EducationalTopic | null => {
    const isSedimentRisky = metrics?.sedimentLbs && metrics.sedimentLbs > 10;
    const isAnodeNaked = metrics?.anodeStatus === 'naked';
    
    const topicMap: Record<string, EducationalTopic> = {
      'flush': isSedimentRisky ? 'sediment-risky' : 'sediment',
      'anode': isAnodeNaked ? 'anode-rod-fused' : 'anode-rod',
      'descale': 'scale-tankless',
      'filter_clean': 'heat-exchanger',
      'air_filter': 'heat-exchanger',
      'condensate': 'heat-exchanger',
      'exp_tank_install': 'thermal-expansion',
      'exp_tank_replace': 'thermal-expansion',
      'prv_install': 'prv',
      'prv_replace': 'prv',
    };
    return topicMap[taskType] || null;
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto pb-8">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-xl">Your Assessment</DrawerTitle>
            <DrawerDescription className="text-muted-foreground">
              Here's what we found based on your water heater's condition
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 space-y-5">
            {/* 1. ENLARGED Recommendation Banner - Big, clear verdict */}
            <div className={`rounded-2xl p-5 ${recommendation.bgColor} border-2 ${recommendation.borderColor}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${recommendation.bgColor}`}>
                  <Icon className={`w-8 h-8 ${recommendation.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{recommendation.headline}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{recommendation.subheadline}</p>
                </div>
              </div>
            </div>
            
            {/* 2. Visual Evidence - Show actual inspection photo for REPLACE verdicts */}
            {verdictAction === 'REPLACE' && inputs.photoUrls?.condition && (
              <div className="rounded-xl overflow-hidden border border-border">
                <img 
                  src={inputs.photoUrls.condition} 
                  alt="Your water heater condition"
                  className="w-full h-44 object-cover"
                />
                <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/40">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Photo captured during your inspection
                  </p>
                </div>
              </div>
            )}
            
            {/* 3. ELEVATED "Why We Recommend This" - Primary focus for REPLACE verdicts */}
            {verdictAction === 'REPLACE' && (
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-foreground">Here's why this makes sense for you</h4>
                {rationaleLoading ? (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/30 border border-border/50 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your situation...</span>
                  </div>
                ) : rationale?.sections && rationale.sections.length > 0 ? (
                  <div className="space-y-3">
                    {rationale.sections.slice(0, 3).map((section, index) => (
                      <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <h5 className="text-sm font-semibold text-foreground mb-1.5">
                          {section.heading}
                        </h5>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      At this point, repairs would likely cost more than they're worth. A new unit gives you reliability, improved efficiency, and peace of mind with a fresh warranty.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* 4. COLLAPSED Priority Findings - Technical details demoted */}
            {hasPriorityFindings && (
              <Collapsible open={findingsExpanded} onOpenChange={setFindingsExpanded}>
                <CollapsibleTrigger className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">What We Found</span>
                    <span className="text-xs text-muted-foreground">({priorityFindings.length} items)</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${findingsExpanded ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-2">
                    {priorityFindings.map((finding) => {
                      const style = getFindingStyle(finding);
                      const FindingIcon = style.icon;
                      const hasTopic = getEducationalTopic(finding.id) !== null;
                      return (
                        <button 
                          key={finding.id} 
                          onClick={() => handleFindingClick(finding)}
                          className={`w-full text-left rounded-lg p-3 ${style.bgColor} border ${style.borderColor} transition-all duration-200 ${hasTopic ? 'hover:scale-[1.01] hover:shadow-md active:scale-[0.99] cursor-pointer' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <FindingIcon className={`w-5 h-5 ${style.labelColor} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-semibold uppercase tracking-wide ${style.labelColor} mb-0.5`}>
                                {style.label}
                              </div>
                              <p className="font-medium text-sm text-foreground">{finding.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{finding.friendlyName}</p>
                            </div>
                            {hasTopic && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Info className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Learn</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Fallback: Generic situation summary when no specific findings */}
            {!hasPriorityFindings && fallbackPoints.length > 0 && tier !== 'monitor' && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Your Situation</h4>
                <ul className="space-y-2">
                  {fallbackPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Monitor tier: Personalized maintenance schedule */}
            {tier === 'monitor' && schedule && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Your Maintenance Schedule</h4>
                <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
                  {/* Primary task */}
                  {schedule.primaryTask && (() => {
                    const TaskIcon = getTaskIcon(schedule.primaryTask.type);
                    const hasTopic = getTaskEducationalTopic(schedule.primaryTask.type) !== null;
                    return (
                      <button 
                        onClick={() => {
                          const topic = getTaskEducationalTopic(schedule.primaryTask!.type);
                          if (topic) setSelectedTopic(topic);
                        }}
                        className={`w-full flex items-center justify-between rounded-lg p-3 transition-all duration-200 group ${hasTopic ? 'cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 hover:scale-[1.01] active:scale-[0.99]' : 'bg-muted/30'}`}
                        disabled={!hasTopic}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <TaskIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium text-foreground">{schedule.primaryTask.label}</span>
                            <p className="text-xs text-muted-foreground">
                              Due in {formatDueDate(schedule.primaryTask.monthsUntilDue)}
                            </p>
                          </div>
                        </div>
                        {hasTopic && (
                          <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                            <span className="hidden sm:inline">Learn more</span>
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })()}
                  {/* Secondary task */}
                  {schedule.secondaryTask && (() => {
                    const TaskIcon = getTaskIcon(schedule.secondaryTask.type);
                    const hasTopic = getTaskEducationalTopic(schedule.secondaryTask.type) !== null;
                    return (
                      <button 
                        onClick={() => {
                          const topic = getTaskEducationalTopic(schedule.secondaryTask!.type);
                          if (topic) setSelectedTopic(topic);
                        }}
                        className={`w-full flex items-center justify-between rounded-lg p-3 transition-all duration-200 group ${hasTopic ? 'cursor-pointer bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 hover:scale-[1.01] active:scale-[0.99]' : 'bg-muted/30'}`}
                        disabled={!hasTopic}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <TaskIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-medium text-foreground">{schedule.secondaryTask.label}</span>
                            <p className="text-xs text-muted-foreground">
                              Due in {formatDueDate(schedule.secondaryTask.monthsUntilDue)}
                            </p>
                          </div>
                        </div>
                        {hasTopic && (
                          <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                            <span className="hidden sm:inline">Learn more</span>
                            <Info className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            )}
            
            {/* Monitor tier: SMS/Email Reminder Opt-in */}
            {tier === 'monitor' && !reminderEnabled && (
              <div className="space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">Get Maintenance Reminders</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        We'll notify you when service is due
                      </p>
                    </div>
                  </div>
                  
                  {/* Method selector */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setReminderMethod('sms')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        reminderMethod === 'sms' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Text
                    </button>
                    <button
                      onClick={() => setReminderMethod('email')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        reminderMethod === 'email' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                  </div>
                  
                  {/* Contact input */}
                  <Input
                    type={reminderMethod === 'sms' ? 'tel' : 'email'}
                    placeholder={reminderMethod === 'sms' ? '(555) 123-4567' : 'you@example.com'}
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="mb-3"
                  />
                  
                  <Button 
                    onClick={handleReminderSubmit}
                    disabled={isSubmitting || !contactInfo.trim()}
                    className="w-full"
                    size="sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enabling...
                      </>
                    ) : (
                      'Enable Reminders'
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Monitor tier: Success state after enabling reminders */}
            {tier === 'monitor' && reminderEnabled && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">Reminders Enabled</h4>
                    <p className="text-xs text-muted-foreground">
                      We'll notify you before your next maintenance is due
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* What's Next - preview of next page categories */}
            {nextPagePreview && tier !== 'monitor' && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">What We'll Cover Next</h4>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  {nextPagePreview.violationCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CircleAlert className="w-4 h-4 text-destructive" />
                      <span className="text-foreground">
                        {nextPagePreview.violationCount} Code {nextPagePreview.violationCount === 1 ? 'Violation' : 'Violations'}
                      </span>
                      <span className="text-muted-foreground">– required for compliance</span>
                    </div>
                  )}
                  {nextPagePreview.urgentActionCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wrench className="w-4 h-4 text-warning" />
                      <span className="text-foreground">
                        {nextPagePreview.urgentActionCount} Urgent {nextPagePreview.urgentActionCount === 1 ? 'Action' : 'Actions'}
                      </span>
                      <span className="text-muted-foreground">– protective measures</span>
                    </div>
                  )}
                  {nextPagePreview.addOnCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-accent-foreground" />
                      <span className="text-foreground">
                        {nextPagePreview.addOnCount} Add-{nextPagePreview.addOnCount === 1 ? 'On' : 'Ons'}
                      </span>
                      <span className="text-muted-foreground">– optional improvements</span>
                    </div>
                  )}
                  {nextPagePreview.hasReplacement && !nextPagePreview.isUrgentReplacement && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-foreground">Replacement Options</span>
                      <span className="text-muted-foreground">– worth discussing</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            
            
            {/* Chat with Corrtex button */}
            <Button 
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setShowCorrtexChat(true);
              }}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Chat with Corrtex AI
            </Button>
            
            {/* CTA */}
            <Button 
              onClick={handleCTA}
              size="lg"
              className="w-full font-semibold"
              variant={tier === 'monitor' ? 'outline' : 'default'}
            >
              {ctaText}
              {tier !== 'monitor' && <ChevronRight className="w-5 h-5 ml-1" />}
            </Button>
          </div>
        </div>
      </DrawerContent>
      
      {/* Educational Drawer for learning more about findings */}
      {selectedTopic && (
        <EducationalDrawer
          topic={selectedTopic}
          isOpen={!!selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />
      )}
      
      {/* Corrtex Chat Overlay */}
      <CorrtexChatOverlay
        open={showCorrtexChat}
        onClose={() => setShowCorrtexChat(false)}
        inputs={inputs}
        metrics={metrics}
        healthScore={healthScore}
        recommendation={{
          action: verdictAction,
          badge: tier === 'critical' ? 'Critical' : tier === 'attention' ? 'Attention' : 'Stable',
          title: tier === 'critical' ? 'Immediate Attention' : tier === 'attention' ? 'Proactive Maintenance' : 'Monitor',
          description: verdictReason,
        }}
        violations={[]}
        recommendations={[]}
        maintenanceTasks={schedule ? [schedule.primaryTask, schedule.secondaryTask].filter(Boolean) as MaintenanceTask[] : []}
        addOns={[]}
        priorityFindings={priorityFindings.map(f => ({
          id: f.id,
          name: f.name,
          friendlyName: f.friendlyName,
          description: f.description,
          severity: f.severity,
        }))}
      />
    </Drawer>
  );
}
