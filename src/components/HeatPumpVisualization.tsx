import React from 'react';

interface HeatPumpVisualizationProps {
  compressorHealth: number; // 0-100%
  filterCondition: 'clean' | 'dirty' | 'clogged';
  condensateClear: boolean;
  operatingMode: 'heat-pump' | 'hybrid' | 'electric';
  ambientTemp: number; // °F
  isCompressorRunning?: boolean;
  tankHealthPercent?: number;
}

export function HeatPumpVisualization({
  compressorHealth = 85,
  filterCondition = 'clean',
  condensateClear = true,
  operatingMode = 'heat-pump',
  ambientTemp = 68,
  isCompressorRunning = true,
  tankHealthPercent = 75,
}: HeatPumpVisualizationProps) {
  // Determine status colors
  const getFilterColor = () => {
    switch (filterCondition) {
      case 'clean': return '#22c55e';
      case 'dirty': return '#eab308';
      case 'clogged': return '#ef4444';
    }
  };

  const getCompressorStatusColor = () => {
    if (compressorHealth >= 80) return '#22c55e';
    if (compressorHealth >= 50) return '#eab308';
    return '#ef4444';
  };

  const getModeColor = () => {
    switch (operatingMode) {
      case 'heat-pump': return '#22c55e';
      case 'hybrid': return '#3b82f6';
      case 'electric': return '#eab308';
    }
  };

  const isAmbientOptimal = ambientTemp >= 40 && ambientTemp <= 90;

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <svg
        viewBox="0 0 300 420"
        className="w-full h-auto"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))' }}
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="hpTankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--muted))" />
            <stop offset="50%" stopColor="hsl(var(--muted-foreground) / 0.3)" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </linearGradient>
          
          <linearGradient id="hpCompressorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--muted))" />
          </linearGradient>
          
          <linearGradient id="hpWaterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
          </linearGradient>

          <filter id="hpGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Fan blade pattern */}
          <pattern id="fanBlades" patternUnits="userSpaceOnUse" width="60" height="60" x="0" y="0">
            <circle cx="30" cy="30" r="8" fill="hsl(var(--muted-foreground))" />
          </pattern>
        </defs>

        {/* Background panel */}
        <rect x="30" y="10" width="240" height="400" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />

        {/* ===== HEAT PUMP COMPRESSOR UNIT (TOP) ===== */}
        <g transform="translate(0, 0)">
          {/* Compressor housing */}
          <rect x="50" y="25" width="200" height="100" rx="8" fill="url(#hpCompressorGradient)" stroke="hsl(var(--border))" strokeWidth="1.5" />
          
          {/* Ventilation grille */}
          <g opacity="0.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={i} x1="70" y1={40 + i * 12} x2="230" y2={40 + i * 12} stroke="hsl(var(--border))" strokeWidth="2" />
            ))}
          </g>

          {/* Fan circle */}
          <circle cx="150" cy="75" r="35" fill="hsl(var(--background))" stroke="hsl(var(--border))" strokeWidth="2" />
          
          {/* Animated fan blades */}
          <g transform={`translate(150, 75)`}>
            <g className={isCompressorRunning ? 'animate-spin' : ''} style={{ transformOrigin: 'center', animationDuration: '1s' }}>
              {[0, 60, 120, 180, 240, 300].map((angle) => (
                <rect
                  key={angle}
                  x="-4"
                  y="-28"
                  width="8"
                  height="25"
                  rx="2"
                  fill="hsl(var(--muted-foreground))"
                  transform={`rotate(${angle})`}
                />
              ))}
              <circle cx="0" cy="0" r="8" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
            </g>
          </g>

          {/* Compressor status LED */}
          <circle 
            cx="230" 
            cy="40" 
            r="6" 
            fill={getCompressorStatusColor()} 
            filter="url(#hpGlow)"
            className={isCompressorRunning ? 'animate-pulse' : ''}
          />
          <text x="220" y="55" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="end">
            {isCompressorRunning ? 'RUN' : 'IDLE'}
          </text>

          {/* Compressor label */}
          <text x="70" y="115" fontSize="10" fill="hsl(var(--muted-foreground))" fontWeight="500">
            COMPRESSOR
          </text>
          <text x="230" y="115" fontSize="10" fill="hsl(var(--foreground))" textAnchor="end" fontWeight="600">
            {compressorHealth}%
          </text>
        </g>

        {/* ===== AIR FILTER SECTION ===== */}
        <g transform="translate(0, 130)">
          <rect x="50" y="0" width="200" height="35" rx="4" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
          
          {/* Filter mesh visualization */}
          <rect x="60" y="8" width="140" height="19" rx="2" fill={getFilterColor()} opacity="0.3" />
          <g opacity="0.6">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <line key={i} x1={70 + i * 20} y1="10" x2={70 + i * 20} y2="25" stroke={getFilterColor()} strokeWidth="2" />
            ))}
          </g>
          
          {/* Filter status indicator */}
          <circle cx="220" cy="17" r="8" fill={getFilterColor()} filter="url(#hpGlow)" />
          <text x="220" y="21" fontSize="8" fill="white" textAnchor="middle" fontWeight="bold">
            {filterCondition === 'clean' ? '✓' : filterCondition === 'dirty' ? '!' : '✕'}
          </text>
          
          <text x="60" y="45" fontSize="9" fill="hsl(var(--muted-foreground))">
            AIR FILTER: <tspan fill={getFilterColor()} fontWeight="600">{filterCondition.toUpperCase()}</tspan>
          </text>
        </g>

        {/* ===== TANK SECTION ===== */}
        <g transform="translate(0, 185)">
          {/* Tank body */}
          <rect x="70" y="0" width="160" height="140" rx="8" fill="url(#hpTankGradient)" stroke="hsl(var(--border))" strokeWidth="2" />
          
          {/* Water level */}
          <rect x="75" y={5 + (135 * (1 - tankHealthPercent / 100))} width="150" height={135 * (tankHealthPercent / 100)} rx="4" fill="url(#hpWaterGradient)" opacity="0.6" />
          
          {/* Tank ribs */}
          {[0, 1, 2].map((i) => (
            <line key={i} x1="70" y1={35 + i * 40} x2="230" y2={35 + i * 40} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
          ))}
          
          {/* Cold water inlet */}
          <rect x="40" y="100" width="35" height="12" rx="2" fill="hsl(var(--muted))" stroke="#3b82f6" strokeWidth="1.5" />
          <text x="57" y="109" fontSize="7" fill="#3b82f6" textAnchor="middle">IN</text>
          
          {/* Hot water outlet */}
          <rect x="225" y="30" width="35" height="12" rx="2" fill="hsl(var(--muted))" stroke="#ef4444" strokeWidth="1.5" />
          <text x="242" y="39" fontSize="7" fill="#ef4444" textAnchor="middle">OUT</text>

          {/* Tank label */}
          <text x="150" y="155" fontSize="10" fill="hsl(var(--muted-foreground))" textAnchor="middle">
            STORAGE TANK
          </text>
        </g>

        {/* ===== CONDENSATE DRAIN ===== */}
        <g transform="translate(0, 330)">
          <rect x="50" y="0" width="80" height="25" rx="4" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
          
          {/* Drain line */}
          <line x1="90" y1="25" x2="90" y2="45" stroke={condensateClear ? '#3b82f6' : '#ef4444'} strokeWidth="3" strokeLinecap="round" />
          
          {/* Drain status */}
          <circle cx="90" cy="50" r="8" fill={condensateClear ? '#22c55e' : '#ef4444'} filter="url(#hpGlow)" />
          
          {/* Water drops animation (when clear) */}
          {condensateClear && (
            <g className="animate-bounce" style={{ animationDuration: '2s' }}>
              <path d="M86 58 L90 66 L94 58 Z" fill="#3b82f6" opacity="0.7" />
            </g>
          )}
          
          <text x="55" y="70" fontSize="9" fill="hsl(var(--muted-foreground))">
            DRAIN: <tspan fill={condensateClear ? '#22c55e' : '#ef4444'} fontWeight="600">{condensateClear ? 'CLEAR' : 'BLOCKED'}</tspan>
          </text>
        </g>

        {/* ===== OPERATING MODE INDICATOR ===== */}
        <g transform="translate(150, 340)">
          <rect x="0" y="0" width="110" height="50" rx="6" fill="hsl(var(--card))" stroke={getModeColor()} strokeWidth="2" />
          
          {/* Mode label */}
          <text x="55" y="18" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="middle">
            OPERATING MODE
          </text>
          
          {/* Mode value */}
          <text x="55" y="38" fontSize="12" fill={getModeColor()} textAnchor="middle" fontWeight="700">
            {operatingMode === 'heat-pump' ? 'HEAT PUMP' : operatingMode === 'hybrid' ? 'HYBRID' : 'ELECTRIC'}
          </text>
          
          {/* Efficiency indicator */}
          <rect x="10" y="42" width="90" height="4" rx="2" fill="hsl(var(--muted))" />
          <rect 
            x="10" 
            y="42" 
            width={operatingMode === 'heat-pump' ? 90 : operatingMode === 'hybrid' ? 60 : 30} 
            height="4" 
            rx="2" 
            fill={getModeColor()} 
          />
        </g>

        {/* ===== AMBIENT TEMPERATURE ===== */}
        <g transform="translate(40, 340)">
          <rect x="0" y="0" width="70" height="50" rx="6" fill="hsl(var(--card))" stroke={isAmbientOptimal ? 'hsl(var(--border))' : '#eab308'} strokeWidth="1.5" />
          
          <text x="35" y="18" fontSize="8" fill="hsl(var(--muted-foreground))" textAnchor="middle">
            AMBIENT
          </text>
          
          <text x="35" y="38" fontSize="16" fill={isAmbientOptimal ? 'hsl(var(--foreground))' : '#eab308'} textAnchor="middle" fontWeight="700">
            {ambientTemp}°F
          </text>
          
          {!isAmbientOptimal && (
            <text x="35" y="48" fontSize="7" fill="#eab308" textAnchor="middle">
              OUT OF RANGE
            </text>
          )}
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-4 px-4 grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-optimal" />
          <span className="text-muted-foreground">Optimal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-warning" />
          <span className="text-muted-foreground">Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-status-critical" />
          <span className="text-muted-foreground">Critical</span>
        </div>
      </div>
    </div>
  );
}
