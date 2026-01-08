import { useState } from 'react';
import { Droplet, Waves, Sparkles, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { UsageType } from '@/lib/opterraAlgorithm';

interface CalibrationStepProps {
  peopleCount: number;
  usageType: UsageType;
  onPeopleCountChange: (count: number) => void;
  onUsageTypeChange: (type: UsageType) => void;
  onComplete: () => void;
}

interface UsageOption {
  type: UsageType;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const usageOptions: UsageOption[] = [
  {
    type: 'light',
    icon: <Droplet className="w-6 h-6" />,
    title: 'Efficient',
    description: 'We keep it quick',
  },
  {
    type: 'normal',
    icon: <Waves className="w-6 h-6" />,
    title: 'Standard',
    description: 'Normal daily routine',
  },
  {
    type: 'heavy',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Spa Mode',
    description: 'We love long, hot showers',
  },
];

export function CalibrationStep({
  peopleCount,
  usageType,
  onPeopleCountChange,
  onUsageTypeChange,
  onComplete,
}: CalibrationStepProps) {
  const [localPeopleCount, setLocalPeopleCount] = useState(peopleCount);
  const [localUsageType, setLocalUsageType] = useState<UsageType>(usageType);
  
  const handleContinue = () => {
    onPeopleCountChange(localPeopleCount);
    onUsageTypeChange(localUsageType);
    onComplete();
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Usage Calibration
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Let's calibrate your savings
            </h1>
            <p className="text-muted-foreground text-base">
              This helps us calculate your actual sediment buildup rate.
            </p>
          </div>

          {/* Question 1: People Count */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              How many people rely on this heater?
            </label>
            
            <div className="space-y-3">
              <Slider
                value={[localPeopleCount]}
                onValueChange={(value) => setLocalPeopleCount(value[0])}
                min={1}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span className="text-lg font-semibold text-foreground">{localPeopleCount} {localPeopleCount === 1 ? 'person' : 'people'}</span>
                <span>8+</span>
              </div>
            </div>
          </div>

          {/* Question 2: Usage Type */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">
              What's the hot water vibe?
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              {usageOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => setLocalUsageType(option.type)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                    localUsageType === option.type
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-muted-foreground/50"
                  )}
                >
                  <div className={cn(
                    "mb-2",
                    localUsageType === option.type ? "text-primary" : "text-muted-foreground"
                  )}>
                    {option.icon}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    localUsageType === option.type ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {option.title}
                  </span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-lg"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}