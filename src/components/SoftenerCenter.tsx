import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Droplets, Settings, RefreshCw } from 'lucide-react';
import { DashboardHeader } from './DashboardHeader';
import { SoftenerVisualization } from './SoftenerVisualization';
import { SoftenerMetricsGrid } from './SoftenerMetricsGrid';
import { SoftenerHealthGauge } from './SoftenerHealthGauge';
import { SaltCalculator } from './SaltCalculator';
import { SoftenerServiceMenu } from './SoftenerServiceMenu';
import { SoftenerActionDock } from './SoftenerActionDock';
import { 
  SoftenerInputs, 
  calculateSoftenerHealth,
  SoftenerResult 
} from '@/lib/softenerAlgorithm';

interface SoftenerCenterProps {
  inputs: SoftenerInputs;
  onInputsChange?: (inputs: SoftenerInputs) => void;
  onSwitchAsset?: (asset: 'water-heater' | 'softener') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
  onBack?: () => void;
  onServiceRequest?: () => void;
  onEmergency?: () => void;
  onMaintenanceTips?: () => void;
}

export function SoftenerCenter({
  inputs,
  onInputsChange,
  onSwitchAsset,
  waterHeaterStatus,
  softenerStatus,
  onBack,
  onServiceRequest,
  onEmergency,
  onMaintenanceTips,
}: SoftenerCenterProps) {
  const [saltLevelPercent, setSaltLevelPercent] = useState(65);
  
  // Calculate all metrics
  const result = calculateSoftenerHealth(inputs);
  const { metrics, recommendation, saltCalculator, serviceMenu } = result;

  // Map service menu items to component format
  const activeServices = serviceMenu
    .filter(s => s.priority === 'critical' || s.priority === 'recommended')
    .map(s => ({
      id: s.id,
      name: s.name,
      price: s.price,
      trigger: s.trigger,
      pitch: s.pitch,
      // Map algorithm priority to component priority
      priority: s.priority === 'critical' ? 'urgent' as const : 
               s.priority === 'recommended' ? 'recommended' as const : 'preventive' as const,
      icon: s.id === 'valve-rebuild' ? Settings :
            s.id === 'resin-detox' ? RefreshCw :
            s.id === 'resin-rebed' ? Droplets :
            Droplets,
    }));

  return (
    <div className="min-h-screen bg-background pb-40 relative">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="relative">
        <DashboardHeader 
          activeAsset="softener"
          onSwitchAsset={onSwitchAsset}
          waterHeaterStatus={waterHeaterStatus}
          softenerStatus={softenerStatus}
          hasSoftener={true}
        />

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Unit Profile */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-foreground">Water Softener</h2>
              <p className="text-sm text-muted-foreground">
                {inputs.capacity.toLocaleString()} grain capacity
              </p>
            </div>
            <Badge variant="outline">
              {inputs.ageYears} years old
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Hardness</p>
              <p className="font-semibold text-foreground">{inputs.hardnessGPG} GPG</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">People</p>
              <p className="font-semibold text-foreground">{inputs.people}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground">Water Source</p>
              <p className="font-semibold text-foreground">
                {inputs.isCityWater ? 'City' : 'Well'}
              </p>
            </div>
          </div>
          
          {inputs.isCityWater && !inputs.hasCarbonFilter && (
            <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ No carbon filter detected. Chlorine is degrading resin faster.
              </p>
            </div>
          )}
        </Card>

        {/* Health Gauge */}
        <SoftenerHealthGauge
          resinHealth={metrics.resinHealth}
          odometer={metrics.odometer}
          action={recommendation.action}
          badge={recommendation.badge}
          reason={recommendation.reason}
          saltLevelPercent={saltLevelPercent}
          isCityWater={inputs.isCityWater}
          hasCarbonFilter={inputs.hasCarbonFilter}
        />

        {/* System Diagram - Health-focused visualization */}
        <SoftenerVisualization
          resinHealth={metrics.resinHealth}
          odometerCycles={metrics.odometer}
          saltLevelPercent={saltLevelPercent}
          hasCarbonFilter={inputs.hasCarbonFilter}
          isCityWater={inputs.isCityWater}
        />

        {/* Metrics Grid */}
        <SoftenerMetricsGrid
          odometer={metrics.odometer}
          resinHealth={metrics.resinHealth}
          regenIntervalDays={metrics.regenIntervalDays}
          saltUsageLbsPerMonth={metrics.saltUsageLbsPerMonth}
        />

        {/* Salt Calculator */}
        <SaltCalculator
          burnRateLbsPerMonth={saltCalculator.burnRateLbsPerMonth}
          daysUntilRefill={saltCalculator.daysUntilRefill}
          nextRefillDate={saltCalculator.nextRefillDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          monthlyBags40Lb={saltCalculator.monthlyBags40Lb}
          currentLevelPercent={saltLevelPercent}
        />

        {/* Service Menu */}
        {activeServices.length > 0 && (
          <SoftenerServiceMenu services={activeServices} />
        )}

        {/* Quick Actions */}
        <Button variant="outline" className="w-full gap-2">
          <RefreshCw className="h-4 w-4" />
          Log Regen
        </Button>
      </div>
      </div>

      {/* Fixed bottom CTA */}
      {(onServiceRequest && onEmergency && onMaintenanceTips) && (
        <SoftenerActionDock
          onServiceRequest={onServiceRequest}
          onEmergency={onEmergency}
          onMaintenanceTips={onMaintenanceTips}
          recommendation={recommendation}
          hasActiveServices={activeServices.length > 0}
        />
      )}
    </div>
  );
}
