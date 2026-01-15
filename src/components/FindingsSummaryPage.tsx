import { ArrowLeft, AlertTriangle, Info, ChevronRight, Wrench, AlertCircle, Shield, Gauge, Droplets, Clock, ThermometerSun, Check, ArrowRight, TrendingUp, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { ForensicInputs, OpterraResult, OpterraMetrics } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaintenanceEducationCard } from './MaintenanceEducationCard';

interface FindingsSummaryPageProps {
  currentInputs: ForensicInputs;
  opterraResult: OpterraResult;
  infrastructureIssues: InfrastructureIssue[];
  onMaintenance: () => void;
  onOptions: () => void;
  onEmergency: () => void;
  onBack: () => void;
}

interface FindingCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  measurement?: string;
  explanation: string;
  severity: 'critical' | 'warning' | 'info';
  severityValue: number; // 0-100 for the gauge
  educationalTopic?: EducationalTopic;
}

// Animated severity gauge component
function SeverityGauge({ 
  value, 
  severity, 
  animate = true 
}: { 
  value: number; 
  severity: 'critical' | 'warning' | 'info';
  animate?: boolean;
}) {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimatedValue(value), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animate]);

  const getGaugeColor = () => {
    switch (severity) {
      case 'critical': return 'hsl(var(--destructive))';
      case 'warning': return 'hsl(45, 93%, 47%)'; // amber
      case 'info': return 'hsl(var(--primary))';
    }
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case 'critical': return 'hsl(var(--destructive) / 0.2)';
      case 'warning': return 'hsl(45, 93%, 47%, 0.2)';
      case 'info': return 'hsl(var(--primary) / 0.2)';
    }
  };

  const getSeverityLabel = () => {
    switch (severity) {
      case 'critical': return 'HIGH';
      case 'warning': return 'MED';
      case 'info': return 'LOW';
    }
  };

  const getLabelColor = () => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-amber-500';
      case 'info': return 'text-primary';
    }
  };

  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={getBackgroundColor()}
          strokeWidth="4"
        />
        {/* Animated progress circle */}
        <motion.circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={getGaugeColor()}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${animatedValue * 0.88} 100`}
          initial={{ strokeDasharray: "0 100" }}
          animate={{ strokeDasharray: `${animatedValue * 0.88} 100` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span 
          className={`text-xs font-bold ${getLabelColor()}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {getSeverityLabel()}
        </motion.span>
      </div>
    </div>
  );
}

// Maintenance cost constants for year-by-year projections
const MAINTENANCE_COSTS = {
  FLUSH: { cost: 150, intervalYears: 2, label: 'Tank Flush' },
  ANODE: { cost: 350, intervalYears: 5, label: 'Anode Replacement' },
  ELEMENT: { cost: 250, intervalYears: 6, label: 'Element Service' }, // Electric only
  DESCALE: { cost: 200, intervalYears: 2, label: 'Descale' }, // Tankless only
  TPR_VALVE: { cost: 125, intervalYears: 5, label: 'T&P Valve' },
  THERMOSTAT: { cost: 175, intervalYears: 8, label: 'Thermostat' },
};

// Calculate year-by-year maintenance forecast
function calculateMaintenanceForecast(
  currentAge: number,
  yearsToProject: number,
  fuelType: string,
  repairCostsNow: number,
  replacementCost: number
): {
  repairPath: { year: number; label: string; cost: number; cumulative: number }[];
  replacePath: { year: number; label: string; cost: number; cumulative: number }[];
  totalRepairPath: number;
  totalReplacePath: number;
} {
  const repairPath: { year: number; label: string; cost: number; cumulative: number }[] = [];
  const replacePath: { year: number; label: string; cost: number; cumulative: number }[] = [];
  
  let repairCumulative = 0;
  let replaceCumulative = 0;
  
  // Year 0: Initial costs
  if (repairCostsNow > 0) {
    repairCumulative += repairCostsNow;
    repairPath.push({
      year: 0,
      label: 'Repairs Today',
      cost: repairCostsNow,
      cumulative: repairCumulative,
    });
  }
  
  replaceCumulative += replacementCost;
  replacePath.push({
    year: 0,
    label: 'Replace Now',
    cost: replacementCost,
    cumulative: replaceCumulative,
  });
  
  // Project years 1 through yearsToProject
  const isElectric = fuelType === 'ELECTRIC' || fuelType === 'HYBRID';
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  
  for (let year = 1; year <= yearsToProject; year++) {
    const projectedAge = currentAge + year;
    let yearCost = 0;
    const yearItems: string[] = [];
    
    // Repair path: aging unit needs more maintenance
    if (!isTankless) {
      // Flush every 2 years (more frequent as unit ages)
      if (year % 2 === 0 || projectedAge > 10) {
        yearCost += MAINTENANCE_COSTS.FLUSH.cost;
        yearItems.push('Flush');
      }
      
      // Anode check/replace (critical after 5 years)
      if (projectedAge >= 8 && year % 3 === 0) {
        yearCost += MAINTENANCE_COSTS.ANODE.cost;
        yearItems.push('Anode');
      }
      
      // Electric elements degrade
      if (isElectric && projectedAge > 8 && year === 2) {
        yearCost += MAINTENANCE_COSTS.ELEMENT.cost;
        yearItems.push('Element');
      }
      
      // T&P valve replacement
      if (projectedAge > 10 && year === 3) {
        yearCost += MAINTENANCE_COSTS.TPR_VALVE.cost;
        yearItems.push('T&P Valve');
      }
    } else {
      // Tankless: descale every 2 years
      if (year % 2 === 0) {
        yearCost += MAINTENANCE_COSTS.DESCALE.cost;
        yearItems.push('Descale');
      }
    }
    
    // Add eventual replacement in repair path (at end of projection)
    if (year === yearsToProject) {
      // Apply inflation to replacement cost
      const inflatedReplacement = Math.round(replacementCost * Math.pow(1.03, year));
      yearCost += inflatedReplacement;
      yearItems.push(`Replace (${year}yr inflation)`);
    }
    
    if (yearCost > 0) {
      repairCumulative += yearCost;
      repairPath.push({
        year,
        label: yearItems.join(' + '),
        cost: yearCost,
        cumulative: repairCumulative,
      });
    }
    
    // Replace path: new unit has minimal costs for first few years
    if (year >= 3 && year % 3 === 0) {
      // Only occasional maintenance after year 3
      const newUnitMaintenance = 75; // Basic checkup
      replaceCumulative += newUnitMaintenance;
      replacePath.push({
        year,
        label: 'Routine check',
        cost: newUnitMaintenance,
        cumulative: replaceCumulative,
      });
    }
  }
  
  return {
    repairPath,
    replacePath,
    totalRepairPath: repairCumulative,
    totalReplacePath: replaceCumulative,
  };
}

// Economic Guidance Step Component (special rendering for the recommendation)
function EconomicGuidanceStep({
  finding,
  financial,
  topFindings,
  onComplete,
}: {
  finding: FindingCard;
  financial: {
    targetReplacementDate: string;
    monthsUntilTarget: number;
    estReplacementCost: number;
    monthlyBudget: number;
  };
  topFindings: FindingCard[];
  onComplete: () => void;
}) {
  // Determine urgency level and messaging
  const getVerdictConfig = () => {
    if (finding.severity === 'critical') {
      return {
        verdict: "Your water heater needs attention now",
        urgencyBadge: "Act within 30 days",
        borderColor: "border-destructive/50",
        badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
        icon: AlertTriangle,
        iconBg: "bg-destructive/10 text-destructive",
      };
    }
    if (finding.severity === 'warning') {
      return {
        verdict: "Time to start planning",
        urgencyBadge: "Plan for next 6 months",
        borderColor: "border-amber-500/50",
        badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30",
        icon: Clock,
        iconBg: "bg-amber-500/10 text-amber-600",
      };
    }
    return {
      verdict: "Your water heater is healthy",
      urgencyBadge: "No rush",
      borderColor: "border-emerald-500/50",
      badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      icon: CheckCircle2,
      iconBg: "bg-emerald-500/10 text-emerald-600",
    };
  };

  const config = getVerdictConfig();
  const IconComponent = config.icon;
  const isUrgent = finding.severity === 'critical' || finding.severity === 'warning';

  // Get the single most relevant cost to show
  const displayCost = financial.estReplacementCost;

  // Get severity badge styling
  const getSeverityStyle = (severity: string) => {
    if (severity === 'critical') return 'bg-destructive/10 text-destructive';
    if (severity === 'warning') return 'bg-amber-500/10 text-amber-600';
    return 'bg-muted text-muted-foreground';
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      {/* Step indicator */}
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-sm text-muted-foreground">Our Recommendation</span>
      </motion.div>

      {/* Main card with colored border based on urgency */}
      <Card className={cn("overflow-hidden border-2", config.borderColor)}>
        <CardContent className="p-0">
          
          {/* SECTION 1: The Verdict */}
          <div className="p-6 pb-4">
            <motion.div 
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={cn("p-3 rounded-xl", config.iconBg)}>
                <IconComponent className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {config.verdict}
                </h2>
                <span className={cn(
                  "inline-flex px-3 py-1 text-xs font-medium rounded-full border",
                  config.badgeClass
                )}>
                  {config.urgencyBadge}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Divider */}
          <div className="mx-6 border-t border-border" />

          {/* SECTION 2: The Why */}
          <motion.div 
            className="p-6 py-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {/* What we found - top stressors */}
            {topFindings.length > 0 && isUrgent && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  What we found
                </p>
                {topFindings.map((f, idx) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                      f.severity === 'critical' ? 'bg-destructive' : 
                      f.severity === 'warning' ? 'bg-amber-500' : 'bg-muted-foreground'
                    )} />
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{f.title}</span>
                      {f.measurement && (
                        <span className="text-muted-foreground"> — {f.measurement}</span>
                      )}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              {finding.explanation}
            </p>

            {/* Damage risk warning for critical situations */}
            {finding.severity === 'critical' && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
              >
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Why this matters
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Water heater failures often mean flooded basements, damaged floors, and emergency repair bills 3-4x higher than planned replacement.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Divider */}
          <div className="mx-6 border-t border-border" />

          {/* SECTION 3: The Action */}
          <motion.div 
            className="p-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {isUrgent ? (
              // Replacement recommended
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Estimated replacement cost
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    ${displayCost.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Includes unit + installation
                  </p>
                </div>
              </div>
            ) : (
              // System healthy - show budget suggestion
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", config.iconBg)}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Budget suggestion
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Set aside <span className="font-semibold text-emerald-600">${financial.monthlyBudget}/month</span> for eventual replacement
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action button */}
          <motion.div 
            className="p-4 bg-muted/30 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button 
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              <span>View Full Summary</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
// Individual finding step component
function FindingStep({
  finding,
  stepNumber,
  isActive,
  isComplete,
  onComplete,
  onLearnMore,
}: {
  finding: FindingCard;
  stepNumber: number;
  isActive: boolean;
  isComplete: boolean;
  onComplete: () => void;
  onLearnMore: () => void;
}) {
  const getSeverityLabel = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'Needs Immediate Attention';
      case 'warning': return 'Should Be Addressed';
      case 'info': return 'Good to Know';
    }
  };

  const getSeverityBadgeStyles = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'warning': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'info': return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      {/* Step indicator */}
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-sm text-muted-foreground">
          Finding {stepNumber}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getSeverityBadgeStyles(finding.severity)}`}>
          {getSeverityLabel(finding.severity)}
        </span>
      </motion.div>

      {/* Main content card */}
      <Card className="overflow-hidden border-2 border-border/50">
        <CardContent className="p-0">
          {/* Header with icon and gauge */}
          <div className="p-6 bg-gradient-to-br from-muted/50 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.div 
                  className={`inline-flex p-2 rounded-lg mb-3 ${
                    finding.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    finding.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-primary/10 text-primary'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  {finding.icon}
                </motion.div>
                <motion.h2 
                  className="text-xl font-semibold text-foreground mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {finding.title}
                </motion.h2>
                {finding.measurement && (
                  <motion.p 
                    className="text-sm text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {finding.measurement}
                  </motion.p>
                )}
              </div>
              <SeverityGauge 
                value={finding.severityValue} 
                severity={finding.severity} 
              />
            </div>
          </div>

          {/* Explanation */}
          <div className="p-6 pt-4">
            <motion.p 
              className="text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {finding.explanation}
            </motion.p>

            {/* Learn more link */}
            {finding.educationalTopic && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-4"
              >
                <button 
                  onClick={onLearnMore}
                  className="text-sm text-primary hover:underline underline-offset-4 flex items-center gap-1"
                >
                  <Info className="w-4 h-4" />
                  Learn more about this issue
                  <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Action button */}
          <motion.div 
            className="p-4 bg-muted/30 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              <span>Got it, next finding</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Progress dots component
function ProgressDots({ 
  total, 
  current, 
  completed 
}: { 
  total: number; 
  current: number;
  completed: number[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={`relative flex items-center justify-center ${
            i === current 
              ? 'w-8 h-2 rounded-full bg-primary' 
              : completed.includes(i)
                ? 'w-2 h-2 rounded-full bg-primary'
                : 'w-2 h-2 rounded-full bg-muted-foreground/30'
          }`}
          initial={false}
          animate={{ 
            scale: i === current ? 1 : 0.8,
            opacity: i === current ? 1 : 0.7 
          }}
          transition={{ duration: 0.2 }}
        >
          {completed.includes(i) && i !== current && (
            <Check className="w-1.5 h-1.5 text-primary-foreground" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

export function FindingsSummaryPage({
  currentInputs,
  opterraResult,
  infrastructureIssues,
  onMaintenance,
  onOptions,
  onEmergency,
  onBack,
}: FindingsSummaryPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [openTopic, setOpenTopic] = useState<EducationalTopic | null>(null);
  
  const { metrics, verdict } = opterraResult;
  const violations = getIssuesByCategory(infrastructureIssues, 'VIOLATION');
  const hasViolations = violations.length > 0;
  const isCritical = verdict.badge === 'CRITICAL';
  const isLeaking = currentInputs.isLeaking;
  
  // Build finding cards based on actual detected issues
  const findings: FindingCard[] = [];
  
  // Active leak - highest priority
  if (isLeaking) {
    findings.push({
      id: 'leaking',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Active Leak Detected',
      measurement: currentInputs.leakSource ? `Source: ${currentInputs.leakSource}` : undefined,
      explanation: 'Water damage can occur quickly and may affect surrounding areas. This should be addressed immediately to prevent further damage.',
      severity: 'critical',
      severityValue: 95,
    });
  }
  
  // Critical pressure issues (>80 PSI)
  if (currentInputs.housePsi > 80) {
    findings.push({
      id: 'pressure-critical',
      icon: <Gauge className="w-6 h-6" />,
      title: 'Critical Water Pressure',
      measurement: `${currentInputs.housePsi} PSI measured`,
      explanation: 'Pressure above 80 PSI exceeds safe limits and puts significant stress on pipes, valves, and appliances. This can lead to premature failures and water damage.',
      severity: 'critical',
      severityValue: Math.min(100, Math.round((currentInputs.housePsi / 100) * 100)),
      educationalTopic: 'pressure',
    });
  } else if (currentInputs.housePsi >= 70) {
    findings.push({
      id: 'pressure-high',
      icon: <Gauge className="w-6 h-6" />,
      title: 'Elevated Water Pressure',
      measurement: `${currentInputs.housePsi} PSI measured`,
      explanation: 'While technically within limits, pressure above 70 PSI increases wear on your plumbing system over time. A pressure regulating valve can extend appliance life.',
      severity: 'warning',
      severityValue: Math.min(100, Math.round((currentInputs.housePsi / 100) * 100)),
      educationalTopic: 'pressure',
    });
  }
  
  // Missing expansion tank in closed system
  const isClosedSystem = currentInputs.isClosedLoop || currentInputs.hasPrv || currentInputs.hasCircPump;
  if (isClosedSystem && !currentInputs.hasExpTank) {
    findings.push({
      id: 'expansion-tank',
      icon: <ThermometerSun className="w-6 h-6" />,
      title: 'Thermal Expansion Not Managed',
      explanation: 'Your home has a closed plumbing system, but no expansion tank is installed. When water heats up, it expands—without somewhere to go, this creates pressure spikes that stress your tank.',
      severity: 'warning',
      severityValue: 65,
      educationalTopic: 'thermal-expansion',
    });
  }
  
  // Hard water issues
  if (currentInputs.hardnessGPG > 15) {
    findings.push({
      id: 'hardness-critical',
      icon: <Droplets className="w-6 h-6" />,
      title: 'Very Hard Water',
      measurement: `${currentInputs.hardnessGPG} GPG hardness`,
      explanation: 'High mineral content causes significant scale buildup on heating elements and tank surfaces. This reduces efficiency, increases energy costs, and can substantially shorten equipment lifespan.',
      severity: 'warning',
      severityValue: Math.min(100, Math.round((currentInputs.hardnessGPG / 25) * 100)),
      educationalTopic: 'hardness',
    });
  } else if (currentInputs.hardnessGPG > 10) {
    findings.push({
      id: 'hardness-moderate',
      icon: <Droplets className="w-6 h-6" />,
      title: 'Hard Water Detected',
      measurement: `${currentInputs.hardnessGPG} GPG hardness`,
      explanation: 'Moderate mineral content in your water will cause scale buildup over time. This can affect heating efficiency and shorten equipment lifespan without proper maintenance.',
      severity: 'info',
      severityValue: Math.round((currentInputs.hardnessGPG / 25) * 100),
      educationalTopic: 'hardness',
    });
  }
  
  // Aging unit
  if (currentInputs.calendarAge >= 10) {
    findings.push({
      id: 'aging',
      icon: <Clock className="w-6 h-6" />,
      title: 'Unit Approaching End of Life',
      measurement: `${currentInputs.calendarAge} years old`,
      explanation: `Most water heaters are designed for 8-12 years of service. At ${currentInputs.calendarAge} years, your unit has exceeded the typical lifespan. Failure rates increase significantly with age.`,
      severity: currentInputs.calendarAge >= 12 ? 'warning' : 'info',
      severityValue: Math.min(100, Math.round((currentInputs.calendarAge / 15) * 100)),
      educationalTopic: 'aging',
    });
  } else if (metrics.bioAge >= 10) {
    findings.push({
      id: 'bio-age',
      icon: <Clock className="w-6 h-6" />,
      title: 'Accelerated Wear Detected',
      measurement: `Bio-age: ${metrics.bioAge.toFixed(1)} years`,
      explanation: 'Based on your water conditions and maintenance history, your unit shows more wear than its calendar age would suggest. Environmental factors are accelerating the aging process.',
      severity: 'warning',
      severityValue: Math.min(100, Math.round((metrics.bioAge / 15) * 100)),
      educationalTopic: 'aging',
    });
  }
  
  // Visual rust
  if (currentInputs.visualRust) {
    findings.push({
      id: 'rust',
      icon: <AlertTriangle className="w-6 h-6" />,
      title: 'Corrosion Visible',
      explanation: 'Visible rust indicates the tank\'s protective lining may be compromised. Once corrosion begins on the outside, internal conditions are often worse. This is typically a sign of approaching failure.',
      severity: 'warning',
      severityValue: 75,
      educationalTopic: 'anode-rod',
    });
  }
  
  // Overdue maintenance
  if (currentInputs.lastFlushYearsAgo !== undefined && currentInputs.lastFlushYearsAgo > 2) {
    findings.push({
      id: 'flush-overdue',
      icon: <Wrench className="w-6 h-6" />,
      title: 'Maintenance Overdue',
      measurement: `Last flush: ${currentInputs.lastFlushYearsAgo}+ years ago`,
      explanation: 'Annual flushing removes sediment that accumulates at the bottom of your tank. Sediment buildup reduces efficiency and can cause premature heating element failure.',
      severity: 'info',
      severityValue: Math.min(100, Math.round((currentInputs.lastFlushYearsAgo / 5) * 100)),
      educationalTopic: 'sediment',
    });
  }
  
  // Add infrastructure violations as findings
  violations.forEach(violation => {
    if (violation.id.includes('prv') && findings.some(f => f.id.includes('pressure'))) return;
    if (violation.id.includes('exp_tank') && findings.some(f => f.id === 'expansion-tank')) return;
    
    findings.push({
      id: violation.id,
      icon: <Shield className="w-6 h-6" />,
      title: violation.name,
      explanation: violation.description,
      severity: 'warning',
      severityValue: 60,
    });
  });
  
  // If no specific findings, show general health status
  if (findings.length === 0) {
    findings.push({
      id: 'healthy',
      icon: <Info className="w-6 h-6" />,
      title: 'System Appears Healthy',
      measurement: `Health Score: ${metrics.healthScore}`,
      explanation: 'No significant issues were detected during the assessment. Regular maintenance will help keep your system running efficiently.',
      severity: 'info',
      severityValue: 100 - metrics.healthScore,
    });
  }

  // Limit to top 3 highest impact findings (by severityValue)
  const sortedFindings = [...findings].sort((a, b) => b.severityValue - a.severityValue);
  const topFindings = sortedFindings.slice(0, 3);

  // Clear and repopulate with top findings
  findings.length = 0;
  findings.push(...topFindings);

  // Always add economic guidance as final step
  const financial = opterraResult.financial;
  const getEconomicGuidance = () => {
    const age = currentInputs.calendarAge;
    const bioAge = metrics.bioAge;
    const replacementCost = financial.estReplacementCost;
    const monthsUntilTarget = financial.monthsUntilTarget;
    const urgency = financial.budgetUrgency;
    
    // Calculate rough repair costs from infrastructure issues (using costMin as estimate)
    const repairCosts = infrastructureIssues.reduce((sum, issue) => sum + (issue.costMin || 0), 0);
    const repairVsReplaceRatio = repairCosts / replacementCost;
    
    // Determine recommendation type
    if (verdict.action === 'REPLACE' || urgency === 'IMMEDIATE') {
      return {
        recommendation: 'REPLACE_NOW' as const,
        title: 'Replacement Is the Smart Move',
        timeframe: 'Within the next 1-3 months',
        reasoning: `At ${age} years old with a biological age of ${bioAge.toFixed(1)} years, your unit has exceeded its designed service life. The numbers don't support further investment in repairs.`,
        comparison: repairCosts > 0 ? {
          repairPath: repairCosts + Math.round(replacementCost * 0.9), // Repairs now + eventual replacement
          replacePath: replacementCost,
          yearsUntilReplaceAnyway: Math.min(2, monthsUntilTarget / 12),
        } : undefined,
      };
    }
    
    if (urgency === 'HIGH' || (bioAge >= 10 && age >= 8)) {
      return {
        recommendation: 'REPLACE_SOON' as const,
        title: 'Start Planning Your Replacement',
        timeframe: financial.targetReplacementDate,
        reasoning: `Based on the wear patterns we measured, your unit will likely need replacement around ${financial.targetReplacementDate}. Planning now means you control the timing—not an emergency.`,
        comparison: repairCosts > 0 && repairVsReplaceRatio > 0.3 ? {
          repairPath: repairCosts + Math.round(replacementCost),
          replacePath: replacementCost,
          yearsUntilReplaceAnyway: Math.round(monthsUntilTarget / 12),
        } : undefined,
      };
    }
    
    if (repairCosts > 0 && repairVsReplaceRatio < 0.35) {
      return {
        recommendation: 'MAINTAIN' as const,
        title: 'Repairs Make Sense Right Now',
        timeframe: financial.targetReplacementDate,
        reasoning: `Your unit is ${age} years old with room to run. The recommended repairs (${repairCosts > 0 ? `$${repairCosts.toLocaleString()}` : 'minimal cost'}) are a smart investment—they'll protect your equipment for years to come.`,
        comparison: undefined,
      };
    }
    
    return {
      recommendation: 'MONITOR' as const,
      title: 'You\'re in Good Shape',
      timeframe: `Plan for replacement around ${financial.targetReplacementDate}`,
      reasoning: `Your system is performing well. Regular maintenance is your best investment right now. We recommend budgeting $${financial.monthlyBudget}/month toward eventual replacement.`,
      comparison: undefined,
    };
  };

  const economicGuidance = getEconomicGuidance();
  
  findings.push({
    id: 'economic-guidance',
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Our Recommendation',
    measurement: economicGuidance.timeframe,
    explanation: economicGuidance.reasoning,
    severity: economicGuidance.recommendation === 'REPLACE_NOW' ? 'critical' : 
              economicGuidance.recommendation === 'REPLACE_SOON' ? 'warning' : 'info',
    severityValue: economicGuidance.recommendation === 'REPLACE_NOW' ? 90 : 
                   economicGuidance.recommendation === 'REPLACE_SOON' ? 65 : 30,
  });

  const handleCompleteStep = () => {
    setCompletedSteps(prev => [...prev, currentStep]);
    if (currentStep < findings.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowSummary(true);
    }
  };

  const currentFinding = findings[currentStep];

  // Summary view after all findings reviewed
  if (showSummary) {
    return (
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setShowSummary(false)}
              className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-lg">Your Assessment Summary</h1>
              <p className="text-sm text-muted-foreground">
                {findings.length} finding{findings.length !== 1 ? 's' : ''} reviewed
              </p>
            </div>
          </div>
        </div>

        {/* Reviewed findings list */}
        <motion.div 
          className="px-4 py-6 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {findings.map((finding, index) => (
            <motion.div
              key={finding.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border border-border/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    finding.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    finding.severity === 'warning' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {finding.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{finding.title}</h3>
                    {finding.measurement && (
                      <p className="text-xs text-muted-foreground">{finding.measurement}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <SeverityGauge 
                      value={finding.severityValue} 
                      severity={finding.severity}
                      animate={false}
                    />
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* What This Means Summary - Enhanced with Economic Context */}
        <motion.div 
          className="px-4 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: findings.length * 0.1 }}
        >
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                The Bottom Line
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {economicGuidance.recommendation === 'REPLACE_NOW' ? (
                  `Based on the data we collected, replacement is the most economical path forward. Your unit has reached a point where repair investments won't pay off—you'd be putting money into equipment that's near end of life.`
                ) : economicGuidance.recommendation === 'REPLACE_SOON' ? (
                  `Your system is approaching the end of its service life. We recommend planning for replacement around ${financial.targetReplacementDate}. This gives you time to budget and choose the right solution—rather than being forced into an emergency decision.`
                ) : economicGuidance.recommendation === 'MAINTAIN' ? (
                  `The repairs we identified are worth the investment. Your unit still has serviceable life remaining, and addressing these issues now will protect it for years to come.`
                ) : (
                  `Your system is performing well. Regular maintenance is your best investment right now. When the time comes for replacement, you'll be prepared.`
                )}
              </p>
              {financial.monthlyBudget > 0 && economicGuidance.recommendation !== 'REPLACE_NOW' && (
                <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-xs text-foreground">
                    <strong>${financial.monthlyBudget}/month</strong> toward replacement by {financial.targetReplacementDate}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Pathways */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4 safe-area-bottom">
          <div className="max-w-md mx-auto space-y-3">
            {(isCritical || hasViolations || metrics.healthScore < 70) ? (
              <Button
                onClick={onOptions}
                size="lg"
                className="w-full h-auto py-3 bg-primary hover:bg-primary/90"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <div className="font-semibold">See My Options</div>
                    <div className="text-xs opacity-80">Understand what a new system would cost</div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </div>
              </Button>
            ) : (
              <Button
                onClick={onMaintenance}
                size="lg"
                className="w-full h-auto py-3 bg-emerald-600 hover:bg-emerald-500"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <div className="font-semibold">View Maintenance Plan</div>
                    <div className="text-xs opacity-80">Keep your current system running well</div>
                  </div>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </div>
              </Button>
            )}

            <div className="flex gap-2">
              <Button
                onClick={onMaintenance}
                variant="outline"
                className="flex-1 h-auto py-2.5"
              >
                <Wrench className="w-4 h-4 mr-2" />
                <span className="text-sm">Maintain Current</span>
              </Button>
              <Button
                onClick={onEmergency}
                variant="outline"
                className="flex-1 h-auto py-2.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Emergency</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step-by-step walkthrough view
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={currentStep > 0 ? () => setCurrentStep(prev => prev - 1) : onBack}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Understanding Your Results</h1>
            <p className="text-sm text-muted-foreground">
              Finding {currentStep + 1} of {findings.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSummary(true)}
            className="text-xs"
          >
            Skip to summary
          </Button>
        </div>
      </div>

      {/* Progress dots */}
      <ProgressDots 
        total={findings.length} 
        current={currentStep}
        completed={completedSteps}
      />

      {/* Current finding - use special component for economic guidance */}
      <AnimatePresence mode="wait">
        {currentFinding.id === 'economic-guidance' ? (
          <EconomicGuidanceStep
            key={currentFinding.id}
            finding={currentFinding}
            financial={{
              targetReplacementDate: financial.targetReplacementDate,
              monthsUntilTarget: financial.monthsUntilTarget,
              estReplacementCost: financial.estReplacementCost,
              monthlyBudget: financial.monthlyBudget,
            }}
            topFindings={findings.filter(f => f.id !== 'economic-guidance')}
            onComplete={handleCompleteStep}
          />
        ) : (
          <FindingStep
            key={currentFinding.id}
            finding={currentFinding}
            stepNumber={currentStep + 1}
            isActive={true}
            isComplete={completedSteps.includes(currentStep)}
            onComplete={handleCompleteStep}
            onLearnMore={() => currentFinding.educationalTopic && setOpenTopic(currentFinding.educationalTopic)}
          />
        )}
      </AnimatePresence>

      {/* Educational drawer */}
      {openTopic && (
        <EducationalDrawer
          topic={openTopic}
          isOpen={!!openTopic}
          onClose={() => setOpenTopic(null)}
        />
      )}
    </div>
  );
}
