import { cn } from '@/lib/utils';
import type { FuelType, InletFilterStatus, VentStatus } from '@/lib/opterraAlgorithm';

interface TanklessDiagramProps {
  fuelType: FuelType;
  healthScore: number;           // From algorithm output (0-100)
  descaleStatus: 'optimal' | 'due' | 'critical' | 'lockout' | 'impossible' | 'run_to_failure';
  inletFilterStatus?: InletFilterStatus;
  ventStatus?: VentStatus;
  hasIsolationValves?: boolean;
  errorCodeCount?: number;
  isBreach?: boolean;            // isLeaking
}

// Get status color from health score
function getHealthColor(healthScore: number): string {
  if (healthScore >= 70) return '#22c55e'; // Green
  if (healthScore >= 40) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

// Get descale status color
function getDescaleColor(status: string): string {
  switch (status) {
    case 'optimal': return '#22c55e';
    case 'due': return '#f59e0b';
    case 'critical':
    case 'lockout':
    case 'impossible':
    case 'run_to_failure':
      return '#ef4444';
    default: return '#6b7280';
  }
}

// Get filter status color  
function getFilterStatusColor(status?: InletFilterStatus): string {
  switch (status) {
    case 'CLEAN': return '#22c55e';
    case 'DIRTY': return '#f59e0b';
    case 'CLOGGED': return '#ef4444';
    default: return '#6b7280';
  }
}

// Get vent status color
function getVentStatusColor(status?: VentStatus): string {
  switch (status) {
    case 'CLEAR': return '#22c55e';
    case 'RESTRICTED': return '#f59e0b';
    case 'BLOCKED': return '#ef4444';
    default: return '#6b7280';
  }
}

// Get descale status label
function getDescaleLabel(status: string): string {
  switch (status) {
    case 'optimal': return 'OK';
    case 'due': return 'DUE';
    case 'critical': return 'CRIT';
    case 'lockout': return 'LOCK';
    case 'impossible': return 'N/A';
    case 'run_to_failure': return 'RTF';
    default: return '?';
  }
}

export function TanklessDiagram({
  fuelType,
  healthScore,
  descaleStatus,
  inletFilterStatus = 'CLEAN',
  ventStatus = 'CLEAR',
  hasIsolationValves = false,
  errorCodeCount = 0,
  isBreach = false,
}: TanklessDiagramProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  const healthColor = getHealthColor(healthScore);
  const descaleColor = getDescaleColor(descaleStatus);
  const filterColor = getFilterStatusColor(inletFilterStatus);
  const ventColor = getVentStatusColor(ventStatus);
  
  // Error LED color
  const errorColor = errorCodeCount === 0 ? '#22c55e' : 
                     errorCodeCount <= 3 ? '#f59e0b' : '#ef4444';
  
  // SVG dimensions
  const width = 200;
  const height = 280;
  const unitWidth = 140;
  const unitHeight = 180;
  const unitX = (width - unitWidth) / 2;
  const unitY = 40;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto max-h-[260px]"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Unit body gradient */}
        <linearGradient id="tanklessBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="15%" stopColor="#374151" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="85%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        
        {/* Control panel gradient */}
        <linearGradient id="tanklessPanelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="50%" stopColor="#0a0f14" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        
        {/* Pipe gradient */}
        <linearGradient id="tanklessPipeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="50%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
        
        {/* Breach glow filter */}
        {isBreach && (
          <filter id="breachGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#ef4444" floodOpacity="0.6" />
            <feComposite in2="blur" operator="in" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Breach glow background */}
      {isBreach && (
        <rect 
          x={unitX - 8} 
          y={unitY - 8} 
          width={unitWidth + 16} 
          height={unitHeight + 16} 
          rx="12" 
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          opacity="0.6"
          filter="url(#breachGlow)"
        >
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="1s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Shadow under unit */}
      <ellipse 
        cx={width / 2} 
        cy={unitY + unitHeight + 18} 
        rx="50" 
        ry="6" 
        fill="rgba(0,0,0,0.4)"
      />

      {/* Mount bracket */}
      <rect 
        x={unitX - 10} 
        y={unitY + unitHeight} 
        width={unitWidth + 20} 
        height="8" 
        fill="#111827"
        rx="2"
      />

      {/* Main unit body */}
      <rect 
        x={unitX} 
        y={unitY} 
        width={unitWidth} 
        height={unitHeight} 
        fill="url(#tanklessBodyGradient)"
        stroke="#111827"
        strokeWidth="2"
        rx="8"
      />
      
      {/* Body highlight */}
      <rect 
        x={unitX + 4} 
        y={unitY + 8} 
        width="4" 
        height={unitHeight - 16} 
        fill="rgba(255,255,255,0.08)"
        rx="2"
      />

      {/* Control Panel */}
      <rect 
        x={unitX + 10} 
        y={unitY + 12} 
        width={unitWidth - 20} 
        height="65" 
        rx="4" 
        fill="url(#tanklessPanelGradient)" 
        stroke="#374151" 
        strokeWidth="1" 
      />
      
      {/* Main Display - Health Score */}
      <rect 
        x={unitX + 16} 
        y={unitY + 20} 
        width="55" 
        height="22" 
        rx="3" 
        fill="#0a0f14" 
        stroke="#374151" 
        strokeWidth="0.5" 
      />
      <text 
        x={unitX + 44} 
        y={unitY + 35} 
        textAnchor="middle" 
        fill={healthColor} 
        fontSize="12" 
        fontFamily="monospace" 
        fontWeight="700"
      >
        {healthScore}%
      </text>
      <text 
        x={unitX + 44} 
        y={unitY + 52} 
        textAnchor="middle" 
        fill="#6b7280" 
        fontSize="5" 
        fontWeight="600"
      >
        HEALTH
      </text>
      
      {/* Descale Status Display */}
      <rect 
        x={unitX + 78} 
        y={unitY + 20} 
        width="45" 
        height="22" 
        rx="3" 
        fill="#0a0f14" 
        stroke="#374151" 
        strokeWidth="0.5" 
      />
      <text 
        x={unitX + 100} 
        y={unitY + 35} 
        textAnchor="middle" 
        fill={descaleColor} 
        fontSize="9" 
        fontFamily="monospace" 
        fontWeight="700"
      >
        {getDescaleLabel(descaleStatus)}
      </text>
      <text 
        x={unitX + 100} 
        y={unitY + 52} 
        textAnchor="middle" 
        fill="#6b7280" 
        fontSize="5" 
        fontWeight="600"
      >
        DESCALE
      </text>

      {/* Status LEDs Row */}
      <g>
        {/* Filter LED */}
        <circle cx={unitX + 24} cy={unitY + 66} r="4" fill={filterColor} />
        <text x={unitX + 24} y={unitY + 76} textAnchor="middle" fill="#6b7280" fontSize="4">FILT</text>
        
        {/* Vent LED (gas only) */}
        {isGas && (
          <>
            <circle cx={unitX + 48} cy={unitY + 66} r="4" fill={ventColor} />
            <text x={unitX + 48} y={unitY + 76} textAnchor="middle" fill="#6b7280" fontSize="4">VENT</text>
          </>
        )}
        
        {/* Error LED */}
        <circle cx={isGas ? unitX + 72 : unitX + 48} cy={unitY + 66} r="4" fill={errorColor}>
          {errorCodeCount > 0 && (
            <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
          )}
        </circle>
        <text x={isGas ? unitX + 72 : unitX + 48} y={unitY + 76} textAnchor="middle" fill="#6b7280" fontSize="4">ERR</text>
        
        {/* Valve LED */}
        <circle 
          cx={isGas ? unitX + 96 : unitX + 72} 
          cy={unitY + 66} 
          r="4" 
          fill={hasIsolationValves ? '#22c55e' : '#f59e0b'} 
        />
        <text x={isGas ? unitX + 96 : unitX + 72} y={unitY + 76} textAnchor="middle" fill="#6b7280" fontSize="4">
          {hasIsolationValves ? 'VALV' : 'NO-V'}
        </text>
      </g>

      {/* Heat Exchanger Area */}
      <rect 
        x={unitX + 15} 
        y={unitY + 90} 
        width={unitWidth - 30} 
        height="70" 
        rx="4" 
        fill="#1f2937"
        stroke="#374151"
        strokeWidth="1"
      />
      
      {/* Heat exchanger coils visualization */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect 
          key={`coil-${i}`}
          x={unitX + 22} 
          y={unitY + 98 + i * 12} 
          width={unitWidth - 44} 
          height="8" 
          rx="4"
          fill={descaleStatus === 'optimal' ? '#374151' : 
                descaleStatus === 'due' ? '#78350f' :
                '#991b1b'}
          opacity={0.8}
        />
      ))}
      
      {/* Scale buildup indicator overlay */}
      {descaleStatus !== 'optimal' && (
        <text 
          x={unitX + unitWidth / 2} 
          y={unitY + 132} 
          textAnchor="middle" 
          fill={descaleColor}
          fontSize="8"
          fontWeight="700"
          opacity="0.9"
        >
          SCALE
        </text>
      )}

      {/* Burner section (gas) or Element section (electric) */}
      <rect 
        x={unitX + 20} 
        y={unitY + unitHeight - 20} 
        width={unitWidth - 40} 
        height="12" 
        rx="2"
        fill={isGas ? '#1f2937' : '#374151'}
      />
      {isGas ? (
        // Gas burner flames
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse 
              key={`flame-${i}`}
              cx={unitX + 35 + i * 18}
              cy={unitY + unitHeight - 14}
              rx="4"
              ry="6"
              fill="#f97316"
              opacity={healthScore > 30 ? 0.8 : 0.3}
            >
              {healthScore > 30 && (
                <animate attributeName="ry" values="6;7;5;6" dur="0.5s" repeatCount="indefinite" />
              )}
            </ellipse>
          ))}
        </g>
      ) : (
        // Electric element indicator
        <rect 
          x={unitX + 30} 
          y={unitY + unitHeight - 18} 
          width={unitWidth - 60} 
          height="6" 
          rx="3"
          fill={healthScore > 50 ? '#f97316' : '#6b7280'}
          opacity={healthScore > 30 ? 0.9 : 0.4}
        />
      )}

      {/* Water pipes */}
      {/* Cold inlet (left) */}
      <rect 
        x={unitX - 25} 
        y={unitY + 30} 
        width="30" 
        height="14" 
        fill="url(#tanklessPipeGradient)"
        rx="2"
      />
      <text x={unitX - 10} y={unitY + 26} textAnchor="middle" fill="#60a5fa" fontSize="5" fontWeight="600">COLD</text>
      
      {/* Hot outlet (right) */}
      <rect 
        x={unitX + unitWidth - 5} 
        y={unitY + 30} 
        width="30" 
        height="14" 
        fill="url(#tanklessPipeGradient)"
        rx="2"
      />
      <text x={unitX + unitWidth + 10} y={unitY + 26} textAnchor="middle" fill="#ef4444" fontSize="5" fontWeight="600">HOT</text>

      {/* Vent pipe (gas units) */}
      {isGas && (
        <>
          <rect 
            x={unitX + unitWidth / 2 - 10} 
            y="5" 
            width="20" 
            height="38" 
            fill="url(#tanklessPipeGradient)"
            rx="2"
          />
          <rect 
            x={unitX + unitWidth / 2 - 8} 
            y="8" 
            width="16" 
            height="12" 
            fill={ventColor}
            opacity="0.3"
            rx="1"
          />
        </>
      )}

      {/* Isolation valves indicator (if present) */}
      {hasIsolationValves && (
        <g>
          {/* Left valve */}
          <circle cx={unitX - 8} cy={unitY + 37} r="5" fill="#059669" stroke="#047857" strokeWidth="1" />
          <rect x={unitX - 11} y={unitY + 34} width="6" height="6" fill="#047857" rx="1" />
          
          {/* Right valve */}
          <circle cx={unitX + unitWidth + 8} cy={unitY + 37} r="5" fill="#059669" stroke="#047857" strokeWidth="1" />
          <rect x={unitX + unitWidth + 5} y={unitY + 34} width="6" height="6" fill="#047857" rx="1" />
        </g>
      )}
    </svg>
  );
}
