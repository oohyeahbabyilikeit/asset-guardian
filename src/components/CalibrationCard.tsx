import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, Check, X, HelpCircle, Sparkles, Home, Clock, Users, Droplets, ShowerHead, Flame } from 'lucide-react';
import type { UsageType } from '@/lib/opterraAlgorithm';

type FlushHistory = 'never' | 'recent' | 'unknown';
type SoftenerAge = 'new' | 'came_with_house' | 'old';

interface CalibrationData {
  peopleCount: number;
  usageType: UsageType;
  flushHistory: FlushHistory;
  softenerAge?: SoftenerAge;
}

interface CalibrationCardProps {
  hasSoftener: boolean;
  defaultPeopleCount?: number;
  photoUrl?: string;
  brand?: string;
  onComplete: (data: CalibrationData) => void;
}

type Step = 'people' | 'usage' | 'flush' | 'softener';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};


import waterHeaterImage from '@/assets/water-heater-realistic.png';

export function CalibrationCard({ 
  hasSoftener, 
  defaultPeopleCount = 3,
  photoUrl,
  brand,
  onComplete 
}: CalibrationCardProps) {
  const [step, setStep] = useState<Step>('people');
  const [direction, setDirection] = useState(1);
  const [peopleCount, setPeopleCount] = useState(defaultPeopleCount);
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  const [flushHistory, setFlushHistory] = useState<FlushHistory | null>(null);
  const [softenerAge, setSoftenerAge] = useState<SoftenerAge | null>(null);

  const totalSteps = hasSoftener ? 4 : 3;
  const currentStepNum = step === 'people' ? 1 : step === 'usage' ? 2 : step === 'flush' ? 3 : 4;
  const progress = (currentStepNum / totalSteps) * 100;

  const handlePeopleNext = () => {
    setDirection(1);
    setStep('usage');
  };

  const handleUsageSelect = (type: UsageType) => {
    setUsageType(type);
    setDirection(1);
    setStep('flush');
  };

  const handleFlushSelect = (history: FlushHistory) => {
    setFlushHistory(history);
    if (hasSoftener) {
      setDirection(1);
      setStep('softener');
    } else {
      onComplete({
        peopleCount,
        usageType: usageType!,
        flushHistory: history,
      });
    }
  };

  const handleSoftenerSelect = (age: SoftenerAge) => {
    setSoftenerAge(age);
    onComplete({
      peopleCount,
      usageType: usageType!,
      flushHistory: flushHistory!,
      softenerAge: age,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900/80 backdrop-blur-md flex flex-col">
      {/* Header with branding */}
      <div className="pt-6 px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="text-white/60 text-sm font-medium">OPTERRA</span>
          </div>
          <span className="text-white/40 text-sm">Step {currentStepNum} of {totalSteps}</span>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Water Heater Photo - Trust Builder */}
      <div className="flex flex-col items-center my-4 px-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-cyan-400/30 shadow-lg shadow-cyan-400/10">
          <img 
            src={photoUrl || waterHeaterImage} 
            alt="Your water heater"
            className="w-full h-full object-cover"
          />
        </div>
        {brand && (
          <p className="text-xs text-slate-400 mt-2 font-medium">{brand} Water Heater</p>
        )}
      </div>

      {/* Step content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          
          {/* Step 1: People */}
          {step === 'people' && (
            <motion.div
              key="people"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm space-y-8"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold text-white">How many people?</h2>
              </div>

              <div className="space-y-6">
                <div className="text-center">
                  <span className="text-8xl font-bold text-white tabular-nums">{peopleCount}</span>
                </div>
                <Slider
                  value={[peopleCount]}
                  onValueChange={(value) => setPeopleCount(value[0])}
                  min={1}
                  max={8}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-500 px-1">
                  <span>1</span>
                  <span>8</span>
                </div>
              </div>

              <Button 
                onClick={handlePeopleNext}
                className="w-full h-14 text-lg font-semibold"
                size="lg"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Usage */}
          {step === 'usage' && (
            <motion.div
              key="usage"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Hot water usage?</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleUsageSelect('light')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-blue-400 hover:bg-blue-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Droplets className="w-7 h-7 text-blue-400" />
                  </div>
                  <span className="text-white font-semibold">Light</span>
                </button>

                <button
                  onClick={() => handleUsageSelect('normal')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-green-400 hover:bg-green-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ShowerHead className="w-7 h-7 text-green-400" />
                  </div>
                  <span className="text-white font-semibold">Normal</span>
                </button>

                <button
                  onClick={() => handleUsageSelect('heavy')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-orange-400 hover:bg-orange-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Flame className="w-7 h-7 text-orange-400" />
                  </div>
                  <span className="text-white font-semibold">Heavy</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Flush History */}
          {step === 'flush' && (
            <motion.div
              key="flush"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Last tank flush?</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleFlushSelect('recent')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-green-400 hover:bg-green-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-7 h-7 text-green-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Recent</span>
                </button>

                <button
                  onClick={() => handleFlushSelect('never')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-red-400 hover:bg-red-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <X className="w-7 h-7 text-red-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Never</span>
                </button>

                <button
                  onClick={() => handleFlushSelect('unknown')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-slate-400 hover:bg-slate-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center">
                    <HelpCircle className="w-7 h-7 text-slate-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Not Sure</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Softener Age (conditional) */}
          {step === 'softener' && (
            <motion.div
              key="softener"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-sm space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Softener age?</h2>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleSoftenerSelect('new')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-blue-400 hover:bg-blue-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">New</span>
                </button>

                <button
                  onClick={() => handleSoftenerSelect('came_with_house')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-amber-400 hover:bg-amber-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Home className="w-7 h-7 text-amber-400" />
                  </div>
                  <span className="text-white font-semibold text-sm text-center leading-tight">Came With</span>
                </button>

                <button
                  onClick={() => handleSoftenerSelect('old')}
                  className="aspect-square rounded-2xl border-2 border-slate-600 bg-slate-800/50 hover:border-slate-400 hover:bg-slate-400/10 active:scale-95 transition-all flex flex-col items-center justify-center gap-2 p-4"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-500/20 flex items-center justify-center">
                    <Clock className="w-7 h-7 text-slate-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Old</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
