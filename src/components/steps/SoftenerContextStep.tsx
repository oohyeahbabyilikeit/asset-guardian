import { Droplet, ChevronRight, Calendar, Wrench, Building2, Waves, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SoftenerSaltStatus } from '@/lib/opterraAlgorithm';

interface SoftenerContextStepProps {
  wasHereWhenMoved: boolean | null;
  installYearsAgo: number | null;
  serviceFrequency: 'professional' | 'diy_salt' | 'never' | 'unknown';
  waterSource: 'city' | 'well' | null;
  saltStatus: SoftenerSaltStatus;
  onWasHereChange: (wasHere: boolean | null) => void;
  onInstallYearsChange: (years: number | null) => void;
  onServiceFrequencyChange: (freq: 'professional' | 'diy_salt' | 'never' | 'unknown') => void;
  onWaterSourceChange: (source: 'city' | 'well') => void;
  onSaltStatusChange: (status: SoftenerSaltStatus) => void;
  onNext: () => void;
}

const ownershipOptions: { label: string; value: boolean | null }[] = [
  { label: 'Yes, it was already here', value: true },
  { label: 'No, I/we installed it', value: false },
  { label: 'Not sure', value: null },
];

const installOptions = [
  { label: 'Last year', value: 1 },
  { label: '2-3 years ago', value: 2.5 },
  { label: '4-6 years ago', value: 5 },
  { label: '7+ years ago', value: 8 },
];

type ServiceFreq = 'professional' | 'diy_salt' | 'never' | 'unknown';
const serviceOptions: { label: string; value: ServiceFreq; icon: typeof Wrench }[] = [
  { label: 'Yes, professionally', value: 'professional', icon: Wrench },
  { label: 'I add salt myself', value: 'diy_salt', icon: Droplet },
  { label: 'Never / Not sure', value: 'never', icon: Calendar },
];

type WaterSourceType = 'city' | 'well';
const waterSourceOptions: { label: string; value: WaterSourceType; icon: typeof Building2; description: string }[] = [
  { label: 'City Water', value: 'city', icon: Building2, description: 'Municipal supply with chlorine treatment' },
  { label: 'Well Water', value: 'well', icon: Waves, description: 'Private well, may contain iron/sediment' },
];

// v7.6: Salt status options for zero-friction hardness detection
const saltStatusOptions: { label: string; value: SoftenerSaltStatus; description: string }[] = [
  { label: 'Salt looks OK', value: 'OK', description: 'Salt visible above water line' },
  { label: 'Empty / Low', value: 'EMPTY', description: 'No salt visible or below water' },
  { label: 'Not sure', value: 'UNKNOWN', description: 'Cannot check or lid stuck' },
];

export function SoftenerContextStep({
  wasHereWhenMoved,
  installYearsAgo,
  serviceFrequency,
  waterSource,
  saltStatus,
  onWasHereChange,
  onInstallYearsChange,
  onServiceFrequencyChange,
  onWaterSourceChange,
  onSaltStatusChange,
  onNext,
}: SoftenerContextStepProps) {
  const showInstallQuestion = wasHereWhenMoved === false;

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          About your water softener
        </h1>
        <p className="text-muted-foreground text-base">
          Understanding its history helps us predict maintenance needs.
        </p>
      </div>

      {/* Question 1: Water Source (most important for algorithm) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Droplet className="w-4 h-4 text-muted-foreground" />
          What's your water source?
        </label>
        
        <div className="space-y-2">
          {waterSourceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onWaterSourceChange(option.value)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                waterSource === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-3">
                <option.icon className={cn(
                  "w-4 h-4",
                  waterSource === option.value ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="text-left">
                  <span className={cn(
                    "text-sm font-medium block",
                    waterSource === option.value ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {option.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                waterSource === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {waterSource === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question 2: Was it here? */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Droplet className="w-4 h-4 text-muted-foreground" />
          Was the softener here when you moved in?
        </label>
        
        <div className="space-y-2">
          {ownershipOptions.map((option) => (
            <button
              key={String(option.value)}
              onClick={() => {
                onWasHereChange(option.value);
                if (option.value !== false) {
                  onInstallYearsChange(null);
                }
              }}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                wasHereWhenMoved === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                wasHereWhenMoved === option.value ? "text-foreground" : "text-muted-foreground"
              )}>
                {option.label}
              </span>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                wasHereWhenMoved === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {wasHereWhenMoved === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question 2: When installed (conditional) */}
      {showInstallQuestion && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            When was it installed?
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            {installOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onInstallYearsChange(option.value)}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 text-sm",
                  installYearsAgo === option.value
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question 3: Service frequency */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" />
          Do you service your softener regularly?
        </label>
        
        <div className="space-y-2">
          {serviceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onServiceFrequencyChange(option.value)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all duration-200",
                serviceFrequency === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center gap-3">
                <option.icon className={cn(
                  "w-4 h-4",
                  serviceFrequency === option.value ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  serviceFrequency === option.value ? "text-foreground" : "text-muted-foreground"
                )}>
                  {option.label}
                </span>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                serviceFrequency === option.value
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {serviceFrequency === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                )}
              </div>
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
