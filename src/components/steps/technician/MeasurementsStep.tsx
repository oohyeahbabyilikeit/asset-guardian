import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Gauge, Droplets, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import type { WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

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
  
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  const psiStatus = getPsiStatus(data.housePsi);
  
  const effectiveHardness = data.measuredHardnessGPG ?? streetHardnessGPG;
  
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <Label>Current Flow Rate</Label>
            </div>
            <span className="text-lg font-bold">{data.flowRateGPM || 0} GPM</span>
          </div>
          
          <Slider
            value={[data.flowRateGPM || 0]}
            onValueChange={([value]) => onUpdate({ flowRateGPM: value })}
            min={0}
            max={12}
            step={0.5}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 GPM</span>
            <span>12 GPM</span>
          </div>
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
