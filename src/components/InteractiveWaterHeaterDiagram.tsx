import { useState } from 'react';
import { X, Wind, Droplets, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import waterHeaterImage from '@/assets/water-heater-realistic.png';
import type { AirFilterStatus } from '@/lib/opterraAlgorithm';

interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  importance: string;
  unitStatus?: { label: string; value: number | string };
}

interface InteractiveWaterHeaterDiagramProps {
  anodePercent?: number;
  sedimentLbs?: number;
  fuelType?: 'GAS' | 'ELECTRIC' | 'HYBRID';
  hasExpansionTank?: boolean;
  hasPRV?: boolean;
  // HYBRID-specific props
  airFilterStatus?: AirFilterStatus;
  isCondensateClear?: boolean;
  compressorHealth?: number;
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
  // HYBRID-specific components
  'compressor': {
    id: 'compressor',
    name: 'Heat Pump Compressor',
    description: 'The compressor extracts heat from ambient air and transfers it to the water, providing 2-3x the efficiency of electric elements.',
    importance: 'The heart of the heat pump system. Requires adequate airflow and operating temps between 40-90°F for optimal performance.',
  },
  'air-filter': {
    id: 'air-filter',
    name: 'Air Filter',
    description: 'Filters dust and debris from the air before it passes over the evaporator coils. Located on the top unit.',
    importance: 'A clogged filter reduces efficiency and can cause the compressor to overheat. Clean or replace every 3-6 months.',
  },
  'condensate': {
    id: 'condensate',
    name: 'Condensate Drain',
    description: 'As the heat pump extracts heat from air, moisture condenses and drains away through this outlet.',
    importance: 'A blocked drain can cause water damage and system shutdown. Check monthly that drain is clear.',
  },
};

// Base hotspot positions for standard water heater
const baseHotspots: { id: string; x: number; y: number }[] = [
  { id: 'inlet-outlet', x: 50, y: 6 },
  { id: 'tp-valve', x: 72, y: 10 },
  { id: 'anode-rod', x: 28, y: 18 },
  { id: 'thermostat', x: 50, y: 55 },
  { id: 'tank-body', x: 28, y: 45 },
  { id: 'drain', x: 50, y: 92 },
];

// Additional hotspots for HYBRID heat pump unit (positioned in heat pump section)
const hybridHotspots: { id: string; x: number; y: number }[] = [
  { id: 'compressor', x: 50, y: 12 },
  { id: 'air-filter', x: 75, y: 8 },
  { id: 'condensate', x: 25, y: 20 },
];

export function InteractiveWaterHeaterDiagram({ 
  anodePercent = 32, 
  sedimentLbs = 2.8,
  fuelType = 'ELECTRIC',
  hasExpansionTank = false,
  hasPRV = false,
  airFilterStatus = 'CLEAN',
  isCondensateClear = true,
  compressorHealth = 85,
  className 
}: InteractiveWaterHeaterDiagramProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const isHybrid = fuelType === 'HYBRID';
  
  // Adjust hotspot positions for hybrid (shift tank hotspots down to make room for heat pump)
  const tankHotspots = isHybrid 
    ? baseHotspots.map(h => ({ ...h, y: h.y + 22 })) // Shift down by 22% to accommodate heat pump
    : baseHotspots;
  
  const allHotspots = isHybrid 
    ? [...hybridHotspots, ...tankHotspots]
    : tankHotspots;

  const getUnitStatus = (id: string): { label: string; value: number | string } | undefined => {
    switch (id) {
      case 'anode-rod':
        return { label: 'Estimated Life Remaining', value: anodePercent };
      case 'tank-body':
        return { label: 'Estimated Sediment', value: sedimentLbs };
      case 'compressor':
        return { label: 'Compressor Health', value: compressorHealth };
      case 'air-filter':
        return { label: 'Filter Status', value: airFilterStatus };
      case 'condensate':
        return { label: 'Drain Status', value: isCondensateClear ? 'Clear' : 'Blocked' };
      default:
        return undefined;
    }
  };

  const selected = selectedId ? {
    ...componentData[selectedId],
    unitStatus: getUnitStatus(selectedId),
  } : null;

  const selectedIndex = allHotspots.findIndex(h => h.id === selectedId);
  
  // Get status color for hybrid components
  const getHybridStatusColor = (id: string): string => {
    if (id === 'air-filter') {
      if (airFilterStatus === 'CLEAN') return 'bg-status-optimal';
      if (airFilterStatus === 'DIRTY') return 'bg-status-warning';
      return 'bg-status-critical';
    }
    if (id === 'condensate') {
      return isCondensateClear ? 'bg-status-optimal' : 'bg-status-critical';
    }
    if (id === 'compressor') {
      if (compressorHealth >= 80) return 'bg-status-optimal';
      if (compressorHealth >= 50) return 'bg-status-warning';
      return 'bg-status-critical';
    }
    return 'bg-primary';
  };
  
  const isHybridComponent = (id: string) => ['compressor', 'air-filter', 'condensate'].includes(id);

  return (
    <div className={cn("relative", className)}>
      {/* Heat Pump Unit (rendered above tank for HYBRID) */}
      {isHybrid && (
        <div className="relative mx-auto mb-0 overflow-hidden rounded-t-xl" style={{ maxWidth: '300px' }}>
          {/* Heat Pump SVG Visualization */}
          <svg 
            viewBox="0 0 300 100" 
            className="w-full h-auto"
            style={{ background: 'linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--card)) 100%)' }}
          >
            {/* Heat pump housing */}
            <rect x="30" y="15" width="240" height="70" rx="8" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="2" />
            
            {/* Vent grilles */}
            <g fill="hsl(var(--muted-foreground))" opacity="0.3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <rect key={i} x={50 + i * 25} y="25" width="15" height="3" rx="1" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <rect key={i + 10} x={50 + i * 25} y="32" width="15" height="3" rx="1" />
              ))}
            </g>
            
            {/* Compressor icon area */}
            <circle cx="150" cy="55" r="20" fill="hsl(var(--primary))" opacity="0.2" />
            <circle 
              cx="150" 
              cy="55" 
              r="15" 
              fill="none" 
              stroke="hsl(var(--primary))" 
              strokeWidth="2"
              className={compressorHealth >= 80 ? "animate-pulse" : ""}
            />
            
            {/* Fan blades animation */}
            <g className="origin-center" style={{ transformOrigin: '150px 55px' }}>
              <path 
                d="M150 40 L155 55 L150 70 L145 55 Z" 
                fill="hsl(var(--primary))"
                className={compressorHealth >= 50 ? "animate-spin" : ""}
                style={{ animationDuration: '3s' }}
              />
              <path 
                d="M135 55 L150 50 L165 55 L150 60 Z" 
                fill="hsl(var(--primary))"
                className={compressorHealth >= 50 ? "animate-spin" : ""}
                style={{ animationDuration: '3s' }}
              />
            </g>
            
            {/* Air filter indicator */}
            <rect 
              x="220" y="25" width="40" height="50" rx="4" 
              fill={airFilterStatus === 'CLEAN' ? 'hsl(var(--status-optimal))' : 
                    airFilterStatus === 'DIRTY' ? 'hsl(var(--status-warning))' : 
                    'hsl(var(--status-critical))'}
              opacity="0.3"
              stroke={airFilterStatus === 'CLEAN' ? 'hsl(var(--status-optimal))' : 
                     airFilterStatus === 'DIRTY' ? 'hsl(var(--status-warning))' : 
                     'hsl(var(--status-critical))'}
              strokeWidth="2"
            />
            <text x="240" y="55" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="600">
              FILTER
            </text>
            
            {/* Condensate drain */}
            <path 
              d="M45 70 L45 85 L55 85" 
              fill="none" 
              stroke={isCondensateClear ? 'hsl(var(--status-optimal))' : 'hsl(var(--status-critical))'} 
              strokeWidth="3"
              strokeLinecap="round"
            />
            {!isCondensateClear && (
              <circle cx="50" cy="78" r="6" fill="hsl(var(--status-critical))" className="animate-pulse" />
            )}
            
            {/* Status label */}
            <text x="150" y="90" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="500">
              HEAT PUMP UNIT
            </text>
          </svg>
          
          {/* Hotspots for heat pump section */}
          {hybridHotspots.map((spot, index) => {
            const isSelected = selectedId === spot.id;
            const statusColor = getHybridStatusColor(spot.id);
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
                <span 
                  className={cn(
                    "absolute rounded-full transition-all duration-300",
                    isSelected 
                      ? "w-12 h-12 bg-primary/30" 
                      : `w-8 h-8 ${statusColor}/20 animate-ping`
                  )}
                />
                <span
                  className={cn(
                    "relative w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-200",
                    isSelected
                      ? "bg-primary text-primary-foreground scale-110"
                      : `bg-background/95 backdrop-blur-sm border-2 border-current text-primary hover:bg-primary hover:text-primary-foreground`
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
        </div>
      )}
      
      {/* Photorealistic Tank Image Container */}
      <div 
        className={cn(
          "relative mx-auto overflow-hidden",
          isHybrid ? "rounded-b-xl" : "rounded-xl"
        )}
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

        {/* Tank Hotspot Overlay */}
        {tankHotspots.map((spot, index) => {
          const isSelected = selectedId === spot.id;
          const hotspotIndex = isHybrid ? index + hybridHotspots.length : index;
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
                top: `${isHybrid ? spot.y - 22 : spot.y}%`, // Adjust back for display since image position is same
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span 
                className={cn(
                  "absolute rounded-full transition-all duration-300",
                  isSelected 
                    ? "w-12 h-12 bg-primary/30" 
                    : "w-8 h-8 bg-primary/20 animate-ping"
                )}
              />
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
                {hotspotIndex + 1}
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

      {/* Hybrid Status Summary */}
      {isHybrid && !selectedId && (
        <div className="mt-4 mx-auto max-w-[300px] grid grid-cols-3 gap-2">
          <div className={cn(
            "p-2 rounded-lg border text-center",
            compressorHealth >= 80 ? "bg-status-optimal/10 border-status-optimal/30" :
            compressorHealth >= 50 ? "bg-status-warning/10 border-status-warning/30" :
            "bg-status-critical/10 border-status-critical/30"
          )}>
            <Cpu className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Compressor</p>
            <p className="text-xs font-semibold">{compressorHealth}%</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border text-center",
            airFilterStatus === 'CLEAN' ? "bg-status-optimal/10 border-status-optimal/30" :
            airFilterStatus === 'DIRTY' ? "bg-status-warning/10 border-status-warning/30" :
            "bg-status-critical/10 border-status-critical/30"
          )}>
            <Wind className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Air Filter</p>
            <p className="text-xs font-semibold capitalize">{airFilterStatus.toLowerCase()}</p>
          </div>
          <div className={cn(
            "p-2 rounded-lg border text-center",
            isCondensateClear ? "bg-status-optimal/10 border-status-optimal/30" :
            "bg-status-critical/10 border-status-critical/30"
          )}>
            <Droplets className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">Drain</p>
            <p className="text-xs font-semibold">{isCondensateClear ? 'Clear' : 'Blocked'}</p>
          </div>
        </div>
      )}

      {/* Component Info Card */}
      {selected && (
        <div 
          className="mt-5 p-4 bg-card border border-border rounded-xl animate-scale-in"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                isHybridComponent(selectedId!) ? getHybridStatusColor(selectedId!) : "bg-primary",
                "text-primary-foreground"
              )}>
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
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {selectedId === 'anode-rod' || selectedId === 'compressor'
                    ? `${selected.unitStatus.value}%`
                    : selectedId === 'tank-body'
                    ? `${(selected.unitStatus.value as number).toFixed(1)} lbs`
                    : selected.unitStatus.value
                  }
                  {/* Status icon for hybrid components */}
                  {selectedId === 'air-filter' && (
                    airFilterStatus === 'CLEAN' 
                      ? <CheckCircle2 className="w-4 h-4 text-status-optimal" />
                      : <AlertTriangle className="w-4 h-4 text-status-warning" />
                  )}
                  {selectedId === 'condensate' && (
                    isCondensateClear 
                      ? <CheckCircle2 className="w-4 h-4 text-status-optimal" />
                      : <AlertTriangle className="w-4 h-4 text-status-critical" />
                  )}
                </span>
              </div>
              {(selectedId === 'anode-rod' || selectedId === 'compressor') && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      (selected.unitStatus.value as number) > 80 ? "bg-status-optimal" :
                      (selected.unitStatus.value as number) > 50 ? "bg-status-warning" : "bg-status-critical"
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
