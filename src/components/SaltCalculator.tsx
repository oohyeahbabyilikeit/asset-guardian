import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Package, Calendar, TrendingDown, ShoppingCart } from 'lucide-react';

interface SaltCalculatorProps {
  burnRateLbsPerMonth: number;
  daysUntilRefill: number;
  nextRefillDate: string;
  monthlyBags40Lb: number;
  currentLevelPercent?: number;
}

export function SaltCalculator({
  burnRateLbsPerMonth,
  daysUntilRefill,
  nextRefillDate,
  monthlyBags40Lb,
  currentLevelPercent = 75,
}: SaltCalculatorProps) {
  const isLow = currentLevelPercent < 30;
  const isCritical = currentLevelPercent < 15;

  const getStatusColor = () => {
    if (isCritical) return 'text-red-400';
    if (isLow) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressColor = () => {
    if (isCritical) return 'bg-red-500';
    if (isLow) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-muted/20 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Salt Tank Monitor</h3>
      </div>

      {/* Salt Level Visual */}
      <div className="relative mb-4">
        <div className="flex items-end justify-between mb-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Current Level
          </span>
          <span className={`text-lg font-bold ${getStatusColor()}`}>
            {currentLevelPercent}%
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${currentLevelPercent}%` }}
          />
        </div>
        {isLow && (
          <p className={`text-xs mt-1 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>
            {isCritical ? '⚠️ Critical - Refill immediately!' : '⚠️ Running low'}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Burn Rate</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {Math.round(burnRateLbsPerMonth)} <span className="text-xs font-normal text-muted-foreground">lbs/mo</span>
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Next Refill</span>
          </div>
          <p className={`text-lg font-bold ${daysUntilRefill < 7 ? 'text-yellow-400' : 'text-foreground'}`}>
            {daysUntilRefill} <span className="text-xs font-normal text-muted-foreground">days</span>
          </p>
        </div>
      </div>

      {/* Refill Date */}
      <div className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated Refill Date</p>
          <p className="font-semibold text-foreground">{nextRefillDate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Monthly Need</p>
          <p className="font-semibold text-foreground">{monthlyBags40Lb} bag{monthlyBags40Lb !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Order Button */}
      <Button 
        variant={isLow ? "default" : "outline"} 
        className="w-full gap-2"
        size="sm"
      >
        <ShoppingCart className="h-4 w-4" />
        {isLow ? 'Order Salt Now' : 'Schedule Delivery'}
      </Button>
    </Card>
  );
}
