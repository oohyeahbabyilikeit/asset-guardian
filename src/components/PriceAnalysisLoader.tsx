import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Loader2, Droplets, Flame, Wind } from 'lucide-react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useTieredPricing, TierPricing } from '@/hooks/useTieredPricing';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';

interface PriceAnalysisLoaderProps {
  currentInputs: ForensicInputs;
  infrastructureIssues: InfrastructureIssue[];
  onComplete: (prefetchedTiers: Record<QualityTier, TierPricing>) => void;
  onBack: () => void;
  complexity?: 'STANDARD' | 'CODE_UPGRADE' | 'DIFFICULT_ACCESS' | 'NEW_INSTALL';
}

const DEMO_CONTRACTOR_ID = '00000000-0000-0000-0000-000000000001';
const MIN_DISPLAY_TIME = 2500;

export function PriceAnalysisLoader({
  currentInputs,
  infrastructureIssues,
  onComplete,
  complexity = 'STANDARD',
}: PriceAnalysisLoaderProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Fetch pricing in background
  const { tiers, allLoading } = useTieredPricing(
    currentInputs,
    DEMO_CONTRACTOR_ID,
    complexity,
    true,
    infrastructureIssues
  );

  // Format specs for display
  const capacityDisplay = `${currentInputs.tankCapacity} gallon`;
  const fuelDisplay = currentInputs.fuelType === 'ELECTRIC' ? 'Electric' : 'Gas';
  const ventDisplay = currentInputs.ventType?.replace(/_/g, ' ').toLowerCase() || 'standard';

  // Dynamic analysis steps
  const analysisSteps = useMemo(() => [
    'Reading your system specifications...',
    `Detected: ${capacityDisplay} ${fuelDisplay.toLowerCase()} unit`,
    'Checking current manufacturer pricing...',
    'Calculating installation requirements...',
    'Building your personalized options...',
  ], [capacityDisplay, fuelDisplay]);

  const { displayedLines, currentLineIndex } = useTypewriter({
    lines: analysisSteps,
    typingSpeed: 25,
    lineDelay: 400,
  });

  // Minimum display time
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  // Transition when BOTH conditions met
  useEffect(() => {
    if (!allLoading && minTimeElapsed && !hasCompleted) {
      setHasCompleted(true);
      // Small delay for smooth exit
      setTimeout(() => {
        onComplete(tiers);
      }, 300);
    }
  }, [allLoading, minTimeElapsed, hasCompleted, tiers, onComplete]);

  const getFuelIcon = () => {
    if (currentInputs.fuelType === 'ELECTRIC') return Droplets;
    return Flame;
  };

  const FuelIcon = getFuelIcon();

  return (
    <motion.div
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm space-y-8">
        {/* Animated search icon */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Search className="w-8 h-8 text-primary" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-foreground">
            Analyzing Your System
          </h2>
          <p className="text-sm text-muted-foreground">
            Finding the best options for your home
          </p>
        </motion.div>

        {/* Typewriter steps */}
        <div className="space-y-2 min-h-[140px]">
          {displayedLines.map((line, idx) => {
            const isComplete = idx < currentLineIndex;
            const isCurrent = idx === currentLineIndex && displayedLines[idx]?.length === analysisSteps[idx]?.length;
            
            return (
              <motion.div
                key={idx}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {isComplete || isCurrent ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </motion.div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {line}
                  {idx === currentLineIndex && !isCurrent && (
                    <motion.span
                      className="inline-block w-0.5 h-4 bg-primary ml-0.5"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* System spec cards */}
        <motion.div
          className="flex justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
            <Droplets className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{capacityDisplay}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
            <FuelIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">{fuelDisplay}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50">
            <Wind className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground capitalize">{ventDisplay}</span>
          </div>
        </motion.div>

        {/* Progress dots */}
        <motion.div
          className="flex justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {analysisSteps.map((_, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-300",
                idx <= currentLineIndex ? "bg-primary" : "bg-muted-foreground/30"
              )}
              animate={idx === currentLineIndex ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.5, repeat: idx === currentLineIndex ? Infinity : 0 }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
