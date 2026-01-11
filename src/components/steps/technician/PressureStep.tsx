import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gauge, Droplets, AlertTriangle, CheckCircle, HelpCircle, PowerOff, Monitor } from 'lucide-react';
import type { WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { QuickSelectChips } from '@/components/ui/QuickSelectChips';
import { ScanHeroSection } from '@/components/ui/ScanHeroCard';

type FlowRateMode = 'display' | 'unknown' | 'off';

interface MeasurementsStepProps {
  data: WaterMeasurements;
  fuelType: FuelType;
  streetHardnessGPG: number;
  onUpdate: (data: Partial<WaterMeasurements>) => void;
  onNext: () => void;
}

const PSI_CHIPS = [
  { value: 45, label: 'Low', sublabel: '<45', variant: 'warning' as const },
  { value: 60, label: 'Normal', sublabel: '45-80', variant: 'success' as const },
  { value: 90, label: 'High', sublabel: '80+', variant: 'danger' as const },
];

function getPsiStatus(psi: number): { label: string; variant: 'success' | 'warning' | 'danger' } {
  if (psi < 40) return { label: 'Low', variant: 'warning' };
  if (psi <= 80) return { label: 'Normal', variant: 'success' };
  return { label: 'High - PRV needed', variant: 'danger' };
}

function getHardnessLabel(gpg: number): string {
  if (gpg <= 3) return 'Soft';
  if (gpg <= 7) return 'Moderate';
  if (gpg <= 10) return 'Hard';
  if (gpg <= 15) return 'Very Hard';
  return 'Extreme';
}

function getHardnessColor(gpg: number): string {
  if (gpg <= 3) return 'text-green-600 bg-green-100';
  if (gpg <= 7) return 'text-blue-600 bg-blue-100';
  if (gpg <= 10) return 'text-yellow-600 bg-yellow-100';
  if (gpg <= 15) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function PressureStep({ 
  data, 
  fuelType, 
  streetHardnessGPG,
  onUpdate, 
  onNext 
}: MeasurementsStepProps) {
  const getInitialFlowMode = (): FlowRateMode => {
    if (data.flowRateUnknown) return 'unknown';
    if (data.flowRateGPM !== undefined && data.flowRateGPM > 0) return 'display';
    return 'display';
  };
  const [flowRateMode, setFlowRateMode] = useState<FlowRateMode>(getInitialFlowMode);
  
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
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

  // Find closest PSI chip value
  const getClosestPsiChip = (psi: number): number => {
    if (psi < 45) return 45;
    if (psi <= 80) return 60;
    return 90;
  };
  
  return (
    <div className="space-y-5">
      {/* House PSI - Primary with Quick Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            Water Pressure
          </Label>
          <Badge className={
            psiStatus.variant === 'success' ? 'bg-green-100 text-green-700' :
            psiStatus.variant === 'warning' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }>
            {data.housePsi} PSI • {psiStatus.label}
          </Badge>
        </div>
        
        <QuickSelectChips
          value={getClosestPsiChip(data.housePsi)}
          onChange={(v) => onUpdate({ housePsi: v })}
          options={PSI_CHIPS}
          allowCustom
          customLabel="Exact"
          customPlaceholder="PSI"
        />
        
        {data.housePsi > 80 && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">PRV recommended</span>
          </div>
        )}
      </div>
      
      {/* Flow Rate (Tankless Only) */}
      {isTankless && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            Current Flow Rate
          </Label>
          
          <div className="flex gap-2">
            {[
              { mode: 'display' as const, icon: <Monitor className="h-4 w-4" />, label: 'Reading' },
              { mode: 'unknown' as const, icon: <HelpCircle className="h-4 w-4" />, label: 'Unknown' },
              { mode: 'off' as const, icon: <PowerOff className="h-4 w-4" />, label: 'Unit Off' },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleFlowModeChange(mode)}
                className={`flex-1 flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-sm
                  ${flowRateMode === mode 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-muted hover:border-primary/50'
                  }`}
              >
                {icon}
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          
          {flowRateMode === 'display' && (
            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={data.flowRateGPM ?? ''}
                onChange={(e) => onUpdate({ 
                  flowRateGPM: e.target.value ? parseFloat(e.target.value) : undefined,
                  flowRateUnknown: false
                })}
                placeholder="0.0"
                className="w-20 text-center font-mono"
              />
              <span className="text-sm font-medium">GPM</span>
              <span className="text-xs text-muted-foreground ml-auto">From display</span>
            </div>
          )}
        </div>
      )}
      
      {/* Street Hardness - Read Only Display */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Water Hardness</p>
              <p className="text-xs text-muted-foreground">EPA/USGS estimate</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{streetHardnessGPG}</p>
            <Badge className={getHardnessColor(streetHardnessGPG)}>
              {getHardnessLabel(streetHardnessGPG)} GPG
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Hardness Override - Collapsed */}
      <ScanHeroSection 
        title="Override with test strip?" 
        defaultOpen={!!data.measuredHardnessGPG}
      >
        <div className="flex items-center gap-3">
          <Input
            type="number"
            value={data.measuredHardnessGPG ?? ''}
            onChange={(e) => onUpdate({ 
              measuredHardnessGPG: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            placeholder={String(streetHardnessGPG)}
            className="w-24 font-mono"
          />
          <span className="text-sm text-muted-foreground">GPG measured</span>
          {data.measuredHardnessGPG && (
            <Badge className={getHardnessColor(effectiveHardness)}>
              {getHardnessLabel(effectiveHardness)}
            </Badge>
          )}
        </div>
      </ScanHeroSection>
      
      <Button onClick={onNext} className="w-full h-12 font-semibold">
        Continue
      </Button>
    </div>
  );
}
