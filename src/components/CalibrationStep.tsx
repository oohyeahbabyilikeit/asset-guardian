import { useState } from 'react';
import { Droplet, Waves, Sparkles, Users, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { UsageType } from '@/lib/opterraAlgorithm';

interface CalibrationStepProps {
  peopleCount: number;
  usageType: UsageType;
  tankCapacity: number;
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

// Calculate First Hour Rating demand vs capacity
function calculateCapacityWarning(peopleCount: number, usageType: UsageType, tankCapacity: number) {
  // Estimated gallons per person per use based on usage type
  const gallonsPerPerson = {
    light: 12,   // Quick 5-min shower
    normal: 18,  // Standard 10-min shower
    heavy: 30,   // Long 20-min shower
  };
  
  // Peak morning demand (70% of household showers in 1 hour)
  const peakUsage = Math.ceil(peopleCount * 0.7) * gallonsPerPerson[usageType];
  
  // First Hour Rating approximation (tank capacity + recovery)
  // Gas tanks recover ~40 GPH, electric ~20 GPH
  // We'll use conservative 30 GPH average recovery
  const estimatedFHR = tankCapacity + 30;
  
  const deficit = peakUsage - estimatedFHR;
  const deficitPercent = Math.round((deficit / estimatedFHR) * 100);
  
  if (deficitPercent > 20) {
    return {
      show: true,
      severity: 'critical' as const,
      deficitPercent,
      message: `Your tank is ${deficitPercent}% undersized for your family's hot water demand.`,
    };
  } else if (deficitPercent > 0) {
    return {
      show: true,
      severity: 'warning' as const,
      deficitPercent,
      message: `Your tank may run short during peak morning use.`,
    };
  }
  
  return { show: false, severity: 'optimal' as const, deficitPercent: 0, message: '' };
}

export function CalibrationStep({
  peopleCount,
  usageType,
  tankCapacity,
  onPeopleCountChange,
  onUsageTypeChange,
  onComplete,
}: CalibrationStepProps) {
  const [localPeopleCount, setLocalPeopleCount] = useState(peopleCount);
  const [localUsageType, setLocalUsageType] = useState<UsageType>(usageType);
  
  const capacityWarning = calculateCapacityWarning(localPeopleCount, localUsageType, tankCapacity);
  
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

          {/* Capacity Warning Card */}
          {capacityWarning.show && (
            <div className={cn(
              "p-4 rounded-xl border",
              capacityWarning.severity === 'critical'
                ? "bg-destructive/5 border-destructive/30"
                : "bg-yellow-500/5 border-yellow-500/30"
            )}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn(
                  "w-5 h-5 flex-shrink-0 mt-0.5",
                  capacityWarning.severity === 'critical' ? "text-destructive" : "text-yellow-600"
                )} />
                <div className="space-y-2">
                  <p className={cn(
                    "text-sm font-medium",
                    capacityWarning.severity === 'critical' ? "text-destructive" : "text-yellow-700"
                  )}>
                    Capacity Warning
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {capacityWarning.message}
                  </p>
                  <button className="text-sm font-medium text-primary hover:underline">
                    See Tankless Options →
                  </button>
                </div>
              </div>
            </div>
          )}

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