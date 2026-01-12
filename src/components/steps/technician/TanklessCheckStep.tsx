import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  AlertCircle,
  Gauge,
  AlertTriangle
} from 'lucide-react';
import type { TanklessInspection, WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';
import { useErrorCodeScan } from '@/hooks/useErrorCodeScan';
import { useFilterScan } from '@/hooks/useFilterScan';
import { ScanHeroCard, ScanHeroSection } from '@/components/ui/ScanHeroCard';
import { QuickSelectChips } from '@/components/ui/QuickSelectChips';

/**
 * TanklessCheckStep v8.0 - "5-Minute Flow" Optimized
 * 
 * REMOVED (now auto-proxied in algorithm):
 * - flameRodStatus → Inferred from errorCodeCount
 * - igniterHealth/elementHealth → Inferred from errorCodeCount  
 * - gasRunLength → Deleted (only gasLineSize matters for ½" check)
 * - flowRateGPM → Derived from ratedFlowGPM + scaleBuildup
 * - tanklessVentStatus → Moved to exception toggle
 * 
 * KEPT (high-value, quick to collect):
 * - Error code scan (AI-powered)
 * - Gas line size (½" fail check)
 * - Scale buildup (quick visual chips)
 * - Inlet filter (AI scan or quick toggle)
 */

interface TanklessCheckStepProps {
  data: TanklessInspection;
  measurements: WaterMeasurements;
  fuelType: FuelType;
  onUpdate: (data: Partial<TanklessInspection>) => void;
  onUpdateMeasurements: (data: Partial<WaterMeasurements>) => void;
  onAIDetection?: (fields: Record<string, boolean>) => void;
  onNext: () => void;
}

const SCALE_CHIPS = [
  { value: 0, label: 'None', sublabel: '0%', variant: 'success' as const },
  { value: 30, label: 'Light', sublabel: '~30%' },
  { value: 60, label: 'Moderate', sublabel: '~60%', variant: 'warning' as const },
  { value: 90, label: 'Severe', sublabel: '90%+', variant: 'danger' as const },
];

const GAS_LINE_CHIPS = [
  { value: '1/2', label: '½"', sublabel: '⚠️ Undersized', variant: 'danger' as const },
  { value: '3/4', label: '¾"', sublabel: 'Standard' },
  { value: '1', label: '1"', sublabel: 'Optimal', variant: 'success' as const },
];

export function TanklessCheckStep({ 
  data, 
  measurements, 
  fuelType, 
  onUpdate, 
  onUpdateMeasurements, 
  onAIDetection, 
  onNext 
}: TanklessCheckStepProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  
  const { scanErrorCodes, isScanning: isScanningErrors, result: errorResult } = useErrorCodeScan();
  const { scanFilter, isScanning: isScanningFilter, result: filterResult } = useFilterScan();
  
  const handleErrorCodeScan = async (file: File) => {
    const result = await scanErrorCodes(file);
    if (result) {
      const aiFields: Record<string, boolean> = { errorCodeCount: true };
      
      onUpdate({ errorCodeCount: Math.min(result.errorCount, 3) });
      
      // Track enhanced fields from AI scan
      if (result.hasIsolationValves !== undefined) {
        aiFields.hasIsolationValves = true;
      }
      if (result.scaleDepositsVisible) {
        aiFields.scaleDepositsVisible = true;
      }
      
      onAIDetection?.(aiFields);
    }
  };
  
  const handleFilterScan = async (file: File) => {
    const result = await scanFilter(file, 'inlet');
    if (result) {
      onUpdate({ inletFilterStatus: result.status });
      onAIDetection?.({ inletFilterStatus: true });
    }
  };

  // Count critical issues for badge
  const issueCount = [
    data.inletFilterStatus === 'CLOGGED',
    data.errorCodeCount >= 3,
    data.gasLineSize === '1/2',
    (data.scaleBuildup ?? 0) >= 60,
  ].filter(Boolean).length;

  const errorScanSummary = errorResult && (
    <div className="space-y-1 text-sm">
      <p className={errorResult.errorCount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
        {errorResult.errorCount} error code{errorResult.errorCount !== 1 ? 's' : ''} detected
      </p>
    </div>
  );
  
  return (
    <div className="space-y-5">
      {/* Type Badge */}
      <div className="flex items-center justify-center py-1">
        <Badge variant="outline" className="gap-1.5">
          <Gauge className="h-3 w-3" />
          Tankless {isGas ? 'Gas' : 'Electric'}
        </Badge>
      </div>

      {/* Error Code Scan - Primary Action */}
      <ScanHeroCard
        title="Display Panel"
        subtitle="Photo the front display for error codes"
        isScanning={isScanningErrors}
        hasScanned={!!errorResult}
        scanSummary={errorScanSummary}
        onScanImage={handleErrorCodeScan}
        scanLabel="📷 Scan Display"
      >
        {/* Manual error count */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Error Code Count</Label>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => onUpdate({ errorCodeCount: count })}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-lg transition-all
                  ${data.errorCodeCount === count
                    ? count === 0 ? 'border-green-500 bg-green-50 text-green-700'
                    : count >= 3 ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-muted hover:border-primary/50'
                  }`}
              >
                {count === 3 ? '3+' : count}
              </button>
            ))}
          </div>
          {data.errorCodeCount >= 3 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Multiple errors indicate component failure - service required
            </p>
          )}
        </div>
      </ScanHeroCard>

      {/* Gas Line Size - Critical for Gas Units */}
      {isGas && (
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Gauge className="h-4 w-4" />
            Gas Line Size
          </Label>
          <div className="flex gap-2">
            {GAS_LINE_CHIPS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ gasLineSize: opt.value as '1/2' | '3/4' | '1' })}
                className={`flex-1 py-3 rounded-xl border-2 transition-all
                  ${data.gasLineSize === opt.value
                    ? opt.variant === 'danger' ? 'border-red-500 bg-red-50 text-red-700'
                    : opt.variant === 'success' ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-primary bg-primary/10 text-foreground'
                    : 'border-muted hover:border-primary/50'
                  }`}
              >
                <div className="font-bold text-lg">{opt.label}</div>
                <div className="text-xs opacity-70">{opt.sublabel}</div>
              </button>
            ))}
          </div>
          {data.gasLineSize === '1/2' && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              ½" gas line is undersized for most tankless units - may cause intermittent failures
            </p>
          )}
        </div>
      )}

      {/* Inlet Filter - Quick Scan or Toggle */}
      <ScanHeroCard
        title="Inlet Filter"
        subtitle="Photo the filter screen"
        isScanning={isScanningFilter}
        hasScanned={!!filterResult}
        scanSummary={filterResult && (
          <p className={
            filterResult.status === 'CLOGGED' ? 'text-red-600 font-medium' :
            filterResult.status === 'DIRTY' ? 'text-yellow-600' : 'text-green-600'
          }>
            Filter: {filterResult.status}
          </p>
        )}
        onScanImage={handleFilterScan}
        scanLabel="📷"
      >
        <div className="flex gap-2">
          {(['CLEAN', 'DIRTY', 'CLOGGED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onUpdate({ inletFilterStatus: status })}
              className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                ${data.inletFilterStatus === status
                  ? status === 'CLEAN' ? 'border-green-500 bg-green-50 text-green-700'
                  : status === 'DIRTY' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                  : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-muted hover:border-primary/50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </ScanHeroCard>

      {/* Scale Buildup - Quick Visual Assessment */}
      <ScanHeroSection 
        title="Scale Buildup" 
        defaultOpen={true}
        badge={(data.scaleBuildup ?? 0) >= 60 ? (
          <Badge variant="destructive" className="text-xs">High</Badge>
        ) : undefined}
      >
        <QuickSelectChips
          label=""
          value={data.scaleBuildup ?? 0}
          onChange={(v) => onUpdate({ scaleBuildup: v })}
          options={SCALE_CHIPS}
        />
        {(data.scaleBuildup ?? 0) >= 60 && (
          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Descaling recommended - flow restriction likely
          </p>
        )}
      </ScanHeroSection>

      {/* Issues Summary */}
      {issueCount > 0 && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {issueCount} issue{issueCount > 1 ? 's' : ''} found
          </p>
          <ul className="text-xs text-orange-700 mt-1 space-y-0.5">
            {data.errorCodeCount >= 3 && <li>• Multiple error codes</li>}
            {data.gasLineSize === '1/2' && <li>• Undersized gas line</li>}
            {data.inletFilterStatus === 'CLOGGED' && <li>• Clogged inlet filter</li>}
            {(data.scaleBuildup ?? 0) >= 60 && <li>• Significant scale buildup</li>}
          </ul>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full h-12 font-semibold">
        Continue
      </Button>
    </div>
  );
}
