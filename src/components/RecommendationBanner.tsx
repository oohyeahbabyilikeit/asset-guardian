import { AlertTriangle, Shield, Wrench, Eye, Droplets, Clock, AlertOctagon, Gauge, CheckCircle2, TrendingUp, Zap, PiggyBank, Sparkles } from 'lucide-react';
import { Recommendation, ActionType, FinancialForecast } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';

interface RecommendationBannerProps {
  recommendation: Recommendation;
  agingRate?: number;
  lifeExtension?: number;
  primaryStressor?: string;
  financial?: FinancialForecast;
  className?: string;
}

// Map action types to icons
const getActionIcon = (action: ActionType, title: string) => {
  if (action === 'REPLACE') {
    if (title.includes('Breach') || title.includes('Leak')) return AlertOctagon;
    if (title.includes('Sediment')) return Droplets;
    if (title.includes('Fatigue')) return Gauge;
    if (title.includes('Liability')) return Shield;
    if (title.includes('Statistical')) return Clock;
    return AlertTriangle;
  }
  if (action === 'REPAIR') return Wrench;
  if (action === 'UPGRADE') return TrendingUp;
  if (action === 'MAINTAIN') return Wrench;
  if (action === 'PASS') return CheckCircle2;
  return Eye;
};

// Map badge colors to styles
const getBadgeStyle = (badgeColor: Recommendation['badgeColor']): string => {
  switch (badgeColor) {
    case 'red':
      return 'bg-destructive/10 border-destructive/30 text-destructive';
    case 'orange':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'yellow':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'blue':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    case 'green':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    default:
      return 'bg-muted border-border text-foreground';
  }
};

// Map internal titles to education-centric titles
const getEducationalTitle = (title: string): string => {
  const titleMap: Record<string, string> = {
    'Missing Thermal Expansion': 'Thermal Expansion Not Managed',
    'Install Expansion Tank': 'Thermal Expansion Not Managed',
    'Critical Pressure Violation': 'Pressure Above Industry Limits',
    'High Pressure Detected': 'Pressure Above Recommended Range',
    'Replacement Required': 'End of Expected Service Life',
    'Strategic Replacement Recommended': 'Approaching End of Service Life',
    'Liability Hazard': 'Higher Risk Installation Location',
    'PRV Installation Needed': 'No Pressure Regulation Detected',
    'System Healthy': 'No Issues Detected This Assessment',
    'Maintenance Recommended': 'Routine Maintenance Suggested',
  };
  return titleMap[title] || title;
};

// Get education-centric action label
const getEducationalAction = (action: ActionType): string => {
  switch (action) {
    case 'REPLACE': return 'CONSIDER REPLACEMENT';
    case 'REPAIR': return 'MAINTENANCE SUGGESTED';
    case 'UPGRADE': return 'UPGRADE OPTION';
    case 'MAINTAIN': return 'ROUTINE CARE';
    case 'PASS': return 'MONITORING';
    default: return action;
  }
};

export function RecommendationBanner({ 
  recommendation, 
  agingRate = 1, 
  lifeExtension = 0,
  primaryStressor = '',
  financial,
  className = '' 
}: RecommendationBannerProps) {
  const Icon = getActionIcon(recommendation.action, recommendation.title);
  const style = getBadgeStyle(recommendation.badgeColor);
  const educationalTitle = getEducationalTitle(recommendation.title);
  const educationalAction = getEducationalAction(recommendation.action);
  
  // Show accelerated wear banner for high stress (> 1.5x) on non-replacement scenarios
  const showAcceleratedWear = agingRate > 1.5 && recommendation.action !== 'REPLACE';
  const hasLifeExtensionValue = lifeExtension > 0.5;
  
  // Show financial forecast for healthy/monitoring systems
  const showFinancial = financial && 
    (recommendation.action === 'PASS' || recommendation.action === 'MAINTAIN') &&
    recommendation.badge !== 'CRITICAL';

  // Check if system is healthy (PASS with OPTIMAL badge)
  const isHealthySystem = recommendation.action === 'PASS' && recommendation.badge === 'OPTIMAL';
  
  // Check if it's a monitoring state (green-worthy)
  const isMonitoring = recommendation.action === 'PASS' || recommendation.action === 'MAINTAIN';
  const isGreenState = isMonitoring && recommendation.badgeColor === 'green';

  return (
    <div className={`mx-4 space-y-3 ${className}`}>
      {/* Accelerated Wear Banner (when stress is high but tank is serviceable) */}
      {showAcceleratedWear && (
        <div className="command-card border-amber-500/30 p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-sm text-amber-400">
                  Accelerated Wear Detected
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Aging <span className="font-bold text-amber-300 font-data">{agingRate}x</span> faster than design specs.
                {primaryStressor && (
                  <span className="block mt-1.5 text-muted-foreground">
                    Root Cause: {primaryStressor}
                  </span>
                )}
                {hasLifeExtensionValue && (
                  <span className="block mt-1.5 text-emerald-400">
                    ✓ Fix to gain ~{lifeExtension.toFixed(1)} years of expected life
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring / Healthy System Card - Green themed */}
      {isHealthySystem && (
        <div className="command-card p-5 overflow-hidden border-emerald-500/30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/60 via-green-400/60 to-emerald-500/60" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500/25 to-green-500/15 border border-emerald-500/35">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-semibold text-sm text-emerald-400">
                  Active Monitoring
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Healthy
                </span>
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                System Operating Within Normal Parameters
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No immediate concerns detected. Continue regular maintenance to maximize equipment lifespan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Recommendation Banner - Hide for healthy systems */}
      {!isHealthySystem && (
        <div className={cn(
          "command-card p-5 overflow-hidden",
          recommendation.badgeColor === 'red' && "border-red-500/30",
          recommendation.badgeColor === 'orange' && "border-amber-500/20",
          isGreenState && "border-emerald-500/25"
        )}>
          {/* Top accent bar */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1",
            recommendation.badgeColor === 'red' && "bg-gradient-to-r from-red-500/60 via-red-400/60 to-red-500/60",
            recommendation.badgeColor === 'orange' && "bg-gradient-to-r from-amber-500/50 via-amber-400/50 to-amber-500/50",
            isGreenState && "bg-gradient-to-r from-emerald-500/60 via-green-400/60 to-emerald-500/60",
            !recommendation.badgeColor && "bg-gradient-to-r from-blue-500/40 via-cyan-500/40 to-blue-500/40"
          )} />
          
          <div className="flex items-start gap-4">
            {/* Icon - color based on state */}
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
              recommendation.badgeColor === 'red' && "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30",
              recommendation.badgeColor === 'orange' && "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30",
              isGreenState && "bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30",
              (recommendation.badgeColor !== 'red' && recommendation.badgeColor !== 'orange' && !isGreenState) && "bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border-blue-500/25"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                recommendation.badgeColor === 'red' && "text-red-400",
                recommendation.badgeColor === 'orange' && "text-amber-400",
                isGreenState && "text-emerald-400",
                (recommendation.badgeColor !== 'red' && recommendation.badgeColor !== 'orange' && !isGreenState) && "text-blue-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {/* Label */}
                <span className={cn(
                  "font-semibold text-sm",
                  recommendation.badgeColor === 'red' && "text-red-400",
                  recommendation.badgeColor === 'orange' && "text-amber-400",
                  isGreenState && "text-emerald-400",
                  (recommendation.badgeColor !== 'red' && recommendation.badgeColor !== 'orange' && !isGreenState) && "text-blue-400"
                )}>
                  {educationalAction}
                </span>
                {recommendation.urgent && recommendation.action === 'REPLACE' && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                    Urgent
                  </span>
                )}
                {isGreenState && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                    On Track
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {educationalTitle}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendation.reason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Outlook Card */}
      {showFinancial && financial && (
        <div className="command-card p-5 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-cyan-500/50 to-blue-500/50" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30">
              <PiggyBank className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-sm text-blue-400">
                  Financial Outlook
                </span>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                  financial.budgetUrgency === 'IMMEDIATE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  financial.budgetUrgency === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  financial.budgetUrgency === 'MED' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                )}>
                  {financial.budgetUrgency}
                </span>
              </div>
              <div className="flex items-baseline gap-4 mb-2">
                <div>
                  <span className="text-2xl font-bold text-blue-300 font-data">${financial.monthlyBudget}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  → Replace by <span className="font-medium text-foreground">{financial.targetReplacementDate}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {financial.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
