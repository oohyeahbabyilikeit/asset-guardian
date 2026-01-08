import { useState } from 'react';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { ActionDock } from '@/components/ActionDock';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { ServiceHistory } from '@/components/ServiceHistory';
import { UnitProfileCard } from '@/components/UnitProfileCard';
import { IndustryBenchmarks } from '@/components/IndustryBenchmarks';
import { EducationalDrawer, type EducationalTopic } from '@/components/EducationalDrawer';
import { type VitalsData, type HealthScore, type AssetData } from '@/data/mockAsset';
import { calculateOpterraRisk, failProbToHealthScore, type ForensicInputs } from '@/lib/opterraAlgorithm';

interface CommandCenterProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  onViewReport: () => void;
  onTestHarness?: () => void;
  currentAsset: AssetData;
  currentInputs: ForensicInputs;
  onInputsChange: (inputs: ForensicInputs) => void;
  onRandomize: () => void;
  scenarioName: string;
}

// Derive status from thresholds
function getStatusFromValue(value: number, warningThreshold: number, criticalThreshold: number): 'optimal' | 'warning' | 'critical' {
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'optimal';
}

// Map string topics to valid EducationalTopic
function mapToEducationalTopic(topic: string): EducationalTopic {
  const mapping: Record<string, EducationalTopic> = {
    'pressure': 'pressure',
    'hardness': 'hardness',
    'thermal': 'thermal-expansion',
    'temperature': 'temperature',
    'aging': 'aging',
    'sediment': 'sediment',
    'prv': 'prv',
    'anode-rod': 'anode-rod',
    'failure-rate': 'failure-rate',
  };
  return mapping[topic] || 'pressure';
}

export function CommandCenter({ 
  onPanicMode, 
  onServiceRequest, 
  onViewReport,
  onTestHarness,
  currentAsset,
  currentInputs,
  onInputsChange,
  onRandomize,
  scenarioName
}: CommandCenterProps) {
  const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | null>(null);

  // Calculate all metrics using v6.0 algorithm
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { bioAge, failProb, sedimentLbs, shieldLife, riskLevel, agingRate, lifeExtension, primaryStressor, sedimentRate, monthsToFlush, monthsToLockout, flushStatus } = opterraResult.metrics;
  const recommendation = opterraResult.verdict;
  const financial = opterraResult.financial;

  // Derive dynamic vitals from algorithm output
  // PRV implies closed loop (backpressure), so expansion tank is required if either condition is true
  const isActuallyClosed = currentInputs.isClosedLoop || currentInputs.hasPrv;
  const expansionTankRequired = isActuallyClosed;
  const expansionTankMissing = expansionTankRequired && !currentInputs.hasExpTank;
  
  // PRV status calculation - recommend at 70+ PSI (cuts strain ~50% when reduced to 60)
  const prvRequired = currentInputs.housePsi >= 70;
  const prvFunctional = currentInputs.hasPrv && currentInputs.housePsi <= 75; // Working if pressure is controlled
  const prvStatus: 'critical' | 'warning' | 'optimal' = 
    !prvRequired && !currentInputs.hasPrv ? 'optimal' : // Not needed, not installed
    currentInputs.hasPrv && prvFunctional ? 'optimal' : // Installed and working
    currentInputs.hasPrv && !prvFunctional ? 'warning' : // Installed but failed (high pressure)
    'critical'; // Needed but not installed
  
  const dynamicVitals: VitalsData = {
    pressure: {
      current: currentInputs.housePsi,
      limit: 80,
      status: getStatusFromValue(currentInputs.housePsi, 70, 80),
    },
    sedimentLoad: {
      pounds: sedimentLbs,
      gasLossEstimate: Math.round(sedimentLbs * 4.5),
      status: getStatusFromValue(sedimentLbs, 10, 15),
    },
    liabilityStatus: {
      insured: false,
      location: currentAsset.location,
      riskLevel: riskLevel,
      status: riskLevel >= 3 ? 'critical' : riskLevel === 2 ? 'warning' : 'optimal',
    },
    biologicalAge: {
      real: bioAge >= 20 ? '20+' : Math.round(bioAge * 10) / 10,
      paper: currentInputs.calendarAge,
      agingRate: agingRate,
      lifeExtension: lifeExtension,
      primaryStressor: primaryStressor,
      status: getStatusFromValue(bioAge, 8, 12),
    },
    expansionTank: {
      present: currentInputs.hasExpTank,
      required: expansionTankRequired,
      status: expansionTankMissing ? 'critical' : 'optimal',
    },
    prv: {
      present: currentInputs.hasPrv,
      required: prvRequired,
      functional: prvFunctional,
      status: prvStatus,
    },
  };

  // Derive dynamic health score from algorithm output
  // Show "FAIL" for active leaks/breaches, otherwise cap at 85%
  const isBreach = currentInputs.isLeaking || currentInputs.visualRust;
  const dynamicHealthScore: HealthScore = {
    score: failProbToHealthScore(failProb),
    status: getStatusFromValue(failProb, 10, 20),
    failureProbability: isBreach ? 'FAIL' : Math.min(85, Math.round(failProb * 10) / 10),
    recommendation: recommendation.action,
  };

  const handleLearnMore = (topic: string) => {
    setEducationalTopic(mapToEducationalTopic(topic));
  };

  return (
    <div className="min-h-screen bg-background pb-40 relative">
      {/* Tech grid background */}
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <div className="relative">
        <DashboardHeader onTestHarness={onTestHarness} onRandomize={onRandomize} scenarioName={scenarioName} />

        {/* DISCOVERY PHASE 1: Your Unit Profile + System Diagnostics */}
        <div className="px-4 animate-fade-in-up space-y-3">
          <UnitProfileCard asset={currentAsset} inputs={currentInputs} />
          <HealthGauge 
            healthScore={dynamicHealthScore} 
            location={currentAsset.location} 
            riskLevel={riskLevel}
            primaryStressor={dynamicVitals.biologicalAge.primaryStressor}
            estDamageCost={financial.estReplacementCost}
          />
        </div>

        {/* DISCOVERY PHASE 2: Tank Visualization */}
        <div className="animate-fade-in-up mt-3" style={{ animationDelay: '0.05s' }}>
          <ServiceHistory 
            calendarAge={currentInputs.calendarAge}
            sedimentLbs={sedimentLbs}
            shieldLife={shieldLife}
            hasSoftener={currentInputs.hasSoftener}
            tankCapacityGallons={parseInt(currentAsset.specs.capacity) || 50}
            failProb={failProb}
            sedimentRate={sedimentRate}
            monthsToFlush={monthsToFlush}
            monthsToLockout={monthsToLockout}
            flushStatus={flushStatus}
            autoExpand={dynamicHealthScore.score < 50}
          />
        </div>

        {/* DISCOVERY PHASE 3: How Water Heaters Age */}
        <div className="px-4 animate-fade-in-up mt-3" style={{ animationDelay: '0.1s' }}>
          <IndustryBenchmarks 
            asset={currentAsset} 
            inputs={currentInputs}
            onLearnMore={handleLearnMore}
            agingRate={agingRate}
            bioAge={bioAge}
          />
        </div>

        {/* ACTION PHASE: What Homeowners Consider */}
        <div className="animate-fade-in-up mt-3" style={{ animationDelay: '0.2s' }}>
          <RecommendationBanner 
            recommendation={recommendation} 
            agingRate={agingRate}
            lifeExtension={lifeExtension}
            primaryStressor={primaryStressor}
            financial={financial}
          />
        </div>

        {/* Action Dock */}
        <ActionDock
          onPanicMode={onPanicMode}
          onFixPressure={onServiceRequest}
          onViewReport={onViewReport}
          recommendation={recommendation}
        />
      </div>

      {/* Educational Drawer */}
      <EducationalDrawer 
        isOpen={!!educationalTopic}
        onClose={() => setEducationalTopic(null)}
        topic={educationalTopic || 'pressure'}
      />
    </div>
  );
}
