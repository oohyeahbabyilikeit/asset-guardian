import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Filter, 
  Wind, 
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import type { TanklessInspection } from '@/types/technicianInspection';
import type { FuelType, FlameRodStatus, InletFilterStatus, VentStatus } from '@/lib/opterraAlgorithm';

const FLAME_ROD_OPTIONS: { value: FlameRodStatus; label: string; color: string }[] = [
  { value: 'GOOD', label: 'Good', color: 'border-green-500 bg-green-50' },
  { value: 'WORN', label: 'Worn', color: 'border-yellow-500 bg-yellow-50' },
  { value: 'FAILING', label: 'Failing', color: 'border-red-500 bg-red-50' },
];

const FILTER_OPTIONS: { value: InletFilterStatus; label: string; color: string }[] = [
  { value: 'CLEAN', label: 'Clean', color: 'border-green-500 bg-green-50' },
  { value: 'DIRTY', label: 'Dirty', color: 'border-yellow-500 bg-yellow-50' },
  { value: 'CLOGGED', label: 'Clogged', color: 'border-red-500 bg-red-50' },
];

const VENT_OPTIONS: { value: VentStatus; label: string; color: string }[] = [
  { value: 'CLEAR', label: 'Clear', color: 'border-green-500 bg-green-50' },
  { value: 'RESTRICTED', label: 'Restricted', color: 'border-yellow-500 bg-yellow-50' },
  { value: 'BLOCKED', label: 'Blocked', color: 'border-red-500 bg-red-50' },
];

const ERROR_COUNT_OPTIONS = [
  { value: 0, label: 'None', color: 'border-green-500 bg-green-50' },
  { value: 1, label: '1-2', color: 'border-yellow-500 bg-yellow-50' },
  { value: 3, label: '3+', color: 'border-red-500 bg-red-50' },
];

interface TanklessCheckStepProps {
  data: TanklessInspection;
  fuelType: FuelType;
  onUpdate: (data: Partial<TanklessInspection>) => void;
  onNext: () => void;
}

export function TanklessCheckStep({ data, fuelType, onUpdate, onNext }: TanklessCheckStepProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  
  const hasIssues = 
    data.flameRodStatus === 'FAILING' ||
    data.inletFilterStatus === 'CLOGGED' ||
    data.tanklessVentStatus === 'BLOCKED' ||
    data.errorCodeCount >= 3;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-3">
          {isGas ? <Flame className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          <span className="text-sm font-medium">
            Tankless {isGas ? 'Gas' : 'Electric'}
          </span>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Tankless Unit Inspection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Check tankless-specific components
        </p>
      </div>
      
      {/* Flame Rod Status (Gas Only) */}
      {isGas && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Flame Rod Status
          </Label>
          <RadioGroup
            value={data.flameRodStatus}
            onValueChange={(value) => onUpdate({ flameRodStatus: value as FlameRodStatus })}
            className="grid grid-cols-3 gap-2"
          >
            {FLAME_ROD_OPTIONS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`flame-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`flame-${option.value}`}
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {/* Inlet Filter Status */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Inlet Filter Status
        </Label>
        <RadioGroup
          value={data.inletFilterStatus}
          onValueChange={(value) => onUpdate({ inletFilterStatus: value as InletFilterStatus })}
          className="grid grid-cols-3 gap-2"
        >
          {FILTER_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={option.value}
                id={`filter-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`filter-${option.value}`}
                className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Vent Status (Gas Only) */}
      {isGas && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            Vent Status
          </Label>
          <RadioGroup
            value={data.tanklessVentStatus}
            onValueChange={(value) => onUpdate({ tanklessVentStatus: value as VentStatus })}
            className="grid grid-cols-3 gap-2"
          >
            {VENT_OPTIONS.map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`vent-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`vent-${option.value}`}
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      {/* Error Code Count */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Error Codes in History
        </Label>
        <RadioGroup
          value={String(data.errorCodeCount)}
          onValueChange={(value) => onUpdate({ errorCodeCount: parseInt(value) })}
          className="grid grid-cols-3 gap-2"
        >
          {ERROR_COUNT_OPTIONS.map((option) => (
            <div key={option.value}>
              <RadioGroupItem
                value={String(option.value)}
                id={`errors-${option.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`errors-${option.value}`}
                className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent peer-data-[state=checked]:${option.color}`}
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Scale Buildup Estimate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Scale Buildup Estimate</Label>
          <Badge variant="outline">
            {data.scaleBuildup ?? 0}%
          </Badge>
        </div>
        
        <Slider
          value={[data.scaleBuildup ?? 0]}
          onValueChange={([value]) => onUpdate({ scaleBuildup: value })}
          min={0}
          max={100}
          step={10}
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>None</span>
          <span>Moderate</span>
          <span>Severe</span>
        </div>
      </div>
      
      {/* Element/Igniter Health (Unit Type Specific) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{isGas ? 'Igniter Health' : 'Element Health'}</Label>
          <Badge variant="outline">
            {isGas ? (data.igniterHealth ?? 100) : (data.elementHealth ?? 100)}%
          </Badge>
        </div>
        
        <Slider
          value={[isGas ? (data.igniterHealth ?? 100) : (data.elementHealth ?? 100)]}
          onValueChange={([value]) => onUpdate(isGas ? { igniterHealth: value } : { elementHealth: value })}
          min={0}
          max={100}
          step={5}
        />
      </div>
      
      {/* Summary */}
      {hasIssues && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Issues Found</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            {data.flameRodStatus === 'FAILING' && (
              <li>• Flame rod needs replacement</li>
            )}
            {data.inletFilterStatus === 'CLOGGED' && (
              <li>• Inlet filter needs cleaning</li>
            )}
            {data.tanklessVentStatus === 'BLOCKED' && (
              <li>• Vent obstruction detected</li>
            )}
            {data.errorCodeCount >= 3 && (
              <li>• Multiple error codes in history</li>
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
