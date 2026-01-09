import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, Star, Shield, AlertCircle, Sparkles, Wrench, AlertTriangle, Droplets } from 'lucide-react';
import { useTieredPricing, DISPLAY_TIERS, TIER_CONFIG } from '@/hooks/useTieredPricing';
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

const TIER_LABELS: Record<QualityTier, { name: string; description: string }> = {
  BUILDER: { name: 'Good', description: 'Code Compliant' },
  STANDARD: { name: 'Better', description: 'Protected Install' },
  PROFESSIONAL: { name: 'Best', description: 'Complete Package' },
  PREMIUM: { name: 'Premium', description: 'Top of the Line' },
};

const TIER_FEATURES: Record<QualityTier, string[]> = {
  BUILDER: [
    'Basic glass lining',
    'Standard anode rod',
    'Economy thermostat',
  ],
  STANDARD: [
    'Enhanced glass lining',
    'Larger anode rod',
    'Self-cleaning dip tube',
  ],
  PROFESSIONAL: [
    'Premium porcelain lining',
    'Dual anode rods',
    'Brass drain valve',
    'Enhanced insulation',
  ],
  PREMIUM: [
    'Commercial-grade lining',
    'Powered anode rod',
    'WiFi connectivity',
    'Leak detection sensor',
  ],
};

const TIER_ICONS: Record<QualityTier, typeof Star> = {
  BUILDER: Shield,
  STANDARD: Star,
  PROFESSIONAL: Sparkles,
  PREMIUM: Sparkles,
};

const ISSUE_ICONS: Record<string, typeof Wrench> = {
  exp_tank_required: Shield,
  exp_tank_replace: Shield,
  prv_failed: AlertTriangle,
  prv_critical: AlertTriangle,
  prv_recommended: Shield,
  prv_longevity: Shield,
  softener_service: Droplets,
  softener_replace: Droplets,
  softener_new: Droplets,
};

function formatPriceRange(low: number, high: number): string {
  const formatK = (n: number) => {
    if (n >= 1000) {
      return `$${(n / 1000).toFixed(1)}k`;
    }
    return `$${n.toLocaleString()}`;
  };
  return `${formatK(low)} – ${formatK(high)}`;
}

function getCategoryLabel(tier: QualityTier): string {
  switch (tier) {
    case 'BUILDER': return 'Code Fixes Included';
    case 'STANDARD': return 'Code Fixes + Infrastructure';
    case 'PROFESSIONAL': 
    case 'PREMIUM': return 'Complete Protection Package';
    default: return 'Included Work';
  }
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
  const hasInfrastructureIssues = infrastructureIssues.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Replacement Options</h3>
        {detectedTier && (
          <Badge variant="outline" className="text-xs">
            Your current unit: {TIER_LABELS[detectedTier].name}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DISPLAY_TIERS.map((tier) => {
          const tierData = tiers[tier];
          const labels = TIER_LABELS[tier];
          const features = TIER_FEATURES[tier];
          const config = TIER_CONFIG[tier];
          const TierIcon = TIER_ICONS[tier];
          const isSelected = effectiveSelected === tier;
          const isMatch = detectedTier === tier;
          const isHovered = hoveredTier === tier;

          return (
            <Card
              key={tier}
              className={cn(
                'relative transition-all duration-200 cursor-pointer',
                isSelected && 'ring-2 ring-primary shadow-lg',
                isHovered && !isSelected && 'ring-1 ring-primary/50',
                tier === 'STANDARD' && 'md:-mt-2 md:mb-2'
              )}
              onMouseEnter={() => setHoveredTier(tier)}
              onMouseLeave={() => setHoveredTier(null)}
              onClick={() => onTierSelect?.(tier)}
            >
              {/* Popular badge for STANDARD */}
              {tier === 'STANDARD' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Match badge */}
              {isMatch && (
                <div className="absolute -top-2 right-2 z-10">
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Your Match
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <TierIcon className={cn(
                    'h-5 w-5',
                    tier === 'BUILDER' && 'text-slate-500',
                    tier === 'STANDARD' && 'text-amber-500',
                    tier === 'PROFESSIONAL' && 'text-blue-500'
                  )} />
                  <div>
                    <h4 className="font-bold text-lg">{labels.name}</h4>
                    <p className="text-xs text-muted-foreground">{labels.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Warranty */}
                <div className="flex items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{config.warranty} Year</span>
                  <span className="text-sm text-muted-foreground">Warranty</span>
                </div>

                {/* Features */}
                <ul className="space-y-1.5">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Infrastructure Issues Included */}
                {tierData.includedIssues.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-primary mb-2">
                      {getCategoryLabel(tier)}:
                    </p>
                    <ul className="space-y-1.5">
                      {tierData.includedIssues.map((issue) => {
                        const IssueIcon = ISSUE_ICONS[issue.id] || Wrench;
                        return (
                          <li key={issue.id} className="flex items-start gap-2 text-sm">
                            <IssueIcon className={cn(
                              "h-4 w-4 mt-0.5 flex-shrink-0",
                              issue.category === 'VIOLATION' && "text-red-400",
                              issue.category === 'INFRASTRUCTURE' && "text-amber-400",
                              issue.category === 'OPTIMIZATION' && "text-blue-400"
                            )} />
                            <span className="text-foreground">{issue.name}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Price - Now shows bundle total when issues exist */}
                <div className="pt-2 border-t">
                  {tierData.loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ) : tierData.error ? (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>Price unavailable</span>
                    </div>
                  ) : tierData.bundleTotal ? (
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        {formatPriceRange(
                          tierData.bundleTotal.low,
                          tierData.bundleTotal.high
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Typical: ${tierData.bundleTotal.median.toLocaleString()} installed
                      </p>
                      {tierData.issuesCost.high > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Includes {formatPriceRange(tierData.issuesCost.low, tierData.issuesCost.high)} in bundled work
                        </p>
                      )}
                    </div>
                  ) : tierData.quote?.grandTotalRange ? (
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        {formatPriceRange(
                          tierData.quote.grandTotalRange.low,
                          tierData.quote.grandTotalRange.high
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Typical: ${tierData.quote.grandTotalRange.median.toLocaleString()} installed
                      </p>
                    </div>
                  ) : tierData.quote ? (
                    <div>
                      <p className="text-xl font-bold text-foreground">
                        ${tierData.quote.grandTotal.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">installed</p>
                    </div>
                  ) : (
                    <Skeleton className="h-6 w-32" />
                  )}
                </div>

                {/* Select Button */}
                <Button
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full"
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
                  ) : (
                    'Select'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confidence note */}
      {!allLoading && (
        <p className="text-xs text-muted-foreground text-center">
          Prices include unit, installation labor, materials, and permits. 
          Final quote may vary based on site conditions.
        </p>
      )}
    </div>
  );
}
