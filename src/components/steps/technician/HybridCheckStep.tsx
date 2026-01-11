import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Wind, 
  Droplets, 
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { HybridInspection } from '@/types/technicianInspection';
import type { AirFilterStatus } from '@/lib/opterraAlgorithm';

const AIR_FILTER_OPTIONS: { value: AirFilterStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'CLEAN', label: 'Clean', color: 'border-green-500 bg-green-50 text-green-700', icon: <CheckCircle className="h-5 w-5" /> },
  { value: 'DIRTY', label: 'Dirty', color: 'border-yellow-500 bg-yellow-50 text-yellow-700', icon: <AlertTriangle className="h-5 w-5" /> },
  { value: 'CLOGGED', label: 'Clogged', color: 'border-red-500 bg-red-50 text-red-700', icon: <AlertTriangle className="h-5 w-5" /> },
];

interface HybridCheckStepProps {
  data: HybridInspection;
  onUpdate: (data: Partial<HybridInspection>) => void;
  onNext: () => void;
}

export function HybridCheckStep({ data, onUpdate, onNext }: HybridCheckStepProps) {
  const hasIssues = data.airFilterStatus === 'CLOGGED' || !data.isCondensateClear;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          <Wind className="h-4 w-4" />
          <span className="text-sm font-medium">Hybrid / Heat Pump</span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Hybrid Unit Inspection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Check heat pump-specific components
        </p>
      </div>
      
      {/* Air Filter Status */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Wind className="h-4 w-4" />
          Air Filter Status
        </Label>
        <RadioGroup
          value={data.airFilterStatus}
          onValueChange={(value) => onUpdate({ airFilterStatus: value as AirFilterStatus })}
          className="grid grid-cols-3 gap-2"
        >
          {AIR_FILTER_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`filter-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`filter-${option.value}`}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        {data.airFilterStatus === 'CLOGGED' && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Clogged filter reduces efficiency by up to 15%
            </p>
          </div>
        )}
      </div>
      
      {/* Condensate Drain */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Droplets className="h-4 w-4" />
          Condensate Drain
        </Label>
        
        <div className="p-4 rounded-lg border-2 border-muted">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="font-medium">Drain is clear?</span>
              <p className="text-xs text-muted-foreground">
                Check for blockages or standing water
              </p>
            </div>
            <Switch
              checked={data.isCondensateClear}
              onCheckedChange={(checked) => onUpdate({ isCondensateClear: checked })}
            />
          </div>
          
          <div className="mt-3">
            <Badge variant={data.isCondensateClear ? 'default' : 'destructive'}>
              {data.isCondensateClear ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Clear
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Blocked
                </span>
              )}
            </Badge>
          </div>
        </div>
        
        {!data.isCondensateClear && (
          <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Blocked drain can cause water damage and mold
            </p>
          </div>
        )}
      </div>
      
      {/* Compressor Health (Optional Advanced) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Compressor Health (Optional)
          </Label>
          <Badge variant="outline" className="text-xs">Advanced</Badge>
        </div>
        
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-muted-foreground">Estimated health</span>
            <span className="text-sm font-medium">
              {data.compressorHealth ?? 100}%
            </span>
          </div>
          
          <Slider
            value={[data.compressorHealth ?? 100]}
            onValueChange={([value]) => onUpdate({ compressorHealth: value })}
            min={0}
            max={100}
            step={5}
          />
          
          <p className="text-xs text-muted-foreground mt-2">
            Based on sound, vibration, and performance observation
          </p>
        </div>
      </div>
      
      {/* Summary */}
      {hasIssues && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Issues Found</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            {data.airFilterStatus === 'CLOGGED' && (
              <li>• Air filter needs replacement</li>
            )}
            {!data.isCondensateClear && (
              <li>• Condensate drain needs clearing</li>
            )}
          </ul>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full">
        Continue to Handoff
      </Button>
    </div>
  );
}
