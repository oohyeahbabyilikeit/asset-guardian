import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { VitalsGrid } from '@/components/VitalsGrid';
import { ActionDock } from '@/components/ActionDock';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { RiskComparisonChart } from '@/components/RiskComparisonChart';
import { demoAsset, demoForensicInputs, type VitalsData, type HealthScore } from '@/data/mockAsset';
import { calculateOpterraRisk, failProbToHealthScore } from '@/lib/opterraAlgorithm';

interface CommandCenterProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  onViewReport: () => void;
  onTestHarness?: () => void;
}

// Derive status from thresholds
function getStatusFromValue(value: number, warningThreshold: number, criticalThreshold: number): 'optimal' | 'warning' | 'critical' {
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'optimal';
}

export function CommandCenter({ 
  onPanicMode, 
  onServiceRequest, 
  onViewReport,
  onTestHarness 
}: CommandCenterProps) {
  // Calculate all metrics using v4.0 algorithm
  const opterraResult = calculateOpterraRisk(demoForensicInputs);
  const { bioAge, failProb, sedimentLbs, estDamage } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;

  // Derive dynamic vitals from algorithm output
  const dynamicVitals: VitalsData = {
    pressure: {
      current: demoForensicInputs.psi,
      limit: 80,
      status: getStatusFromValue(demoForensicInputs.psi, 70, 80),
    },
    sedimentLoad: {
      pounds: sedimentLbs,
      gasLossEstimate: Math.round(sedimentLbs * 4.5),
      status: getStatusFromValue(sedimentLbs, 10, 15),
    },
    liabilityStatus: {
      insured: false,
      location: demoAsset.location,
      estDamage: estDamage,
      status: demoAsset.location === 'Attic' || demoAsset.location === 'Utility Closet' ? 'critical' : 'warning',
    },
    biologicalAge: {
      real: Math.round(bioAge * 10) / 10,
      paper: demoForensicInputs.calendarAge,
      status: getStatusFromValue(bioAge, 8, 12),
    },
  };

  // Derive dynamic health score from algorithm output
  const dynamicHealthScore: HealthScore = {
    score: failProbToHealthScore(failProb),
    status: getStatusFromValue(failProb, 10, 20),
    failureProbability: Math.round(failProb * 10) / 10,
    recommendation: recommendation.action,
  };

  return (
    <div className="min-h-screen bg-background pb-40 relative">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="relative">
        <DashboardHeader onTestHarness={onTestHarness} />

        {/* Hero Health Gauge */}
        <div className="animate-fade-in-up">
          <HealthGauge healthScore={dynamicHealthScore} location={demoAsset.location} />
        </div>

        {/* Recommendation Banner */}
        <div className="animate-fade-in-up mt-4" style={{ animationDelay: '0.1s' }}>
          <RecommendationBanner recommendation={recommendation} />
        </div>

        {/* Age Comparison Chart */}
        <div className="animate-fade-in-up mt-4" style={{ animationDelay: '0.15s' }}>
          <RiskComparisonChart biologicalAge={bioAge} calendarAge={demoForensicInputs.calendarAge} />
        </div>

        {/* Vitals Grid / Action List */}
        <div className="animate-fade-in-up mt-6" style={{ animationDelay: '0.2s' }}>
          <VitalsGrid vitals={dynamicVitals} />
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
