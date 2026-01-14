import React, { useState } from 'react';
import { 
  Wind, 
  Droplets, 
  CheckCircle,
  AlertTriangle,
  Home,
  Filter
} from 'lucide-react';
import type { HybridInspection } from '@/types/technicianInspection';
import { useFilterScan } from '@/hooks/useFilterScan';
import { ScanHeroCard } from '@/components/ui/ScanHeroCard';
import { TechnicianStepLayout, StepCard } from './TechnicianStepLayout';
import { cn } from '@/lib/utils';

type SubStep = 'air-filter' | 'condensate' | 'confined-space';

interface HybridCheckStepProps {
  data: HybridInspection;
  onUpdate: (data: Partial<HybridInspection>) => void;
  onNext: () => void;
}

export function HybridCheckStep({ data, onUpdate, onNext }: HybridCheckStepProps) {
  const { scanFilter, isScanning, result } = useFilterScan();
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('air-filter');
  
  const subSteps: SubStep[] = ['air-filter', 'condensate', 'confined-space'];
  const currentIndex = subSteps.indexOf(currentSubStep);
  
  const handleScanImage = async (file: File) => {
    const scanResult = await scanFilter(file, 'air');
    if (scanResult) {
      onUpdate({ airFilterStatus: scanResult.status });
    }
  };

  const scanSummary = result && (
    <div className="space-y-1 text-sm">
      <p className={
        result.status === 'CLOGGED' ? 'text-red-600 font-medium' :
        result.status === 'DIRTY' ? 'text-yellow-600' : 'text-green-600'
      }>
        Filter: {result.status} ({result.blockagePercent}% blocked)
      </p>
      {result.recommendation && (
        <p className="text-muted-foreground text-xs">{result.recommendation}</p>
      )}
    </div>
  );

  // Derive confined space from roomVolumeType for backwards compat
  const isConfinedSpace = data.roomVolumeType === 'CLOSET_SEALED';
  
  const handleConfinedSpaceToggle = (confined: boolean) => {
    onUpdate({ 
      roomVolumeType: confined ? 'CLOSET_SEALED' : 'OPEN' 
    });
  };

  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'air-filter':
        return data.airFilterStatus !== undefined;
      case 'condensate':
        return data.isCondensateClear !== undefined;
      case 'confined-space':
        return data.roomVolumeType !== undefined;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < subSteps.length) {
      setCurrentSubStep(subSteps[nextIndex]);
    } else {
      onNext();
    }
  };

  const getStepTitle = (): string => {
    switch (currentSubStep) {
      case 'air-filter': return 'Air Filter';
      case 'condensate': return 'Condensate Drain';
      case 'confined-space': return 'Space Check';
      default: return 'Heat Pump Check';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'air-filter': return <Filter className="h-7 w-7" />;
      case 'condensate': return <Droplets className="h-7 w-7" />;
      case 'confined-space': return <Home className="h-7 w-7" />;
      default: return <Wind className="h-7 w-7" />;
    }
  };

  // Progress dots
  const renderProgress = () => (
    <div className="flex justify-center gap-2 mb-6">
      {subSteps.map((step, index) => (
        <button
          key={step}
          onClick={() => index < currentIndex && setCurrentSubStep(step)}
          disabled={index >= currentIndex}
          className={cn(
            "h-2 rounded-full transition-all",
            index === currentIndex ? "w-8 bg-primary" : "w-2",
            index < currentIndex ? "bg-primary/60 cursor-pointer hover:bg-primary/80" : "bg-muted cursor-default"
          )}
        />
      ))}
    </div>
  );

  const renderAirFilterStep = () => (
    <ScanHeroCard
      title="Air Filter"
      subtitle="Photo the filter element"
      isScanning={isScanning}
      hasScanned={!!result}
      scanSummary={scanSummary}
      onScanImage={handleScanImage}
      scanLabel="📷 Scan Air Filter"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Or select filter condition manually
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'CLEAN' as const, label: 'Clean', icon: <CheckCircle className="h-5 w-5" />, color: 'green' },
            { value: 'DIRTY' as const, label: 'Dirty', icon: <AlertTriangle className="h-5 w-5" />, color: 'yellow' },
            { value: 'CLOGGED' as const, label: 'Clogged', icon: <AlertTriangle className="h-5 w-5" />, color: 'red' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdate({ airFilterStatus: opt.value })}
              className={cn(
                "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                data.airFilterStatus === opt.value
                  ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                  : opt.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              {opt.icon}
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ScanHeroCard>
  );

  const renderCondensateStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is the condensate drain clear and flowing?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ isCondensateClear: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isCondensateClear === true
              ? "border-green-500 bg-green-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <CheckCircle className={cn(
            "h-10 w-10",
            data.isCondensateClear === true ? "text-green-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Clear</span>
          <span className="text-xs text-muted-foreground">Flowing properly</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ isCondensateClear: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isCondensateClear === false
              ? "border-red-500 bg-red-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <AlertTriangle className={cn(
            "h-10 w-10",
            data.isCondensateClear === false ? "text-red-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Blocked</span>
          <span className="text-xs text-muted-foreground">Needs attention</span>
        </button>
      </div>
      
      {data.isCondensateClear === false && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Blocked drain can cause water damage</p>
        </div>
      )}
    </StepCard>
  );

  const renderConfinedSpaceStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is the unit in a confined space (sealed closet)?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleConfinedSpaceToggle(false)}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            !isConfinedSpace && data.roomVolumeType !== undefined
              ? "border-green-500 bg-green-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <Home className={cn(
            "h-10 w-10",
            !isConfinedSpace && data.roomVolumeType !== undefined ? "text-green-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Open Space</span>
          <span className="text-xs text-muted-foreground">Good airflow</span>
        </button>
        
        <button
          type="button"
          onClick={() => handleConfinedSpaceToggle(true)}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            isConfinedSpace
              ? "border-red-500 bg-red-50"
              : "border-muted hover:border-primary/50"
          )}
        >
          <Home className={cn(
            "h-10 w-10",
            isConfinedSpace ? "text-red-600" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Confined</span>
          <span className="text-xs text-muted-foreground">Sealed closet</span>
        </button>
      </div>
      
      {isConfinedSpace && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Heat pump needs ~700 cu ft of air - efficiency will suffer</p>
        </div>
      )}
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'air-filter': return renderAirFilterStep();
      case 'condensate': return renderCondensateStep();
      case 'confined-space': return renderConfinedSpaceStep();
      default: return null;
    }
  };
  
  return (
    <TechnicianStepLayout
      icon={getStepIcon()}
      title={getStepTitle()}
      subtitle={`Step ${currentIndex + 1} of ${subSteps.length}`}
      onContinue={handleNext}
      continueDisabled={!canProceed()}
      continueText={currentIndex === subSteps.length - 1 ? 'Continue' : 'Next'}
    >
      {renderProgress()}
      {renderCurrentSubStep()}
    </TechnicianStepLayout>
  );
}
