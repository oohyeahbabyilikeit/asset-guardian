import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { VitalsGrid } from '@/components/VitalsGrid';
import { ActionDock } from '@/components/ActionDock';
import { demoVitals, demoHealthScore } from '@/data/mockAsset';

interface CommandCenterProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  onViewReport: () => void;
}

export function CommandCenter({ 
  onPanicMode, 
  onServiceRequest, 
  onViewReport 
}: CommandCenterProps) {
  return (
    <div className="min-h-screen bg-background pb-40">
      <DashboardHeader />

      {/* Hero Health Gauge */}
      <div className="animate-fade-in-up">
        <HealthGauge healthScore={demoHealthScore} />
      </div>

      {/* Vitals Grid */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="px-4 mb-3">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
            The Vitals Grid
          </h3>
        </div>
        <VitalsGrid vitals={demoVitals} />
      </div>

      {/* Action Dock */}
      <ActionDock
        onPanicMode={onPanicMode}
        onFixPressure={onServiceRequest}
        onViewReport={onViewReport}
      />
    </div>
  );
}
