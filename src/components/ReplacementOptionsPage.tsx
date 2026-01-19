import { useState, useMemo, useEffect } from 'react';
import { Check, Flame, Zap } from 'lucide-react';
import { LeadCaptureFlow, type UrgencyLevel } from './LeadCaptureFlow';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
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
}

const LOADER_DURATION_MS = 2500;

// Determine urgency level based on inputs
function getUrgencyLevel(isSafetyReplacement: boolean, agingRate: number): UrgencyLevel {
  if (isSafetyReplacement) return 'red';
  if (agingRate >= 1.3) return 'yellow';
  return 'yellow'; // Default to yellow for replacement flow
}

// Generate education bullets based on inputs
function getEducationBullets(
  inputs: ForensicInputs,
  isSafetyReplacement: boolean,
  infrastructureIssues: InfrastructureIssue[],
): string[] {
  const bullets: string[] = [];
  
  if (isSafetyReplacement) {
    bullets.push("Your unit has been flagged for immediate attention");
    bullets.push("A licensed plumber can assess the situation and explain next steps");
    bullets.push("Water damage from failure averages $4,000–$10,000 to repair");
  } else {
    // Yellow tier - value focus
    if (inputs.calendarAge >= 10) {
      bullets.push(`At ${inputs.calendarAge} years old, your water heater is approaching the end of its typical lifespan`);
    } else {
      bullets.push("Your unit shows signs of wear that accelerate failure risk");
    }
    
    if (infrastructureIssues.length > 0) {
      bullets.push(`There are ${infrastructureIssues.length} infrastructure upgrade${infrastructureIssues.length > 1 ? 's' : ''} that could extend equipment life`);
    } else {
      bullets.push("Acting now can extend your water heater's life by 3-5 years");
    }
    
    bullets.push("A local expert can review your options at no obligation");
  }
  
  return bullets;
}

export function ReplacementOptionsPage({
  onBack,
  onSchedule,
  currentInputs,
  infrastructureIssues,
  isSafetyReplacement,
  agingRate,
  showFakeLoader = false,
  onFakeLoaderDone,
}: ReplacementOptionsPageProps) {
  const [isOverlayVisible, setIsOverlayVisible] = useState(showFakeLoader);
  const [loaderProgress, setLoaderProgress] = useState(0);

  // Calculate urgency and education content
  const urgencyLevel = useMemo(
    () => getUrgencyLevel(isSafetyReplacement, agingRate),
    [isSafetyReplacement, agingRate]
  );
  
  const educationBullets = useMemo(
    () => getEducationBullets(currentInputs, isSafetyReplacement, infrastructureIssues),
    [currentInputs, isSafetyReplacement, infrastructureIssues]
  );

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

  // Main content - Lead Capture Flow (education → form)
  return (
    <LeadCaptureFlow
      captureSource="replacement_quote"
      captureContext={{
        isSafetyReplacement,
        agingRate,
        location: currentInputs.location,
        fuelType: currentInputs.fuelType,
        tankCapacity: currentInputs.tankCapacity,
        calendarAge: currentInputs.calendarAge,
        infrastructureIssuesCount: infrastructureIssues.length,
      }}
      urgencyLevel={urgencyLevel}
      headline={isSafetyReplacement ? "Expert Assessment Recommended" : "Your Water Heater Needs Attention"}
      bulletPoints={educationBullets}
      onComplete={onSchedule}
      onBack={onBack}
    />
  );
}
