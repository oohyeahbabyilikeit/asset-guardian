import { AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Symptoms } from '@/types/onboarding';

interface SymptomsStepProps {
  symptoms: Symptoms;
  onSymptomsChange: (symptoms: Symptoms) => void;
  onComplete: () => void;
}

interface SymptomOption {
  key: keyof Symptoms;
  label: string;
  severity: 'warning' | 'critical';
}

const symptomOptions: SymptomOption[] = [
  { key: 'notEnoughHotWater', label: 'Not enough hot water', severity: 'warning' },
  { key: 'lukewarmWater', label: 'Lukewarm water that used to be hot', severity: 'warning' },
  { key: 'bangingPopping', label: 'Banging or popping sounds', severity: 'warning' },
  { key: 'rumblingNoise', label: 'Rumbling noises when heating', severity: 'warning' },
  { key: 'discoloredWater', label: 'Discolored or rusty water', severity: 'critical' },
  { key: 'rottenEggSmell', label: 'Rotten egg smell', severity: 'critical' },
  { key: 'visibleMoisture', label: 'Puddles or moisture near the heater', severity: 'critical' },
  { key: 'higherBills', label: 'Higher energy bills', severity: 'warning' },
];

export function SymptomsStep({
  symptoms,
  onSymptomsChange,
  onComplete,
}: SymptomsStepProps) {
  const hasNoSymptoms = Object.values(symptoms).every(v => !v);
  const hasCritical = symptomOptions
    .filter(o => o.severity === 'critical')
    .some(o => symptoms[o.key]);

  const toggleSymptom = (key: keyof Symptoms) => {
    onSymptomsChange({
      ...symptoms,
      [key]: !symptoms[key],
    });
  };

  const clearAll = () => {
    onSymptomsChange({
      notEnoughHotWater: false,
      lukewarmWater: false,
      bangingPopping: false,
      rumblingNoise: false,
      discoloredWater: false,
      rottenEggSmell: false,
      visibleMoisture: false,
      higherBills: false,
    });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          Any concerns or symptoms?
        </h1>
        <p className="text-muted-foreground text-base">
          Select all that apply — or skip if everything seems fine.
        </p>
      </div>

      {/* Symptom Checklist */}
      <div className="space-y-2">
        {symptomOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => toggleSymptom(option.key)}
            className={cn(
              "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200",
              symptoms[option.key]
                ? option.severity === 'critical'
                  ? "border-destructive bg-destructive/5"
                  : "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/50"
            )}
          >
            <div className="flex items-center gap-3">
              {option.severity === 'critical' && (
                <AlertTriangle className={cn(
                  "w-4 h-4",
                  symptoms[option.key] ? "text-destructive" : "text-muted-foreground"
                )} />
              )}
              <span className={cn(
                "text-sm font-medium text-left",
                symptoms[option.key] ? "text-foreground" : "text-muted-foreground"
              )}>
                {option.label}
              </span>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center",
              symptoms[option.key]
                ? option.severity === 'critical'
                  ? "border-destructive bg-destructive"
                  : "border-primary bg-primary"
                : "border-muted-foreground/30"
            )}>
              {symptoms[option.key] && (
                <Check className="w-3 h-3 text-primary-foreground" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* None of the above option */}
      <button
        onClick={clearAll}
        className={cn(
          "w-full flex items-center justify-center p-3 rounded-xl border-2 transition-all duration-200",
          hasNoSymptoms
            ? "border-primary bg-primary/5 text-foreground font-medium"
            : "border-border bg-card hover:border-muted-foreground/50 text-muted-foreground"
        )}
      >
        None of the above — everything seems fine
      </button>

      {/* Warning for critical symptoms */}
      {hasCritical && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30">
          <p className="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            These symptoms may indicate an urgent issue
          </p>
          <p className="text-xs text-destructive/80 mt-1">
            We'll prioritize this in your assessment.
          </p>
        </div>
      )}

      {/* CTA */}
      <Button
        onClick={onComplete}
        size="lg"
        className="w-full h-12 text-base font-medium rounded-lg"
      >
        See My Assessment
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
