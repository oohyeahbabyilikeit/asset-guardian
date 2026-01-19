import { useState, useMemo } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
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

// Select relevant educational topics based on inputs and metrics
function selectTopics(
  inputs?: ForensicInputs,
  metrics?: OpterraMetrics,
  urgencyLevel?: UrgencyLevel
): EducationalTopic[] {
  if (!inputs) {
    // Fallback topics if no inputs provided
    if (urgencyLevel === 'red') return ['tank-failure', 'failure-rate'];
    if (urgencyLevel === 'yellow') return ['aging', 'sediment'];
    return ['aging', 'anode-rod'];
  }

  const topics: { topic: EducationalTopic; priority: number }[] = [];
  const isTanklessUnit = inputs.fuelType === 'TANKLESS_GAS' || inputs.fuelType === 'TANKLESS_ELECTRIC';
  
  // Safety topics (highest priority)
  if (metrics?.failProb && metrics.failProb >= 50) {
    topics.push({ topic: 'tank-failure', priority: 100 });
  }
  
  // High failure probability
  if (metrics?.failProb && metrics.failProb >= 40) {
    topics.push({ topic: 'failure-rate', priority: 90 });
  }
  
  // Age-related
  if (inputs.calendarAge >= 8) {
    topics.push({ topic: isTanklessUnit ? 'aging-tankless' : 'aging', priority: 80 });
  }
  
  // Water quality
  if (inputs.hardnessGPG && inputs.hardnessGPG >= 7) {
    topics.push({ topic: isTanklessUnit ? 'hardness-tankless' : 'hardness', priority: 75 });
  }
  
  // Pressure issues
  if (inputs.housePsi && inputs.housePsi >= 80) {
    topics.push({ topic: 'pressure', priority: 70 });
    if (!inputs.hasPrv) {
      topics.push({ topic: 'prv', priority: 68 });
    }
  }
  
  // Thermal expansion
  if (inputs.isClosedLoop && !inputs.hasExpTank) {
    topics.push({ topic: 'thermal-expansion', priority: 65 });
  }
  
  // Maintenance-related (tank units)
  if (!isTanklessUnit) {
    if (inputs.lastFlushYearsAgo && inputs.lastFlushYearsAgo >= 3) {
      topics.push({ topic: 'sediment', priority: 60 });
    }
    if (inputs.lastAnodeReplaceYearsAgo && inputs.lastAnodeReplaceYearsAgo >= 4) {
      topics.push({ topic: 'anode-rod', priority: 55 });
    }
  }
  
  // Tankless-specific
  if (isTanklessUnit) {
    if (inputs.lastDescaleYearsAgo && inputs.lastDescaleYearsAgo >= 2) {
      topics.push({ topic: 'scale-tankless', priority: 60 });
    }
    topics.push({ topic: 'heat-exchanger', priority: 50 });
  }
  
  // Sort by priority and take top 3
  const sorted = topics.sort((a, b) => b.priority - a.priority);
  const selected = sorted.slice(0, 3).map(t => t.topic);
  
  // Ensure at least 2 topics
  if (selected.length < 2) {
    if (isTanklessUnit) {
      if (!selected.includes('aging-tankless')) selected.push('aging-tankless');
      if (!selected.includes('scale-tankless') && selected.length < 2) selected.push('scale-tankless');
    } else {
      if (!selected.includes('aging')) selected.push('aging');
      if (!selected.includes('anode-rod') && selected.length < 2) selected.push('anode-rod');
    }
  }
  
  return selected.slice(0, 3);
}

// Education card component
function EducationCard({ 
  topic, 
  isLast,
}: { 
  topic: EducationalTopic; 
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = topicContent[topic];
  
  if (!content) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        !isLast && "mb-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {content.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">{content.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content.description}
          </p>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  {content.sections.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-xs font-medium text-foreground mb-1">{section.heading}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                  {content.source && (
                    <p className="text-[10px] text-muted-foreground/70 italic pt-2 border-t border-border/50">
                      {content.source}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Learn more
              </>
            )}
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
  // Select topics based on inputs/metrics
  const selectedTopics = useMemo(
    () => selectTopics(inputs, metrics, urgencyLevel),
    [inputs, metrics, urgencyLevel]
  );

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
            <h1 className="font-semibold text-lg">Understanding Your Water Heater</h1>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-4 pt-6 pb-8 max-w-md mx-auto">
        {/* Education intro */}
        <div className="mb-6">
          <h2 className={cn(
            "text-xl font-bold mb-2",
            urgencyLevel === 'red' && "text-red-500",
            urgencyLevel === 'yellow' && "text-amber-500",
            urgencyLevel === 'green' && "text-emerald-500",
          )}>
            {urgencyLevel === 'red' 
              ? 'Important Information About Your Unit' 
              : urgencyLevel === 'yellow'
              ? 'What You Should Know'
              : 'Tips for a Healthy Water Heater'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Based on your water heater's profile, here's what matters most:
          </p>
        </div>

        {/* Education cards */}
        <div className="mb-6">
          {selectedTopics.map((topic, idx) => (
            <EducationCard 
              key={topic} 
              topic={topic} 
              isLast={idx === selectedTopics.length - 1}
            />
          ))}
        </div>

        {/* CTA Button - this is the decision point */}
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
          Your technician will call to discuss your options
        </p>
      </div>
    </div>
  );
}
