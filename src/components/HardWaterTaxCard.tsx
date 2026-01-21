import { Flame, WashingMachine, Droplets, CheckCircle2, Wrench, ShieldCheck } from 'lucide-react';
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
    plumbingProtection,
    totalAnnualLoss,
    softenerAnnualCost,
    netAnnualSavings,
    paybackYears,
    recommendation,
    protectedAmount,
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

          {/* Savings Display */}
          <div className="text-center py-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            <p className="text-xs text-muted-foreground mb-1">Annual Protection Value</p>
            <p className="text-2xl font-bold text-emerald-400 font-data">${protectedAmount || 0}</p>
            <p className="text-[10px] text-muted-foreground mt-1">saved per year by your softener</p>
          </div>

          {/* Net Savings */}
          {netAnnualSavings > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Net savings (after salt & maintenance):</span>
              <span className="font-bold text-emerald-400">+${netAnnualSavings}/yr</span>
            </div>
          )}
          
          {/* ROI Breakdown */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Softener operating cost: ~${softenerAnnualCost}/yr</span>
            <span className="text-emerald-400">ROI: Positive ✓</span>
          </div>
        </div>
      </div>
    );
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
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Flame className="w-4 h-4 mx-auto mb-1.5 text-orange-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${energyLoss}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Energy Loss</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <WashingMachine className="w-4 h-4 mx-auto mb-1.5 text-red-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${applianceDepreciation}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Appliances</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Droplets className="w-4 h-4 mx-auto mb-1.5 text-blue-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${detergentOverspend}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Extra Soap</p>
          </div>
          <div className="text-center p-2 bg-secondary/30 rounded-lg">
            <Wrench className="w-4 h-4 mx-auto mb-1.5 text-purple-400/70" />
            <p className="text-sm font-bold font-data text-foreground">${plumbingProtection}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Pipes</p>
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
              <span>Annual operating cost: ~${softenerAnnualCost}</span>
              <span className="font-semibold text-emerald-400">10-Year Savings: ${netAnnualSavings * 10}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
