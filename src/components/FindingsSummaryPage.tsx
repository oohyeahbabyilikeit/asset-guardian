import { ArrowLeft, AlertTriangle, Info, ChevronRight, Wrench, AlertCircle, Shield, Gauge, Droplets, Clock, ThermometerSun, Check, ArrowRight, TrendingUp, DollarSign, Calendar, CheckCircle2, MessageCircle, Loader2, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { EducationalContext } from '@/hooks/useEducationalContent';
import { ForensicInputs, OpterraResult, OpterraMetrics, isTankless } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { DAMAGE_SCENARIOS, getLocationKey } from '@/data/damageScenarios';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MaintenanceEducationCard } from './MaintenanceEducationCard';
import { WaterHeaterChatbot } from './WaterHeaterChatbot';
import { SaveReportModal, SaveReportContext } from './SaveReportModal';
import { hasLeadBeenCaptured } from '@/lib/leadService';
import { getCachedFinding } from '@/hooks/useGeneratedFindings';
import { Skeleton } from '@/components/ui/skeleton';

// Helper to apply AI-generated content to a finding if available
function applyAIContent(
  finding: FindingCard, 
  currentInputs: ForensicInputs
): FindingCard {
  const cached = getCachedFinding(finding.id, currentInputs);
  if (cached) {
    return {
      ...finding,
      title: cached.title,
      measurement: cached.measurement,
      explanation: cached.explanation,
    };
  }
  return finding;
}

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

// Education Step Component - explains WHY we recommend what we do
function RecommendationEducationStep({
  finding,
  financial,
  topFindings,
  recommendationType,
  currentInputs,
  opterraResult,
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
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR';
  currentInputs: ForensicInputs;
  opterraResult: OpterraResult;
  onComplete: () => void;
}) {
  // Extract key metrics for the "proof" section
  const metrics = opterraResult.metrics;
  const bioAge = metrics.bioAge;
  const failProb = metrics.failProb;
  const healthScore = metrics.healthScore;
  const calendarAge = currentInputs.calendarAge;
  
  // Get damage scenario based on location
  const locationKey = getLocationKey(currentInputs.location || 'basement');
  const damageScenario = DAMAGE_SCENARIOS[locationKey];
  
  // Calculate estimated repair vs replace costs
  const estimatedRepairCost = topFindings.length > 0 
    ? Math.min(topFindings.length * 350, 1200) // Rough estimate based on findings
    : 400;
  const estimatedReplacementCost = financial.estReplacementCost;
  
  // Get contextual explanations for the key stats
  const getStatContext = () => {
    const contexts: { stat: string; explanation: string; severity: 'good' | 'warning' | 'critical' }[] = [];
    
    // Bio Age context
    const ageDiff = bioAge - calendarAge;
    if (ageDiff > 3) {
      contexts.push({
        stat: 'Bio Age',
        explanation: `Your water conditions added ${ageDiff.toFixed(0)} years of wear`,
        severity: ageDiff > 5 ? 'critical' : 'warning'
      });
    } else if (bioAge > 10) {
      contexts.push({
        stat: 'Bio Age',
        explanation: 'Past typical service life for this type of unit',
        severity: 'warning'
      });
    }
    
    // Fail probability context
    if (failProb > 25) {
      contexts.push({
        stat: 'Fail Risk',
        explanation: '1 in 4 chance of failure in the next year',
        severity: 'critical'
      });
    } else if (failProb > 15) {
      contexts.push({
        stat: 'Fail Risk', 
        explanation: 'Elevated chance of unexpected breakdown',
        severity: 'warning'
      });
    }
    
    // Health context
    if (healthScore < 40) {
      contexts.push({
        stat: 'Health',
        explanation: 'Multiple components showing significant wear',
        severity: 'critical'
      });
    } else if (healthScore < 60) {
      contexts.push({
        stat: 'Health',
        explanation: 'Some areas need attention soon',
        severity: 'warning'
      });
    }
    
    return contexts;
  };
  
  const statContexts = getStatContext();

  // Configuration based on recommendation type
  const getVerdictConfig = () => {
    switch (recommendationType) {
      case 'REPLACE_NOW':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          iconBg: 'bg-destructive/10 text-destructive',
          headline: 'Replace Now',
          subheadline: 'Your unit needs attention',
          accentColor: 'border-destructive/30',
          badgeColor: 'bg-destructive/10 text-destructive',
          ctaText: 'See Replacement Options',
          targetLabel: 'Recommended timeline',
          targetValue: 'Within 1-3 months',
        };
      case 'REPLACE_SOON':
        return {
          icon: <Clock className="w-5 h-5" />,
          iconBg: 'bg-amber-500/10 text-amber-600',
          headline: 'Plan Replacement',
          subheadline: 'Your unit is on borrowed time',
          accentColor: 'border-amber-500/30',
          badgeColor: 'bg-amber-500/10 text-amber-600',
          ctaText: 'See My Options',
          targetLabel: 'Target replacement',
          targetValue: financial.targetReplacementDate,
        };
      case 'MAINTAIN':
        return {
          icon: <Wrench className="w-5 h-5" />,
          iconBg: 'bg-primary/10 text-primary',
          headline: 'Maintenance Recommended',
          subheadline: 'A few repairs will keep you running',
          accentColor: 'border-primary/30',
          badgeColor: 'bg-primary/10 text-primary',
          ctaText: 'See Maintenance Plan',
          targetLabel: 'Expected lifespan',
          targetValue: financial.targetReplacementDate,
        };
      case 'MONITOR':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          iconBg: 'bg-emerald-500/10 text-emerald-600',
          headline: 'Looking Good',
          subheadline: 'Your system is healthy',
          accentColor: 'border-emerald-500/30',
          badgeColor: 'bg-emerald-500/10 text-emerald-600',
          ctaText: 'View Maintenance Tips',
          targetLabel: 'Plan replacement around',
          targetValue: financial.targetReplacementDate,
        };
    }
  };

  const config = getVerdictConfig();
  const showRiskSection = recommendationType === 'REPLACE_NOW' || recommendationType === 'REPLACE_SOON';
  const locationName = currentInputs.location?.toLowerCase().includes('attic') ? 'attic' 
    : currentInputs.location?.toLowerCase().includes('basement') ? 'basement'
    : currentInputs.location?.toLowerCase().includes('garage') ? 'garage'
    : 'utility area';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      <Card className={cn("overflow-hidden border", config.accentColor)}>
        <CardContent className="p-0">
          
          {/* Verdict Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", config.iconBg)}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {config.headline}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {config.subheadline}
                </p>
              </div>
            </div>
          </div>

          {/* Key Stats - The Proof */}
          <div className="grid grid-cols-3 divide-x divide-border/50 bg-muted/30">
            <div className="p-3 text-center">
              <div className="text-xl font-bold text-foreground">
                {bioAge.toFixed(0)}
                <span className="text-xs font-normal text-muted-foreground ml-0.5">yrs</span>
              </div>
              <div className="text-xs text-muted-foreground">Bio Age</div>
              {bioAge > calendarAge + 2 && (
                <div className="text-[10px] text-amber-600 mt-0.5">
                  ({calendarAge}yr unit)
                </div>
              )}
            </div>
            <div className="p-3 text-center">
              <div className={cn(
                "text-xl font-bold",
                failProb > 30 ? "text-destructive" : failProb > 15 ? "text-amber-600" : "text-foreground"
              )}>
                {Math.round(failProb)}%
              </div>
              <div className="text-xs text-muted-foreground">Fail Risk</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">next 12mo</div>
            </div>
            <div className="p-3 text-center">
              <div className={cn(
                "text-xl font-bold",
                healthScore < 40 ? "text-destructive" : healthScore < 60 ? "text-amber-600" : "text-emerald-600"
              )}>
                {healthScore}
              </div>
              <div className="text-xs text-muted-foreground">Health</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">out of 100</div>
            </div>
          </div>

          {/* Why This Matters - Context bullets */}
          {statContexts.length > 0 && (
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Why this matters:</p>
              <div className="space-y-1.5">
                {statContexts.slice(0, 2).map((ctx, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                      ctx.severity === 'critical' ? 'bg-destructive' : 'bg-amber-500'
                    )} />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{ctx.stat}:</span> {ctx.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What Could Happen - Risk Section (only for replace recommendations) */}
          {showRiskSection && (
            <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/10">
              <div className="flex items-start gap-2.5">
                <Home className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-foreground mb-1">
                    If it fails in your {locationName}:
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {damageScenario.description}
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-destructive">
                      ${damageScenario.waterDamage.min.toLocaleString()}–${damageScenario.waterDamage.max.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">typical damage</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Money Breakdown (for replace recommendations) */}
          {showRiskSection && (
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">The math:</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Keep repairing</div>
                  <div className="text-sm font-semibold text-foreground">
                    ~${estimatedRepairCost.toLocaleString()}/yr
                  </div>
                  <div className="text-[10px] text-muted-foreground">+ rising risk</div>
                </div>
                <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-xs text-primary mb-1">Replace now</div>
                  <div className="text-sm font-semibold text-foreground">
                    ~${estimatedReplacementCost.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">10+ yrs peace of mind</div>
                </div>
              </div>
            </div>
          )}

          {/* Target Date */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{config.targetLabel}:</span>
              <span className="text-xs font-medium text-foreground">{config.targetValue}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="p-4 pt-0">
            <Button 
              onClick={onComplete}
              className="w-full"
              size="lg"
            >
              {config.ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
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
  const [showChatbot, setShowChatbot] = useState(false);
  const [showSaveReportModal, setShowSaveReportModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<'options' | 'maintenance' | null>(null);
  
  const { metrics, verdict } = opterraResult;
  const violations = getIssuesByCategory(infrastructureIssues, 'VIOLATION');
  const hasViolations = violations.length > 0;
  const isCritical = verdict.badge === 'CRITICAL';
  const isLeaking = currentInputs.isLeaking;
  const isTanklessUnit = isTankless(currentInputs.fuelType);
  
  // Determine if this unit should be replaced - affects how we frame findings
  const isReplacementRecommended = verdict.action === 'REPLACE' || verdict.badge === 'CRITICAL';
  
  // Build finding cards based on actual detected issues
  const findings: FindingCard[] = [];
  
  // Active leak - differentiated by source
  if (isLeaking && currentInputs.leakSource) {
    const leakSource = currentInputs.leakSource;
    
    if (leakSource === 'TANK_BODY') {
      if (isTanklessUnit) {
        // Tankless leak = heat exchanger failure
        findings.push({
          id: 'leak-heat-exchanger',
          icon: <AlertCircle className="w-6 h-6" />,
          title: 'Heat Exchanger Leak - Critical Failure',
          measurement: 'Immediate replacement needed',
          explanation: 'Water is leaking from the heat exchanger. This is the core component of your tankless unit and cannot be economically repaired. The unit must be replaced.',
          severity: 'critical',
          severityValue: 98,
          educationalTopic: 'heat-exchanger',
        });
      } else {
        findings.push({
          id: 'leak-tank-body',
          icon: <AlertCircle className="w-6 h-6" />,
          title: 'Tank Body Leak - Critical Failure',
          measurement: 'Immediate replacement needed',
          explanation: 'Water is leaking from the tank itself. This indicates internal corrosion has breached the tank wall. This cannot be repaired - the tank must be replaced before catastrophic failure.',
          severity: 'critical',
          severityValue: 98,
          educationalTopic: 'tank-failure',
        });
      }
    } else if (leakSource === 'FITTING_VALVE') {
      findings.push({
        id: 'leak-fitting',
        icon: <Wrench className="w-6 h-6" />,
        title: 'Fitting Leak - Repairable',
        measurement: 'Service appointment needed',
        explanation: isTanklessUnit 
          ? 'Good news: water is leaking from a connection or valve, NOT the heat exchanger. This is a repairable issue - a plumber can tighten or replace the fitting. Your tankless unit is not failing.'
          : 'Good news: water is leaking from a connection or valve, NOT the tank itself. This is a repairable issue - a plumber can tighten or replace the fitting. Your water heater tank is not failing.',
        severity: 'warning',
        severityValue: 75,
      });
    } else if (leakSource === 'DRAIN_PAN') {
      findings.push({
        id: 'leak-drain-pan',
        icon: <Droplets className="w-6 h-6" />,
        title: 'Water in Drain Pan',
        measurement: 'Source investigation needed',
        explanation: isTanklessUnit
          ? 'Water was found in the drain pan beneath your tankless unit. This could be condensation (normal for some models), a minor fitting drip, or an early sign of heat exchanger issues. A professional should inspect to determine the source.'
          : 'Water was found in the drain pan beneath your water heater. This could be condensation, a minor fitting drip, or an early sign of tank issues. A professional should inspect to determine the source.',
        severity: 'warning',
        severityValue: 70,
      });
    }
  } else if (isLeaking) {
    // Legacy fallback for when source wasn't captured
    findings.push({
      id: 'leaking',
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Active Leak Detected',
      measurement: 'Source unknown',
      explanation: 'Water damage can occur quickly and may affect surrounding areas. A professional should inspect to identify the leak source.',
      severity: 'critical',
      severityValue: 95,
    });
  }
  
  // Critical pressure issues (>80 PSI)
  if (currentInputs.housePsi > 80) {
    const pressureMultiplier = metrics.stressFactors?.pressure || 1;
    if (isReplacementRecommended) {
      findings.push({
        id: 'pressure-critical',
        icon: <Gauge className="w-6 h-6" />,
        title: 'High Pressure Accelerated Failure',
        measurement: `${currentInputs.housePsi} PSI (limit: 80 PSI)`,
        explanation: `Years of ${currentInputs.housePsi} PSI water pressure—${currentInputs.housePsi - 80} PSI over the safe limit—aged this unit ${pressureMultiplier.toFixed(1)}x faster than normal. For your next water heater: install a pressure regulating valve (PRV) set to 50-60 PSI from day one.`,
        severity: 'info',
        severityValue: 60,
        educationalTopic: 'pressure',
      });
    } else {
      findings.push({
        id: 'pressure-critical',
        icon: <Gauge className="w-6 h-6" />,
        title: 'Dangerously High Water Pressure',
        measurement: `${currentInputs.housePsi} PSI (limit: 80 PSI)`,
        explanation: `Your ${currentInputs.housePsi} PSI reading is ${currentInputs.housePsi - 80} PSI over the safe limit. This is aging your ${currentInputs.manufacturer || 'water heater'} ${pressureMultiplier.toFixed(1)}x faster than normal. Every valve, fitting, and appliance in your home is being stressed beyond design limits.`,
        severity: 'critical',
        severityValue: Math.min(100, Math.round((currentInputs.housePsi / 100) * 100)),
        educationalTopic: 'pressure',
      });
    }
  } else if (currentInputs.housePsi >= 70) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'pressure-high',
        icon: <Gauge className="w-6 h-6" />,
        title: 'Elevated Pressure Contributed to Wear',
        measurement: `${currentInputs.housePsi} PSI (optimal: 40-60 PSI)`,
        explanation: `At ${currentInputs.housePsi} PSI—${currentInputs.housePsi - 60} PSI above optimal—this added ongoing wear over ${currentInputs.calendarAge || 'several'} years. For your next unit, consider a PRV to maintain 50-60 PSI and maximize equipment lifespan.`,
        severity: 'info',
        severityValue: 50,
        educationalTopic: 'pressure',
      });
    } else {
      findings.push({
        id: 'pressure-high',
        icon: <Gauge className="w-6 h-6" />,
        title: 'Elevated Water Pressure',
        measurement: `${currentInputs.housePsi} PSI (optimal: 40-60 PSI)`,
        explanation: `At ${currentInputs.housePsi} PSI, your home is ${currentInputs.housePsi - 60} PSI above the optimal range. While not immediately dangerous, this adds ongoing wear to your ${currentInputs.tankCapacity || 50}-gallon tank and plumbing fixtures. A PRV adjustment or installation could extend equipment life.`,
        severity: 'warning',
        severityValue: Math.min(100, Math.round((currentInputs.housePsi / 100) * 100)),
        educationalTopic: 'pressure',
      });
    }
  }
  
  // Missing or broken expansion tank in closed system
  const isClosedSystem = currentInputs.isClosedLoop || currentInputs.hasPrv || currentInputs.hasCircPump;
  const hasWorkingExpTank = currentInputs.expTankStatus === 'FUNCTIONAL' || 
    (currentInputs.hasExpTank && currentInputs.expTankStatus !== 'WATERLOGGED' && currentInputs.expTankStatus !== 'MISSING');
  
  if (isClosedSystem && !hasWorkingExpTank) {
    const pressureMultiplier = metrics.stressFactors?.pressure || 1;
    const isCriticalExpansion = pressureMultiplier >= 3;
    const isWaterlogged = currentInputs.expTankStatus === 'WATERLOGGED';
    const tankSize = currentInputs.tankCapacity || 50;
    const expansionGallons = (tankSize * 0.02).toFixed(1); // ~2% expansion
    
    if (isReplacementRecommended) {
      findings.push({
        id: 'expansion-tank',
        icon: <ThermometerSun className="w-6 h-6" />,
        title: 'Thermal Expansion Caused Premature Wear',
        measurement: `Thousands of pressure spikes over ${currentInputs.calendarAge || 'several'} years`,
        explanation: isWaterlogged 
          ? `Your failed expansion tank allowed pressure spikes of 150+ PSI multiple times daily for years. Each heating cycle, ${expansionGallons} gallons of expanded water had nowhere to go. For your next unit: install a properly-sized expansion tank and test it annually.`
          : `Without an expansion tank in your closed system, every heating cycle created a pressure spike. Over ${currentInputs.calendarAge || 'several'} years, this caused cumulative damage. For your next water heater: ensure an expansion tank is installed at setup.`,
        severity: 'info',
        severityValue: 55,
        educationalTopic: 'thermal-expansion',
      });
    } else {
      findings.push({
        id: 'expansion-tank',
        icon: <ThermometerSun className="w-6 h-6" />,
        title: isWaterlogged ? 'Failed Expansion Tank' : 'Thermal Expansion Damage',
        measurement: `${pressureMultiplier.toFixed(1)}x accelerated aging`,
        explanation: isWaterlogged 
          ? `Your expansion tank is waterlogged and no longer absorbing pressure spikes. When your ${tankSize}-gallon tank heats up, ${expansionGallons} gallons of expanded water have nowhere to go—causing pressure to spike to 150+ PSI multiple times daily. This is why your unit is aging ${pressureMultiplier.toFixed(0)}x faster than its calendar age suggests.`
          : `Your PRV creates a closed system, but you have no expansion tank. Every heating cycle, ${expansionGallons} gallons of expanded water create a pressure spike with nowhere to go. After ${currentInputs.calendarAge || 'several'} years of this, the cumulative damage explains why your bio-age (${metrics.bioAge.toFixed(1)} years) exceeds calendar age.`,
        severity: isCriticalExpansion ? 'critical' : 'warning',
        severityValue: isCriticalExpansion ? 90 : 65,
        educationalTopic: 'thermal-expansion',
      });
    }
  }
  
  // Hard water issues - with specific impact (different for tankless vs tank)
  const hardnessMultiplier = metrics.stressFactors?.chemical || 1;
  if (currentInputs.hardnessGPG > 15) {
    const scalePerYear = (currentInputs.hardnessGPG * 0.15).toFixed(1); // rough estimate lbs/year
    const totalScale = (parseFloat(scalePerYear) * (currentInputs.calendarAge || 5)).toFixed(0);
    if (isReplacementRecommended) {
      findings.push({
        id: 'hardness-critical',
        icon: <Droplets className="w-6 h-6" />,
        title: 'Hard Water Accelerated Deterioration',
        measurement: isTanklessUnit 
          ? `${currentInputs.hardnessGPG} GPG over ${currentInputs.calendarAge || 'several'} years`
          : `~${totalScale} lbs of scale deposited over ${currentInputs.calendarAge || 'several'} years`,
        explanation: isTanklessUnit
          ? `At ${currentInputs.hardnessGPG} GPG, your extremely hard water caused rapid scale buildup in the heat exchanger—reducing flow and efficiency until failure. ${currentInputs.hasSoftener ? 'Your softener helped, but this level overwhelmed it.' : 'A water softener would have significantly extended this unit\'s life.'} For your next tankless unit: ${currentInputs.hasSoftener ? 'ensure your softener is properly sized' : 'strongly consider a water softener'} and descale annually.`
          : `At ${currentInputs.hardnessGPG} GPG, your extremely hard water deposited roughly ${scalePerYear} lbs of scale annually—coating heating elements and insulating the tank bottom. ${currentInputs.hasSoftener ? 'Your softener helped, but this level overwhelmed it.' : 'A water softener would have significantly extended this unit\'s life.'} For your next water heater: ${currentInputs.hasSoftener ? 'ensure your softener is properly sized and maintained' : 'strongly consider a water softener'}.`,
        severity: 'info',
        severityValue: 55,
        educationalTopic: isTanklessUnit ? 'hardness-tankless' : 'hardness',
      });
    } else {
      findings.push({
        id: 'hardness-critical',
        icon: <Droplets className="w-6 h-6" />,
        title: isTanklessUnit ? 'Severe Scale Buildup Risk' : 'Severe Hard Water Damage',
        measurement: `${currentInputs.hardnessGPG} GPG (very hard)`,
        explanation: isTanklessUnit
          ? `At ${currentInputs.hardnessGPG} grains per gallon, scale is building up rapidly in your heat exchanger. ${currentInputs.hasSoftener ? 'Even with your softener, this level requires frequent descaling.' : 'Without a water softener, you need to descale every 6-12 months to prevent damage.'} This is aging your system ${hardnessMultiplier.toFixed(1)}x faster than soft water would.`
          : `At ${currentInputs.hardnessGPG} grains per gallon, your water is depositing roughly ${scalePerYear} lbs of scale per year inside your tank. ${currentInputs.hasSoftener ? 'Even with your softener, this level is causing significant wear.' : 'Without a water softener, this mineral buildup is coating your heating elements and insulating the tank bottom.'} This is aging your system ${hardnessMultiplier.toFixed(1)}x faster than soft water would.`,
        severity: 'warning',
        severityValue: Math.min(100, Math.round((currentInputs.hardnessGPG / 25) * 100)),
        educationalTopic: isTanklessUnit ? 'hardness-tankless' : 'hardness',
      });
    }
  } else if (currentInputs.hardnessGPG > 10) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'hardness-moderate',
        icon: <Droplets className="w-6 h-6" />,
        title: 'Moderate Hard Water Contributed to Wear',
        measurement: `${currentInputs.hardnessGPG} GPG over ${currentInputs.calendarAge || 'several'} years`,
        explanation: isTanklessUnit
          ? `Your ${currentInputs.hardnessGPG} GPG water caused gradual scale buildup in the heat exchanger that reduced efficiency and stressed components. For your next tankless unit: ${currentInputs.hasSoftener ? 'maintain your softener and descale regularly' : 'consider a water softener and plan for annual descaling'}.`
          : `Your ${currentInputs.hardnessGPG} GPG water caused gradual scale buildup that reduced heating efficiency and stressed components. For your next unit: ${currentInputs.hasSoftener ? 'maintain your softener and consider annual flushes' : 'consider a water softener to protect your investment'}.`,
        severity: 'info',
        severityValue: 45,
        educationalTopic: isTanklessUnit ? 'hardness-tankless' : 'hardness',
      });
    } else {
      findings.push({
        id: 'hardness-moderate',
        icon: <Droplets className="w-6 h-6" />,
        title: isTanklessUnit ? 'Scale Buildup Concern' : 'Hard Water Wear',
        measurement: `${currentInputs.hardnessGPG} GPG (moderately hard)`,
        explanation: isTanklessUnit
          ? `Your ${currentInputs.hardnessGPG} GPG water hardness is causing gradual scale buildup in the heat exchanger. Over ${currentInputs.calendarAge || 'several'} years, this reduces efficiency and can restrict water flow. ${currentInputs.hasSoftener ? 'Your softener helps, but regular descaling is still recommended.' : 'Regular descaling (every 1-2 years) will prevent damage.'}`
          : `Your ${currentInputs.hardnessGPG} GPG water hardness is causing gradual scale buildup on heating elements. Over ${currentInputs.calendarAge || 'several'} years, this accumulates into ${currentInputs.hasSoftener ? 'reduced efficiency despite your softener.' : 'thick deposits that reduce heating efficiency by 15-25% and stress tank components.'}`,
        severity: 'info',
        severityValue: Math.round((currentInputs.hardnessGPG / 25) * 100),
        educationalTopic: isTanklessUnit ? 'hardness-tankless' : 'hardness',
      });
    }
  }
  
  // Aging unit - with specific brand context (different thresholds for tankless)
  const agingThreshold = isTanklessUnit ? 15 : 10;
  const expectedLifespan = isTanklessUnit ? '15-20 years' : '8-12 years';
  
  if (currentInputs.calendarAge >= agingThreshold) {
    const yearsOver = currentInputs.calendarAge - agingThreshold;
    const failureRisk = isTanklessUnit 
      ? Math.min(95, 15 + (currentInputs.calendarAge - 12) * 5) // tankless has flatter failure curve
      : Math.min(95, 20 + (currentInputs.calendarAge - 8) * 8);
    if (isReplacementRecommended) {
      findings.push({
        id: 'aging',
        icon: <Clock className="w-6 h-6" />,
        title: 'Unit Exceeded Design Lifespan',
        measurement: `${currentInputs.calendarAge} years (industry average: ${expectedLifespan})`,
        explanation: isTanklessUnit
          ? (currentInputs.manufacturer 
            ? `${currentInputs.manufacturer} tankless units typically last 15-20 years with proper maintenance. At ${currentInputs.calendarAge} years, this unit has reached the end of its service life. Heat exchanger efficiency degrades over time, even with regular descaling.`
            : `At ${currentInputs.calendarAge} years, this tankless unit has exceeded the typical 15-20 year design life. Industry data shows increasing failure rates at this age as heat exchangers wear out.`)
          : (currentInputs.manufacturer 
            ? `${currentInputs.manufacturer} tanks are typically warrantied for 6-12 years. At ${currentInputs.calendarAge} years, this unit reached ${yearsOver > 0 ? `${yearsOver} years past` : ''} its expected service life. Industry data shows ~${failureRisk}% of similar units have failed by this age.`
            : `At ${currentInputs.calendarAge} years, this unit exceeded the typical 8-12 year design life. Industry data shows ~${failureRisk}% of water heaters have failed by this age.`),
        severity: 'info',
        severityValue: 50,
        educationalTopic: isTanklessUnit ? 'aging-tankless' : 'aging',
      });
    } else {
      findings.push({
        id: 'aging',
        icon: <Clock className="w-6 h-6" />,
        title: currentInputs.calendarAge >= (isTanklessUnit ? 18 : 12) ? 'Past Expected Lifespan' : 'Approaching End of Life',
        measurement: `${currentInputs.calendarAge} years old`,
        explanation: isTanklessUnit
          ? (currentInputs.manufacturer 
            ? `${currentInputs.manufacturer} tankless units typically last 15-20 years. At ${currentInputs.calendarAge} years, yours is ${yearsOver > 0 ? `${yearsOver} years past` : 'at'} the typical design lifespan. Heat exchanger efficiency naturally degrades over time.`
            : `At ${currentInputs.calendarAge} years, your tankless unit is ${yearsOver > 0 ? `${yearsOver} years past` : 'at'} the typical 15-20 year design life. Consider planning for replacement as parts become harder to find.`)
          : (currentInputs.manufacturer 
            ? `${currentInputs.manufacturer} tanks are typically warrantied for 6-12 years. At ${currentInputs.calendarAge} years, yours is ${yearsOver > 0 ? `${yearsOver} years past` : 'at'} the design lifespan. Industry data shows ~${failureRisk}% of similar units have failed by this age. ${currentInputs.modelNumber ? `Model ${currentInputs.modelNumber} was` : 'Units from this era were'} built before current efficiency standards.`
            : `At ${currentInputs.calendarAge} years, your unit is ${yearsOver > 0 ? `${yearsOver} years past` : 'at'} the typical 10-year design life. Industry data shows ~${failureRisk}% of water heaters have failed by this age, with failure rates accelerating each additional year.`),
        severity: currentInputs.calendarAge >= (isTanklessUnit ? 18 : 12) ? 'warning' : 'info',
        severityValue: Math.min(100, Math.round((currentInputs.calendarAge / (isTanklessUnit ? 20 : 15)) * 100)),
        educationalTopic: isTanklessUnit ? 'aging-tankless' : 'aging',
      });
    }
  } else if (metrics.bioAge >= agingThreshold) {
    const ageDelta = metrics.bioAge - currentInputs.calendarAge;
    if (isReplacementRecommended) {
      findings.push({
        id: 'bio-age',
        icon: <Clock className="w-6 h-6" />,
        title: 'Environmental Stress Caused Premature Failure',
        measurement: `${currentInputs.calendarAge} years old with ${metrics.bioAge.toFixed(0)}-year wear`,
        explanation: isTanklessUnit
          ? `Although only ${currentInputs.calendarAge} years old, this tankless unit accumulated ${ageDelta.toFixed(1)} years of extra wear from ${currentInputs.hardnessGPG > 10 ? 'hard water scale buildup, ' : ''}${currentInputs.housePsi > 70 ? 'high pressure, ' : ''}environmental factors. For your next unit: ${currentInputs.hardnessGPG > 10 ? 'install a water softener and ' : ''}plan for regular descaling.`.replace(/, environmental factors/, ' and other factors').replace(/, For/, '. For')
          : `Although only ${currentInputs.calendarAge} years old, this unit accumulated ${ageDelta.toFixed(1)} years of extra wear from ${currentInputs.housePsi > 70 ? 'high pressure, ' : ''}${currentInputs.hardnessGPG > 10 ? 'hard water, ' : ''}${!hasWorkingExpTank && isClosedSystem ? 'thermal expansion, ' : ''}environmental factors. For your next unit: address these issues at installation to maximize lifespan.`.replace(/, environmental factors/, ' and other factors').replace(/, For/, '. For'),
        severity: 'info',
        severityValue: 50,
        educationalTopic: isTanklessUnit ? 'aging-tankless' : 'aging',
      });
    } else {
      findings.push({
        id: 'bio-age',
        icon: <Clock className="w-6 h-6" />,
        title: 'Premature Aging Detected',
        measurement: `${currentInputs.calendarAge} years old → ${metrics.bioAge.toFixed(1)} bio-age`,
        explanation: isTanklessUnit
          ? `Your ${currentInputs.manufacturer || 'tankless water heater'} is only ${currentInputs.calendarAge} years old, but shows wear equivalent to a ${metrics.bioAge.toFixed(0)}-year-old unit. That's ${ageDelta.toFixed(1)} years of extra wear caused by ${currentInputs.hardnessGPG > 10 ? 'hard water scale buildup, ' : ''}${currentInputs.housePsi > 70 ? 'high pressure, ' : ''}environmental factors.`.replace(/, environmental factors/, ' and other factors').replace(/,\s*$/, '.')
          : `Your ${currentInputs.manufacturer || 'water heater'} is only ${currentInputs.calendarAge} years old, but shows wear equivalent to a ${metrics.bioAge.toFixed(0)}-year-old unit. That's ${ageDelta.toFixed(1)} years of extra wear caused by ${currentInputs.housePsi > 70 ? 'high pressure, ' : ''}${currentInputs.hardnessGPG > 10 ? 'hard water, ' : ''}${!hasWorkingExpTank && isClosedSystem ? 'thermal expansion stress, ' : ''}and other environmental factors.`.replace(/, $/, '.'),
        severity: 'warning',
        severityValue: Math.min(100, Math.round((metrics.bioAge / (isTanklessUnit ? 20 : 15)) * 100)),
        educationalTopic: isTanklessUnit ? 'aging-tankless' : 'aging',
      });
    }
  }
  
  // Visual rust - with context (skip for tankless - they have different corrosion patterns)
  if (currentInputs.visualRust && !isTanklessUnit) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'rust',
        icon: <AlertTriangle className="w-6 h-6" />,
        title: 'Corrosion Indicates Internal Damage',
        explanation: `External rust on this ${currentInputs.calendarAge || ''}-year-old tank signals advanced internal corrosion. The anode rod—designed to sacrifice itself to protect the tank—was depleted years ago. For your next water heater: replace the anode rod every 3-5 years to prevent this.`,
        severity: 'info',
        severityValue: 55,
        educationalTopic: 'anode-rod',
      });
    } else {
      findings.push({
        id: 'rust',
        icon: <AlertTriangle className="w-6 h-6" />,
        title: 'External Corrosion Visible',
        explanation: `Rust on the outside of your ${currentInputs.manufacturer || ''} tank indicates moisture exposure or condensation issues. At ${currentInputs.calendarAge || 'this'} years old, external rust often signals that internal corrosion is more advanced—the anode rod has likely been depleted for some time, allowing the tank itself to corrode.`,
        severity: 'warning',
        severityValue: 75,
        educationalTopic: 'anode-rod',
      });
    }
  }
  
  // Depleted anode rod - TANK ONLY (tankless units don't have anode rods)
  if (!isTanklessUnit) {
    const shieldLife = metrics.shieldLife ?? 0;
    const anodeAge = currentInputs.lastAnodeReplaceYearsAgo ?? currentInputs.calendarAge;
    const neverServiced = currentInputs.lastAnodeReplaceYearsAgo === undefined || currentInputs.lastAnodeReplaceYearsAgo === null;
    const isFusedRisk = neverServiced && currentInputs.calendarAge > 6;
    
    if (shieldLife < 1 && !currentInputs.visualRust) {
      const corrosionMultiplier = metrics.stressFactors?.corrosion || 1;
      
      if (isReplacementRecommended) {
        findings.push({
          id: 'anode-depleted',
          icon: <Shield className="w-6 h-6" />,
          title: 'Anode Protection Was Missing',
          measurement: `Depleted for ~${Math.max(0, anodeAge - 5)} years`,
          explanation: `This unit's anode rod—designed to sacrifice itself to protect the tank—was never replaced. For ${anodeAge} years, the tank corroded unprotected${currentInputs.hardnessGPG > 10 ? ` in ${currentInputs.hardnessGPG} GPG hard water` : ''}. For your next water heater: replace the anode rod every 3-5 years ($20-50 part) to maximize tank life.`,
          severity: 'info',
          severityValue: 50,
          educationalTopic: 'anode-rod',
        });
      } else if (isFusedRisk) {
        findings.push({
          id: 'anode-fused',
          icon: <Shield className="w-6 h-6" />,
          title: 'Anode Protection Expired',
          measurement: `${anodeAge}+ years without replacement`,
          explanation: `Your tank's anode rod—the sacrificial metal that corrodes instead of your tank—has been depleted for years. After ${currentInputs.calendarAge} years without service, the anode is likely fused to the tank and cannot be replaced without risking damage. Your steel tank is now corroding directly, which is irreversible.`,
          severity: 'warning',
          severityValue: 80,
          educationalTopic: 'anode-rod',
        });
      } else {
        findings.push({
          id: 'anode-depleted',
          icon: <Shield className="w-6 h-6" />,
          title: 'Anode Rod Depleted',
          measurement: `~${shieldLife.toFixed(1)} years of protection left`,
          explanation: `The anode rod is a sacrificial metal that corrodes so your tank doesn't. After ${anodeAge} years${currentInputs.hardnessGPG > 10 ? ` in ${currentInputs.hardnessGPG} GPG hard water` : ''}, yours is depleted. Without this protection, your ${currentInputs.manufacturer || ''} tank's steel lining is now corroding ${corrosionMultiplier.toFixed(1)}x faster. This is the #1 cause of premature tank failure—but it's fixable with a $20-50 part.`,
          severity: shieldLife < 0.5 ? 'warning' : 'info',
          severityValue: Math.min(90, Math.round(80 - shieldLife * 20)),
          educationalTopic: 'anode-rod',
        });
      }
    }
  }
  
  // Overdue maintenance - TANK ONLY (tankless uses descaling, not flushing)
  if (!isTanklessUnit && currentInputs.lastFlushYearsAgo !== undefined && currentInputs.lastFlushYearsAgo > 2) {
    const sedimentEstimate = currentInputs.lastFlushYearsAgo * (currentInputs.hardnessGPG > 10 ? 2 : 1);
    if (isReplacementRecommended) {
      findings.push({
        id: 'flush-overdue',
        icon: <Wrench className="w-6 h-6" />,
        title: 'Sediment Reduced Efficiency',
        measurement: `${currentInputs.lastFlushYearsAgo}+ years of buildup`,
        explanation: `Years of sediment buildup insulated the burner from the water, reducing efficiency by 15-30% and accelerating wear. For your next water heater: schedule annual flushes, especially with ${currentInputs.hardnessGPG || 'hard'} GPG water.`,
        severity: 'info',
        severityValue: 45,
        educationalTopic: 'sediment',
      });
    } else {
      findings.push({
        id: 'flush-overdue',
        icon: <Wrench className="w-6 h-6" />,
        title: 'Sediment Buildup Likely',
        measurement: `${currentInputs.lastFlushYearsAgo}+ years since last flush`,
        explanation: `With ${currentInputs.hardnessGPG || 'your'} GPG water hardness and no flush in ${currentInputs.lastFlushYearsAgo}+ years, there's likely ${sedimentEstimate}-${sedimentEstimate + 2}" of sediment at the tank bottom. This insulates the burner from the water, reducing efficiency by 15-30% and causing the popping/rumbling sounds common in neglected tanks.`,
        severity: 'info',
        severityValue: Math.min(100, Math.round((currentInputs.lastFlushYearsAgo / 5) * 100)),
        educationalTopic: 'sediment',
      });
    }
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

  // Apply AI-generated content to findings if available (from background prefetch)
  const aiEnhancedFindings = topFindings.map(f => applyAIContent(f, currentInputs));

  // Clear and repopulate with AI-enhanced findings
  findings.length = 0;
  findings.push(...aiEnhancedFindings);

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
    
    if (urgency === 'HIGH' || bioAge >= 10) {
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
      // Check if we should show the lead capture modal
      const shouldCapture = !hasLeadBeenCaptured('findings_summary');
      const targetNav = (economicGuidance.recommendation === 'REPLACE_NOW' || economicGuidance.recommendation === 'REPLACE_SOON') 
        ? 'options' 
        : 'maintenance';
      
      if (shouldCapture) {
        setPendingNavigation(targetNav);
        setShowSaveReportModal(true);
      } else {
        // Already captured, go directly
        if (targetNav === 'options') {
          onOptions();
        } else {
          onMaintenance();
        }
      }
    }
  };

  const handleSaveReportComplete = () => {
    setShowSaveReportModal(false);
    if (pendingNavigation === 'options') {
      onOptions();
    } else {
      onMaintenance();
    }
  };

  const handleSaveReportSkip = () => {
    setShowSaveReportModal(false);
    if (pendingNavigation === 'options') {
      onOptions();
    } else {
      onMaintenance();
    }
  };

  // Build context for SaveReportModal
  const saveReportContext: SaveReportContext = {
    recommendationType: economicGuidance.recommendation,
    healthScore: metrics.healthScore,
    bioAge: metrics.bioAge,
    topFindings: findings.filter(f => f.id !== 'economic-guidance').map(f => f.title),
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

            {/* Chat button */}
            <Button
              onClick={() => setShowChatbot(true)}
              variant="ghost"
              className="w-full h-auto py-2.5 text-muted-foreground hover:text-foreground"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Have Questions? Chat with AI</span>
            </Button>

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

        {/* AI Chatbot */}
        <AnimatePresence>
          {showChatbot && (
            <WaterHeaterChatbot
              onClose={() => setShowChatbot(false)}
              context={{
                inputs: {
                  manufacturer: currentInputs.manufacturer,
                  modelNumber: currentInputs.modelNumber,
                  calendarAgeYears: currentInputs.calendarAge,
                  fuelType: currentInputs.fuelType,
                  tankCapacityGallons: currentInputs.tankCapacity,
                  hasPrv: currentInputs.hasPrv,
                  hasExpTank: currentInputs.hasExpTank,
                  expTankStatus: currentInputs.expTankStatus,
                  isClosedLoop: currentInputs.isClosedLoop,
                  streetHardnessGpg: currentInputs.streetHardnessGPG,
                  hasSoftener: currentInputs.hasSoftener,
                  housePsi: currentInputs.housePsi,
                  visualRust: currentInputs.visualRust,
                  isLeaking: currentInputs.isLeaking,
                  leakSource: currentInputs.leakSource,
                },
                metrics: {
                  healthScore: metrics.healthScore,
                  bioAge: metrics.bioAge,
                  stressFactors: metrics.stressFactors,
                },
                recommendation: {
                  action: verdict.action,
                  badge: verdict.badge,
                  title: verdict.title,
                  description: verdict.reason,
                },
                findings: findings.map(f => ({
                  title: f.title,
                  measurement: f.measurement,
                  explanation: f.explanation,
                  severity: f.severity,
                })),
                financial: {
                  totalReplacementCost: financial.estReplacementCost,
                  monthlyBudget: financial.monthlyBudget,
                  targetDate: financial.targetReplacementDate,
                },
              }}
            />
          )}
        </AnimatePresence>
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

      {/* Current finding - use education component for final recommendation */}
      <AnimatePresence mode="wait">
        {currentFinding.id === 'economic-guidance' ? (
          <RecommendationEducationStep
            key={currentFinding.id}
            finding={currentFinding}
            financial={{
              targetReplacementDate: financial.targetReplacementDate,
              monthsUntilTarget: financial.monthsUntilTarget,
              estReplacementCost: financial.estReplacementCost,
              monthlyBudget: financial.monthlyBudget,
            }}
            topFindings={findings.filter(f => f.id !== 'economic-guidance')}
            recommendationType={economicGuidance.recommendation}
            currentInputs={currentInputs}
            opterraResult={opterraResult}
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

      {/* Chat FAB */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-24 right-6 z-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center"
        style={{ boxShadow: '0 4px 20px -4px hsl(var(--primary) / 0.5)' }}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Educational drawer with personalized LLM content */}
      {openTopic && (
        <EducationalDrawer
          topic={openTopic}
          isOpen={!!openTopic}
          onClose={() => setOpenTopic(null)}
          context={{
            inputs: currentInputs,
            metrics: opterraResult.metrics,
          }}
        />
      )}

      {/* AI Chatbot */}
      <AnimatePresence>
        {showChatbot && (
          <WaterHeaterChatbot
            onClose={() => setShowChatbot(false)}
            context={{
              inputs: {
                manufacturer: currentInputs.manufacturer,
                modelNumber: currentInputs.modelNumber,
                calendarAgeYears: currentInputs.calendarAge,
                fuelType: currentInputs.fuelType,
                tankCapacityGallons: currentInputs.tankCapacity,
                hasPrv: currentInputs.hasPrv,
                hasExpTank: currentInputs.hasExpTank,
                expTankStatus: currentInputs.expTankStatus,
                isClosedLoop: currentInputs.isClosedLoop,
                streetHardnessGpg: currentInputs.streetHardnessGPG,
                hasSoftener: currentInputs.hasSoftener,
                housePsi: currentInputs.housePsi,
                visualRust: currentInputs.visualRust,
                isLeaking: currentInputs.isLeaking,
                leakSource: currentInputs.leakSource,
              },
              metrics: {
                healthScore: metrics.healthScore,
                bioAge: metrics.bioAge,
                stressFactors: metrics.stressFactors,
              },
              recommendation: {
                action: verdict.action,
                badge: verdict.badge,
                title: verdict.title,
                description: verdict.reason,
              },
              findings: findings.map(f => ({
                title: f.title,
                measurement: f.measurement,
                explanation: f.explanation,
                severity: f.severity,
              })),
              financial: {
                totalReplacementCost: financial.estReplacementCost,
                monthlyBudget: financial.monthlyBudget,
                targetDate: financial.targetReplacementDate,
              },
            }}
          />
        )}
      </AnimatePresence>

      {/* Save Report Modal */}
      <SaveReportModal
        open={showSaveReportModal}
        onOpenChange={setShowSaveReportModal}
        onComplete={handleSaveReportComplete}
        onSkip={handleSaveReportSkip}
        context={saveReportContext}
      />
    </div>
  );
}
