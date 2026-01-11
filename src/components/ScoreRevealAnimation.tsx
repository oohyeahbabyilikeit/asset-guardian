import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Skull, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OpterraResult } from '@/lib/opterraAlgorithm';

interface ScoreRevealAnimationProps {
  result: OpterraResult;
  onComplete: () => void;
}

export function ScoreRevealAnimation({ result, onComplete }: ScoreRevealAnimationProps) {
  const [phase, setPhase] = useState<'counting' | 'badge' | 'projection' | 'ready'>('counting');
  const [displayScore, setDisplayScore] = useState(0);

  const targetScore = result.metrics.healthScore;
  
  // Determine status based on score
  const getStatus = () => {
    if (targetScore >= 70) return { label: 'RUNNING STRONG', color: 'green', icon: CheckCircle };
    if (targetScore >= 50) return { label: 'MONITOR CLOSELY', color: 'amber', icon: Clock };
    if (targetScore >= 30) return { label: 'ON BORROWED TIME', color: 'orange', icon: AlertTriangle };
    return { label: 'CRITICAL', color: 'red', icon: Skull };
  };

  const status = getStatus();
  
  // Get projection text
  const getProjectionText = () => {
    const yearsLeft = result.metrics.yearsLeftCurrent;
    if (yearsLeft <= 1) return 'Less than 1 year';
    if (yearsLeft <= 2) return '1-2 years';
    if (yearsLeft <= 3) return '2-3 years';
    if (yearsLeft <= 5) return '3-5 years';
    return '5+ years';
  };

  // Count-up animation - slower for more dramatic effect
  useEffect(() => {
    if (phase !== 'counting') return;
    
    const duration = 1800; // Slower count-up (was 1200)
    const steps = 60;
    const increment = targetScore / steps;
    const stepDuration = duration / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setDisplayScore(targetScore);
        clearInterval(timer);
        setTimeout(() => setPhase('badge'), 400); // Longer pause before badge
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [phase, targetScore]);

  // Phase transitions - slower to let users absorb
  useEffect(() => {
    if (phase === 'badge') {
      const timer = setTimeout(() => setPhase('projection'), 1000); // Was 400ms
      return () => clearTimeout(timer);
    }
    if (phase === 'projection') {
      const timer = setTimeout(() => setPhase('ready'), 1200); // Was immediate onComplete
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const getScoreColor = () => {
    if (displayScore >= 70) return 'text-green-400';
    if (displayScore >= 50) return 'text-amber-400';
    if (displayScore >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        {/* Score Display */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative"
        >
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">
            Health Score
          </div>
          <motion.div
            className={cn(
              "text-8xl font-bold transition-colors duration-100",
              getScoreColor()
            )}
            animate={phase === 'counting' ? {} : { 
              textShadow: [
                `0 0 20px currentColor`,
                `0 0 40px currentColor`,
                `0 0 20px currentColor`
              ]
            }}
            transition={{ duration: 0.6, repeat: phase === 'badge' ? 2 : 0 }}
          >
            {displayScore}
          </motion.div>
          
          {/* Circular glow effect */}
          <motion.div
            className={cn(
              "absolute -inset-8 rounded-full blur-3xl opacity-20 -z-10",
              displayScore >= 70 ? 'bg-green-500' :
              displayScore >= 50 ? 'bg-amber-500' :
              displayScore >= 30 ? 'bg-orange-500' : 'bg-red-500'
            )}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 0.8 }}
          />
        </motion.div>

        {/* Status Badge */}
        <AnimatePresence>
          {(phase === 'badge' || phase === 'projection' || phase === 'ready') && (
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex justify-center"
            >
              <Badge 
                className={cn(
                  "px-4 py-2 text-sm font-semibold flex items-center gap-2",
                  status.color === 'green' && 'bg-green-500/20 text-green-400 border-green-500/30',
                  status.color === 'amber' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                  status.color === 'orange' && 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  status.color === 'red' && 'bg-red-500/20 text-red-400 border-red-500/30'
                )}
              >
                <StatusIcon className="w-4 h-4" />
                {status.label}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Projection */}
        <AnimatePresence>
          {(phase === 'projection' || phase === 'ready') && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-1"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                Projected Timeline
              </div>
              <div className={cn(
                "text-2xl font-semibold",
                targetScore >= 50 ? 'text-slate-300' : 'text-red-400'
              )}>
                {getProjectionText()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Report Button - shows when ready */}
        <AnimatePresence>
          {phase === 'ready' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Button 
                onClick={handleContinue}
                size="lg"
                className="h-14 px-8 text-lg font-semibold"
              >
                View Your Report
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading indicator during counting animation */}
        {phase === 'counting' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.15 
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
