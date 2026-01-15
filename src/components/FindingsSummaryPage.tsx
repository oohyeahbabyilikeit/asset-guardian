import { ArrowLeft, AlertTriangle, Info, ChevronRight, Wrench, AlertCircle, Shield, Gauge, Droplets, Clock, ThermometerSun, Check, TrendingUp, DollarSign, CheckCircle2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { ForensicInputs, OpterraResult, OpterraMetrics } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WaterHeaterChatbot } from './WaterHeaterChatbot';

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
  severityValue: number;
  educationalTopic?: EducationalTopic;
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
  const [openTopic, setOpenTopic] = useState<EducationalTopic | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  
  const { metrics, verdict, financial } = opterraResult;
  const violations = getIssuesByCategory(infrastructureIssues, 'VIOLATION');
  const hasViolations = violations.length > 0;
  const isCritical = verdict.badge === 'CRITICAL';
  const isLeaking = currentInputs.isLeaking;
  
  // Determine if this unit should be replaced - affects how we frame findings
  const isReplacementRecommended = verdict.action === 'REPLACE' || verdict.badge === 'CRITICAL';
  
  // Build finding cards based on actual detected issues
  const findings: FindingCard[] = [];
  
  // Active leak - differentiated by source
  if (isLeaking && currentInputs.leakSource) {
    const leakSource = currentInputs.leakSource;
    
    if (leakSource === 'TANK_BODY') {
      findings.push({
        id: 'leak-tank-body',
        icon: <AlertCircle className="w-5 h-5" />,
        title: 'Tank Body Leak - Critical Failure',
        measurement: 'Immediate replacement needed',
        explanation: 'Water is leaking from the tank itself. This indicates internal corrosion has breached the tank wall. This cannot be repaired - the tank must be replaced before catastrophic failure.',
        severity: 'critical',
        severityValue: 98,
        educationalTopic: 'tank-failure',
      });
    } else if (leakSource === 'FITTING_VALVE') {
      findings.push({
        id: 'leak-fitting',
        icon: <Wrench className="w-5 h-5" />,
        title: 'Fitting Leak - Repairable',
        measurement: 'Service appointment needed',
        explanation: 'Good news: water is leaking from a connection or valve, NOT the tank itself. This is a repairable issue - a plumber can tighten or replace the fitting.',
        severity: 'warning',
        severityValue: 75,
      });
    } else if (leakSource === 'DRAIN_PAN') {
      findings.push({
        id: 'leak-drain-pan',
        icon: <Droplets className="w-5 h-5" />,
        title: 'Water in Drain Pan',
        measurement: 'Source investigation needed',
        explanation: 'Water was found in the drain pan beneath your water heater. This could be condensation, a minor fitting drip, or an early sign of tank issues.',
        severity: 'warning',
        severityValue: 70,
      });
    }
  } else if (isLeaking) {
    findings.push({
      id: 'leaking',
      icon: <AlertCircle className="w-5 h-5" />,
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
        icon: <Gauge className="w-5 h-5" />,
        title: 'High Pressure Accelerated Failure',
        measurement: `${currentInputs.housePsi} PSI (limit: 80 PSI)`,
        explanation: `Years of ${currentInputs.housePsi} PSI water pressure aged this unit ${pressureMultiplier.toFixed(1)}x faster than normal. For your next water heater: install a PRV set to 50-60 PSI from day one.`,
        severity: 'info',
        severityValue: 60,
        educationalTopic: 'pressure',
      });
    } else {
      findings.push({
        id: 'pressure-critical',
        icon: <Gauge className="w-5 h-5" />,
        title: 'Dangerously High Water Pressure',
        measurement: `${currentInputs.housePsi} PSI (limit: 80 PSI)`,
        explanation: `Your ${currentInputs.housePsi} PSI reading is ${currentInputs.housePsi - 80} PSI over the safe limit. This is aging your water heater ${pressureMultiplier.toFixed(1)}x faster than normal.`,
        severity: 'critical',
        severityValue: Math.min(100, Math.round((currentInputs.housePsi / 100) * 100)),
        educationalTopic: 'pressure',
      });
    }
  } else if (currentInputs.housePsi >= 70) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'pressure-high',
        icon: <Gauge className="w-5 h-5" />,
        title: 'Elevated Pressure Contributed to Wear',
        measurement: `${currentInputs.housePsi} PSI (optimal: 40-60 PSI)`,
        explanation: `At ${currentInputs.housePsi} PSI—above optimal—this added ongoing wear. For your next unit, consider a PRV to maintain 50-60 PSI.`,
        severity: 'info',
        severityValue: 50,
        educationalTopic: 'pressure',
      });
    } else {
      findings.push({
        id: 'pressure-high',
        icon: <Gauge className="w-5 h-5" />,
        title: 'Elevated Water Pressure',
        measurement: `${currentInputs.housePsi} PSI (optimal: 40-60 PSI)`,
        explanation: `At ${currentInputs.housePsi} PSI, your home is above the optimal range. A PRV adjustment or installation could extend equipment life.`,
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
    
    if (isReplacementRecommended) {
      findings.push({
        id: 'expansion-tank',
        icon: <ThermometerSun className="w-5 h-5" />,
        title: 'Thermal Expansion Caused Premature Wear',
        measurement: `Thousands of pressure spikes over ${currentInputs.calendarAge || 'several'} years`,
        explanation: isWaterlogged 
          ? `Your failed expansion tank allowed pressure spikes of 150+ PSI multiple times daily. For your next unit: install a properly-sized expansion tank and test it annually.`
          : `Without an expansion tank in your closed system, every heating cycle created a pressure spike. For your next water heater: ensure an expansion tank is installed at setup.`,
        severity: 'info',
        severityValue: 55,
        educationalTopic: 'thermal-expansion',
      });
    } else {
      findings.push({
        id: 'expansion-tank',
        icon: <ThermometerSun className="w-5 h-5" />,
        title: isWaterlogged ? 'Failed Expansion Tank' : 'Thermal Expansion Damage',
        measurement: `${pressureMultiplier.toFixed(1)}x accelerated aging`,
        explanation: isWaterlogged 
          ? `Your expansion tank is waterlogged and no longer absorbing pressure spikes. This is why your unit is aging ${pressureMultiplier.toFixed(0)}x faster than expected.`
          : `Your PRV creates a closed system, but you have no expansion tank. This explains why your bio-age exceeds calendar age.`,
        severity: isCriticalExpansion ? 'critical' : 'warning',
        severityValue: isCriticalExpansion ? 90 : 65,
        educationalTopic: 'thermal-expansion',
      });
    }
  }
  
  // Hard water issues
  const hardnessMultiplier = metrics.stressFactors?.chemical || 1;
  if (currentInputs.hardnessGPG > 15) {
    const scalePerYear = (currentInputs.hardnessGPG * 0.15).toFixed(1);
    const totalScale = (parseFloat(scalePerYear) * (currentInputs.calendarAge || 5)).toFixed(0);
    if (isReplacementRecommended) {
      findings.push({
        id: 'hardness-critical',
        icon: <Droplets className="w-5 h-5" />,
        title: 'Hard Water Accelerated Deterioration',
        measurement: `~${totalScale} lbs of scale deposited`,
        explanation: `At ${currentInputs.hardnessGPG} GPG, extremely hard water deposited significant scale. ${currentInputs.hasSoftener ? 'Your softener helped, but this level overwhelmed it.' : 'A water softener would have extended this unit\'s life.'}`,
        severity: 'info',
        severityValue: 55,
        educationalTopic: 'hardness',
      });
    } else {
      findings.push({
        id: 'hardness-critical',
        icon: <Droplets className="w-5 h-5" />,
        title: 'Severe Hard Water Damage',
        measurement: `${currentInputs.hardnessGPG} GPG (very hard)`,
        explanation: `At ${currentInputs.hardnessGPG} grains per gallon, your water is depositing scale inside your tank. This is aging your system ${hardnessMultiplier.toFixed(1)}x faster.`,
        severity: 'warning',
        severityValue: Math.min(100, Math.round((currentInputs.hardnessGPG / 25) * 100)),
        educationalTopic: 'hardness',
      });
    }
  } else if (currentInputs.hardnessGPG > 10) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'hardness-moderate',
        icon: <Droplets className="w-5 h-5" />,
        title: 'Moderate Hard Water Contributed to Wear',
        measurement: `${currentInputs.hardnessGPG} GPG over ${currentInputs.calendarAge || 'several'} years`,
        explanation: `Your ${currentInputs.hardnessGPG} GPG water contributed to scale buildup over time. A softener with your next unit would help.`,
        severity: 'info',
        severityValue: 45,
        educationalTopic: 'hardness',
      });
    } else {
      findings.push({
        id: 'hardness-moderate',
        icon: <Droplets className="w-5 h-5" />,
        title: 'Hard Water Detected',
        measurement: `${currentInputs.hardnessGPG} GPG (moderately hard)`,
        explanation: `Your water hardness is causing scale buildup. Regular flushing every 1-2 years is essential.`,
        severity: 'info',
        severityValue: Math.min(100, Math.round((currentInputs.hardnessGPG / 25) * 100)),
        educationalTopic: 'hardness',
      });
    }
  }
  
  // Aging unit
  if (currentInputs.calendarAge >= 10) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'aging',
        icon: <Clock className="w-5 h-5" />,
        title: 'Unit Exceeded Expected Lifespan',
        measurement: `${currentInputs.calendarAge} years old`,
        explanation: `Standard tank water heaters are designed for 10-12 years. At ${currentInputs.calendarAge} years, you've gotten good value. Modern units are 20-30% more efficient.`,
        severity: 'warning',
        severityValue: Math.min(95, 60 + (currentInputs.calendarAge - 10) * 5),
        educationalTopic: 'anode-rod',
      });
    } else {
      findings.push({
        id: 'aging',
        icon: <Clock className="w-5 h-5" />,
        title: 'Approaching End of Expected Lifespan',
        measurement: `${currentInputs.calendarAge} years old`,
        explanation: `Standard water heaters last 10-12 years. Regular maintenance is crucial at this age.`,
        severity: currentInputs.calendarAge >= 12 ? 'warning' : 'info',
        severityValue: Math.min(95, 60 + (currentInputs.calendarAge - 10) * 5),
        educationalTopic: 'anode-rod',
      });
    }
  }
  
  // Bio-age vs calendar age
  if (metrics.bioAge >= 10 && metrics.bioAge > currentInputs.calendarAge * 1.3) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'bio-age',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Environmental Factors Accelerated Aging',
        measurement: `Bio-age: ${metrics.bioAge.toFixed(1)} years`,
        explanation: `Though only ${currentInputs.calendarAge} years old, your unit has worn like a ${metrics.bioAge.toFixed(0)}-year-old due to operating conditions.`,
        severity: 'info',
        severityValue: Math.min(90, Math.round((metrics.bioAge / 15) * 100)),
      });
    } else {
      findings.push({
        id: 'bio-age',
        icon: <TrendingUp className="w-5 h-5" />,
        title: 'Accelerated Wear Detected',
        measurement: `Bio-age: ${metrics.bioAge.toFixed(1)} years (calendar: ${currentInputs.calendarAge})`,
        explanation: `Your unit is aging faster than expected. The findings above explain why. Addressing them will slow further degradation.`,
        severity: 'warning',
        severityValue: Math.min(90, Math.round((metrics.bioAge / 15) * 100)),
      });
    }
  }
  
  // Visual rust
  if (currentInputs.visualRust) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'rust',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Internal Corrosion Evidence',
        measurement: 'Visible rust present',
        explanation: 'Visible rust confirms the anode rod was depleted and the tank is actively corroding. This process is irreversible.',
        severity: 'critical',
        severityValue: 90,
        educationalTopic: 'anode-rod',
      });
    } else {
      findings.push({
        id: 'rust',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: 'Rust Visible on Unit',
        measurement: 'Active corrosion detected',
        explanation: 'Rust indicates internal corrosion is occurring. This is often a sign of a depleted anode rod allowing tank damage.',
        severity: 'critical',
        severityValue: 90,
        educationalTopic: 'anode-rod',
      });
    }
  }
  
  // Anode rod status
  const anodeAge = currentInputs.lastAnodeReplaceYearsAgo !== undefined 
    ? currentInputs.lastAnodeReplaceYearsAgo 
    : currentInputs.calendarAge;
  const shieldLife = 5 - anodeAge;
  const neverServiced = currentInputs.lastFlushYearsAgo === undefined && currentInputs.lastAnodeReplaceYearsAgo === undefined;
  const isFusedRisk = neverServiced && currentInputs.calendarAge > 6;
  
  if (shieldLife < 1 && !currentInputs.visualRust) {
    const corrosionMultiplier = metrics.stressFactors?.corrosion || 1;
    
    if (isReplacementRecommended) {
      findings.push({
        id: 'anode-depleted',
        icon: <Shield className="w-5 h-5" />,
        title: 'Anode Protection Was Missing',
        measurement: `Depleted for ~${Math.max(0, anodeAge - 5)} years`,
        explanation: `This unit's anode rod was never replaced. For your next water heater: replace the anode rod every 3-5 years ($20-50 part).`,
        severity: 'info',
        severityValue: 50,
        educationalTopic: 'anode-rod',
      });
    } else if (isFusedRisk) {
      findings.push({
        id: 'anode-fused',
        icon: <Shield className="w-5 h-5" />,
        title: 'Anode Protection Expired',
        measurement: `${anodeAge}+ years without replacement`,
        explanation: `The anode is likely fused to the tank and cannot be replaced. Your tank is now corroding directly.`,
        severity: 'warning',
        severityValue: 80,
        educationalTopic: 'anode-rod',
      });
    } else {
      findings.push({
        id: 'anode-depleted',
        icon: <Shield className="w-5 h-5" />,
        title: 'Anode Rod Depleted',
        measurement: `~${shieldLife.toFixed(1)} years of protection left`,
        explanation: `The anode rod is depleted. Without this protection, your tank is corroding ${corrosionMultiplier.toFixed(1)}x faster. This is fixable with a $20-50 part.`,
        severity: shieldLife < 0.5 ? 'warning' : 'info',
        severityValue: Math.min(90, Math.round(80 - shieldLife * 20)),
        educationalTopic: 'anode-rod',
      });
    }
  }
  
  // Overdue maintenance
  if (currentInputs.lastFlushYearsAgo !== undefined && currentInputs.lastFlushYearsAgo > 2) {
    if (isReplacementRecommended) {
      findings.push({
        id: 'flush-overdue',
        icon: <Wrench className="w-5 h-5" />,
        title: 'Sediment Reduced Efficiency',
        measurement: `${currentInputs.lastFlushYearsAgo}+ years of buildup`,
        explanation: `Years of sediment buildup reduced efficiency by 15-30%. For your next water heater: schedule annual flushes.`,
        severity: 'info',
        severityValue: 45,
        educationalTopic: 'sediment',
      });
    } else {
      findings.push({
        id: 'flush-overdue',
        icon: <Wrench className="w-5 h-5" />,
        title: 'Sediment Buildup Likely',
        measurement: `${currentInputs.lastFlushYearsAgo}+ years since last flush`,
        explanation: `There's likely significant sediment at the tank bottom, reducing efficiency by 15-30%. A flush would help.`,
        severity: 'info',
        severityValue: Math.min(100, Math.round((currentInputs.lastFlushYearsAgo / 5) * 100)),
        educationalTopic: 'sediment',
      });
    }
  }
  
  // Add infrastructure violations
  violations.forEach(violation => {
    if (violation.id.includes('prv') && findings.some(f => f.id.includes('pressure'))) return;
    if (violation.id.includes('exp_tank') && findings.some(f => f.id === 'expansion-tank')) return;
    
    findings.push({
      id: violation.id,
      icon: <Shield className="w-5 h-5" />,
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
      icon: <CheckCircle2 className="w-5 h-5" />,
      title: 'System Appears Healthy',
      measurement: `Health Score: ${metrics.healthScore}`,
      explanation: 'No significant issues were detected during the assessment. Regular maintenance will help keep your system running efficiently.',
      severity: 'info',
      severityValue: 100 - metrics.healthScore,
    });
  }

  // Sort by severity and limit
  const sortedFindings = [...findings].sort((a, b) => b.severityValue - a.severityValue);
  const displayFindings = sortedFindings.slice(0, 5);

  // Get economic guidance
  const getEconomicGuidance = () => {
    const age = currentInputs.calendarAge;
    const bioAge = metrics.bioAge;
    const urgency = financial.budgetUrgency;
    
    if (verdict.action === 'REPLACE' || urgency === 'IMMEDIATE') {
      return {
        recommendation: 'REPLACE_NOW' as const,
        title: 'Replacement Is the Smart Move',
        timeframe: 'Within 1-3 months',
      };
    }
    
    if (urgency === 'HIGH' || (bioAge >= 10 && age >= 8)) {
      return {
        recommendation: 'REPLACE_SOON' as const,
        title: 'Start Planning Your Replacement',
        timeframe: financial.targetReplacementDate,
      };
    }
    
    const repairCosts = infrastructureIssues.reduce((sum, issue) => sum + (issue.costMin || 0), 0);
    const repairVsReplaceRatio = repairCosts / financial.estReplacementCost;
    
    if (repairCosts > 0 && repairVsReplaceRatio < 0.35) {
      return {
        recommendation: 'MAINTAIN' as const,
        title: 'Repairs Make Sense Right Now',
        timeframe: financial.targetReplacementDate,
      };
    }
    
    return {
      recommendation: 'MONITOR' as const,
      title: 'You\'re in Good Shape',
      timeframe: financial.targetReplacementDate,
    };
  };

  const economicGuidance = getEconomicGuidance();
  const showReplacementCost = economicGuidance.recommendation === 'REPLACE_NOW' || economicGuidance.recommendation === 'REPLACE_SOON';

  // Recommendation config
  const getRecommendationConfig = () => {
    switch (economicGuidance.recommendation) {
      case 'REPLACE_NOW':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-destructive/10 text-destructive',
          borderColor: 'border-destructive/40',
          badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
        };
      case 'REPLACE_SOON':
        return {
          icon: Clock,
          iconBg: 'bg-amber-500/10 text-amber-600',
          borderColor: 'border-amber-500/40',
          badgeClass: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        };
      default:
        return {
          icon: CheckCircle2,
          iconBg: 'bg-emerald-500/10 text-emerald-600',
          borderColor: 'border-emerald-500/40',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        };
    }
  };

  const recConfig = getRecommendationConfig();
  const RecommendationIcon = recConfig.icon;

  // Severity styling for accordion items
  const getSeverityStyles = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return { icon: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' };
      case 'warning':
        return { icon: 'bg-amber-500/10 text-amber-600', dot: 'bg-amber-500' };
      default:
        return { icon: 'bg-primary/10 text-primary', dot: 'bg-muted-foreground' };
    }
  };

  // Chatbot context
  const chatContext = {
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
    findings: displayFindings.map(f => ({
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
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-lg">Your Assessment</h1>
            <p className="text-sm text-muted-foreground">
              {currentInputs.manufacturer || 'Water Heater'} • {currentInputs.calendarAge} years old
            </p>
          </div>
        </div>
      </div>

      {/* Hero: The Recommendation */}
      <motion.section 
        className="px-4 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={cn("overflow-hidden border-2", recConfig.borderColor)}>
          <CardContent className="p-0">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-xl flex-shrink-0", recConfig.iconBg)}>
                  <RecommendationIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    {economicGuidance.title}
                  </h2>
                  <span className={cn(
                    "inline-flex px-3 py-1 text-xs font-medium rounded-full border",
                    recConfig.badgeClass
                  )}>
                    {economicGuidance.timeframe}
                  </span>
                </div>
              </div>
            </div>

            {/* Cost section for replacement recommendations */}
            {showReplacementCost && (
              <>
                <div className="mx-6 border-t border-border" />
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Estimated replacement
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      ${financial.estReplacementCost.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Unit + installation
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Budget suggestion for non-urgent */}
            {!showReplacementCost && financial.monthlyBudget > 0 && (
              <>
                <div className="mx-6 border-t border-border" />
                <div className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Budget suggestion
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Set aside <span className="font-semibold text-foreground">${financial.monthlyBudget}/month</span> for eventual replacement
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Equipment Summary */}
      <motion.section 
        className="px-4 pb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-muted-foreground">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {currentInputs.manufacturer || 'Unknown'} {currentInputs.tankCapacity ? `${currentInputs.tankCapacity}-gal` : ''} {currentInputs.fuelType?.replace('_', ' ') || 'Tank'}
              </p>
              <p className="text-xs text-muted-foreground">
                Health Score: {metrics.healthScore} • Bio-age: {metrics.bioAge.toFixed(1)} years
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Findings Cards */}
      <motion.section 
        className="px-4 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          {isReplacementRecommended ? 'What Contributed to Failure' : 'What We Found'}
        </h2>
        
        <div className="space-y-3">
          {displayFindings.map((finding, index) => {
            const borderColor = finding.severity === 'critical' 
              ? 'border-destructive/50' 
              : finding.severity === 'warning' 
                ? 'border-amber-500/50' 
                : 'border-border';
            
            const iconBg = finding.severity === 'critical'
              ? 'bg-destructive/10 text-destructive'
              : finding.severity === 'warning'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-primary/10 text-primary';
            
            return (
              <motion.div
                key={finding.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.08 }}
              >
                <Card className={cn("border-2", borderColor)}>
                  <CardContent className="p-4">
                    {/* Header with icon and title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn("p-2.5 rounded-xl flex-shrink-0", iconBg)}>
                        {finding.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {finding.title}
                        </h3>
                        {finding.measurement && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {finding.measurement}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Explanation - always visible */}
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {finding.explanation}
                    </p>
                    
                    {/* Learn more link */}
                    {finding.educationalTopic && (
                      <button 
                        onClick={() => setOpenTopic(finding.educationalTopic!)}
                        className="mt-3 text-sm text-primary hover:underline underline-offset-4 flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        Learn more about this
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4 safe-area-bottom">
        <div className="max-w-md mx-auto space-y-3">
          {/* Primary CTA based on recommendation */}
          {(isCritical || hasViolations || metrics.healthScore < 70 || showReplacementCost) ? (
            <Button
              onClick={onOptions}
              size="lg"
              className="w-full h-auto py-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="text-left">
                  <div className="font-semibold">See Replacement Options</div>
                  <div className="text-xs opacity-80">Compare units and pricing</div>
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
                  <div className="text-xs opacity-80">Keep your system running well</div>
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              </div>
            </Button>
          )}

          {/* Secondary actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowChatbot(true)}
              variant="outline"
              className="flex-1 h-auto py-2.5"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Ask AI</span>
            </Button>
            <Button
              onClick={showReplacementCost ? onMaintenance : onOptions}
              variant="outline"
              className="flex-1 h-auto py-2.5"
            >
              <Wrench className="w-4 h-4 mr-2" />
              <span className="text-sm">{showReplacementCost ? 'Maintenance' : 'Options'}</span>
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

      {/* Educational drawer */}
      {openTopic && (
        <EducationalDrawer
          topic={openTopic}
          isOpen={!!openTopic}
          onClose={() => setOpenTopic(null)}
        />
      )}

      {/* AI Chatbot */}
      <AnimatePresence>
        {showChatbot && (
          <WaterHeaterChatbot
            onClose={() => setShowChatbot(false)}
            context={chatContext}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
