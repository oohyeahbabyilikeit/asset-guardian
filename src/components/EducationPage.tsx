import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ArrowRight, Shield, AlertTriangle, CheckCircle2, Wrench, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { topicContent, type EducationalTopic } from './EducationalDrawer';
import type { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';

export type UrgencyLevel = 'green' | 'yellow' | 'red';

interface EducationPageProps {
  urgencyLevel: UrgencyLevel;
  inputs?: ForensicInputs;
  metrics?: OpterraMetrics;
  onContinue: () => void;
  onBack: () => void;
}

// Get recommendation content based on urgency and inputs
function getRecommendation(urgencyLevel: UrgencyLevel, inputs?: ForensicInputs, metrics?: OpterraMetrics) {
  const age = inputs?.calendarAge || 0;
  const healthScore = metrics?.healthScore || 50;
  
  if (urgencyLevel === 'red') {
    return {
      headline: 'Immediate Attention Recommended',
      subheadline: 'Your water heater shows signs that need professional evaluation',
      action: 'Schedule a professional inspection to assess current condition and discuss your options.',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      benefits: [
        'Prevent unexpected failure and water damage',
        'Get accurate repair vs. replace cost analysis',
        'Understand your timeline for replacement'
      ]
    };
  }
  
  if (urgencyLevel === 'yellow') {
    return {
      headline: 'Proactive Maintenance Recommended',
      subheadline: `At ${age} years old, your unit is approaching the age where issues become more common`,
      action: 'Schedule maintenance to extend lifespan and catch small issues before they become expensive problems.',
      icon: Wrench,
      iconColor: 'text-amber-500',
      benefits: [
        'Extend your water heater\'s lifespan by 2-4 years',
        'Reduce energy costs with proper maintenance',
        'Avoid emergency repair bills'
      ]
    };
  }
  
  // Green
  return {
    headline: 'Keep Your System Healthy',
    subheadline: 'Your water heater is in good condition — regular care will keep it that way',
    action: 'Set up a maintenance schedule to protect your investment and maximize efficiency.',
    icon: Shield,
    iconColor: 'text-emerald-500',
    benefits: [
      'Maintain peak energy efficiency',
      'Get notified when service is due',
      'Prevent problems before they start'
    ]
  };
}

// Get situation summary based on inputs
function getSituationSummary(inputs?: ForensicInputs, metrics?: OpterraMetrics): string[] {
  const points: string[] = [];
  
  if (inputs?.calendarAge) {
    points.push(`Unit age: ${inputs.calendarAge} years`);
  }
  
  if (metrics?.healthScore !== undefined) {
    const healthLabel = metrics.healthScore >= 70 ? 'Good' : metrics.healthScore >= 40 ? 'Fair' : 'Poor';
    points.push(`Health: ${healthLabel} (${Math.round(metrics.healthScore)}%)`);
  }
  
  if (inputs?.hardnessGPG && inputs.hardnessGPG >= 7) {
    points.push(`Hard water: ${inputs.hardnessGPG} GPG (accelerates wear)`);
  }
  
  if (inputs?.housePsi && inputs.housePsi >= 80) {
    points.push(`High water pressure: ${inputs.housePsi} PSI`);
  }
  
  if (inputs?.isClosedLoop && !inputs?.hasExpTank) {
    points.push('Missing expansion tank (code violation)');
  }
  
  return points.slice(0, 4); // Max 4 points
}

// Select relevant educational topics based on inputs and metrics
function selectTopics(
  inputs?: ForensicInputs,
  metrics?: OpterraMetrics,
  urgencyLevel?: UrgencyLevel
): EducationalTopic[] {
  if (!inputs) {
    if (urgencyLevel === 'red') return ['tank-failure', 'failure-rate'];
    if (urgencyLevel === 'yellow') return ['aging', 'sediment'];
    return ['aging', 'anode-rod'];
  }

  const topics: { topic: EducationalTopic; priority: number }[] = [];
  const isTanklessUnit = inputs.fuelType === 'TANKLESS_GAS' || inputs.fuelType === 'TANKLESS_ELECTRIC';
  
  if (metrics?.failProb && metrics.failProb >= 50) {
    topics.push({ topic: 'tank-failure', priority: 100 });
  }
  
  if (metrics?.failProb && metrics.failProb >= 40) {
    topics.push({ topic: 'failure-rate', priority: 90 });
  }
  
  if (inputs.calendarAge >= 8) {
    topics.push({ topic: isTanklessUnit ? 'aging-tankless' : 'aging', priority: 80 });
  }
  
  if (inputs.hardnessGPG && inputs.hardnessGPG >= 7) {
    topics.push({ topic: isTanklessUnit ? 'hardness-tankless' : 'hardness', priority: 75 });
  }
  
  if (inputs.housePsi && inputs.housePsi >= 80) {
    topics.push({ topic: 'pressure', priority: 70 });
    if (!inputs.hasPrv) {
      topics.push({ topic: 'prv', priority: 68 });
    }
  }
  
  if (inputs.isClosedLoop && !inputs.hasExpTank) {
    topics.push({ topic: 'thermal-expansion', priority: 65 });
  }
  
  if (!isTanklessUnit) {
    if (inputs.lastFlushYearsAgo && inputs.lastFlushYearsAgo >= 3) {
      topics.push({ topic: 'sediment', priority: 60 });
    }
    if (inputs.lastAnodeReplaceYearsAgo && inputs.lastAnodeReplaceYearsAgo >= 4) {
      topics.push({ topic: 'anode-rod', priority: 55 });
    }
  }
  
  if (isTanklessUnit) {
    if (inputs.lastDescaleYearsAgo && inputs.lastDescaleYearsAgo >= 2) {
      topics.push({ topic: 'scale-tankless', priority: 60 });
    }
    topics.push({ topic: 'heat-exchanger', priority: 50 });
  }
  
  const sorted = topics.sort((a, b) => b.priority - a.priority);
  const selected = sorted.slice(0, 2).map(t => t.topic);
  
  if (selected.length < 2) {
    if (isTanklessUnit) {
      if (!selected.includes('aging-tankless')) selected.push('aging-tankless');
      if (!selected.includes('scale-tankless') && selected.length < 2) selected.push('scale-tankless');
    } else {
      if (!selected.includes('aging')) selected.push('aging');
      if (!selected.includes('anode-rod') && selected.length < 2) selected.push('anode-rod');
    }
  }
  
  return selected.slice(0, 2);
}

// Compact education card
function EducationCard({ topic }: { topic: EducationalTopic }) {
  const [expanded, setExpanded] = useState(false);
  const content = topicContent[topic];
  
  if (!content) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-muted/50 border border-border"
    >
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded bg-primary/10 text-primary flex-shrink-0">
          {content.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-xs">{content.title}</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {content.description}
          </p>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                  {content.sections.slice(0, 2).map((section, idx) => (
                    <div key={idx}>
                      <h5 className="text-[11px] font-medium">{section.heading}</h5>
                      <p className="text-[10px] text-muted-foreground">{section.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 mt-1"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function EducationPage({
  urgencyLevel,
  inputs,
  metrics,
  onContinue,
  onBack,
}: EducationPageProps) {
  const recommendation = useMemo(
    () => getRecommendation(urgencyLevel, inputs, metrics),
    [urgencyLevel, inputs, metrics]
  );
  
  const situationPoints = useMemo(
    () => getSituationSummary(inputs, metrics),
    [inputs, metrics]
  );
  
  const selectedTopics = useMemo(
    () => selectTopics(inputs, metrics, urgencyLevel),
    [inputs, metrics, urgencyLevel]
  );

  const RecommendationIcon = recommendation.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center max-w-md mx-auto px-4 py-3">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-base">Your Assessment</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-4 pt-5 pb-8 max-w-md mx-auto space-y-5">
        {/* Recommendation Card - The Main Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-2xl border-2",
            urgencyLevel === 'red' && "bg-red-500/5 border-red-500/30",
            urgencyLevel === 'yellow' && "bg-amber-500/5 border-amber-500/30",
            urgencyLevel === 'green' && "bg-emerald-500/5 border-emerald-500/30",
          )}
        >
          <div className="flex items-start gap-3 mb-4">
            <div className={cn(
              "p-2.5 rounded-xl",
              urgencyLevel === 'red' && "bg-red-500/10",
              urgencyLevel === 'yellow' && "bg-amber-500/10",
              urgencyLevel === 'green' && "bg-emerald-500/10",
            )}>
              <RecommendationIcon className={cn("w-6 h-6", recommendation.iconColor)} />
            </div>
            <div>
              <h2 className={cn(
                "text-lg font-bold",
                urgencyLevel === 'red' && "text-red-600",
                urgencyLevel === 'yellow' && "text-amber-600",
                urgencyLevel === 'green' && "text-emerald-600",
              )}>
                {recommendation.headline}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {recommendation.subheadline}
              </p>
            </div>
          </div>

          {/* What We Recommend */}
          <div className="bg-background/80 rounded-xl p-4 mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              What We Recommend
            </h3>
            <p className="text-sm font-medium">
              {recommendation.action}
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            {recommendation.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className={cn(
                  "w-4 h-4 flex-shrink-0 mt-0.5",
                  urgencyLevel === 'red' && "text-red-500",
                  urgencyLevel === 'yellow' && "text-amber-500",
                  urgencyLevel === 'green' && "text-emerald-500",
                )} />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Your Situation - Quick Summary */}
        {situationPoints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Your Situation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {situationPoints.map((point, idx) => (
                <div key={idx} className="text-xs bg-muted/50 rounded-lg px-2.5 py-1.5">
                  {point}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Why This Matters - Collapsible Education */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Why This Matters
          </h3>
          <div className="space-y-2">
            {selectedTopics.map((topic) => (
              <EducationCard key={topic} topic={topic} />
            ))}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            size="lg"
            className={cn(
              "w-full h-14 text-base font-semibold rounded-xl gap-2",
              urgencyLevel === 'red' && "bg-red-600 hover:bg-red-500",
              urgencyLevel === 'yellow' && "bg-amber-600 hover:bg-amber-500",
              urgencyLevel === 'green' && "bg-emerald-600 hover:bg-emerald-500",
            )}
            onClick={onContinue}
          >
            See Personalized Plan
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-3">
            Get a personalized plan for your water heater
          </p>
        </motion.div>
      </div>
    </div>
  );
}
