import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { VitalsGrid } from '@/components/VitalsGrid';
import { ActionDock } from '@/components/ActionDock';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { demoVitals, demoHealthScore, demoAsset, demoForensicInputs } from '@/data/mockAsset';
import { calculateOpterraRisk } from '@/lib/opterraAlgorithm';

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
  // Calculate recommendation using v4.0 algorithm
  const opterraResult = calculateOpterraRisk(demoForensicInputs);
  const recommendation = opterraResult.verdict;

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

        {/* Recommendation Banner */}
        <div className="animate-fade-in-up mt-4" style={{ animationDelay: '0.1s' }}>
          <RecommendationBanner recommendation={recommendation} />
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
          recommendation={recommendation}
        />
      </div>
    </div>
  );
}
