import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HouseholdStep } from '@/components/steps/HouseholdStep';
import { ResidencyStep } from '@/components/steps/ResidencyStep';
import { HeaterHistoryStep } from '@/components/steps/HeaterHistoryStep';
import { SoftenerContextStep } from '@/components/steps/SoftenerContextStep';
import { SymptomsStep } from '@/components/steps/SymptomsStep';
import { OnboardingData, DEFAULT_ONBOARDING_DATA } from '@/types/onboarding';
import type { UsageType } from '@/lib/opterraAlgorithm';

interface OnboardingFlowProps {
  initialData?: Partial<OnboardingData>;
  hasSoftener: boolean;
  onComplete: (data: OnboardingData) => void;
}

type Step = 'household' | 'residency' | 'heater-history' | 'softener-context' | 'symptoms';

export function OnboardingFlow({
  initialData,
  hasSoftener,
  onComplete,
}: OnboardingFlowProps) {
  const [data, setData] = useState<OnboardingData>({
    ...DEFAULT_ONBOARDING_DATA,
    ...initialData,
    hasSoftener,
  });
  
  // Determine steps based on whether they have a softener
  const allSteps: Step[] = hasSoftener
    ? ['household', 'residency', 'heater-history', 'softener-context', 'symptoms']
    : ['household', 'residency', 'heater-history', 'symptoms'];
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = allSteps[currentStepIndex];
  const totalSteps = allSteps.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const goNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'household':
        return (
          <HouseholdStep
            peopleCount={data.peopleCount}
            usageType={data.usageType}
            onPeopleCountChange={(count) => updateData('peopleCount', count)}
            onUsageTypeChange={(type: UsageType) => updateData('usageType', type)}
            onNext={goNext}
          />
        );
      
      case 'residency':
        return (
          <ResidencyStep
            yearsAtAddress={data.yearsAtAddress}
            onYearsChange={(years) => updateData('yearsAtAddress', years)}
            onNext={goNext}
          />
        );
      
      case 'heater-history':
        return (
          <HeaterHistoryStep
            lastFlushYearsAgo={data.lastFlushYearsAgo}
            lastAnodeReplaceYearsAgo={data.lastAnodeReplaceYearsAgo}
            onFlushChange={(years) => updateData('lastFlushYearsAgo', years)}
            onAnodeChange={(years) => updateData('lastAnodeReplaceYearsAgo', years)}
            onNext={goNext}
          />
        );
      
      case 'softener-context':
        return (
          <SoftenerContextStep
            wasHereWhenMoved={data.softenerWasHereWhenMoved}
            installYearsAgo={data.softenerInstallYearsAgo}
            serviceFrequency={data.softenerServiceFrequency}
            waterSource={data.waterSource}
            onWasHereChange={(wasHere) => updateData('softenerWasHereWhenMoved', wasHere)}
            onInstallYearsChange={(years) => updateData('softenerInstallYearsAgo', years)}
            onServiceFrequencyChange={(freq) => updateData('softenerServiceFrequency', freq)}
            onWaterSourceChange={(source) => updateData('waterSource', source)}
            onNext={goNext}
          />
        );
      
      case 'symptoms':
        return (
          <SymptomsStep
            symptoms={data.symptoms}
            onSymptomsChange={(symptoms) => updateData('symptoms', symptoms)}
            onComplete={handleComplete}
          />
        );
      
      default:
        return null;
    }
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 'household': return 'Household';
      case 'residency': return 'Residency';
      case 'heater-history': return 'Service History';
      case 'softener-context': return 'Water Softener';
      case 'symptoms': return 'Symptoms';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            {currentStepIndex > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                className="text-muted-foreground -ml-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : (
              <div />
            )}
            <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
              {getStepLabel()}
            </span>
            <span className="text-xs text-muted-foreground">
              {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
