import { useEffect, useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, MapPin, Calendar, Activity, Droplets, Gauge, Shield, ArrowRight, Wrench, RefreshCw, Loader2, Bell, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIssueGuidance, type IssueGuidance } from '@/hooks/useIssueGuidance';
import { getIssueGuidanceContext, type IssueGuidanceContext } from '@/lib/issueGuidanceContext';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import type { ForensicInputs, OpterraMetrics, Recommendation } from '@/lib/opterraAlgorithm';
import { NotifyMeModal } from './NotifyMeModal';
import { getLocationKey } from '@/data/damageScenarios';

interface IssueGuidanceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: InfrastructureIssue | null;
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  recommendation: Recommendation;
  healthScore: number;
  manufacturer?: string;
  onScheduleService?: () => void;
  onGetQuote?: () => void;
}

function formatLocation(location: string): string {
  const map: Record<string, string> = {
    'ATTIC': 'Attic',
    'BASEMENT': 'Basement',
    'GARAGE': 'Garage',
    'UTILITY_CLOSET': 'Utility Closet',
    'LIVING_AREA': 'Living Area',
    'CRAWLSPACE': 'Crawlspace',
    'EXTERIOR': 'Exterior',
  };
  return map[location.toUpperCase()] || location;
}

function getIssueIcon(issueId: string) {
  if (issueId.includes('exp_tank')) return Droplets;
  if (issueId.includes('prv')) return Gauge;
  if (issueId.includes('softener')) return Droplets;
  return Shield;
}

export function IssueGuidanceDrawer({
  open,
  onOpenChange,
  issue,
  inputs,
  metrics,
  recommendation,
  healthScore,
  manufacturer,
  onScheduleService,
  onGetQuote,
}: IssueGuidanceDrawerProps) {
  const { guidance, isLoading, error, fetchGuidance, getStaticFallback } = useIssueGuidance();
  const [displayGuidance, setDisplayGuidance] = useState<IssueGuidance | null>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // Fetch guidance when drawer opens with a new issue
  useEffect(() => {
    if (open && issue) {
      const context = getIssueGuidanceContext(
        issue,
        inputs,
        metrics,
        recommendation,
        healthScore
      );
      
      fetchGuidance(context);
    }
  }, [open, issue?.id]);

  // Use AI guidance or fall back to static
  useEffect(() => {
    if (guidance) {
      setDisplayGuidance(guidance);
    } else if (error && issue) {
      // Use static fallback on error
      const isServiceable = recommendation.action !== 'REPLACE' && healthScore > 30;
      setDisplayGuidance(getStaticFallback(issue, isServiceable, healthScore, inputs.location));
    }
  }, [guidance, error, issue, recommendation.action, healthScore, inputs.location, getStaticFallback]);

  if (!issue) return null;

  const locationKey = getLocationKey(inputs.location);
  const isHighRiskLocation = ['ATTIC', 'UTILITY_CLOSET', 'LIVING_AREA'].includes(locationKey);
  const IssueIcon = getIssueIcon(issue.id);
  
  // Determine theme based on shouldFix
  const shouldFix = displayGuidance?.shouldFix ?? (recommendation.action !== 'REPLACE' && healthScore > 30);
  const themeColor = shouldFix ? 'emerald' : 'amber';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto">
          {/* Header with gradient */}
          <DrawerHeader className={cn(
            "relative pb-4 border-b",
            shouldFix 
              ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20"
              : "bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2.5 rounded-xl shrink-0",
                shouldFix ? "bg-emerald-500/20" : "bg-amber-500/20"
              )}>
                <IssueIcon className={cn(
                  "w-5 h-5",
                  shouldFix ? "text-emerald-500" : "text-amber-500"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  issue.category === 'VIOLATION' 
                    ? "bg-destructive/20 text-destructive" 
                    : issue.category === 'INFRASTRUCTURE'
                    ? "bg-amber-500/20 text-amber-500"
                    : "bg-blue-500/20 text-blue-500"
                )}>
                  {issue.category === 'VIOLATION' ? 'Code Violation' : issue.category}
                </span>
                <DrawerTitle className="text-lg mt-1.5">{issue.friendlyName}</DrawerTitle>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5">
            {/* Unit Context Card */}
            <div className="bg-secondary/30 rounded-xl p-4 mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Your Unit
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Age</div>
                    <div className="text-sm font-semibold">{inputs.calendarAge}yr</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Health</div>
                    <div className={cn(
                      "text-sm font-semibold",
                      healthScore >= 60 ? "text-emerald-500" :
                      healthScore >= 30 ? "text-amber-500" :
                      "text-red-500"
                    )}>
                      {healthScore}/100
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="text-sm font-semibold truncate">{formatLocation(inputs.location)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Analyzing your situation...</span>
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {/* Guidance Content */}
            {displayGuidance && !isLoading && (
              <>
                {/* Headline Banner */}
                <div className={cn(
                  "rounded-xl p-4 border",
                  shouldFix 
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                )}>
                  <div className="flex items-center gap-2">
                    {shouldFix ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                    <span className={cn(
                      "font-bold text-lg",
                      shouldFix ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {displayGuidance.headline}
                    </span>
                  </div>
                </div>

                {/* What This Means */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    What This Means
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {displayGuidance.explanation}
                  </p>
                </div>

                {/* Your Situation */}
                <div className="bg-secondary/40 rounded-xl p-4 border border-border/50">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Your Situation
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {displayGuidance.yourSituation}
                  </p>
                </div>

                {/* High Risk Location Warning */}
                {isHighRiskLocation && (
                  <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/20">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      High-Risk Location
                    </h3>
                    <p className="text-sm text-foreground/80">
                      Your water heater is in a {formatLocation(inputs.location).toLowerCase()}, where a leak could cause significant damage to your home.
                    </p>
                  </div>
                )}

                {/* Recommendation */}
                <div className={cn(
                  "rounded-xl p-4 border-2",
                  shouldFix 
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-amber-500/5 border-amber-500/30"
                )}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    {shouldFix ? (
                      <>
                        <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Our Recommendation</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-500">Our Recommendation</span>
                      </>
                    )}
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                    {displayGuidance.recommendation}
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    {displayGuidance.economicContext}
                  </p>
                </div>

                {/* Action Items */}
                <div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Next Steps
                  </h3>
                  <div className="space-y-2">
                    {displayGuidance.actionItems.map((item, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold",
                          shouldFix 
                            ? "bg-emerald-500/20 text-emerald-500"
                            : "bg-amber-500/20 text-amber-500"
                        )}>
                          {index + 1}
                        </div>
                        <span className="text-sm text-foreground/80">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="pt-2 space-y-3">
                  <Button 
                    variant="outline"
                    className="w-full h-11 gap-2"
                    onClick={() => setShowNotifyModal(true)}
                  >
                    <Bell className="w-4 h-4" />
                    Set a Reminder
                  </Button>
                  
                  <Button 
                    className={cn(
                      "w-full h-12 text-base font-semibold gap-2",
                      shouldFix 
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-amber-600 hover:bg-amber-700"
                    )}
                    onClick={() => {
                      onOpenChange(false);
                      if (shouldFix) {
                        onScheduleService?.();
                      } else {
                        onGetQuote?.();
                      }
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Have My Plumber Reach Out
                  </Button>
                  
                  <p className="text-center text-xs text-muted-foreground">
                    Your plumber will contact you to discuss your options
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
      
      {/* Notify Me Modal */}
      <NotifyMeModal
        open={showNotifyModal}
        onOpenChange={setShowNotifyModal}
        tasks={issue ? [{
          id: issue.id,
          label: issue.friendlyName,
          dueDate: new Date(),
        }] : []}
      />
    </Drawer>
  );
}
