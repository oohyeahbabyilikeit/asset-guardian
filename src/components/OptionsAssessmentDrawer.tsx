import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ChevronRight, AlertTriangle, CheckCircle, Clock, Wrench, ShieldCheck, Zap, Eye, CalendarClock } from 'lucide-react';
import { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';

// Local type for verdict action - matches Recommendation interface
type VerdictAction = 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS';

interface OptionsAssessmentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  verdictAction: VerdictAction;
  healthScore: number;
  // PASS verdict props
  isPassVerdict?: boolean;
  verdictReason?: string;
  verdictTitle?: string;
  yearsRemaining?: number;
}

type UrgencyTier = 'critical' | 'attention' | 'healthy' | 'monitor';

function getUrgencyTier(healthScore: number, verdictAction: VerdictAction, isPassVerdict: boolean): UrgencyTier {
  // PASS verdicts get their own tier
  if (isPassVerdict) return 'monitor';
  if (healthScore < 40 || verdictAction === 'REPLACE') return 'critical';
  if (healthScore < 70 || verdictAction === 'REPAIR') return 'attention';
  return 'healthy';
}

function getRecommendation(tier: UrgencyTier) {
  switch (tier) {
    case 'critical':
      return {
        headline: 'Immediate Attention Recommended',
        subheadline: 'Based on our assessment, your water heater needs professional evaluation soon.',
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

function getSituationSummary(inputs: ForensicInputs, metrics: OpterraMetrics, tier: UrgencyTier, verdictReason?: string): string[] {
  const points: string[] = [];
  
  // For monitor tier, show the algorithm's reason first
  if (tier === 'monitor' && verdictReason) {
    points.push(verdictReason);
  }
  
  // Age context
  if (metrics.bioAge >= 12) {
    points.push(`Your unit is ${Math.round(metrics.bioAge)} years old biologically – well past the typical 8-12 year lifespan.`);
  } else if (metrics.bioAge >= 8) {
    points.push(`At ${Math.round(metrics.bioAge)} biological years, your unit is entering its later years.`);
  } else if (tier !== 'monitor') {
    points.push(`Your unit is ${Math.round(metrics.bioAge)} biological years old – still within its prime lifespan.`);
  }
  
  // Condition factors (skip for monitor - we don't want to alarm them)
  if (tier !== 'monitor') {
    if (inputs.isLeaking) {
      points.push('Active leaking detected – this requires immediate attention to prevent water damage.');
    } else if (inputs.visualRust) {
      points.push('Visible corrosion indicates the tank may be compromised internally.');
    }
    
    // Infrastructure issues
    if (!inputs.hasExpTank && inputs.isClosedLoop) {
      points.push('Missing expansion tank on a closed-loop system creates excess pressure stress.');
    }
    if (!inputs.hasPrv && inputs.housePsi > 80) {
      points.push('High water pressure without a PRV accelerates wear on all plumbing components.');
    }
    
    // Maintenance status
    if (metrics.flushStatus === 'lockout' || metrics.flushStatus === 'due') {
      points.push('Tank flush is overdue – sediment buildup reduces efficiency and lifespan.');
    }
  }
  
  // For healthy units, add positive context
  if (tier === 'healthy' && points.length < 2) {
    points.push('Regular maintenance helps prevent unexpected failures and extends equipment life.');
  }
  
  return points.slice(0, 3); // Max 3 points for readability
}

function getWhyMatters(tier: UrgencyTier, inputs: ForensicInputs, yearsRemaining: number): { title: string; description: string; icon: typeof Wrench }[] {
  const topics: { title: string; description: string; icon: typeof Wrench }[] = [];
  
  // Monitor tier gets planning-focused topics
  if (tier === 'monitor') {
    // INFRASTRUCTURE FIRST GATE: Only show replacement planning for older tanks (6+ years)
    // Young tanks with low years remaining likely just need infrastructure fixes
    const isOldEnoughForReplacementPlanning = inputs.calendarAge >= 6;
    if (yearsRemaining > 0 && yearsRemaining <= 3 && isOldEnoughForReplacementPlanning) {
      topics.push({
        title: 'Plan for Replacement',
        description: `With approximately ${yearsRemaining} year${yearsRemaining === 1 ? '' : 's'} of typical life remaining, now is a good time to start budgeting.`,
        icon: CalendarClock,
      });
    }
    topics.push({
      title: 'We\'re Here When You Need Us',
      description: 'When it\'s time to replace or if issues arise, we\'ll be ready to help.',
      icon: ShieldCheck,
    });
    return topics.slice(0, 2);
  }
  
  if (tier === 'critical') {
    if (inputs.isLeaking || inputs.location === 'ATTIC') {
      topics.push({
        title: 'Water Damage Risk',
        description: 'A failing water heater in your location could cause significant property damage.',
        icon: AlertTriangle,
      });
    }
    topics.push({
      title: 'Replacement Planning',
      description: 'Understanding your options now helps you avoid emergency decisions later.',
      icon: Wrench,
    });
  }
  
  if (tier === 'attention') {
    topics.push({
      title: 'Preventive Care',
      description: 'Addressing issues now is typically 3-5x less expensive than emergency repairs.',
      icon: ShieldCheck,
    });
  }
  
  topics.push({
    title: 'Expert Guidance',
    description: 'A professional can provide personalized recommendations for your specific situation.',
    icon: Zap,
  });
  
  return topics.slice(0, 2);
}

export function OptionsAssessmentDrawer({
  open,
  onOpenChange,
  onContinue,
  inputs,
  metrics,
  verdictAction,
  healthScore,
  isPassVerdict = false,
  verdictReason,
  verdictTitle,
  yearsRemaining = 0,
}: OptionsAssessmentDrawerProps) {
  const tier = getUrgencyTier(healthScore, verdictAction, isPassVerdict);
  const recommendation = getRecommendation(tier);
  const situationPoints = getSituationSummary(inputs, metrics, tier, verdictReason);
  const whyTopics = getWhyMatters(tier, inputs, yearsRemaining);
  const Icon = recommendation.icon;
  
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
      // Just close the drawer for monitor state
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
            
            {/* Your Situation */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Your Situation</h4>
              <ul className="space-y-2">
                {situationPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Why This Matters */}
            {whyTopics.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">{tier === 'monitor' ? 'What\'s Next' : 'Why This Matters'}</h4>
                <div className="space-y-2">
                  {whyTopics.map((topic, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <topic.icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-foreground">{topic.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                      </div>
                    </div>
                  ))}
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
    </Drawer>
  );
}
