import { Flame, TrendingDown, Droplets, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HardWaterTax } from '@/lib/opterraAlgorithm';

interface HardWaterTaxCardProps {
  hardWaterTax: HardWaterTax;
}

export function HardWaterTaxCard({ hardWaterTax }: HardWaterTaxCardProps) {
  const {
    hardnessGPG,
    energyLoss,
    applianceDepreciation,
    detergentOverspend,
    totalAnnualLoss,
    softenerAnnualCost,
    netAnnualSavings,
    paybackYears,
    recommendation,
  } = hardWaterTax;

  // Don't render if no recommendation needed
  if (recommendation === 'NONE') {
    return null;
  }

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
                  ? 'High hardness is costing you money'
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

        {/* Main Cost Display */}
        <div className="text-center py-3 bg-secondary/20 rounded-xl border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">Annual Hard Water Tax</p>
          <p className="text-2xl font-bold text-amber-400 font-data">${totalAnnualLoss}</p>
          <p className="text-[10px] text-muted-foreground mt-1">per year in hidden costs</p>
        </div>

        {/* Cost Breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <Flame className="w-4 h-4 mx-auto mb-2 text-orange-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${energyLoss}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Energy Loss</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <TrendingDown className="w-4 h-4 mx-auto mb-2 text-red-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${applianceDepreciation}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Appliance Wear</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <Droplets className="w-4 h-4 mx-auto mb-2 text-blue-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${detergentOverspend}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Extra Soap</p>
          </div>
        </div>

        {/* ROI Summary */}
        {netAnnualSavings > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">With a Softener</span>
              </div>
              <span className="text-lg font-bold font-data text-emerald-400">+${netAnnualSavings}/yr</span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Softener cost: ~${softenerAnnualCost}/yr amortized</span>
              {paybackYears < 20 && (
                <span>Pays for itself in ~{paybackYears} yrs</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
