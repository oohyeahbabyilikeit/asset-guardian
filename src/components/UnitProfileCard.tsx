import { useState } from 'react';
import { CheckCircle2, Circle, Info, ChevronDown } from 'lucide-react';
import { AssetData } from '@/data/mockAsset';
import { ForensicInputs } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [isOpen, setIsOpen] = useState(false);

  const equipment = [
    { 
      label: 'Pressure Reducing Valve (PRV)', 
      present: inputs.hasPrv,
    },
    { 
      label: 'Expansion Tank', 
      present: inputs.hasExpTank,
    },
    { 
      label: 'Water Softener', 
      present: inputs.hasSoftener,
    },
    { 
      label: 'Recirculation Pump', 
      present: inputs.hasCircPump,
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="command-card">
        {/* Header - Always visible */}
        <CollapsibleTrigger className="w-full">
          <div className="command-header hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-4 flex-1">
              <div className="command-icon">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left flex-1">
                <p className="text-base font-semibold text-foreground">{asset.brand} {asset.model}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {asset.specs.capacity} • {asset.paperAge} yrs old • {locationLabel}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="p-5 border-t border-border/30 space-y-5">
            {/* Serial & Model Numbers */}
            <div className="grid grid-cols-2 gap-4 data-display-lg">
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Serial Number</span>
                <p className="font-mono text-sm text-foreground">{asset.serialNumber}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Model Number</span>
                <p className="font-mono text-sm text-foreground">{asset.model.replace(/\s+/g, '-').toUpperCase()}</p>
              </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Capacity</span>
                <p className="font-semibold text-foreground">{asset.specs.capacity}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Fuel Type</span>
                <p className="font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Dimensions</span>
                <p className="font-semibold text-foreground">{getDimensions(asset.specs.capacity)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Vent Type</span>
                <p className="font-semibold text-foreground">{asset.specs.ventType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Piping</span>
                <p className="font-semibold text-foreground">{asset.specs.piping}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block font-medium">Warranty</span>
                <p className={`font-semibold ${
                  warrantyStatus === 'expired' ? 'text-red-400' : 
                  warrantyStatus === 'expiring' ? 'text-amber-400' : 
                  'text-emerald-400'
                }`}>
                  {warrantyRemaining > 0 ? `${warrantyRemaining} yrs left` : 'Expired'}
                </p>
              </div>
            </div>

            {/* Equipment Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary/20 border border-border/20">
              {equipment.map((item) => (
                <div 
                  key={item.label} 
                  className="flex items-center gap-2.5 py-1.5"
                >
                  {item.present ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted/30 border border-border/30 flex items-center justify-center">
                      <Circle className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )}
                  <span className={`text-sm ${item.present ? 'text-foreground font-medium' : 'text-muted-foreground/60'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
