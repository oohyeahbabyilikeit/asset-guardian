import { useState } from 'react';
import { BarChart3, ChevronDown, ChevronUp, Droplets, Gauge, ThermometerSun, Zap } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';

interface IndustryBenchmarksProps {
  asset: AssetData;
  inputs: ForensicInputs;
  onLearnMore: (topic: string) => void;
}

export function IndustryBenchmarks({ asset, inputs, onLearnMore }: IndustryBenchmarksProps) {
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
    <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            How Water Heaters Age
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Lifespan Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Average Lifespan</span>
            <span className="text-sm text-muted-foreground">10-{averageLifespan} years</span>
          </div>
          
          <div className="relative">
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
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
              <div className="w-1 h-5 bg-foreground rounded-full shadow-lg" />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">0 years</span>
            <span className="text-sm font-semibold text-foreground">
              Your unit: {asset.paperAge} years
            </span>
            <span className="text-xs text-muted-foreground">{averageLifespan} years</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Factors */}
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground font-medium">
            Factors that can shorten lifespan
          </span>
          
          <div className="space-y-2">
            {factors.map((factor) => (
              <div key={factor.id} className="space-y-2">
                <button
                  onClick={() => toggleFactor(factor.id)}
                  className="w-full flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-left"
                >
                  <factor.icon className={`w-4 h-4 flex-shrink-0 ${factor.isAbove ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-foreground">{factor.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({factor.threshold})</span>
                  </div>
                  <span className={`text-sm font-medium ${factor.isAbove ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {factor.current}
                  </span>
                  {expandedFactor === factor.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                
                {expandedFactor === factor.id && (
                  <div className="ml-7 p-3 bg-muted/10 rounded-lg border-l-2 border-blue-400/50">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {factor.explanation}
                    </p>
                    <button
                      onClick={() => onLearnMore(factor.id)}
                      className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
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
