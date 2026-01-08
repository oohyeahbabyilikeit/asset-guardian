import React from 'react';
import { 
  AlertTriangle, 
  Droplets, 
  Clock, 
  DollarSign, 
  Shield, 
  Gauge, 
  Thermometer, 
  Layers, 
  RefreshCw, 
  Maximize2,
  ChevronDown,
  ChevronUp,
  Zap,
  Home,
  FileWarning,
  Wrench
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DAMAGE_SCENARIOS, 
  STRESS_FACTOR_EXPLANATIONS, 
  DAMAGE_TYPE_INFO,
  INSURANCE_WARNINGS,
  getDamageTypeFromReason,
  getLocationKey
} from '@/data/damageScenarios';

interface StressFactor {
  name: string;
  level: 'low' | 'moderate' | 'elevated' | 'critical';
  value: number;
  description: string;
}

interface SafetyReplacementAlertProps {
  reason: string;
  location: string;
  stressFactors: StressFactor[];
  agingRate: number;
  bioAge: number;
  chronoAge: number;
  breachDetected?: boolean;
  className?: string;
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

export function SafetyReplacementAlert({
  reason,
  location,
  stressFactors,
  agingRate,
  bioAge,
  chronoAge,
  breachDetected = false,
  className = ''
}: SafetyReplacementAlertProps) {
  const [damageOpen, setDamageOpen] = React.useState(false);
  const [stressOpen, setStressOpen] = React.useState(true);
  const [preventionOpen, setPreventionOpen] = React.useState(false);

  const damageType = getDamageTypeFromReason(reason);
  const damageInfo = DAMAGE_TYPE_INFO[damageType];
  const locationKey = getLocationKey(location);
  const damageScenario = DAMAGE_SCENARIOS[locationKey];

  // Filter to elevated or critical stress factors
  const significantStressors = stressFactors.filter(
    sf => sf.level === 'elevated' || sf.level === 'critical'
  );

  // Get remediation advice for significant stressors
  const getStressFactorKey = (name: string): keyof typeof STRESS_FACTOR_EXPLANATIONS | null => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pressure')) return 'pressure';
    if (lowerName.includes('sediment') || lowerName.includes('hardite')) return 'sediment';
    if (lowerName.includes('temp')) return 'temperature';
    if (lowerName.includes('expansion') || lowerName.includes('thermal')) return 'thermalExpansion';
    if (lowerName.includes('recirc') || lowerName.includes('loop')) return 'recirculation';
    if (lowerName.includes('anode')) return 'anodeDepletion';
    if (lowerName.includes('hard') || lowerName.includes('mineral')) return 'hardWater';
    return null;
  };

  const agingMultiple = agingRate.toFixed(1);
  const yearsAccelerated = bioAge - chronoAge;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Section A: Immediate Danger Alert */}
      <Card className="border-destructive/50 bg-destructive/5 overflow-hidden">
        <div className="bg-destructive/10 px-4 py-3 border-b border-destructive/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-destructive text-lg">
                  {damageInfo.title}
                </h3>
                <Badge variant="destructive" className="uppercase text-xs font-bold">
                  {damageInfo.urgency}
                </Badge>
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                {damageInfo.description}
              </p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-destructive" />
              <span className="font-medium">Action Window:</span>
              <span className="text-destructive font-bold">{damageInfo.timeframe}</span>
            </div>
          </div>
          
          {breachDetected && (
            <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium text-destructive flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Visual evidence of water/corrosion has been documented
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section B: Potential Damage Consequences */}
      <Collapsible open={damageOpen} onOpenChange={setDamageOpen}>
        <Card className="border-orange-500/30 overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-4 py-3 bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-orange-500/20">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">What's At Risk</h4>
                  <p className="text-xs text-muted-foreground">
                    {location} location • ${damageScenario.waterDamage.min.toLocaleString()}-${damageScenario.waterDamage.max.toLocaleString()} potential damage
                  </p>
                </div>
              </div>
              {damageOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Primary damage description */}
              <div className="p-3 bg-orange-500/5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{damageScenario.description}</p>
                    <p className="text-xs text-orange-600 mt-1 font-medium">{damageScenario.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Secondary risks */}
              <div>
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Secondary Damage Risks
                </h5>
                <ul className="grid grid-cols-1 gap-1.5">
                  {damageScenario.secondaryRisks.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Insurance warnings */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-muted-foreground" />
                  Insurance Considerations
                </h5>
                <ul className="space-y-1">
                  {INSURANCE_WARNINGS.slice(0, 3).map((warning, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section C: What Caused This Condition */}
      <Collapsible open={stressOpen} onOpenChange={setStressOpen}>
        <Card className="border-blue-500/30 overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-4 py-3 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Gauge className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Why This Happened</h4>
                  <p className="text-xs text-muted-foreground">
                    Aging at {agingMultiple}x normal rate • {significantStressors.length} stress factor{significantStressors.length !== 1 ? 's' : ''} identified
                  </p>
                </div>
              </div>
              {stressOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-4">
              {/* Aging rate summary */}
              <div className="p-3 bg-blue-500/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Accelerated Aging Impact</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-500/50">
                    +{yearsAccelerated.toFixed(1)} years
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your {chronoAge}-year-old unit has the wear equivalent of a {bioAge.toFixed(0)}-year-old unit 
                  due to operating conditions.
                </p>
              </div>

              {/* Individual stress factors */}
              {significantStressors.length > 0 ? (
                <div className="space-y-3">
                  {significantStressors.map((stressor, i) => {
                    const factorKey = getStressFactorKey(stressor.name);
                    const factorInfo = factorKey ? STRESS_FACTOR_EXPLANATIONS[factorKey] : null;
                    const IconComponent = factorInfo ? ICON_MAP[factorInfo.icon] || Gauge : Gauge;
                    const levelInfo = factorInfo?.[stressor.level as 'elevated' | 'critical'];

                    return (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${
                          stressor.level === 'critical' 
                            ? 'bg-destructive/5 border-destructive/30' 
                            : 'bg-amber-500/5 border-amber-500/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-full ${
                            stressor.level === 'critical' ? 'bg-destructive/20' : 'bg-amber-500/20'
                          }`}>
                            <IconComponent className={`h-4 w-4 ${
                              stressor.level === 'critical' ? 'text-destructive' : 'text-amber-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {factorInfo?.label || stressor.name}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`text-xs uppercase ${
                                  stressor.level === 'critical' 
                                    ? 'text-destructive border-destructive/50' 
                                    : 'text-amber-600 border-amber-500/50'
                                }`}
                              >
                                {stressor.level}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {levelInfo?.description || stressor.description}
                            </p>
                            {levelInfo?.impact && (
                              <p className={`text-xs font-medium mt-1 ${
                                stressor.level === 'critical' ? 'text-destructive' : 'text-amber-600'
                              }`}>
                                Impact: {levelInfo.impact}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Age and normal wear are the primary factors in this unit's condition.
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Section D: Protecting Your New Installation */}
      <Collapsible open={preventionOpen} onOpenChange={setPreventionOpen}>
        <Card className="border-emerald-500/30 overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between px-4 py-3 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-500/20">
                  <Shield className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-foreground">Protect Your New Unit</h4>
                  <p className="text-xs text-muted-foreground">
                    Recommendations to extend your next water heater's life
                  </p>
                </div>
              </div>
              {preventionOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-3">
              {significantStressors.length > 0 ? (
                <>
                  {significantStressors.map((stressor, i) => {
                    const factorKey = getStressFactorKey(stressor.name);
                    const factorInfo = factorKey ? STRESS_FACTOR_EXPLANATIONS[factorKey] : null;
                    
                    if (!factorInfo) return null;
                    
                    const IconComponent = ICON_MAP[factorInfo.icon] || Wrench;

                    return (
                      <div key={i} className="p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-medium text-sm">{factorInfo.label}</span>
                              <Badge variant="outline" className="text-emerald-600 border-emerald-500/50 text-xs">
                                {factorInfo.lifespanBenefit} lifespan
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {factorInfo.remedy}
                            </p>
                            <p className="text-xs text-emerald-600 mt-1">
                              Est. cost: {factorInfo.remedyCost}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Summary */}
                  <div className="p-3 bg-emerald-500/10 rounded-lg mt-2">
                    <p className="text-sm font-medium text-emerald-700">
                      Following these recommendations could extend your new unit's life from 8 years to 12+ years
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-emerald-500/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Standard maintenance practices should keep your new unit healthy. 
                    Schedule annual inspections and flush the tank every 1-2 years.
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
