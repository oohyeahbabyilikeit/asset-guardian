import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, Droplets, AlertTriangle, HelpCircle, PowerOff, Monitor, ChevronDown, Beaker, Camera, X, ImageIcon } from 'lucide-react';
import type { WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type FlowRateMode = 'display' | 'unknown' | 'off';

interface MeasurementsStepProps {
  data: WaterMeasurements;
  fuelType: FuelType;
  streetHardnessGPG: number;
  pressurePhotoUrl?: string;
  onUpdate: (data: Partial<WaterMeasurements>) => void;
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

export function PressureStep({ 
  data, 
  fuelType, 
  streetHardnessGPG,
  pressurePhotoUrl,
  onUpdate, 
  onPressurePhoto,
  onNext 
}: MeasurementsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const getInitialFlowMode = (): FlowRateMode => {
    if (data.flowRateUnknown) return 'unknown';
    if (data.flowRateGPM !== undefined && data.flowRateGPM > 0) return 'display';
    return 'display';
  };
  const [flowRateMode, setFlowRateMode] = useState<FlowRateMode>(getInitialFlowMode);
  const [hardnessOpen, setHardnessOpen] = useState(!!data.measuredHardnessGPG);

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

  const getHardnessVariant = (gpg: number) => {
    if (gpg <= 3) return 'success';
    if (gpg <= 7) return 'default';
    if (gpg <= 15) return 'warning';
    return 'destructive';
  };
  
  return (
    <div className="space-y-4">
      {/* Water Pressure Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className={cn(
            "px-4 py-3 flex items-center gap-3",
            psiStatus.variant === 'success' && "bg-emerald-500/10",
            psiStatus.variant === 'warning' && "bg-amber-500/10",
            psiStatus.variant === 'danger' && "bg-destructive/10"
          )}>
            <div className={cn(
              "p-2 rounded-full",
              psiStatus.variant === 'success' && "bg-emerald-500/20",
              psiStatus.variant === 'warning' && "bg-amber-500/20",
              psiStatus.variant === 'danger' && "bg-destructive/20"
            )}>
              <Gauge className={cn(
                "h-5 w-5",
                psiStatus.variant === 'success' && "text-emerald-600",
                psiStatus.variant === 'warning' && "text-amber-600",
                psiStatus.variant === 'danger' && "text-destructive"
              )} />
            </div>
            <div>
              <p className="font-semibold">Water Pressure</p>
              <p className="text-xs text-muted-foreground">Enter exact gauge reading</p>
            </div>
          </div>
          
          {/* Exact PSI Input + Photo */}
          <div className="p-4 border-t border-border/50 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block">PSI Reading</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="200"
                    value={data.housePsi || ''}
                    onChange={(e) => onUpdate({ housePsi: e.target.value ? parseInt(e.target.value) : 0 })}
                    placeholder="65"
                    className="text-2xl font-bold h-14 pr-12 text-center"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    PSI
                  </span>
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
              "flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium",
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
        </CardContent>
      </Card>
      
      {/* Flow Rate (Tankless Only) */}
      {isTankless && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Current Flow Rate</Label>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
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
                    "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                    flowRateMode === mode 
                      ? "border-primary bg-primary/5 text-primary" 
                      : "border-muted bg-muted/30 hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
            
            {flowRateMode === 'display' && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
                  className="w-20 text-center font-mono text-lg"
                />
                <div>
                  <p className="text-sm font-medium">GPM</p>
                  <p className="text-xs text-muted-foreground">From unit display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Water Hardness Card */}
      <Card>
        <CardContent className="p-0">
          {/* EPA Estimate Header */}
          <div className="px-4 py-3 flex items-center justify-between bg-sky-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-sky-500/20">
                <Droplets className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold">Water Hardness</p>
                <p className="text-xs text-muted-foreground">EPA/USGS estimate</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums">{streetHardnessGPG}</p>
              <Badge variant={getHardnessVariant(streetHardnessGPG) as any} className="text-xs">
                {getHardnessLabel(streetHardnessGPG)} GPG
              </Badge>
            </div>
          </div>
          
          {/* Override Collapsible */}
          <Collapsible open={hardnessOpen} onOpenChange={setHardnessOpen}>
            <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between border-t border-border/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm">
                <Beaker className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Override with test strip</span>
                {data.measuredHardnessGPG && (
                  <Badge variant="secondary" className="text-xs">
                    {data.measuredHardnessGPG} GPG
                  </Badge>
                )}
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                hardnessOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Input
                    type="number"
                    value={data.measuredHardnessGPG ?? ''}
                    onChange={(e) => onUpdate({ 
                      measuredHardnessGPG: e.target.value ? parseFloat(e.target.value) : undefined 
                    })}
                    placeholder={String(streetHardnessGPG)}
                    className="w-20 text-center font-mono text-lg"
                  />
                  <div>
                    <p className="text-sm font-medium">GPG measured</p>
                    <p className="text-xs text-muted-foreground">From test strip</p>
                  </div>
                  {data.measuredHardnessGPG && (
                    <Badge variant={getHardnessVariant(effectiveHardness) as any} className="ml-auto">
                      {getHardnessLabel(effectiveHardness)}
                    </Badge>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
      
      <Button onClick={onNext} className="w-full h-12 font-semibold text-base">
        Continue
      </Button>
    </div>
  );
}
