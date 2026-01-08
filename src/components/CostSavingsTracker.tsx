import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, PiggyBank, Sparkles, Shield, Droplets, Zap } from 'lucide-react';

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
  monthlyBudgetRecommended: number;
  currentHealthScore: number;
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

export function CostSavingsTracker({
  unitAge,
  maintenanceHistory,
  projectedReplacementCost,
  monthlyBudgetRecommended,
  currentHealthScore
}: CostSavingsTrackerProps) {
  // Calculate savings based on maintenance performed
  const avoidedEmergencyReplacement = unitAge >= 6 ? Math.round(projectedReplacementCost.min * 0.3) : 0;
  const flushCount = maintenanceHistory.filter(e => e.type === 'flush').length;
  const anodeCount = maintenanceHistory.filter(e => e.type === 'anode_replacement').length;
  
  // Energy savings from clean tank (avg $15/month per flush)
  const energySavings = flushCount * 15 * 12;
  
  // Extended lifespan bonus (each anode replacement adds ~2 years = ~$800 value)
  const lifespanBonus = anodeCount * 800;
  
  // Total savings calculation
  const totalSavings = avoidedEmergencyReplacement + energySavings + lifespanBonus;
  const animatedTotal = useAnimatedCounter(totalSavings);
  
  // Maintenance cost spent
  const totalSpent = maintenanceHistory.reduce((sum, e) => sum + e.cost, 0);
  
  // ROI calculation
  const roi = totalSpent > 0 ? Math.round((totalSavings / totalSpent) * 100) : 0;

  const savingsBreakdown = [
    {
      icon: Shield,
      label: 'Avoided Emergency',
      value: avoidedEmergencyReplacement,
      description: 'Protected vs. sudden failure',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      icon: Zap,
      label: 'Energy Efficiency',
      value: energySavings,
      description: 'From sediment-free operation',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30'
    },
    {
      icon: TrendingUp,
      label: 'Extended Lifespan',
      value: lifespanBonus,
      description: 'From anode replacements',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    }
  ];

  return (
    <div className="space-y-4">
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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Estimated Savings</p>
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
        
        {/* Savings vs Spent */}
        <div className="relative mt-4 pt-4 border-t border-border/30 grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground font-mono">${totalSavings.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Estimated Saved</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground font-mono">${totalSpent.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Spent on Maintenance</p>
          </div>
        </div>
      </div>
      
      {/* Breakdown Cards */}
      <div className="space-y-2">
        {savingsBreakdown.map((item, index) => (
          <div 
            key={item.label}
            className={`p-3 rounded-lg bg-muted/30 border ${item.borderColor} maintenance-card`}
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
        ))}
      </div>
      
      {/* Monthly Budget Recommendation */}
      <div className="clean-card p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Replacement Fund</p>
              <p className="text-[10px] text-muted-foreground">
                Save monthly for stress-free replacement
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-lg text-primary">
              ${monthlyBudgetRecommended}<span className="text-xs text-muted-foreground">/mo</span>
            </p>
          </div>
        </div>
        
        {/* Progress to replacement goal */}
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>Progress to goal</span>
            <span>${(totalSpent).toLocaleString()} of ${projectedReplacementCost.min.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
              style={{ width: `${Math.min((totalSpent / projectedReplacementCost.min) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
