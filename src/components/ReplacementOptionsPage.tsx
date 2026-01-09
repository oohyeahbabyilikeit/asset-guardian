import { useState } from 'react';
import { ArrowLeft, Check, Shield, Zap, Crown, Calendar, Clock, Info, Heart, MessageCircle, CheckCircle2 } from 'lucide-react';
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
  badge?: string;
  features: string[];
}> = {
  BUILDER: { 
    name: 'Good', 
    icon: Shield,
    accent: 'text-muted-foreground',
    bgGradient: 'bg-card/50',
    borderColor: 'border-border',
    selectedBorder: 'border-muted-foreground',
    tagline: 'Reliable basics',
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
    bgGradient: 'bg-gradient-to-br from-primary/8 via-primary/4 to-transparent',
    borderColor: 'border-primary/30',
    selectedBorder: 'border-primary',
    tagline: 'Best value for most homes',
    badge: '★ Most Popular',
    features: [
      'Enhanced corrosion protection',
      '9-year parts warranty',
      'Pressure protection included',
    ],
  },
  PROFESSIONAL: { 
    name: 'Best', 
    icon: Crown,
    accent: 'text-amber-500',
    bgGradient: 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent',
    borderColor: 'border-amber-500/30',
    selectedBorder: 'border-amber-500',
    tagline: 'Maximum peace of mind',
    badge: '👑 Premium',
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
    bgGradient: 'bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent',
    borderColor: 'border-purple-500/30',
    selectedBorder: 'border-purple-500',
    tagline: 'Commercial grade',
    badge: '⚡ Pro',
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
  const [selectedTimeline, setSelectedTimeline] = useState<'now' | 'later' | 'thinking' | null>(null);
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
          <h1 className="font-bold text-foreground">Let's Find the Right Fit</h1>
          <TierEducationDrawer 
            infrastructureIssues={infrastructureIssues}
            housePsi={currentInputs.housePsi}
            hardnessGPG={currentInputs.hardnessGPG}
          />
        </div>
      </header>

      <div className="relative p-4 max-w-md mx-auto pb-32">
        {/* Friendly Intro */}
        <div className="mb-5 p-4 rounded-xl bg-card/60 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground leading-relaxed">
                Based on what we found, here are three solid options. 
                <span className="text-muted-foreground"> Each one protects your home — pick what feels right for your budget.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tier Cards */}
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
                    : cn(config.borderColor, 'bg-card/40 hover:bg-card/60'),
                )}
                style={{
                  boxShadow: isSelected && !isGood
                    ? isBest 
                      ? '0 0 20px -4px rgba(245, 158, 11, 0.25)'
                      : isRecommended 
                        ? '0 0 20px -4px hsl(var(--primary) / 0.25)'
                        : undefined
                    : undefined,
                }}
              >
                {/* Badge */}
                {config.badge && (
                  <div className={cn(
                    "text-[10px] font-semibold py-1.5 px-3 text-center tracking-wide",
                    isRecommended && (isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-primary/15 text-primary"),
                    isBest && (isSelected 
                      ? "bg-amber-500 text-black" 
                      : "bg-amber-500/15 text-amber-500")
                  )}>
                    {config.badge}
                  </div>
                )}

                <div className={cn("p-4", isGood && "py-3")}>
                  {/* Header Row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Selection Circle */}
                      <div className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
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
                          <TierIcon className={cn('w-5 h-5', isSelected ? config.accent : 'text-muted-foreground')} />
                          <span className={cn(
                            'font-bold',
                            isGood ? 'text-base' : 'text-lg',
                            isSelected ? 'text-foreground' : 'text-foreground/80'
                          )}>{config.name}</span>
                        </div>
                        <p className={cn(
                          'text-[11px] ml-7',
                          isSelected ? config.accent : 'text-muted-foreground'
                        )}>{config.tagline}</p>
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
                            isGood ? 'text-sm' : 'text-base',
                            isSelected && !isGood && (isBest ? 'text-amber-500' : 'text-primary'),
                            (!isSelected || isGood) && 'text-foreground'
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
                          isBest ? 'text-amber-500' : isRecommended ? 'text-primary' : 'text-muted-foreground'
                        )} />
                        <span className="text-muted-foreground text-[13px]">
                          {feature}
                        </span>
                      </li>
                    ))}
                    
                    {/* Infrastructure items */}
                    {infraCount > 0 && (
                      <li className="flex items-center gap-2 text-sm pt-1">
                        <Shield className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          isBest ? 'text-amber-500' : 'text-primary'
                        )} />
                        <span className={cn(
                          "font-medium text-[13px]",
                          isBest ? 'text-amber-500' : 'text-primary'
                        )}>
                          +{infraCount} infrastructure fix{infraCount > 1 ? 'es' : ''} included
                        </span>
                      </li>
                    )}

                    {/* Note for Good tier - softer language */}
                    {isGood && infraCount === 0 && infrastructureIssues.length > 0 && (
                      <li className="flex items-center gap-2 text-xs pt-1 text-muted-foreground/70">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        <span>Infrastructure protection available in Better & Best</span>
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
          <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            What works for your schedule?
          </p>
          
          {/* Ready Now */}
          <button
            onClick={() => setSelectedTimeline('now')}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'now'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card/50 hover:border-muted-foreground/50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              selectedTimeline === 'now' 
                ? 'border-primary bg-primary' 
                : 'border-muted-foreground/40'
            )}>
              {selectedTimeline === 'now' && <Check className="w-3 h-3 text-white" />}
            </div>
            <div className="flex-1">
              <span className="font-semibold text-foreground">Ready when you are</span>
              <p className="text-xs text-muted-foreground">Schedule within the next 2 weeks</p>
            </div>
            {isSafetyReplacement && (
              <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                Recommended
              </span>
            )}
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
                <span className="font-semibold text-foreground">I need a bit of time</span>
                <p className="text-xs text-muted-foreground">
                  Plan for the next 12 months
                  {monthlyBudget > 0 && <span className="text-primary"> • Save ${monthlyBudget}/mo</span>}
                </p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Thinking About It */}
          <button
            onClick={() => setSelectedTimeline('thinking')}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'thinking'
                ? 'border-muted-foreground/50 bg-muted/30'
                : 'border-border/50 bg-card/30 hover:border-muted-foreground/30'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              selectedTimeline === 'thinking' ? 'border-muted-foreground bg-muted-foreground' : 'border-muted-foreground/30'
            )}>
              {selectedTimeline === 'thinking' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-muted-foreground">I'd like to think about it</span>
          </button>

          {/* Gentle reminder for thinking */}
          {selectedTimeline === 'thinking' && (
            <div className="mt-2 p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {isSafetyReplacement 
                    ? "No pressure! Just keep in mind that addressing this sooner helps avoid unexpected issues down the road."
                    : `Your unit is aging at ${agingRate.toFixed(1)}x the normal rate. We're here whenever you're ready.`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Price summary with reassurance */}
        {!allLoading && selectedPriceRange && selectedTimeline && selectedTimeline !== 'thinking' && (
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Selection</p>
                <p className="font-semibold text-foreground">{TIER_DISPLAY[selectedTier].name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Estimated Range</p>
                <p className="text-lg font-bold text-foreground">{formatPriceRange(selectedPriceRange)}</p>
              </div>
            </div>
            
            {/* Reassurance section */}
            <div className="pt-3 border-t border-border/50">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground">No hidden fees</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Price locked after visit</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Change anytime</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trust quote */}
        <div className="mt-4 flex items-center gap-2 justify-center">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-[11px] text-muted-foreground/60 italic">
            "We only recommend what your home actually needs."
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      {selectedTimeline !== null && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              onClick={() => {
                if (selectedTimeline === 'thinking') {
                  onBack();
                } else {
                  setShowContactForm(true);
                }
              }}
              className={cn(
                'w-full h-14 text-base font-semibold',
              )}
              variant={selectedTimeline === 'thinking' ? 'outline' : 'default'}
            >
              {selectedTimeline === 'now' 
                ? "Let's Get This Sorted"
                : selectedTimeline === 'thinking'
                  ? 'Back to Dashboard'
                  : 'Request a Quote — No Obligation'
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
