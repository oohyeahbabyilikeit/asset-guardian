import React from 'react';
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
  Thermometer
} from 'lucide-react';
import type { LocationCondition, EquipmentChecklist } from '@/types/technicianInspection';
import type { LocationType, TempSetting } from '@/lib/opterraAlgorithm';
import { useConditionScan } from '@/hooks/useConditionScan';
import { ScanHeroCard } from '@/components/ui/ScanHeroCard';
import { StatusToggleRow } from '@/components/ui/StatusToggleRow';
import { TechnicianStepLayout, StepCard, BinaryToggle, SectionHeader } from './TechnicianStepLayout';
import { cn } from '@/lib/utils';

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
  
  const handleScanImage = async (file: File) => {
    const scanResult = await scanCondition(file);
    if (scanResult) {
      const aiFields: Record<string, boolean> = {};
      
      onUpdate({
        visualRust: scanResult.visualRust,
        isLeaking: scanResult.isLeaking,
      });
      
      aiFields.visualRust = true;
      aiFields.isLeaking = true;
      
      if (scanResult.tempDialSetting) {
        aiFields.tempDialSetting = true;
      }
      if (scanResult.hasExpTankVisible !== undefined) {
        aiFields.hasExpTankVisible = true;
      }
      if (scanResult.hasPrvVisible !== undefined) {
        aiFields.hasPrvVisible = true;
      }
      
      onAIDetection?.(aiFields);
    }
  };

  const scanSummary = result && result.confidence > 0 && (
    <div className="space-y-1 text-sm">
      <p className={result.visualRust ? 'text-orange-600' : 'text-green-600'}>
        Rust: {result.rustSeverity}
      </p>
      <p className={result.isLeaking ? 'text-red-600' : 'text-green-600'}>
        Leak: {result.leakSeverity}
      </p>
    </div>
  );
  
  const isComplete = 
    data.location !== undefined &&
    data.isFinishedArea !== undefined &&
    data.tempSetting !== undefined &&
    data.visualRust !== undefined &&
    data.isLeaking !== undefined &&
    (!data.isLeaking || data.leakSource !== undefined);

  return (
    <TechnicianStepLayout
      icon={<MapPin className="h-7 w-7" />}
      title="Location & Condition"
      subtitle="Record unit location and visual inspection"
      onContinue={onNext}
      continueDisabled={!isComplete}
    >
      {/* Location Selection */}
      <StepCard>
        <SectionHeader icon={<MapPin className="h-4 w-4" />} title="Unit Location" isRequired />
        <div className="grid grid-cols-3 gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => onUpdate({ location: loc.value })}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
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
              <span className="text-xs font-medium">{loc.label}</span>
              {loc.risk && data.location === loc.value && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700">Risk</Badge>
              )}
            </button>
          ))}
        </div>
      </StepCard>

      {/* Visual Condition Scan */}
      <ScanHeroCard
        title="Visual Condition"
        subtitle="Take a photo of the unit"
        isScanning={isScanning}
        hasScanned={!!result}
        scanSummary={scanSummary}
        onScanImage={handleScanImage}
        scanLabel="📷 Scan for Rust & Leaks"
      >
        <div className="space-y-2">
          <StatusToggleRow
            label="Rust/Corrosion"
            value={data.visualRust ? 'poor' : data.visualRust === false ? 'good' : undefined}
            onChange={(v) => onUpdate({ visualRust: v === 'poor' })}
            options={[
              { value: 'good', label: 'None', color: 'green', icon: <span className="text-xs">✓</span> },
              { value: 'poor', label: 'Visible', color: 'red', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
            ]}
          />
          <StatusToggleRow
            label="Active Leak"
            value={data.isLeaking ? 'poor' : data.isLeaking === false ? 'good' : undefined}
            onChange={(v) => onUpdate({ isLeaking: v === 'poor' })}
            icon={<Droplet className="h-4 w-4" />}
            options={[
              { value: 'good', label: 'Dry', color: 'green', icon: <span className="text-xs">✓</span> },
              { value: 'poor', label: 'Leaking', color: 'red', icon: <Droplet className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </ScanHeroCard>

      {/* Leak Source Classification */}
      {data.isLeaking && (
        <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">Active Leak Detected</p>
              <p className="text-xs text-muted-foreground">Please identify the leak source</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium">Leak Source (Required)</Label>
            <div className="space-y-1.5">
              {LEAK_SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ leakSource: opt.value })}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all text-left",
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
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Environment Details */}
      <StepCard>
        <SectionHeader icon={<Thermometer className="h-4 w-4" />} title="Environment" isRequired />
        
        {/* Finished Area Toggle */}
        <BinaryToggle
          label="Finished Living Area?"
          description="Unit in living space (higher damage risk)"
          value={data.isFinishedArea}
          onChange={(val) => onUpdate({ isFinishedArea: val })}
          yesVariant="warning"
          noVariant="success"
        />
        
        {/* Temperature Setting */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Temp Dial Setting</p>
              <p className="text-xs text-muted-foreground">Current thermostat position</p>
            </div>
            {data.tempSetting && (
              <Badge variant={data.tempSetting === 'HOT' ? 'destructive' : 'secondary'}>
                {data.tempSetting}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {TEMP_CHIPS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onUpdate({ tempSetting: t.value })}
                className={cn(
                  "flex-1 py-2.5 rounded-xl border-2 transition-all text-sm font-medium",
                  data.tempSetting === t.value
                    ? t.value === 'HOT' 
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-muted/30 hover:border-primary/50"
                )}
              >
                <div>{t.label}</div>
                <div className="text-[10px] opacity-70">{t.temp}</div>
              </button>
            ))}
          </div>
        </div>
      </StepCard>

      {/* Validation Warning */}
      {!isComplete && (
        <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Please complete all required fields to continue
          </p>
        </div>
      )}
    </TechnicianStepLayout>
  );
}
