import { Wrench, Droplets, ChevronRight, HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * HeaterHistoryStep v8.0 - Enhanced for "5-Minute Flow"
 * 
 * NEW FIELDS (moved from tech flow to homeowner):
 * - isAnnuallyMaintained: Toggle for consistent maintenance history
 * - lastDescaleYearsAgo: Conditional for tankless units
 * 
 * These are now collected from homeowners because:
 * 1. They know their own maintenance history
 * 2. Reduces tech data collection burden
 * 3. Algorithm can use proxies if unknown
 */

interface HeaterHistoryStepProps {
  lastFlushYearsAgo: number | null;
  lastAnodeReplaceYearsAgo: number | null;
  isAnnuallyMaintained?: boolean;
  lastDescaleYearsAgo?: number | null;
  isTankless?: boolean;
  onFlushChange: (years: number | null) => void;
  onAnodeChange: (years: number | null) => void;
  onMaintenanceChange?: (maintained: boolean) => void;
  onDescaleChange?: (years: number | null) => void;
  onNext: () => void;
}

interface HistoryOption {
  label: string;
  value: number | null;
}

const flushOptions: HistoryOption[] = [
  { label: 'Never', value: null },
  { label: 'Within the last year', value: 0.5 },
  { label: '1-2 years ago', value: 1.5 },
  { label: '3+ years ago', value: 4 },
  { label: 'Not sure', value: null },
];

const anodeOptions: HistoryOption[] = [
  { label: 'Never', value: null },
  { label: 'Within the last 2 years', value: 1 },
  { label: '3-5 years ago', value: 4 },
  { label: "Not sure / What's that?", value: null },
];

const descaleOptions: HistoryOption[] = [
  { label: 'Never', value: null },
  { label: 'Within the last year', value: 0.5 },
  { label: '1-3 years ago', value: 2 },
  { label: '3+ years ago', value: 4 },
  { label: 'Not sure', value: null },
];

export function HeaterHistoryStep({
  lastFlushYearsAgo,
  lastAnodeReplaceYearsAgo,
  isAnnuallyMaintained = false,
  lastDescaleYearsAgo,
  isTankless = false,
  onFlushChange,
  onAnodeChange,
  onMaintenanceChange,
  onDescaleChange,
  onNext,
}: HeaterHistoryStepProps) {
  // Find selected options
  const getSelectedFlush = () => {
    if (lastFlushYearsAgo === null) return flushOptions[0];
    return flushOptions.find(o => o.value === lastFlushYearsAgo) || flushOptions[0];
  };
  
  const getSelectedAnode = () => {
    if (lastAnodeReplaceYearsAgo === null) return anodeOptions[0];
    return anodeOptions.find(o => o.value === lastAnodeReplaceYearsAgo) || anodeOptions[0];
  };

  const getSelectedDescale = () => {
    if (lastDescaleYearsAgo === null || lastDescaleYearsAgo === undefined) return descaleOptions[0];
    return descaleOptions.find(o => o.value === lastDescaleYearsAgo) || descaleOptions[0];
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Water heater service history
        </h1>
        <p className="text-muted-foreground text-base">
          Don't worry if you're not sure — we'll use safe assumptions.
        </p>
      </div>

      {/* Tankless: Descale History (shown first for tankless units) */}
      {isTankless && onDescaleChange && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            When was the unit last descaled/flushed?
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            {descaleOptions.map((option, idx) => (
              <button
                key={idx}
                onClick={() => onDescaleChange(option.value)}
                className={cn(
                  "flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 text-sm",
                  getSelectedDescale().label === option.label
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Helper text */}
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <HelpCircle className="w-3 h-3 mt-0.5 shrink-0" />
            Tankless units should be descaled every 1-2 years to prevent scale buildup.
          </p>
        </div>
      )}

      {/* Tank Units: Flush & Anode Questions */}
      {!isTankless && (
        <>
          {/* Question 1: Last Flush */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Droplets className="w-4 h-4 text-muted-foreground" />
              When was the tank last flushed/drained?
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              {flushOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onFlushChange(option.value)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 text-sm",
                    getSelectedFlush().label === option.label
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Anode Rod */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              When was the anode rod last replaced?
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              {anodeOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => onAnodeChange(option.value)}
                  className={cn(
                    "flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 text-sm",
                    getSelectedAnode().label === option.label
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Helper text */}
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <HelpCircle className="w-3 h-3 mt-0.5 shrink-0" />
              The anode rod protects your tank from rust. Most homeowners never replace it.
            </p>
          </div>
        </>
      )}

      {/* Annual Maintenance Toggle (for both tank and tankless) */}
      {onMaintenanceChange && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Professional maintenance history
          </label>
          
          <button
            onClick={() => onMaintenanceChange(!isAnnuallyMaintained)}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
              isAnnuallyMaintained
                ? "border-green-500 bg-green-50 text-green-800"
                : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
              isAnnuallyMaintained
                ? "border-green-500 bg-green-500"
                : "border-muted-foreground/50"
            )}>
              {isAnnuallyMaintained && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">
                This unit has been professionally maintained yearly
              </p>
              <p className="text-xs text-muted-foreground">
                Regular service visits, not just DIY flushing
              </p>
            </div>
          </button>
        </div>
      )}

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
