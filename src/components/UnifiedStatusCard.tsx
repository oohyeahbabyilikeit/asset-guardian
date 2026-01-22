import { useState } from 'react';
import { Activity, ChevronDown, ChevronRight, AlertTriangle, Droplets, Gauge, Clock, Wrench, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type HealthScore as HealthScoreType, type AssetData } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel, type OpterraMetrics, type Recommendation, type FuelType, isTankless, type ForensicInputs } from '@/lib/opterraAlgorithm';
import { getInfrastructureIssues, type InfrastructureIssue } from '@/lib/infrastructureIssues';
import containmentBreachImg from '@/assets/containment-breach.png';

interface UnifiedStatusCardProps {
  asset: AssetData;
  inputs: ForensicInputs;
  healthScore: HealthScoreType;
  riskLevel: RiskLevel;
  recommendation: Recommendation;
  metrics?: OpterraMetrics;
  yearsRemaining?: number;
  onIssueLearnMore?: (issue: InfrastructureIssue) => void;
}

type VerdictType = 'replace-now' | 'replace-soon' | 'maintain' | 'monitor';

function getVerdictType(recommendation: Recommendation, isLeaking?: boolean, visualRust?: boolean): VerdictType {
  if (isLeaking || visualRust) return 'replace-now';
  if (recommendation.action === 'REPLACE') {
    return recommendation.urgent ? 'replace-now' : 'replace-soon';
  }
  if (recommendation.action === 'REPAIR' || recommendation.action === 'MAINTAIN') {
    return 'maintain';
  }
  return 'monitor';
}

function getVerdictConfig(verdictType: VerdictType) {
  const configs = {
    'replace-now': {
      icon: AlertTriangle,
      title: 'Replace Your Water Heater',
      accentColor: 'text-destructive',
    },
    'replace-soon': {
      icon: Clock,
      title: 'Plan for Replacement',
      accentColor: 'text-amber-400',
    },
    'maintain': {
      icon: Wrench,
      title: 'Schedule Maintenance',
      accentColor: 'text-cyan-400',
    },
    'monitor': {
      icon: CheckCircle,
      title: 'Your Unit Is Running Well',
      accentColor: 'text-emerald-400',
    },
  };
  return configs[verdictType];
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
      return recommendation.reason || "Regular maintenance will help extend the life of your water heater.";
    case 'monitor':
      if (yearsRemaining !== undefined && yearsRemaining > 0) {
        return `No immediate action needed. With proper care, expect approximately ${Math.ceil(yearsRemaining)} more years of service.`;
      }
      return recommendation.reason || "Your water heater is in good condition.";
  }
}

export function UnifiedStatusCard({
  asset,
  inputs,
  healthScore,
  riskLevel,
  recommendation,
  metrics,
  yearsRemaining,
  onIssueLearnMore,
}: UnifiedStatusCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { score, status, failureProbability } = healthScore;
  const isTanklessUnit = isTankless(inputs.fuelType);

  // Detect infrastructure issues
  const infrastructureIssues = inputs && metrics ? getInfrastructureIssues(inputs, metrics) : [];
  const criticalIssues = infrastructureIssues.filter(i => i.category === 'VIOLATION');
  const hasViolations = criticalIssues.length > 0;

  // Breach detection
  const isBreach = inputs.isLeaking || inputs.visualRust;

  // Verdict
  const verdictType = getVerdictType(recommendation, inputs.isLeaking, inputs.visualRust);
  const verdictConfig = getVerdictConfig(verdictType);
  const VerdictIcon = verdictConfig.icon;
  const verdictDescription = getVerdictDescription(verdictType, recommendation, yearsRemaining, inputs.isLeaking, inputs.visualRust);

  // Location label
  const locationLabel = {
    'ATTIC': 'Attic',
    'UPPER_FLOOR': 'Upper Floor',
    'MAIN_LIVING': 'Main Living Area',
    'BASEMENT': 'Basement',
    'GARAGE': 'Garage',
    'EXTERIOR': 'Exterior',
    'CRAWLSPACE': 'Crawlspace',
  }[inputs.location] || inputs.location;

  // Vent type label
  const ventTypeLabel = {
    'DIRECT_VENT': 'Direct',
    'POWER_VENT': 'Power',
    'ATMOSPHERIC': 'Atmospheric',
    'CONCENTRIC': 'Concentric',
    'SIDEWALL': 'Sidewall',
  }[asset.specs.ventType] || asset.specs.ventType;

  const getRiskStatus = () => {
    if (failureProbability === 'FAIL') return 'CRITICAL';
    const prob = typeof failureProbability === 'number' ? failureProbability : 0;
    if (prob >= 60) return 'HIGH';
    if (prob >= 30) return 'ELEVATED';
    return 'NORMAL';
  };

  const riskStatus = getRiskStatus();

  const getStatusColor = () => {
    // Color based on health score: low = red (bad), medium = amber, high = green (good)
    if (score < 40) return 'text-red-400';
    if (score < 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getRingColor = () => {
    if (status === 'critical') return 'hsl(0 55% 48%)';
    if (status === 'warning') return 'hsl(32 65% 48%)';
    return 'hsl(158 45% 42%)';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "command-card overflow-hidden",
        status === 'critical' && "border-red-500/40",
        status === 'warning' && "border-amber-500/40"
      )}>
        {/* Status gradient bar at top */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1",
          status === 'critical' && "bg-gradient-to-r from-red-500/60 via-red-400/80 to-red-500/60",
          status === 'warning' && "bg-gradient-to-r from-amber-500/60 via-amber-400/80 to-amber-500/60",
          status === 'optimal' && "bg-gradient-to-r from-emerald-500/60 via-emerald-400/80 to-emerald-500/60"
        )} />

        {/* Main Content Area */}
        <div className="p-4 space-y-4">
          {/* Row 1: Unit Identity + Health Score */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-foreground truncate">
                {asset.brand} {asset.model}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {asset.specs.capacity} • {asset.paperAge} yrs old • {locationLabel}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-baseline gap-1">
                <span className={cn("text-2xl font-bold", getStatusColor())}>
                  {score}
                </span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              {isBreach && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse mt-1">
                  BREACH
                </span>
              )}
            </div>
          </div>

          {/* Health Bar */}
          <div className="relative h-3 rounded-full bg-secondary/60 overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute w-px h-full bg-background/30" style={{ left: `${i * 5}%` }} />
              ))}
            </div>
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out",
                status === 'critical' && "bg-gradient-to-r from-red-600 via-red-500 to-red-400",
                status === 'warning' && "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400",
                status === 'optimal' && "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400"
              )}
              style={{
                width: `${score}%`,
                boxShadow: `0 0 16px ${getRingColor()}50, inset 0 1px 0 rgba(255,255,255,0.2)`
              }}
            />
          </div>

          {/* Breach Evidence Photo */}
          {isBreach && (
            <div className="relative rounded-lg overflow-hidden border border-red-500/30 bg-red-500/5">
              <img
                src={inputs.photoUrls?.condition || containmentBreachImg}
                alt={inputs.photoUrls?.condition ? "Documented breach evidence" : "Example of breach evidence"}
                className="w-full h-28 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none" />
              {inputs.photoUrls?.condition && (
                <div className="absolute bottom-1 left-2 text-[10px] text-red-200/80 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  Photo from your inspection
                </div>
              )}
            </div>
          )}

          {/* Violations - Inline format (no box) */}
          {hasViolations && (
            <div className="space-y-2">
              {criticalIssues.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => onIssueLearnMore?.(issue)}
                  className="w-full text-left flex items-center gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/15 active:bg-destructive/20 transition-colors min-h-[48px] group cursor-pointer"
                >
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                  <span className="flex-1 text-sm text-destructive font-medium break-words leading-snug">
                    <span className="font-bold">CODE ISSUE:</span> {issue.friendlyName}
                    <span className="block text-xs text-destructive/70 mt-0.5 group-hover:underline">Tap to learn more</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-destructive/60 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-border/30" />

          {/* Recommendation - Anchored */}
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
              verdictType === 'replace-now' ? "bg-destructive/10" : "bg-muted"
            )}>
              <VerdictIcon className={cn("w-4 h-4", verdictConfig.accentColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                Our Recommendation
              </p>
              {/* Show combined message when violations exist with maintenance */}
              {hasViolations && (verdictType === 'maintain' || verdictType === 'monitor') ? (
                <>
                  <h3 className="text-sm font-semibold text-foreground">
                    Fix Code Issues + {verdictConfig.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    <span className="text-destructive font-medium">Address the code {criticalIssues.length === 1 ? 'violation' : 'violations'} above</span>
                    {' '}and continue with scheduled maintenance to protect your investment.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-foreground">
                    {verdictConfig.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                    {verdictDescription}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Trigger for Details */}
        <CollapsibleTrigger className="w-full border-t border-border/30">
          <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3.5 h-3.5" />
            <span>{isOpen ? 'Hide details' : 'View unit details'}</span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content - Unit Details */}
        <CollapsibleContent>
          <div className="p-4 border-t border-border/30 space-y-4 bg-secondary/5">
            {/* Serial & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Serial</span>
                <p className="font-mono text-xs text-foreground">{asset.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Model</span>
                <p className="font-mono text-xs text-foreground">{asset.model.replace(/\s+/g, '-').toUpperCase()}</p>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-secondary/30 rounded-lg">
                <p className="text-xs font-semibold text-foreground">{asset.specs.capacity}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Capacity</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded-lg">
                <p className="text-xs font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Fuel</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded-lg">
                <p className="text-xs font-semibold text-foreground">{ventTypeLabel}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Vent</p>
              </div>
              <div className="text-center p-2 bg-secondary/30 rounded-lg">
                <p className={cn(
                  "text-xs font-semibold",
                  inputs.warrantyYears - inputs.calendarAge <= 0 ? "text-red-400" :
                    inputs.warrantyYears - inputs.calendarAge <= 1 ? "text-amber-400" : "text-emerald-400"
                )}>
                  {Math.max(0, inputs.warrantyYears - inputs.calendarAge)}yr
                </p>
                <p className="text-[9px] text-muted-foreground mt-0.5">Warranty</p>
              </div>
            </div>

            {/* Equipment Checklist */}
            <div className="space-y-1.5 p-3 rounded-xl bg-secondary/20 border border-border/20">
              <EquipmentRow label="Pressure Reducing Valve" present={inputs.hasPrv} />
              <EquipmentRow label="Expansion Tank" present={inputs.hasExpTank} />
              <EquipmentRow label="Water Softener" present={inputs.hasSoftener} />
              <EquipmentRow label="Recirculation Pump" present={inputs.hasCircPump} />
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function EquipmentRow({ label, present }: { label: string; present?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {present ? (
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />
      )}
      <span className={cn("text-xs", present ? "text-foreground" : "text-muted-foreground/60")}>
        {label}
      </span>
    </div>
  );
}
