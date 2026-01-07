import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  'tp-valve': {
    id: 'tp-valve',
    name: 'T&P Relief Valve',
    description: 'Safety valve that releases pressure if the tank exceeds 150 PSI or 210°F, preventing dangerous over-pressurization.',
    importance: 'Critical safety device. Test annually by briefly lifting the lever.',
  },
  'anode-rod': {
    id: 'anode-rod',
    name: 'Sacrificial Anode Rod',
    description: 'A magnesium or aluminum rod that corrodes in place of your tank\'s steel lining, extending tank life.',
    importance: 'When depleted, tank corrosion accelerates. #1 cause of premature failure.',
  },
  'heating': {
    id: 'heating',
    name: 'Heating System',
    description: 'Electric elements or gas burner that heats water to your set temperature (typically 120°F).',
    importance: 'Sediment insulation reduces efficiency and shortens element life.',
  },
  'sediment': {
    id: 'sediment',
    name: 'Sediment Accumulation',
    description: 'Mineral deposits settling at the tank bottom from dissolved calcium and magnesium in your water.',
    importance: 'Causes rumbling sounds, reduces efficiency, can lead to overheating.',
  },
  'thermostat': {
    id: 'thermostat',
    name: 'Temperature Control',
    description: 'Controls water temperature by cycling the heating system on and off.',
    importance: 'Higher settings accelerate mineral buildup and increase energy costs.',
  },
  'drain': {
    id: 'drain',
    name: 'Drain Valve',
    description: 'Allows flushing sediment from the tank bottom during maintenance.',
    importance: 'Annual flushing through this valve extends tank life significantly.',
  },
  'expansion': {
    id: 'expansion',
    name: 'Expansion Tank',
    description: 'Absorbs pressure spikes when water expands during heating, protecting your plumbing system.',
    importance: 'Required in closed-loop systems. Prevents stress on tank welds and T&P valve.',
  },
};

// Hotspot positions as percentages of container
const hotspots: { id: string; x: number; y: number; lineEnd: { x: number; y: number } }[] = [
  { id: 'tp-valve', x: 92, y: 18, lineEnd: { x: 78, y: 22 } },
  { id: 'anode-rod', x: 50, y: 8, lineEnd: { x: 50, y: 18 } },
  { id: 'heating', x: 92, y: 42, lineEnd: { x: 75, y: 42 } },
  { id: 'thermostat', x: 92, y: 55, lineEnd: { x: 78, y: 55 } },
  { id: 'sediment', x: 8, y: 78, lineEnd: { x: 25, y: 78 } },
  { id: 'drain', x: 50, y: 95, lineEnd: { x: 50, y: 88 } },
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

  // Add expansion tank hotspot if present
  const activeHotspots = hasExpansionTank 
    ? [...hotspots, { id: 'expansion', x: 8, y: 18, lineEnd: { x: 22, y: 22 } }]
    : hotspots;

  const selected = selectedId ? {
    ...componentData[selectedId],
    unitStatus: selectedId === 'anode-rod' 
      ? { label: 'Remaining Life', value: anodePercent }
      : selectedId === 'sediment'
      ? { label: 'Estimated Buildup', value: sedimentLbs }
      : undefined
  } : null;

  const selectedIndex = activeHotspots.findIndex(h => h.id === selectedId);

  return (
    <div className={cn("relative", className)}>
      {/* Diagram Container */}
      <div className="relative mx-auto" style={{ maxWidth: '320px', aspectRatio: '1 / 1.1' }}>
        
        {/* Main SVG Diagram */}
        <svg 
          viewBox="0 0 200 220" 
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
        >
          <defs>
            {/* Realistic tank body gradient */}
            <linearGradient id="tankBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="8%" stopColor="#2a2a2a" />
              <stop offset="20%" stopColor="#3d3d3d" />
              <stop offset="35%" stopColor="#525252" />
              <stop offset="50%" stopColor="#5a5a5a" />
              <stop offset="65%" stopColor="#525252" />
              <stop offset="80%" stopColor="#3d3d3d" />
              <stop offset="92%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </linearGradient>
            
            {/* Tank dome gradient */}
            <radialGradient id="tankDome" cx="50%" cy="80%" r="80%">
              <stop offset="0%" stopColor="#5a5a5a" />
              <stop offset="50%" stopColor="#404040" />
              <stop offset="100%" stopColor="#2a2a2a" />
            </radialGradient>
            
            {/* Copper/brass gradient */}
            <linearGradient id="copper" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b4513" />
              <stop offset="25%" stopColor="#b87333" />
              <stop offset="50%" stopColor="#cd7f32" />
              <stop offset="75%" stopColor="#b87333" />
              <stop offset="100%" stopColor="#8b4513" />
            </linearGradient>

            {/* Water interior */}
            <linearGradient id="waterInterior" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(30, 64, 100, 0.15)" />
              <stop offset="60%" stopColor="rgba(30, 64, 100, 0.25)" />
              <stop offset="100%" stopColor="rgba(139, 90, 43, 0.3)" />
            </linearGradient>

            {/* Subtle glow */}
            <filter id="subtleGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Heat glow */}
            <filter id="heatEffect">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Expansion Tank (if present) */}
          {hasExpansionTank && (
            <g>
              {/* Connection pipe */}
              <path d="M65 28 L65 18 L30 18 L30 38" stroke="#b87333" strokeWidth="3" fill="none" />
              {/* Tank body */}
              <ellipse cx="30" cy="38" rx="12" ry="5" fill="#1e3a5f" />
              <rect x="18" y="38" width="24" height="35" rx="3" fill="#2563eb" />
              <ellipse cx="30" cy="73" rx="12" ry="5" fill="#1e40af" />
              {/* Highlight */}
              <rect x="20" y="42" width="3" height="26" rx="1" fill="rgba(255,255,255,0.1)" />
            </g>
          )}

          {/* Ground shadow */}
          <ellipse cx="100" cy="212" rx="50" ry="6" fill="rgba(0,0,0,0.3)" />

          {/* Tank stand */}
          <rect x="45" y="190" width="110" height="8" rx="2" fill="#1a1a1a" />
          <rect x="52" y="198" width="16" height="14" rx="1" fill="#0f0f0f" />
          <rect x="132" y="198" width="16" height="14" rx="1" fill="#0f0f0f" />

          {/* Main tank body */}
          <rect x="40" y="35" width="120" height="156" rx="4" fill="url(#tankBody)" />
          
          {/* Tank dome top */}
          <ellipse cx="100" cy="37" rx="60" ry="14" fill="url(#tankDome)" />
          
          {/* Subtle edge highlight */}
          <rect x="44" y="45" width="3" height="135" rx="1.5" fill="rgba(255,255,255,0.04)" />

          {/* Water visible inside (subtle) */}
          <rect x="46" y="42" width="108" height="140" rx="2" fill="url(#waterInterior)" opacity="0.5" />

          {/* Sediment layer */}
          {sedimentLbs > 0 && (
            <rect 
              x="46" 
              y={182 - Math.min(sedimentLbs * 6, 35)} 
              width="108" 
              height={Math.min(sedimentLbs * 6, 35)} 
              rx="1" 
              fill="rgba(139, 90, 43, 0.4)" 
            />
          )}

          {/* Anode rod (subtle, inside tank) */}
          <rect x="97" y="40" width="6" height="100" rx="1" fill="#4a4a4a" opacity="0.6" />

          {/* Heating elements glow (electric) */}
          {fuelType === 'ELECTRIC' && (
            <>
              <rect x="55" y="85" width="35" height="3" rx="1" fill="#dc2626" filter="url(#heatEffect)" className="animate-heat-glow" opacity="0.8" />
              <rect x="110" y="85" width="35" height="3" rx="1" fill="#dc2626" filter="url(#heatEffect)" className="animate-heat-glow" opacity="0.8" />
              <rect x="55" y="140" width="35" height="3" rx="1" fill="#dc2626" filter="url(#heatEffect)" className="animate-heat-glow" opacity="0.8" />
              <rect x="110" y="140" width="35" height="3" rx="1" fill="#dc2626" filter="url(#heatEffect)" className="animate-heat-glow" opacity="0.8" />
            </>
          )}

          {/* Gas burner glow */}
          {fuelType === 'GAS' && (
            <ellipse cx="100" cy="185" rx="30" ry="4" fill="#f97316" filter="url(#heatEffect)" className="animate-heat-glow" opacity="0.6" />
          )}

          {/* Inlet/outlet pipes */}
          <rect x="62" y="15" width="10" height="20" rx="1" fill="url(#copper)" />
          <ellipse cx="67" cy="15" rx="5" ry="2" fill="#cd7f32" />
          
          <rect x="128" y="15" width="10" height="20" rx="1" fill="url(#copper)" />
          <ellipse cx="133" cy="15" rx="5" ry="2" fill="#cd7f32" />

          {/* T&P Valve */}
          <rect x="156" y="40" width="8" height="25" rx="1" fill="#d4a84b" />
          <rect x="155" y="65" width="10" height="6" rx="1" fill="#b8860b" />
          <line x1="160" y1="71" x2="160" y2="90" stroke="#777" strokeWidth="2" />

          {/* Thermostat panel */}
          <rect x="156" y="100" width="16" height="35" rx="2" fill="#1f1f1f" stroke="#333" strokeWidth="0.5" />
          <circle cx="164" cy="112" r="6" fill="#0f0f0f" />
          <line x1="164" y1="108" x2="164" y2="112" stroke="#dc2626" strokeWidth="1.5" />
          <circle cx="164" cy="126" r="3" fill="#22c55e" className="animate-pulse" filter="url(#subtleGlow)" />

          {/* Drain valve */}
          <rect x="90" y="188" width="20" height="7" rx="1" fill="#3a3a3a" />
          <circle cx="100" cy="191.5" r="2.5" fill="#555" />
        </svg>

        {/* Hotspot Markers - positioned with CSS */}
        {activeHotspots.map((spot, index) => {
          const isSelected = selectedId === spot.id;
          return (
            <button
              key={spot.id}
              onClick={() => setSelectedId(isSelected ? null : spot.id)}
              className={cn(
                "absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 z-10",
                isSelected
                  ? "bg-primary text-primary-foreground scale-110"
                  : "bg-background/90 border border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110"
              )}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: isSelected 
                  ? '0 0 12px rgba(249, 115, 22, 0.5)' 
                  : '0 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {index + 1}
            </button>
          );
        })}

        {/* Leader lines (SVG overlay) */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 110"
          preserveAspectRatio="none"
        >
          {activeHotspots.map((spot) => {
            const isSelected = selectedId === spot.id;
            return (
              <line
                key={`line-${spot.id}`}
                x1={spot.x}
                y1={spot.y}
                x2={spot.lineEnd.x}
                y2={spot.lineEnd.y}
                stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"}
                strokeWidth="0.3"
                strokeDasharray={isSelected ? "0" : "1,1"}
              />
            );
          })}
        </svg>
      </div>

      {/* Component Info Card */}
      {selected && (
        <div 
          className="mt-6 p-4 bg-card border border-border rounded-xl animate-scale-in"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {selectedIndex + 1}
              </div>
              <h3 className="font-semibold text-foreground">{selected.name}</h3>
            </div>
            <button
              onClick={() => setSelectedId(null)}
              className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
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
