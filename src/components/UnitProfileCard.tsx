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
      <div className="px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Your Unit
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <span className="text-muted-foreground text-xs block">Age</span>
            <p className="font-semibold text-foreground">{asset.paperAge} years</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Type</span>
            <p className="font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Location</span>
            <p className="font-semibold text-foreground">{locationLabel}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Capacity</span>
            <p className="font-semibold text-foreground">{asset.specs.capacity}</p>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-2 gap-2">
          {equipment.map((item) => (
            <div 
              key={item.label} 
              className="flex items-center gap-2"
            >
              {item.present ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={`text-sm ${item.present ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
