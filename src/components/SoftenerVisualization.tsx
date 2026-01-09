import React from 'react';

interface SoftenerVisualizationProps {
  resinHealth: number; // 0-100
  odometerCycles: number;
  saltLevelPercent?: number; // 0-100, defaults to 75
  isRegenerating?: boolean;
  hasCarbonFilter?: boolean;
  isCityWater?: boolean;
}

export function SoftenerVisualization({
  resinHealth,
  odometerCycles,
  saltLevelPercent = 75,
  isRegenerating = false,
  hasCarbonFilter = false,
  isCityWater = true,
}: SoftenerVisualizationProps) {
  // Determine statuses
  const getResinStatus = () => {
    if (resinHealth >= 75) return 'optimal';
    if (resinHealth >= 40) return 'warning';
    return 'critical';
  };

  const getOdometerStatus = () => {
    if (odometerCycles < 600) return 'optimal';
    if (odometerCycles < 1500) return 'warning';
    return 'critical';
  };

  const getSaltStatus = () => {
    if (saltLevelPercent >= 50) return 'optimal';
    if (saltLevelPercent >= 25) return 'warning';
    return 'critical';
  };

  const resinStatus = getResinStatus();
  const odometerStatus = getOdometerStatus();
  const saltStatus = getSaltStatus();

  // Resin tank color based on health
  const getResinColor = () => {
    if (resinHealth >= 75) return '#3b82f6'; // Blue - healthy
    if (resinHealth >= 50) return '#8b5cf6'; // Purple - aging
    if (resinHealth >= 25) return '#a16207'; // Brown - degraded
    return '#6b7280'; // Gray - failed
  };

  const getResinGlow = () => {
    if (resinHealth >= 75) return 'rgba(59, 130, 246, 0.4)';
    if (resinHealth >= 50) return 'rgba(139, 92, 246, 0.3)';
    if (resinHealth >= 25) return 'rgba(161, 98, 7, 0.3)';
    return 'rgba(107, 114, 128, 0.2)';
  };

  // Status colors for indicators
  const statusColors = {
    optimal: { led: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)' },
    warning: { led: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    critical: { led: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)' },
  };

  return (
    <div className="relative">
      <svg viewBox="0 0 400 300" className="w-full h-auto">
        <defs>
          {/* Gradients */}
          <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          <linearGradient id="resinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={getResinColor()} stopOpacity="0.9" />
            <stop offset="100%" stopColor={getResinColor()} stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="saltGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="100%" stopColor="#f9fafb" />
          </linearGradient>

          <linearGradient id="brineTankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9ca3af" />
            <stop offset="50%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>

          <linearGradient id="valveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="resinGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="ledGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="warningPulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Salt texture pattern */}
          <pattern id="saltTexture" patternUnits="userSpaceOnUse" width="8" height="8">
            <circle cx="2" cy="2" r="1" fill="#d1d5db" />
            <circle cx="6" cy="6" r="1" fill="#d1d5db" />
          </pattern>

          {/* Mushy resin pattern for degraded state */}
          <pattern id="mushyResin" patternUnits="userSpaceOnUse" width="12" height="12">
            <circle cx="3" cy="3" r="3" fill={getResinColor()} opacity="0.5" />
            <circle cx="9" cy="9" r="2" fill={getResinColor()} opacity="0.4" />
            <circle cx="6" cy="1" r="1.5" fill={getResinColor()} opacity="0.3" />
          </pattern>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="300" fill="transparent" />

        {/* Pipes connecting tanks */}
        <path
          d="M 100 55 L 100 35 L 280 35 L 280 70"
          fill="none"
          stroke="#78716c"
          strokeWidth="8"
        />
        <path
          d="M 100 55 L 100 35 L 280 35 L 280 70"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="4"
        />


        {/* === CARBON FILTER (if present) === */}
        {hasCarbonFilter && (
          <g>
            <rect x="5" y="90" width="30" height="80" rx="4" fill="#1f2937" />
            <rect x="8" y="95" width="24" height="70" rx="2" fill="#374151" />
            <text x="20" y="135" textAnchor="middle" fill="#9ca3af" fontSize="8" transform="rotate(-90 20 135)">
              CARBON
            </text>
            <line x1="35" y1="130" x2="50" y2="130" stroke="#78716c" strokeWidth="4" />
            
            {/* Shield icon - protection active */}
            <circle cx="20" cy="85" r="10" fill="#22c55e" opacity="0.2" filter="url(#ledGlow)" />
            <text x="20" y="89" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">✓</text>
          </g>
        )}

        {/* Chlorine warning if city water without carbon filter */}
        {isCityWater && !hasCarbonFilter && (
          <g>
            <rect x="5" y="90" width="30" height="40" rx="4" fill="#7f1d1d" opacity="0.3" />
            <text x="20" y="105" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">
              CL₂
            </text>
            <text x="20" y="120" textAnchor="middle" fill="#ef4444" fontSize="6">
              ATTACK
            </text>
            <line x1="35" y1="110" x2="50" y2="130" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" opacity="0.5">
              <animate attributeName="stroke-dashoffset" values="0;6" dur="1s" repeatCount="indefinite" />
            </line>
          </g>
        )}

        {/* === RESIN TANK (Left) === */}
        <g>
          {/* Warning glow for critical/warning states */}
          {resinStatus !== 'optimal' && (
            <ellipse 
              cx="100" 
              cy="150" 
              rx="60" 
              ry="100" 
              fill={resinStatus === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'}
              filter="url(#warningPulse)"
            >
              <animate attributeName="opacity" values="0.1;0.2;0.1" dur="2s" repeatCount="indefinite" />
            </ellipse>
          )}

          {/* Tank body */}
          <ellipse cx="100" cy="245" rx="50" ry="15" fill="#1f2937" />
          <rect x="50" y="55" width="100" height="190" fill="url(#tankGradient)" />
          <ellipse cx="100" cy="55" rx="50" ry="15" fill="#4b5563" />
          
          {/* Resin inside tank */}
          <clipPath id="resinClip">
            <rect x="55" y="65" width="90" height="170" />
          </clipPath>
          <g clipPath="url(#resinClip)">
            {/* Resin fill based on health */}
            <rect 
              x="55" 
              y={65 + (170 * (1 - resinHealth / 100))} 
              width="90" 
              height={170 * (resinHealth / 100)} 
              fill={resinHealth < 40 ? 'url(#mushyResin)' : 'url(#resinGradient)'}
              filter={resinStatus === 'optimal' ? 'url(#resinGlow)' : undefined}
              style={{ filter: resinStatus === 'optimal' ? undefined : `drop-shadow(0 0 8px ${getResinGlow()})` }}
            />
            
            {/* Resin beads pattern - only show if healthy enough */}
            {resinHealth >= 40 && Array.from({ length: 12 }).map((_, i) => (
              <circle
                key={i}
                cx={62 + (i % 4) * 22}
                cy={230 - Math.floor(i / 4) * 30 - (170 * (1 - resinHealth / 100))}
                r="5"
                fill={getResinColor()}
                opacity="0.6"
              />
            ))}
          </g>

          {/* Health percentage label on tank */}
          <rect x="70" y="135" width="60" height="30" rx="4" fill="rgba(0,0,0,0.6)" />
          <text x="100" y="153" textAnchor="middle" fill={
            resinStatus === 'optimal' ? '#22c55e' : 
            resinStatus === 'warning' ? '#f59e0b' : '#ef4444'
          } fontSize="14" fontWeight="bold" fontFamily="monospace">
            {resinHealth}%
          </text>
          <text x="100" y="162" textAnchor="middle" fill="#9ca3af" fontSize="6">
            RESIN
          </text>

          {/* Control valve head */}
          <rect x="70" y="30" width="60" height="30" rx="4" fill="url(#valveGradient)" />
          <rect x="75" y="35" width="50" height="20" rx="2" fill="#0f172a" />
          
          {/* LCD Display with odometer */}
          <rect x="78" y="38" width="44" height="14" rx="1" fill="#1e3a5f" />
          <text x="100" y="48" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="monospace">
            {odometerCycles}
          </text>
          
          {/* LED status indicator */}
          <circle 
            cx="128" 
            cy="45" 
            r="5" 
            fill={statusColors[odometerStatus].led}
            filter="url(#ledGlow)"
          >
            {odometerStatus !== 'optimal' && (
              <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
            )}
          </circle>
          
          {/* Regenerating indicator */}
          {isRegenerating && (
            <g>
              <circle cx="135" cy="45" r="6" fill="#22c55e" filter="url(#ledGlow)">
                <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <text x="100" y="25" textAnchor="middle" fill="#22c55e" fontSize="8" fontWeight="bold">
                REGENERATING
              </text>
            </g>
          )}

          {/* Odometer status label */}
          <text x="100" y="68" textAnchor="middle" fill={
            odometerStatus === 'optimal' ? '#22c55e' : 
            odometerStatus === 'warning' ? '#f59e0b' : '#ef4444'
          } fontSize="7" fontWeight="bold">
            {odometerStatus === 'optimal' ? 'SEALS OK' : 
             odometerStatus === 'warning' ? 'SEALS WEARING' : 'SEALS WORN'}
          </text>
        </g>

        {/* === BRINE TANK (Right) === */}
        <g>
          {/* Warning glow for low salt */}
          {saltStatus !== 'optimal' && (
            <ellipse 
              cx="280" 
              cy="160" 
              rx="65" 
              ry="100" 
              fill={saltStatus === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.08)'}
              filter="url(#warningPulse)"
            >
              <animate attributeName="opacity" values="0.08;0.15;0.08" dur="2s" repeatCount="indefinite" />
            </ellipse>
          )}

          {/* Tank body */}
          <ellipse cx="280" cy="245" rx="55" ry="15" fill="#6b7280" />
          <rect x="225" y="70" width="110" height="175" fill="url(#brineTankGradient)" />
          <ellipse cx="280" cy="70" rx="55" ry="15" fill="#d1d5db" />
          
          {/* Salt level inside */}
          <clipPath id="saltClip">
            <rect x="230" y="80" width="100" height="155" />
          </clipPath>
          <g clipPath="url(#saltClip)">
            <rect 
              x="230" 
              y={80 + (155 * (1 - saltLevelPercent / 100))} 
              width="100" 
              height={155 * (saltLevelPercent / 100)} 
              fill="url(#saltGradient)"
            />
            {/* Salt texture overlay */}
            <rect 
              x="230" 
              y={80 + (155 * (1 - saltLevelPercent / 100))} 
              width="100" 
              height={155 * (saltLevelPercent / 100)} 
              fill="url(#saltTexture)"
              opacity="0.5"
            />
            {/* Salt pile top */}
            <ellipse 
              cx="280" 
              cy={80 + (155 * (1 - saltLevelPercent / 100))} 
              rx="50" 
              ry="10" 
              fill="#f3f4f6"
            />
          </g>

          {/* Salt level indicator bar */}
          <rect x="340" y="80" width="12" height="155" rx="2" fill="#1f2937" stroke="#374151" strokeWidth="1" />
          <rect 
            x="342" 
            y={82 + (151 * (1 - saltLevelPercent / 100))} 
            width="8" 
            height={151 * (saltLevelPercent / 100)} 
            rx="1" 
            fill={saltStatus === 'optimal' ? '#22c55e' : saltStatus === 'warning' ? '#f59e0b' : '#ef4444'}
          />
          
          {/* Salt percentage label */}
          <rect x="250" y="145" width="60" height="30" rx="4" fill="rgba(0,0,0,0.6)" />
          <text x="280" y="163" textAnchor="middle" fill={
            saltStatus === 'optimal' ? '#22c55e' : 
            saltStatus === 'warning' ? '#f59e0b' : '#ef4444'
          } fontSize="14" fontWeight="bold" fontFamily="monospace">
            {saltLevelPercent}%
          </text>
          <text x="280" y="172" textAnchor="middle" fill="#9ca3af" fontSize="6">
            SALT
          </text>

          {/* Low salt warning */}
          {saltStatus === 'critical' && (
            <g>
              <rect x="250" y="185" width="60" height="18" rx="3" fill="#7f1d1d" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.5;0.8" dur="1s" repeatCount="indefinite" />
              </rect>
              <text x="280" y="197" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">
                REFILL NOW
              </text>
            </g>
          )}

          {/* Brine line to resin tank */}
          <line x1="225" y1="190" x2="150" y2="190" stroke="#78716c" strokeWidth="4" />
        </g>

        {/* Labels */}
        <text x="100" y="268" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          Resin Tank
        </text>
        <text x="280" y="268" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          Brine Tank
        </text>
      </svg>
    </div>
  );
}
