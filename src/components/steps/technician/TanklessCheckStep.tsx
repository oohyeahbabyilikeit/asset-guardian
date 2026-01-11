import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Flame, 
  Filter, 
  Wind, 
  AlertCircle,
  Gauge,
  HelpCircle,
  Monitor,
  PowerOff,
  Zap
} from 'lucide-react';
import type { TanklessInspection, WaterMeasurements } from '@/types/technicianInspection';
import type { FuelType, FlameRodStatus, InletFilterStatus, VentStatus } from '@/lib/opterraAlgorithm';
import { useErrorCodeScan } from '@/hooks/useErrorCodeScan';
import { useFilterScan } from '@/hooks/useFilterScan';
import { ScanHeroCard, ScanHeroSection } from '@/components/ui/ScanHeroCard';
import { StatusToggleRow, StatusGrid } from '@/components/ui/StatusToggleRow';
import { QuickSelectChips } from '@/components/ui/QuickSelectChips';

type FlowRateMode = 'display' | 'unknown' | 'off';

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

export function TanklessCheckStep({ data, measurements, fuelType, onUpdate, onUpdateMeasurements, onAIDetection, onNext }: TanklessCheckStepProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  
  const { scanErrorCodes, isScanning: isScanningErrors, result: errorResult } = useErrorCodeScan();
  const { scanFilter, isScanning: isScanningFilter, result: filterResult } = useFilterScan();
  
  const getInitialMode = (): FlowRateMode => {
    if (measurements.flowRateUnknown) return 'unknown';
    if (measurements.flowRateGPM !== undefined) return 'display';
    return 'off';
  };
  
  const [flowRateMode, setFlowRateMode] = useState<FlowRateMode>(getInitialMode);
  
  const handleFlowModeChange = (mode: FlowRateMode) => {
    setFlowRateMode(mode);
    if (mode === 'unknown') {
      onUpdateMeasurements({ flowRateUnknown: true, flowRateGPM: undefined });
    } else if (mode === 'off') {
      onUpdateMeasurements({ flowRateUnknown: false, flowRateGPM: undefined });
    } else {
      onUpdateMeasurements({ flowRateUnknown: false });
    }
  };
  
  const handleErrorCodeScan = async (file: File) => {
    const result = await scanErrorCodes(file);
    if (result) {
      const aiFields: Record<string, boolean> = { errorCodeCount: true };
      
      onUpdate({ errorCodeCount: Math.min(result.errorCount, 3) });
      
      if (result.flowRateGPM) {
        onUpdateMeasurements({ flowRateGPM: result.flowRateGPM, flowRateUnknown: false });
        setFlowRateMode('display');
      }
      
      // Track enhanced fields from AI scan
      if (result.hasIsolationValves !== undefined) {
        aiFields.hasIsolationValves = true;
      }
      if (result.ventCondition) {
        aiFields.ventCondition = true;
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
    }
  };

  // Count issues for badge
  const issueCount = [
    data.flameRodStatus === 'FAILING',
    data.inletFilterStatus === 'CLOGGED',
    data.tanklessVentStatus === 'BLOCKED',
    data.errorCodeCount >= 3,
  ].filter(Boolean).length;

  const errorScanSummary = errorResult && (
    <div className="space-y-1 text-sm">
      <p className={errorResult.errorCount > 0 ? 'text-red-600' : 'text-green-600'}>
        {errorResult.errorCount} error code{errorResult.errorCount !== 1 ? 's' : ''} detected
      </p>
      {errorResult.flowRateGPM && (
        <p className="text-muted-foreground">Flow: {errorResult.flowRateGPM} GPM</p>
      )}
    </div>
  );
  
  return (
    <div className="space-y-5">
      {/* Type Badge */}
      <div className="flex items-center justify-center gap-2 py-1">
        <Badge variant="outline" className="gap-1">
          {isGas ? <Flame className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          Tankless {isGas ? 'Gas' : 'Electric'}
        </Badge>
      </div>

      {/* Error Code Scanner - Hero */}
      <ScanHeroCard
        title="Error Codes"
        subtitle="Photo the unit display"
        isScanning={isScanningErrors}
        hasScanned={!!errorResult}
        scanSummary={errorScanSummary}
        onScanImage={handleErrorCodeScan}
        scanLabel="📸 Scan Display"
      >
        {/* Manual error count selection */}
        <div className="space-y-3">
          <Label className="text-sm">Error Codes in History</Label>
          <div className="flex gap-2">
            {[
              { value: 0, label: 'None', color: 'green' },
              { value: 1, label: '1-2', color: 'yellow' },
              { value: 3, label: '3+', color: 'red' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate({ errorCodeCount: opt.value })}
                className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-all
                  ${data.errorCodeCount === opt.value
                    ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                    : opt.color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-red-500 bg-red-50 text-red-700'
                    : 'border-muted hover:border-primary/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </ScanHeroCard>

      {/* Flow Rate - Compact */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4" />
          Current Flow Rate
        </Label>
        
        <div className="flex gap-2">
          {[
            { mode: 'display' as const, icon: <Monitor className="h-3.5 w-3.5" />, label: 'Display' },
            { mode: 'unknown' as const, icon: <HelpCircle className="h-3.5 w-3.5" />, label: 'Unknown' },
            { mode: 'off' as const, icon: <PowerOff className="h-3.5 w-3.5" />, label: 'Off' },
          ].map(({ mode, icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleFlowModeChange(mode)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 text-xs font-medium transition-all
                ${flowRateMode === mode 
                  ? 'border-primary bg-primary/5 text-primary' 
                  : 'border-muted hover:border-primary/50'
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
        
        {flowRateMode === 'display' && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="0.1"
              value={measurements.flowRateGPM ?? ''}
              onChange={(e) => onUpdateMeasurements({ flowRateGPM: parseFloat(e.target.value) || undefined })}
              placeholder="0.0"
              className="w-20 text-center font-mono"
            />
            <span className="text-sm text-muted-foreground">GPM</span>
          </div>
        )}
      </div>

      {/* Component Status - Compact Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Component Status</Label>
          {issueCount > 0 && (
            <Badge variant="destructive" className="text-xs">{issueCount} issue{issueCount > 1 ? 's' : ''}</Badge>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Flame Rod (Gas only) */}
          {isGas && (
            <StatusToggleRow
              label="Flame Rod"
              value={
                data.flameRodStatus === 'GOOD' ? 'good' : 
                data.flameRodStatus === 'WORN' ? 'fair' : 'poor'
              }
              onChange={(v) => onUpdate({ 
                flameRodStatus: v === 'good' ? 'GOOD' : v === 'fair' ? 'WORN' : 'FAILING' 
              })}
              icon={<Flame className="h-4 w-4" />}
            />
          )}
          
          {/* Filter with AI scan button */}
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-card">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium flex-1">Inlet Filter</span>
            
            {/* AI Scan */}
            <ScanHeroCard
              title=""
              isScanning={isScanningFilter}
              hasScanned={!!filterResult}
              onScanImage={handleFilterScan}
              scanLabel="📷"
            >
              <div />
            </ScanHeroCard>
            
            {/* Quick toggles */}
            <div className="flex gap-1">
              {(['CLEAN', 'DIRTY', 'CLOGGED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onUpdate({ inletFilterStatus: status })}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all
                    ${data.inletFilterStatus === status
                      ? status === 'CLEAN' ? 'bg-green-500 text-white'
                      : status === 'DIRTY' ? 'bg-yellow-500 text-white'
                      : 'bg-red-500 text-white'
                      : 'bg-muted/50 hover:bg-muted'
                    }`}
                  title={status}
                >
                  <span className="text-xs font-bold">{status[0]}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Vent (Gas only) */}
          {isGas && (
            <StatusToggleRow
              label="Vent Status"
              value={
                data.tanklessVentStatus === 'CLEAR' ? 'good' : 
                data.tanklessVentStatus === 'RESTRICTED' ? 'fair' : 'poor'
              }
              onChange={(v) => onUpdate({ 
                tanklessVentStatus: v === 'good' ? 'CLEAR' : v === 'fair' ? 'RESTRICTED' : 'BLOCKED' 
              })}
              icon={<Wind className="h-4 w-4" />}
            />
          )}
        </div>
      </div>

      {/* Scale & Health - Collapsed Advanced */}
      <ScanHeroSection 
        title="Scale & Health" 
        defaultOpen={false}
        badge={<Badge variant="outline" className="text-xs">Optional</Badge>}
      >
        <div className="space-y-4">
          <QuickSelectChips
            label="Scale Buildup"
            value={data.scaleBuildup ?? 0}
            onChange={(v) => onUpdate({ scaleBuildup: v })}
            options={SCALE_CHIPS}
          />
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-sm">{isGas ? 'Igniter' : 'Element'} Health</Label>
              <span className="text-sm font-mono">
                {isGas ? (data.igniterHealth ?? 100) : (data.elementHealth ?? 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={isGas ? (data.igniterHealth ?? 100) : (data.elementHealth ?? 100)}
              onChange={(e) => onUpdate(
                isGas 
                  ? { igniterHealth: parseInt(e.target.value) } 
                  : { elementHealth: parseInt(e.target.value) }
              )}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </ScanHeroSection>

      {/* Issues Summary */}
      {issueCount > 0 && (
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {issueCount} issue{issueCount > 1 ? 's' : ''} found
          </p>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full h-12 font-semibold">
        Continue
      </Button>
    </div>
  );
}
