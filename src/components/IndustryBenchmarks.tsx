import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Droplets, Gauge, ThermometerSun, Zap, Activity } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface IndustryBenchmarksProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onLearnMore: (topic: string) => void;
  agingRate?: number;
  bioAge?: number;  // Biological age from algorithm
  recommendation?: { action: 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS' | 'URGENT' };
}

// Aging Speedometer Component - muted colors, only colorize for warnings
function AgingSpeedometer({ agingRate }: { agingRate: number }) {
  const displayRate = parseFloat(agingRate.toFixed(1));
  
  const minRate = 0.5;
  const maxRate = 3.0;
  const clampedRate = Math.min(Math.max(displayRate, minRate), maxRate);
  
  const normalizedRate = (clampedRate - minRate) / (maxRate - minRate);
  const needleAngle = -90 + (normalizedRate * 180);
  
  // Only colorize for warnings/critical
  const isWarning = displayRate > 1.0;
  const isCritical = displayRate > 1.5;
  
  const getColor = () => {
    if (isCritical) return 'hsl(0 84% 60%)';
    if (isWarning) return 'hsl(45 93% 47%)';
    return 'hsl(var(--muted-foreground))';
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
        {/* Background arc - muted */}
        <path
          d="M 10 52 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Subtle zone indicators - very muted */}
        <path
          d="M 10 52 A 40 40 0 0 1 22 22"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-15"
        />
        <path
          d="M 22 22 A 40 40 0 0 1 50 12"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="6"
          className="opacity-20"
        />
        <path
          d="M 50 12 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="6"
          strokeLinecap="round"
          className="opacity-25"
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
            style={{ filter: isWarning ? `drop-shadow(0 0 4px ${getColor()})` : 'none' }}
          />
          <circle 
            cx="50" 
            cy="52" 
            r="4" 
            fill={getColor()}
            style={{ filter: isWarning ? `drop-shadow(0 0 6px ${getColor()})` : 'none' }}
          />
        </g>
      </svg>
      
      <div className="flex flex-col items-center">
        <span 
          className={cn(
            "text-lg font-black font-data",
            isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-foreground"
          )}
        >
          {displayRate.toFixed(1)}x
        </span>
        <span 
          className={cn(
            "text-[9px] font-semibold uppercase tracking-wider",
            isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-muted-foreground"
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
  
  // Check if replacement is recommended
  const isReplacementRequired = recommendation?.action === 'REPLACE';

  const averageLifespan = inputs.fuelType === 'GAS' ? 12 : 13;
  // Use bioAge (effective wear) instead of paperAge for chart alignment
  const effectiveAge = bioAge ?? asset.paperAge;
  const lifespanProgress = Math.min((effectiveAge / averageLifespan) * 100, 120); // Allow overflow to 120%

  const factors = [
    {
      id: 'pressure',
      icon: Gauge,
      label: 'High water pressure',
      threshold: '> 80 PSI',
      current: `${inputs.housePsi} PSI`,
      isAbove: inputs.housePsi > 80,
      isCritical: inputs.housePsi > 80, // Violates state plumbing code
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
      isCritical: !inputs.hasExpTank && (inputs.isClosedLoop || inputs.hasPrv), // Violates state plumbing code
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

  const toggleFactor = (id: string) => {
    setExpandedFactor(expandedFactor === id ? null : id);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="command-card">
      {/* Header */}
      <CollapsibleTrigger className="w-full command-header-sm cursor-pointer hover:bg-secondary/30 transition-colors">
        <div className="command-icon-sm">
          <BarChart3 className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1 text-left">
          How Water Heaters Age
        </h2>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>

      {/* Content */}
      <CollapsibleContent className="p-4 space-y-4">
        {/* Lifespan Progress Bar - simplified monochrome */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground font-medium">Lifespan Progress</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs font-bold",
                lifespanProgress >= 100 ? "text-red-400" : "text-foreground"
              )}>
                {effectiveAge >= 20 ? '20+' : effectiveAge.toFixed(1)} yrs
              </span>
              <span className="text-[10px] text-muted-foreground">/ {averageLifespan} avg</span>
            </div>
          </div>
          
          <div className="relative">
            <div className="h-2.5 bg-secondary/40 rounded-full overflow-hidden border border-border/30">
              {/* Simple filled bar - color based on status */}
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  lifespanProgress >= 100 ? "bg-red-500/50" :
                  lifespanProgress >= 75 ? "bg-amber-500/30" :
                  "bg-muted-foreground/25"
                )}
                style={{ width: `${Math.min(lifespanProgress, 100)}%` }}
              />
            </div>
            {/* Marker for effective age */}
            <div 
              className="absolute top-0 h-2.5 flex items-center justify-center transition-all duration-500"
              style={{ left: `${Math.min(lifespanProgress, 100)}%`, transform: 'translateX(-50%)' }}
            >
              <div 
                className={cn(
                  "w-0.5 h-4 rounded-full shadow-lg",
                  lifespanProgress >= 100 ? "bg-red-400" : "bg-foreground"
                )} 
              />
            </div>
          </div>
        </div>

        {/* Aging Rate - Inline */}
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Aging Rate</span>
          </div>
          <AgingSpeedometer agingRate={agingRate} />
        </div>

        {/* Divider */}
        <div className="border-t border-border/25" />

        {/* Factors */}
        <div className="space-y-2.5">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            {isReplacementRequired ? 'Factors that shortened lifespan' : 'Factors that can shorten lifespan'}
          </span>
          
          <div className="space-y-2">
            {factors.map((factor) => (
              <div key={factor.id} className="space-y-2">
                <button
                  onClick={() => toggleFactor(factor.id)}
                  className="w-full flex items-center gap-3 p-3 data-display hover:border-border/50 rounded-xl transition-all text-left group"
                >
                  {/* Icon - muted by default, only colorize for warnings */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                    factor.isCritical 
                      ? "bg-red-500/15 border-red-500/30" 
                      : factor.isAbove 
                        ? "bg-amber-500/15 border-amber-500/30" 
                        : "bg-secondary border-border/50"
                  )}>
                    <factor.icon className={cn(
                      "w-4 h-4",
                      factor.isCritical ? 'text-red-400' : factor.isAbove ? 'text-amber-400' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm text-foreground font-medium truncate">{factor.label}</span>
                      {factor.isCritical && (
                        <span className="text-[8px] font-bold text-red-400 uppercase bg-red-500/10 px-1.5 py-0.5 rounded">Violation</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">({factor.threshold})</span>
                  </div>
                  {/* Value - muted by default, only colorize for warnings */}
                  <span className={cn(
                    "text-xs font-bold shrink-0",
                    factor.isCritical ? 'text-red-400' : factor.isAbove ? 'text-amber-400' : 'text-muted-foreground'
                  )}>
                    {factor.current}
                  </span>
                  <div className="command-trigger w-6 h-6">
                    {expandedFactor === factor.id ? (
                      <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {expandedFactor === factor.id && (
                  <div className="ml-11 p-3 rounded-lg bg-blue-500/5 border-l-2 border-blue-400/40">
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
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
