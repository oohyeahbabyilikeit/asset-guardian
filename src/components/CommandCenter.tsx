import { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { ActionDock } from '@/components/ActionDock';
import { RecommendationBanner } from '@/components/RecommendationBanner';
import { ServiceHistory } from '@/components/ServiceHistory';
import { UnitProfileCard } from '@/components/UnitProfileCard';
import { IndustryBenchmarks } from '@/components/IndustryBenchmarks';
import { HardWaterTaxCard } from '@/components/HardWaterTaxCard';
import { EducationalDrawer, type EducationalTopic } from '@/components/EducationalDrawer';
import { type VitalsData, type HealthScore, type AssetData } from '@/data/mockAsset';
import { calculateOpterraRisk, failProbToHealthScore, type ForensicInputs } from '@/lib/opterraAlgorithm';
import { ServiceEvent } from '@/types/serviceHistory';

// Elegant easing curve for smooth, deliberate motion
const elegantEase = [0.22, 1, 0.36, 1] as const;

// Slow, deliberate stagger for "walking through the report" feel
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.9,
      delayChildren: 0.3,
    },
  },
} as const;

const slideInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: elegantEase }
  },
} as const;

const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: elegantEase }
  },
} as const;

const popIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: elegantEase }
  },
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: elegantEase }
  },
} as const;

const slideUpBounce = {
  hidden: { opacity: 0, y: 35 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 80,
      damping: 12
    }
  },
} as const;
interface CommandCenterProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  onViewReport: () => void;
  onTestHarness?: () => void;
  onMaintenancePlan?: () => void;
  currentAsset: AssetData;
  currentInputs: ForensicInputs;
  onInputsChange: (inputs: ForensicInputs) => void;
  onRandomize?: () => void;
  scenarioName?: string;
  serviceHistory?: ServiceEvent[];
  hasSoftener?: boolean;
  onSwitchAsset?: (asset: 'water-heater' | 'softener') => void;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
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
  onMaintenancePlan,
  currentAsset,
  currentInputs,
  onInputsChange,
  onRandomize,
  scenarioName,
  serviceHistory = [],
  hasSoftener,
  onSwitchAsset,
  waterHeaterStatus,
  softenerStatus,
}: CommandCenterProps) {
  const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | null>(null);

  // Calculate all metrics using v6.0 algorithm
  const opterraResult = calculateOpterraRisk(currentInputs);
  const opterraMetrics = opterraResult.metrics;
  const { bioAge, failProb, sedimentLbs, shieldLife, riskLevel, agingRate, lifeExtension, primaryStressor, sedimentRate, monthsToFlush, monthsToLockout, flushStatus, scaleBuildupScore, flowDegradation, descaleStatus } = opterraMetrics;
  const recommendation = opterraResult.verdict;
  const financial = opterraResult.financial;
  const hardWaterTax = opterraResult.hardWaterTax;
  
  // Check if tankless unit
  const isTanklessUnit = currentInputs.fuelType === 'TANKLESS_GAS' || currentInputs.fuelType === 'TANKLESS_ELECTRIC';

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
  
  // Usage impact status - warn if usage intensity > 1.5 or undersizing > 1.2
  const usageIntensity = opterraMetrics.stressFactors.usageIntensity;
  const undersizing = opterraMetrics.stressFactors.undersizing;
  const usageStatus: 'critical' | 'warning' | 'optimal' = 
    undersizing > 1.3 || usageIntensity > 2.5 ? 'critical' :
    undersizing > 1.1 || usageIntensity > 1.5 ? 'warning' : 
    'optimal';

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
    usageImpact: {
      usageIntensity: usageIntensity,
      undersizing: undersizing,
      peopleCount: currentInputs.peopleCount,
      usageType: currentInputs.usageType,
      tankCapacity: currentInputs.tankCapacity,
      status: usageStatus,
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
        <DashboardHeader 
          onTestHarness={onTestHarness} 
          onRandomize={onRandomize} 
          scenarioName={scenarioName}
          activeAsset="water-heater"
          onSwitchAsset={onSwitchAsset}
          waterHeaterStatus={waterHeaterStatus}
          softenerStatus={softenerStatus}
          hasSoftener={hasSoftener}
        />

        {/* Animated Dashboard Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {/* DISCOVERY PHASE 1: Your Unit Profile */}
          <motion.div variants={popIn} className="px-4 pt-4">
            <UnitProfileCard asset={currentAsset} inputs={currentInputs} />
          </motion.div>

          {/* DISCOVERY PHASE 1b: Health Gauge slides in from left */}
          <motion.div variants={slideInLeft} className="px-4">
            <HealthGauge 
              healthScore={dynamicHealthScore} 
              location={currentAsset.location} 
              riskLevel={riskLevel}
              primaryStressor={dynamicVitals.biologicalAge.primaryStressor}
              estDamageCost={financial.estReplacementCost}
              metrics={opterraMetrics}
              recommendation={recommendation}
              isLeaking={currentInputs.isLeaking}
              visualRust={currentInputs.visualRust}
              fuelType={currentInputs.fuelType}
            />
          </motion.div>

          {/* DISCOVERY PHASE 2: Tank Visualization slides in from right */}
          <motion.div variants={slideInRight}>
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
              recommendation={recommendation}
              serviceHistory={serviceHistory}
              isLeaking={currentInputs.isLeaking}
              visualRust={currentInputs.visualRust}
              fuelType={currentInputs.fuelType}
              airFilterStatus={currentInputs.airFilterStatus}
              isCondensateClear={currentInputs.isCondensateClear}
              compressorHealth={currentInputs.compressorHealth || 85}
              hasExpansionTank={currentInputs.hasExpTank}
              hasPRV={currentInputs.hasPrv}
              // Tankless-specific props
              flowRateGPM={currentInputs.flowRateGPM}
              ratedFlowGPM={currentInputs.ratedFlowGPM}
              scaleBuildup={scaleBuildupScore}
              igniterHealth={currentInputs.igniterHealth}
              elementHealth={currentInputs.elementHealth}
              inletFilterStatus={currentInputs.inletFilterStatus}
              flameRodStatus={currentInputs.flameRodStatus}
              tanklessVentStatus={currentInputs.tanklessVentStatus}
              errorCodeCount={currentInputs.errorCodeCount}
              hasIsolationValves={currentInputs.hasIsolationValves}
              descaleStatus={descaleStatus}
              flowDegradation={flowDegradation}
            />
          </motion.div>

          {/* DISCOVERY PHASE 3: How Water Heaters Age - fades up */}
          <motion.div variants={fadeUp} className="px-4">
            <IndustryBenchmarks 
              asset={currentAsset} 
              inputs={currentInputs}
              onLearnMore={handleLearnMore}
              agingRate={agingRate}
              bioAge={bioAge}
              recommendation={recommendation}
            />
          </motion.div>

          {/* Hard Water Tax Card - bounces up if shown */}
          {hardWaterTax.recommendation !== 'NONE' && (
            <motion.div variants={slideUpBounce} className="px-4">
              <HardWaterTaxCard hardWaterTax={hardWaterTax} />
            </motion.div>
          )}
        </motion.div>

        {/* Action Dock - slides up from bottom after all content */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ActionDock
            onPanicMode={onPanicMode}
            onServiceRequest={onServiceRequest}
            onMaintenancePlan={onMaintenancePlan}
            recommendation={recommendation}
            fuelType={currentInputs.fuelType}
            // Tank-specific
            monthsToFlush={monthsToFlush}
            flushStatus={flushStatus}
            // Tankless-specific
            monthsToDescale={isTanklessUnit ? (descaleStatus === 'due' || descaleStatus === 'critical' ? 0 : 12) : undefined}
            descaleStatus={descaleStatus === 'impossible' ? 'lockout' : descaleStatus === 'lockout' ? 'lockout' : (descaleStatus as 'optimal' | 'schedule' | 'due' | 'lockout' | undefined)}
            // Hybrid-specific
            airFilterStatus={currentInputs.airFilterStatus}
          />
        </motion.div>
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
