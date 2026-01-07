import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  importance: string;
  position: { x: number; y: number };
  unitStatus?: { label: string; value: number };
}

interface InteractiveWaterHeaterDiagramProps {
  anodePercent?: number;
  sedimentLbs?: number;
  fuelType?: 'GAS' | 'ELECTRIC';
  className?: string;
}

const components: ComponentInfo[] = [
  {
    id: 'tp-valve',
    name: 'T&P Relief Valve',
    shortName: 'T&P',
    description: 'Temperature & Pressure relief valve that releases pressure if the tank gets dangerously hot or over-pressurized.',
    importance: 'Essential safety device that prevents catastrophic tank rupture. Should be tested annually.',
    position: { x: 88, y: 15 },
  },
  {
    id: 'anode-rod',
    name: 'Anode Rod',
    shortName: 'Anode',
    description: 'A sacrificial metal rod that corrodes instead of your tank\'s steel lining, protecting it from rust.',
    importance: 'When depleted, tank corrosion accelerates rapidly. Most common cause of premature tank failure.',
    position: { x: 12, y: 32 },
  },
  {
    id: 'heating-element',
    name: 'Heating Elements',
    shortName: 'Heat',
    description: 'Electric heating elements (or gas burner) that heat the water to your set temperature.',
    importance: 'Sediment buildup insulates the bottom, forcing elements to work harder and reducing efficiency.',
    position: { x: 88, y: 48 },
  },
  {
    id: 'sediment',
    name: 'Sediment Layer',
    shortName: 'Sediment',
    description: 'Mineral deposits that accumulate at the tank bottom from dissolved minerals in your water supply.',
    importance: 'Reduces efficiency, causes popping sounds, and can lead to overheating and tank damage.',
    position: { x: 12, y: 72 },
  },
  {
    id: 'thermostat',
    name: 'Thermostat Control',
    shortName: 'Control',
    description: 'Maintains water at your desired temperature by cycling the heating elements on and off.',
    importance: 'Higher temperature settings accelerate mineral precipitation and shorten tank life.',
    position: { x: 88, y: 68 },
  },
  {
    id: 'drain-valve',
    name: 'Drain Valve',
    shortName: 'Drain',
    description: 'Located at the bottom of the tank, allows you to flush out sediment and drain the tank for service.',
    importance: 'Regular flushing (every 6-12 months) removes sediment and extends tank life significantly.',
    position: { x: 12, y: 88 },
  },
];

export function InteractiveWaterHeaterDiagram({ 
  anodePercent = 32, 
  sedimentLbs = 2.8,
  fuelType = 'ELECTRIC',
  className 
}: InteractiveWaterHeaterDiagramProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const selected = components.find(c => c.id === selectedComponent);

  // Add unit-specific data to components
  const componentsWithData = components.map(c => {
    if (c.id === 'anode-rod') {
      return { ...c, unitStatus: { label: 'Remaining', value: anodePercent } };
    }
    if (c.id === 'sediment') {
      return { ...c, unitStatus: { label: 'Estimated', value: sedimentLbs } };
    }
    return c;
  });

  const selectedWithData = componentsWithData.find(c => c.id === selectedComponent);

  return (
    <div className={cn("relative", className)}>
      {/* Main Diagram */}
      <div className="relative flex justify-center">
        <svg 
          viewBox="0 0 200 320" 
          className="w-56 h-80"
          style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.5))' }}
        >
          <defs>
            {/* Tank body gradient - metallic steel */}
            <linearGradient id="tankBodyPro" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1f2937" />
              <stop offset="15%" stopColor="#374151" />
              <stop offset="35%" stopColor="#4b5563" />
              <stop offset="50%" stopColor="#6b7280" />
              <stop offset="65%" stopColor="#4b5563" />
              <stop offset="85%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            
            {/* Dome gradient */}
            <radialGradient id="domePro" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="60%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </radialGradient>
            
            {/* Copper pipe gradient */}
            <linearGradient id="copperPro" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="30%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
            
            {/* Water gradient */}
            <linearGradient id="waterPro" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.05)" />
              <stop offset="70%" stopColor="rgba(59, 130, 246, 0.15)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.25)" />
            </linearGradient>
            
            {/* Heat glow filter */}
            <filter id="heatGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Sediment pattern */}
            <pattern id="sedimentPattern" patternUnits="userSpaceOnUse" width="8" height="4">
              <circle cx="2" cy="2" r="1.5" fill="rgba(180, 140, 80, 0.6)" />
              <circle cx="6" cy="3" r="1" fill="rgba(160, 120, 60, 0.5)" />
            </pattern>

            {/* Anode rod gradient */}
            <linearGradient id="anodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset={`${100 - anodePercent}%`} stopColor="#9ca3af" />
              <stop offset={`${100 - anodePercent}%`} stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>

          {/* Shadow under tank */}
          <ellipse cx="100" cy="305" rx="55" ry="8" fill="rgba(0,0,0,0.4)" />

          {/* Tank legs/stand */}
          <rect x="40" y="270" width="120" height="12" rx="3" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
          <rect x="50" y="282" width="20" height="18" rx="2" fill="#111827" />
          <rect x="130" y="282" width="20" height="18" rx="2" fill="#111827" />

          {/* Main tank body */}
          <rect x="35" y="50" width="130" height="220" rx="6" fill="url(#tankBodyPro)" stroke="#4b5563" strokeWidth="1" />
          
          {/* Tank top dome */}
          <ellipse cx="100" cy="52" rx="65" ry="18" fill="url(#domePro)" stroke="#4b5563" strokeWidth="1" />
          
          {/* Inner tank edge highlight */}
          <rect x="42" y="60" width="6" height="200" rx="3" fill="rgba(255,255,255,0.06)" />

          {/* Seam lines */}
          <line x1="35" y1="90" x2="165" y2="90" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1="35" y1="230" x2="165" y2="230" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          
          {/* Rivets */}
          {[55, 75, 100, 125, 145].map((x, i) => (
            <g key={`rivet-${i}`}>
              <circle cx={x} cy="90" r="2.5" fill="#374151" />
              <circle cx={x} cy="90" r="1" fill="#6b7280" />
              <circle cx={x} cy="230" r="2.5" fill="#374151" />
              <circle cx={x} cy="230" r="1" fill="#6b7280" />
            </g>
          ))}

          {/* Water inside tank */}
          <rect x="42" y="65" width="116" height="195" rx="4" fill="url(#waterPro)" className="animate-water-shimmer" />
          
          {/* Bubbles */}
          <circle cx="70" cy="140" r="2" fill="rgba(255,255,255,0.15)" className="animate-bubble-rise" style={{ animationDelay: '0s' }} />
          <circle cx="120" cy="180" r="1.5" fill="rgba(255,255,255,0.12)" className="animate-bubble-rise" style={{ animationDelay: '0.7s' }} />
          <circle cx="90" cy="160" r="2.5" fill="rgba(255,255,255,0.1)" className="animate-bubble-rise" style={{ animationDelay: '1.4s' }} />

          {/* Sediment layer at bottom */}
          <rect x="42" y={260 - (sedimentLbs * 8)} width="116" height={sedimentLbs * 8} rx="2" fill="url(#sedimentPattern)" opacity="0.8" />
          <rect x="42" y={260 - (sedimentLbs * 8)} width="116" height={sedimentLbs * 8} rx="2" fill="rgba(180, 140, 80, 0.3)" />

          {/* Anode rod */}
          <rect x="96" y="70" width="8" height="120" rx="2" fill="url(#anodeGradient)" className="animate-anode-corrode" />
          <ellipse cx="100" cy="70" rx="4" ry="2" fill="#9ca3af" />

          {/* Heating elements (for electric) */}
          {fuelType === 'ELECTRIC' && (
            <>
              <rect x="50" y="130" width="40" height="4" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" />
              <rect x="110" y="130" width="40" height="4" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.5s' }} />
              <rect x="50" y="200" width="40" height="4" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '1s' }} />
              <rect x="110" y="200" width="40" height="4" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.3s' }} />
            </>
          )}

          {/* Cold water inlet pipe */}
          <rect x="60" y="20" width="14" height="28" rx="2" fill="url(#copperPro)" />
          <ellipse cx="67" cy="20" rx="7" ry="3" fill="#d97706" />
          <text x="67" y="14" textAnchor="middle" className="text-[8px] fill-blue-400 font-medium">COLD</text>

          {/* Hot water outlet pipe */}
          <rect x="126" y="20" width="14" height="28" rx="2" fill="url(#copperPro)" />
          <ellipse cx="133" cy="20" rx="7" ry="3" fill="#d97706" />
          <text x="133" y="14" textAnchor="middle" className="text-[8px] fill-red-400 font-medium">HOT</text>

          {/* T&P Relief Valve */}
          <rect x="160" y="60" width="12" height="30" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
          <rect x="158" y="90" width="16" height="8" rx="1" fill="#d97706" />
          <line x1="166" y1="98" x2="166" y2="120" stroke="#9ca3af" strokeWidth="2" />

          {/* Thermostat control box */}
          <rect x="165" y="150" width="24" height="50" rx="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
          <circle cx="177" cy="165" r="8" fill="#111827" stroke="#4b5563" strokeWidth="0.5" />
          <line x1="177" y1="160" x2="177" y2="165" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="177" cy="185" r="4" fill="#22c55e" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.6))' }} />
          
          {/* Drain valve at bottom */}
          <rect x="85" y="268" width="30" height="10" rx="2" fill="#374151" stroke="#4b5563" strokeWidth="0.5" />
          <circle cx="100" cy="273" r="3" fill="#6b7280" />
          <line x1="100" y1="278" x2="100" y2="290" stroke="#6b7280" strokeWidth="2" />

          {/* Brand label */}
          <rect x="65" y="105" width="70" height="20" rx="2" fill="#111827" opacity="0.7" />
          <text x="100" y="118" textAnchor="middle" className="text-[9px] fill-muted-foreground font-medium tracking-wider">OPTERRA</text>
        </svg>

        {/* Interactive Hotspot Markers */}
        {componentsWithData.map((comp, index) => (
          <button
            key={comp.id}
            onClick={() => setSelectedComponent(selectedComponent === comp.id ? null : comp.id)}
            className={cn(
              "absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 z-10",
              selectedComponent === comp.id
                ? "bg-primary text-primary-foreground scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "bg-card border-2 border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground hover:scale-110"
            )}
            style={{
              left: `${comp.position.x}%`,
              top: `${comp.position.y}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: selectedComponent === comp.id 
                ? '0 0 20px rgba(249, 115, 22, 0.5)' 
                : '0 0 12px rgba(249, 115, 22, 0.3)',
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Instruction text */}
      {!selectedComponent && (
        <p className="text-center text-sm text-muted-foreground mt-4 flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          Tap any number to learn about that component
        </p>
      )}

      {/* Component Info Card */}
      {selectedWithData && (
        <div 
          className="mt-4 p-4 bg-card border border-border rounded-xl animate-scale-in"
          style={{ boxShadow: '0 8px 32px -8px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                {components.findIndex(c => c.id === selectedWithData.id) + 1}
              </div>
              <h3 className="font-semibold text-foreground">{selectedWithData.name}</h3>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
            {selectedWithData.description}
          </p>
          
          <div className="p-3 bg-muted/50 rounded-lg mb-3">
            <p className="text-xs font-medium text-primary mb-1">Why It Matters</p>
            <p className="text-sm text-foreground leading-relaxed">{selectedWithData.importance}</p>
          </div>

          {selectedWithData.unitStatus && (
            <div className="p-3 bg-secondary/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-2">Your Unit</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedWithData.unitStatus.label}</span>
                <span className="text-lg font-bold text-foreground">
                  {selectedWithData.id === 'anode-rod' 
                    ? `${selectedWithData.unitStatus.value}%`
                    : `${selectedWithData.unitStatus.value} lbs`
                  }
                </span>
              </div>
              {selectedWithData.id === 'anode-rod' && (
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      selectedWithData.unitStatus.value > 50 ? "bg-green-500" :
                      selectedWithData.unitStatus.value > 25 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${selectedWithData.unitStatus.value}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
