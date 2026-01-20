import { useState, useMemo, useEffect } from 'react';
import { Check, Flame, Zap, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

interface ReplacementOptionsPageProps {
  onBack: () => void;
  onSchedule: () => void;
  currentInputs: ForensicInputs;
  infrastructureIssues: InfrastructureIssue[];
  isSafetyReplacement: boolean;
  agingRate: number;
  monthlyBudget?: number;
  showFakeLoader?: boolean;
  onFakeLoaderDone?: () => void;
  metrics?: OpterraMetrics;
}

const LOADER_DURATION_MS = 2500;

export function ReplacementOptionsPage({
  onBack,
  onSchedule,
  currentInputs,
  infrastructureIssues,
  isSafetyReplacement,
  agingRate,
  showFakeLoader = false,
  onFakeLoaderDone,
  metrics,
}: ReplacementOptionsPageProps) {
  const [isOverlayVisible, setIsOverlayVisible] = useState(showFakeLoader);
  const [loaderProgress, setLoaderProgress] = useState(0);

  // Loader overlay timer
  useEffect(() => {
    if (showFakeLoader) {
      setIsOverlayVisible(true);
      const timer = setTimeout(() => {
        setIsOverlayVisible(false);
        onFakeLoaderDone?.();
      }, LOADER_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [showFakeLoader, onFakeLoaderDone]);

  // Smooth progress bar
  useEffect(() => {
    if (!isOverlayVisible) {
      setLoaderProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / LOADER_DURATION_MS) * 100);
      setLoaderProgress(progress);
      
      if (elapsed >= LOADER_DURATION_MS) {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isOverlayVisible]);

  // Loader animation content
  const capacityDisplay = `${currentInputs.tankCapacity || 50} gallon`;
  const fuelDisplay = currentInputs.fuelType === 'ELECTRIC' ? 'Electric' : 'Gas';
  const ventDisplay = currentInputs.ventType || 'Standard';
  const analysisSteps = useMemo(() => [
    `Reviewing ${capacityDisplay} ${fuelDisplay.toLowerCase()} unit...`,
    'Checking current condition factors...',
    'Preparing your consultation...',
  ], [capacityDisplay, fuelDisplay]);
  
  const { displayedLines, currentLineIndex } = useTypewriter({ 
    lines: analysisSteps, 
    typingSpeed: 15, 
    lineDelay: 400 
  });
  const FuelIcon = currentInputs.fuelType === 'ELECTRIC' ? Zap : Flame;

  // Loader overlay
  if (isOverlayVisible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="w-full max-w-md space-y-8">
          {/* Unit specs card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <FuelIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{capacityDisplay}</p>
                <p className="text-sm text-gray-400">{fuelDisplay} • {ventDisplay}</p>
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${loaderProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Terminal-style output */}
          <div className="p-4 rounded-xl bg-black/40 font-mono text-sm space-y-2 min-h-[100px]">
            <AnimatePresence mode="popLayout">
              {displayedLines.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  {idx < currentLineIndex ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span className={idx < currentLineIndex ? 'text-gray-400' : 'text-white'}>
                    {line}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // After loader - show simple info page that leads to service selection
  const urgencyMessage = isSafetyReplacement 
    ? "Based on safety concerns, we recommend discussing replacement options with a professional."
    : agingRate >= 1.3
    ? "Your unit is aging faster than normal. A professional can help you evaluate your options."
    : "A professional can review your situation and discuss the best path forward.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="min-h-[44px] min-w-[44px]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Replacement Options</h1>
            <p className="text-xs text-muted-foreground">Get expert guidance</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <h2 className="font-semibold text-lg mb-2">Ready for Expert Guidance</h2>
            <p className="text-sm text-muted-foreground">
              {urgencyMessage}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Your Unit Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="font-semibold">{currentInputs.tankCapacity || 50} Gallons</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Fuel Type</p>
                <p className="font-semibold">{fuelDisplay}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Age</p>
                <p className="font-semibold">{currentInputs.calendarAge || 0} Years</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-semibold capitalize">{(currentInputs.location || 'Unknown').toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
          </div>

          {infrastructureIssues.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Issues to Discuss
              </h3>
              <div className="space-y-2">
                {infrastructureIssues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="font-medium text-sm">{issue.friendlyName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
        <Button 
          onClick={onSchedule}
          className="w-full h-14 text-base font-semibold gap-2"
          size="lg"
        >
          <Phone className="h-5 w-5" />
          Have My Plumber Reach Out
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Your plumber will contact you to discuss your options
        </p>
      </div>
    </div>
  );
}