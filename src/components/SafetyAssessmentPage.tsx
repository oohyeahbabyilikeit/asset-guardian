import { ArrowLeft, AlertTriangle, Droplets, Gauge, Thermometer, Layers, RefreshCw, Maximize2, Shield, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import { 
  STRESS_FACTOR_EXPLANATIONS, 
  DAMAGE_TYPE_INFO,
  DAMAGE_SCENARIOS,
  getDamageTypeFromReason,
  getLocationKey
} from '@/data/damageScenarios';

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
}

const ICON_MAP: Record<string, React.ElementType> = {
  Gauge,
  Layers,
  Thermometer,
  Maximize2,
  RefreshCw,
  Shield,
  Droplets
};

// Generate contextual recommendation based on actual stress factor values
function getContextualRecommendation(stressor: StressFactor, factorKey: string | null): string {
  if (!factorKey) return '';
  
  const { level, value, description } = stressor;
  
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

function getStressFactorKey(name: string): keyof typeof STRESS_FACTOR_EXPLANATIONS | null {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('pressure')) return 'pressure';
  if (lowerName.includes('sediment') || lowerName.includes('hardite')) return 'sediment';
  if (lowerName.includes('temp')) return 'temperature';
  if (lowerName.includes('expansion') || lowerName.includes('thermal')) return 'thermalExpansion';
  if (lowerName.includes('recirc') || lowerName.includes('loop')) return 'recirculation';
  if (lowerName.includes('anode')) return 'anodeDepletion';
  if (lowerName.includes('hard') || lowerName.includes('mineral')) return 'hardWater';
  return null;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 tech-grid-bg opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />

      {/* Header */}
      <header className="relative bg-card/80 backdrop-blur-xl border-b border-border py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-foreground">
            {isSafetyCritical ? 'Assessment' : 'Upgrade Analysis'}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Hero Section */}
        <div className={`relative overflow-hidden rounded-2xl mb-6 ${
          isSafetyCritical 
            ? 'bg-gradient-to-br from-destructive/20 via-destructive/10 to-transparent border border-destructive/30'
            : 'bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30'
        }`}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                isSafetyCritical ? 'bg-destructive/20' : 'bg-amber-500/20'
              }`}>
                <AlertTriangle className={`w-8 h-8 ${
                  isSafetyCritical ? 'text-destructive' : 'text-amber-500'
                }`} />
              </div>
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${
                  isSafetyCritical ? 'text-destructive' : 'text-amber-500'
                }`}>
                  {isSafetyCritical ? damageInfo.title : 'Time to Upgrade'}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {isSafetyCritical 
                    ? damageInfo.description
                    : `Your water heater is aging at ${agingMultiple}x the normal rate and has a ${Math.round(failProb)}% failure probability.`
                  }
                </p>
              </div>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{Math.round(bioAge)}</p>
                <p className="text-xs text-muted-foreground">Biological Age</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{agingMultiple}x</p>
                <p className="text-xs text-muted-foreground">Aging Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Risk */}
        {isSafetyCritical && (
          <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Home className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Location Risk</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {damageScenario.description}
                  </p>
                  {breachDetected && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-2">
                      <Droplets className="h-4 w-4" />
                      Visual evidence documented
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Why This Is Happening */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4">
              Why This Is Happening
            </h4>
            
            {significantStressors.length > 0 ? (
              <ul className="space-y-4">
                {significantStressors.map((stressor, i) => {
                  const factorKey = getStressFactorKey(stressor.name);
                  const factorInfo = factorKey ? STRESS_FACTOR_EXPLANATIONS[factorKey] : null;
                  const IconComponent = factorInfo ? ICON_MAP[factorInfo.icon] || Gauge : Gauge;
                  const levelInfo = factorInfo?.[stressor.level as 'elevated' | 'critical'];

                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
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
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {levelInfo?.description || stressor.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Age and normal wear are the primary factors. After {chronoAge} years of service, the unit has reached its expected end of life.
              </p>
            )}
          </CardContent>
        </Card>

        {/* What We'll Address */}
        {significantStressors.length > 0 && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                Protecting Your Next Unit
              </h4>
              <ul className="space-y-2">
                {significantStressors.slice(0, 4).map((stressor, i) => {
                  const factorKey = getStressFactorKey(stressor.name);
                  const recommendation = getContextualRecommendation(stressor, factorKey);
                  
                  if (!recommendation) return null;

                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
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
            className={`w-full h-14 text-base font-semibold ${
              isSafetyCritical ? 'bg-destructive hover:bg-destructive/90' : ''
            }`}
          >
            <span>View Your Options</span>
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}