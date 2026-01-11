import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { motion, useMotionValue, animate, MotionValue } from 'framer-motion';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { ServiceHistory } from '@/components/ServiceHistory';
import { ActionDock } from '@/components/ActionDock';
import { MaintenancePlan } from '@/components/MaintenancePlan';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { UnitProfileCard } from '@/components/UnitProfileCard';
import { IndustryBenchmarks } from '@/components/IndustryBenchmarks';
import { HardWaterTaxCard } from '@/components/HardWaterTaxCard';
import { calculateOpterraRisk, ForensicInputs } from '@/lib/opterraAlgorithm';
import { AssetNavigation } from '@/components/AssetNavigation';
import { TanklessDiagram } from '@/components/TanklessDiagram';
import { VitalsGrid } from '@/components/VitalsGrid';
import { SoftenerCenter } from '@/components/SoftenerCenter';
import { HealthScore, AssetData } from '@/data/mockAsset';
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns';

// Elegant easing curve for sophisticated feel - must be tuple for framer-motion
const elegantEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Timeline configuration - single source of truth for all animation timing
const TIMELINE = {
  TOTAL_DURATION: 5.5, // seconds
  // Normalized times (0-1) for each section reveal
  PROFILE: 0.05,
  HEALTH: 0.18,
  HISTORY: 0.36,
  BENCHMARKS: 0.54,
  HARDWATER: 0.72,
  DOCK: 0.85,
  END: 1.0,
};

// Slow, deliberate stagger synced with scroll timeline
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      // Stagger matches the scroll timeline intervals
      staggerChildren: TIMELINE.TOTAL_DURATION * (TIMELINE.HEALTH - TIMELINE.PROFILE),
      delayChildren: TIMELINE.TOTAL_DURATION * TIMELINE.PROFILE,
    }
  }
};

// Individual animation variants with slower, more elegant timing
const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: elegantEase }
  }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: elegantEase }
  }
};

const popIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: elegantEase }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: elegantEase }
  }
};

const slideUpBounce = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring" as const,
      stiffness: 80,
      damping: 12
    }
  }
};

// Helper to map old topic strings to new EducationalTopic type
function mapToEducationalTopic(topic: string): EducationalTopic {
  const topicMap: Record<string, EducationalTopic> = {
    'pressure': 'pressure',
    'sediment': 'sediment',
    'anode-rod': 'anode-rod',
    'thermal-expansion': 'thermal-expansion',
    'hardness': 'hardness',
    'aging': 'aging',
    'prv': 'prv',
    'failure-rate': 'failure-rate',
    'thermal': 'thermal',
    'temperature': 'temperature',
  };
  return topicMap[topic] || 'pressure';
}

// Convert fail probability to health score (inverse relationship)
function failProbToHealthScore(failProb: number): number {
  const raw = Math.max(0, Math.min(100, 100 - failProb));
  return Math.round(raw);
}

function getStatusFromValue(value: number, thresholdModerate: number, thresholdCritical: number): 'optimal' | 'warning' | 'critical' {
  if (value >= thresholdCritical) return 'critical';
  if (value >= thresholdModerate) return 'warning';
  return 'optimal';
}

interface CommandCenterProps {
  currentAsset: AssetData;
  currentInputs: ForensicInputs;
  onTestHarness?: () => void;
  onRandomize?: () => void;
  onPanicMode?: () => void;
  onServiceRequest?: () => void;
  onMaintenancePlan?: () => void;
  onViewReport?: () => void;
  onInputsChange?: (inputs: ForensicInputs) => void;
  onSwitchAsset?: (asset: 'water-heater' | 'softener') => void;
  scenarioName?: string;
  serviceHistory?: any[];
  hasSoftener?: boolean;
  waterHeaterStatus?: 'optimal' | 'warning' | 'critical';
  softenerStatus?: 'optimal' | 'warning' | 'critical';
}

export function CommandCenter({
  currentAsset,
  currentInputs,
  onTestHarness,
  onRandomize,
  onPanicMode,
  onServiceRequest,
  onMaintenancePlan,
  onViewReport,
  onInputsChange,
  onSwitchAsset,
  scenarioName,
  serviceHistory: propServiceHistory,
  hasSoftener = false,
  waterHeaterStatus = 'optimal',
  softenerStatus,
}: CommandCenterProps) {
  const [educationalTopic, setEducationalTopic] = useState<EducationalTopic | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Single container ref for smooth scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for each section
  const profileRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const benchmarksRef = useRef<HTMLDivElement>(null);
  const hardWaterRef = useRef<HTMLDivElement>(null);
  const actionDockRef = useRef<HTMLDivElement>(null);

  // Motion value for continuous scroll animation
  const scrollY = useMotionValue(0);
  
  // Sync scrollY motion value to container scrollTop
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const unsubscribe = scrollY.on('change', (latest) => {
      container.scrollTop = latest;
    });
    
    return unsubscribe;
  }, [scrollY]);

  // Block user scroll during animation
  useEffect(() => {
    if (!isAnimating) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const preventScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Use non-passive listeners to allow preventDefault
    container.addEventListener('wheel', preventScroll, { passive: false });
    container.addEventListener('touchmove', preventScroll, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', preventScroll);
      container.removeEventListener('touchmove', preventScroll);
    };
  }, [isAnimating]);

  // Calculate all metrics using v6.0 algorithm (needed for conditional rendering check)
  const opterraResult = calculateOpterraRisk(currentInputs);
  const { metrics, verdict, financial, hardWaterTax } = opterraResult;
  const hasHardWaterCard = hardWaterTax.recommendation !== 'NONE';

  // Orchestrated continuous scroll animation - single keyframed timeline
  useLayoutEffect(() => {
    if (!isAnimating) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Wait for layout to settle before measuring
    const measureAndAnimate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const getOffset = (ref: React.RefObject<HTMLDivElement>) => {
            if (!ref.current || !container) return 0;
            const containerRect = container.getBoundingClientRect();
            const elementRect = ref.current.getBoundingClientRect();
            const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
            // Position element in upper third of viewport
            const targetOffset = containerRect.height * 0.15;
            return Math.max(0, relativeTop - targetOffset);
          };
          
          // Measure all section positions
          const positions = {
            start: 0,
            profile: getOffset(profileRef),
            health: getOffset(healthRef),
            history: getOffset(historyRef),
            benchmarks: getOffset(benchmarksRef),
            hardWater: hasHardWaterCard ? getOffset(hardWaterRef) : null,
            dock: getOffset(actionDockRef),
            end: container.scrollHeight - container.clientHeight,
          };
          
          // Build keyframes and times based on which sections exist
          const keyframes: number[] = [0]; // Start at top
          const times: number[] = [0];
          
          // Profile
          keyframes.push(positions.profile);
          times.push(TIMELINE.PROFILE);
          
          // Health
          keyframes.push(positions.health);
          times.push(TIMELINE.HEALTH);
          
          // History
          keyframes.push(positions.history);
          times.push(TIMELINE.HISTORY);
          
          // Benchmarks
          keyframes.push(positions.benchmarks);
          times.push(TIMELINE.BENCHMARKS);
          
          // HardWater (conditional)
          if (hasHardWaterCard && positions.hardWater !== null) {
            keyframes.push(positions.hardWater);
            times.push(TIMELINE.HARDWATER);
          }
          
          // Dock
          keyframes.push(positions.dock);
          times.push(TIMELINE.DOCK);
          
          // End (hold at dock)
          keyframes.push(positions.dock);
          times.push(TIMELINE.END);
          
          // Animate scrollY through keyframes
          const controls = animate(scrollY, keyframes, {
            duration: TIMELINE.TOTAL_DURATION,
            times,
            ease: 'easeInOut',
            onComplete: () => {
              setIsAnimating(false);
            },
          });
          
          // Return cleanup for controls
          return () => controls.stop();
        });
      });
    };
    
    // Small delay to ensure initial render is complete
    const startTimeout = setTimeout(measureAndAnimate, 100);
    
    return () => {
      clearTimeout(startTimeout);
    };
  }, [isAnimating, scrollY, hasHardWaterCard]);
  
  // Extract metrics for easier access
  const {
    failProb,
    bioAge,
    agingRate,
    shieldLife,
    sedimentLbs,
    sedimentRate,
    flushStatus,
    monthsToFlush,
    monthsToLockout,
    riskLevel,
    descaleStatus,
    flowDegradation,
    scaleBuildupScore,
  } = metrics;
  
  const recommendation = verdict;
  const serviceHistory = propServiceHistory || [];

  // Check if this is a tankless unit
  const isTanklessUnit = currentInputs.fuelType === 'TANKLESS_GAS' || currentInputs.fuelType === 'TANKLESS_ELECTRIC';

  // Derive dynamic health score from algorithm output
  const isBreach = currentInputs.isLeaking || currentInputs.visualRust;
  const dynamicHealthScore: HealthScore = {
    score: failProbToHealthScore(failProb),
    status: getStatusFromValue(failProb, 10, 20),
    failureProbability: isBreach ? 'FAIL' : Math.min(85, Math.round(failProb * 10) / 10),
    recommendation: recommendation.action,
  };

  // Build dynamic vitals for display
  const dynamicVitals = {
    biologicalAge: {
      real: bioAge,
      paper: currentInputs.calendarAge,
      agingRate,
      lifeExtension: 0,
      primaryStressor: metrics.primaryStressor || 'Normal wear',
      status: getStatusFromValue(bioAge, 8, 12),
    },
  };

  const handleLearnMore = (topic: string) => {
    setEducationalTopic(mapToEducationalTopic(topic));
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="min-h-screen bg-background pb-40 relative"
      style={{ 
        overflowY: isAnimating ? 'hidden' : 'auto',
        height: '100vh',
      }}
    >
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
          <motion.div ref={profileRef} variants={popIn} className="px-4 pt-4">
            <UnitProfileCard asset={currentAsset} inputs={currentInputs} />
          </motion.div>

          {/* DISCOVERY PHASE 1b: Health Gauge slides in from left */}
          <motion.div ref={healthRef} variants={slideInLeft} className="px-4">
            <HealthGauge 
              healthScore={dynamicHealthScore} 
              location={currentAsset.location} 
              riskLevel={riskLevel}
              primaryStressor={dynamicVitals.biologicalAge.primaryStressor}
              estDamageCost={financial.estReplacementCost}
              metrics={metrics}
              recommendation={recommendation}
              isLeaking={currentInputs.isLeaking}
              visualRust={currentInputs.visualRust}
              fuelType={currentInputs.fuelType}
            />
          </motion.div>

          {/* DISCOVERY PHASE 2: Tank Visualization slides in from right */}
          <motion.div ref={historyRef} variants={slideInRight}>
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
          <motion.div ref={benchmarksRef} variants={fadeUp} className="px-4">
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
            <motion.div ref={hardWaterRef} variants={slideUpBounce} className="px-4">
              <HardWaterTaxCard hardWaterTax={hardWaterTax} />
            </motion.div>
          )}
        </motion.div>

        {/* Action Dock - slides up from bottom synced with scroll timeline */}
        <motion.div
          ref={actionDockRef}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: TIMELINE.TOTAL_DURATION * TIMELINE.DOCK, 
            duration: 0.6, 
            ease: elegantEase 
          }}
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
