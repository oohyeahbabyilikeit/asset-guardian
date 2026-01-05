import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { VitalsGrid } from '@/components/VitalsGrid';
import { ActionDock } from '@/components/ActionDock';
import { demoVitals, demoHealthScore, demoAsset } from '@/data/mockAsset';

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
    <div className="min-h-screen bg-background pb-40 relative">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="relative">
        <DashboardHeader />

        {/* Hero Health Gauge */}
        <div className="animate-fade-in-up">
          <HealthGauge healthScore={demoHealthScore} location={demoAsset.location} />
        </div>

        {/* Vitals Grid / Action List */}
        <div className="animate-fade-in-up mt-6" style={{ animationDelay: '0.2s' }}>
          <VitalsGrid vitals={demoVitals} />
        </div>

        {/* Action Dock */}
        <ActionDock
          onPanicMode={onPanicMode}
          onFixPressure={onServiceRequest}
          onViewReport={onViewReport}
        />
      </div>
    </div>
  );
}
