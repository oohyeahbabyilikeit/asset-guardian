import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Pencil,
  X,
  ChevronRight,
  Gauge,
  Droplets,
  MapPin,
  Thermometer,
  Shield,
  Clock,
  Flame,
  Zap,
  Wind,
  Box,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TechnicianInspectionData } from '@/types/technicianInspection';
import type { FuelType, TempSetting, LocationType } from '@/lib/opterraAlgorithm';
import { TechnicianStepLayout, StepCard, SectionHeader } from './TechnicianStepLayout';

interface ReviewStepProps {
  data: TechnicianInspectionData;
  aiDetectedFields: AIDetectedFields;
  onUpdate: (updates: Partial<TechnicianInspectionData>) => void;
  onConfirm: () => void;
}

export interface AIDetectedFields {
  visualRust?: boolean;
  isLeaking?: boolean;
  tempDialSetting?: boolean;
  hasExpTankVisible?: boolean;
  hasPrvVisible?: boolean;
  anodePortCondition?: boolean;
  drainValveCondition?: boolean;
  hasExpTank?: boolean;
  hasPrv?: boolean;
  hasCircPump?: boolean;
  isClosedLoop?: boolean;
  hasSoftener?: boolean;
  hasIsolationValves?: boolean;
  ventCondition?: boolean;
  scaleDepositsVisible?: boolean;
  errorCodeCount?: boolean;
  saltCondition?: boolean;
  hasCarbonFilter?: boolean;
  visualIron?: boolean;
  brand?: boolean;
  model?: boolean;
  serialNumber?: boolean;
  fuelType?: boolean;
  tankCapacity?: boolean;
  warrantyYears?: boolean;
  calendarAge?: boolean;
}

interface ReviewItemProps {
  label: string;
  value: string | number | boolean;
  icon: React.ReactNode;
  isAIDetected?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  editValue?: string;
  onEditChange?: (value: string) => void;
  isCritical?: boolean;
  suffix?: string;
}

function ReviewItem({
  label,
  value,
  icon,
  isAIDetected,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  editValue,
  onEditChange,
  isCritical,
  suffix,
}: ReviewItemProps) {
  const displayValue = typeof value === 'boolean' 
    ? (value ? 'Yes' : 'No')
    : `${value}${suffix || ''}`;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-xl border transition-all",
      isCritical && value === true && "bg-destructive/5 border-destructive/30",
      !isCritical && "bg-card border-border"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
        isCritical && value === true ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {isAIDetected && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 border-primary/30 text-primary">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              AI
            </Badge>
          )}
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => onEditChange?.(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => onSave?.(editValue || '')}>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className={cn(
            "text-sm font-medium truncate",
            isCritical && value === true ? "text-destructive" : "text-foreground"
          )}>
            {displayValue}
          </p>
        )}
      </div>
      
      {!isEditing && onEdit && (
        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function formatLocation(location: LocationType): string {
  const map: Record<LocationType, string> = {
    GARAGE: 'Garage',
    BASEMENT: 'Basement',
    ATTIC: 'Attic',
    UPPER_FLOOR: 'Upper Floor',
    MAIN_LIVING: 'Utility Closet',
    CRAWLSPACE: 'Crawlspace',
    EXTERIOR: 'Exterior',
  };
  return map[location] || location;
}

function formatTemp(temp: TempSetting): string {
  const map: Record<TempSetting, string> = {
    LOW: 'Low (~110°F)',
    NORMAL: 'Normal (~120°F)',
    HOT: 'Hot (~140°F)',
  };
  return map[temp] || temp;
}

function formatFuelType(fuelType: FuelType): string {
  const map: Record<FuelType, string> = {
    GAS: 'Gas Tank',
    ELECTRIC: 'Electric Tank',
    HYBRID: 'Hybrid Heat Pump',
    TANKLESS_GAS: 'Tankless Gas',
    TANKLESS_ELECTRIC: 'Tankless Electric',
  };
  return map[fuelType] || fuelType;
}

export function ReviewStep({ data, aiDetectedFields, onUpdate, onConfirm }: ReviewStepProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: string, currentValue: string | number) => {
    setEditingField(field);
    setEditValue(String(currentValue));
  };

  const saveEdit = (field: string, value: string) => {
    const numValue = parseFloat(value);
    
    switch (field) {
      case 'housePsi':
        onUpdate({ measurements: { ...data.measurements, housePsi: numValue || 0 } } as any);
        break;
      case 'calendarAge':
        onUpdate({ calendarAge: numValue || 0 } as any);
        break;
      case 'tankCapacity':
        onUpdate({ asset: { ...data.asset, tankCapacity: numValue || 0 } } as any);
        break;
      case 'warrantyYears':
        onUpdate({ asset: { ...data.asset, warrantyYears: numValue || 0 } } as any);
        break;
      case 'streetHardnessGPG':
        onUpdate({ streetHardnessGPG: numValue || 0 } as any);
        break;
    }
    
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const isTankless = data.asset.fuelType === 'TANKLESS_GAS' || data.asset.fuelType === 'TANKLESS_ELECTRIC';
  const isHybrid = data.asset.fuelType === 'HYBRID';
  const hasIssues = data.location.isLeaking || data.location.visualRust;
  const aiFieldCount = Object.values(aiDetectedFields).filter(Boolean).length;

  return (
    <TechnicianStepLayout
      icon={<CheckCircle2 className="h-7 w-7" />}
      title="Review & Verify"
      subtitle="Confirm all values before completing inspection"
      hideContinue
    >
      {/* AI Badge */}
      {aiFieldCount > 0 && (
        <div className="flex justify-center">
          <Badge variant="secondary" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            {aiFieldCount} AI-detected value{aiFieldCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Critical Alerts */}
      {hasIssues && (
        <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">Critical Issues Detected</p>
              <p className="text-xs text-muted-foreground">
                {data.location.isLeaking && 'Active leak'}{data.location.isLeaking && data.location.visualRust && ', '}{data.location.visualRust && 'Visible rust'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unit Identification */}
      <StepCard>
        <SectionHeader icon={<Box className="h-4 w-4" />} title="Unit Identification" />
        <div className="space-y-2">
          <ReviewItem
            label="Type"
            value={formatFuelType(data.asset.fuelType)}
            icon={data.asset.fuelType.includes('TANKLESS') ? <Wind className="h-4 w-4" /> : 
                  data.asset.fuelType === 'HYBRID' ? <Zap className="h-4 w-4" /> :
                  data.asset.fuelType === 'ELECTRIC' ? <Zap className="h-4 w-4" /> : <Flame className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.fuelType}
          />
          <ReviewItem
            label="Brand / Model"
            value={`${data.asset.brand || 'Unknown'} ${data.asset.model || ''}`}
            icon={<CircleDot className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.brand || aiDetectedFields.model}
          />
          <ReviewItem
            label="Calendar Age"
            value={data.calendarAge}
            suffix=" years"
            icon={<Clock className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.calendarAge}
            isEditing={editingField === 'calendarAge'}
            onEdit={() => startEdit('calendarAge', data.calendarAge)}
            onSave={(v) => saveEdit('calendarAge', v)}
            onCancel={cancelEdit}
            editValue={editValue}
            onEditChange={setEditValue}
          />
          {!isTankless && (
            <ReviewItem
              label="Tank Capacity"
              value={data.asset.tankCapacity || 0}
              suffix=" gallons"
              icon={<Box className="h-4 w-4" />}
              isAIDetected={aiDetectedFields.tankCapacity}
              isEditing={editingField === 'tankCapacity'}
              onEdit={() => startEdit('tankCapacity', data.asset.tankCapacity || 0)}
              onSave={(v) => saveEdit('tankCapacity', v)}
              onCancel={cancelEdit}
              editValue={editValue}
              onEditChange={setEditValue}
            />
          )}
          <ReviewItem
            label="Warranty"
            value={data.asset.warrantyYears}
            suffix=" years"
            icon={<Shield className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.warrantyYears}
            isEditing={editingField === 'warrantyYears'}
            onEdit={() => startEdit('warrantyYears', data.asset.warrantyYears)}
            onSave={(v) => saveEdit('warrantyYears', v)}
            onCancel={cancelEdit}
            editValue={editValue}
            onEditChange={setEditValue}
          />
        </div>
      </StepCard>

      {/* Measurements */}
      <StepCard>
        <SectionHeader icon={<Gauge className="h-4 w-4" />} title="Measurements" />
        <div className="space-y-2">
          <ReviewItem
            label="House Pressure"
            value={data.measurements.housePsi}
            suffix=" PSI"
            icon={<Gauge className="h-4 w-4" />}
            isEditing={editingField === 'housePsi'}
            onEdit={() => startEdit('housePsi', data.measurements.housePsi)}
            onSave={(v) => saveEdit('housePsi', v)}
            onCancel={cancelEdit}
            editValue={editValue}
            onEditChange={setEditValue}
            isCritical={data.measurements.housePsi > 80}
          />
          <ReviewItem
            label="Water Hardness"
            value={data.streetHardnessGPG}
            suffix=" GPG"
            icon={<Droplets className="h-4 w-4" />}
            isEditing={editingField === 'streetHardnessGPG'}
            onEdit={() => startEdit('streetHardnessGPG', data.streetHardnessGPG)}
            onSave={(v) => saveEdit('streetHardnessGPG', v)}
            onCancel={cancelEdit}
            editValue={editValue}
            onEditChange={setEditValue}
          />
        </div>
      </StepCard>

      {/* Location & Condition */}
      <StepCard>
        <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Location & Condition" />
        <div className="space-y-2">
          <ReviewItem
            label="Location"
            value={formatLocation(data.location.location)}
            icon={<MapPin className="h-4 w-4" />}
          />
          <ReviewItem
            label="Temperature Setting"
            value={formatTemp(data.location.tempSetting)}
            icon={<Thermometer className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.tempDialSetting}
          />
          <ReviewItem
            label="Finished Living Area"
            value={data.location.isFinishedArea}
            icon={<Box className="h-4 w-4" />}
            isCritical={data.location.isFinishedArea}
          />
          <ReviewItem
            label="Visible Rust"
            value={data.location.visualRust}
            icon={<AlertTriangle className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.visualRust}
            isCritical
          />
          <ReviewItem
            label="Active Leak"
            value={data.location.isLeaking}
            icon={<Droplets className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.isLeaking}
            isCritical
          />
        </div>
      </StepCard>

      {/* Equipment */}
      <StepCard>
        <SectionHeader icon={<Shield className="h-4 w-4" />} title="Equipment" />
        <div className="space-y-2">
          <ReviewItem
            label="Expansion Tank"
            value={data.equipment.hasExpTank}
            icon={<Box className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.hasExpTank || aiDetectedFields.hasExpTankVisible}
          />
          <ReviewItem
            label="Pressure Reducing Valve (PRV)"
            value={data.equipment.hasPrv}
            icon={<Gauge className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.hasPrv || aiDetectedFields.hasPrvVisible}
          />
          <ReviewItem
            label="Recirculation Pump"
            value={data.equipment.hasCircPump}
            icon={<CircleDot className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.hasCircPump}
          />
          <ReviewItem
            label="Closed Loop System"
            value={data.equipment.isClosedLoop}
            icon={<CircleDot className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.isClosedLoop}
            isCritical={data.equipment.isClosedLoop && !data.equipment.hasExpTank}
          />
          {isTankless && (
            <ReviewItem
              label="Isolation Valves"
              value={data.equipment.hasIsolationValves || false}
              icon={<CircleDot className="h-4 w-4" />}
              isAIDetected={aiDetectedFields.hasIsolationValves}
            />
          )}
        </div>
      </StepCard>

      {/* Softener */}
      <StepCard>
        <SectionHeader icon={<Droplets className="h-4 w-4" />} title="Water Softener" />
        <div className="space-y-2">
          <ReviewItem
            label="Has Softener"
            value={data.softener.hasSoftener}
            icon={<Droplets className="h-4 w-4" />}
            isAIDetected={aiDetectedFields.hasSoftener}
          />
          {data.softener.hasSoftener && (
            <>
              <ReviewItem
                label="Salt Status"
                value={data.softener.saltStatus || 'Unknown'}
                icon={<Box className="h-4 w-4" />}
                isAIDetected={aiDetectedFields.saltCondition}
              />
              <ReviewItem
                label="Carbon Pre-Filter"
                value={data.softener.hasCarbonFilter || false}
                icon={<CircleDot className="h-4 w-4" />}
                isAIDetected={aiDetectedFields.hasCarbonFilter}
              />
              <ReviewItem
                label="Iron Staining Visible"
                value={data.softener.visualIron || false}
                icon={<AlertTriangle className="h-4 w-4" />}
                isAIDetected={aiDetectedFields.visualIron}
              />
            </>
          )}
        </div>
      </StepCard>

      {/* Tankless-specific */}
      {isTankless && data.tankless && (
        <StepCard>
          <SectionHeader icon={<Wind className="h-4 w-4" />} title="Tankless Details" />
          <div className="space-y-2">
            <ReviewItem
              label="Error Codes"
              value={data.tankless.errorCodeCount}
              icon={<AlertTriangle className="h-4 w-4" />}
              isAIDetected={aiDetectedFields.errorCodeCount}
              isCritical={data.tankless.errorCodeCount > 0}
            />
            {data.tankless.scaleBuildup !== undefined && (
              <ReviewItem
                label="Scale Buildup"
                value={data.tankless.scaleBuildup}
                suffix="%"
                icon={<Box className="h-4 w-4" />}
                isAIDetected={aiDetectedFields.scaleDepositsVisible}
              />
            )}
          </div>
        </StepCard>
      )}

      {/* Hybrid-specific */}
      {isHybrid && data.hybrid && (
        <StepCard>
          <SectionHeader icon={<Zap className="h-4 w-4" />} title="Heat Pump Details" />
          <div className="space-y-2">
            <ReviewItem
              label="Air Filter Status"
              value={data.hybrid.airFilterStatus}
              icon={<Wind className="h-4 w-4" />}
            />
            <ReviewItem
              label="Condensate Clear"
              value={data.hybrid.isCondensateClear}
              icon={<Droplets className="h-4 w-4" />}
            />
          </div>
        </StepCard>
      )}

      {/* Confirm Button */}
      <div className="pt-2">
        <Button onClick={onConfirm} className="w-full h-12 text-base font-semibold" size="lg">
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Confirm & Continue
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Tap any value above to edit before confirming
        </p>
      </div>
    </TechnicianStepLayout>
  );
}
