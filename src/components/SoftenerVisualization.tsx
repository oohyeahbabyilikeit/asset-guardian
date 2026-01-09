import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SoftenerVisualizationProps {
  resinHealth: number; // 0-100
  odometerCycles: number;
  saltLevelPercent?: number; // 0-100, defaults to 75
  isRegenerating?: boolean;
  hasCarbonFilter?: boolean;
  isCityWater?: boolean;
}

interface ComponentInfo {
  id: string;
  name: string;
  description: string;
  importance: string;
  status?: { label: string; value: string | number };
}

export function SoftenerVisualization({
  resinHealth,
  odometerCycles,
  saltLevelPercent = 75,
  isRegenerating = false,
  hasCarbonFilter = false,
  isCityWater = true,
}: SoftenerVisualizationProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

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

  // Color mappings
  const statusColors = {
    optimal: { fill: '#22c55e', stroke: '#16a34a', glow: 'rgba(34, 197, 94, 0.4)' },
    warning: { fill: '#f59e0b', stroke: '#d97706', glow: 'rgba(245, 158, 11, 0.4)' },
    critical: { fill: '#ef4444', stroke: '#dc2626', glow: 'rgba(239, 68, 68, 0.4)' },
  };

  // Resin tank color based on health
  const getResinColor = () => {
    if (resinHealth >= 75) return '#3b82f6'; // Blue - healthy
    if (resinHealth >= 50) return '#8b5cf6'; // Purple - aging
    if (resinHealth >= 25) return '#a16207'; // Brown - degraded
    return '#6b7280'; // Gray - failed
  };

  const componentData: Record<string, ComponentInfo> = {
    'control-valve': {
      id: 'control-valve',
      name: 'Control Valve',
      description: 'The "brain" of your softener. Contains the timer, motor, and piston that controls regeneration cycles.',
      importance: 'Every regeneration wears the piston seals. After ~600 cycles, seals flatten and leak water down the drain 24/7.',
      status: { label: 'Odometer', value: `${odometerCycles} cycles` },
    },
    'resin-tank': {
      id: 'resin-tank',
      name: 'Resin Tank',
      description: 'Contains thousands of tiny resin beads that attract and trap hard water minerals through ion exchange.',
      importance: isCityWater && !hasCarbonFilter 
        ? 'CHLORINE ATTACK: City water chlorine is destroying your resin beads, turning them to mush.'
        : 'Resin beads have a limited lifespan. When capacity drops below 50%, you\'re burning salt but not softening water.',
      status: { label: 'Resin Health', value: `${resinHealth}%` },
    },
    'brine-tank': {
      id: 'brine-tank',
      name: 'Brine Tank',
      description: 'Stores salt that creates the brine solution used to regenerate the resin beads.',
      importance: 'Running out of salt means no regeneration = hard water throughout your home. Monitor levels monthly.',
      status: { label: 'Salt Level', value: `${saltLevelPercent}%` },
    },
    'bypass-valve': {
      id: 'bypass-valve',
      name: 'Bypass Valve',
      description: 'Allows water to bypass the softener for maintenance or emergencies.',
      importance: 'Know where this is! In a leak emergency, this is your shutoff.',
    },
    'drain-line': {
      id: 'drain-line',
      name: 'Drain Line',
      description: 'Carries the brine and captured minerals to the drain during regeneration.',
      importance: 'If seals are worn, water leaks here 24/7 even when not regenerating. Listen for constant trickling.',
    },
  };

  const selectedInfo = selectedComponent ? componentData[selectedComponent] : null;

  // Hotspot positions (percentage-based)
  const hotspots = [
    { id: 'control-valve', x: 35, y: 12, label: '1' },
    { id: 'resin-tank', x: 25, y: 50, label: '2' },
    { id: 'brine-tank', x: 70, y: 55, label: '3' },
    { id: 'bypass-valve', x: 50, y: 8, label: '4' },
    { id: 'drain-line', x: 30, y: 88, label: '5' },
  ];

  return (
    <div className="relative">
      <svg viewBox="0 0 400 320" className="w-full h-auto">
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
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
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
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="320" fill="transparent" />

        {/* Pipes connecting tanks */}
        <path
          d="M 100 60 L 100 40 L 280 40 L 280 80"
          fill="none"
          stroke="#78716c"
          strokeWidth="8"
        />
        <path
          d="M 100 60 L 100 40 L 280 40 L 280 80"
          fill="none"
          stroke="#a8a29e"
          strokeWidth="4"
        />

        {/* Drain line */}
        <path
          d="M 100 260 L 100 290 L 180 290"
          fill="none"
          stroke="#78716c"
          strokeWidth="6"
        />

        {/* === RESIN TANK (Left) === */}
        <g>
          {/* Tank body */}
          <ellipse cx="100" cy="260" rx="50" ry="15" fill="#1f2937" />
          <rect x="50" y="60" width="100" height="200" fill="url(#tankGradient)" />
          <ellipse cx="100" cy="60" rx="50" ry="15" fill="#4b5563" />
          
          {/* Resin inside tank */}
          <clipPath id="resinClip">
            <rect x="55" y="70" width="90" height="180" />
          </clipPath>
          <g clipPath="url(#resinClip)">
            <rect 
              x="55" 
              y={70 + (180 * (1 - resinHealth / 100))} 
              width="90" 
              height={180 * (resinHealth / 100)} 
              fill="url(#resinGradient)"
              filter={resinStatus === 'critical' ? undefined : 'url(#resinGlow)'}
            />
            {/* Resin beads pattern */}
            {resinHealth > 20 && Array.from({ length: 15 }).map((_, i) => (
              <circle
                key={i}
                cx={60 + (i % 5) * 18}
                cy={250 - Math.floor(i / 5) * 25 - (180 * (1 - resinHealth / 100))}
                r="4"
                fill={getResinColor()}
                opacity="0.7"
              />
            ))}
          </g>

          {/* Control valve head */}
          <rect x="70" y="35" width="60" height="30" rx="4" fill="url(#valveGradient)" />
          <rect x="75" y="40" width="50" height="20" rx="2" fill="#0f172a" />
          
          {/* LCD Display */}
          <rect x="80" y="43" width="40" height="14" rx="1" fill="#1e3a5f" />
          <text x="100" y="53" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="monospace">
            {odometerCycles}
          </text>
          
          {/* Regenerating indicator */}
          {isRegenerating && (
            <circle cx="125" cy="50" r="4" fill="#22c55e">
              <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
            </circle>
          )}
        </g>

        {/* === BRINE TANK (Right) === */}
        <g>
          {/* Tank body */}
          <ellipse cx="280" cy="260" rx="55" ry="15" fill="#6b7280" />
          <rect x="225" y="80" width="110" height="180" fill="url(#brineTankGradient)" />
          <ellipse cx="280" cy="80" rx="55" ry="15" fill="#d1d5db" />
          
          {/* Salt level inside */}
          <clipPath id="saltClip">
            <rect x="230" y="90" width="100" height="160" />
          </clipPath>
          <g clipPath="url(#saltClip)">
            <rect 
              x="230" 
              y={90 + (160 * (1 - saltLevelPercent / 100))} 
              width="100" 
              height={160 * (saltLevelPercent / 100)} 
              fill="url(#saltGradient)"
            />
            {/* Salt texture overlay */}
            <rect 
              x="230" 
              y={90 + (160 * (1 - saltLevelPercent / 100))} 
              width="100" 
              height={160 * (saltLevelPercent / 100)} 
              fill="url(#saltTexture)"
              opacity="0.5"
            />
            {/* Salt pile top */}
            <ellipse 
              cx="280" 
              cy={90 + (160 * (1 - saltLevelPercent / 100))} 
              rx="50" 
              ry="10" 
              fill="#f3f4f6"
            />
          </g>

          {/* Brine line to resin tank */}
          <line x1="225" y1="200" x2="150" y2="200" stroke="#78716c" strokeWidth="4" />
        </g>

        {/* === CARBON FILTER (if present) === */}
        {hasCarbonFilter && (
          <g>
            <rect x="5" y="100" width="30" height="80" rx="4" fill="#1f2937" />
            <rect x="8" y="105" width="24" height="70" rx="2" fill="#374151" />
            <text x="20" y="145" textAnchor="middle" fill="#9ca3af" fontSize="8" transform="rotate(-90 20 145)">
              CARBON
            </text>
            <line x1="35" y1="140" x2="50" y2="140" stroke="#78716c" strokeWidth="4" />
            
            {/* Shield icon */}
            <circle cx="20" cy="95" r="8" fill="#22c55e" opacity="0.3" />
            <text x="20" y="98" textAnchor="middle" fill="#22c55e" fontSize="8">✓</text>
          </g>
        )}

        {/* === HOTSPOTS === */}
        {hotspots.map((hotspot) => {
          const info = componentData[hotspot.id];
          const isSelected = selectedComponent === hotspot.id;
          let statusColor = statusColors.optimal;
          
          if (hotspot.id === 'resin-tank') statusColor = statusColors[resinStatus];
          if (hotspot.id === 'control-valve') statusColor = statusColors[odometerStatus];
          if (hotspot.id === 'brine-tank') statusColor = statusColors[saltStatus];

          return (
            <g
              key={hotspot.id}
              onClick={() => setSelectedComponent(isSelected ? null : hotspot.id)}
              className="cursor-pointer"
            >
              <circle
                cx={(hotspot.x / 100) * 400}
                cy={(hotspot.y / 100) * 320}
                r={isSelected ? 16 : 14}
                fill={isSelected ? statusColor.fill : '#1f2937'}
                stroke={statusColor.stroke}
                strokeWidth="2"
                opacity={isSelected ? 1 : 0.9}
              />
              <text
                x={(hotspot.x / 100) * 400}
                y={(hotspot.y / 100) * 320 + 4}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                {hotspot.label}
              </text>
              
              {/* Pulse animation for warnings */}
              {(
                (hotspot.id === 'resin-tank' && resinStatus !== 'optimal') ||
                (hotspot.id === 'control-valve' && odometerStatus !== 'optimal') ||
                (hotspot.id === 'brine-tank' && saltStatus !== 'optimal')
              ) && (
                <circle
                  cx={(hotspot.x / 100) * 400}
                  cy={(hotspot.y / 100) * 320}
                  r="14"
                  fill="none"
                  stroke={statusColor.stroke}
                  strokeWidth="2"
                  opacity="0.5"
                >
                  <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* Labels */}
        <text x="100" y="285" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          Resin Tank
        </text>
        <text x="280" y="285" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="10">
          Brine Tank
        </text>
      </svg>

      {/* Info Card */}
      {selectedInfo ? (
        <Card className="mt-4 p-4 bg-card border-border">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-foreground">{selectedInfo.name}</h3>
            {selectedInfo.status && (
              <Badge variant={
                selectedComponent === 'resin-tank' ? (resinStatus === 'optimal' ? 'default' : resinStatus === 'warning' ? 'secondary' : 'destructive') :
                selectedComponent === 'control-valve' ? (odometerStatus === 'optimal' ? 'default' : odometerStatus === 'warning' ? 'secondary' : 'destructive') :
                selectedComponent === 'brine-tank' ? (saltStatus === 'optimal' ? 'default' : saltStatus === 'warning' ? 'secondary' : 'destructive') :
                'default'
              }>
                {selectedInfo.status.label}: {selectedInfo.status.value}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">{selectedInfo.description}</p>
          <p className="text-sm text-foreground font-medium">{selectedInfo.importance}</p>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground text-sm mt-4">
          Tap a number to learn about each component
        </p>
      )}
    </div>
  );
}
