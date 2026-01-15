import { ArrowLeft, AlertTriangle, Info, ChevronRight, Wrench, Sparkles, AlertCircle, Shield, Gauge, Droplets, Clock, ThermometerSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EducationalDrawer, EducationalTopic } from '@/components/EducationalDrawer';
import { ForensicInputs, OpterraResult } from '@/lib/opterraAlgorithm';
import { InfrastructureIssue, getIssuesByCategory } from '@/lib/infrastructureIssues';
import { useState } from 'react';

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
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'Active Leak Detected',
      measurement: currentInputs.leakSource ? `Source: ${currentInputs.leakSource}` : undefined,
      explanation: 'Water damage can occur quickly and may affect surrounding areas. This should be addressed immediately to prevent further damage.',
      severity: 'critical',
    });
  }
  
  // Critical pressure issues (>80 PSI)
  if (currentInputs.housePsi > 80) {
    findings.push({
      id: 'pressure-critical',
      icon: <Gauge className="w-5 h-5" />,
      title: 'Critical Water Pressure',
      measurement: `${currentInputs.housePsi} PSI measured`,
      explanation: 'Pressure above 80 PSI exceeds safe limits and puts significant stress on pipes, valves, and appliances. This can lead to premature failures and water damage.',
      severity: 'critical',
      educationalTopic: 'pressure',
    });
  } else if (currentInputs.housePsi >= 70) {
    // High but not critical pressure
    findings.push({
      id: 'pressure-high',
      icon: <Gauge className="w-5 h-5" />,
      title: 'Elevated Water Pressure',
      measurement: `${currentInputs.housePsi} PSI measured`,
      explanation: 'While technically within limits, pressure above 70 PSI increases wear on your plumbing system over time. A pressure regulating valve can extend appliance life.',
      severity: 'warning',
      educationalTopic: 'pressure',
    });
  }
  
  // Missing expansion tank in closed system
  const isClosedSystem = currentInputs.isClosedLoop || currentInputs.hasPrv || currentInputs.hasCircPump;
  if (isClosedSystem && !currentInputs.hasExpTank) {
    findings.push({
      id: 'expansion-tank',
      icon: <ThermometerSun className="w-5 h-5" />,
      title: 'Thermal Expansion Not Managed',
      explanation: 'Your home has a closed plumbing system, but no expansion tank is installed. When water heats up, it expands—without somewhere to go, this creates pressure spikes that stress your tank.',
      severity: 'warning',
      educationalTopic: 'thermal-expansion',
    });
  }
  
  // Hard water issues
  if (currentInputs.hardnessGPG > 15) {
    findings.push({
      id: 'hardness-critical',
      icon: <Droplets className="w-5 h-5" />,
      title: 'Very Hard Water',
      measurement: `${currentInputs.hardnessGPG} GPG hardness`,
      explanation: 'High mineral content causes significant scale buildup on heating elements and tank surfaces. This reduces efficiency, increases energy costs, and can substantially shorten equipment lifespan.',
      severity: 'warning',
      educationalTopic: 'hardness',
    });
  } else if (currentInputs.hardnessGPG > 10) {
    findings.push({
      id: 'hardness-moderate',
      icon: <Droplets className="w-5 h-5" />,
      title: 'Hard Water Detected',
      measurement: `${currentInputs.hardnessGPG} GPG hardness`,
      explanation: 'Moderate mineral content in your water will cause scale buildup over time. This can affect heating efficiency and shorten equipment lifespan without proper maintenance.',
      severity: 'info',
      educationalTopic: 'hardness',
    });
  }
  
  // Aging unit
  if (currentInputs.calendarAge >= 10) {
    findings.push({
      id: 'aging',
      icon: <Clock className="w-5 h-5" />,
      title: 'Unit Approaching End of Life',
      measurement: `${currentInputs.calendarAge} years old`,
      explanation: `Most water heaters are designed for 8-12 years of service. At ${currentInputs.calendarAge} years, your unit has exceeded the typical lifespan. Failure rates increase significantly with age.`,
      severity: currentInputs.calendarAge >= 12 ? 'warning' : 'info',
      educationalTopic: 'aging',
    });
  } else if (metrics.bioAge >= 10) {
    findings.push({
      id: 'bio-age',
      icon: <Clock className="w-5 h-5" />,
      title: 'Accelerated Wear Detected',
      measurement: `Bio-age: ${metrics.bioAge.toFixed(1)} years`,
      explanation: 'Based on your water conditions and maintenance history, your unit shows more wear than its calendar age would suggest. Environmental factors are accelerating the aging process.',
      severity: 'warning',
      educationalTopic: 'aging',
    });
  }
  
  // Visual rust
  if (currentInputs.visualRust) {
    findings.push({
      id: 'rust',
      icon: <AlertTriangle className="w-5 h-5" />,
      title: 'Corrosion Visible',
      explanation: 'Visible rust indicates the tank\'s protective lining may be compromised. Once corrosion begins on the outside, internal conditions are often worse. This is typically a sign of approaching failure.',
      severity: 'warning',
      educationalTopic: 'anode-rod',
    });
  }
  
  // Overdue maintenance
  if (currentInputs.lastFlushYearsAgo !== undefined && currentInputs.lastFlushYearsAgo > 2) {
    findings.push({
      id: 'flush-overdue',
      icon: <Wrench className="w-5 h-5" />,
      title: 'Maintenance Overdue',
      measurement: `Last flush: ${currentInputs.lastFlushYearsAgo}+ years ago`,
      explanation: 'Annual flushing removes sediment that accumulates at the bottom of your tank. Sediment buildup reduces efficiency and can cause premature heating element failure.',
      severity: 'info',
      educationalTopic: 'sediment',
    });
  }
  
  // Add infrastructure violations as findings
  violations.forEach(violation => {
    // Skip if we already have a more specific finding for this
    if (violation.id.includes('prv') && findings.some(f => f.id.includes('pressure'))) return;
    if (violation.id.includes('exp_tank') && findings.some(f => f.id === 'expansion-tank')) return;
    
    findings.push({
      id: violation.id,
      icon: <Shield className="w-5 h-5" />,
      title: violation.name,
      explanation: violation.description,
      severity: 'warning',
    });
  });
  
  // If no specific findings, show general health status
  if (findings.length === 0) {
    findings.push({
      id: 'healthy',
      icon: <Info className="w-5 h-5" />,
      title: 'System Appears Healthy',
      measurement: `Health Score: ${metrics.healthScore}`,
      explanation: 'No significant issues were detected during the assessment. Regular maintenance will help keep your system running efficiently.',
      severity: 'info',
    });
  }

  const getSeverityStyles = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'border-red-500/30 bg-red-500/5';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'info':
      default:
        return 'border-border bg-card';
    }
  };

  const getSeverityIconColor = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'warning':
        return 'text-amber-500';
      case 'info':
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
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
            <h1 className="font-semibold text-lg">Here's What We Found</h1>
            <p className="text-sm text-muted-foreground">Let's walk through what this means for your home</p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
          <span>Understanding Your Results</span>
        </div>
      </div>

      {/* Findings List */}
      <div className="px-4 py-6 space-y-4">
        {findings.map((finding) => (
          <Card 
            key={finding.id} 
            className={`border ${getSeverityStyles(finding.severity)}`}
          >
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className={`mt-0.5 ${getSeverityIconColor(finding.severity)}`}>
                  {finding.icon}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-medium text-foreground">{finding.title}</h3>
                    {finding.measurement && (
                      <p className="text-sm text-muted-foreground">{finding.measurement}</p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {finding.explanation}
                  </p>
                  {finding.educationalTopic && (
                    <EducationalDrawer topic={finding.educationalTopic}>
                      <button className="text-sm text-primary hover:underline underline-offset-4 flex items-center gap-1">
                        Learn more about this
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </EducationalDrawer>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What This Means Summary */}
      <div className="px-4 pb-6">
        <Card className="bg-muted/30 border-muted">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              What This Means For You
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isCritical || isLeaking ? (
                "Based on our assessment, your system needs immediate attention. We recommend reviewing your options to understand the best path forward for your situation."
              ) : hasViolations ? (
                "We found some issues that should be addressed to protect your plumbing system. You have options ranging from basic maintenance to comprehensive protection."
              ) : metrics.healthScore < 50 ? (
                "Your system is showing signs of wear. Understanding your options now helps you plan ahead—whether that's maintenance to extend life or exploring replacement when you're ready."
              ) : (
                "Your system is in reasonable condition. Regular maintenance will help it last longer. You can explore options whenever you're ready, or simply stick with your current maintenance plan."
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Pathways - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4 safe-area-bottom">
        <div className="max-w-md mx-auto space-y-3">
          {/* Primary: See Options (if issues exist) or Maintenance (if healthy) */}
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

          {/* Secondary options */}
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
              className="flex-1 h-auto py-2.5 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              <span className="text-sm">Emergency</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Educational drawer for opened topic */}
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
