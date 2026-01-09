import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Star, Shield, AlertCircle, Sparkles } from 'lucide-react';
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
}

const TIER_LABELS: Record<QualityTier, { 
  name: string; 
  tagline: string;
  shortDescription: string;
}> = {
  BUILDER: { 
    name: 'Good', 
    tagline: 'Gets the job done',
    shortDescription: 'Code-compliant installation',
  },
  STANDARD: { 
    name: 'Better', 
    tagline: 'The smart choice',
    shortDescription: 'Protected installation',
  },
  PROFESSIONAL: { 
    name: 'Best', 
    tagline: 'Complete peace of mind',
    shortDescription: 'Maximum protection',
  },
  PREMIUM: { 
    name: 'Premium', 
    tagline: 'Top of the line',
    shortDescription: 'Ultimate protection',
  },
};

const TIER_ICONS: Record<QualityTier, typeof Star> = {
  BUILDER: Shield,
  STANDARD: Star,
  PROFESSIONAL: Sparkles,
  PREMIUM: Sparkles,
};

// What each tier adds progressively
function getTierValue(
  tier: QualityTier, 
  issues: InfrastructureIssue[],
  config: typeof TIER_CONFIG[QualityTier]
): { base: string; additions: string[] } {
  const infraIssues = issues.filter(i => i.category === 'INFRASTRUCTURE');
  const optIssues = issues.filter(i => i.category === 'OPTIMIZATION');
  const violationIssues = issues.filter(i => i.category === 'VIOLATION');
  
  switch (tier) {
    case 'BUILDER':
      return {
        base: `${config.warranty}-year warranty`,
        additions: violationIssues.length > 0 
          ? violationIssues.map(i => i.friendlyName)
          : ['Code-compliant installation'],
      };
    case 'STANDARD':
      return {
        base: `${config.warranty}-year warranty`,
        additions: [
          'Everything in Good',
          ...infraIssues.map(i => i.friendlyName),
        ].filter(Boolean),
      };
    case 'PROFESSIONAL':
    case 'PREMIUM':
      return {
        base: `${config.warranty}-year warranty`,
        additions: [
          'Everything in Better',
          ...optIssues.map(i => i.friendlyName),
        ].filter(Boolean),
      };
    default:
      return { base: '', additions: [] };
  }
}

// Format price as clean number
function formatPrice(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

// Get what's NOT included in Good tier
function getGoodLimitations(issues: InfrastructureIssue[]): string | null {
  const infraCount = issues.filter(i => i.category === 'INFRASTRUCTURE').length;
  const optCount = issues.filter(i => i.category === 'OPTIMIZATION').length;
  
  if (infraCount + optCount === 0) return null;
  
  if (infraCount > 0) {
    return 'Does not include infrastructure protection';
  }
  return null;
}

export function TieredPricingDisplay({
  inputs,
  detectedTier,
  onTierSelect,
  selectedTier,
  contractorId,
  infrastructureIssues = [],
}: TieredPricingDisplayProps) {
  const { tiers, allLoading } = useTieredPricing(
    inputs, 
    contractorId, 
    'STANDARD', 
    true, 
    infrastructureIssues
  );
  const [hoveredTier, setHoveredTier] = useState<QualityTier | null>(null);

  const effectiveSelected = selectedTier || detectedTier || 'STANDARD';
  const goodLimitation = getGoodLimitations(infrastructureIssues);

  return (
    <div className="space-y-4">
      {/* Header with education link */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Choose Your Package</h3>
        <TierEducationDrawer 
          infrastructureIssues={infrastructureIssues}
          housePsi={inputs.housePsi}
          hardnessGPG={inputs.hardnessGPG}
        />
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DISPLAY_TIERS.map((tier) => {
          const tierData = tiers[tier];
          const labels = TIER_LABELS[tier];
          const config = TIER_CONFIG[tier];
          const TierIcon = TIER_ICONS[tier];
          const isSelected = effectiveSelected === tier;
          const isHovered = hoveredTier === tier;
          const isRecommended = tier === 'STANDARD';
          const tierValue = getTierValue(tier, tierData.includedIssues, config);

          // Get the display price (prefer median/single price)
          const displayPrice = tierData.bundleTotal?.median 
            || tierData.quote?.grandTotalRange?.median 
            || tierData.quote?.grandTotal 
            || null;

          return (
            <Card
              key={tier}
              className={cn(
                'relative transition-all duration-200 cursor-pointer overflow-hidden',
                isSelected && 'ring-2 ring-primary shadow-lg',
                isHovered && !isSelected && 'ring-1 ring-primary/50',
                isRecommended && 'md:-mt-1 md:mb-1'
              )}
              onMouseEnter={() => setHoveredTier(tier)}
              onMouseLeave={() => setHoveredTier(null)}
              onClick={() => onTierSelect?.(tier)}
            >
              {/* Recommended header bar */}
              {isRecommended && (
                <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-medium">
                  ★ RECOMMENDED
                </div>
              )}

              <CardContent className={cn(
                "p-4 space-y-4",
                !isRecommended && "pt-5"
              )}>
                {/* Tier Name & Tagline */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TierIcon className={cn(
                      'h-4 w-4',
                      tier === 'BUILDER' && 'text-muted-foreground',
                      tier === 'STANDARD' && 'text-primary',
                      tier === 'PROFESSIONAL' && 'text-blue-500'
                    )} />
                    <h4 className={cn(
                      "font-bold text-lg",
                      isRecommended && "text-primary"
                    )}>
                      {labels.name}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">{labels.tagline}</p>
                </div>

                {/* Price - Single, prominent */}
                <div className="text-center py-2">
                  {tierData.loading ? (
                    <Skeleton className="h-10 w-28 mx-auto" />
                  ) : tierData.error ? (
                    <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Price unavailable</span>
                    </div>
                  ) : displayPrice ? (
                    <>
                      <p className={cn(
                        "text-3xl font-bold",
                        isRecommended ? "text-primary" : "text-foreground"
                      )}>
                        {formatPrice(displayPrice)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        installed*
                      </p>
                    </>
                  ) : (
                    <Skeleton className="h-10 w-28 mx-auto" />
                  )}
                </div>

                {/* Warranty - Prominent */}
                <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{config.warranty}-Year Warranty</span>
                </div>

                {/* Progressive Value List */}
                <ul className="space-y-2 min-h-[80px]">
                  {tierValue.additions.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0",
                        idx === 0 && tier !== 'BUILDER' 
                          ? "text-muted-foreground" 
                          : "text-green-500"
                      )} />
                      <span className={cn(
                        idx === 0 && tier !== 'BUILDER' 
                          ? "text-muted-foreground text-xs" 
                          : "text-foreground"
                      )}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Loss framing for Good tier */}
                {tier === 'BUILDER' && goodLimitation && (
                  <p className="text-[10px] text-muted-foreground text-center italic">
                    {goodLimitation}
                  </p>
                )}

                {/* Select Button */}
                <Button
                  variant={isSelected ? 'default' : isRecommended ? 'default' : 'outline'}
                  className={cn(
                    "w-full",
                    isRecommended && !isSelected && "bg-primary/90 hover:bg-primary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTierSelect?.(tier);
                  }}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Selected
                    </>
                  ) : isRecommended ? (
                    'Choose Better'
                  ) : (
                    `Choose ${labels.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fine print */}
      {!allLoading && (
        <p className="text-[10px] text-muted-foreground text-center">
          *Final quote may vary based on site conditions. Includes unit, labor, materials, and permits.
        </p>
      )}
    </div>
  );
}
