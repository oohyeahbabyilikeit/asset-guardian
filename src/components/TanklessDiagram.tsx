import { cn } from '@/lib/utils';
import type { FuelType, InletFilterStatus, FlameRodStatus, VentStatus } from '@/lib/opterraAlgorithm';

interface TanklessDiagramProps {
  fuelType: FuelType;
  scalePercent: number;           // 0-100% scale buildup
  flowCapacityPercent: number;    // Current flow as % of rated
  igniterHealth?: number;         // 0-100% (gas only)
  elementHealth?: number;         // 0-100% (electric only)
  inletFilterStatus?: InletFilterStatus;
  flameRodStatus?: FlameRodStatus;
  ventStatus?: VentStatus;
  isBreach?: boolean;
  errorCodeCount?: number;
}

export function TanklessDiagram({
  fuelType,
  scalePercent,
  flowCapacityPercent,
  igniterHealth = 85,
  elementHealth = 90,
  inletFilterStatus = 'CLEAN',
  flameRodStatus = 'GOOD',
  ventStatus = 'CLEAR',
  isBreach = false,
  errorCodeCount = 0,
}: TanklessDiagramProps) {
  const isGas = fuelType === 'TANKLESS_GAS';
  
  // Status color logic
  const getStatusColor = (value: number, thresholds: [number, number] = [50, 80]) => {
    if (value >= thresholds[1]) return '#22c55e'; // green
    if (value >= thresholds[0]) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };
  
  const getFilterStatusColor = (status: InletFilterStatus) => {
    if (status === 'CLEAN') return '#22c55e';
    if (status === 'DIRTY') return '#f59e0b';
    return '#ef4444';
  };
  
  const getFlameRodStatusColor = (status: FlameRodStatus) => {
    if (status === 'GOOD') return '#22c55e';
    if (status === 'WORN') return '#f59e0b';
    return '#ef4444';
  };
  
  const getVentStatusColor = (status: VentStatus) => {
    if (status === 'CLEAR') return '#22c55e';
    if (status === 'RESTRICTED') return '#f59e0b';
    return '#ef4444';
  };
  
  const scaleStatus = scalePercent <= 15 ? 'good' : scalePercent <= 35 ? 'warning' : 'critical';
  const flowStatus = flowCapacityPercent >= 80 ? 'good' : flowCapacityPercent >= 60 ? 'warning' : 'critical';
  
  const statusColors = {
    good: '#22c55e',
    warning: '#f59e0b',
    critical: '#ef4444'
  };

  // SVG dimensions
  const width = 200;
  const height = 300;
  const unitWidth = 120;
  const unitHeight = 180;
  const unitX = (width - unitWidth) / 2;
  const unitY = 30;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto max-h-[280px]"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Unit body gradient - metallic rectangular look */}
        <linearGradient id="tanklessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="15%" stopColor="#374151" />
          <stop offset="50%" stopColor="#4b5563" />
          <stop offset="85%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        
        {/* Heat exchanger gradient */}
        <linearGradient id="exchangerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        
        {/* Scale buildup gradient */}
        <linearGradient id="scaleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(180, 83, 9, 0.3)" />
          <stop offset="50%" stopColor="rgba(180, 83, 9, 0.6)" />
          <stop offset="100%" stopColor="rgba(180, 83, 9, 0.3)" />
        </linearGradient>
        
        {/* Control panel gradient */}
        <linearGradient id="tanklessPanelGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        
        {/* Copper pipe gradient */}
        <linearGradient id="tanklessCopperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        
        {/* Burner glow filter - subtle industrial look */}
        <filter id="burnerGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        
        {/* Heat shimmer gradient */}
        <linearGradient id="burnerHeatGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ea580c" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fdba74" stopOpacity="0.1" />
        </linearGradient>
        
        {/* Burner bar gradient */}
        <linearGradient id="burnerBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="30%" stopColor="#374151" />
          <stop offset="70%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        
        {/* Breach glow */}
        <filter id="breachGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Wall mount bracket */}
      <rect x={unitX - 8} y={unitY + 20} width={unitWidth + 16} height="8" fill="#374151" rx="2" />
      <rect x={unitX + 10} y={unitY + 15} width="12" height="18" fill="#4b5563" rx="2" />
      <rect x={unitX + unitWidth - 22} y={unitY + 15} width="12" height="18" fill="#4b5563" rx="2" />

      {/* Main unit body */}
      <rect 
        x={unitX} 
        y={unitY} 
        width={unitWidth} 
        height={unitHeight}
        fill="url(#tanklessGradient)"
        stroke="#1f2937"
        strokeWidth="2"
        rx="6"
      />
      
      {/* Unit highlight edge */}
      <rect 
        x={unitX + 3} 
        y={unitY + 5} 
        width="4" 
        height={unitHeight - 10}
        fill="rgba(255,255,255,0.08)"
        rx="2"
      />

      {/* Top vent (gas only) */}
      {isGas && (
        <g>
          <rect x={unitX + unitWidth/2 - 15} y={unitY - 12} width="30" height="14" fill="#374151" rx="3" />
          <rect x={unitX + unitWidth/2 - 10} y={unitY - 14} width="20" height="6" fill="#4b5563" rx="2" />
          {/* Vent status indicator */}
          <circle 
            cx={unitX + unitWidth/2 + 18} 
            cy={unitY - 5} 
            r="4" 
            fill={getVentStatusColor(ventStatus)}
          />
        </g>
      )}

      {/* Control Panel / Display Area */}
      <rect 
        x={unitX + 10} 
        y={unitY + 15} 
        width={unitWidth - 20} 
        height="55" 
        rx="4"
        fill="url(#tanklessPanelGradient)"
        stroke="#334155"
        strokeWidth="1"
      />
      
      {/* Digital display */}
      <rect x={unitX + 18} y={unitY + 22} width="60" height="24" rx="3" fill="#0a0f14" stroke="#1e293b" strokeWidth="1" />
      
      {/* Flow rate display */}
      <text x={unitX + 48} y={unitY + 33} textAnchor="middle" fill="#6ee7b7" fontSize="7" fontFamily="monospace">
        FLOW
      </text>
      <text x={unitX + 48} y={unitY + 42} textAnchor="middle" fill={statusColors[flowStatus]} fontSize="9" fontFamily="monospace" fontWeight="bold">
        {flowCapacityPercent}%
      </text>
      
      {/* Temperature display */}
      <rect x={unitX + unitWidth - 45} y={unitY + 22} width="28" height="24" rx="3" fill="#0a0f14" stroke="#1e293b" strokeWidth="1" />
      <text x={unitX + unitWidth - 31} y={unitY + 33} textAnchor="middle" fill="#60a5fa" fontSize="6" fontFamily="monospace">
        TEMP
      </text>
      <text x={unitX + unitWidth - 31} y={unitY + 42} textAnchor="middle" fill="#60a5fa" fontSize="8" fontFamily="monospace" fontWeight="bold">
        120°
      </text>

      {/* Status LEDs row */}
      <g>
        {/* Power LED */}
        <circle cx={unitX + 22} cy={unitY + 58} r="4" fill="#22c55e" opacity="0.9" />
        <text x={unitX + 22} y={unitY + 68} textAnchor="middle" fill="#6b7280" fontSize="5">PWR</text>
        
        {/* Igniter/Element LED */}
        <circle 
          cx={unitX + 45} 
          cy={unitY + 58} 
          r="4" 
          fill={isGas ? getStatusColor(igniterHealth) : getStatusColor(elementHealth)}
        />
        <text x={unitX + 45} y={unitY + 68} textAnchor="middle" fill="#6b7280" fontSize="5">
          {isGas ? 'IGN' : 'ELEM'}
        </text>
        
        {/* Filter LED */}
        <circle cx={unitX + 68} cy={unitY + 58} r="4" fill={getFilterStatusColor(inletFilterStatus)} />
        <text x={unitX + 68} y={unitY + 68} textAnchor="middle" fill="#6b7280" fontSize="5">FILT</text>
        
        {/* Error LED */}
        <circle 
          cx={unitX + 91} 
          cy={unitY + 58} 
          r="4" 
          fill={errorCodeCount > 5 ? '#ef4444' : errorCodeCount > 0 ? '#f59e0b' : '#22c55e'}
        />
        <text x={unitX + 91} y={unitY + 68} textAnchor="middle" fill="#6b7280" fontSize="5">ERR</text>
      </g>

      {/* Heat Exchanger Visualization */}
      <rect 
        x={unitX + 15} 
        y={unitY + 80} 
        width={unitWidth - 30} 
        height="70" 
        rx="4"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
      
      {/* Heat exchanger coils */}
      <g>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={`coil-${i}`}>
            <path
              d={`M ${unitX + 22} ${unitY + 90 + i * 12} 
                  Q ${unitX + 40} ${unitY + 85 + i * 12} ${unitX + 60} ${unitY + 90 + i * 12}
                  Q ${unitX + 80} ${unitY + 95 + i * 12} ${unitX + 98} ${unitY + 90 + i * 12}`}
              fill="none"
              stroke="url(#exchangerGradient)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Scale buildup on coils */}
            {scalePercent > 10 && (
              <path
                d={`M ${unitX + 22} ${unitY + 90 + i * 12} 
                    Q ${unitX + 40} ${unitY + 85 + i * 12} ${unitX + 60} ${unitY + 90 + i * 12}
                    Q ${unitX + 80} ${unitY + 95 + i * 12} ${unitX + 98} ${unitY + 90 + i * 12}`}
                fill="none"
                stroke="url(#scaleGradient)"
                strokeWidth={2 + (scalePercent / 25)}
                strokeLinecap="round"
                opacity={Math.min(0.8, scalePercent / 50)}
              />
            )}
          </g>
        ))}
      </g>
      
      {/* Burner assembly (gas only) - industrial style */}
      {isGas && (
        <g opacity={igniterHealth > 30 ? 1 : 0.4}>
          {/* Burner bar */}
          <rect 
            x={unitX + 20} 
            y={unitY + 156} 
            width={unitWidth - 40} 
            height="6" 
            rx="1"
            fill="url(#burnerBarGradient)"
            stroke="#1f2937"
            strokeWidth="0.5"
          />
          
          {/* Burner ports (holes) */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <circle
              key={`port-${i}`}
              cx={unitX + 28 + i * 10}
              cy={unitY + 159}
              r="2"
              fill="#0f172a"
            />
          ))}
          
          {/* Heat glow bars - subtle industrial heat visualization */}
          <g filter="url(#burnerGlow)">
            {[0, 1, 2].map((row) => (
              <rect
                key={`heat-row-${row}`}
                x={unitX + 22}
                y={unitY + 150 - row * 4}
                width={unitWidth - 44}
                height="2"
                rx="1"
                fill={row === 0 ? '#dc2626' : row === 1 ? '#ea580c' : '#f97316'}
                opacity={0.5 - row * 0.12}
              />
            ))}
          </g>
          
          {/* Subtle shimmer effect */}
          <rect
            x={unitX + 22}
            y={unitY + 140}
            width={unitWidth - 44}
            height="16"
            fill="url(#burnerHeatGradient)"
            opacity="0.25"
          />
        </g>
      )}
      
      {/* Element glow (electric only) */}
      {!isGas && (
        <g>
          <rect 
            x={unitX + 20} 
            y={unitY + 155} 
            width={unitWidth - 40} 
            height="6" 
            rx="2"
            fill={elementHealth > 50 ? '#ef4444' : '#7f1d1d'}
            opacity={elementHealth > 50 ? 0.7 : 0.4}
          />
        </g>
      )}

      {/* Bottom pipe connections */}
      <g>
        {/* Cold water in (blue label) */}
        <rect x={unitX + 20} y={unitY + unitHeight} width="20" height="25" fill="url(#tanklessCopperGradient)" rx="2" />
        <text x={unitX + 30} y={unitY + unitHeight + 38} textAnchor="middle" fill="#60a5fa" fontSize="6" fontWeight="600">
          COLD
        </text>
        
        {/* Hot water out (red label) */}
        <rect x={unitX + unitWidth - 40} y={unitY + unitHeight} width="20" height="25" fill="url(#tanklessCopperGradient)" rx="2" />
        <text x={unitX + unitWidth - 30} y={unitY + unitHeight + 38} textAnchor="middle" fill="#ef4444" fontSize="6" fontWeight="600">
          HOT
        </text>
        
        {/* Gas line (gas only) */}
        {isGas && (
          <>
            <rect x={unitX + unitWidth/2 - 8} y={unitY + unitHeight} width="16" height="20" fill="#fbbf24" rx="2" />
            <text x={unitX + unitWidth/2} y={unitY + unitHeight + 32} textAnchor="middle" fill="#fbbf24" fontSize="5" fontWeight="600">
              GAS
            </text>
          </>
        )}
      </g>

      {/* SCALE Label with line (like ANODE/SEDIMENT) */}
      <g>
        <line 
          x1={unitX + unitWidth - 10} 
          y1={unitY + 115} 
          x2={unitX + unitWidth + 25} 
          y2={unitY + 115}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={unitX + unitWidth + 25} 
          cy={unitY + 115} 
          r="3" 
          fill={statusColors[scaleStatus]}
        />
        <text 
          x={unitX + unitWidth + 32} 
          y={unitY + 109} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="start"
        >
          SCALE
        </text>
        <text 
          x={unitX + unitWidth + 32} 
          y={unitY + 121} 
          fill={statusColors[scaleStatus]} 
          fontSize="10" 
          fontWeight="bold"
          textAnchor="start"
          className="font-data"
        >
          {scalePercent}%
        </text>
      </g>

      {/* FLOW Label with line */}
      <g>
        <line 
          x1={unitX + unitWidth - 10} 
          y1={unitY + 145} 
          x2={unitX + unitWidth + 25} 
          y2={unitY + 145}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={unitX + unitWidth + 25} 
          cy={unitY + 145} 
          r="3" 
          fill={statusColors[flowStatus]}
        />
        <text 
          x={unitX + unitWidth + 32} 
          y={unitY + 139} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="start"
        >
          FLOW
        </text>
        <text 
          x={unitX + unitWidth + 32} 
          y={unitY + 151} 
          fill={statusColors[flowStatus]} 
          fontSize="10" 
          fontWeight="bold"
          textAnchor="start"
          className="font-data"
        >
          {flowCapacityPercent}%
        </text>
      </g>

      {/* Igniter/Element Label (left side) */}
      <g>
        <line 
          x1={unitX + 10} 
          y1={unitY + 130} 
          x2={unitX - 22} 
          y2={unitY + 130}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={unitX - 22} 
          cy={unitY + 130} 
          r="3" 
          fill={isGas ? getStatusColor(igniterHealth) : getStatusColor(elementHealth)}
        />
        <text 
          x={unitX - 28} 
          y={unitY + 124} 
          fill="#9ca3af" 
          fontSize="8" 
          fontWeight="600"
          textAnchor="end"
        >
          {isGas ? 'IGNITER' : 'ELEMENT'}
        </text>
        <text 
          x={unitX - 28} 
          y={unitY + 136} 
          fill={isGas ? getStatusColor(igniterHealth) : getStatusColor(elementHealth)} 
          fontSize="10" 
          fontWeight="bold"
          textAnchor="end"
          className="font-data"
        >
          {isGas ? igniterHealth : elementHealth}%
        </text>
      </g>

      {/* Brand label */}
      <rect x={unitX + 10} y={unitY + unitHeight - 22} width={unitWidth - 20} height="14" rx="2" fill="rgba(0,0,0,0.3)" />
      <text x={unitX + unitWidth/2} y={unitY + unitHeight - 12} textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="500" letterSpacing="1">
        {isGas ? 'TANKLESS GAS' : 'TANKLESS ELECTRIC'}
      </text>

      {/* Breach visualization */}
      {isBreach && (
        <g filter="url(#breachGlow)">
          <rect 
            x={unitX - 2} 
            y={unitY - 2} 
            width={unitWidth + 4} 
            height={unitHeight + 4}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            rx="8"
            opacity="0.6"
          />
        </g>
      )}
    </svg>
  );
}

export default TanklessDiagram;
