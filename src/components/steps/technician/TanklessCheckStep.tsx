import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  Gauge,
  AlertTriangle,
  Wind,
  Filter,
  Waves,
  Monitor
} from 'lucide-react';
import type { TanklessInspection, WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { useErrorCodeScan } from '@/hooks/useErrorCodeScan';
import { useFilterScan } from '@/hooks/useFilterScan';
import { ScanHeroCard } from '@/components/ui/ScanHeroCard';
import { TechnicianStepLayout, StepCard } from './TechnicianStepLayout';
import { cn } from '@/lib/utils';

type SubStep = 'error-codes' | 'gas-line' | 'inlet-filter';

const GAS_LINE_CHIPS = [
  { value: '1/2', label: '½"', sublabel: '⚠️ Undersized', variant: 'danger' as const },
  { value: '3/4', label: '¾"', sublabel: 'Standard' },
  { value: '1', label: '1"', sublabel: 'Optimal', variant: 'success' as const },
];

interface TanklessCheckStepProps {
  data: TanklessInspection;
  measurements: WaterMeasurements;
  fuelType: FuelType;
  onUpdate: (data: Partial<TanklessInspection>) => void;
  onUpdateMeasurements: (data: Partial<WaterMeasurements>) => void;
  onAIDetection?: (fields: Record<string, boolean>) => void;
  onNext: () => void;
}

export function TanklessCheckStep({ 
  data, 
  measurements, 
  fuelType, 
  onUpdate, 
  onUpdateMeasurements, 
  onAIDetection, 
  onNext 
}: TanklessCheckStepProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  
  // Dynamic sub-steps based on fuel type (v8.0: removed scale slider - algorithm calculates)
  const getSubSteps = (): SubStep[] => {
    const steps: SubStep[] = ['error-codes'];
    if (isGas) {
      steps.push('gas-line');
    }
    steps.push('inlet-filter');
    return steps;
  };
  
  const subSteps = getSubSteps();
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('error-codes');
  const currentIndex = subSteps.indexOf(currentSubStep);
  
  const { scanErrorCodes, isScanning: isScanningErrors, result: errorResult } = useErrorCodeScan();
  const { scanFilter, isScanning: isScanningFilter, result: filterResult } = useFilterScan();
  
  const handleErrorCodeScan = async (file: File) => {
    const result = await scanErrorCodes(file);
    if (result) {
      const aiFields: Record<string, boolean> = { errorCodeCount: true };
      
      onUpdate({ errorCodeCount: Math.min(result.errorCount, 3) });
      
      if (result.hasIsolationValves !== undefined) {
        aiFields.hasIsolationValves = true;
      }
      if (result.scaleDepositsVisible) {
        aiFields.scaleDepositsVisible = true;
      }
      
      onAIDetection?.(aiFields);
    }
  };
  
  const handleFilterScan = async (file: File) => {
    const result = await scanFilter(file, 'inlet');
    if (result) {
      onUpdate({ inletFilterStatus: result.status });
      onAIDetection?.({ inletFilterStatus: true });
    }
  };

  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'error-codes':
        return data.errorCodeCount !== undefined;
      case 'gas-line':
        return data.gasLineSize !== undefined;
      case 'inlet-filter':
        return data.inletFilterStatus !== undefined;
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
      case 'error-codes': return 'Error Codes';
      case 'gas-line': return 'Gas Line Size';
      case 'inlet-filter': return 'Inlet Filter';
      default: return 'Tankless Check';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'error-codes': return <Monitor className="h-7 w-7" />;
      case 'gas-line': return <Gauge className="h-7 w-7" />;
      case 'inlet-filter': return <Filter className="h-7 w-7" />;
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

  const errorScanSummary = errorResult && (
    <div className="space-y-1 text-sm">
      <p className={errorResult.errorCount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
        {errorResult.errorCount} error code{errorResult.errorCount !== 1 ? 's' : ''} detected
      </p>
    </div>
  );

  const renderErrorCodesStep = () => (
    <ScanHeroCard
      title="Display Panel"
      subtitle="Photo the front display for error codes"
      isScanning={isScanningErrors}
      hasScanned={!!errorResult}
      scanSummary={errorScanSummary}
      onScanImage={handleErrorCodeScan}
      scanLabel="📷 Scan Display"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Or select error code count manually
        </p>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onUpdate({ errorCodeCount: count })}
              className={cn(
                "flex-1 py-4 rounded-xl border-2 font-bold text-xl transition-all",
                data.errorCodeCount === count
                  ? count === 0 ? 'border-green-500 bg-green-50 text-green-700'
                  : count >= 3 ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              {count === 3 ? '3+' : count}
            </button>
          ))}
        </div>
        {data.errorCodeCount !== undefined && data.errorCodeCount >= 3 && (
          <div className="p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">Multiple errors indicate component failure</p>
          </div>
        )}
      </div>
    </ScanHeroCard>
  );

  const renderGasLineStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What size is the gas supply line?
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {GAS_LINE_CHIPS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onUpdate({ gasLineSize: opt.value as '1/2' | '3/4' | '1' })}
            className={cn(
              "flex flex-col items-center gap-1 py-5 rounded-xl border-2 transition-all",
              data.gasLineSize === opt.value
                ? opt.variant === 'danger' ? 'border-red-500 bg-red-50 text-red-700'
                : opt.variant === 'success' ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-primary bg-primary/10 text-foreground'
                : 'border-muted hover:border-primary/50'
            )}
          >
            <div className="font-bold text-2xl">{opt.label}</div>
            <div className="text-xs opacity-70">{opt.sublabel}</div>
          </button>
        ))}
      </div>
      
      {data.gasLineSize === '1/2' && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">½" gas line is undersized - may cause intermittent failures</p>
        </div>
      )}
    </StepCard>
  );

  const renderInletFilterStep = () => (
    <ScanHeroCard
      title="Inlet Filter"
      subtitle="Photo the filter screen"
      isScanning={isScanningFilter}
      hasScanned={!!filterResult}
      scanSummary={filterResult && (
        <p className={
          filterResult.status === 'CLOGGED' ? 'text-red-600 font-medium' :
          filterResult.status === 'DIRTY' ? 'text-yellow-600' : 'text-green-600'
        }>
          Filter: {filterResult.status}
        </p>
      )}
      onScanImage={handleFilterScan}
      scanLabel="📷 Scan Filter"
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Or select filter condition manually
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(['CLEAN', 'DIRTY', 'CLOGGED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onUpdate({ inletFilterStatus: status })}
              className={cn(
                "py-4 rounded-xl border-2 text-sm font-semibold transition-all",
                data.inletFilterStatus === status
                  ? status === 'CLEAN' ? 'border-green-500 bg-green-50 text-green-700'
                  : status === 'DIRTY' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-muted hover:border-primary/50'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </ScanHeroCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'error-codes': return renderErrorCodesStep();
      case 'gas-line': return renderGasLineStep();
      case 'inlet-filter': return renderInletFilterStep();
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
