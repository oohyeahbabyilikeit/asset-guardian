import React from 'react';
import { Button } from '@/components/ui/button';
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
  Gauge,
  RotateCw,
  Container,
  HelpCircle,
  Link,
  Unlink,
  ShieldCheck
} from 'lucide-react';
import type { LocationCondition, EquipmentChecklist } from '@/types/technicianInspection';
import type { LocationType, TempSetting } from '@/lib/opterraAlgorithm';
import { useConditionScan } from '@/hooks/useConditionScan';
import { ScanHeroCard, ScanHeroSection } from '@/components/ui/ScanHeroCard';
import { StatusToggleRow } from '@/components/ui/StatusToggleRow';

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

// NEW v7.8: Expansion tank status options
const EXP_TANK_STATUS_OPTIONS = [
  { value: 'FUNCTIONAL' as const, label: 'Working', description: 'Bladder holds pressure' },
  { value: 'WATERLOGGED' as const, label: 'Waterlogged', description: 'Dead bladder - solid feel' },
  { value: 'MISSING' as const, label: 'Not Present', description: 'No tank installed' },
];

// NEW v7.8: Leak source options
const LEAK_SOURCE_OPTIONS = [
  { value: 'TANK_BODY' as const, label: 'Tank Body', description: 'Leak from tank itself (fatal)', color: 'red' },
  { value: 'FITTING_VALVE' as const, label: 'Fitting/Valve', description: 'Repairable connection leak', color: 'yellow' },
  { value: 'DRAIN_PAN' as const, label: 'Drain Pan', description: 'Water in pan, source unclear', color: 'orange' },
];

// NEW v7.9: Connection type options
const CONNECTION_TYPE_OPTIONS = [
  { value: 'DIELECTRIC' as const, label: 'Dielectric', description: 'Plastic isolator ring' },
  { value: 'BRASS' as const, label: 'Brass Nipple', description: 'Brass transition' },
  { value: 'DIRECT_COPPER' as const, label: 'Direct Copper', description: 'Copper to steel (⚠️ Galvanic risk)' },
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
  const hasIssue = data.isLeaking || data.visualRust;
  const { scanCondition, isScanning, result } = useConditionScan();
  
  const handleScanImage = async (file: File) => {
    const scanResult = await scanCondition(file);
    if (scanResult) {
      const aiFields: Record<string, boolean> = {};
      
      onUpdate({
        visualRust: scanResult.visualRust,
        isLeaking: scanResult.isLeaking,
      });
      
      // Track AI-detected fields
      aiFields.visualRust = true;
      aiFields.isLeaking = true;
      
      // Track additional fields from enhanced scan
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
  
  return (
    <div className="space-y-5">
      {/* Location Selection - Primary */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Where is the unit?</Label>
        <div className="grid grid-cols-3 gap-2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.value}
              type="button"
              onClick={() => onUpdate({ location: loc.value })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all
                ${data.location === loc.value
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
                }`}
            >
              <span className={data.location === loc.value ? "text-primary" : "text-muted-foreground"}>
                {loc.icon}
              </span>
              <span className="text-xs font-medium">{loc.label}</span>
              {loc.risk && data.location === loc.value && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Risk</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Condition Scan - Hero for visual inspection */}
      <ScanHeroCard
        title="Visual Condition"
        subtitle="Take a photo of the unit"
        isScanning={isScanning}
        hasScanned={!!result}
        scanSummary={scanSummary}
        onScanImage={handleScanImage}
        scanLabel="📷 Scan for Rust & Leaks"
      >
        {/* Manual condition toggles */}
        <div className="space-y-2">
          <StatusToggleRow
            label="Rust/Corrosion"
            value={data.visualRust ? 'poor' : 'good'}
            onChange={(v) => onUpdate({ visualRust: v === 'poor' || v === 'fair' })}
            options={[
              { value: 'good', label: 'None', color: 'green', icon: <span className="text-xs">✓</span> },
              { value: 'poor', label: 'Visible', color: 'red', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
            ]}
          />
          <StatusToggleRow
            label="Active Leak"
            value={data.isLeaking ? 'poor' : 'good'}
            onChange={(v) => onUpdate({ isLeaking: v === 'poor' })}
            icon={<Droplet className="h-4 w-4" />}
            options={[
              { value: 'good', label: 'Dry', color: 'green', icon: <span className="text-xs">✓</span> },
              { value: 'poor', label: 'Leaking', color: 'red', icon: <Droplet className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </ScanHeroCard>

      {/* Critical Leak Warning with Source Classification */}
      {data.isLeaking && (
        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">Active Leak Detected</p>
              <p className="text-xs text-muted-foreground">Please identify the leak source</p>
            </div>
          </div>
          
          {/* NEW v7.8: Leak Source Classification */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Leak Source (Required)</Label>
            <div className="space-y-1.5">
              {LEAK_SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ leakSource: opt.value })}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-all text-left
                    ${data.leakSource === opt.value
                      ? opt.color === 'red' ? 'border-red-500 bg-red-50'
                      : opt.color === 'yellow' ? 'border-yellow-500 bg-yellow-50'
                      : 'border-orange-500 bg-orange-50'
                      : 'border-muted hover:border-primary/50'
                    }`}
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

      {/* CRITICAL: Equipment Verification - Required Questions */}
      <div className="space-y-3 p-4 bg-accent/30 rounded-xl border-2 border-accent">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="h-5 w-5 text-primary" />
          <Label className="text-sm font-semibold">Equipment Present? (Required)</Label>
        </div>
        
        {/* Expansion Tank - NEW v7.8: Status instead of Yes/No */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-3">
            <Container className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Expansion Tank Status</p>
              <p className="text-xs text-muted-foreground">Check bladder by tapping tank</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1 ml-10">
          {EXP_TANK_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onEquipmentUpdate({ 
                  hasExpTank: opt.value !== 'MISSING',
                  expTankStatus: opt.value 
                });
              }}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                ${equipmentData.expTankStatus === opt.value
                  ? opt.value === 'FUNCTIONAL' ? "bg-green-500 text-white"
                  : opt.value === 'WATERLOGGED' ? "bg-orange-500 text-white"
                  : "bg-muted text-muted-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              title={opt.description}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* PRV */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">PRV (Pressure Reducing Valve)</p>
              <p className="text-xs text-muted-foreground">Regulates incoming pressure</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEquipmentUpdate({ hasPrv: true })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${equipmentData.hasPrv === true
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onEquipmentUpdate({ hasPrv: false })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${equipmentData.hasPrv === false
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              No
            </button>
          </div>
        </div>

        {/* Circulation Pump */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
          <div className="flex items-center gap-3">
            <RotateCw className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Recirculation Pump</p>
              <p className="text-xs text-muted-foreground">Hot water recirculation system</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onEquipmentUpdate({ hasCircPump: true })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${equipmentData.hasCircPump === true
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => onEquipmentUpdate({ hasCircPump: false })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${equipmentData.hasCircPump === false
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              No
            </button>
          </div>
        </div>

        {/* NEW v7.9: Connection Type ("Galvanic Blind Spot" Fix) */}
        <ScanHeroSection title="Connection Type" defaultOpen={false}>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">How is copper connected to tank?</Label>
            <div className="flex gap-2">
              {CONNECTION_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onEquipmentUpdate({ connectionType: opt.value })}
                  className={`flex-1 py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all
                    ${equipmentData.connectionType === opt.value
                      ? opt.value === 'DIRECT_COPPER' ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted hover:border-primary/50'
                    }`}
                  title={opt.description}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {equipmentData.connectionType === 'DIRECT_COPPER' && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Galvanic corrosion risk - 3x accelerated aging
              </p>
            )}
          </div>
        </ScanHeroSection>

        {/* Validation warning */}
        {(equipmentData.expTankStatus === undefined || equipmentData.hasPrv === null || equipmentData.hasCircPump === null) && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Please answer all equipment questions
          </p>
        )}
      </div>

      {/* Environment Details - Now Required */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <Label className="text-sm font-semibold">Environment Details (Required)</Label>
        </div>
        
        {/* Finished Area */}
        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
          <div>
            <p className="text-sm font-medium">Finished Living Area?</p>
            <p className="text-xs text-muted-foreground">Unit in living space (higher damage risk)</p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onUpdate({ isFinishedArea: false })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${data.isFinishedArea === false
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ isFinishedArea: true })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${data.isFinishedArea === true
                  ? "bg-amber-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              Yes
            </button>
          </div>
        </div>
        
        {/* Temperature Setting */}
        <div className="p-3 bg-background rounded-lg border">
          <div className="flex items-center justify-between mb-3">
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
                className={`flex-1 py-2.5 rounded-lg border-2 transition-all text-sm font-medium
                  ${data.tempSetting === t.value
                    ? t.value === 'HOT' 
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-primary bg-primary text-primary-foreground"
                    : "border-muted bg-muted/30 hover:border-primary/50"
                  }`}
              >
                <div>{t.label}</div>
                <div className="text-[10px] opacity-70">{t.temp}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* NEW v7.8: Drain Pan - Required for high-risk locations */}
        {(data.location === 'ATTIC' || data.location === 'UPPER_FLOOR' || data.location === 'MAIN_LIVING') && (
          <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-amber-300">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium">Drain Pan Present?</p>
                <p className="text-xs text-muted-foreground">Required for high-risk location</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onEquipmentUpdate({ hasDrainPan: true })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${equipmentData.hasDrainPan === true
                    ? "bg-green-500 text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onEquipmentUpdate({ hasDrainPan: false })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${equipmentData.hasDrainPan === false
                    ? "bg-red-500 text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
              >
                No
              </button>
            </div>
          </div>
        )}
        
        {/* Validation warning for environment */}
        {(data.isFinishedArea === undefined || !data.tempSetting) && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Please complete environment details
          </p>
        )}
      </div>
      
      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={
          equipmentData.expTankStatus === undefined || 
          equipmentData.hasPrv === null || 
          equipmentData.hasCircPump === null ||
          data.isFinishedArea === undefined ||
          !data.tempSetting ||
          (data.isLeaking && !data.leakSource)
        }
      >
        Continue
      </Button>
    </div>
  );
}
