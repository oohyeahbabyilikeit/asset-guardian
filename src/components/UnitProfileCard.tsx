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
      <div className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
        {/* Header - Always visible */}
        <CollapsibleTrigger className="w-full">
          <div className="px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-foreground">{asset.brand} {asset.model}</p>
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
          <div className="px-5 pb-5 pt-2 space-y-5 border-t border-border/30">
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
                <span className="text-muted-foreground text-xs block">Capacity</span>
                <p className="font-semibold text-foreground">{asset.specs.capacity}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block">Fuel Type</span>
                <p className="font-semibold text-foreground capitalize">{asset.specs.fuelType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block">Dimensions</span>
                <p className="font-semibold text-foreground">{getDimensions(asset.specs.capacity)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block">Vent Type</span>
                <p className="font-semibold text-foreground">{asset.specs.ventType}</p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs block">Piping</span>
                <p className="font-semibold text-foreground">{asset.specs.piping}</p>
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
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
