import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Warehouse, 
  ArrowUp, 
  ArrowDown, 
  Mountain, 
  Trees,
  AlertTriangle,
  Droplet,
  MapPin,
  Thermometer,
  Camera,
  CheckCircle
} from 'lucide-react';
import type { LocationCondition, EquipmentChecklist } from '@/types/technicianInspection';
import type { LocationType, TempSetting } from '@/lib/opterraAlgorithm';
import { useConditionScan } from '@/hooks/useConditionScan';
import { TechnicianStepLayout, StepCard, BinaryToggle } from './TechnicianStepLayout';
import { cn } from '@/lib/utils';

type SubStep = 'location' | 'rust-check' | 'leak-check' | 'photo' | 'leak-source' | 'finished-area' | 'temp-setting';

const LOCATIONS: { value: LocationType; label: string; icon: React.ReactNode; risk?: boolean }[] = [
  { value: 'GARAGE', label: 'Garage', icon: <Warehouse className="h-5 w-5" /> },
  { value: 'BASEMENT', label: 'Basement', icon: <ArrowDown className="h-5 w-5" /> },
  { value: 'ATTIC', label: 'Attic', icon: <ArrowUp className="h-5 w-5" />, risk: true },
  { value: 'MAIN_LIVING', label: 'Utility Closet', icon: <Home className="h-5 w-5" />, risk: true },
  { value: 'CRAWLSPACE', label: 'Crawlspace', icon: <Mountain className="h-5 w-5" /> },
  { value: 'EXTERIOR', label: 'Exterior', icon: <Trees className="h-5 w-5" /> },
];

const TEMP_CHIPS: { value: TempSetting; label: string; temp: string }[] = [
  { value: 'LOW', label: 'Low', temp: '~110°F' },
  { value: 'NORMAL', label: 'Normal', temp: '~120°F' },
  { value: 'HOT', label: 'Hot', temp: '~140°F' },
];

const LEAK_SOURCE_OPTIONS = [
  { value: 'TANK_BODY' as const, label: 'Tank Body', description: 'Leak from tank itself (fatal)', color: 'red' },
  { value: 'FITTING_VALVE' as const, label: 'Fitting/Valve', description: 'Repairable connection leak', color: 'yellow' },
  { value: 'DRAIN_PAN' as const, label: 'Drain Pan', description: 'Water in pan, source unclear', color: 'orange' },
];

interface LocationStepProps {
  data: LocationCondition;
  equipmentData: EquipmentChecklist;
  onUpdate: (data: Partial<LocationCondition>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onAIDetection?: (fields: Record<string, boolean>) => void;
  onNext: () => void;
}

export function LocationStep({ data, equipmentData, onUpdate, onEquipmentUpdate, onAIDetection, onNext }: LocationStepProps) {
  const { scanCondition, isScanning, result } = useConditionScan();
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('location');
  const [conditionPhotoUrl, setConditionPhotoUrl] = useState<string | undefined>();
  
  // Dynamic sub-steps - leak-source only shown if leaking
  const getSubSteps = (): SubStep[] => {
    const steps: SubStep[] = ['location', 'rust-check', 'leak-check', 'photo'];
    if (data.isLeaking) {
      steps.push('leak-source');
    }
    steps.push('finished-area', 'temp-setting');
    return steps;
  };
  
  const subSteps = getSubSteps();
  const currentIndex = subSteps.indexOf(currentSubStep);
  
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setConditionPhotoUrl(url);
      
      // Also run AI scan on the photo
      const scanResult = await scanCondition(file);
      if (scanResult) {
        const aiFields: Record<string, boolean> = {};
        
        // Only update if AI detected something different
        if (scanResult.visualRust !== undefined) {
          aiFields.visualRust = true;
        }
        if (scanResult.isLeaking !== undefined) {
          aiFields.isLeaking = true;
        }
        
        onAIDetection?.(aiFields);
      }
    }
  };
  
  const canProceed = (): boolean => {
    switch (currentSubStep) {
      case 'location':
        return data.location !== undefined;
      case 'rust-check':
        return data.visualRust !== undefined;
      case 'leak-check':
        return data.isLeaking !== undefined;
      case 'photo':
        return conditionPhotoUrl !== undefined;
      case 'leak-source':
        return data.leakSource !== undefined;
      case 'finished-area':
        return data.isFinishedArea !== undefined;
      case 'temp-setting':
        return data.tempSetting !== undefined;
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
      case 'location': return 'Unit Location';
      case 'rust-check': return 'Rust Check';
      case 'leak-check': return 'Leak Check';
      case 'photo': return 'Condition Photo';
      case 'leak-source': return 'Leak Source';
      case 'finished-area': return 'Living Area Check';
      case 'temp-setting': return 'Temperature Setting';
      default: return 'Location & Condition';
    }
  };

  const getStepIcon = () => {
    switch (currentSubStep) {
      case 'location': return <MapPin className="h-7 w-7" />;
      case 'rust-check': return <AlertTriangle className="h-7 w-7" />;
      case 'leak-check': return <Droplet className="h-7 w-7" />;
      case 'photo': return <Camera className="h-7 w-7" />;
      case 'leak-source': return <Droplet className="h-7 w-7" />;
      case 'finished-area': return <Home className="h-7 w-7" />;
      case 'temp-setting': return <Thermometer className="h-7 w-7" />;
      default: return <MapPin className="h-7 w-7" />;
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

  const renderLocationStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Where is the water heater installed?
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.value}
            type="button"
            onClick={() => onUpdate({ location: loc.value })}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              data.location === loc.value
                ? loc.risk
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-primary bg-primary/5"
                : "border-muted hover:border-primary/50"
            )}
          >
            <span className={data.location === loc.value 
              ? loc.risk ? "text-amber-600" : "text-primary" 
              : "text-muted-foreground"
            }>
              {loc.icon}
            </span>
            <span className="text-sm font-medium">{loc.label}</span>
            {loc.risk && data.location === loc.value && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Higher Risk</Badge>
            )}
          </button>
        ))}
      </div>
    </StepCard>
  );

  const renderRustCheckStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is there visible rust or corrosion on the unit?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ visualRust: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.visualRust === false
              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <CheckCircle className={cn(
            "h-10 w-10 transition-colors",
            data.visualRust === false ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn("font-semibold text-lg", data.visualRust === false && "text-primary")}>No Rust</span>
          <span className="text-xs text-muted-foreground">Clean condition</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ visualRust: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.visualRust === true
              ? "border-destructive bg-destructive/10 shadow-md ring-2 ring-destructive/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <AlertTriangle className={cn(
            "h-10 w-10 transition-colors",
            data.visualRust === true ? "text-destructive" : "text-muted-foreground"
          )} />
          <span className={cn("font-semibold text-lg", data.visualRust === true && "text-destructive")}>Visible Rust</span>
          <span className="text-xs text-muted-foreground">Corrosion present</span>
        </button>
      </div>
      
      {data.visualRust === true && (
        <div className="mt-4 p-3 bg-orange-500/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700">Rust indicates age/wear - note severity in photo</p>
        </div>
      )}
    </StepCard>
  );

  const renderLeakCheckStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is there an active leak or water around the unit?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ isLeaking: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isLeaking === false
              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <CheckCircle className={cn(
            "h-10 w-10 transition-colors",
            data.isLeaking === false ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn("font-semibold text-lg", data.isLeaking === false && "text-primary")}>Dry</span>
          <span className="text-xs text-muted-foreground">No water present</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ isLeaking: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isLeaking === true
              ? "border-destructive bg-destructive/10 shadow-md ring-2 ring-destructive/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Droplet className={cn(
            "h-10 w-10 transition-colors",
            data.isLeaking === true ? "text-destructive" : "text-muted-foreground"
          )} />
          <span className="font-semibold text-lg">Leaking</span>
          <span className="text-xs text-muted-foreground">Water detected</span>
        </button>
      </div>
      
      {data.isLeaking === true && (
        <div className="mt-4 p-3 bg-red-500/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">Critical issue - you'll identify the source next</p>
        </div>
      )}
    </StepCard>
  );

  const renderPhotoStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Take a photo of the water heater
      </p>
      
      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
          disabled={isScanning}
        />
        <div className={cn(
          "w-full p-8 rounded-xl border-2 border-dashed transition-all text-center",
          isScanning 
            ? "border-primary bg-primary/5 animate-pulse"
            : conditionPhotoUrl
            ? "border-green-500 bg-green-50"
            : "border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10"
        )}>
          {conditionPhotoUrl ? (
            <div className="space-y-4">
              <img 
                src={conditionPhotoUrl} 
                alt="Unit condition" 
                className="w-full max-w-xs mx-auto rounded-lg object-cover aspect-video"
              />
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Photo captured</span>
              </div>
              <p className="text-xs text-muted-foreground">Tap to retake</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center",
                isScanning ? "bg-primary/20" : "bg-primary/20"
              )}>
                {isScanning ? (
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="h-10 w-10 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {isScanning ? 'Processing...' : 'Take Photo'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Capture the unit's current condition
                </p>
              </div>
            </div>
          )}
        </div>
      </label>
      
      {/* Show summary of what we've noted */}
      <div className="mt-4 p-3 bg-muted/50 rounded-xl space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Condition summary:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant={data.visualRust ? "destructive" : "secondary"}>
            {data.visualRust ? "Rust detected" : "No rust"}
          </Badge>
          <Badge variant={data.isLeaking ? "destructive" : "secondary"}>
            {data.isLeaking ? "Leak detected" : "No leak"}
          </Badge>
        </div>
      </div>
    </StepCard>
  );

  const renderLeakSourceStep = () => (
    <StepCard className="border-destructive/30 bg-destructive/5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <div>
          <p className="font-medium text-destructive text-sm">Active Leak Detected</p>
          <p className="text-xs text-muted-foreground">Identify the leak source</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {LEAK_SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onUpdate({ leakSource: opt.value })}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
              data.leakSource === opt.value
                ? opt.color === 'red' ? 'border-red-500 bg-red-50 dark:bg-red-500/20'
                : opt.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/20'
                : 'border-orange-500 bg-orange-50 dark:bg-orange-500/20'
                : 'border-muted hover:border-primary/50'
            )}
          >
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
            {data.leakSource === opt.value && (
              <Badge variant={opt.color === 'red' ? 'destructive' : 'secondary'} className="shrink-0">
                Selected
              </Badge>
            )}
          </button>
        ))}
      </div>
    </StepCard>
  );

  const renderFinishedAreaStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        Is the unit in a finished living area?
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onUpdate({ isFinishedArea: false })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isFinishedArea === false
              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <CheckCircle className={cn(
            "h-10 w-10 transition-colors",
            data.isFinishedArea === false ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn("font-semibold text-lg", data.isFinishedArea === false && "text-primary")}>No</span>
          <span className="text-xs text-muted-foreground text-center">Garage, basement, etc.</span>
        </button>
        
        <button
          type="button"
          onClick={() => onUpdate({ isFinishedArea: true })}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            data.isFinishedArea === true
              ? "border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20"
              : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <Home className={cn(
            "h-10 w-10 transition-colors",
            data.isFinishedArea === true ? "text-amber-500" : "text-muted-foreground"
          )} />
          <span className={cn("font-semibold text-lg", data.isFinishedArea === true && "text-amber-600")}>Yes</span>
          <span className="text-xs text-muted-foreground text-center">Living space</span>
        </button>
      </div>
      
      {data.isFinishedArea === true && (
        <div className="mt-4 p-3 bg-amber-500/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Higher damage risk if leak occurs</p>
        </div>
      )}
    </StepCard>
  );

  const renderTempSettingStep = () => (
    <StepCard className="border-0 bg-transparent shadow-none">
      <p className="text-sm text-muted-foreground text-center mb-6">
        What's the thermostat dial setting?
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {TEMP_CHIPS.map((t) => {
          const isSelected = data.tempSetting === t.value;
          const getSelectedStyles = () => {
            if (t.value === 'HOT') return "border-destructive bg-destructive/10 shadow-md ring-2 ring-destructive/20";
            if (t.value === 'LOW') return "border-blue-500 bg-blue-500/10 shadow-md ring-2 ring-blue-500/20";
            return "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20";
          };
          const getIconColor = () => {
            if (t.value === 'HOT') return "text-destructive";
            if (t.value === 'LOW') return "text-blue-500";
            return "text-primary";
          };
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => onUpdate({ tempSetting: t.value })}
              className={cn(
                "flex flex-col items-center gap-2 p-5 rounded-xl border-2 transition-all",
                isSelected
                  ? getSelectedStyles()
                  : "border-muted bg-card hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <Thermometer className={cn(
                "h-8 w-8 transition-colors",
                isSelected ? getIconColor() : "text-muted-foreground"
              )} />
              <span className={cn("font-semibold", isSelected && getIconColor())}>{t.label}</span>
              <span className="text-xs text-muted-foreground">{t.temp}</span>
            </button>
          );
        })}
      </div>
      
      {data.tempSetting === 'HOT' && (
        <div className="mt-4 p-3 bg-orange-500/10 rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-sm text-orange-700">High temp accelerates wear and scale buildup</p>
        </div>
      )}
    </StepCard>
  );

  const renderCurrentSubStep = () => {
    switch (currentSubStep) {
      case 'location': return renderLocationStep();
      case 'rust-check': return renderRustCheckStep();
      case 'leak-check': return renderLeakCheckStep();
      case 'photo': return renderPhotoStep();
      case 'leak-source': return renderLeakSourceStep();
      case 'finished-area': return renderFinishedAreaStep();
      case 'temp-setting': return renderTempSettingStep();
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
