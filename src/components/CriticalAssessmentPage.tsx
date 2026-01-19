import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, ShieldAlert, Droplets, Gauge, ThermometerSun, Clock, MapPin, Zap, Phone, ChevronRight, Bell } from 'lucide-react';
import { HealthRing } from './HealthRing';
import { ForensicInputs, OpterraResult, isTankless } from '@/lib/opterraAlgorithm';
import { getInfrastructureIssues, InfrastructureIssue } from '@/lib/infrastructureIssues';
import { STRESS_FACTOR_EXPLANATIONS, getLocationKey } from '@/data/damageScenarios';
import { motion } from 'framer-motion';
import { IssueGuidanceDrawer } from './IssueGuidanceDrawer';
import { NotifyMeModal } from './NotifyMeModal';
import { toast } from 'sonner';

interface CriticalAssessmentPageProps {
  inputs: ForensicInputs;
  opterraResult: OpterraResult;
  onBack: () => void;
  onScheduleService?: () => void;
  onGetQuote?: () => void;
}

const ISSUE_ICONS: Record<string, React.ReactNode> = {
  exp_tank_required: <Droplets className="h-5 w-5" />,
  prv_critical: <Gauge className="h-5 w-5" />,
  prv_failed: <ShieldAlert className="h-5 w-5" />,
  prv_missing: <Gauge className="h-5 w-5" />,
  thermal_stress: <ThermometerSun className="h-5 w-5" />,
};

// Simple tappable issue card that opens the IssueGuidanceDrawer
const IssueCard: React.FC<{ 
  issue: InfrastructureIssue; 
  onTap: () => void;
}> = ({ issue, onTap }) => {
  const isViolation = issue.category === 'VIOLATION';
  const icon = ISSUE_ICONS[issue.id] || <AlertTriangle className="h-5 w-5" />;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      className={`w-full rounded-lg border-2 overflow-hidden text-left transition-all active:scale-[0.98] ${
        isViolation 
          ? 'border-destructive/50 bg-destructive/5 hover:bg-destructive/10' 
          : 'border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10'
      }`}
    >
      <div className="p-4 flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          isViolation ? 'bg-destructive/20 text-destructive' : 'bg-orange-500/20 text-orange-600'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              isViolation 
                ? 'bg-destructive/20 text-destructive' 
                : 'bg-orange-500/20 text-orange-600'
            }`}>
              {isViolation ? 'Code Violation' : 'Infrastructure Issue'}
            </span>
          </div>
          <h4 className="font-semibold mt-1">{issue.friendlyName}</h4>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {issue.description}
          </p>
          <span className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
            Tap to learn more <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export const CriticalAssessmentPage: React.FC<CriticalAssessmentPageProps> = ({
  inputs,
  opterraResult,
  onBack,
  onScheduleService,
  onGetQuote
}) => {
  const { metrics, verdict } = opterraResult;
  const issues = getInfrastructureIssues(inputs, metrics);
  const [selectedIssue, setSelectedIssue] = useState<InfrastructureIssue | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  
  // Get location-based info
  const locationKey = getLocationKey(inputs.location || 'GARAGE');
  const isHighRiskLocation = ['ATTIC', 'UTILITY_CLOSET', 'LIVING_AREA'].includes(locationKey);
  
  // Get significant stress factors (above 1.0)
  const { stressFactors } = metrics;
  const significantStressFactors = Object.entries(stressFactors)
    .filter(([key, value]) => typeof value === 'number' && value > 1.0 && key !== 'total')
    .map(([key, value]) => ({ name: key, multiplier: value as number }))
    .sort((a, b) => b.multiplier - a.multiplier);

  // Unit info for display
  const unitAge = inputs.calendarAge || 0;
  const manufacturer = inputs.manufacturer || 'Water Heater';
  const tankCapacity = inputs.tankCapacity || 50;
  const fuelType = inputs.fuelType || 'GAS';
  const isTanklessUnit = isTankless(fuelType);
  const unitTypeLabel = isTanklessUnit ? 'Tankless' : fuelType === 'HYBRID' ? 'Hybrid' : 'Tank';

  // Map stress factor keys to friendly names
  const stressFactorLabels: Record<string, string> = {
    mechanical: 'Mechanical Stress',
    chemical: 'Chemical Stress',
    pressure: 'High Pressure',
    corrosion: 'Corrosion',
    temp: 'Temperature Stress',
    tempMechanical: 'Thermal Cycling',
    tempChemical: 'Heat-Chemical Reaction',
    circ: 'Recirculation Wear',
    loop: 'Closed Loop Stress',
    sediment: 'Sediment Buildup',
    usageIntensity: 'Heavy Usage',
    undersizing: 'Undersized Unit'
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">Critical Assessment</h1>
            <p className="text-xs text-muted-foreground">Issues requiring attention</p>
          </div>
        </div>
      </div>

      {/* Hero Section with Red Gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-destructive/20 via-destructive/10 to-transparent" />
        <div className="relative px-4 pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            <HealthRing score={metrics.healthScore} size="lg" />
            <div className="mt-4">
              <h2 className="text-xl font-bold text-destructive">Critical Issues Found</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {unitAge > 0 ? `${unitAge}-Year-Old` : ''} {manufacturer} · {!isTanklessUnit && `${tankCapacity} Gal`} {unitTypeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 mt-4">
        {/* Issues List - Tappable cards */}
        {issues.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Tap to Learn More</h3>
            </div>
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard 
                  key={issue.id} 
                  issue={issue} 
                  onTap={() => setSelectedIssue(issue)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Location Risk */}
        {isHighRiskLocation && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-orange-500" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">High-Risk Location</h3>
            </div>
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-4">
                <p className="text-sm">
                  Your water heater is installed in a {(inputs.location || 'unknown').toLowerCase().replace('_', ' ')}, where a failure could cause significant damage to your home. This makes proactive attention even more important.
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Accelerated Wear */}
        {metrics.agingRate > 1.2 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-amber-500" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Accelerated Wear</h3>
            </div>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-amber-600">{metrics.agingRate.toFixed(1)}x</span>
                  </div>
                  <div>
                    <p className="font-medium">Aging Rate</p>
                    <p className="text-sm text-muted-foreground">
                      Your unit is wearing {((metrics.agingRate - 1) * 100).toFixed(0)}% faster than normal
                    </p>
                  </div>
                </div>
                
                {significantStressFactors.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-amber-500/20">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Contributing Factors</p>
                    <div className="space-y-2">
                      {significantStressFactors.slice(0, 4).map((sf, index) => {
                        const explanation = STRESS_FACTOR_EXPLANATIONS[sf.name as keyof typeof STRESS_FACTOR_EXPLANATIONS];
                        return (
                          <div key={index} className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{stressFactorLabels[sf.name] || sf.name}</p>
                              {explanation && (
                                <p className="text-xs text-muted-foreground">{explanation.elevated.description}</p>
                              )}
                            </div>
                            <span className="text-xs text-amber-600 font-medium ml-auto">
                              +{((sf.multiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* What This Means */}
        <section>
          <Card className="border-border bg-muted/30">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">What This Means</h4>
              <p className="text-sm text-muted-foreground">
                {verdict.action === 'REPLACE' 
                  ? "Based on our inspection, this unit should be replaced. Continuing to operate it increases the risk of unexpected failure and water damage."
                  : "These issues are putting unnecessary stress on your water heater. Addressing them now can help prevent premature failure and protect your home from water damage."
                }
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Fixed CTA - dual options */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border space-y-3">
        <Button 
          variant="outline"
          onClick={() => setShowNotifyModal(true)}
          className="w-full h-11 gap-2"
        >
          <Bell className="h-4 w-4" />
          Set a Reminder
        </Button>
        <Button 
          onClick={onScheduleService}
          className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
          size="lg"
        >
          <Phone className="h-5 w-5" />
          Have My Plumber Reach Out
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Your plumber will contact you to discuss your options
        </p>
      </div>

      {/* Issue Guidance Drawer - unified education experience */}
      <IssueGuidanceDrawer
        open={!!selectedIssue}
        onOpenChange={(open) => !open && setSelectedIssue(null)}
        issue={selectedIssue}
        inputs={inputs}
        metrics={metrics}
        recommendation={verdict}
        healthScore={metrics.healthScore}
        manufacturer={inputs.manufacturer}
        onScheduleService={onScheduleService}
        onGetQuote={onGetQuote}
      />
      
      {/* Notify Me Modal */}
      <NotifyMeModal
        open={showNotifyModal}
        onOpenChange={setShowNotifyModal}
        tasks={issues.map(issue => ({
          id: issue.id,
          label: issue.friendlyName,
          dueDate: new Date(),
        }))}
      />
    </div>
  );
};
