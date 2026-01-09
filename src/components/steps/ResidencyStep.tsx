import { Home, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResidencyStepProps {
  yearsAtAddress: number;
  onYearsChange: (years: number) => void;
  onNext: () => void;
}

interface ResidencyOption {
  label: string;
  value: number;
  description: string;
}

const residencyOptions: ResidencyOption[] = [
  { label: 'Less than 1 year', value: 0.5, description: 'Just moved in' },
  { label: '1-3 years', value: 2, description: 'Getting settled' },
  { label: '3-5 years', value: 4, description: 'A few years now' },
  { label: '5-10 years', value: 7, description: 'Well established' },
  { label: '10+ years', value: 12, description: 'Long-time owner' },
];

export function ResidencyStep({
  yearsAtAddress,
  onYearsChange,
  onNext,
}: ResidencyStepProps) {
  // Find the closest matching option
  const selectedOption = residencyOptions.reduce((prev, curr) => 
    Math.abs(curr.value - yearsAtAddress) < Math.abs(prev.value - yearsAtAddress) ? curr : prev
  );

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          How long have you lived here?
        </h1>
        <p className="text-muted-foreground text-base">
          This helps us understand what you might know about the equipment history.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground" />
          Time at this address
        </label>
        
        <div className="space-y-2">
          {residencyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onYearsChange(option.value);
                setTimeout(() => onNext(), 200);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
                selectedOption.value === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <div className="text-left">
                <span className={cn(
                  "text-base font-medium",
                  selectedOption.value === option.value ? "text-foreground" : "text-muted-foreground"
                )}>
                  {option.label}
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                selectedOption.value === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {selectedOption.value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
