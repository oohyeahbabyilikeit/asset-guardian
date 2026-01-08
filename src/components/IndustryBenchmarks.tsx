import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Droplets, Gauge, ThermometerSun, Zap, Activity } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';

interface IndustryBenchmarksProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onLearnMore: (topic: string) => void;
  agingRate?: number;
}

// Aging Speedometer Component
function AgingSpeedometer({ agingRate }: { agingRate: number }) {
  const displayRate = parseFloat(agingRate.toFixed(1));
  
  const minRate = 0.5;
  const maxRate = 3.0;
  const clampedRate = Math.min(Math.max(displayRate, minRate), maxRate);
  
  const normalizedRate = (clampedRate - minRate) / (maxRate - minRate);
  const needleAngle = -90 + (normalizedRate * 180);
  
  const getColor = () => {
    if (displayRate <= 1.0) return 'hsl(142 71% 45%)';
    if (displayRate <= 1.5) return 'hsl(45 93% 47%)';
    return 'hsl(0 84% 60%)';
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
        <path
          d="M 10 52 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 10 52 A 40 40 0 0 1 22 22"
          fill="none"
          stroke="hsl(142 71% 45% / 0.4)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 22 22 A 40 40 0 0 1 50 12"
          fill="none"
          stroke="hsl(45 93% 47% / 0.4)"
          strokeWidth="6"
        />
        <path
          d="M 50 12 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(0 84% 60% / 0.4)"
          strokeWidth="6"
          strokeLinecap="round"
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
            style={{ filter: `drop-shadow(0 0 4px ${getColor()})` }}
          />
          <circle 
            cx="50" 
            cy="52" 
            r="4" 
            fill={getColor()}
            style={{ filter: `drop-shadow(0 0 6px ${getColor()})` }}
          />
        </g>
      </svg>
      
      <div className="flex flex-col items-center">
        <span 
          className="text-lg font-black font-data"
          style={{ color: getColor() }}
        >
          {displayRate.toFixed(1)}x
        </span>
        <span 
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: getColor() }}
        >
          {getStatusText()}
        </span>
      </div>
    </div>
  );
}

export function IndustryBenchmarks({ asset, inputs, onLearnMore, agingRate = 1.0 }: IndustryBenchmarksProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  const averageLifespan = inputs.fuelType === 'GAS' ? 12 : 13;
  const lifespanProgress = Math.min((asset.paperAge / averageLifespan) * 100, 100);

  const factors = [
    {
      id: 'pressure',
      icon: Gauge,
      label: 'High water pressure',
      threshold: '> 80 PSI',
      current: `${inputs.housePsi} PSI`,
      isAbove: inputs.housePsi > 80,
      explanation: 'Pressure above 80 PSI can stress tank components and reduce lifespan. The EPA recommends 40-60 PSI for residential use.'
    },
    {
      id: 'hardness',
      icon: Droplets,
      label: 'Hard water',
      threshold: '> 7 gpg',
      current: `${inputs.hardnessGPG} gpg`,
      isAbove: inputs.hardnessGPG > 7,
      explanation: 'Hard water causes mineral buildup (scale) on heating elements and tank walls, reducing efficiency and accelerating wear.'
    },
    {
      id: 'thermal',
      icon: ThermometerSun,
      label: 'Thermal expansion',
      threshold: 'Closed system',
      current: inputs.hasExpTank ? 'Managed' : (inputs.isClosedLoop || inputs.hasPrv ? 'Unmanaged' : 'N/A'),
      isAbove: !inputs.hasExpTank && (inputs.isClosedLoop || inputs.hasPrv),
      explanation: 'In closed-loop systems, water expands when heated with nowhere to go. Without an expansion tank, this pressure cycles stress the tank.'
    },
    {
      id: 'temperature',
      icon: Zap,
      label: 'High temperature setting',
      threshold: '> 120°F',
      current: inputs.tempSetting === 'HOT' ? '140°F+' : inputs.tempSetting === 'LOW' ? '110°F' : '120°F',
      isAbove: inputs.tempSetting === 'HOT',
      explanation: 'Higher temperatures accelerate corrosion and sediment formation. Most manufacturers recommend 120°F or below.'
    },
  ];

  const toggleFactor = (id: string) => {
    setExpandedFactor(expandedFactor === id ? null : id);
  };

  return (
    <div className="command-card hover-glow tech-corners">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" />
      
      {/* Header */}
      <div className="command-header-sm relative z-10">
        <div className="command-icon-sm">
          <BarChart3 className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="command-title">
          How Water Heaters Age
        </h2>
      </div>

      {/* Content */}
      <div className="command-content-sm space-y-4 relative z-10">
        {/* Lifespan + Aging Rate Row */}
        <div className="flex items-start gap-4">
          {/* Lifespan Progress */}
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground font-medium">Average Lifespan</span>
              <span className="text-xs text-muted-foreground">10-{averageLifespan} years</span>
            </div>
            
            <div className="relative">
              <div className="h-3 bg-secondary/40 rounded-full overflow-hidden border border-border/30">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
              {/* Marker for current age */}
              <div 
                className="absolute top-0 h-3 flex items-center justify-center transition-all duration-500"
                style={{ left: `${lifespanProgress}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-0.5 h-5 bg-foreground rounded-full shadow-lg" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.5)' }} />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground font-medium">0 years</span>
              <span className="text-xs font-bold text-foreground">
                Your unit: {asset.paperAge} years
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">{averageLifespan} years</span>
            </div>
          </div>

          {/* Aging Rate Speedometer */}
          <div className="flex flex-col items-center data-display px-3 py-2">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Aging Rate
              </span>
            </div>
            <AgingSpeedometer agingRate={agingRate} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/25" />

        {/* Factors */}
        <div className="space-y-2.5">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Factors that can shorten lifespan
          </span>
          
          <div className="space-y-2">
            {factors.map((factor) => (
              <div key={factor.id} className="space-y-2">
                <button
                  onClick={() => toggleFactor(factor.id)}
                  className="w-full flex items-center gap-3 p-3 data-display hover:border-border/50 rounded-xl transition-all text-left group"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border shrink-0",
                    factor.isAbove 
                      ? "bg-amber-500/15 border-amber-500/30" 
                      : "bg-emerald-500/10 border-emerald-500/25"
                  )}>
                    <factor.icon className={cn(
                      "w-4 h-4",
                      factor.isAbove ? 'text-amber-400' : 'text-emerald-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground font-medium">{factor.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">({factor.threshold})</span>
                  </div>
                  <span className={cn(
                    "text-xs font-bold",
                    factor.isAbove ? 'text-amber-400' : 'text-emerald-400'
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
      </div>
    </div>
  );
}
