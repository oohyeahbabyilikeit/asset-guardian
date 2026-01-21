import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { DashboardHeader } from '@/components/DashboardHeader';
import { HealthGauge } from '@/components/HealthGauge';
import { ServiceHistory } from '@/components/ServiceHistory';
import { ActionDock } from '@/components/ActionDock';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { IssueGuidanceDrawer } from '@/components/IssueGuidanceDrawer';
import { OptionsAssessmentDrawer } from '@/components/OptionsAssessmentDrawer';
import { ServiceSelectionDrawer } from '@/components/ServiceSelectionDrawer';
import { PlumberContactForm } from '@/components/PlumberContactForm';
import { UnifiedStatusCard } from '@/components/UnifiedStatusCard';
import { HardWaterTaxCard } from '@/components/HardWaterTaxCard';
import { BreachAlert } from '@/components/BreachAlert';
import { calculateOpterraRisk, ForensicInputs, OpterraResult } from '@/lib/opterraAlgorithm';
import { HealthScore, AssetData } from '@/data/mockAsset';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { getInfrastructureIssues, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { type MaintenanceTask } from '@/lib/maintenanceCalculations';

// Elegant easing curve for sophisticated feel - must be tuple for framer-motion
const elegantEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Timeline configuration - single source of truth for all animation timing
const TIMELINE = {
  TOTAL_DURATION: 5.1, // seconds
  // Normalized times (0-1) for each section reveal
  PROFILE: 0.08,
  HEALTH: 0.24,
  HISTORY: 0.44,
  BENCHMARKS: 0.64,
  HARDWATER: 0.82,
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

// Note: Use metrics.healthScore directly from the algorithm instead of recalculating

function getStatusFromValue(value: number, thresholdModerate: number, thresholdCritical: number): 'optimal' | 'warning' | 'critical' {
  if (value >= thresholdCritical) return 'critical';
  if (value >= thresholdModerate) return 'warning';
  return 'optimal';
}

interface CommandCenterProps {
  currentAsset: AssetData;
  currentInputs: ForensicInputs;
  opterraResult?: OpterraResult; // Accept pre-calculated result for continuity
  onTestHarness?: () => void;
  onRandomize?: () => void;
  onPanicMode?: () => void;
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
  opterraResult: externalResult,
  onTestHarness,
  onRandomize,
  onPanicMode,
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
  const [selectedIssue, setSelectedIssue] = useState<InfrastructureIssue | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  
  // Lead capture flow state
  const [showAssessment, setShowAssessment] = useState(false);
  const [showServiceSelection, setShowServiceSelection] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<MaintenanceTask[]>([]);
  
  // Single container ref for smooth scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Refs for each section
  const profileRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  
  const hardWaterRef = useRef<HTMLDivElement>(null);
  
  // Guard to ensure dock only reveals once per animation cycle
  const dockRevealedRef = useRef(false);
  
  // Track if we've triggered the reversal
  const reversalTriggeredRef = useRef(false);

  // Motion value for continuous scroll animation
  const scrollY = useMotionValue(0);
  
  // Dock animation - imperative motion values (not scroll-dependent)
  const actionDockOpacity = useMotionValue(0);
  const actionDockY = useMotionValue(40);
  
  // Sync scrollY motion value to container scrollTop using rAF for smooth updates
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let rafId: number;
    const unsubscribe = scrollY.on('change', (latest) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        container.scrollTop = latest;
      });
    });
    
    return () => {
      cancelAnimationFrame(rafId);
      unsubscribe();
    };
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

  // Use pre-calculated result if provided, otherwise calculate (single source of truth)
  const opterraResult = externalResult ?? calculateOpterraRisk(currentInputs);
  const { metrics, verdict, financial, hardWaterTax } = opterraResult;
  const hasHardWaterCard = hardWaterTax.recommendation !== 'NONE';

  // Orchestrated continuous scroll animation - single keyframed timeline
  useLayoutEffect(() => {
    if (!isAnimating) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Reset dock state at animation start
    dockRevealedRef.current = false;
    actionDockOpacity.set(0);
    actionDockY.set(40);
    
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
            hardWater: hasHardWaterCard ? getOffset(hardWaterRef) : null,
            end: container.scrollHeight - container.clientHeight,
          };
          
          // Reset reversal trigger
          reversalTriggeredRef.current = false;
          
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
          
          // HardWater (conditional)
          if (hasHardWaterCard && positions.hardWater !== null) {
            keyframes.push(positions.hardWater);
            times.push(TIMELINE.HARDWATER);
          }
          
          // End - scroll to bottom (no separate dock keyframe)
          keyframes.push(positions.end);
          times.push(TIMELINE.END);
          
          // Function to trigger reversal with a brief pause at bottom
          const triggerReversal = () => {
            if (reversalTriggeredRef.current) return;
            reversalTriggeredRef.current = true;
            
            // Brief pause at bottom so user can see we reached the end
            setTimeout(() => {
              // Scroll back to top at comfortable pace
              animate(scrollY, 0, {
                duration: 1.0,
                ease: elegantEase,
                onComplete: () => {
                  // Reveal dock after we're back at top
                  if (!dockRevealedRef.current) {
                    dockRevealedRef.current = true;
                    animate(actionDockOpacity, 1, { duration: 0.3, ease: elegantEase });
                    animate(actionDockY, 0, { duration: 0.3, ease: elegantEase });
                  }
                  setIsAnimating(false);
                },
              });
            }, 340); // brief pause at bottom
          };
          
          // Watch for when we reach the bottom
          const bottomThreshold = 5; // pixels from bottom
          const unsubscribeChange = scrollY.on('change', (latest) => {
            if (!reversalTriggeredRef.current && latest >= positions.end - bottomThreshold) {
              // Stop watching and trigger reversal immediately
              unsubscribeChange();
              triggerReversal();
            }
          });
          
          // Animate scrollY through keyframes
          const controls = animate(scrollY, keyframes, {
            duration: TIMELINE.TOTAL_DURATION,
            times,
            ease: 'easeInOut',
            onComplete: () => {
              // Fallback: if we somehow didn't trigger via threshold, do it now
              unsubscribeChange();
              triggerReversal();
            },
          });
          
          // Return cleanup for controls
          return () => {
            unsubscribeChange();
            controls.stop();
          };
        });
      });
    };
    
    // Small delay to ensure initial render is complete
    const startTimeout = setTimeout(measureAndAnimate, 100);
    
    return () => {
      clearTimeout(startTimeout);
    };
  }, [isAnimating, scrollY, actionDockOpacity, actionDockY, hasHardWaterCard]);
  
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

  // v8.4: Physics determines verdict, budget affects messaging only
  // Removed budgetUrgency override - a customer's bank balance does not change the laws of physics
  let recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR' = 'MONITOR';
  if (verdict.action === 'REPLACE') {
    // Urgency (from algorithm) determines adjective, not verb
    recommendationType = verdict.urgent ? 'REPLACE_NOW' : 'REPLACE_SOON';
  } else if (verdict.action === 'REPAIR' || verdict.action === 'MAINTAIN') {
    recommendationType = 'MAINTAIN';
  } else if (verdict.action === 'UPGRADE') {
    recommendationType = 'MONITOR';  // Upgrades are optional optimizations
  }
  // PASS and MONITOR actions stay as MONITOR

  // Derive dynamic health score from algorithm output
  const isBreach = currentInputs.isLeaking || currentInputs.visualRust;
  const dynamicHealthScore: HealthScore = {
    score: metrics.healthScore,
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

  const handleIssueLearnMore = (issue: InfrastructureIssue) => {
    setSelectedIssue(issue);
  };

  // Lead capture handlers
  const handleGetExpertHelp = () => {
    setShowAssessment(true);
  };

  const handleAssessmentContinue = () => {
    setShowAssessment(false);
    setShowServiceSelection(true);
  };

  const handleServiceSelectionSubmit = (tasks: MaintenanceTask[]) => {
    setSelectedTasks(tasks);
    setShowServiceSelection(false);
    setShowContactForm(true);
  };

  const handleContactFormSubmit = () => {
    setShowContactForm(false);
    setSelectedTasks([]);
  };

  // Get maintenance tasks for service selection
  const infrastructureIssues = getInfrastructureIssues(currentInputs, metrics);
  
  // Only actual code violations get the violation treatment
  const violationIssues = getIssuesByCategory(infrastructureIssues, 'VIOLATION');
  const violationTasks: MaintenanceTask[] = violationIssues.map(issue => ({
    type: issue.id.includes('exp_tank') ? 'exp_tank_install' : issue.id.includes('prv') ? 'prv_install' : 'inspection',
    label: issue.name,
    description: issue.description,
    monthsUntilDue: 0,
    urgency: 'overdue' as const,
    benefit: issue.friendlyName,
    whyExplanation: issue.description,
    icon: 'alert' as const,
    isInfrastructure: true,
  }));

  // Infrastructure & optimization items (like softeners for hard water) become regular recommendations
  const recommendationIssues = [
    ...getIssuesByCategory(infrastructureIssues, 'INFRASTRUCTURE'),
    ...getIssuesByCategory(infrastructureIssues, 'OPTIMIZATION'),
  ];
  const recommendationTasks: MaintenanceTask[] = recommendationIssues.map(issue => ({
    type: 'inspection' as MaintenanceTask['type'],
    label: issue.name,
    description: issue.description,
    monthsUntilDue: 0,
    urgency: 'schedule' as const,
    benefit: issue.friendlyName,
    whyExplanation: issue.description,
    icon: 'wrench' as const,
    isInfrastructure: true,
  }));

  // Simple maintenance tasks based on unit type
  const mapFlushStatus = (status: typeof flushStatus): MaintenanceTask['urgency'] => {
    if (status === 'lockout') return 'overdue';
    if (status === 'due') return 'due';
    if (status === 'schedule') return 'schedule';
    return 'optimal';
  };

  // Determine if algorithm returned a PASS verdict (monitor only, no maintenance recommended)
  const isPassVerdict = verdict.action === 'PASS';
  const isHealthyPass = isPassVerdict && verdict.title === 'No Issues Detected';
  
  // Only show active maintenance tasks when algorithm explicitly said MAINTAIN or REPAIR
  // PASS verdicts mean "don't touch" - maintenance could cause damage
  const shouldShowMaintenance = verdict.action === 'MAINTAIN' || verdict.action === 'REPAIR';
  const shouldShowReplacementOption = recommendationType === 'REPLACE_NOW' || recommendationType === 'REPLACE_SOON';
  
  // Calculate estimated remaining life for PASS verdicts
  const estimatedTotalLife = 13; // Average tank life based on Weibull analysis
  let yearsRemaining = Math.max(0, Math.round(estimatedTotalLife - metrics.bioAge));
  
  // INFRASTRUCTURE FIRST GATE: If algorithm says REPAIR on a young tank,
  // give them credit for the fix by using optimized remaining life
  const isYoungRepairCandidate = currentInputs.calendarAge < 8 && (verdict.action === 'REPAIR' || verdict.action === 'UPGRADE');
  if (isYoungRepairCandidate && metrics.yearsLeftOptimized > yearsRemaining) {
    yearsRemaining = Math.round(metrics.yearsLeftOptimized);
  }

  // When replacement is recommended, violations are bundled into the replacement job
  const shouldBundleViolations = shouldShowReplacementOption;
  const hasCodeIssues = violationIssues.length > 0;

  // Base maintenance tasks (only shown when maintenance is appropriate)
  const baseMaintenanceTasks: MaintenanceTask[] = isTanklessUnit 
    ? [
        { type: 'descale', label: 'Descale', description: 'Remove scale buildup', monthsUntilDue: 0, urgency: 'schedule' as const, benefit: 'Restore flow rate', whyExplanation: '', icon: 'droplets' as const },
        { type: 'filter_clean' as MaintenanceTask['type'], label: 'Filter Clean', description: 'Clean inlet filter', monthsUntilDue: 0, urgency: 'schedule' as const, benefit: 'Maintain flow', whyExplanation: '', icon: 'filter' as const },
      ]
    : [
        { type: 'flush', label: 'Tank Flush', description: 'Drain sediment', monthsUntilDue: monthsToFlush ?? 6, urgency: mapFlushStatus(flushStatus), benefit: 'Restore efficiency', whyExplanation: '', icon: 'droplets' as const },
        { type: 'anode', label: 'Anode Inspection', description: 'Check corrosion protection', monthsUntilDue: 12, urgency: 'schedule' as const, benefit: 'Extend tank life', whyExplanation: '', icon: 'shield' as const },
      ];

  // Replacement consultation task for units needing replacement
  // When there are code issues, mention they'll be addressed during replacement
  const replacementTask: MaintenanceTask = {
    type: 'replacement_consult',
    label: 'Replacement Consultation',
    description: hasCodeIssues 
      ? `Discuss replacement options – includes addressing ${violationIssues.length} code compliance ${violationIssues.length === 1 ? 'issue' : 'issues'}`
      : 'Discuss replacement options with a professional',
    monthsUntilDue: 0,
    urgency: recommendationType === 'REPLACE_NOW' ? 'overdue' : 'due',
    benefit: hasCodeIssues 
      ? 'Get expert guidance and resolve code issues in one visit'
      : 'Get expert guidance on your best options',
    whyExplanation: 'Your unit shows signs that indicate replacement should be considered.',
    icon: 'wrench' as const,
  };

  // Only pass violations as separate tasks when NOT replacing
  const displayViolations = shouldBundleViolations ? [] : violationTasks;

  // Build final maintenance tasks based on recommendation (no longer includes recommendations)
  const maintenanceTasks: MaintenanceTask[] = shouldShowReplacementOption
    ? [replacementTask]
    : shouldShowMaintenance
      ? baseMaintenanceTasks
      : [];

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
          {/* UNIFIED STATUS CARD: Identity + Health + Violations + Recommendation */}
          <motion.div ref={profileRef} variants={popIn} className="px-4 pt-4">
            <UnifiedStatusCard
              asset={currentAsset}
              inputs={currentInputs}
              healthScore={dynamicHealthScore}
              riskLevel={riskLevel}
              recommendation={recommendation}
              metrics={metrics}
              yearsRemaining={yearsRemaining}
              onIssueLearnMore={handleIssueLearnMore}
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
              recommendationType={recommendationType}
              serviceHistory={serviceHistory}
              isLeaking={currentInputs.isLeaking}
              visualRust={currentInputs.visualRust}
              fuelType={currentInputs.fuelType}
              airFilterStatus={currentInputs.airFilterStatus}
              isCondensateClear={currentInputs.isCondensateClear}
              compressorHealth={currentInputs.compressorHealth || 85}
              hasExpansionTank={currentInputs.hasExpTank}
              hasPRV={currentInputs.hasPrv}
              // Tankless-specific props (v8.0 SIMPLIFIED)
              inletFilterStatus={currentInputs.inletFilterStatus}
              tanklessVentStatus={currentInputs.tanklessVentStatus}
              errorCodeCount={currentInputs.errorCodeCount}
              hasIsolationValves={currentInputs.hasIsolationValves}
              descaleStatus={descaleStatus}
              healthScore={dynamicHealthScore.score}
            />
          </motion.div>


          {/* Hard Water Tax Card - bounces up if shown */}
          {hardWaterTax.recommendation !== 'NONE' && (
            <motion.div ref={hardWaterRef} variants={slideUpBounce} className="px-4">
              <HardWaterTaxCard hardWaterTax={hardWaterTax} />
            </motion.div>
          )}
        </motion.div>

        {/* Bottom spacer for scroll measurement */}
        <div className="h-1" aria-hidden="true" />
      </div>

      {/* Action Dock - fixed overlay with GPU-accelerated animation */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 will-change-transform"
        style={{ 
          opacity: actionDockOpacity,
          y: actionDockY,
          transform: 'translateZ(0)', // Force GPU layer
        }}
      >
        <ActionDock
          onPanicMode={onPanicMode}
          onServiceRequest={handleGetExpertHelp}
          position="static"
        />
      </motion.div>

      {/* Educational Drawer with personalized LLM content */}
      <EducationalDrawer 
        isOpen={!!educationalTopic}
        onClose={() => setEducationalTopic(null)}
        topic={educationalTopic || 'pressure'}
        context={{
          inputs: currentInputs,
          metrics: opterraResult.metrics,
        }}
      />

      {/* Issue Guidance Drawer - context-aware infrastructure issue education */}
      <IssueGuidanceDrawer
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
        issue={selectedIssue}
        inputs={currentInputs}
        metrics={metrics}
        recommendation={recommendation}
        healthScore={dynamicHealthScore.score}
        manufacturer={currentInputs.manufacturer}
        onScheduleService={handleGetExpertHelp}
        onGetQuote={handleGetExpertHelp}
      />

      {/* Options Assessment Drawer - education before service selection */}
      <OptionsAssessmentDrawer
        open={showAssessment}
        onOpenChange={setShowAssessment}
        onContinue={handleAssessmentContinue}
        inputs={currentInputs}
        metrics={metrics}
        verdictAction={recommendation.action}
        healthScore={dynamicHealthScore.score}
        isPassVerdict={isPassVerdict}
        verdictReason={verdict.reason}
        verdictTitle={verdict.title}
        yearsRemaining={yearsRemaining}
      />

      {/* Service Selection Drawer - pick what you need help with */}
      <ServiceSelectionDrawer
        open={showServiceSelection}
        onOpenChange={setShowServiceSelection}
        violations={displayViolations}
        maintenanceTasks={maintenanceTasks}
        recommendations={recommendationTasks}
        onSubmit={handleServiceSelectionSubmit}
        isPassVerdict={isPassVerdict}
        verdictReason={verdict.reason}
        verdictTitle={verdict.title}
        yearsRemaining={yearsRemaining}
      />

      {/* Contact Form Modal - lead capture */}
      <PlumberContactForm
        open={showContactForm}
        onOpenChange={setShowContactForm}
        onSubmit={handleContactFormSubmit}
      />
    </div>
  );
}
