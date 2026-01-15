import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Flame, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
const MIN_DISPLAY_TIME = 3000;

export function PriceAnalysisLoader({
  currentInputs,
  infrastructureIssues,
  onComplete,
  onBack,
  complexity = 'STANDARD',
}: PriceAnalysisLoaderProps) {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const [fetchStarted, setFetchStarted] = useState(false);

  // Fetch pricing in background
  const { tiers, allLoading } = useTieredPricing(
    currentInputs,
    DEMO_CONTRACTOR_ID,
    complexity,
    true,
    infrastructureIssues
  );

  // Track when fetching actually starts (loading goes true)
  useEffect(() => {
    if (allLoading && !fetchStarted) {
      setFetchStarted(true);
    }
  }, [allLoading, fetchStarted]);

  // Format specs for display
  const capacityDisplay = `${currentInputs.tankCapacity || 50} gallon`;
  const fuelDisplay = currentInputs.fuelType === 'ELECTRIC' ? 'electric' : 
                      currentInputs.fuelType === 'GAS' ? 'gas' : 'propane';
  const ventDisplay = currentInputs.ventType?.replace(/_/g, ' ').toLowerCase() || 'standard';

  // Dynamic analysis steps
  const analysisSteps = useMemo(() => [
    'Scanning unit specifications...',
    `Detected: ${capacityDisplay} ${fuelDisplay} unit`,
    `Venting configuration: ${ventDisplay}`,
    'Matching manufacturer pricing...',
    'Calculating installation factors...',
    'Building your personalized options...',
  ], [capacityDisplay, fuelDisplay, ventDisplay]);

  const handleTypewriterComplete = useCallback(() => {
    // Typewriter finished
  }, []);

  const { displayedLines, isComplete: typewriterComplete, currentLineIndex } = useTypewriter({
    lines: analysisSteps,
    typingSpeed: 30,
    lineDelay: 400,
    onComplete: handleTypewriterComplete,
  });

  // Calculate progress percentage
  const progress = Math.min(100, Math.round(((currentLineIndex + 1) / analysisSteps.length) * 100));

  // Minimum display time
  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_DISPLAY_TIME);
    return () => clearTimeout(timer);
  }, []);

  // Transition when all conditions are met (including fetch has actually started & completed)
  useEffect(() => {
    if (fetchStarted && !allLoading && minTimeElapsed && typewriterComplete && !hasTransitioned) {
      setHasTransitioned(true);
      setTimeout(() => onComplete(tiers), 300);
    }
  }, [fetchStarted, allLoading, minTimeElapsed, typewriterComplete, hasTransitioned, tiers, onComplete]);

  // Get fuel icon
  const FuelIcon = currentInputs.fuelType === 'ELECTRIC' ? Zap : 
                   currentInputs.fuelType === 'GAS' ? Flame : Droplets;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Tech grid background */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Radial glow from center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12)_0%,transparent_60%)]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen px-4 py-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="self-start text-slate-400 hover:text-white hover:bg-slate-800/50 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Main content - centered */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          
          {/* Animated system specs card */}
          <motion.div 
            className="relative mb-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Pulsing outer ring */}
            <motion.div 
              className="absolute -inset-3 rounded-2xl border border-primary/30"
              animate={{ 
                scale: [1, 1.03, 1], 
                opacity: [0.3, 0.6, 0.3] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
            />
            
            {/* Glow effect */}
            <div className="absolute -inset-6 bg-primary/10 rounded-3xl blur-2xl" />
            
            {/* Main card */}
            <div className="relative bg-slate-800/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <FuelIcon className="w-6 h-6 text-primary" />
                <span className="text-4xl font-bold text-white tracking-tight">
                  {currentInputs.tankCapacity || 50}
                </span>
                <span className="text-2xl text-slate-400 font-light">GAL</span>
              </div>
              <div className="text-center text-slate-400 text-sm uppercase tracking-widest">
                {fuelDisplay} • {ventDisplay}
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full mb-8">
            <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary via-cyan-400 to-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
              {/* Shimmer effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Analyzing</span>
              <span>{progress}%</span>
            </div>
          </div>

          {/* Terminal-style status messages */}
          <div className="w-full bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="font-mono text-sm space-y-2">
              <AnimatePresence mode="popLayout">
                {displayedLines.map((line, idx) => {
                  const isComplete = idx < currentLineIndex;
                  const isCurrent = idx === currentLineIndex;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex items-start gap-2",
                        isComplete && "text-green-400/80",
                        isCurrent && "text-primary",
                        !isComplete && !isCurrent && "text-slate-500"
                      )}
                    >
                      <span className="flex-shrink-0 mt-0.5">
                        {isComplete ? '✓' : isCurrent ? '→' : '○'}
                      </span>
                      <span className="flex-1">{line}</span>
                      {isCurrent && !typewriterComplete && (
                        <motion.span 
                          className="text-primary"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          █
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Status indicator */}
          <motion.div 
            className="mt-8 text-xs uppercase tracking-[0.2em] text-slate-500"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="inline-flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {typewriterComplete && !allLoading ? 'Finalizing' : 'Analyzing'}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
