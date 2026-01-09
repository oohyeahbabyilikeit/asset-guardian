import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Shield, Zap, Crown, ChevronRight, HelpCircle } from 'lucide-react';
import { useTieredPricing, DISPLAY_TIERS, TIER_CONFIG } from '@/hooks/useTieredPricing';
import { TierEducationDrawer } from '@/components/TierEducationDrawer';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';

interface TieredPricingDisplayProps {
  inputs: ForensicInputs;
  detectedTier?: QualityTier;
  onTierSelect?: (tier: QualityTier) => void;
  selectedTier?: QualityTier;
  contractorId?: string;
  infrastructureIssues?: InfrastructureIssue[];
  isSafetyReplacement?: boolean;
}

const TIER_CONFIG_DISPLAY: Record<QualityTier, { 
  name: string; 
  icon: typeof Shield;
  color: string;
  bgGradient: string;
  features: string[];
}> = {
  BUILDER: { 
    name: 'Good', 
    icon: Shield,
    color: 'text-slate-400',
    bgGradient: 'from-slate-500/10 to-slate-600/5',
    features: [
      'Standard tank lining',
      '6-year parts warranty',
      'Code-compliant install',
    ],
  },
  STANDARD: { 
    name: 'Better', 
    icon: Zap,
    color: 'text-primary',
    bgGradient: 'from-primary/20 to-primary/5',
    features: [
      'Enhanced corrosion protection',
      '9-year parts warranty',
      'Infrastructure included',
    ],
  },
  PROFESSIONAL: { 
    name: 'Best', 
    icon: Crown,
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/15 to-blue-600/5',
    features: [
      'Premium materials throughout',
      '12-year parts warranty',
      'Complete protection package',
    ],
  },
  PREMIUM: { 
    name: 'Premium', 
    icon: Crown,
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/15 to-purple-600/5',
    features: [
      'Commercial-grade build',
      '12-year full warranty',
      'Smart monitoring included',
    ],
  },
};

// Format price as clean number
function formatPrice(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

export function TieredPricingDisplay({
  inputs,
  detectedTier,
  onTierSelect,
  selectedTier,
  contractorId,
  infrastructureIssues = [],
  isSafetyReplacement = false,
}: TieredPricingDisplayProps) {
  const { tiers, allLoading } = useTieredPricing(
    inputs, 
    contractorId, 
    'STANDARD', 
    true, 
    infrastructureIssues
  );
  const [expandedTier, setExpandedTier] = useState<QualityTier | null>(null);

  const effectiveSelected = selectedTier || 'STANDARD';

  // Count included infrastructure items per tier
  const getInfraCount = (tier: QualityTier) => {
    const tierData = tiers[tier];
    return tierData.includedIssues.length;
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Select Package
        </h3>
        <TierEducationDrawer 
          infrastructureIssues={infrastructureIssues}
          housePsi={inputs.housePsi}
          hardnessGPG={inputs.hardnessGPG}
        />
      </div>

      {/* Stacked Tier Options - Designed for Mobile First */}
      <div className="space-y-2">
        {DISPLAY_TIERS.map((tier) => {
          const tierData = tiers[tier];
          const config = TIER_CONFIG_DISPLAY[tier];
          const tierPricing = TIER_CONFIG[tier];
          const TierIcon = config.icon;
          const isSelected = effectiveSelected === tier;
          const isRecommended = tier === 'STANDARD';
          const isExpanded = expandedTier === tier;
          const infraCount = getInfraCount(tier);

          // Get the display price
          const displayPrice = tierData.bundleTotal?.median 
            || tierData.quote?.grandTotalRange?.median 
            || tierData.quote?.grandTotal 
            || null;

          return (
            <div
              key={tier}
              className={cn(
                'relative rounded-xl border-2 transition-all duration-200 overflow-hidden',
                isSelected 
                  ? isSafetyReplacement 
                    ? 'border-red-500 bg-red-500/5' 
                    : 'border-primary bg-primary/5'
                  : 'border-border bg-card/50 hover:border-muted-foreground/50',
                isRecommended && !isSelected && 'border-primary/50'
              )}
              style={{
                boxShadow: isSelected 
                  ? isSafetyReplacement
                    ? '0 0 20px -4px rgba(239, 68, 68, 0.3)'
                    : '0 0 20px -4px hsl(var(--primary) / 0.3)'
                  : undefined,
              }}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className={cn(
                  "absolute top-0 right-0 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg",
                  isSelected 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-primary/20 text-primary"
                )}>
                  RECOMMENDED
                </div>
              )}

              {/* Main Row - Always Visible */}
              <button
                onClick={() => onTierSelect?.(tier)}
                className="w-full text-left p-3 flex items-center gap-3"
              >
                {/* Selection Indicator */}
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  isSelected 
                    ? isSafetyReplacement
                      ? 'border-red-500 bg-red-500'
                      : 'border-primary bg-primary'
                    : 'border-muted-foreground/40'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Tier Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <TierIcon className={cn('w-4 h-4', config.color)} />
                    <span className="font-bold text-foreground">{config.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {tierPricing.warranty}yr warranty
                    </span>
                  </div>
                  
                  {/* Quick Feature Preview */}
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {infraCount > 0 
                      ? `${config.features[0]} + ${infraCount} protection${infraCount > 1 ? 's' : ''}`
                      : config.features[0]
                    }
                  </p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  {tierData.loading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : displayPrice ? (
                    <span className={cn(
                      'text-lg font-bold',
                      isSelected 
                        ? isSafetyReplacement ? 'text-red-400' : 'text-primary'
                        : 'text-foreground'
                    )}>
                      {formatPrice(displayPrice)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>

                {/* Expand Arrow */}
                <ChevronRight 
                  className={cn(
                    'w-4 h-4 text-muted-foreground transition-transform flex-shrink-0',
                    isExpanded && 'rotate-90'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedTier(isExpanded ? null : tier);
                  }}
                />
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className={cn(
                  'px-3 pb-3 pt-0 border-t border-border/50',
                  `bg-gradient-to-b ${config.bgGradient}`
                )}>
                  <div className="pt-3 space-y-2">
                    {/* Features List */}
                    <ul className="space-y-1.5">
                      {config.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Infrastructure Items if any */}
                    {tierData.includedIssues.length > 0 && (
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                          Included Protection
                        </p>
                        <ul className="space-y-1">
                          {tierData.includedIssues.map((issue) => (
                            <li key={issue.id} className="flex items-center gap-2 text-xs">
                              <Shield className={cn(
                                'w-3 h-3 flex-shrink-0',
                                issue.category === 'VIOLATION' && 'text-red-400',
                                issue.category === 'INFRASTRUCTURE' && 'text-amber-400',
                                issue.category === 'OPTIMIZATION' && 'text-blue-400'
                              )} />
                              <span className="text-muted-foreground">{issue.friendlyName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Full Price Breakdown */}
                    {displayPrice && (
                      <div className="pt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total installed</span>
                        <span className="font-bold text-foreground">
                          ${displayPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fine print */}
      {!allLoading && (
        <p className="text-[10px] text-muted-foreground text-center">
          Prices include unit, labor, materials & permits. Final quote may vary.
        </p>
      )}
    </div>
  );
}
