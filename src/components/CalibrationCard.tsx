import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Droplet, ShowerHead, Flame, Users, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  onComplete: (data: CalibrationData) => void;
}

type Step = 'people' | 'usage' | 'flush' | 'softener';

export function CalibrationCard({ 
  hasSoftener, 
  defaultPeopleCount = 3,
  onComplete 
}: CalibrationCardProps) {
  const [step, setStep] = useState<Step>('people');
  const [peopleCount, setPeopleCount] = useState(defaultPeopleCount);
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  const [flushHistory, setFlushHistory] = useState<FlushHistory | null>(null);
  const [softenerAge, setSoftenerAge] = useState<SoftenerAge | null>(null);

  const totalSteps = hasSoftener ? 4 : 3;
  const currentStepNum = step === 'people' ? 1 : step === 'usage' ? 2 : step === 'flush' ? 3 : 4;

  const handlePeopleNext = () => {
    setStep('usage');
  };

  const handleUsageSelect = (type: UsageType) => {
    setUsageType(type);
    setStep('flush');
  };

  const handleFlushSelect = (history: FlushHistory) => {
    setFlushHistory(history);
    if (hasSoftener) {
      setStep('softener');
    } else {
      // Complete!
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Progress dots */}
      <div className="pt-8 pb-4 flex justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i < currentStepNum ? "bg-primary" : "bg-slate-600"
            )}
          />
        ))}
      </div>

      {/* Step content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        
        {/* Step 1: People */}
        {step === 'people' && (
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">How many people use hot water?</h2>
              <p className="text-slate-400">Slide to select</p>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <span className="text-6xl font-bold text-white">{peopleCount}</span>
              </div>
              <Slider
                value={[peopleCount]}
                onValueChange={(value) => setPeopleCount(value[0])}
                min={1}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-500">
                <span>1</span>
                <span>8</span>
              </div>
            </div>

            <Button 
              onClick={handlePeopleNext}
              className="w-full h-14 text-lg"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Usage */}
        {step === 'usage' && (
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <ShowerHead className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">How heavy is your hot water usage?</h2>
              <p className="text-slate-400">Tap to select</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleUsageSelect('light')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <Droplet className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">Light</p>
                    <p className="text-sm text-slate-400">Quick showers, minimal usage</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUsageSelect('normal')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <ShowerHead className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">Normal</p>
                    <p className="text-sm text-slate-400">Regular showers and dishes</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUsageSelect('heavy')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <Flame className="w-8 h-8 text-orange-400" />
                  <div>
                    <p className="text-lg font-semibold text-white">Heavy</p>
                    <p className="text-sm text-slate-400">Long showers, we run out sometimes</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Flush History */}
        {step === 'flush' && (
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-white">When was the tank last flushed?</h2>
              <p className="text-slate-400">Tap to select</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleFlushSelect('recent')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">Within the last year</p>
                <p className="text-sm text-slate-400">A technician flushed it recently</p>
              </button>

              <button
                onClick={() => handleFlushSelect('never')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">Never</p>
                <p className="text-sm text-slate-400">It has never been flushed</p>
              </button>

              <button
                onClick={() => handleFlushSelect('unknown')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-primary hover:bg-primary/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">Not sure</p>
                <p className="text-sm text-slate-400">I honestly have no idea</p>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Softener Age (conditional) */}
        {step === 'softener' && (
          <div className="w-full max-w-sm space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                <Droplet className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">How old is the water softener?</h2>
              <p className="text-slate-400">Tap to select</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSoftenerSelect('new')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">New</p>
                <p className="text-sm text-slate-400">Installed in the last 5 years</p>
              </button>

              <button
                onClick={() => handleSoftenerSelect('came_with_house')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">Came with the house</p>
                <p className="text-sm text-slate-400">It was here when I moved in</p>
              </button>

              <button
                onClick={() => handleSoftenerSelect('old')}
                className="w-full p-5 rounded-xl border-2 border-slate-600 bg-slate-800/50 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
              >
                <p className="text-lg font-semibold text-white">Old</p>
                <p className="text-sm text-slate-400">10+ years, yellowed or worn</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
