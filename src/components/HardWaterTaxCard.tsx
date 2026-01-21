import { Droplets, CheckCircle2, ShieldCheck, AlertTriangle, Zap, Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HardWaterTax } from '@/lib/opterraAlgorithm';

interface HardWaterTaxCardProps {
  hardWaterTax: HardWaterTax;
}

// Helper to convert numeric impact to qualitative label
function getImpactLabel(value: number, type: 'energy' | 'appliance' | 'detergent' | 'plumbing'): { label: string; severity: 'low' | 'moderate' | 'high' | 'severe' } {
  // Different thresholds for different impact types
  const thresholds = {
    energy: { low: 30, moderate: 60, high: 100 },
    appliance: { low: 50, moderate: 100, high: 150 },
    detergent: { low: 100, moderate: 200, high: 300 },
    plumbing: { low: 50, moderate: 100, high: 150 },
  };
  
  const t = thresholds[type];
  
  if (value <= 0) return { label: 'None', severity: 'low' };
  if (value < t.low) return { label: 'Low', severity: 'low' };
  if (value < t.moderate) return { label: 'Moderate', severity: 'moderate' };
  if (value < t.high) return { label: 'High', severity: 'high' };
  return { label: 'Severe', severity: 'severe' };
}

function getSeverityColor(severity: 'low' | 'moderate' | 'high' | 'severe'): string {
  switch (severity) {
    case 'low': return 'text-emerald-400';
    case 'moderate': return 'text-yellow-400';
    case 'high': return 'text-amber-400';
    case 'severe': return 'text-red-400';
  }
}

export function HardWaterTaxCard({ hardWaterTax }: HardWaterTaxCardProps) {
  const {
    hardnessGPG,
    energyLoss,
    applianceDepreciation,
    detergentOverspend,
    plumbingProtection,
    recommendation,
    protectedAmount,
    netAnnualSavings,
    softenerAnnualCost,
  } = hardWaterTax;

  // Don't render if no recommendation needed
  if (recommendation === 'NONE') {
    return null;
  }

  // v7.6: PROTECTED state - softener is working
  if (recommendation === 'PROTECTED') {
    return (
      <div className="command-card overflow-hidden border-emerald-500/30">
        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500/50 via-green-500/50 to-emerald-500/50" />
        
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-emerald-400">
                  Protected by Softener
                </h3>
                <p className="text-xs text-muted-foreground">
                  Your equipment is shielded from hard water
                </p>
              </div>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              {hardnessGPG} GPG Area
            </div>
          </div>

          {/* Protection Status */}
          <div className="text-center py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">Protection Status</p>
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <p className="text-lg font-bold text-emerald-400">Active</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Your softener is working effectively</p>
          </div>

          {/* Net Benefit Summary */}
          {netAnnualSavings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Net annual benefit:</span>
              <span className="font-bold text-emerald-400">Positive ROI ✓</span>
            </div>
          )}
          
          {/* Softener status */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Softener maintaining equipment protection</span>
            <span className="text-emerald-400">Active ✓</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate impact labels
  const energyImpact = getImpactLabel(energyLoss, 'energy');
  const applianceImpact = getImpactLabel(applianceDepreciation, 'appliance');
  const detergentImpact = getImpactLabel(detergentOverspend, 'detergent');
  const plumbingImpact = getImpactLabel(plumbingProtection, 'plumbing');
  
  // Calculate overall impact level
  const impactCount = [energyImpact, applianceImpact, detergentImpact, plumbingImpact]
    .filter(i => i.severity === 'high' || i.severity === 'severe').length;
  const overallImpact = impactCount >= 3 ? 'High' : impactCount >= 1 ? 'Moderate' : 'Low';

  const isRecommend = recommendation === 'RECOMMEND';

  return (
    <div className={cn(
      "command-card overflow-hidden",
      isRecommend ? "border-amber-500/30" : "border-yellow-500/20"
    )}>
      {/* Accent bar */}
      <div className={cn(
        "h-1",
        isRecommend 
          ? "bg-gradient-to-r from-amber-500/50 via-orange-500/50 to-amber-500/50" 
          : "bg-gradient-to-r from-yellow-500/30 via-yellow-400/30 to-yellow-500/30"
      )} />
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isRecommend 
                ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30" 
                : "bg-yellow-500/10 border border-yellow-500/20"
            )}>
              <Droplets className={cn(
                "w-5 h-5",
                isRecommend ? "text-amber-400" : "text-yellow-400"
              )} />
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-sm",
                isRecommend ? "text-amber-400" : "text-yellow-400"
              )}>
                {isRecommend ? 'Softener Recommended' : 'Consider Softener'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRecommend 
                  ? 'Hard water is affecting your equipment'
                  : 'Moderate hardness detected'
                }
              </p>
            </div>
          </div>
          <div className={cn(
            "text-xs font-bold px-3 py-1.5 rounded-full",
            isRecommend 
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" 
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          )}>
            {hardnessGPG} GPG
          </div>
        </div>

        {/* Overall Impact Display */}
        <div className="text-center py-3 bg-secondary/20 rounded-xl border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Overall Hard Water Impact</p>
          <p className={cn(
            "text-xl font-bold",
            overallImpact === 'High' ? "text-amber-400" : 
            overallImpact === 'Moderate' ? "text-yellow-400" : "text-emerald-400"
          )}>
            {overallImpact}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">on equipment and household costs</p>
        </div>

        {/* Impact Breakdown - Qualitative Labels */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Zap className="w-4 h-4 mx-auto mb-1.5 text-orange-400/70" />
            <p className={cn("text-xs font-bold", getSeverityColor(energyImpact.severity))}>
              {energyImpact.label}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Energy</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Home className="w-4 h-4 mx-auto mb-1.5 text-red-400/70" />
            <p className={cn("text-xs font-bold", getSeverityColor(applianceImpact.severity))}>
              {applianceImpact.label}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Appliances</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Sparkles className="w-4 h-4 mx-auto mb-1.5 text-blue-400/70" />
            <p className={cn("text-xs font-bold", getSeverityColor(detergentImpact.severity))}>
              {detergentImpact.label}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Soap Usage</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 mx-auto mb-1.5 text-purple-400/70" />
            <p className={cn("text-xs font-bold", getSeverityColor(plumbingImpact.severity))}>
              {plumbingImpact.label}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Plumbing</p>
          </div>
        </div>

        {/* Softener Recommendation */}
        {isRecommend && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">With a Softener</span>
              </div>
              <span className="text-xs font-bold text-emerald-400">Positive ROI</span>
            </div>
            <p className="text-xs text-muted-foreground">
              A water softener would reduce wear on your water heater and household appliances while lowering soap usage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
