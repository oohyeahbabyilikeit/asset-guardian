import React, { useState, useMemo } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { HeatPumpVisualization } from './HeatPumpVisualization';
import { HeatPumpHealthGauge } from './HeatPumpHealthGauge';
import { HeatPumpMetricsGrid } from './HeatPumpMetricsGrid';
import { HeatPumpServiceMenu } from './HeatPumpServiceMenu';
import { HeatPumpActionDock } from './HeatPumpActionDock';

export interface HeatPumpInputs {
  compressorHealth: number; // 0-100%
  filterCondition: 'clean' | 'dirty' | 'clogged';
  condensateClear: boolean;
  operatingMode: 'heat-pump' | 'hybrid' | 'electric';
  ambientTemp: number;
  tankHealthPercent?: number;
}

export const DEFAULT_HEAT_PUMP_INPUTS: HeatPumpInputs = {
  compressorHealth: 85,
  filterCondition: 'clean',
  condensateClear: true,
  operatingMode: 'heat-pump',
  ambientTemp: 68,
  tankHealthPercent: 75,
};

interface HeatPumpCenterProps {
  inputs: HeatPumpInputs;
  onInputsChange?: (inputs: HeatPumpInputs) => void;
  onSwitchAsset: (asset: 'water-heater' | 'softener' | 'heat-pump') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
  heatPumpStatus?: 'optimal' | 'warning' | 'critical';
  onServiceRequest: () => void;
  onEmergency: () => void;
  onMaintenanceTips: () => void;
  hasSoftener?: boolean;
  hasWaterHeater?: boolean;
}

export function HeatPumpCenter({
  inputs,
  onInputsChange,
  onSwitchAsset,
  waterHeaterStatus = 'optimal',
  softenerStatus = 'optimal',
  heatPumpStatus = 'optimal',
  onServiceRequest,
  onEmergency,
  onMaintenanceTips,
  hasSoftener = false,
  hasWaterHeater = true,
}: HeatPumpCenterProps) {
  
  // Calculate overall health score
  const overallScore = useMemo(() => {
    let score = 100;
    
    // Compressor health impact (40% weight)
    score -= (100 - inputs.compressorHealth) * 0.4;
    
    // Filter condition impact (20% weight)
    if (inputs.filterCondition === 'dirty') score -= 15;
    if (inputs.filterCondition === 'clogged') score -= 25;
    
    // Condensate impact (20% weight)
    if (!inputs.condensateClear) score -= 20;
    
    // Operating mode penalty (10% weight)
    if (inputs.operatingMode === 'electric') score -= 10;
    if (inputs.operatingMode === 'hybrid') score -= 5;
    
    // Ambient temperature impact (10% weight)
    const isAmbientOptimal = inputs.ambientTemp >= 40 && inputs.ambientTemp <= 90;
    if (!isAmbientOptimal) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [inputs]);

  // Calculate energy savings
  const energySavingsPercent = useMemo(() => {
    if (inputs.operatingMode === 'heat-pump') return 65;
    if (inputs.operatingMode === 'hybrid') return 45;
    return 0;
  }, [inputs.operatingMode]);

  // Determine if there are active services needed
  const hasActiveServices = inputs.filterCondition !== 'clean' || 
                           !inputs.condensateClear || 
                           inputs.compressorHealth < 80;

  // Determine badge and action
  const getBadgeAndAction = () => {
    if (!inputs.condensateClear || inputs.filterCondition === 'clogged' || inputs.compressorHealth < 40) {
      return { 
        badge: 'SERVICE_REQUIRED', 
        action: 'SERVICE',
        reason: 'Your heat pump requires immediate attention to prevent damage and maintain efficiency.'
      };
    }
    if (inputs.compressorHealth < 70 || inputs.filterCondition === 'dirty') {
      return { 
        badge: 'MAINTENANCE_DUE', 
        action: 'MAINTAIN',
        reason: 'Routine maintenance will help maintain peak efficiency and extend equipment life.'
      };
    }
    return { 
      badge: 'HEALTHY', 
      action: 'MONITOR',
      reason: 'Your heat pump is operating efficiently. Continue regular maintenance schedule.'
    };
  };

  const { badge, action, reason } = getBadgeAndAction();
  const isCritical = badge === 'SERVICE_REQUIRED';

  return (
    <div className="min-h-screen bg-background pb-32">
      <DashboardHeader
        activeAsset="heat-pump"
        onSwitchAsset={onSwitchAsset}
        waterHeaterStatus={waterHeaterStatus}
        softenerStatus={softenerStatus}
        heatPumpStatus={heatPumpStatus}
        hasSoftener={hasSoftener}
        hasHeatPump={true}
      />

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Health Gauge */}
        <HeatPumpHealthGauge
          overallScore={overallScore}
          compressorHealth={inputs.compressorHealth}
          filterCondition={inputs.filterCondition}
          condensateClear={inputs.condensateClear}
          ambientTemp={inputs.ambientTemp}
          action={action}
          badge={badge}
          reason={reason}
        />

        {/* Visualization */}
        <HeatPumpVisualization
          compressorHealth={inputs.compressorHealth}
          filterCondition={inputs.filterCondition}
          condensateClear={inputs.condensateClear}
          operatingMode={inputs.operatingMode}
          ambientTemp={inputs.ambientTemp}
          isCompressorRunning={inputs.operatingMode !== 'electric'}
          tankHealthPercent={inputs.tankHealthPercent}
        />

        {/* Metrics Grid */}
        <HeatPumpMetricsGrid
          compressorHealth={inputs.compressorHealth}
          filterCondition={inputs.filterCondition}
          condensateClear={inputs.condensateClear}
          energySavingsPercent={energySavingsPercent}
          operatingMode={inputs.operatingMode}
          ambientTemp={inputs.ambientTemp}
        />

        {/* Service Menu */}
        <HeatPumpServiceMenu
          filterCondition={inputs.filterCondition}
          condensateClear={inputs.condensateClear}
          compressorHealth={inputs.compressorHealth}
          ambientTemp={inputs.ambientTemp}
          onSchedule={onServiceRequest}
        />
      </div>

      {/* Action Dock */}
      <HeatPumpActionDock
        onServiceRequest={onServiceRequest}
        onEmergency={onEmergency}
        onMaintenanceTips={onMaintenanceTips}
        overallScore={overallScore}
        hasActiveServices={hasActiveServices}
        isCritical={isCritical}
      />
    </div>
  );
}
