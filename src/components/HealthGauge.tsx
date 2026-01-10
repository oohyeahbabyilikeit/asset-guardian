import { useState } from 'react';
import { AlertCircle, MapPin, Activity, ChevronDown, TrendingDown, TrendingUp, Gauge, Thermometer, Droplets, Zap, Shield, Clock, Camera, Users, Maximize2, CheckCircle, XCircle, Flame } from 'lucide-react';
import containmentBreachImg from '@/assets/containment-breach.png';
import { cn } from '@/lib/utils';
import { type HealthScore as HealthScoreType } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel, type OpterraMetrics, type Recommendation, failProbToHealthScore, bioAgeToFailProb, type FuelType, isTankless } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
  location: string;
  riskLevel: RiskLevel;
  primaryStressor?: string;
  estDamageCost?: number;
  metrics?: OpterraMetrics;
  recommendation?: Recommendation;
  isLeaking?: boolean;
  visualRust?: boolean;
  fuelType?: FuelType;
}

interface StressFactorItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  isNeutral?: boolean;
}

function StressFactorItem({ icon: Icon, label, value, isNeutral }: StressFactorItemProps) {
  const isElevated = value > 1.15;
  const isHigh = value > 1.5;
  
  // Accessibility: pair status with icon for colorblind users
  const StatusIcon = isHigh ? XCircle : isElevated ? AlertCircle : CheckCircle;
  const status = isHigh ? 'critical' : isElevated ? 'warning' : 'optimal';
  
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        {/* Icon - muted by default, only colorize for warnings */}
        <Icon className={cn(
          "w-3.5 h-3.5",
          isNeutral ? "text-muted-foreground" :
          isHigh ? "text-red-400" : 
          isElevated ? "text-amber-400" : 
          "text-muted-foreground"
        )} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      {/* Value with status icon for accessibility */}
      <div className="flex items-center gap-1.5">
        {!isNeutral && (
          <StatusIcon className={cn(
            "w-3 h-3",
            status === 'critical' ? "text-red-400" : 
            status === 'warning' ? "text-amber-400" : 
            "text-emerald-400"
          )} />
        )}
        <span className={cn(
          "text-xs font-mono font-medium",
          isNeutral ? "text-muted-foreground" :
          isHigh ? "text-red-400" : 
          isElevated ? "text-amber-400" : 
          "text-muted-foreground"
        )}>
          {value.toFixed(2)}x
        </span>
      </div>
    </div>
  );
}

export function HealthGauge({ healthScore, location, riskLevel, primaryStressor, estDamageCost, metrics, recommendation, isLeaking, visualRust, fuelType = 'GAS' }: HealthGaugeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { score, status, failureProbability } = healthScore;
  const riskInfo = getRiskLevelInfo(riskLevel);
  const isTanklessUnit = isTankless(fuelType);
  
  // Unit is economically unsound to maintain if algorithm recommends replacement
  const isReplacementRequired = recommendation?.action === 'REPLACE';
  
  // Determine if there's a breach condition
  const isBreach = isLeaking || visualRust;

  const getRingColor = () => {
    if (status === 'critical') return 'hsl(0 55% 48%)';
    if (status === 'warning') return 'hsl(32 65% 48%)';
    return 'hsl(158 45% 42%)';
  };

  const getRiskStatus = () => {
    if (failureProbability === 'FAIL') return 'CRITICAL';
    const prob = typeof failureProbability === 'number' ? failureProbability : 0;
    if (prob >= 60) return 'HIGH';
    if (prob >= 30) return 'ELEVATED';
    return 'NORMAL';
  };

  const riskStatus = getRiskStatus();

  const getStatusColor = () => {
    if (riskStatus === 'CRITICAL' || riskStatus === 'HIGH') return 'text-red-400';
    if (riskStatus === 'ELEVATED') return 'text-amber-400';
    return 'text-emerald-400';
  };

  // Intelligent status message based on actual conditions, not just score
  const getIntelligentStatus = (): { message: string; severity: 'critical' | 'warning' | 'info' | 'good' } => {
    // Critical conditions first
    if (riskStatus === 'CRITICAL') {
      return { message: 'Replace Immediately', severity: 'critical' };
    }
    if (riskStatus === 'HIGH') {
      return { message: 'On Borrowed Time', severity: 'critical' };
    }
    if (riskStatus === 'ELEVATED') {
      return { message: 'On Borrowed Time', severity: 'warning' };
    }
    
    // Now check specific issues even if overall score looks okay
    if (metrics) {
      // Tankless-specific status messages
      if (isTanklessUnit) {
        if (metrics.scaleBuildupScore && metrics.scaleBuildupScore >= 35) {
          return { message: 'Scale Buildup Critical', severity: 'warning' };
        }
        if (metrics.scaleBuildupScore && metrics.scaleBuildupScore >= 20) {
          return { message: 'Descale Overdue', severity: 'warning' };
        }
        if (metrics.flowDegradation && metrics.flowDegradation >= 20) {
          return { message: 'Flow Restricted', severity: 'warning' };
        }
        if (metrics.descaleStatus === 'impossible') {
          return { message: 'Cannot Be Serviced', severity: 'warning' };
        }
        if (metrics.descaleStatus === 'lockout') {
          return { message: 'Descale Too Risky', severity: 'warning' };
        }
        if (metrics.scaleBuildupScore && metrics.scaleBuildupScore >= 10) {
          return { message: 'Scale Building Up', severity: 'info' };
        }
      } else {
        // Tank-specific status messages
        // Heavy sediment (>10 lbs is concerning, >15 is serious)
        if (metrics.sedimentLbs >= 15) {
          return { message: 'Sediment Buildup Critical', severity: 'warning' };
        }
        if (metrics.sedimentLbs >= 10) {
          return { message: 'Flush Overdue', severity: 'warning' };
        }
        if (metrics.sedimentLbs >= 5) {
          return { message: 'Sediment Building Up', severity: 'info' };
        }
        
        // Anode rod depleted or nearly depleted
        if (metrics.shieldLife <= 0) {
          return { message: 'Anode Protection Gone', severity: 'warning' };
        }
        if (metrics.shieldLife < 1) {
          return { message: 'Anode Nearly Depleted', severity: 'info' };
        }
      }
      
      // High aging rate indicates stress (applies to both)
      if (metrics.agingRate >= 2.5) {
        return { message: 'Aging Faster Than Normal', severity: 'info' };
      }
      if (metrics.agingRate >= 1.8) {
        return { message: 'Some Stress Detected', severity: 'info' };
      }
      
      // Maintenance status
      if (metrics.flushStatus === 'due' || metrics.flushStatus === 'lockout') {
        return { message: 'Maintenance Overdue', severity: 'warning' };
      }
      if (metrics.flushStatus === 'schedule') {
        return { message: 'Service Due Soon', severity: 'info' };
      }
      
      // Bio age significantly higher than calendar age
      if (metrics.bioAge >= 10) {
        return { message: 'Wear Catching Up', severity: 'info' };
      }
    }
    
    // Actually running well
    return { message: 'Running Strong', severity: 'good' };
  };

  const intelligentStatus = getIntelligentStatus();

  // Generate projection data for the chart
  // Models compound stress over time: neglected systems deteriorate faster as issues cascade
  const generateProjectionData = () => {
    if (!metrics) return [];
    
    const data = [];
    const currentBioAge = metrics.bioAge;
    const shieldLife = metrics.shieldLife; // Years until anode depletes
    const baseAgingRate = metrics.agingRate;
    
    // Project over 5 years (60 months) in 6-month intervals
    for (let month = 0; month <= 60; month += 6) {
      const yearsAhead = month / 12;
      
      // === NEGLECTED SCENARIO ===
      // Stress compounds as issues worsen over time
      let neglectedRate = baseAgingRate;
      
      // After anode depletes, corrosion stress jumps significantly
      const yearsAfterAnodeDepletes = Math.max(0, yearsAhead - shieldLife);
      if (yearsAfterAnodeDepletes > 0) {
        // +40% stress per year without anode protection
        neglectedRate *= (1 + 0.4 * yearsAfterAnodeDepletes);
      }
      
      // Sediment builds ~15% per year if not flushed, compounding
      neglectedRate *= Math.pow(1.15, yearsAhead);
      
      // Calculate cumulative bio-age growth using average rate over the period
      const avgNeglectedRate = (baseAgingRate + neglectedRate) / 2;
      const neglectedBioAge = currentBioAge + (yearsAhead * avgNeglectedRate);
      const neglectedFailProb = bioAgeToFailProb(neglectedBioAge);
      const neglectedHealth = failProbToHealthScore(neglectedFailProb);
      
      // === MAINTAINED SCENARIO ===
      // Issues fixed immediately, annual maintenance keeps stress minimal
      // Pressure normalized, expansion tank installed, annual flushes
      const maintainedRate = 1.05; // Near-baseline aging with proper care
      const optimizedBioAge = currentBioAge + (yearsAhead * maintainedRate);
      const optimizedFailProb = bioAgeToFailProb(optimizedBioAge);
      const optimizedHealth = failProbToHealthScore(optimizedFailProb);
      
      data.push({
        month,
        year: yearsAhead.toFixed(1),
        neglected: Math.max(0, Math.round(neglectedHealth)),
        optimized: Math.max(0, Math.round(optimizedHealth)),
      });
    }
    
    return data;
  };

  const projectionData = generateProjectionData();

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
        
        <CollapsibleTrigger className="w-full p-3 text-left">
          {/* Header with Score */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center",
                isBreach ? "bg-gradient-to-br from-red-500/25 to-red-600/15 border border-red-500/30" :
                status === 'critical' && "bg-gradient-to-br from-red-500/25 to-red-600/15 border border-red-500/30",
                status === 'warning' && "bg-gradient-to-br from-amber-500/25 to-amber-600/15 border border-amber-500/30",
                status === 'optimal' && "bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 border border-emerald-500/30"
              )}>
                <Activity className={cn(
                  "w-3.5 h-3.5",
                  isBreach ? "text-red-400" :
                  status === 'critical' && "text-red-400",
                  status === 'warning' && "text-amber-400",
                  status === 'optimal' && "text-emerald-400"
                )} />
              </div>
              <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                System Health
              </span>
              {isBreach && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                  BREACH
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className={cn("text-lg font-bold font-data", getStatusColor())}>
                  {score}
                </span>
                <span className="text-[8px] text-muted-foreground">/100</span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </div>

          {/* Health Bar - Enhanced with glow */}
          <div className="relative h-3.5 rounded-full bg-secondary/60 overflow-hidden mb-2">
            {/* Background texture */}
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

          {/* Status Label - Hide when breach is showing */}
          {!isBreach && (
            <div className={cn(
              "text-[10px] font-bold uppercase tracking-wider text-center px-3 py-1 rounded-full w-fit mx-auto",
              intelligentStatus.severity === 'critical' ? "bg-red-500/15 text-red-400 border border-red-500/20" :
              intelligentStatus.severity === 'warning' ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" :
              intelligentStatus.severity === 'info' ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
              "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            )}>
              {intelligentStatus.message}
            </div>
          )}

          {/* Breach Evidence Photo - Always visible when breach detected */}
          {isBreach && (
            <div className="mt-3">
              <div className="relative rounded-lg overflow-hidden border border-red-500/30 bg-red-500/5">
                <img 
                  src={containmentBreachImg} 
                  alt="Evidence of tank breach" 
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none" />
              </div>
            </div>
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/30">
            {/* Stress Factors Breakdown */}
            {metrics && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Stress Factors
                  </span>
                </div>
                <div className="bg-secondary/20 rounded-lg p-2 space-y-0.5">
                  {isTanklessUnit ? (
                    // Tankless-specific stress factors
                    <>
                      <StressFactorItem 
                        icon={Droplets} 
                        label="Scale Buildup" 
                        value={metrics.stressFactors.chemical} 
                      />
                      <StressFactorItem 
                        icon={Gauge} 
                        label="Flow Restriction" 
                        value={metrics.stressFactors.pressure} 
                      />
                      <StressFactorItem 
                        icon={Flame} 
                        label="Cycle Intensity" 
                        value={metrics.stressFactors.mechanical} 
                      />
                      <StressFactorItem 
                        icon={Zap} 
                        label="Recirculation" 
                        value={metrics.stressFactors.circ} 
                      />
                      <StressFactorItem 
                        icon={Thermometer} 
                        label="Temperature" 
                        value={metrics.stressFactors.temp} 
                      />
                    </>
                  ) : (
                    // Tank-specific stress factors
                    <>
                      <StressFactorItem 
                        icon={Gauge} 
                        label="Pressure" 
                        value={metrics.stressFactors.pressure} 
                      />
                      <StressFactorItem 
                        icon={Thermometer} 
                        label="Thermal Cycling" 
                        value={metrics.stressFactors.tempMechanical} 
                      />
                      <StressFactorItem 
                        icon={Droplets} 
                        label="Sediment" 
                        value={metrics.stressFactors.sediment} 
                      />
                      <StressFactorItem 
                        icon={Zap} 
                        label="Circulation" 
                        value={metrics.stressFactors.circ} 
                      />
                      <StressFactorItem 
                        icon={Shield} 
                        label="Closed Loop" 
                        value={metrics.stressFactors.loop} 
                      />
                      {metrics.stressFactors.undersizing > 1.0 && (
                        <StressFactorItem 
                          icon={Maximize2} 
                          label="Tank Undersized" 
                          value={metrics.stressFactors.undersizing} 
                        />
                      )}
                    </>
                  )}
                  
                  {/* Usage context - shown as info, not multiplier */}
                  {metrics.stressFactors.usageIntensity > 1.0 && (
                    <div className="flex items-center justify-between py-1.5 border-t border-border/20 mt-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-xs text-muted-foreground">{isTanklessUnit ? 'Cycle Impact' : 'Usage Impact'}</span>
                      </div>
                      <span className="text-xs font-mono text-cyan-400">
                        +{((metrics.stressFactors.usageIntensity - 1) * 100).toFixed(0)}% wear
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-border/30 pt-1.5 mt-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Combined Aging Rate</span>
                      <span className={cn(
                        "text-xs font-mono font-bold",
                        metrics.agingRate > 2 ? "text-red-400" :
                        metrics.agingRate > 1.3 ? "text-amber-400" :
                        "text-foreground"
                      )}>
                        {metrics.agingRate.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Projection Chart - Only show for serviceable units */}
            {metrics && projectionData.length > 0 && !isReplacementRequired && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
                    5-Year Health Projection
                  </span>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-muted-foreground">Now: {metrics.agingRate.toFixed(1)}x</span>
                    <span className="text-emerald-400">Optimized: {metrics.optimizedRate.toFixed(1)}x</span>
                  </div>
                </div>
                
                <div className="bg-secondary/20 rounded-lg p-2">
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectionData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <defs>
                          <linearGradient id="optimizedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(158 45% 42%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(158 45% 42%)" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="neglectedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(0 55% 48%)" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="hsl(0 55% 48%)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="year" 
                          tick={{ fontSize: 9, fill: 'hsl(215 20% 60%)' }}
                          axisLine={{ stroke: 'hsl(217 25% 22%)' }}
                          tickLine={false}
                          tickFormatter={(value) => `${value}y`}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: 'hsl(215 20% 60%)' }}
                          axisLine={false}
                          tickLine={false}
                          tickCount={3}
                        />
                        <ReferenceLine 
                          y={50} 
                          stroke="hsl(32 65% 48%)" 
                          strokeDasharray="3 3" 
                          strokeOpacity={0.5}
                        />
                        <Area
                          type="monotone"
                          dataKey="optimized"
                          fill="url(#optimizedGradient)"
                          stroke="none"
                        />
                        <Area
                          type="monotone"
                          dataKey="neglected"
                          fill="url(#neglectedGradient)"
                          stroke="none"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="neglected" 
                          stroke="hsl(0 55% 48%)" 
                          strokeWidth={2}
                          dot={false}
                          name="If neglected"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="optimized" 
                          stroke="hsl(158 45% 42%)" 
                          strokeWidth={2}
                          dot={false}
                          name="With maintenance"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                      <TrendingDown className="w-3 h-3 text-red-400" />
                      <span className="text-[9px] text-muted-foreground">If neglected</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-[9px] text-muted-foreground">With maintenance</span>
                    </div>
                  </div>
                </div>
                
                {/* Key insight */}
                {metrics.lifeExtension > 0.5 && (
                  <div className="flex items-start gap-2 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                    <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-400">
                      Following our maintenance plan could extend system life by ~{metrics.lifeExtension.toFixed(1)} years
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Primary Alert - Hide when breach is already showing */}
            {score < 50 && primaryStressor && !isBreach && (
              <div className="py-1.5 px-2 rounded bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-red-400">
                    {primaryStressor}
                  </span>
                </div>
              </div>
            )}

            {/* Location Context */}
            <div className="flex items-center gap-2 py-1.5 px-2 rounded bg-secondary/30">
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center shrink-0",
                riskLevel >= 3 
                  ? "bg-red-500/15 border border-red-500/20" 
                  : "bg-amber-500/15 border border-amber-500/20"
              )}>
                <MapPin className={cn(
                  "w-3 h-3",
                  riskLevel >= 3 ? "text-red-400" : "text-amber-400"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold text-foreground">
                    {location}
                  </span>
                  <span className={cn(
                    "text-[8px] font-bold uppercase px-1 py-0.5 rounded",
                    riskLevel >= 3 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-amber-500/20 text-amber-400"
                  )}>
                    {riskInfo.label}
                  </span>
                </div>
                <p className="text-[9px] text-muted-foreground">
                  {riskLevel >= 3 && estDamageCost 
                    ? `Leak risk: ~$${estDamageCost.toLocaleString()} damage`
                    : riskInfo.description}
                </p>
              </div>
            </div>
          </div>
        </CollapsibleContent>

      </div>
    </Collapsible>
  );
}
