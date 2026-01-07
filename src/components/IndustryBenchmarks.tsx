import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Droplets, Gauge, ThermometerSun, Zap, Container, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';
import { cn } from '@/lib/utils';

interface PrvStatus {
  present: boolean;
  required: boolean;
  functional: boolean;
  status: 'critical' | 'warning' | 'optimal';
}

interface ExpansionTankStatus {
  present: boolean;
  required: boolean;
  status: 'critical' | 'warning' | 'optimal';
}

interface IndustryBenchmarksProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onLearnMore: (topic: string) => void;
  prvStatus?: PrvStatus;
  expansionTankStatus?: ExpansionTankStatus;
}

export function IndustryBenchmarks({ asset, inputs, onLearnMore, prvStatus, expansionTankStatus }: IndustryBenchmarksProps) {
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  const averageLifespan = inputs.fuelType === 'GAS' ? 12 : 13;
  const lifespanProgress = Math.min((asset.paperAge / averageLifespan) * 100, 100);

  // Get actionable items (non-optimal equipment statuses)
  const actionableItems = [];
  
  if (prvStatus && prvStatus.status !== 'optimal') {
    const prvLabel = prvStatus.present && !prvStatus.functional 
      ? 'PRV Failed' 
      : 'PRV Recommended';
    const prvSubtitle = prvStatus.present && !prvStatus.functional
      ? 'High pressure despite PRV'
      : 'Cuts strain by ~50%';
    actionableItems.push({
      icon: Gauge,
      label: prvLabel,
      subtitle: prvSubtitle,
      status: prvStatus.status,
    });
  }
  
  if (expansionTankStatus && expansionTankStatus.status !== 'optimal' && expansionTankStatus.required) {
    actionableItems.push({
      icon: Container,
      label: 'Missing Expansion Tank',
      subtitle: 'Required for closed loop',
      status: expansionTankStatus.status,
    });
  }

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
    <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            How Water Heaters Age
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Lifespan Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Average Lifespan</span>
            <span className="text-xs text-muted-foreground">10-{averageLifespan} years</span>
          </div>
          
          <div className="relative">
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                style={{ width: '100%' }}
              />
            </div>
            {/* Marker for current age */}
            <div 
              className="absolute top-0 h-2.5 flex items-center justify-center transition-all duration-500"
              style={{ left: `${lifespanProgress}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-0.5 h-4 bg-foreground rounded-full shadow-lg" />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">0 years</span>
            <span className="text-xs font-semibold text-foreground">
              Your unit: {asset.paperAge} years
            </span>
            <span className="text-[10px] text-muted-foreground">{averageLifespan} years</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Factors */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">
            Factors that can shorten lifespan
          </span>
          
          <div className="space-y-1.5">
            {factors.map((factor) => (
              <div key={factor.id} className="space-y-1.5">
                <button
                  onClick={() => toggleFactor(factor.id)}
                  className="w-full flex items-center gap-2.5 p-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-left"
                >
                  <factor.icon className={`w-3.5 h-3.5 flex-shrink-0 ${factor.isAbove ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">{factor.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">({factor.threshold})</span>
                  </div>
                  <span className={`text-xs font-medium ${factor.isAbove ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {factor.current}
                  </span>
                  {expandedFactor === factor.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </button>
                
                {expandedFactor === factor.id && (
                  <div className="ml-6 p-2.5 bg-muted/10 rounded-lg border-l-2 border-blue-400/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {factor.explanation}
                    </p>
                    <button
                      onClick={() => onLearnMore(factor.id)}
                      className="mt-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Learn more →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Items - Only show if there are issues */}
        {actionableItems.length > 0 && (
          <>
            <div className="border-t border-border/30" />
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Items to Review
              </span>
              <div className="space-y-1.5">
                {actionableItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "flex items-center gap-2.5 p-2.5 rounded-lg border",
                      item.status === 'critical' 
                        ? "bg-red-500/5 border-red-500/30" 
                        : "bg-amber-500/5 border-amber-500/30"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      item.status === 'critical' 
                        ? "bg-red-500/20" 
                        : "bg-amber-500/20"
                    )}>
                      <item.icon className={cn(
                        "w-3.5 h-3.5",
                        item.status === 'critical' ? "text-red-400" : "text-amber-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      <span className={cn(
                        "text-xs block",
                        item.status === 'critical' ? "text-red-400" : "text-amber-400"
                      )}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
