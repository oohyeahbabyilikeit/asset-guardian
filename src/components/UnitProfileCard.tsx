import { CheckCircle2, Circle, Info } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';

interface UnitProfileCardProps {
  asset: AssetData;
  inputs: ForensicInputs;
}

// Approximate dimensions based on tank capacity
function getDimensions(capacity: string): string {
  const gallons = parseInt(capacity) || 50;
  if (gallons <= 40) return '18" × 48"';
  if (gallons <= 50) return '20" × 54"';
  if (gallons <= 65) return '22" × 58"';
  return '24" × 60"';
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

  // Calculate warranty remaining
  const warrantyRemaining = Math.max(0, inputs.warrantyYears - inputs.calendarAge);
  const warrantyStatus = warrantyRemaining <= 0 ? 'expired' : warrantyRemaining <= 1 ? 'expiring' : 'active';

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
      <div className="p-5 space-y-5">
        {/* Brand & Model Header */}
        <div className="space-y-1">
          <p className="text-lg font-bold text-foreground">{asset.brand}</p>
          <p className="text-sm text-muted-foreground">{asset.model}</p>
        </div>

        {/* Serial & Model Numbers */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg border border-border/30">
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Serial Number</span>
            <p className="font-mono text-xs text-foreground">{asset.serialNumber}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Model Number</span>
            <p className="font-mono text-xs text-foreground">{asset.model.replace(/\s+/g, '-').toUpperCase()}</p>
          </div>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Age</span>
            <p className="font-semibold text-foreground">{asset.paperAge} yrs</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Capacity</span>
            <p className="font-semibold text-foreground">{asset.specs.capacity}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Fuel Type</span>
            <p className="font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Location</span>
            <p className="font-semibold text-foreground">{locationLabel}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Dimensions</span>
            <p className="font-semibold text-foreground">{getDimensions(asset.specs.capacity)}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs block">Warranty</span>
            <p className={`font-semibold ${
              warrantyStatus === 'expired' ? 'text-status-critical' : 
              warrantyStatus === 'expiring' ? 'text-status-warning' : 
              'text-foreground'
            }`}>
              {warrantyRemaining > 0 ? `${warrantyRemaining} yrs left` : 'Expired'}
            </p>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-2 gap-3">
          {equipment.map((item) => (
            <div 
              key={item.label} 
              className="flex items-center gap-2.5 py-1"
            >
              {item.present ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-muted-foreground/40 shrink-0" />
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
