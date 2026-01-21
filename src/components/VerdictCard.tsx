import { AlertTriangle, Wrench, Clock, CheckCircle, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type Recommendation } from '@/lib/opterraAlgorithm';

interface VerdictCardProps {
  recommendation: Recommendation;
  healthScore: number;
  yearsRemaining?: number;
  isLeaking?: boolean;
  visualRust?: boolean;
  onGetHelp: () => void;
}

type VerdictType = 'replace-now' | 'replace-soon' | 'maintain' | 'monitor';

interface VerdictConfig {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  title: string;
  ctaText: string;
}

const verdictConfigs: Record<VerdictType, VerdictConfig> = {
  'replace-now': {
    icon: AlertTriangle,
    iconBg: 'bg-destructive/15',
    iconColor: 'text-destructive',
    borderColor: 'border-destructive/30',
    title: 'Replace Your Water Heater',
    ctaText: 'Discuss Replacement Options',
  },
  'replace-soon': {
    icon: Clock,
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    title: 'Plan for Replacement',
    ctaText: 'Discuss Your Options',
  },
  'maintain': {
    icon: Wrench,
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    title: 'Schedule Maintenance',
    ctaText: 'Have My Plumber Reach Out',
  },
  'monitor': {
    icon: CheckCircle,
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    title: 'Your Unit Is Running Well',
    ctaText: 'Set a Reminder',
  },
};

function getVerdictType(recommendation: Recommendation, isLeaking?: boolean, visualRust?: boolean): VerdictType {
  // Breach conditions always require immediate replacement
  if (isLeaking || visualRust) return 'replace-now';
  
  if (recommendation.action === 'REPLACE') {
    return recommendation.urgent ? 'replace-now' : 'replace-soon';
  }
  if (recommendation.action === 'REPAIR' || recommendation.action === 'MAINTAIN') {
    return 'maintain';
  }
  // PASS, MONITOR, UPGRADE
  return 'monitor';
}

function getVerdictDescription(
  verdictType: VerdictType, 
  recommendation: Recommendation,
  yearsRemaining?: number,
  isLeaking?: boolean,
  visualRust?: boolean
): string {
  if (isLeaking) {
    return "Your water heater is actively leaking. This requires immediate attention to prevent water damage.";
  }
  if (visualRust) {
    return "Visible rust indicates the tank is corroding. Replacement is recommended before a leak occurs.";
  }
  
  switch (verdictType) {
    case 'replace-now':
      return recommendation.reason || "Based on our assessment, your unit has reached the end of its safe operating life.";
    case 'replace-soon':
      if (yearsRemaining !== undefined && yearsRemaining > 0) {
        return `Your unit is nearing the end of its lifespan. Plan for replacement within the next ${Math.ceil(yearsRemaining)} ${yearsRemaining === 1 ? 'year' : 'years'}.`;
      }
      return recommendation.reason || "Your unit is showing signs of age. Consider planning for replacement soon.";
    case 'maintain':
      return recommendation.reason || "Regular maintenance will help extend the life of your water heater and prevent costly repairs.";
    case 'monitor':
      if (yearsRemaining !== undefined && yearsRemaining > 0) {
        return `No immediate action needed. With proper care, expect approximately ${Math.ceil(yearsRemaining)} more years of service.`;
      }
      return recommendation.reason || "Your water heater is in good condition. Continue monitoring for any changes.";
  }
}

export function VerdictCard({ 
  recommendation, 
  healthScore,
  yearsRemaining,
  isLeaking,
  visualRust,
  onGetHelp 
}: VerdictCardProps) {
  const verdictType = getVerdictType(recommendation, isLeaking, visualRust);
  const config = verdictConfigs[verdictType];
  const Icon = config.icon;
  const description = getVerdictDescription(verdictType, recommendation, yearsRemaining, isLeaking, visualRust);

  return (
    <div className={cn(
      "command-card p-4 space-y-4 overflow-hidden w-full max-w-full",
      config.borderColor
    )}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          config.iconBg
        )}>
          <Icon className={cn("w-5 h-5", config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
              Our Recommendation
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {config.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>

      {/* CTA Button */}
      <Button 
        onClick={onGetHelp}
        className={cn(
          "w-full h-12 text-sm font-medium gap-2",
          verdictType === 'replace-now' && "bg-destructive hover:bg-destructive/90",
          verdictType === 'replace-soon' && "bg-amber-500 hover:bg-amber-600 text-white",
          verdictType === 'maintain' && "bg-primary hover:bg-primary/90",
          verdictType === 'monitor' && "bg-secondary hover:bg-secondary/80 text-foreground"
        )}
      >
        {config.ctaText}
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Trust indicator */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        <Shield className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">
          No obligation • Just a quick chat
        </span>
      </div>
    </div>
  );
}
