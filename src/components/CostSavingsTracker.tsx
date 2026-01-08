import { useState, useEffect } from 'react';
import { TrendingUp, PiggyBank, Sparkles, Shield, Zap, Info } from 'lucide-react';
import { OpterraMetrics, ForensicInputs, FuelType, bioAgeToFailProb } from '@/lib/opterraAlgorithm';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ServiceEvent {
  id: string;
  type: 'flush' | 'anode_replacement' | 'inspection' | 'repair';
  date: string;
  cost: number;
}

interface CostSavingsTrackerProps {
  unitAge: number;
  maintenanceHistory: ServiceEvent[];
  projectedReplacementCost: { min: number; max: number };
  currentHealthScore: number;
  // NEW: OPTERRA integration
  metrics?: OpterraMetrics;
  fuelType?: FuelType;
}

function useAnimatedCounter(target: number, duration: number = 1200) {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const startTime = Date.now();
    const startValue = 0;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (target - startValue) * eased;
      
      setCurrent(Math.round(value));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);
  
  return current;
}

/**
 * Calculate time-weighted maintenance credit
 * Recent maintenance (< 1 year) gets full credit, older decays
 */
function getMaintenanceWeight(eventDate: string): number {
  const yearsAgo = (Date.now() - new Date(eventDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
  if (yearsAgo < 1) return 1.0;
  if (yearsAgo < 2) return 0.85;
  if (yearsAgo < 3) return 0.7;
  if (yearsAgo < 4) return 0.55;
  return 0.4; // Minimum weight for historical credit
}

/**
 * Calculate theoretical sediment if never flushed (for savings comparison)
 */
function calculateUnmaintainedSediment(unitAge: number, fuelType: FuelType, hardnessGPG: number = 10): number {
  const sedFactor = fuelType === 'ELECTRIC' ? 0.08 : 0.044;
  return unitAge * hardnessGPG * sedFactor;
}

/**
 * Calculate failure probability without maintenance (worst case)
 */
function calculateUnmaintainedFailProb(unitAge: number, agingRateMultiplier: number = 1.5): number {
  // Without maintenance, aging accelerates ~50% faster
  const worstCaseBioAge = unitAge * agingRateMultiplier;
  return bioAgeToFailProb(worstCaseBioAge);
}

export function CostSavingsTracker({
  unitAge,
  maintenanceHistory,
  projectedReplacementCost,
  currentHealthScore,
  metrics,
  fuelType = 'GAS'
}: CostSavingsTrackerProps) {
  
  // Count maintenance events
  const flushEvents = maintenanceHistory.filter(e => e.type === 'flush');
  const anodeEvents = maintenanceHistory.filter(e => e.type === 'anode_replacement');
  const flushCount = flushEvents.length;
  const anodeCount = anodeEvents.length;
  
  // Check if this is a first-time user (no maintenance history)
  const isFirstTimeUser = maintenanceHistory.length === 0;
  
  // === OPTERRA-INTEGRATED CALCULATIONS ===
  
  // 1. ENERGY EFFICIENCY SAVINGS (Sediment-Based)
  const baseEnergyCost = fuelType === 'GAS' ? 350 : 450; // $/year
  const currentSediment = metrics?.sedimentLbs ?? (flushCount > 0 ? 2 : unitAge * 0.5);
  const theoreticalSediment = calculateUnmaintainedSediment(unitAge, fuelType);
  const sedimentAvoided = Math.max(0, theoreticalSediment - currentSediment);
  
  // Each lb of sediment = ~1% efficiency loss
  const efficiencyGainPercent = sedimentAvoided * 0.01;
  
  // Time-weighted energy savings (recent flushes count more)
  const flushTimeWeight = flushEvents.reduce((sum, e) => sum + getMaintenanceWeight(e.date), 0) / Math.max(flushCount, 1);
  const yearsOfSavings = Math.min(unitAge, flushCount * 2);
  const energySavings = Math.round(baseEnergyCost * efficiencyGainPercent * yearsOfSavings * flushTimeWeight);
  
  // 2. AVOIDED EMERGENCY REPLACEMENT (Failure Probability Based)
  const currentFailProb = metrics?.failProb ?? (100 - currentHealthScore);
  const worstCaseFailProb = calculateUnmaintainedFailProb(unitAge);
  const failProbReduction = Math.max(0, worstCaseFailProb - currentFailProb);
  
  const emergencyPremium = 1.30;
  const emergencyReplacementCost = projectedReplacementCost.max * emergencyPremium;
  const avoidedEmergency = Math.round((failProbReduction / 100) * emergencyReplacementCost);
  
  // 3. EXTENDED LIFESPAN BONUS (Aging Rate Based)
  const lifeExtensionYears = metrics?.lifeExtension ?? (anodeCount * 1.5);
  const yearlyValue = projectedReplacementCost.min / 13;
  const anodeTimeWeight = anodeEvents.reduce((sum, e) => sum + getMaintenanceWeight(e.date), 0) / Math.max(anodeCount, 1);
  const lifespanBonus = Math.round(lifeExtensionYears * yearlyValue * anodeTimeWeight);
  
  // === PROJECTED SAVINGS (For first-time users) ===
  // Calculate what they COULD save with regular maintenance
  const projectedYearsRemaining = Math.max(0, 13 - unitAge); // Average 13 year lifespan
  const projectedFlushSavings = Math.round(baseEnergyCost * 0.08 * projectedYearsRemaining); // ~8% efficiency gain
  const projectedAnodeSavings = Math.round(yearlyValue * 3); // ~3 years life extension potential
  const projectedRiskReduction = Math.round(emergencyReplacementCost * 0.25); // 25% risk reduction potential
  const totalProjectedSavings = projectedFlushSavings + projectedAnodeSavings + projectedRiskReduction;
  
  // === TOTAL SAVINGS ===
  const totalSavings = energySavings + avoidedEmergency + lifespanBonus;
  const animatedTotal = useAnimatedCounter(isFirstTimeUser ? totalProjectedSavings : totalSavings);
  
  // Maintenance cost spent
  const totalSpent = maintenanceHistory.reduce((sum, e) => sum + e.cost, 0);
  
  // ROI calculation (use projected for first-time users)
  const avgMaintenanceCost = 200; // Average cost of a flush/anode service
  const projectedSpend = avgMaintenanceCost * 2; // Assume 2 services
  const roi = isFirstTimeUser 
    ? Math.round((totalProjectedSavings / projectedSpend) * 100)
    : (totalSpent > 0 ? Math.round((totalSavings / totalSpent) * 100) : 0);

  // Confidence indicator based on data quality
  const hasOpterraData = !!metrics;
  const confidenceLevel = isFirstTimeUser ? 'Projected' : (hasOpterraData ? 'Verified' : 'Estimated');

  const savingsBreakdown = isFirstTimeUser ? [
    {
      icon: Shield,
      label: 'Potential Risk Reduction',
      value: projectedRiskReduction,
      description: 'Up to 25% lower failure risk',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      tooltip: 'Regular maintenance significantly reduces unexpected failure risk'
    },
    {
      icon: Zap,
      label: 'Potential Energy Savings',
      value: projectedFlushSavings,
      description: `~8% efficiency gain over ${projectedYearsRemaining} years`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      tooltip: 'Annual flushes prevent sediment buildup that reduces heating efficiency'
    },
    {
      icon: TrendingUp,
      label: 'Potential Life Extension',
      value: projectedAnodeSavings,
      description: '+3 years possible with anode care',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      tooltip: 'Anode replacement every 3-5 years can extend unit life significantly'
    }
  ] : [
    {
      icon: Shield,
      label: 'Risk Reduction Value',
      value: avoidedEmergency,
      description: `${Math.round(failProbReduction)}% lower failure risk`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      tooltip: 'Based on failure probability reduction from maintenance vs. neglected units'
    },
    {
      icon: Zap,
      label: 'Energy Savings',
      value: energySavings,
      description: `${sedimentAvoided.toFixed(1)} lbs sediment avoided`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      tooltip: `${fuelType === 'GAS' ? 'Gas' : 'Electric'} efficiency improved by ${(efficiencyGainPercent * 100).toFixed(0)}%`
    },
    {
      icon: TrendingUp,
      label: 'Life Extension Value',
      value: lifespanBonus,
      description: `+${lifeExtensionYears.toFixed(1)} years added`,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30',
      tooltip: 'Value of extended unit lifespan from anode protection'
    }
  ];

  return (
    <div className="space-y-4">
      {/* First-time user banner */}
      {isFirstTimeUser && (
        <div className="clean-card p-3 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Your Potential Savings</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Based on your unit's age and condition, here's what you could save with regular maintenance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hero Savings Display */}
      <div className="relative clean-card p-5 bg-gradient-to-br from-emerald-500/10 via-card to-transparent border-emerald-500/20 overflow-hidden">
        {/* Animated background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 animate-pulse" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <PiggyBank className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {isFirstTimeUser ? 'Projected Savings' : 'Total Estimated Savings'}
                </p>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted-foreground/60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p className="text-xs">{confidenceLevel} confidence • Based on OPTERRA v6.6 analysis</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-3xl font-bold text-emerald-400 font-mono">
                ${animatedTotal.toLocaleString()}
              </p>
            </div>
          </div>
          
          {roi > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{roi}% ROI</span>
              </div>
              <p className="text-[9px] text-muted-foreground">on maintenance</p>
            </div>
          )}
        </div>
        
        {/* Savings vs Spent / Projected ROI */}
        <div className="relative mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
          {isFirstTimeUser ? (
            <>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground font-mono">${totalProjectedSavings.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Potential Savings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground font-mono">~${projectedSpend}</p>
                <p className="text-[10px] text-muted-foreground">Est. Maintenance Cost</p>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground font-mono">${totalSavings.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Estimated Saved</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground font-mono">${totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Spent on Maintenance</p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Breakdown Cards */}
      <div className="space-y-2">
        {savingsBreakdown.map((item, index) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <div 
                className={`p-3 rounded-lg bg-muted/30 border ${item.borderColor} maintenance-card cursor-help`}
                style={{ '--index': index } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <p className={`font-mono font-bold text-sm ${item.color}`}>
                    +${item.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{item.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
