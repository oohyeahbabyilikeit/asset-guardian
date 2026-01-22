import { Zap, Droplets, RefreshCw, FlaskConical, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnodeBurnFactors } from '@/lib/opterraTypes';

interface BurnFactor {
  key: keyof AnodeBurnFactors;
  label: string;
  multiplier: string;
  description: string;
  icon: React.ReactNode;
}

const BURN_FACTOR_CONFIG: BurnFactor[] = [
  {
    key: 'softener',
    label: 'Water Softener',
    multiplier: '3.0×',
    description: 'Soft water is highly conductive, dissolving anode faster',
    icon: <Droplets className="w-3.5 h-3.5" />,
  },
  {
    key: 'galvanic',
    label: 'Direct Copper Connection',
    multiplier: '2.5×',
    description: 'Copper-to-steel creates electrochemical cell',
    icon: <Zap className="w-3.5 h-3.5" />,
  },
  {
    key: 'recircPump',
    label: 'Recirculation Pump',
    multiplier: '1.25×',
    description: 'Turbulence prevents protective passivation layer',
    icon: <RefreshCw className="w-3.5 h-3.5" />,
  },
  {
    key: 'chloramine',
    label: 'Chloramine Water',
    multiplier: '1.2×',
    description: 'More aggressive than chlorine sanitization',
    icon: <FlaskConical className="w-3.5 h-3.5" />,
  },
];

interface AnodeBurnFactorsDisplayProps {
  burnFactors: AnodeBurnFactors;
  burnRate: number;
  className?: string;
  compact?: boolean;
}

/**
 * AnodeBurnFactorsDisplay - Shows active burn rate factors for anode depletion transparency
 * 
 * Helps users understand WHY their anode depleted faster than expected by
 * displaying the specific environmental factors (softener, copper, recirc, chloramine)
 * that accelerated consumption.
 */
export function AnodeBurnFactorsDisplay({ 
  burnFactors, 
  burnRate, 
  className,
  compact = false 
}: AnodeBurnFactorsDisplayProps) {
  // Get active factors
  const activeFactors = BURN_FACTOR_CONFIG.filter(factor => burnFactors[factor.key]);
  
  // Don't render if no accelerators or burn rate is normal
  if (activeFactors.length === 0 || burnRate <= 1.0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <AlertTriangle className="w-3 h-3 text-amber-500" />
        <span className="font-medium">{burnRate.toFixed(1)}× wear rate</span>
        <span className="text-muted-foreground/60">
          ({activeFactors.map(f => f.label.split(' ')[0]).join(', ')})
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Why depleted faster than normal?</span>
      </div>
      
      <div className="space-y-1.5">
        {activeFactors.map((factor) => (
          <div 
            key={factor.key}
            className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/20"
          >
            <div className="text-amber-600 mt-0.5">{factor.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {factor.label}
                </span>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {factor.multiplier}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {factor.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Combined wear rate</span>
        <span className="text-sm font-bold font-mono text-amber-600">
          {burnRate.toFixed(1)}× normal
        </span>
      </div>
    </div>
  );
}
