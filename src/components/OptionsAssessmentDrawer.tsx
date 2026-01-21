import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ChevronRight, AlertTriangle, CheckCircle, Clock, Eye, CircleAlert, Wrench, Lightbulb, Info } from 'lucide-react';
import { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import type { IssueCategory } from '@/lib/infrastructureIssues';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
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
  // Check for critical findings first - violations override PASS verdict
  const hasCriticalFinding = priorityFindings.some(f => f.severity === 'critical');
  const hasWarningFinding = priorityFindings.some(f => f.severity === 'warning');
  
  if (hasCriticalFinding) return 'critical';  // Violations = immediate attention
  if (hasWarningFinding) return 'attention';  // Infrastructure issues = proactive
  
  // Only show "stable" if PASS verdict AND no findings
  if (isPassVerdict) return 'monitor';
  
  // Existing logic for health score thresholds
  if (healthScore < 40 || verdictAction === 'REPLACE') return 'critical';
  if (healthScore < 70 || verdictAction === 'REPAIR') return 'attention';
  return 'healthy';
}

function getRecommendation(tier: UrgencyTier) {
  switch (tier) {
    case 'critical':
      return {
        headline: 'Immediate Attention Recommended',
        subheadline: 'Our assessment found issues that need prompt professional attention.',
        icon: AlertTriangle,
        iconColor: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/30',
      };
    case 'attention':
      return {
        headline: 'Proactive Maintenance Recommended',
        subheadline: 'Your unit is showing signs that warrant attention to prevent future issues.',
        icon: Clock,
        iconColor: 'text-warning',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30',
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

// Get styling for priority finding cards based on category/severity
function getFindingStyle(finding: PriorityFinding) {
  if (finding.category === 'VIOLATION' || finding.severity === 'critical') {
    return {
      label: 'CODE VIOLATION',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/40',
      labelColor: 'text-destructive',
      icon: CircleAlert,
    };
  }
  if (finding.category === 'INFRASTRUCTURE' || finding.severity === 'warning') {
    return {
      label: 'URGENT ACTION',
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
    'EXP_TANK_MISSING': 'thermal-expansion',
    'EXP_TANK_FAILED': 'thermal-expansion',
    'PRV_MISSING': 'prv',
    'PRV_FAILED': 'prv',
    'PRESSURE_HIGH': 'pressure',
    'PRESSURE_CRITICAL': 'pressure',
    'ANODE_DEPLETED': 'anode-rod',
    'ANODE_FUSED': 'anode-rod-fused',
    'SEDIMENT_HEAVY': 'sediment',
    'SEDIMENT_RISKY': 'sediment-risky',
    'HARDNESS_EXTREME': 'hardness',
    'SCALE_BUILDUP': 'scale-tankless',
    'TEMP_HIGH': 'temperature',
    'TANK_FAILURE': 'tank-failure',
    'AGE_CRITICAL': 'aging',
    'FAILURE_RATE_HIGH': 'failure-rate',
    'REPLACEMENT_CONSULTATION': 'replacement-consultation',
    'URGENT_REPLACEMENT': 'replacement-consultation',
  };
  return topicMap[findingId] || null;
}

// Fallback situation summary for when no priority findings
function getFallbackSummary(inputs: ForensicInputs, metrics: OpterraMetrics, tier: UrgencyTier, verdictReason?: string): string[] {
  const points: string[] = [];
  
  if (tier === 'monitor' && verdictReason) {
    points.push(verdictReason);
  }
  
  const wearLevel = metrics.bioAge > inputs.calendarAge + 5 ? 'high' : metrics.bioAge > inputs.calendarAge + 2 ? 'elevated' : 'normal';
  if (metrics.bioAge >= 12) {
    points.push(`Your unit is showing ${wearLevel} wear – well past the typical 8-12 year lifespan.`);
  } else if (metrics.bioAge >= 8) {
    points.push(`Your unit is entering its later years based on wear level.`);
  } else if (tier !== 'monitor') {
    points.push(`Your unit is still within its prime lifespan.`);
  }
  
  if (tier === 'healthy' && points.length < 2) {
    points.push('Regular maintenance helps prevent unexpected failures and extends equipment life.');
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
  
  const tier = getUrgencyTier(healthScore, verdictAction, isPassVerdict, priorityFindings);
  const recommendation = getRecommendation(tier);
  const Icon = recommendation.icon;
  
  // Use priority findings if available, otherwise fall back to generic content
  const hasPriorityFindings = priorityFindings.length > 0;
  const fallbackPoints = !hasPriorityFindings ? getFallbackSummary(inputs, metrics, tier, verdictReason) : [];
  
  const handleFindingClick = (finding: PriorityFinding) => {
    const topic = getEducationalTopic(finding.id);
    if (topic) {
      setSelectedTopic(topic);
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
            {/* Recommendation Banner */}
            <div className={`rounded-xl p-4 ${recommendation.bgColor} border ${recommendation.borderColor}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${recommendation.bgColor}`}>
                  <Icon className={`w-6 h-6 ${recommendation.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{recommendation.headline}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{recommendation.subheadline}</p>
                </div>
              </div>
            </div>
            
            {/* Priority Findings - specific issues detected */}
            {hasPriorityFindings && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Priority Findings</h4>
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
              </div>
            )}
            
            {/* Fallback: Generic situation summary when no specific findings */}
            {!hasPriorityFindings && fallbackPoints.length > 0 && (
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
            
            {/* Monitor tier: show planning info */}
            {tier === 'monitor' && yearsRemaining > 0 && yearsRemaining <= 3 && inputs.calendarAge >= 6 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Plan Ahead</h4>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm text-muted-foreground">
                    With approximately {yearsRemaining} year{yearsRemaining === 1 ? '' : 's'} of typical life remaining, 
                    now is a good time to start budgeting for eventual replacement. We're here when you need us.
                  </p>
                </div>
              </div>
            )}
            
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
    </Drawer>
  );
}
