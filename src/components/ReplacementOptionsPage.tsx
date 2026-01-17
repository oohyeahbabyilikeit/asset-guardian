import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Check, Shield, Zap, Crown, Calendar, Clock, Info, MessageCircle, CheckCircle2, Flame, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTieredPricing, DISPLAY_TIERS, TIER_CONFIG, TierPricing } from '@/hooks/useTieredPricing';
import { TierEducationDrawer } from '@/components/TierEducationDrawer';
import { PlumberContactForm } from './PlumberContactForm';
import { toast } from 'sonner';
import type { ForensicInputs, QualityTier } from '@/lib/opterraAlgorithm';
import { detectInstallComplexity, type InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';

interface ReplacementOptionsPageProps {
  onBack: () => void;
  onSchedule: () => void;
  currentInputs: ForensicInputs;
  infrastructureIssues: InfrastructureIssue[];
  isSafetyReplacement: boolean;
  agingRate: number;
  monthlyBudget?: number;
  prefetchedTiers?: Record<QualityTier, TierPricing>;
  showFakeLoader?: boolean;
  onFakeLoaderDone?: () => void;
}

const TIER_DISPLAY: Record<QualityTier, { 
  name: string; 
  icon: typeof Shield;
  tagline: string;
  badge?: string;
  features: string[];
  // Visual styling
  iconBg: string;
  iconColor: string;
  cardBg: string;
  cardBorder: string;
  selectedBorder: string;
  selectedGlow: string;
  badgeBg: string;
  badgeText: string;
  priceColor: string;
  checkColor: string;
}> = {
  BUILDER: { 
    name: 'Good', 
    icon: Shield,
    tagline: 'Reliable basics',
    features: [
      'Standard tank lining',
      '6-year parts warranty',
      'Code-compliant installation',
    ],
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-400',
    cardBg: 'bg-gradient-to-br from-slate-900/80 via-slate-800/50 to-slate-900/30',
    cardBorder: 'border-slate-600/40',
    selectedBorder: 'border-slate-400',
    selectedGlow: 'shadow-[0_0_30px_-5px_rgba(148,163,184,0.4)]',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-slate-100',
    priceColor: 'text-slate-300',
    checkColor: 'text-slate-400',
  },
  STANDARD: { 
    name: 'Better', 
    icon: Zap,
    tagline: 'Best value for most homes',
    badge: '★ Most Popular',
    features: [
      'Enhanced corrosion protection',
      '9-year parts warranty',
      'Pressure protection included',
    ],
    iconBg: 'bg-gradient-to-br from-primary/30 to-amber-500/20',
    iconColor: 'text-primary',
    cardBg: 'bg-gradient-to-br from-primary/15 via-amber-900/20 to-primary/5',
    cardBorder: 'border-primary/40',
    selectedBorder: 'border-primary',
    selectedGlow: 'shadow-[0_0_40px_-5px_hsl(var(--primary)/0.5)]',
    badgeBg: 'bg-gradient-to-r from-primary to-amber-500',
    badgeText: 'text-white font-semibold',
    priceColor: 'text-primary',
    checkColor: 'text-primary',
  },
  PROFESSIONAL: { 
    name: 'Best', 
    icon: Crown,
    tagline: 'Maximum peace of mind',
    features: [
      'Premium materials throughout',
      '12-year parts warranty',
      'Complete protection package',
    ],
    iconBg: 'bg-gradient-to-br from-amber-500/30 to-yellow-600/20',
    iconColor: 'text-amber-400',
    cardBg: 'bg-gradient-to-br from-amber-900/30 via-yellow-900/20 to-amber-950/40',
    cardBorder: 'border-amber-500/40',
    selectedBorder: 'border-amber-400',
    selectedGlow: 'shadow-[0_0_40px_-5px_rgba(251,191,36,0.4)]',
    badgeBg: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    badgeText: 'text-amber-950 font-semibold',
    priceColor: 'text-amber-400',
    checkColor: 'text-amber-400',
  },
  PREMIUM: { 
    name: 'Premium', 
    icon: Crown,
    tagline: 'Commercial grade',
    badge: '⚡ Pro',
    features: [
      'Commercial-grade build',
      '12-year full warranty',
      'Smart monitoring ready',
    ],
    iconBg: 'bg-gradient-to-br from-purple-500/30 to-violet-600/20',
    iconColor: 'text-purple-400',
    cardBg: 'bg-gradient-to-br from-purple-900/30 via-violet-900/20 to-purple-950/40',
    cardBorder: 'border-purple-500/40',
    selectedBorder: 'border-purple-400',
    selectedGlow: 'shadow-[0_0_40px_-5px_rgba(168,85,247,0.4)]',
    badgeBg: 'bg-gradient-to-r from-purple-400 to-violet-500',
    badgeText: 'text-purple-950 font-semibold',
    priceColor: 'text-purple-400',
    checkColor: 'text-purple-400',
  },
};

const LOADER_DURATION_MS = 3500;

export function ReplacementOptionsPage({
  onBack,
  onSchedule,
  currentInputs,
  infrastructureIssues,
  isSafetyReplacement,
  agingRate,
  monthlyBudget = 0,
  prefetchedTiers,
  showFakeLoader = false,
  onFakeLoaderDone,
}: ReplacementOptionsPageProps) {
  const [selectedTier, setSelectedTier] = useState<QualityTier>('STANDARD');
  const [selectedTimeline, setSelectedTimeline] = useState<'now' | 'later' | 'thinking' | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(showFakeLoader);
  const [loaderProgress, setLoaderProgress] = useState(0);

  // Loader overlay timer - show for fixed duration then hide
  useEffect(() => {
    if (showFakeLoader) {
      setIsOverlayVisible(true);
      const timer = setTimeout(() => {
        setIsOverlayVisible(false);
        onFakeLoaderDone?.();
      }, LOADER_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [showFakeLoader, onFakeLoaderDone]);

  // Smooth time-based progress bar
  useEffect(() => {
    if (!isOverlayVisible) {
      setLoaderProgress(0);
      return;
    }
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / LOADER_DURATION_MS) * 100);
      setLoaderProgress(progress);
      
      if (elapsed >= LOADER_DURATION_MS) {
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [isOverlayVisible]);

  // Loader animation content
  const capacityDisplay = `${currentInputs.tankCapacity || 50} gallon`;
  const fuelDisplay = currentInputs.fuelType === 'ELECTRIC' ? 'Electric' : 'Gas';
  const ventDisplay = currentInputs.ventType || 'Standard';
  const analysisSteps = useMemo(() => [
    `Analyzing ${capacityDisplay} ${fuelDisplay.toLowerCase()} unit...`,
    `Checking ${ventDisplay.toLowerCase()} venting requirements...`,
    'Calculating material costs...',
    'Reviewing installation complexity...',
    'Generating options...',
  ], [capacityDisplay, fuelDisplay, ventDisplay]);
  const { displayedLines, currentLineIndex, isComplete: typewriterComplete } = useTypewriter({ lines: analysisSteps, typingSpeed: 13, lineDelay: 200 });
  const FuelIcon = currentInputs.fuelType === 'ELECTRIC' ? Zap : Flame;

  // Auto-detect installation complexity based on location and infrastructure issues
  const detectedComplexity = useMemo(() => 
    detectInstallComplexity(currentInputs.location, infrastructureIssues),
    [currentInputs.location, infrastructureIssues]
  );

  // Use prefetched tiers if available, otherwise fetch
  const shouldFetch = !prefetchedTiers;
  const { tiers: fetchedTiers, allLoading } = useTieredPricing(
    currentInputs, 
    undefined, 
    detectedComplexity, 
    shouldFetch, 
    infrastructureIssues
  );

  // Use prefetched tiers if available
  const tiers = prefetchedTiers ?? fetchedTiers;

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

  // Loader overlay
  if (isOverlayVisible) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="w-full max-w-md space-y-8">
          {/* Unit specs card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <FuelIcon className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{capacityDisplay}</p>
                <p className="text-sm text-gray-400">{fuelDisplay} • {ventDisplay}</p>
              </div>
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${loaderProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">{loaderProgress}%</p>
          </div>

          {/* Terminal-style output */}
          <div className="p-4 rounded-xl bg-black/40 font-mono text-sm space-y-2 min-h-[140px]">
            <AnimatePresence mode="popLayout">
              {displayedLines.map((line, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  {idx < currentLineIndex ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                  <span className={idx < currentLineIndex ? 'text-gray-400' : 'text-white'}>
                    {line}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Status */}
          <div className="text-center text-gray-400">
            <span className="flex items-center justify-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              {typewriterComplete ? 'Finalizing' : 'Analyzing'}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between max-w-md mx-auto px-4 py-3">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center flex-1">
            <h1 className="font-semibold text-lg">Your Options</h1>
          </div>
          <TierEducationDrawer 
            infrastructureIssues={infrastructureIssues}
            housePsi={currentInputs.housePsi}
            hardnessGPG={currentInputs.hardnessGPG}
          />
        </div>
      </header>

      <div className="px-4 pt-4 pb-32 max-w-md mx-auto">
        {/* Intro */}
        <p className="text-sm text-muted-foreground text-center mb-5">
          All options include professional installation and protect your home.
        </p>

        {/* Tier Cards - Beautiful Visual Design */}
        <div className="space-y-4 mb-6">
          {DISPLAY_TIERS.map((tier, tierIndex) => {
            const config = TIER_DISPLAY[tier];
            const tierPricing = TIER_CONFIG[tier];
            const tierData = tiers[tier];
            const TierIcon = config.icon;
            const isSelected = selectedTier === tier;
            const isRecommended = tier === 'STANDARD';
            const priceRange = getPriceRange(tier);
            const infraCount = tierData.includedIssues.length;

            return (
              <motion.button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tierIndex * 0.1, duration: 0.3 }}
                className={cn(
                  'w-full text-left rounded-2xl border-2 transition-all duration-300 overflow-hidden relative group',
                  config.cardBg,
                  isSelected 
                    ? cn(config.selectedBorder, config.selectedGlow)
                    : cn(config.cardBorder, 'hover:scale-[1.02]'),
                )}
              >
                {/* Subtle animated gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>

                {/* Badge for recommended */}
                {isRecommended && (
                  <div className={cn(
                    "text-xs py-2 px-4 text-center flex items-center justify-center gap-1.5",
                    config.badgeBg,
                    config.badgeText
                  )}>
                    <span className="animate-pulse">★</span>
                    Most Popular
                  </div>
                )}

                <div className="p-5">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {/* Selection indicator with icon */}
                      <div className={cn(
                        'relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
                        config.iconBg,
                        isSelected && 'ring-2 ring-offset-2 ring-offset-background',
                        isSelected && config.selectedBorder.replace('border-', 'ring-')
                      )}>
                        <TierIcon className={cn('w-6 h-6', config.iconColor)} />
                        {/* Selection checkmark overlay */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className={cn(
                                'absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
                                tier === 'STANDARD' ? 'bg-primary' : 
                                tier === 'PROFESSIONAL' ? 'bg-amber-400' :
                                tier === 'PREMIUM' ? 'bg-purple-400' : 'bg-slate-400'
                              )}
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Tier Name & Tagline */}
                      <div>
                        <h3 className={cn(
                          'font-bold text-xl tracking-tight',
                          isSelected ? 'text-foreground' : 'text-foreground/90'
                        )}>
                          {config.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {config.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className="text-right">
                      {tierData.loading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : priceRange ? (
                        <div>
                          <span className={cn(
                            'font-bold text-xl tracking-tight',
                            isSelected ? config.priceColor : 'text-foreground'
                          )}>
                            {formatPriceRange(priceRange)}
                          </span>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {tierPricing.warranty}yr warranty
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={cn(
                    'h-px mb-4',
                    isSelected ? 'bg-white/10' : 'bg-border/50'
                  )} />

                  {/* Features Grid */}
                  <div className="space-y-2.5">
                    {config.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                          isSelected ? config.iconBg : 'bg-muted/50'
                        )}>
                          <Check className={cn('w-3 h-3', isSelected ? config.checkColor : 'text-muted-foreground')} />
                        </div>
                        <span className={cn(
                          'text-sm',
                          isSelected ? 'text-foreground' : 'text-muted-foreground'
                        )}>
                          {feature}
                        </span>
                      </div>
                    ))}
                    
                    {/* Infrastructure items - highlighted */}
                    {infraCount > 0 && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                          config.iconBg
                        )}>
                          <Shield className={cn('w-3 h-3', config.iconColor)} />
                        </div>
                        <span className={cn('font-medium text-sm', config.priceColor)}>
                          +{infraCount} infrastructure fix{infraCount > 1 ? 'es' : ''} included
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom accent bar when selected */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ scaleX: 0 }}
                      className={cn(
                        'h-1 origin-left',
                        tier === 'STANDARD' ? 'bg-gradient-to-r from-primary to-amber-500' :
                        tier === 'PROFESSIONAL' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                        tier === 'PREMIUM' ? 'bg-gradient-to-r from-purple-400 to-violet-500' :
                        'bg-slate-400'
                      )}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Timeline Selection */}
        <div className="space-y-2 mb-5">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            When works for you?
          </p>
          
          {/* Ready Now */}
          <button
            onClick={() => setSelectedTimeline('now')}
            className={cn(
              'w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'now'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50'
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
              <span className="font-medium text-foreground">Ready soon</span>
              <p className="text-xs text-muted-foreground">Schedule within 2 weeks</p>
            </div>
          </button>
          
          {/* Plan Ahead */}
          {!isSafetyReplacement && (
            <button
              onClick={() => setSelectedTimeline('later')}
              className={cn(
                'w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3',
                selectedTimeline === 'later'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                selectedTimeline === 'later' ? 'border-primary bg-primary' : 'border-muted-foreground/40'
              )}>
                {selectedTimeline === 'later' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex-1">
                <span className="font-medium text-foreground">Need more time</span>
                <p className="text-xs text-muted-foreground">
                  Plan for the next 12 months
                  {monthlyBudget > 0 && <span className="text-primary"> • ${monthlyBudget}/mo</span>}
                </p>
              </div>
            </button>
          )}

          {/* Still deciding */}
          <button
            onClick={() => setSelectedTimeline('thinking')}
            className={cn(
              'w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3',
              selectedTimeline === 'thinking'
                ? 'border-muted-foreground/50 bg-muted/20'
                : 'border-border/50 hover:border-muted-foreground/30'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
              selectedTimeline === 'thinking' ? 'border-muted-foreground bg-muted-foreground' : 'border-muted-foreground/30'
            )}>
              {selectedTimeline === 'thinking' && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-muted-foreground">Still deciding</span>
          </button>

          {/* Gentle reminder for thinking */}
          {selectedTimeline === 'thinking' && (
            <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  No pressure—we're here when you're ready.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Summary card */}
        {!allLoading && selectedPriceRange && selectedTimeline && selectedTimeline !== 'thinking' && (
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Selected</p>
                <p className="font-semibold text-foreground">{TIER_DISPLAY[selectedTier].name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">{formatPriceRange(selectedPriceRange)}</p>
                <p className="text-xs text-muted-foreground">installed</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      {selectedTimeline !== null && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto">
            <Button
              onClick={() => {
                if (selectedTimeline === 'thinking') {
                  onBack();
                } else {
                  setShowContactForm(true);
                }
              }}
              className="w-full"
              size="lg"
              variant={selectedTimeline === 'thinking' ? 'outline' : 'default'}
            >
              {selectedTimeline === 'now' 
                ? "Get Started"
                : selectedTimeline === 'thinking'
                  ? 'Back to Dashboard'
                  : 'Request a Quote'
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
        captureContext={{
          selectedTier: selectedTier,
          selectedTimeline: selectedTimeline,
          isSafetyReplacement: isSafetyReplacement,
          priceRange: selectedPriceRange,
        }}
      />
    </div>
  );
}
