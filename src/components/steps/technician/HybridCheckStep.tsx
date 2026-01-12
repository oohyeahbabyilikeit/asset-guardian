import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wind, 
  Droplets, 
  CheckCircle,
  AlertTriangle,
  Home
} from 'lucide-react';
import type { HybridInspection } from '@/types/technicianInspection';
import { useFilterScan } from '@/hooks/useFilterScan';
import { ScanHeroCard } from '@/components/ui/ScanHeroCard';
import { StatusToggleRow } from '@/components/ui/StatusToggleRow';

/**
 * HybridCheckStep v8.0 - "5-Minute Flow" Optimized
 * 
 * REMOVED (now auto-proxied in algorithm):
 * - compressorHealth slider → Inferred from errorCodeCount
 * - roomVolumeType detailed options → Simplified to isConfinedSpace toggle
 * 
 * KEPT (high-value, quick to collect):
 * - Air filter scan (AI-powered)
 * - Condensate drain check (binary toggle)
 * - Confined space warning (simple toggle)
 */

interface HybridCheckStepProps {
  data: HybridInspection;
  onUpdate: (data: Partial<HybridInspection>) => void;
  onNext: () => void;
}

export function HybridCheckStep({ data, onUpdate, onNext }: HybridCheckStepProps) {
  const { scanFilter, isScanning, result } = useFilterScan();
  
  const handleScanImage = async (file: File) => {
    const scanResult = await scanFilter(file, 'air');
    if (scanResult) {
      onUpdate({ airFilterStatus: scanResult.status });
    }
  };

  const scanSummary = result && (
    <div className="space-y-1 text-sm">
      <p className={
        result.status === 'CLOGGED' ? 'text-red-600 font-medium' :
        result.status === 'DIRTY' ? 'text-yellow-600' : 'text-green-600'
      }>
        Filter: {result.status} ({result.blockagePercent}% blocked)
      </p>
      {result.recommendation && (
        <p className="text-muted-foreground text-xs">{result.recommendation}</p>
      )}
    </div>
  );

  // Count issues for summary
  const issueCount = [
    data.airFilterStatus === 'CLOGGED',
    !data.isCondensateClear,
    data.roomVolumeType === 'CLOSET_SEALED',
  ].filter(Boolean).length;
  
  // Derive confined space from roomVolumeType for backwards compat
  const isConfinedSpace = data.roomVolumeType === 'CLOSET_SEALED';
  
  const handleConfinedSpaceToggle = (confined: boolean) => {
    // Map toggle to roomVolumeType for algorithm compatibility
    onUpdate({ 
      roomVolumeType: confined ? 'CLOSET_SEALED' : 'OPEN' 
    });
  };
  
  return (
    <div className="space-y-5">
      {/* Type Badge */}
      <div className="flex items-center justify-center py-1">
        <Badge variant="outline" className="gap-1">
          <Wind className="h-3 w-3" />
          Hybrid / Heat Pump
        </Badge>
      </div>

      {/* Air Filter - Scan Hero */}
      <ScanHeroCard
        title="Air Filter"
        subtitle="Photo the filter element"
        isScanning={isScanning}
        hasScanned={!!result}
        scanSummary={scanSummary}
        onScanImage={handleScanImage}
        scanLabel="📷 Scan Air Filter"
      >
        {/* Manual filter selection */}
        <div className="space-y-2">
          <Label className="text-sm">Filter Condition</Label>
          <div className="flex gap-2">
            {([
              { value: 'CLEAN' as const, label: 'Clean', icon: <CheckCircle className="h-4 w-4" />, color: 'green' },
              { value: 'DIRTY' as const, label: 'Dirty', icon: <AlertTriangle className="h-4 w-4" />, color: 'yellow' },
              { value: 'CLOGGED' as const, label: 'Clogged', icon: <AlertTriangle className="h-4 w-4" />, color: 'red' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ airFilterStatus: opt.value })}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                  ${data.airFilterStatus === opt.value
                    ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                    : opt.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-muted hover:border-primary/50'
                  }`}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </ScanHeroCard>

      {/* Condensate Drain - Quick Toggle */}
      <StatusToggleRow
        label="Condensate Drain"
        value={data.isCondensateClear ? 'good' : 'poor'}
        onChange={(v) => onUpdate({ isCondensateClear: v === 'good' })}
        icon={<Droplets className="h-4 w-4" />}
        options={[
          { value: 'good', label: 'Clear', color: 'green', icon: <CheckCircle className="h-3.5 w-3.5" /> },
          { value: 'poor', label: 'Blocked', color: 'red', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
        ]}
      />

      {/* Confined Space - Simplified Toggle */}
      <div className="p-4 bg-muted/30 rounded-xl border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Confined Space?</p>
              <p className="text-xs text-muted-foreground">Sealed closet with no vents</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleConfinedSpaceToggle(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${!isConfinedSpace
                  ? "bg-green-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              No
            </button>
            <button
              type="button"
              onClick={() => handleConfinedSpaceToggle(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isConfinedSpace
                  ? "bg-red-500 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
            >
              Yes
            </button>
          </div>
        </div>
        {isConfinedSpace && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Heat pump needs ~700 cu ft of air - efficiency will suffer significantly
          </p>
        )}
      </div>

      {/* Issues Summary */}
      {issueCount > 0 && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {issueCount} issue{issueCount > 1 ? 's' : ''} found
          </p>
          <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
            {data.airFilterStatus === 'CLOGGED' && <li>• Air filter needs replacement</li>}
            {!data.isCondensateClear && <li>• Condensate drain blocked</li>}
            {isConfinedSpace && <li>• Unit in confined space (efficiency impact)</li>}
          </ul>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full h-12 font-semibold">
        Continue
      </Button>
    </div>
  );
}
