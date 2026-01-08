import { Flame, TrendingDown, Droplets, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HardWaterTax } from '@/lib/opterraAlgorithm';

interface HardWaterTaxCardProps {
  hardWaterTax: HardWaterTax;
}

export function HardWaterTaxCard({ hardWaterTax }: HardWaterTaxCardProps) {
  const {
    hardnessGPG,
    hasSoftener,
    energyLoss,
    applianceDepreciation,
    detergentOverspend,
    totalAnnualLoss,
    softenerAnnualCost,
    netAnnualSavings,
    paybackYears,
    recommendation,
    reason,
    badgeColor
  } = hardWaterTax;

  // Don't render if no recommendation needed
  if (recommendation === 'NONE') {
    return null;
  }

  const getBadgeVariant = () => {
    switch (badgeColor) {
      case 'orange': return 'destructive';
      case 'yellow': return 'secondary';
      default: return 'outline';
    }
  };

  const getBadgeText = () => {
    switch (recommendation) {
      case 'RECOMMEND': return 'RECOMMEND';
      case 'CONSIDER': return 'CONSIDER';
      default: return 'INFO';
    }
  };

  const lossBarPercent = Math.min((totalAnnualLoss / (totalAnnualLoss + 100)) * 100, 100);
  const softenerBarPercent = Math.min((softenerAnnualCost / (totalAnnualLoss + 100)) * 100, 100);

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle className="text-lg font-semibold">Hard Water Tax</CardTitle>
          </div>
          <Badge variant={getBadgeVariant()} className={
            badgeColor === 'orange' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : badgeColor === 'yellow' 
                ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                : ''
          }>
            {getBadgeText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Stat - The "Tax" */}
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground mb-1">You're losing</p>
          <p className="text-4xl font-bold text-orange-600 dark:text-orange-400">
            ${totalAnnualLoss}<span className="text-lg font-normal">/year</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">to hard water ({hardnessGPG} GPG)</p>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <Flame className="h-4 w-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">Energy Waste</p>
            <p className="text-sm font-semibold">${energyLoss}/yr</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <TrendingDown className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <p className="text-xs text-muted-foreground">Appliance Risk</p>
            <p className="text-sm font-semibold">${applianceDepreciation}/yr</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <Droplets className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Soap/Cleaner</p>
            <p className="text-sm font-semibold">${detergentOverspend}/yr</p>
          </div>
        </div>

        {/* Comparison Bars */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Annual Hard Water Loss</span>
              <span className="font-medium text-orange-600">${totalAnnualLoss}</span>
            </div>
            <Progress value={lossBarPercent} className="h-2 bg-orange-100 dark:bg-orange-900/30" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Softener Cost</span>
              <span className="font-medium text-green-600">${softenerAnnualCost}</span>
            </div>
            <Progress value={softenerBarPercent} className="h-2 bg-green-100 dark:bg-green-900/30" />
          </div>
        </div>

        {/* ROI Summary */}
        {netAnnualSavings > 0 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                Net Savings: ${netAnnualSavings}/year
              </p>
              <p className="text-green-600 dark:text-green-500 text-xs">
                Payback period: {paybackYears} years
              </p>
            </div>
          </div>
        )}

        {/* The Pitch */}
        <div className="bg-background/80 rounded-lg p-3 border border-border/50 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            A water softener costs roughly <span className="font-medium text-foreground">$20/month</span> over its life. 
            It pays for itself in savings alone.
          </p>
        </div>

        {/* Reason */}
        <p className="text-xs text-muted-foreground text-center italic">
          {reason}
        </p>
      </CardContent>
    </Card>
  );
}
