import { useState } from 'react';
import { ArrowLeft, Check, AlertTriangle, Shield, Zap, Crown, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTieredPricing, DISPLAY_TIERS, TIER_CONFIG } from '@/hooks/useTieredPricing';
import { TierEducationDrawer } from '@/components/TierEducationDrawer';
import { PlumberContactForm } from './PlumberContactForm';
import { toast } from 'sonner';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';

interface ReplacementOptionsPageProps {
  onBack: () => void;
  onSchedule: () => void;
  currentInputs: ForensicInputs;
  infrastructureIssues: InfrastructureIssue[];
  isSafetyReplacement: boolean;
  agingRate: number;
  monthlyBudget?: number;
}

const TIER_DISPLAY: Record<QualityTier, { 
  name: string; 
  icon: typeof Shield;
  accent: string;
  bgGradient: string;
  borderColor: string;
  selectedBorder: string;
  tagline: string;
  features: string[];
}> = {
  BUILDER: { 
    name: 'Good', 
    icon: Shield,
    accent: 'text-muted-foreground',
    bgGradient: 'bg-card/30',
    borderColor: 'border-border/50',
    selectedBorder: 'border-muted-foreground',
    tagline: 'Basic protection',
    features: [
      'Standard tank lining',
      '6-year parts warranty',
      'Code-compliant installation',
    ],
  },
  STANDARD: { 
    name: 'Better', 
    icon: Zap,
    accent: 'text-primary',
    bgGradient: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
    borderColor: 'border-primary/40',
    selectedBorder: 'border-primary',
    tagline: 'Best value',
    features: [
      'Enhanced corrosion protection',
      '9-year parts warranty',
      'Pressure protection included',
    ],
  },
  PROFESSIONAL: { 
    name: 'Best', 
    icon: Crown,
    accent: 'text-amber-400',
    bgGradient: 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent',
    borderColor: 'border-amber-500/40',
    selectedBorder: 'border-amber-500',
    tagline: 'Maximum longevity',
    features: [
      'Premium materials throughout',
      '12-year parts warranty',
      'Complete protection package',
    ],
  },
  PREMIUM: { 
    name: 'Premium', 
    icon: Crown,
    accent: 'text-purple-400',
    bgGradient: 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent',
    borderColor: 'border-purple-500/40',
    selectedBorder: 'border-purple-500',
    tagline: 'Commercial grade',
    features: [
      'Commercial-grade build',
      '12-year full warranty',
      'Smart monitoring ready',
    ],
  },
};

export function ReplacementOptionsPage({
  onBack,
  onSchedule,
  currentInputs,
  infrastructureIssues,
  isSafetyReplacement,
  agingRate,
  monthlyBudget = 0,
}: ReplacementOptionsPageProps) {
  const [selectedTier, setSelectedTier] = useState<QualityTier>('STANDARD');
  const [selectedTimeline, setSelectedTimeline] = useState<'now' | 'later' | 'chances' | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const { tiers, allLoading } = useTieredPricing(
    currentInputs, 
    undefined, 
    'STANDARD', 
    true, 
    infrastructureIssues
  );

  const getPriceRange = (tier: QualityTier) => {
    const tierData = tiers[tier];
    if (tierData.bundleTotal) {
      return { low: tierData.bundleTotal.low, high: tierData.bundleTotal.high };
    }
    if (tierData.quote?.grandTotalRange) {
      return { low: tierData.quote.grandTotalRange.low, high: tierData.quote.grandTotalRange.high };
    }
    if (tierData.quote?.grandTotal) {
      return { low: tierData.quote.grandTotal, high: tierData.quote.grandTotal };
    }
    return null;
  };

  const formatPriceRange = (range: { low: number; high: number }) => {
    const formatK = (n: number) => {
      if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
      return `$${n.toLocaleString()}`;
    };
    return `${formatK(range.low)} – ${formatK(range.high)}`;
  };

  const selectedPriceRange = getPriceRange(selectedTier);

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
          <h1 className="font-bold text-foreground">Your Options</h1>
          <TierEducationDrawer 
            infrastructureIssues={infrastructureIssues}
            housePsi={currentInputs.housePsi}
            hardnessGPG={currentInputs.hardnessGPG}
          />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Tier Cards - Full Width Stacked */}
        <div className="space-y-3 mb-6">
          {DISPLAY_TIERS.map((tier) => {
            const config = TIER_DISPLAY[tier];
            const tierPricing = TIER_CONFIG[tier];
            const tierData = tiers[tier];
            const TierIcon = config.icon;
            const isSelected = selectedTier === tier;
            const isRecommended = tier === 'STANDARD';
            const priceRange = getPriceRange(tier);
            const infraCount = tierData.includedIssues.length;

            const isGood = tier === 'BUILDER';
            const isBest = tier === 'PROFESSIONAL';

            return (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={cn(
                  'w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden',
                  isSelected 
                    ? cn(config.selectedBorder, config.bgGradient)
                    : cn(config.borderColor, config.bgGradient, 'hover:border-muted-foreground/60'),
                  // Make Good tier visually smaller/muted
                  isGood && !isSelected && 'opacity-75 hover:opacity-100'
                )}
                style={{
                  boxShadow: isSelected && !isGood
                    ? isBest 
                      ? '0 0 24px -4px rgba(251, 191, 36, 0.3)'
                      : isRecommended 
                        ? '0 0 24px -4px hsl(var(--primary) / 0.3)'
                        : undefined
                    : undefined,
                }}
              >
                {/* Recommended Badge */}
                {isRecommended && (
                  <div className={cn(
                    "text-[10px] font-bold py-1.5 px-3 text-center tracking-wider",
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/20 text-primary"
                  )}>
                    ★ RECOMMENDED — BEST VALUE
                  </div>
                )}

                {/* Best Badge */}
                {isBest && (
                  <div className={cn(
                    "text-[10px] font-bold py-1.5 px-3 text-center tracking-wider",
                    isSelected 
                      ? "bg-amber-500 text-black" 
                      : "bg-amber-500/20 text-amber-400"
                  )}>
                    👑 MAXIMUM PROTECTION
                  </div>
                )}

                <div className={cn("p-4", isGood && "py-3")}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Selection Circle */}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        isSelected 
                          ? isBest 
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-primary bg-primary'
                          : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      {/* Tier Name */}
                      <div>
                        <div className="flex items-center gap-2">
                          <TierIcon className={cn('w-5 h-5', config.accent)} />
                          <span className={cn(
                            'font-bold',
                            isGood ? 'text-base text-muted-foreground' : 'text-lg text-foreground'
                          )}>{config.name}</span>
                        </div>
                        {!isGood && (
                          <p className={cn('text-[10px] ml-7', config.accent)}>{config.tagline}</p>
                        )}
                      </div>
                    </div>

                    {/* Price Range + Warranty */}
                    <div className="text-right">
                      {tierData.loading ? (
                        <Skeleton className="h-7 w-24" />
                      ) : priceRange ? (
                        <div>
                          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Est.</p>
                          <span className={cn(
                            'font-bold leading-tight',
                            isGood ? 'text-sm text-muted-foreground' : 'text-base',
                            isSelected && !isGood && (isBest ? 'text-amber-400' : 'text-primary'),
                            !isSelected && !isGood && 'text-foreground'
                          )}>
                            {formatPriceRange(priceRange)}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {tierPricing.warranty}yr warranty
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className={cn("space-y-1.5 ml-9", isGood && "space-y-1")}>
                    {config.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <Check className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          isGood ? 'text-muted-foreground' : isBest ? 'text-amber-400' : 'text-green-500'
                        )} />
                        <span className={isGood ? 'text-muted-foreground/70 text-xs' : 'text-muted-foreground'}>
                          {feature}
                        </span>
                      </li>
                    ))}
                    
                    {/* Infrastructure items */}
                    {infraCount > 0 && (
                      <li className="flex items-center gap-2 text-sm pt-1">
                        <Shield className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          isBest ? 'text-amber-400' : 'text-primary'
                        )} />
                        <span className={cn(
                          "font-medium",
                          isBest ? 'text-amber-400' : 'text-primary'
                        )}>
                          +{infraCount} infrastructure protection{infraCount > 1 ? 's' : ''} included
                        </span>
                      </li>
                    )}

                    {/* Loss framing for Good tier */}
                    {isGood && infraCount === 0 && (
                      <li className="flex items-center gap-2 text-xs pt-1 text-amber-500/70">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span>No infrastructure protection</span>
                      </li>
                    )}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        {/* Timeline Selection */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">When would you like to proceed?</p>
          
          {/* Schedule Now */}
          <button
            onClick={() => setSelectedTimeline('now')}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'now'
                ? isSafetyReplacement 
                  ? 'border-destructive bg-destructive/10' 
                  : 'border-primary bg-primary/10'
                : 'border-border bg-card/50 hover:border-muted-foreground/50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              selectedTimeline === 'now' 
                ? isSafetyReplacement 
                  ? 'border-destructive bg-destructive' 
                  : 'border-primary bg-primary' 
                : 'border-muted-foreground/40'
            )}>
              {selectedTimeline === 'now' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-foreground">Schedule Now</span>
              {isSafetyReplacement && (
                <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive">
                  URGENT
                </span>
              )}
            </div>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {/* Plan Ahead - Only for economic */}
          {!isSafetyReplacement && (
            <button
              onClick={() => setSelectedTimeline('later')}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
                selectedTimeline === 'later'
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card/50 hover:border-muted-foreground/50'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                selectedTimeline === 'later' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
              )}>
                {selectedTimeline === 'later' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <span className="font-semibold text-foreground">Plan for 12 Months</span>
                {monthlyBudget > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (save ${monthlyBudget}/mo)
                  </span>
                )}
              </div>
            </button>
          )}

          {/* Not Now */}
          <button
            onClick={() => setSelectedTimeline('chances')}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'chances'
                ? 'border-amber-500/50 bg-amber-500/10'
                : 'border-border/50 bg-card/30 hover:border-muted-foreground/30'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              selectedTimeline === 'chances' ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/30'
            )}>
              {selectedTimeline === 'chances' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-muted-foreground">
              {isSafetyReplacement ? 'I understand the risks' : 'Not right now'}
            </span>
          </button>

          {/* Risk warning */}
          {selectedTimeline === 'chances' && (
            <div className="mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {isSafetyReplacement 
                    ? 'Delaying increases risk of water damage and emergency replacement costs.'
                    : `At ${agingRate.toFixed(1)}x aging, failure risk increases each month.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price summary */}
        {!allLoading && selectedPriceRange && selectedTimeline && selectedTimeline !== 'chances' && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Selected Package</p>
                <p className="font-semibold text-foreground">{TIER_DISPLAY[selectedTier].name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated Range</p>
                <p className="text-lg font-bold text-foreground">{formatPriceRange(selectedPriceRange)}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
              Final price confirmed after site inspection
            </p>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      {selectedTimeline !== null && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              onClick={() => {
                if (selectedTimeline === 'chances') {
                  onBack();
                } else {
                  setShowContactForm(true);
                }
              }}
              className={cn(
                'w-full h-14 text-base font-semibold',
                isSafetyReplacement && selectedTimeline === 'now' && 'bg-destructive hover:bg-destructive/90'
              )}
              variant={selectedTimeline === 'chances' ? 'outline' : 'default'}
            >
              {selectedTimeline === 'now' 
                ? (isSafetyReplacement ? 'Schedule Urgent Replacement' : 'Get My Quote')
                : selectedTimeline === 'chances'
                  ? 'Go Back'
                  : 'Speak with a Plumber'
              }
            </Button>
          </div>
        </div>
      )}

      <PlumberContactForm
        open={showContactForm}
        onOpenChange={setShowContactForm}
        onSubmit={(data) => {
          toast.success(`Thanks ${data.name}! A plumber will call you soon.`);
          setShowContactForm(false);
          onSchedule();
        }}
      />
    </div>
  );
}