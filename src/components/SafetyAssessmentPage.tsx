import { ArrowLeft, Droplets, Gauge, Thermometer, Layers, RefreshCw, Maximize2, Shield, ChevronRight, Check, Wind, Wrench, Flame, Zap, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  getStressFactorExplanations,
  DAMAGE_TYPE_INFO,
  DAMAGE_SCENARIOS,
  getDamageTypeFromReason,
  getLocationKey
} from '@/data/damageScenarios';
import { failProbToHealthScore, FuelType } from '@/lib/opterraAlgorithm';
import { getUnitTypeLabel, getContextualRecommendation as getUnitRecommendation, isTankless, isHybrid, getStressFactors } from '@/lib/unitTypeContent';
import { cn } from '@/lib/utils';

interface StressFactor {
  name: string;
  level: 'low' | 'moderate' | 'elevated' | 'critical';
  value: number;
  description: string;
}

interface SafetyAssessmentPageProps {
  onBack: () => void;
  onContinue: () => void;
  reason: string;
  location: string;
  stressFactors: StressFactor[];
  agingRate: number;
  bioAge: number;
  chronoAge: number;
  breachDetected?: boolean;
  isEconomicReplacement?: boolean;
  failProb: number;
  fuelType?: FuelType;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Gauge,
  Layers,
  Thermometer,
  Maximize2,
  RefreshCw,
  Shield,
  Droplets,
  Wind,
  Wrench,
  Flame,
  Zap,
  Cpu
};

// Generate contextual recommendation based on actual stress factor values and unit type
function getContextualRecommendation(stressor: StressFactor, factorKey: string | null, fuelType: FuelType): string {
  if (!factorKey) return '';
  
  const { level } = stressor;
  const isTanklessUnit = isTankless(fuelType);
  const isHybridUnit = isHybrid(fuelType);
  
  // Tankless-specific recommendations
  if (isTanklessUnit) {
    switch (factorKey) {
      case 'scale':
        if (level === 'critical') {
          return 'New unit with isolation valves for easy maintenance';
        }
        return 'Annual descaling to maintain efficiency';
      case 'flowRestriction':
        return 'Regular inlet filter cleaning included in maintenance';
      case 'isolationValves':
        return 'Isolation valves included with new installation';
      case 'igniterHealth':
      case 'flameRod':
        return 'Fresh ignition components in new unit';
      case 'ventStatus':
        return 'Proper venting verified during installation';
      case 'recirculationFatigue':
        return 'Timer or demand-based recirculation control';
      default:
        return '';
    }
  }
  
  // Hybrid-specific recommendations
  if (isHybridUnit) {
    switch (factorKey) {
      case 'airFilter':
        return 'Easy-access air filter for quarterly maintenance';
      case 'condensateDrain':
        return 'Clear condensate drain setup';
      case 'compressorHealth':
        return 'New high-efficiency compressor';
      // Fall through to tank recommendations for sediment/anode
    }
  }
  
  // Tank/default recommendations
  switch (factorKey) {
    case 'pressure':
      if (level === 'critical') {
        return `Install a Pressure Reducing Valve (PRV) set to 55-60 PSI`;
      }
      return `A PRV would protect your new unit from pressure stress`;
    
    case 'sediment':
      return 'Schedule annual tank flushes to prevent buildup';
    
    case 'temperature':
      return `Set new unit to 120°F for optimal efficiency`;
    
    case 'thermalExpansion':
      return `Ensure an expansion tank is installed`;
    
    case 'recirculation':
      return `Add a timer or demand pump to reduce wear`;
    
    case 'anodeDepletion':
      return `Replace the anode every 3-5 years`;
    
    case 'hardWater':
      return `Consider a water softener for the new unit`;
    
    default:
      return '';
  }
}

// Map stress factor names to keys - UNIT-TYPE AWARE
function getStressFactorKey(name: string, fuelType: FuelType): string | null {
  const lowerName = name.toLowerCase();
  const isTanklessUnit = isTankless(fuelType);
  const isHybridUnit = isHybrid(fuelType);
  
  // Tankless-specific mappings
  if (isTanklessUnit) {
    if (lowerName.includes('scale')) return 'scale';
    if (lowerName.includes('flow')) return 'flowRestriction';
    if (lowerName.includes('isolation') || lowerName.includes('valve')) return 'isolationValves';
    if (lowerName.includes('igniter')) return 'igniterHealth';
    if (lowerName.includes('flame')) return 'flameRod';
    if (lowerName.includes('vent')) return 'ventStatus';
    if (lowerName.includes('recirc')) return 'recirculationFatigue';
  }
  
  // Hybrid-specific mappings
  if (isHybridUnit) {
    if (lowerName.includes('air filter') || lowerName.includes('filter')) return 'airFilter';
    if (lowerName.includes('condensate')) return 'condensateDrain';
    if (lowerName.includes('compressor')) return 'compressorHealth';
  }
  
  // Tank/common mappings
  if (lowerName.includes('pressure')) return 'pressure';
  if (lowerName.includes('sediment') || lowerName.includes('hardite')) return 'sediment';
  if (lowerName.includes('temp')) return 'temperature';
  if (lowerName.includes('expansion') || lowerName.includes('thermal')) return 'thermalExpansion';
  if (lowerName.includes('recirc') || lowerName.includes('loop')) return 'recirculation';
  if (lowerName.includes('anode')) return 'anodeDepletion';
  if (lowerName.includes('hard') || lowerName.includes('mineral')) return 'hardWater';
  return null;
}

// Get explanation for tankless lockout scenarios
function getTanklessLockoutExplanation(reason: string, fuelType: FuelType): string | null {
  if (!isTankless(fuelType)) return null;
  
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('scale lockout') || lowerReason.includes('blocked')) {
    return "The heat exchanger has over 40% scale buildup. Attempting to descale now risks creating pinhole leaks. Replacement is the safe option.";
  }
  if (lowerReason.includes('isolation') || lowerReason.includes('valve') || lowerReason.includes('cannot be serviced')) {
    return "This unit was installed without isolation valves, making it impossible to flush. A new installation will include proper service access.";
  }
  if (lowerReason.includes('vent')) {
    return "Blocked exhaust venting creates a carbon monoxide hazard. The unit should not be operated until resolved.";
  }
  return null;
}

// Use the same status labels as the dashboard HealthGauge
function getStatusLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Good Condition', color: 'text-emerald-400' };
  if (score >= 50) return { label: 'Needs Attention', color: 'text-amber-400' };
  if (score >= 30) return { label: 'On Borrowed Time', color: 'text-orange-400' };
  return { label: 'Critical', color: 'text-destructive' };
}

export function SafetyAssessmentPage({
  onBack,
  onContinue,
  reason,
  location,
  stressFactors,
  agingRate,
  bioAge,
  chronoAge,
  breachDetected = false,
  isEconomicReplacement = false,
  failProb,
  fuelType = 'GAS',
}: SafetyAssessmentPageProps) {
  const locationKey = getLocationKey(location);
  const damageScenario = DAMAGE_SCENARIOS[locationKey];
  const damageType = getDamageTypeFromReason(reason);
  const damageInfo = DAMAGE_TYPE_INFO[damageType];

  // Filter to elevated or critical stress factors
  const significantStressors = stressFactors.filter(
    sf => sf.level === 'elevated' || sf.level === 'critical'
  );

  const agingMultiple = agingRate.toFixed(1);
  const isSafetyCritical = !isEconomicReplacement;
  
  // Use the SAME health score calculation as dashboard (failProbToHealthScore)
  const healthScore = failProbToHealthScore(failProb);
  const status = getStatusLabel(healthScore);

  // Get explanation text based on situation
  const tanklessLockoutExplanation = getTanklessLockoutExplanation(reason, fuelType);
  
  const getExplanationText = () => {
    // If we have a specific tankless lockout explanation, use it
    if (tanklessLockoutExplanation) {
      return tanklessLockoutExplanation;
    }
    
    if (isSafetyCritical) {
      return `We've detected signs that make continuing to run this unit risky. Your safety comes first.`;
    }
    return `At ${Math.round(bioAge)} biological years, repairs would cost more than the life they'd add. The math just doesn't work in your favor anymore.`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Minimal Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-3 px-4">
        <div className="flex items-center max-w-md mx-auto">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="relative px-4 pt-6 pb-32 max-w-md mx-auto">
        {/* Soft Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground">Here's what we found</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Let's walk through what's happening with your system
          </p>
        </div>

        {/* Mini Health Gauge Mirror */}
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-4">
            {/* Score and Status */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-foreground">{healthScore}</div>
                <div className="text-sm text-muted-foreground">/100</div>
              </div>
              <span className={`text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            
            {/* Health Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all ${
                  healthScore >= 70 ? 'bg-emerald-500' :
                  healthScore >= 50 ? 'bg-amber-500' :
                  healthScore >= 30 ? 'bg-orange-500' :
                  'bg-destructive'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className={cn(
                  "text-xl font-bold",
                  bioAge > chronoAge + 5 ? "text-destructive" : bioAge > chronoAge + 2 ? "text-amber-600" : "text-foreground"
                )}>
                  {bioAge > chronoAge + 5 ? 'High' : bioAge > chronoAge + 2 ? 'Elevated' : 'Normal'}
                </p>
                <p className="text-xs text-muted-foreground">Wear Level</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className={cn(
                  "text-xl font-bold",
                  agingRate > 1.8 ? "text-destructive" : agingRate > 1.3 ? "text-amber-600" : "text-foreground"
                )}>
                  {agingRate > 1.8 ? 'High' : agingRate > 1.3 ? 'Elevated' : 'Normal'}
                </p>
                <p className="text-xs text-muted-foreground">Stress Factor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Replacement Makes Sense */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Why replacement makes sense
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {getExplanationText()}
          </p>
        </div>

        {/* What's Been Working Against Your Unit */}
        {significantStressors.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                What's been working against your unit:
              </h4>
              
              <ul className="space-y-3">
                {significantStressors.map((stressor, i) => {
                  const factorKey = getStressFactorKey(stressor.name, fuelType);
                  const stressFactorExplanations = getStressFactorExplanations(fuelType);
                  const factorInfo = factorKey ? stressFactorExplanations[factorKey as keyof typeof stressFactorExplanations] : null;
                  const IconComponent = factorInfo ? ICON_MAP[factorInfo.icon] || Gauge : Gauge;
                  const levelInfo = factorInfo?.[stressor.level as 'elevated' | 'critical'];

                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        stressor.level === 'critical' ? 'bg-destructive/10' : 'bg-amber-500/10'
                      }`}>
                        <IconComponent className={`h-4 w-4 ${
                          stressor.level === 'critical' ? 'text-destructive' : 'text-amber-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm text-foreground">
                          {factorInfo?.label || stressor.name}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {levelInfo?.description || stressor.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* What We'll Address */}
        {significantStressors.length > 0 && (
          <Card className="mb-4 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-3">
                What we'll address in your new unit:
              </h4>
              <ul className="space-y-2">
                {significantStressors.slice(0, 4).map((stressor, i) => {
                  const factorKey = getStressFactorKey(stressor.name, fuelType);
                  const recommendation = getContextualRecommendation(stressor, factorKey, fuelType);
                  
                  if (!recommendation) return null;

                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-foreground">{recommendation}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="max-w-md mx-auto">
          <Button
            onClick={onContinue}
            className="w-full h-14 text-base font-semibold"
          >
            <span>Plan My Upgrade</span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
