import React from 'react';
import { 
  AlertTriangle, 
  Droplets, 
  Shield, 
  Gauge, 
  Thermometer, 
  Layers, 
  RefreshCw, 
  Maximize2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  STRESS_FACTOR_EXPLANATIONS, 
  DAMAGE_TYPE_INFO,
  getDamageTypeFromReason
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
  stressFactors,
  agingRate,
  breachDetected = false,
  className = ''
}: SafetyReplacementAlertProps) {
  const damageType = getDamageTypeFromReason(reason);
  const damageInfo = DAMAGE_TYPE_INFO[damageType];

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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Danger Header */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-destructive/20 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-bold text-destructive text-lg">
                {damageInfo.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {damageInfo.description}
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

      {/* Why This Happened + Prevention */}
      <Card>
        <CardContent className="p-4 space-y-5">
          {/* Why This Happened */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
              Why This Happened
            </h4>
            <p className="text-sm text-foreground mb-4">
              Your unit has been aging at <span className="font-semibold">{agingMultiple}x</span> the normal rate due to:
            </p>
            
            {significantStressors.length > 0 ? (
              <ul className="space-y-3">
                {significantStressors.map((stressor, i) => {
                  const factorKey = getStressFactorKey(stressor.name);
                  const factorInfo = factorKey ? STRESS_FACTOR_EXPLANATIONS[factorKey] : null;
                  const IconComponent = factorInfo ? ICON_MAP[factorInfo.icon] || Gauge : Gauge;
                  const levelInfo = factorInfo?.[stressor.level as 'elevated' | 'critical'];

                  return (
                    <li key={i} className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="font-medium text-sm">
                          {factorInfo?.label || stressor.name}
                        </span>
                        <p className="text-sm text-muted-foreground">
                          {levelInfo?.description || stressor.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Age and normal wear are the primary factors.
              </p>
            )}
          </div>

          {/* Divider */}
          {significantStressors.length > 0 && (
            <>
              <div className="border-t border-border" />

              {/* Protecting Your Next Unit */}
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                  Protecting Your Next Unit
                </h4>
                <ul className="space-y-2">
                  {significantStressors.map((stressor, i) => {
                    const factorKey = getStressFactorKey(stressor.name);
                    const factorInfo = factorKey ? STRESS_FACTOR_EXPLANATIONS[factorKey] : null;
                    
                    if (!factorInfo) return null;

                    return (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-600 mt-1">•</span>
                        <span>{factorInfo.remedy}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
