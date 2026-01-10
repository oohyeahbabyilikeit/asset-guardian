import { Droplet, Waves, Sparkles, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { UsageType } from '@/lib/opterraAlgorithm';

interface HouseholdStepProps {
  peopleCount: number;
  usageType: UsageType;
  onPeopleCountChange: (count: number) => void;
  onUsageTypeChange: (type: UsageType) => void;
  onNext: () => void;
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
    title: 'Light',
    description: 'Short showers, minimal use',
  },
  {
    type: 'normal',
    icon: <Waves className="w-6 h-6" />,
    title: 'Average',
    description: 'Typical daily showers and tasks',
  },
  {
    type: 'heavy',
    icon: <Sparkles className="w-6 h-6" />,
    title: 'Heavy',
    description: 'Long showers, frequent use',
  },
];

export function HouseholdStep({
  peopleCount,
  usageType,
  onPeopleCountChange,
  onUsageTypeChange,
  onNext,
}: HouseholdStepProps) {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Your Household
        </h1>
        <p className="text-muted-foreground text-base">
          This helps us estimate daily demand on your system.
        </p>
      </div>

      {/* Question 1: People Count */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Number of people in your home
        </label>
        
        <div className="space-y-3">
          <Slider
            value={[peopleCount]}
            onValueChange={(value) => onPeopleCountChange(value[0])}
            min={1}
            max={8}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span className="text-lg font-semibold text-foreground">
              {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
            </span>
            <span>8+</span>
          </div>
        </div>
      </div>

      {/* Question 2: Usage Type */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">
          How would you describe your hot water usage?
        </label>
        
        <div className="grid grid-cols-3 gap-3">
          {usageOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => onUsageTypeChange(option.type)}
              className={cn(
                "flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200",
                usageType === option.type
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <div className={cn(
                "mb-2",
                usageType === option.type ? "text-primary" : "text-muted-foreground"
              )}>
                {option.icon}
              </div>
              <span className={cn(
                "text-sm font-medium",
                usageType === option.type ? "text-foreground" : "text-muted-foreground"
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
        onClick={onNext}
        size="lg"
        className="w-full h-12 text-base font-medium rounded-lg"
      >
        Continue
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
