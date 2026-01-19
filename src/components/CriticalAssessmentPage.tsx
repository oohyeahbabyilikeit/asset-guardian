import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, ShieldAlert, Droplets, Gauge, ThermometerSun, ChevronDown, ChevronUp, Clock, MapPin, Zap, Phone } from 'lucide-react';
import { HealthRing } from './HealthRing';
import { ForensicInputs, OpterraResult, isTankless } from '@/lib/opterraAlgorithm';
import { getInfrastructureIssues, InfrastructureIssue } from '@/lib/infrastructureIssues';
import { DAMAGE_SCENARIOS, STRESS_FACTOR_EXPLANATIONS, getLocationKey } from '@/data/damageScenarios';
import { motion, AnimatePresence } from 'framer-motion';

interface CriticalAssessmentPageProps {
  inputs: ForensicInputs;
  opterraResult: OpterraResult;
  onBack: () => void;
  onScheduleService?: () => void;
}

const ISSUE_EDUCATION: Record<string, { title: string; description: string; consequence: string; icon: React.ReactNode }> = {
  exp_tank_required: {
    title: "Missing Expansion Tank",
    description: "When water heats up, it expands. Without an expansion tank, this pressure has nowhere to go, stressing your tank and T&P valve with every heating cycle.",
    consequence: "Can cause premature tank failure, T&P valve leaks, and potential flooding.",
    icon: <Droplets className="h-5 w-5" />
  },
  prv_critical: {
    title: "Dangerous Water Pressure",
    description: "Your water pressure exceeds safe limits (above 80 PSI). This puts constant stress on your water heater, plumbing fixtures, and appliances.",
    consequence: "Dramatically shortens equipment life and increases risk of sudden failure.",
    icon: <Gauge className="h-5 w-5" />
  },
  prv_failed: {
    title: "Failed Pressure Reducing Valve",
    description: "Your PRV is no longer functioning properly, allowing high street pressure into your home's plumbing system.",
    consequence: "All water-using appliances are at risk. Immediate replacement recommended.",
    icon: <ShieldAlert className="h-5 w-5" />
  },
  prv_missing: {
    title: "No Pressure Protection",
    description: "Your home has no pressure reducing valve to protect against high street pressure, which can spike above 100 PSI.",
    consequence: "Equipment wears out faster and is more likely to fail catastrophically.",
    icon: <Gauge className="h-5 w-5" />
  },
  thermal_stress: {
    title: "Thermal Expansion Stress",
    description: "Your closed-loop plumbing system traps expanding water with nowhere to go, creating pressure spikes up to 150+ PSI with each heating cycle.",
    consequence: "T&P valve cycling, tank stress, and potential pressure relief discharge.",
    icon: <ThermometerSun className="h-5 w-5" />
  }
};

const IssueCard: React.FC<{ issue: InfrastructureIssue }> = ({ issue }) => {
  const [expanded, setExpanded] = useState(false);
  const education = ISSUE_EDUCATION[issue.id] || {
    title: issue.name,
    description: issue.description,
    consequence: "May affect unit performance and lifespan.",
    icon: <AlertTriangle className="h-5 w-5" />
  };

  const isViolation = issue.category === 'VIOLATION';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-2 overflow-hidden ${
        isViolation 
          ? 'border-destructive/50 bg-destructive/5' 
          : 'border-orange-500/50 bg-orange-500/5'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left flex items-start gap-3"
      >
        <div className={`p-2 rounded-full ${
          isViolation ? 'bg-destructive/20 text-destructive' : 'bg-orange-500/20 text-orange-600'
        }`}>
          {education.icon}
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
          <h4 className="font-semibold mt-1">{education.title}</h4>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {issue.description}
          </p>
        </div>
        <div className="text-muted-foreground">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/50">
              <div className="mt-3 space-y-3">
                <div>
                  <h5 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Why This Matters</h5>
                  <p className="text-sm">{education.description}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h5 className="text-xs font-semibold uppercase text-destructive mb-1">Potential Consequence</h5>
                  <p className="text-sm text-destructive/90">{education.consequence}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const CriticalAssessmentPage: React.FC<CriticalAssessmentPageProps> = ({
  inputs,
  opterraResult,
  onBack,
  onScheduleService
}) => {
  const { metrics, verdict } = opterraResult;
  const issues = getInfrastructureIssues(inputs, metrics);
  
  // Get location-based damage scenario
  const locationKey = getLocationKey(inputs.location || 'GARAGE');
  const damageScenario = DAMAGE_SCENARIOS[locationKey];
  
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
        {/* Issues List */}
        {issues.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold text-sm uppercase tracking-wide">Issues Requiring Attention</h3>
            </div>
            <div className="space-y-3">
              {issues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* Location Risk */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-4 w-4 text-orange-500" />
            <h3 className="font-semibold text-sm uppercase tracking-wide">Location Risk: {inputs.location || 'Unknown'}</h3>
          </div>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4">
              <p className="text-sm">
                {damageScenario.description}
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Estimated Damage</p>
                  <p className="font-bold text-orange-600">
                    ${damageScenario.waterDamage.min.toLocaleString()} - ${damageScenario.waterDamage.max.toLocaleString()}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="font-medium text-orange-600 text-sm">{damageScenario.timeline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

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
                  ? "Based on our analysis, this unit has reached the end of its safe, reliable service life. Continuing to operate it increases the risk of unexpected failure and potential water damage."
                  : "These issues are putting unnecessary stress on your water heater. Addressing them now can help prevent premature failure and protect your home from water damage."
                }
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border">
        <Button 
          onClick={onScheduleService}
          className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          size="lg"
        >
          <Phone className="h-5 w-5 mr-2" />
          Get Expert Assessment
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Speak with a professional about your options
        </p>
      </div>
    </div>
  );
};
