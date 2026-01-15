import { ArrowLeft, AlertTriangle, Info, ChevronRight, Wrench, AlertCircle, Shield, Gauge, Droplets, Clock, ThermometerSun, Check, ArrowRight, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { ForensicInputs, OpterraResult } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Economic Guidance Step Component (special rendering for the recommendation)
function EconomicGuidanceStep({
  finding,
  stepNumber,
  totalSteps,
  financial,
  repairCosts,
  onComplete,
}: {
  finding: FindingCard;
  stepNumber: number;
  totalSteps: number;
  financial: {
    targetReplacementDate: string;
    monthsUntilTarget: number;
    estReplacementCost: number;
    monthlyBudget: number;
  };
  repairCosts: number;
  onComplete: () => void;
}) {
  const isReplacementRecommended = finding.severity === 'critical' || finding.severity === 'warning';
  const showComparison = repairCosts > 0 && isReplacementRecommended;
  
  // Calculate cost comparison
  const repairPath = repairCosts + Math.round(financial.estReplacementCost * 0.85);
  const replacePath = financial.estReplacementCost;
  const yearsUntilReplace = Math.max(1, Math.round(financial.monthsUntilTarget / 12));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="px-4"
    >
      {/* Step indicator - final step framing */}
      <motion.div 
        className="flex items-center gap-2 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-sm text-muted-foreground">
          Final Step
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/30">
          Based on Your Data
        </span>
      </motion.div>

      {/* Main content card */}
      <Card className="overflow-hidden border-2 border-primary/30">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.div 
                  className="inline-flex p-2 rounded-lg mb-3 bg-primary/10 text-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  <TrendingUp className="w-6 h-6" />
                </motion.div>
                <motion.h2 
                  className="text-xl font-semibold text-foreground mb-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {finding.title}
                </motion.h2>
                <motion.p 
                  className="text-sm text-muted-foreground flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Calendar className="w-4 h-4" />
                  {finding.measurement}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Authoritative framing box */}
          <motion.div 
            className="mx-6 mt-2 p-3 bg-muted/50 rounded-lg border border-border"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">
              Our Take
            </p>
            <p className="text-sm text-foreground">
              This is based on the data we collected—not what anyone wants to sell you.
            </p>
          </motion.div>

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

            {/* Cost Comparison Chart - only show if there are meaningful repair costs */}
            {showComparison && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6"
              >
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  The Numbers
                </h4>
                <div className="space-y-3">
                  {/* Repair path */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Repair Now + Replace in ~{yearsUntilReplace} yr</span>
                      <span className="font-medium text-foreground">${repairPath.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-amber-500/70"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                      />
                    </div>
                  </div>
                  {/* Replace path */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Replace Now</span>
                      <span className="font-medium text-primary">${replacePath.toLocaleString()}</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(replacePath / repairPath) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Sometimes replacing now saves money over time
                </p>
              </motion.div>
            )}

            {/* Budget recommendation for non-urgent cases */}
            {!isReplacementRecommended && financial.monthlyBudget > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mt-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Budget Suggestion</p>
                    <p className="text-xs text-muted-foreground">
                      Set aside <span className="font-semibold text-emerald-600">${financial.monthlyBudget}/month</span> for eventual replacement
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Action button */}
          <motion.div 
            className="p-4 bg-muted/30 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
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
            stepNumber={currentStep + 1}
            totalSteps={findings.length}
            financial={{
              targetReplacementDate: financial.targetReplacementDate,
              monthsUntilTarget: financial.monthsUntilTarget,
              estReplacementCost: financial.estReplacementCost,
              monthlyBudget: financial.monthlyBudget,
            }}
            repairCosts={infrastructureIssues.reduce((sum, issue) => sum + (issue.costMin || 0), 0)}
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
