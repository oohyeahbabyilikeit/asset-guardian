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
      "command-card p-5",
      isRecommend ? "border-amber-500/30" : "border-yellow-500/20"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "command-icon shrink-0",
          isRecommend ? "command-icon-warning" : "bg-yellow-500/10 border border-yellow-500/20"
        )}>
          <AlertTriangle className={cn(
            "w-5 h-5",
            isRecommend ? "text-amber-400" : "text-yellow-400"
          )} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn(
              "font-semibold text-sm",
              isRecommend ? "text-amber-400" : "text-yellow-400"
            )}>
              {isRecommend ? 'SOFTENER RECOMMENDED' : 'CONSIDER SOFTENER'}
            </span>
            <span className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full border",
              isRecommend 
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
            )}>
              {hardnessGPG} GPG
            </span>
          </div>
          
          <p className="text-sm font-medium text-foreground mb-1">
            Hard Water Tax: <span className="font-data text-amber-300">${totalAnnualLoss}</span>/year
          </p>
          
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {isRecommend 
              ? `High hardness is costing you money. A softener pays for itself.`
              : `Moderate hardness detected. Consider for comfort and efficiency.`
            }
          </p>

          {/* Breakdown Grid - muted icons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="data-display text-center">
              <Flame className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Energy</p>
              <p className="text-xs font-semibold font-data text-foreground">${energyLoss}</p>
            </div>
            <div className="data-display text-center">
              <TrendingDown className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Appliance</p>
              <p className="text-xs font-semibold font-data text-foreground">${applianceDepreciation}</p>
            </div>
            <div className="data-display text-center">
              <Droplets className="w-3.5 h-3.5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">Soap</p>
              <p className="text-xs font-semibold font-data text-foreground">${detergentOverspend}</p>
            </div>
          </div>

          {/* ROI Comparison */}
          <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Annual Hard Water Loss</span>
              <span className="font-data font-medium text-amber-400">${totalAnnualLoss}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Softener Cost (amortized)</span>
              <span className="font-data font-medium text-muted-foreground">${softenerAnnualCost}</span>
            </div>
            {netAnnualSavings > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Net Savings</span>
                </div>
                <span className="font-data font-bold text-emerald-400">${netAnnualSavings}/yr</span>
              </div>
            )}
          </div>

          {/* Payback Period */}
          {netAnnualSavings > 0 && paybackYears < 20 && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Payback period: ~{paybackYears} years • ~$20/mo over softener lifetime
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
