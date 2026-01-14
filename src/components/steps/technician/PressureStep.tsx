import React, { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Gauge, Droplets, AlertTriangle, HelpCircle, PowerOff, Monitor, Beaker, Camera, X, ShieldCheck } from 'lucide-react';
import type { WaterMeasurements, EquipmentChecklist } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';
import { TechnicianStepLayout, StepCard } from './TechnicianStepLayout';

type SubStep = 'pressure' | 'prv' | 'flow-rate' | 'hardness';
type FlowRateMode = 'display' | 'unknown' | 'off';

interface MeasurementsStepProps {
  data: WaterMeasurements;
  fuelType: FuelType;
  streetHardnessGPG: number;
  pressurePhotoUrl?: string;
  equipmentData: EquipmentChecklist;
  onUpdate: (data: Partial<WaterMeasurements>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onPressurePhoto: (photoUrl: string | undefined) => void;
  onNext: () => void;
}

function getPsiStatus(psi: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (psi < 40) return { label: 'Low Pressure', variant: 'warning' };
  if (psi <= 80) return { label: 'Normal', variant: 'success' };
  return { label: 'High - PRV Needed', variant: 'danger' };
}

function getHardnessLabel(gpg: number): string {
  if (gpg <= 3) return 'Soft';
  if (gpg <= 7) return 'Moderate';
  if (gpg <= 10) return 'Hard';
  if (gpg <= 15) return 'Very Hard';
  return 'Extreme';
}

function getHardnessVariant(gpg: number) {
  if (gpg <= 3) return 'success';
  if (gpg <= 7) return 'default';
  if (gpg <= 15) return 'warning';
  return 'destructive';
}

export function PressureStep({ 
  data, 
  fuelType, 
  streetHardnessGPG,
  pressurePhotoUrl,
  equipmentData,
  onUpdate, 
  onEquipmentUpdate,
  onPressurePhoto,
  onNext 
}: MeasurementsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  
  // Dynamic sub-steps based on unit type
  const getSubSteps = (): SubStep[] => {
    const steps: SubStep[] = ['pressure', 'prv'];
    if (isTankless) {
      steps.push('flow-rate');
    }
    steps.push('hardness');
    return steps;
  };
  
  const subSteps = getSubSteps();
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('pressure');
  const currentIndex = subSteps.indexOf(currentSubStep);
  
  const getInitialFlowMode = (): FlowRateMode => {
    if (data.flowRateUnknown) return 'unknown';
    if (data.flowRateGPM !== undefined && data.flowRateGPM > 0) return 'display';
    return 'display';
  };
  const [flowRateMode, setFlowRateMode] = useState<FlowRateMode>(getInitialFlowMode);
  const [showHardnessOverride, setShowHardnessOverride] = useState(!!data.measuredHardnessGPG);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onPressurePhoto(url);
    }
  };

  const removePhoto = () => {
    onPressurePhoto(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const psiStatus = getPsiStatus(data.housePsi);
  const effectiveHardness = data.measuredHardnessGPG ?? streetHardnessGPG;

  const handleFlowModeChange = (mode: FlowRateMode) => {
    setFlowRateMode(mode);
    if (mode === 'unknown') {
      onUpdate({ flowRateGPM: undefined, flowRateUnknown: true });
    } else if (mode === 'off') {
      onUpdate({ flowRateGPM: undefined, flowRateUnknown: false });
    } else {
      onUpdate({ flowRateUnknown: false });
    }
  };

  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'pressure':
        return true; // Always has default value
      case 'prv':
        return equipmentData.hasPrv !== undefined;
      case 'flow-rate':
        return flowRateMode === 'unknown' || flowRateMode === 'off' || (data.flowRateGPM !== undefined && data.flowRateGPM > 0);
      case 'hardness':
        return true; // EPA estimate always available
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
      case 'pressure': return 'Water Pressure';
      case 'prv': return 'PRV Check';
      case 'flow-rate': return 'Flow Rate';
      case 'hardness': return 'Water Hardness';
      default: return 'Pressure & Hardness';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'pressure': return <Gauge className="h-7 w-7" />;
      case 'prv': return <ShieldCheck className="h-7 w-7" />;
      case 'flow-rate': return <Monitor className="h-7 w-7" />;
      case 'hardness': return <Droplets className="h-7 w-7" />;
      default: return <Gauge className="h-7 w-7" />;
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

  const renderPressureStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Enter the pressure gauge reading
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">PSI Reading</Label>
              <span className="text-3xl font-bold tabular-nums">{data.housePsi} <span className="text-sm font-medium text-muted-foreground">PSI</span></span>
            </div>
            <Slider
              value={[data.housePsi]}
              onValueChange={([val]) => onUpdate({ housePsi: val })}
              min={20}
              max={150}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span>20</span>
              <span>40</span>
              <span className="text-emerald-600 font-medium">60-80</span>
              <span>100</span>
              <span>150</span>
            </div>
          </div>
          
          {/* Photo capture */}
          <div className="flex flex-col items-center gap-1">
            <Label className="text-xs text-muted-foreground">Photo</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
            {pressurePhotoUrl ? (
              <div className="relative">
                <img 
                  src={pressurePhotoUrl} 
                  alt="Pressure gauge" 
                  className="w-14 h-14 rounded-lg object-cover border-2 border-primary"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 flex flex-col items-center justify-center gap-0.5 transition-colors"
              >
                <Camera className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Gauge</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Status indicator */}
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-xl text-sm font-medium",
          psiStatus.variant === 'success' && "bg-emerald-500/10 text-emerald-700",
          psiStatus.variant === 'warning' && "bg-amber-500/10 text-amber-700",
          psiStatus.variant === 'danger' && "bg-destructive/10 text-destructive"
        )}>
          {psiStatus.variant === 'danger' && <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{psiStatus.label}</span>
          {psiStatus.variant === 'danger' && (
            <span className="text-xs font-normal ml-auto">PRV recommended</span>
          )}
        </div>
      </div>
    </StepCard>
  );

  const renderPrvStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is a pressure reducing valve installed on the main line?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onEquipmentUpdate({ hasPrv: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            equipmentData.hasPrv === true
              ? "border-primary bg-primary/10"
              : "border-muted hover:border-primary/50"
          )}
        >
          <ShieldCheck className={cn(
            "h-10 w-10",
            equipmentData.hasPrv === true ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="font-semibold">Yes</span>
          <span className="text-xs text-muted-foreground text-center">PRV installed</span>
        </button>
        
        <button
          type="button"
          onClick={() => onEquipmentUpdate({ hasPrv: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            equipmentData.hasPrv === false
              ? "border-destructive bg-destructive/10"
              : "border-muted hover:border-primary/50"
          )}
        >
          <ShieldCheck className={cn(
            "h-10 w-10",
            equipmentData.hasPrv === false ? "text-destructive" : "text-muted-foreground"
          )} />
          <span className="font-semibold">No</span>
          <span className="text-xs text-muted-foreground text-center">No PRV</span>
        </button>
      </div>
      
      {equipmentData.hasPrv === false && data.housePsi > 80 && (
        <div className="mt-4 p-3 bg-destructive/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">High pressure without PRV - recommend installation</p>
        </div>
      )}
    </StepCard>
  );

  const renderFlowRateStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What's the current flow rate on the display?
      </p>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { mode: 'display' as const, icon: Monitor, label: 'Reading' },
          { mode: 'unknown' as const, icon: HelpCircle, label: 'Unknown' },
          { mode: 'off' as const, icon: PowerOff, label: 'Unit Off' },
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleFlowModeChange(mode)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              flowRateMode === mode 
                ? "border-primary bg-primary/5 text-primary" 
                : "border-muted bg-muted/30 hover:border-primary/50 text-muted-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
      
      {flowRateMode === 'display' && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Flow Rate</p>
            <span className="text-2xl font-bold tabular-nums">{data.flowRateGPM?.toFixed(1) ?? '0.0'} <span className="text-xs font-medium text-muted-foreground">GPM</span></span>
          </div>
          <Slider
            value={[data.flowRateGPM ?? 0]}
            onValueChange={([val]) => onUpdate({ 
              flowRateGPM: val,
              flowRateUnknown: false
            })}
            min={0}
            max={12}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>0</span>
            <span>3</span>
            <span>6</span>
            <span>9</span>
            <span>12</span>
          </div>
        </div>
      )}
    </StepCard>
  );

  const renderHardnessStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Water hardness estimate from EPA data
      </p>
      
      {/* EPA Estimate Display */}
      <div className="flex items-center justify-between p-4 bg-sky-500/10 rounded-xl mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-sky-500/20">
            <Droplets className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold">EPA Estimate</p>
            <p className="text-xs text-muted-foreground">Based on location</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums">{streetHardnessGPG}</p>
          <Badge variant={getHardnessVariant(streetHardnessGPG) as any} className="text-xs">
            {getHardnessLabel(streetHardnessGPG)} GPG
          </Badge>
        </div>
      </div>
      
      {/* Override with test strip */}
      <button
        type="button"
        onClick={() => setShowHardnessOverride(!showHardnessOverride)}
        className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-muted hover:border-primary/50 transition-all"
      >
        <div className="flex items-center gap-2 text-sm">
          <Beaker className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Override with test strip</span>
          {data.measuredHardnessGPG && (
            <Badge variant="secondary" className="text-xs">
              {data.measuredHardnessGPG} GPG
            </Badge>
          )}
        </div>
      </button>
      
      {showHardnessOverride && (
        <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Measured Hardness</p>
            <span className="text-lg font-bold tabular-nums">
              {data.measuredHardnessGPG ?? streetHardnessGPG} <span className="text-xs font-medium text-muted-foreground">GPG</span>
            </span>
          </div>
          <Slider
            value={[data.measuredHardnessGPG ?? streetHardnessGPG]}
            onValueChange={([val]) => onUpdate({ measuredHardnessGPG: val })}
            min={0}
            max={30}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground px-1">
            <span>0 Soft</span>
            <span>7</span>
            <span>15</span>
            <span>30 Extreme</span>
          </div>
          {data.measuredHardnessGPG && (
            <Badge variant={getHardnessVariant(effectiveHardness) as any} className="mt-2">
              {getHardnessLabel(effectiveHardness)}
            </Badge>
          )}
        </div>
      )}
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'pressure': return renderPressureStep();
      case 'prv': return renderPrvStep();
      case 'flow-rate': return renderFlowRateStep();
      case 'hardness': return renderHardnessStep();
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
