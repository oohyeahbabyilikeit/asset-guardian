import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import waterHeaterImage from '@/assets/water-heater-realistic.png';

interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  importance: string;
  unitStatus?: { label: string; value: number };
}

interface InteractiveWaterHeaterDiagramProps {
  anodePercent?: number;
  sedimentLbs?: number;
  fuelType?: 'GAS' | 'ELECTRIC';
  hasExpansionTank?: boolean;
  hasPRV?: boolean;
  className?: string;
}

const componentData: Record<string, ComponentInfo> = {
  'inlet-outlet': {
    id: 'inlet-outlet',
    name: 'Water Connections',
    description: 'Cold water inlet (right) and hot water outlet (left). The dip tube directs cold water to the bottom for efficient heating.',
    importance: 'Proper connections ensure efficient water flow. The T&P relief valve is mounted between them for safety.',
  },
  'tp-valve': {
    id: 'tp-valve',
    name: 'T&P Relief Valve',
    description: 'Temperature & Pressure relief valve that automatically releases water if the tank exceeds 150 PSI or 210°F.',
    importance: 'Critical safety device that prevents catastrophic tank rupture. Test annually.',
  },
  'anode-rod': {
    id: 'anode-rod',
    name: 'Anode Rod',
    description: 'A sacrificial magnesium or aluminum rod inside the tank that corrodes instead of the steel lining.',
    importance: 'When depleted, tank corrosion accelerates rapidly. #1 cause of premature failure. Replace every 4-6 years.',
  },
  'thermostat': {
    id: 'thermostat',
    name: 'Thermostat & Elements',
    description: 'Temperature control panel with access to heating elements. Electric tanks have upper and lower elements.',
    importance: 'Controls water temperature. Higher settings increase mineral buildup and energy costs.',
  },
  'tank-body': {
    id: 'tank-body',
    name: 'Tank Interior',
    description: 'Glass-lined steel tank with internal components including the anode rod, dip tube, and heating elements.',
    importance: 'Sediment accumulates at the bottom over time, reducing efficiency and capacity.',
  },
  'drain': {
    id: 'drain',
    name: 'Drain Valve',
    description: 'Located at the tank bottom, allows you to flush sediment and completely drain the tank for maintenance.',
    importance: 'Regular flushing (every 6-12 months) extends tank life significantly.',
  },
};

// Hotspot positions calibrated to the photorealistic image (percentages)
const hotspots: { id: string; x: number; y: number }[] = [
  { id: 'inlet-outlet', x: 50, y: 6 },      // Top pipes
  { id: 'tp-valve', x: 72, y: 10 },         // T&P valve on top right
  { id: 'anode-rod', x: 28, y: 18 },        // Anode rod location (internal, near top)
  { id: 'thermostat', x: 50, y: 55 },       // Thermostat panel on front
  { id: 'tank-body', x: 28, y: 45 },        // Tank body side
  { id: 'drain', x: 50, y: 92 },            // Drain valve at bottom
];

export function InteractiveWaterHeaterDiagram({ 
  anodePercent = 32, 
  sedimentLbs = 2.8,
  fuelType = 'ELECTRIC',
  hasExpansionTank = false,
  hasPRV = false,
  className 
}: InteractiveWaterHeaterDiagramProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = selectedId ? {
    ...componentData[selectedId],
    unitStatus: selectedId === 'anode-rod' 
      ? { label: 'Estimated Life Remaining', value: anodePercent }
      : selectedId === 'tank-body'
      ? { label: 'Estimated Sediment', value: sedimentLbs }
      : undefined
  } : null;

  const selectedIndex = hotspots.findIndex(h => h.id === selectedId);

  return (
    <div className={cn("relative", className)}>
      {/* Photorealistic Image Container */}
      <div 
        className="relative mx-auto overflow-hidden rounded-xl"
        style={{ maxWidth: '300px' }}
      >
        {/* Water Heater Image */}
        <img 
          src={waterHeaterImage} 
          alt="Water heater diagram"
          className="w-full h-auto"
          style={{ 
            filter: 'brightness(1.05) contrast(1.05)',
          }}
        />

        {/* Hotspot Overlay */}
        {hotspots.map((spot, index) => {
          const isSelected = selectedId === spot.id;
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedId(isSelected ? null : spot.id)}
              className={cn(
                "absolute flex items-center justify-center transition-all duration-300",
                isSelected ? "z-20" : "z-10"
              )}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Pulse ring */}
              <span 
                className={cn(
                  "absolute rounded-full transition-all duration-300",
                  isSelected 
                    ? "w-12 h-12 bg-primary/30" 
                    : "w-8 h-8 bg-primary/20 animate-ping"
                )}
              />
              {/* Main button */}
              <span
                className={cn(
                  "relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200",
                  isSelected
                    ? "bg-primary text-primary-foreground scale-110"
                    : "bg-background/95 backdrop-blur-sm border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                )}
                style={{
                  boxShadow: isSelected 
                    ? '0 0 20px rgba(249, 115, 22, 0.6), 0 4px 12px rgba(0,0,0,0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {index + 1}
              </span>
            </button>
          );
        })}

        {/* Subtle vignette overlay */}
        <div 
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)',
          }}
        />
      </div>

      {/* Component Info Card */}
      {selected && (
        <div 
          className="mt-5 p-4 bg-card border border-border rounded-xl animate-scale-in"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {selectedIndex + 1}
              </div>
              <h3 className="font-semibold text-foreground">{selected.name}</h3>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {selected.description}
          </p>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs font-medium text-primary mb-1">Why It Matters</p>
            <p className="text-sm text-foreground">{selected.importance}</p>
          </div>

          {selected.unitStatus && (
            <div className="mt-3 p-3 bg-secondary/50 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{selected.unitStatus.label}</span>
                <span className="text-sm font-bold text-foreground">
                  {selectedId === 'anode-rod' 
                    ? `${selected.unitStatus.value}%`
                    : `${selected.unitStatus.value.toFixed(1)} lbs`
                  }
                </span>
              </div>
              {selectedId === 'anode-rod' && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      selected.unitStatus.value > 50 ? "bg-green-500" :
                      selected.unitStatus.value > 25 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${selected.unitStatus.value}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tap hint */}
      {!selectedId && (
        <p className="text-center text-xs text-muted-foreground/70 mt-4">
          Tap a number to learn more
        </p>
      )}
    </div>
  );
}
