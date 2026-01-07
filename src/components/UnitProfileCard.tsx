import { CheckCircle2, Circle, Info } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';

interface UnitProfileCardProps {
  asset: AssetData;
  inputs: ForensicInputs;
}

export function UnitProfileCard({ asset, inputs }: UnitProfileCardProps) {
  const equipment = [
    { 
      label: 'Pressure Reducing Valve (PRV)', 
      present: inputs.hasPrv,
      description: 'Regulates incoming water pressure'
    },
    { 
      label: 'Expansion Tank', 
      present: inputs.hasExpTank,
      description: 'Manages thermal expansion pressure'
    },
    { 
      label: 'Water Softener', 
      present: inputs.hasSoftener,
      description: 'Reduces mineral content in water'
    },
    { 
      label: 'Recirculation Pump', 
      present: inputs.hasCircPump,
      description: 'Provides instant hot water at fixtures'
    },
  ];

  // Map location type to readable string
  const locationLabel = {
    'ATTIC': 'Attic',
    'UPPER_FLOOR': 'Upper Floor',
    'MAIN_LIVING': 'Main Living Area',
    'BASEMENT': 'Basement',
    'GARAGE': 'Garage',
    'EXTERIOR': 'Exterior',
    'CRAWLSPACE': 'Crawlspace',
  }[inputs.location] || inputs.location;

  return (
    <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Your Unit
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Age</span>
            <p className="text-lg font-semibold text-foreground">{asset.paperAge} years</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Type</span>
            <p className="text-lg font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Location</span>
            <p className="text-lg font-semibold text-foreground">{locationLabel}</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Capacity</span>
            <p className="text-lg font-semibold text-foreground">{asset.specs.capacity}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/30" />

        {/* Equipment Present */}
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground font-medium">Equipment Present</span>
          <div className="space-y-2">
            {equipment.map((item) => (
              <div 
                key={item.label} 
                className="flex items-center gap-3"
              >
                {item.present ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.present ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
