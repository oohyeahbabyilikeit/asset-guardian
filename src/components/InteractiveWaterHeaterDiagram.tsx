import { useState } from 'react';
import { X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentInfo {
  id: string;
  name: string;
  shortName: string;
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

const components: ComponentInfo[] = [
  {
    id: 'cold-inlet',
    name: 'Cold Water Inlet',
    shortName: 'Cold In',
    description: 'Where cold water enters the tank from your home\'s main water supply. The dip tube directs it to the bottom for efficient heating.',
    importance: 'Proper inlet function ensures fresh water reaches the heating zone. Dip tube failure can cause lukewarm water issues.',
  },
  {
    id: 'hot-outlet',
    name: 'Hot Water Outlet',
    shortName: 'Hot Out',
    description: 'Delivers heated water from the top of the tank (where the hottest water rises) to your home\'s fixtures.',
    importance: 'Hot water naturally rises, so drawing from the top ensures you get the hottest water available.',
  },
  {
    id: 'tp-valve',
    name: 'T&P Relief Valve',
    shortName: 'T&P',
    description: 'Temperature & Pressure relief valve that automatically releases water if the tank exceeds safe limits (typically 150 PSI or 210°F).',
    importance: 'Critical safety device that prevents catastrophic tank rupture. Should be tested annually by lifting the lever briefly.',
  },
  {
    id: 'anode-rod',
    name: 'Anode Rod',
    shortName: 'Anode',
    description: 'A sacrificial metal rod (usually magnesium or aluminum) that corrodes instead of your tank\'s steel lining.',
    importance: 'When depleted, tank corrosion accelerates rapidly. This is the #1 cause of premature tank failure. Replace every 4-6 years.',
  },
  {
    id: 'heating-element',
    name: 'Heating Elements',
    shortName: 'Heat',
    description: 'Electric resistance elements (upper and lower) that heat the water. Gas units use a burner assembly at the bottom instead.',
    importance: 'Sediment buildup insulates elements from water, forcing them to work harder, reducing efficiency and shortening element life.',
  },
  {
    id: 'thermostat',
    name: 'Thermostat Control',
    shortName: 'Control',
    description: 'Controls water temperature by cycling heating elements on/off. Most units have upper and lower thermostats.',
    importance: 'Factory setting is usually 120°F. Higher settings accelerate sediment buildup and increase energy costs.',
  },
  {
    id: 'sediment',
    name: 'Sediment Layer',
    shortName: 'Sediment',
    description: 'Mineral deposits (calcium, magnesium) that settle at the tank bottom over time from your water supply.',
    importance: 'Causes popping/rumbling sounds, reduces efficiency, and can lead to overheating. Flush annually to remove.',
  },
  {
    id: 'drain-valve',
    name: 'Drain Valve',
    shortName: 'Drain',
    description: 'Located at the tank bottom, allows you to drain the tank for maintenance, flushing sediment, or replacement.',
    importance: 'Regular flushing (every 6-12 months) through this valve removes sediment and extends tank life significantly.',
  },
];

const equipmentComponents: ComponentInfo[] = [
  {
    id: 'expansion-tank',
    name: 'Expansion Tank',
    shortName: 'Exp Tank',
    description: 'A small tank with an air bladder that absorbs pressure spikes when water expands during heating cycles.',
    importance: 'Required in closed-loop systems. Without it, thermal expansion creates repeated pressure stress on tank welds and the T&P valve.',
  },
  {
    id: 'prv',
    name: 'Pressure Reducing Valve',
    shortName: 'PRV',
    description: 'Reduces incoming water pressure from the street (often 80-120 PSI) to a safe level for your home (typically 50-70 PSI).',
    importance: 'High pressure accelerates wear on all plumbing fixtures and appliances. Creates a "closed loop" requiring an expansion tank.',
  },
];

export function InteractiveWaterHeaterDiagram({ 
  anodePercent = 32, 
  sedimentLbs = 2.8,
  fuelType = 'ELECTRIC',
  hasExpansionTank = false,
  hasPRV = false,
  className 
}: InteractiveWaterHeaterDiagramProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Combine all components for display
  const allComponents = [
    ...components.map(c => {
      if (c.id === 'anode-rod') {
        return { ...c, unitStatus: { label: 'Remaining', value: anodePercent } };
      }
      if (c.id === 'sediment') {
        return { ...c, unitStatus: { label: 'Estimated', value: sedimentLbs } };
      }
      return c;
    }),
    ...(hasExpansionTank || hasPRV ? equipmentComponents.filter(e => 
      (e.id === 'expansion-tank' && hasExpansionTank) || 
      (e.id === 'prv' && hasPRV)
    ) : []),
  ];

  const selectedWithData = allComponents.find(c => c.id === selectedComponent);
  const selectedIndex = allComponents.findIndex(c => c.id === selectedComponent);

  // SVG viewBox dimensions for coordinate calculation
  const svgWidth = 280;
  const svgHeight = 340;

  // Hotspot positions in SVG coordinates
  const hotspotPositions: Record<string, { x: number; y: number }> = {
    'cold-inlet': { x: 67, y: 8 },
    'hot-outlet': { x: 133, y: 8 },
    'tp-valve': { x: 178, y: 75 },
    'anode-rod': { x: 100, y: 60 },
    'heating-element': { x: 178, y: 135 },
    'thermostat': { x: 195, y: 175 },
    'sediment': { x: 22, y: 245 },
    'drain-valve': { x: 100, y: 295 },
    'expansion-tank': { x: 240, y: 45 },
    'prv': { x: 22, y: 25 },
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main Diagram Container */}
      <div className="relative flex justify-center">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-72 h-[340px]"
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

            {/* Anode rod gradient - shows depletion */}
            <linearGradient id="anodeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset={`${100 - anodePercent}%`} stopColor="#9ca3af" />
              <stop offset={`${100 - anodePercent}%`} stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>

            {/* Expansion tank gradient */}
            <linearGradient id="expTankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>
          </defs>

          {/* ===== PRV (Pressure Reducing Valve) on incoming line ===== */}
          {hasPRV && (
            <g>
              {/* Incoming pipe from street */}
              <rect x="5" y="30" width="30" height="8" fill="url(#copperPro)" />
              {/* PRV body */}
              <rect x="12" y="22" width="18" height="24" rx="3" fill="#374151" stroke="#4b5563" strokeWidth="1" />
              <circle cx="21" cy="34" r="6" fill="#1f2937" stroke="#6b7280" strokeWidth="0.5" />
              <rect x="18" y="28" width="6" height="4" fill="#fbbf24" rx="1" />
              {/* Pipe continues to tank */}
              <path d="M35 34 L50 34 L50 20 L60 20" stroke="#b45309" strokeWidth="6" fill="none" />
              <path d="M35 34 L50 34 L50 20 L60 20" stroke="#d97706" strokeWidth="4" fill="none" />
            </g>
          )}

          {/* ===== Expansion Tank ===== */}
          {hasExpansionTank && (
            <g>
              {/* Connection pipe from cold line */}
              <path d="M67 20 L67 10 L220 10 L220 35" stroke="#b45309" strokeWidth="4" fill="none" />
              <path d="M67 20 L67 10 L220 10 L220 35" stroke="#d97706" strokeWidth="2" fill="none" />
              {/* Expansion tank body */}
              <ellipse cx="240" cy="38" rx="18" ry="8" fill="#1e40af" />
              <rect x="222" y="38" width="36" height="50" rx="4" fill="url(#expTankGradient)" stroke="#3b82f6" strokeWidth="1" />
              <ellipse cx="240" cy="88" rx="18" ry="8" fill="#1e3a5f" />
              {/* Mounting bracket */}
              <rect x="235" y="30" width="10" height="8" fill="#374151" />
              {/* Label */}
              <text x="240" y="65" textAnchor="middle" className="text-[7px] fill-blue-200 font-medium">EXP</text>
              <text x="240" y="73" textAnchor="middle" className="text-[7px] fill-blue-200 font-medium">TANK</text>
            </g>
          )}

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
          <rect x="42" y={260 - Math.min(sedimentLbs * 8, 50)} width="116" height={Math.min(sedimentLbs * 8, 50)} rx="2" fill="url(#sedimentPattern)" opacity="0.8" />
          <rect x="42" y={260 - Math.min(sedimentLbs * 8, 50)} width="116" height={Math.min(sedimentLbs * 8, 50)} rx="2" fill="rgba(180, 140, 80, 0.3)" />

          {/* Anode rod (center of tank) */}
          <rect x="96" y="55" width="8" height="130" rx="2" fill="url(#anodeGradient)" className="animate-anode-corrode" />
          <ellipse cx="100" cy="55" rx="5" ry="3" fill="#9ca3af" />
          <text x="100" y="52" textAnchor="middle" className="text-[6px] fill-muted-foreground">ANODE</text>

          {/* Heating elements (for electric) / Gas burner */}
          {fuelType === 'ELECTRIC' ? (
            <>
              {/* Upper element */}
              <rect x="50" y="120" width="45" height="5" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" />
              <rect x="105" y="120" width="45" height="5" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.5s' }} />
              {/* Lower element */}
              <rect x="50" y="200" width="45" height="5" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '1s' }} />
              <rect x="105" y="200" width="45" height="5" rx="2" fill="#ef4444" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.3s' }} />
              {/* Element access panels on side */}
              <rect x="165" y="115" width="12" height="16" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
              <rect x="165" y="195" width="12" height="16" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="0.5" />
            </>
          ) : (
            <>
              {/* Gas burner at bottom */}
              <ellipse cx="100" cy="262" rx="40" ry="6" fill="#1f2937" />
              <ellipse cx="100" cy="260" rx="35" ry="5" fill="#111827" />
              {/* Flame */}
              <ellipse cx="85" cy="255" rx="4" ry="8" fill="#f97316" filter="url(#heatGlow)" className="animate-heat-glow" />
              <ellipse cx="100" cy="253" rx="5" ry="10" fill="#fbbf24" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.2s' }} />
              <ellipse cx="115" cy="255" rx="4" ry="8" fill="#f97316" filter="url(#heatGlow)" className="animate-heat-glow" style={{ animationDelay: '0.4s' }} />
              {/* Gas line */}
              <rect x="165" y="250" width="20" height="6" fill="#fbbf24" rx="1" />
              <text x="175" y="248" textAnchor="middle" className="text-[6px] fill-amber-400">GAS</text>
            </>
          )}

          {/* Cold water inlet pipe */}
          <rect x="60" y="20" width="14" height="30" rx="2" fill="url(#copperPro)" />
          <ellipse cx="67" cy="20" rx="7" ry="3" fill="#d97706" />
          <text x="67" y="15" textAnchor="middle" className="text-[7px] fill-blue-400 font-semibold">COLD</text>

          {/* Hot water outlet pipe */}
          <rect x="126" y="20" width="14" height="30" rx="2" fill="url(#copperPro)" />
          <ellipse cx="133" cy="20" rx="7" ry="3" fill="#d97706" />
          <text x="133" y="15" textAnchor="middle" className="text-[7px] fill-red-400 font-semibold">HOT</text>

          {/* T&P Relief Valve */}
          <rect x="162" y="58" width="14" height="35" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
          <rect x="160" y="93" width="18" height="10" rx="2" fill="#d97706" />
          <line x1="169" y1="103" x2="169" y2="130" stroke="#9ca3af" strokeWidth="3" />
          <text x="169" y="138" textAnchor="middle" className="text-[6px] fill-muted-foreground">T&P</text>

          {/* Thermostat control box */}
          <rect x="168" y="150" width="26" height="55" rx="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
          <circle cx="181" cy="167" r="10" fill="#111827" stroke="#4b5563" strokeWidth="0.5" />
          <line x1="181" y1="160" x2="181" y2="167" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          <circle cx="181" cy="190" r="5" fill="#22c55e" className="animate-pulse" style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))' }} />
          
          {/* Drain valve at bottom */}
          <rect x="85" y="268" width="30" height="12" rx="2" fill="#374151" stroke="#4b5563" strokeWidth="0.5" />
          <circle cx="100" cy="274" r="4" fill="#6b7280" />
          <line x1="100" y1="280" x2="100" y2="298" stroke="#6b7280" strokeWidth="3" />
          <text x="100" y="308" textAnchor="middle" className="text-[6px] fill-muted-foreground">DRAIN</text>

          {/* Brand label */}
          <rect x="60" y="100" width="80" height="22" rx="3" fill="#111827" opacity="0.8" />
          <text x="100" y="115" textAnchor="middle" className="text-[10px] fill-muted-foreground font-semibold tracking-wider">OPTERRA</text>

          {/* Interactive Hotspot Markers - rendered inside SVG for accurate positioning */}
          {allComponents.map((comp, index) => {
            const pos = hotspotPositions[comp.id];
            if (!pos) return null;
            const isSelected = selectedComponent === comp.id;
            return (
              <g 
                key={comp.id} 
                onClick={() => setSelectedComponent(isSelected ? null : comp.id)}
                className="cursor-pointer"
              >
                {/* Outer glow ring */}
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="14" 
                  fill={isSelected ? "rgba(249, 115, 22, 0.3)" : "rgba(249, 115, 22, 0.15)"} 
                  className={isSelected ? "" : "animate-pulse"}
                />
                {/* Main circle */}
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="10" 
                  fill={isSelected ? "#f97316" : "#1e293b"} 
                  stroke="#f97316" 
                  strokeWidth="2"
                />
                {/* Number */}
                <text 
                  x={pos.x} 
                  y={pos.y + 4} 
                  textAnchor="middle" 
                  className={cn(
                    "text-[11px] font-bold pointer-events-none",
                    isSelected ? "fill-white" : "fill-orange-400"
                  )}
                >
                  {index + 1}
                </text>
              </g>
            );
          })}
        </svg>
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
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {selectedIndex + 1}
              </div>
              <h3 className="font-semibold text-foreground">{selectedWithData.name}</h3>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
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
                    : `${selectedWithData.unitStatus.value.toFixed(1)} lbs`
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
