import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Droplets, Gauge, ThermometerSun, Zap, Activity, TrendingUp } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface IndustryBenchmarksProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onLearnMore: (topic: string) => void;
  agingRate?: number;
  bioAge?: number;
  recommendation?: { action: 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS' | 'URGENT' };
}

// Aging Speedometer Component
function AgingSpeedometer({ agingRate }: { agingRate: number }) {
  const displayRate = parseFloat(agingRate.toFixed(1));
  
  const minRate = 0.5;
  const maxRate = 3.0;
  const clampedRate = Math.min(Math.max(displayRate, minRate), maxRate);
  
  const normalizedRate = (clampedRate - minRate) / (maxRate - minRate);
  const needleAngle = -90 + (normalizedRate * 180);
  
  const isWarning = displayRate > 1.0;
  const isCritical = displayRate > 1.5;
  
  const getColor = () => {
    if (isCritical) return 'hsl(0 84% 60%)';
    if (isWarning) return 'hsl(45 93% 47%)';
    return 'hsl(160 84% 39%)';
  };
  
  const getStatusText = () => {
    if (displayRate <= 1.0) return 'Normal';
    if (displayRate <= 1.5) return 'Elevated';
    if (displayRate <= 2.0) return 'High';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="80" height="46" viewBox="0 0 100 56" className="overflow-visible">
        {/* Background arc with gradient zones */}
        <defs>
          <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(160 84% 39%)" stopOpacity="0.3" />
            <stop offset="40%" stopColor="hsl(45 93% 47%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M 10 52 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="url(#arcGradient)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Zone segments */}
        <path
          d="M 10 52 A 40 40 0 0 1 30 18"
          fill="none"
          stroke="hsl(160 84% 39%)"
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-40"
        />
        <path
          d="M 30 18 A 40 40 0 0 1 70 18"
          fill="none"
          stroke="hsl(45 93% 47%)"
          strokeWidth="6"
          className="opacity-40"
        />
        <path
          d="M 70 18 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(0 84% 60%)"
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-40"
        />
        <g 
          style={{ 
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '50px 52px',
            transition: 'transform 0.5s ease-out'
          }}
        >
          <line
            x1="50"
            y1="52"
            x2="50"
            y2="18"
            stroke={getColor()}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${getColor()})` }}
          />
          <circle 
            cx="50" 
            cy="52" 
            r="4" 
            fill={getColor()}
            style={{ filter: `drop-shadow(0 0 8px ${getColor()})` }}
          />
        </g>
      </svg>
      
      <div className="flex flex-col items-center">
        <span 
          className={cn(
            "text-lg font-black font-data",
            isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
          )}
        >
          {displayRate.toFixed(1)}x
        </span>
        <span 
          className={cn(
            "text-[9px] font-semibold uppercase tracking-wider",
            isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
          )}
        >
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}

export function IndustryBenchmarks({ asset, inputs, onLearnMore, agingRate = 1.0, bioAge, recommendation }: IndustryBenchmarksProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [factorsOpen, setFactorsOpen] = useState(false);
  
  const isReplacementRequired = recommendation?.action === 'REPLACE';
  
  // Check if tankless unit
  const isTanklessUnit = inputs.fuelType === 'TANKLESS_GAS' || inputs.fuelType === 'TANKLESS_ELECTRIC';

  // Different lifespans for different unit types
  const averageLifespan = isTanklessUnit ? 20 : (inputs.fuelType === 'GAS' ? 12 : 13);
  const effectiveAge = bioAge ?? asset.paperAge;
  const lifespanProgress = Math.min((effectiveAge / averageLifespan) * 100, 120);

  // Tank-specific factors (don't show for tankless)
  const tankFactors = [
    {
      id: 'pressure',
      icon: Gauge,
      label: 'High water pressure',
      threshold: '> 80 PSI',
      current: `${inputs.housePsi} PSI`,
      isAbove: inputs.housePsi > 80,
      isCritical: inputs.housePsi > 80,
      explanation: 'Pressure above 80 PSI violates plumbing code in most states. It stresses tank components, accelerates wear, and can void warranties.'
    },
    {
      id: 'hardness',
      icon: Droplets,
      label: inputs.hasSoftener ? 'Hard water (mitigated)' : 'Hard water',
      threshold: '> 7 gpg',
      current: inputs.hasSoftener 
        ? `${inputs.hardnessGPG} gpg (softener installed)` 
        : `${inputs.hardnessGPG} gpg`,
      isAbove: inputs.hasSoftener ? false : inputs.hardnessGPG > 7,
      isCritical: false,
      explanation: inputs.hasSoftener 
        ? 'Your water softener mitigates scale buildup from hard water. Maintain salt levels and service regularly to keep protection active.'
        : 'Hard water causes mineral buildup (scale) on heating elements and tank walls, reducing efficiency and accelerating wear.'
    },
    {
      id: 'thermal',
      icon: ThermometerSun,
      label: 'Thermal expansion',
      threshold: 'Closed system',
      current: inputs.hasExpTank ? 'Managed' : (inputs.isClosedLoop || inputs.hasPrv ? 'Unmanaged' : 'N/A'),
      isAbove: !inputs.hasExpTank && (inputs.isClosedLoop || inputs.hasPrv),
      isCritical: !inputs.hasExpTank && (inputs.isClosedLoop || inputs.hasPrv),
      explanation: 'Missing expansion tank in a closed system violates plumbing code in most states. Thermal cycling causes dangerous pressure spikes that stress the tank.'
    },
    {
      id: 'temperature',
      icon: Zap,
      label: 'High temperature setting',
      threshold: '> 120°F',
      current: inputs.tempSetting === 'HOT' ? '140°F+' : inputs.tempSetting === 'LOW' ? '110°F' : '120°F',
      isAbove: inputs.tempSetting === 'HOT',
      isCritical: false,
      explanation: 'Higher temperatures accelerate corrosion and sediment formation. Most manufacturers recommend 120°F or below.'
    },
  ];

  // Tankless-specific factors
  const tanklessFactors = [
    {
      id: 'hardness-tankless',
      icon: Droplets,
      label: inputs.hasSoftener ? 'Hard water (mitigated)' : 'Hard water',
      threshold: '> 7 gpg',
      current: inputs.hasSoftener 
        ? `${inputs.hardnessGPG} gpg (softener installed)` 
        : `${inputs.hardnessGPG} gpg`,
      isAbove: inputs.hasSoftener ? false : inputs.hardnessGPG > 7,
      isCritical: inputs.hardnessGPG > 15 && !inputs.hasSoftener,
      explanation: inputs.hasSoftener 
        ? 'Your water softener prevents scale buildup in the heat exchanger. Maintain salt levels for continued protection.'
        : 'Hard water causes scale buildup in the heat exchanger, reducing flow rate and efficiency. Descaling is required more frequently in hard water areas.'
    },
    {
      id: 'descale',
      icon: Activity,
      label: 'Descale maintenance',
      threshold: 'Every 1-2 years',
      current: inputs.lastDescaleYearsAgo !== undefined 
        ? (inputs.lastDescaleYearsAgo === 0 ? 'Current' : `${inputs.lastDescaleYearsAgo} yr${inputs.lastDescaleYearsAgo > 1 ? 's' : ''} ago`)
        : 'Unknown',
      isAbove: inputs.lastDescaleYearsAgo !== undefined && inputs.lastDescaleYearsAgo > 2,
      isCritical: inputs.lastDescaleYearsAgo !== undefined && inputs.lastDescaleYearsAgo > 3,
      explanation: 'Regular descaling removes mineral deposits from the heat exchanger. In hard water areas, annual descaling may be needed to maintain efficiency.'
    },
    {
      id: 'valves',
      icon: Gauge,
      label: 'Isolation valves',
      threshold: 'Required',
      current: inputs.hasIsolationValves ? 'Installed' : 'Missing',
      isAbove: !inputs.hasIsolationValves,
      isCritical: !inputs.hasIsolationValves,
      explanation: 'Isolation valves are required to perform descaling maintenance. Without them, the unit cannot be properly serviced and will require replacement when scale builds up.'
    },
  ];

  // Use appropriate factors based on unit type
  const factors = isTanklessUnit ? tanklessFactors : tankFactors;

  const toggleFactor = (id: string) => {
    setExpandedFactor(expandedFactor === id ? null : id);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="command-card overflow-hidden">
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-cyan-500/50" />
      
      {/* Header */}
      <CollapsibleTrigger className="w-full command-header-sm cursor-pointer hover:bg-secondary/30 transition-colors">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/10 border border-purple-500/30">
          <BarChart3 className="w-4 h-4 text-purple-400" />
        </div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1 text-left">
          How Your Water Heater Aged
        </h2>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className="p-4 space-y-4">
        {/* Lifespan Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium">Wear Age</span>
              <span className="text-[10px] text-muted-foreground/70">Based on stress & usage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold",
                lifespanProgress >= 100 ? "text-red-400" : lifespanProgress >= 75 ? "text-amber-400" : "text-emerald-400"
              )}>
                {effectiveAge >= 20 ? '20+' : effectiveAge.toFixed(1)} yrs
              </span>
              <span className="text-[10px] text-muted-foreground">/ {averageLifespan} avg</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="h-3 bg-secondary/50 rounded-full overflow-hidden border border-border/30">
              {/* Gradient progress bar */}
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(lifespanProgress, 100)}%`,
                  background: lifespanProgress >= 100 
                    ? 'linear-gradient(90deg, hsl(0 72% 51% / 0.7), hsl(0 72% 51% / 0.9))'
                    : lifespanProgress >= 75 
                      ? 'linear-gradient(90deg, hsl(38 92% 50% / 0.6), hsl(38 92% 50% / 0.8))'
                      : 'linear-gradient(90deg, hsl(160 84% 39% / 0.5), hsl(160 84% 39% / 0.7))'
                }}
              />
            </div>
            {/* Marker */}
            <div 
              className="absolute top-0 h-3 flex items-center justify-center transition-all duration-500"
              style={{ left: `${Math.min(lifespanProgress, 100)}%`, transform: 'translateX(-50%)' }}
            >
              <div 
                className={cn(
                  "w-1 h-5 rounded-full shadow-lg",
                  lifespanProgress >= 100 ? "bg-red-400" : lifespanProgress >= 75 ? "bg-amber-400" : "bg-emerald-400"
                )}
                style={{ boxShadow: `0 0 8px ${lifespanProgress >= 100 ? 'hsl(0 72% 51%)' : lifespanProgress >= 75 ? 'hsl(38 92% 50%)' : 'hsl(160 84% 39%)'}` }}
              />
            </div>
          </div>
        </div>

        {/* Aging Rate */}
        <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gradient-to-r from-secondary/40 to-secondary/20 border border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-medium text-foreground block">Aging Rate</span>
              <span className="text-[10px] text-muted-foreground">Based on your conditions</span>
            </div>
          </div>
          <AgingSpeedometer agingRate={agingRate} />
        </div>

        {/* Factors - Collapsible */}
        <Collapsible open={factorsOpen} onOpenChange={setFactorsOpen}>
          <CollapsibleTrigger className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              {isReplacementRequired ? 'Factors that shortened lifespan' : 'Factors that can shorten lifespan'}
            </span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform duration-200",
              factorsOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
          
          <CollapsibleContent className="pt-3 space-y-2">
            {factors.map((factor) => (
              <div key={factor.id} className="space-y-2">
                <button
                  onClick={() => toggleFactor(factor.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group border",
                    factor.isCritical 
                      ? "bg-red-500/5 border-red-500/20 hover:border-red-500/30" 
                      : factor.isAbove 
                        ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30" 
                        : "bg-secondary/30 border-border/30 hover:border-border/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                    factor.isCritical 
                      ? "bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30" 
                      : factor.isAbove 
                        ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30" 
                        : "bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/20"
                  )}>
                    <factor.icon className={cn(
                      "w-4 h-4",
                      factor.isCritical ? 'text-red-400' : factor.isAbove ? 'text-amber-400' : 'text-emerald-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm text-foreground font-medium truncate">{factor.label}</span>
                      {factor.isCritical && (
                        <span className="text-[8px] font-bold text-red-400 uppercase bg-red-500/15 px-1.5 py-0.5 rounded border border-red-500/20">Violation</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">({factor.threshold})</span>
                  </div>
                  {/* Value */}
                  <span className={cn(
                    "text-xs font-bold shrink-0",
                    factor.isCritical ? 'text-red-400' : factor.isAbove ? 'text-amber-400' : 'text-emerald-400'
                  )}>
                    {factor.current}
                  </span>
                  <div className={cn(
                    "w-6 h-6 rounded-md flex items-center justify-center",
                    "bg-secondary/50 border border-border/30"
                  )}>
                    {expandedFactor === factor.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedFactor === factor.id && (
                  <div className="ml-12 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-l-2 border-blue-400/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {factor.explanation}
                    </p>
                    <button
                      onClick={() => onLearnMore(factor.id)}
                      className="mt-2 text-[10px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wide"
                    >
                      Learn more →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CollapsibleContent>
    </Collapsible>
  );
}
