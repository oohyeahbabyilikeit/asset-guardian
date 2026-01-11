import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Gauge, Droplets, Monitor, HelpCircle, PowerOff, AlertTriangle, CheckCircle } from 'lucide-react';
import type { WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

type FlowRateMode = 'display' | 'unknown' | 'off';
interface MeasurementsStepProps {
  data: WaterMeasurements;
  fuelType: FuelType;
  streetHardnessGPG: number;
  onUpdate: (data: Partial<WaterMeasurements>) => void;
  onNext: () => void;
}

function getPsiStatus(psi: number): { label: string; color: string; icon: React.ReactNode } {
  if (psi < 40) {
    return { label: 'Low Pressure', color: 'text-yellow-600 bg-yellow-100', icon: <AlertTriangle className="h-4 w-4" /> };
  } else if (psi <= 80) {
    return { label: 'Normal Range', color: 'text-green-600 bg-green-100', icon: <CheckCircle className="h-4 w-4" /> };
  } else {
    return { label: 'High Pressure', color: 'text-red-600 bg-red-100', icon: <AlertTriangle className="h-4 w-4" /> };
  }
}

function getHardnessLabel(gpg: number): string {
  if (gpg <= 3) return 'Soft';
  if (gpg <= 7) return 'Moderate';
  if (gpg <= 10) return 'Hard';
  if (gpg <= 15) return 'Very Hard';
  return 'Extremely Hard';
}

function getHardnessColor(gpg: number): string {
  if (gpg <= 3) return 'text-green-600 bg-green-100';
  if (gpg <= 7) return 'text-blue-600 bg-blue-100';
  if (gpg <= 10) return 'text-yellow-600 bg-yellow-100';
  if (gpg <= 15) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function MeasurementsStep({ 
  data, 
  fuelType, 
  streetHardnessGPG,
  onUpdate, 
  onNext 
}: MeasurementsStepProps) {
  const [showHardnessOverride, setShowHardnessOverride] = useState(false);
  
  // Determine initial flow rate mode based on existing data
  const getInitialFlowMode = (): FlowRateMode => {
    if (data.flowRateUnknown) return 'unknown';
    if (data.flowRateGPM !== undefined && data.flowRateGPM > 0) return 'display';
    return 'display'; // default
  };
  const [flowRateMode, setFlowRateMode] = useState<FlowRateMode>(getInitialFlowMode);
  
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  const psiStatus = getPsiStatus(data.housePsi);
  
  const effectiveHardness = data.measuredHardnessGPG ?? streetHardnessGPG;

  const handleFlowModeChange = (mode: FlowRateMode) => {
    if (!mode) return;
    setFlowRateMode(mode);
    
    if (mode === 'unknown') {
      onUpdate({ flowRateGPM: undefined, flowRateUnknown: true });
    } else if (mode === 'off') {
      onUpdate({ flowRateGPM: undefined, flowRateUnknown: false });
    } else {
      onUpdate({ flowRateUnknown: false });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Pressure & Water</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Measure water pressure at nearest hose bib
        </p>
      </div>
      
      {/* House PSI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <Label>Static Water Pressure</Label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{data.housePsi} PSI</span>
            <Badge className={psiStatus.color}>
              {psiStatus.icon}
              <span className="ml-1">{psiStatus.label}</span>
            </Badge>
          </div>
        </div>
        
        <Slider
          value={[data.housePsi]}
          onValueChange={([value]) => onUpdate({ housePsi: value })}
          min={30}
          max={120}
          step={5}
          className="py-4"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>30 PSI</span>
          <span className="text-green-600">40-80 PSI (Ideal)</span>
          <span>120 PSI</span>
        </div>
        
        {data.housePsi > 80 && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              PRV recommended for pressures above 80 PSI
            </p>
          </div>
        )}
      </div>
      
      {/* Flow Rate (Tankless Only) */}
      {isTankless && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <Label>Current Flow Rate</Label>
          </div>
          
          <ToggleGroup 
            type="single" 
            value={flowRateMode} 
            onValueChange={(val) => handleFlowModeChange(val as FlowRateMode)}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem 
              value="display" 
              className="flex flex-col items-center gap-1 py-3 px-2 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Monitor className="h-4 w-4" />
              <span className="text-xs font-medium">Read from Unit</span>
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="unknown" 
              className="flex flex-col items-center gap-1 py-3 px-2 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs font-medium">I Don't Know</span>
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="off" 
              className="flex flex-col items-center gap-1 py-3 px-2 h-auto data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <PowerOff className="h-4 w-4" />
              <span className="text-xs font-medium">Unit Off</span>
            </ToggleGroupItem>
          </ToggleGroup>
          
          {flowRateMode === 'display' && (
            <div className="p-4 bg-accent/50 rounded-lg border space-y-3">
              <div className="flex items-center justify-between">
                <Label>GPM from display</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={data.flowRateGPM ?? ''}
                    onChange={(e) => onUpdate({ 
                      flowRateGPM: e.target.value ? parseFloat(e.target.value) : undefined,
                      flowRateUnknown: false
                    })}
                    placeholder="0.0"
                    className="w-20 text-right font-mono"
                    step="0.1"
                    min="0"
                    max="12"
                  />
                  <span className="text-sm font-medium text-muted-foreground">GPM</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Check the unit's digital display panel while hot water is running
              </p>
              <div className="text-xs text-muted-foreground">
                Typical range: 1.5 – 8 GPM
              </div>
            </div>
          )}
          
          {flowRateMode === 'unknown' && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                No problem — the algorithm will use estimated values based on unit specs.
              </p>
            </div>
          )}
          
          {flowRateMode === 'off' && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground">
                Unit wasn't running during inspection. Flow rate not applicable.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Street Hardness (Auto-fetched) */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-blue-500" />
            <Label>Area Water Hardness</Label>
          </div>
          <Badge className={getHardnessColor(streetHardnessGPG)}>
            {getHardnessLabel(streetHardnessGPG)}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{streetHardnessGPG} GPG</span>
          <Badge variant="outline" className="text-xs">
            Source: EPA/USGS
          </Badge>
        </div>
      </div>
      
      {/* Optional Hardness Override */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Override with test strip?</Label>
          <Switch
            checked={showHardnessOverride}
            onCheckedChange={setShowHardnessOverride}
          />
        </div>
        
        {showHardnessOverride && (
          <div className="space-y-2 p-4 bg-accent/50 rounded-lg">
            <Label>Measured Hardness (GPG)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={data.measuredHardnessGPG ?? ''}
                onChange={(e) => onUpdate({ 
                  measuredHardnessGPG: e.target.value ? parseFloat(e.target.value) : undefined 
                })}
                placeholder={String(streetHardnessGPG)}
                className="font-mono"
              />
              <Badge className={getHardnessColor(effectiveHardness)}>
                {getHardnessLabel(effectiveHardness)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This will override the area estimate for physics calculations
            </p>
          </div>
        )}
      </div>
      
      <Button onClick={onNext} className="w-full">
        Continue to Location
      </Button>
    </div>
  );
}
