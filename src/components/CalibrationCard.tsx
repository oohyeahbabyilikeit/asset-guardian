import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Droplet, ShowerHead, Flame, Users, Clock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export function CalibrationCard({ 
  hasSoftener, 
  defaultPeopleCount = 3,
  onComplete 
}: CalibrationCardProps) {
  const [peopleCount, setPeopleCount] = useState(defaultPeopleCount);
  const [usageType, setUsageType] = useState<UsageType | null>(null);
  const [flushHistory, setFlushHistory] = useState<FlushHistory | null>(null);
  const [softenerAge, setSoftenerAge] = useState<SoftenerAge | null>(null);
  
  // Track completion for each step
  const step1Complete = true; // Slider always has a value
  const step2Complete = usageType !== null;
  const step3Complete = flushHistory !== null;
  const step4Complete = !hasSoftener || softenerAge !== null;
  
  const allComplete = step1Complete && step2Complete && step3Complete && step4Complete;

  // Auto-trigger completion when all inputs are filled
  useEffect(() => {
    if (allComplete && usageType && flushHistory) {
      // Small delay for UX polish
      const timer = setTimeout(() => {
        onComplete({
          peopleCount,
          usageType,
          flushHistory,
          softenerAge: hasSoftener ? softenerAge! : undefined,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [allComplete, peopleCount, usageType, flushHistory, softenerAge, hasSoftener, onComplete]);

  const usageOptions: { value: UsageType; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Droplet className="w-5 h-5" />, label: 'Light' },
    { value: 'normal', icon: <ShowerHead className="w-5 h-5" />, label: 'Normal' },
    { value: 'heavy', icon: <Flame className="w-5 h-5" />, label: 'Heavy' },
  ];

  const flushOptions: { value: FlushHistory; label: string }[] = [
    { value: 'never', label: 'Never' },
    { value: 'recent', label: '< 1 Year' },
    { value: 'unknown', label: 'Not Sure' },
  ];

  const softenerOptions: { value: SoftenerAge; label: string }[] = [
    { value: 'new', label: 'New (<5 yrs)' },
    { value: 'came_with_house', label: 'Came with house' },
    { value: 'old', label: 'Old' },
  ];

  // Calculate progress
  const totalSteps = hasSoftener ? 4 : 3;
  const completedSteps = [step1Complete, step2Complete, step3Complete, step4Complete]
    .slice(0, totalSteps)
    .filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-slate-800/95 border-slate-600 backdrop-blur-md shadow-2xl">
        <CardContent className="p-5">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/20 rounded-full mb-2">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-white">Unlock Your Prediction</h3>
            <p className="text-xs text-slate-400 mt-1">Calibrate the physics with 3 quick inputs</p>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-slate-700 rounded-full mb-5 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="space-y-5">
            {/* Step 1: People Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Who uses this heater?</span>
                </div>
                <span className="text-lg font-bold text-white">{peopleCount}</span>
              </div>
              <Slider
                value={[peopleCount]}
                onValueChange={(value) => setPeopleCount(value[0])}
                min={1}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>1 person</span>
                <span>8 people</span>
              </div>
            </div>

            {/* Step 2: Usage Type */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShowerHead className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">How's the hot water usage?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {usageOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setUsageType(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-lg border transition-all",
                      usageType === option.value
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    {option.icon}
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Flush History */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">When was it last flushed?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {flushOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFlushHistory(option.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                      flushHistory === option.value
                        ? "bg-primary/20 border-primary text-primary"
                        : "bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Softener Age (Conditional) */}
            {hasSoftener && (
              <div className="space-y-2 pt-2 border-t border-slate-700">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">The water softener...</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {softenerOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSoftenerAge(option.value)}
                      className={cn(
                        "px-2 py-2 rounded-lg border text-xs font-medium transition-all leading-tight",
                        softenerAge === option.value
                          ? "bg-blue-500/20 border-blue-500 text-blue-400"
                          : "bg-slate-900/50 border-slate-600 text-slate-400 hover:border-slate-500"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Completion hint */}
          {!allComplete && (
            <p className="text-xs text-center text-slate-500 mt-4">
              {completedSteps}/{totalSteps} complete — no submit button needed
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
