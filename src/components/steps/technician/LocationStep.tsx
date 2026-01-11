import React, { useRef } from 'react';
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
  Droplet
} from 'lucide-react';
import type { LocationCondition } from '@/types/technicianInspection';
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

interface LocationStepProps {
  data: LocationCondition;
  onUpdate: (data: Partial<LocationCondition>) => void;
  onAIDetection?: (fields: Record<string, boolean>) => void;
  onNext: () => void;
}

export function LocationStep({ data, onUpdate, onAIDetection, onNext }: LocationStepProps) {
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

      {/* Critical Leak Warning */}
      {data.isLeaking && (
        <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive text-sm">Active Leak</p>
              <p className="text-xs text-muted-foreground">Unit flagged for replacement</p>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Details - Collapsed */}
      <ScanHeroSection 
        title="Environment Details" 
        defaultOpen={false}
        badge={
          data.isFinishedArea ? (
            <Badge variant="secondary" className="text-xs">Finished Area</Badge>
          ) : null
        }
      >
        <div className="space-y-4">
          {/* Finished Area */}
          <StatusToggleRow
            label="Finished Living Area?"
            value={data.isFinishedArea ? 'poor' : 'good'}
            onChange={(v) => onUpdate({ isFinishedArea: v !== 'good' })}
            options={[
              { value: 'good', label: 'No', color: 'green', icon: <span className="text-xs">✓</span> },
              { value: 'poor', label: 'Yes', color: 'yellow', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
            ]}
          />
          
          {/* Temperature Setting */}
          <div className="space-y-2">
            <Label className="text-sm">Temp Dial</Label>
            <div className="flex gap-2">
              {TEMP_CHIPS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onUpdate({ tempSetting: t.value })}
                  className={`flex-1 py-2 rounded-lg border-2 transition-all text-sm font-medium
                    ${data.tempSetting === t.value
                      ? t.value === 'HOT' 
                        ? "border-orange-500 bg-orange-50 text-orange-700"
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
        </div>
      </ScanHeroSection>
      
      <Button onClick={onNext} className="w-full h-12 font-semibold">
        Continue
      </Button>
    </div>
  );
}
