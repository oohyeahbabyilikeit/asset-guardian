import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Droplets, Shield, Plus, Calendar, AlertTriangle, Wind, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ServiceEvent } from '@/types/serviceHistory';
import type { FuelType, AirFilterStatus } from '@/lib/opterraAlgorithm';

interface ServiceHistoryProps {
  calendarAge: number;
  sedimentLbs: number;
  shieldLife: number;
  hasSoftener: boolean;
  tankCapacityGallons: number;
  failProb: number;
  sedimentRate: number;
  monthsToFlush: number | null;
  monthsToLockout: number | null;
  flushStatus: 'optimal' | 'schedule' | 'due' | 'lockout';
  serviceHistory?: ServiceEvent[];
  autoExpand?: boolean;
  recommendation?: { action: 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS' | 'URGENT' };
  isLeaking?: boolean;
  visualRust?: boolean;
  // HYBRID heat pump support
  fuelType?: FuelType;
  airFilterStatus?: AirFilterStatus;
  isCondensateClear?: boolean;
  compressorHealth?: number;
  hasExpansionTank?: boolean;
  hasPRV?: boolean;
}

// Heat Pump Unit SVG Component for HYBRID
function HeatPumpUnit({ 
  compressorHealth = 85,
  airFilterStatus = 'CLEAN',
  isCondensateClear = true
}: { 
  compressorHealth?: number;
  airFilterStatus?: AirFilterStatus;
  isCondensateClear?: boolean;
}) {
  const compressorStatus = compressorHealth >= 80 ? 'good' : compressorHealth >= 50 ? 'warning' : 'critical';
  const filterStatus = airFilterStatus === 'CLEAN' ? 'good' : airFilterStatus === 'DIRTY' ? 'warning' : 'critical';
  const drainStatus = isCondensateClear ? 'good' : 'critical';
  
  return (
    <svg 
      viewBox="0 0 200 80" 
      className="w-full h-auto max-h-[80px]"
      style={{ filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.3))' }}
    >
      <defs>
        {/* Heat pump housing gradient */}
        <linearGradient id="hpHousingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="50%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
        
        {/* Fan gradient */}
        <radialGradient id="fanGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </radialGradient>
      </defs>
      
      {/* Main housing */}
      <rect x="25" y="10" width="150" height="55" rx="6" fill="url(#hpHousingGradient)" stroke="#4b5563" strokeWidth="1.5" />
      
      {/* Vent grilles */}
      <g fill="#6b7280" opacity="0.5">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i} x={40 + i * 20} y="18" width="12" height="2" rx="1" />
        ))}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <rect key={i + 10} x={40 + i * 20} y="24" width="12" height="2" rx="1" />
        ))}
      </g>
      
      {/* Compressor fan area */}
      <circle cx="100" cy="42" r="16" fill="#111827" stroke="#4b5563" strokeWidth="1" />
      <g className={compressorHealth >= 50 ? "animate-spin" : ""} style={{ transformOrigin: '100px 42px', animationDuration: '2s' }}>
        <path d="M100 28 L104 42 L100 56 L96 42 Z" fill="url(#fanGradient)" />
        <path d="M86 42 L100 38 L114 42 L100 46 Z" fill="url(#fanGradient)" />
      </g>
      
      {/* Status LED for compressor */}
      <circle 
        cx="100" 
        cy="42" 
        r="4" 
        fill={compressorStatus === 'good' ? '#22c55e' : compressorStatus === 'warning' ? '#f59e0b' : '#ef4444'}
        className={compressorHealth >= 50 ? "animate-pulse" : ""}
      />
      
      {/* Air filter indicator (right side) */}
      <rect 
        x="145" 
        y="30" 
        width="22" 
        height="25" 
        rx="3" 
        fill={filterStatus === 'good' ? 'rgba(34, 197, 94, 0.2)' : filterStatus === 'warning' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
        stroke={filterStatus === 'good' ? '#22c55e' : filterStatus === 'warning' ? '#f59e0b' : '#ef4444'}
        strokeWidth="1.5"
      />
      <text x="156" y="47" textAnchor="middle" fill="#9ca3af" fontSize="6" fontWeight="500">
        FILTER
      </text>
      
      {/* Condensate drain (bottom left) */}
      <path 
        d="M35 55 L35 70 L45 70" 
        fill="none" 
        stroke={drainStatus === 'good' ? '#22c55e' : '#ef4444'} 
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {!isCondensateClear && (
        <circle cx="40" cy="62" r="4" fill="#ef4444" className="animate-pulse" />
      )}
      
      {/* Label */}
      <text x="100" y="72" textAnchor="middle" fill="#6b7280" fontSize="7" fontWeight="600" letterSpacing="0.5">
        HEAT PUMP UNIT
      </text>
    </svg>
  );
}

// Enhanced Water Heater SVG Diagram Component
function WaterHeaterDiagram({ 
  anodePercent, 
  sedimentPercent, 
  anodeStatus, 
  sedimentStatus,
  sedimentLbs,
  isBreach = false,
  isHybrid = false
}: { 
  anodePercent: number; 
  sedimentPercent: number;
  anodeStatus: 'good' | 'warning' | 'critical';
  sedimentStatus: 'good' | 'warning' | 'critical';
  sedimentLbs: number;
  isBreach?: boolean;
  isHybrid?: boolean;
}) {
  // SVG dimensions
  const width = 200;
  const height = 300;
  const tankWidth = 100;
  const tankHeight = 200;
  const tankX = (width - tankWidth) / 2;
  const tankY = 35;
  
  // Calculated values
  const sedimentHeight = Math.max(8, (sedimentPercent / 100) * (tankHeight * 0.5));
  const anodeFullHeight = tankHeight * 0.7;
  const anodeDepletedHeight = (anodePercent / 100) * anodeFullHeight;
  const anodeHealthyHeight = anodeFullHeight - anodeDepletedHeight;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto max-h-[280px]"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Tank body gradient - metallic cylinder look */}
        <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="15%" stopColor="#3d4a5c" />
          <stop offset="35%" stopColor="#5a6b7d" />
          <stop offset="50%" stopColor="#718096" />
          <stop offset="65%" stopColor="#5a6b7d" />
          <stop offset="85%" stopColor="#3d4a5c" />
          <stop offset="100%" stopColor="#2d3748" />
        </linearGradient>
        
        {/* Outer jacket gradient */}
        <linearGradient id="jacketGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a202c" />
          <stop offset="50%" stopColor="#2d3748" />
          <stop offset="100%" stopColor="#1a202c" />
        </linearGradient>
        
        {/* Tank top dome */}
        <radialGradient id="domeGradient" cx="50%" cy="80%" r="100%">
          <stop offset="0%" stopColor="#718096" />
          <stop offset="60%" stopColor="#4a5568" />
          <stop offset="100%" stopColor="#2d3748" />
        </radialGradient>
        
        {/* Water gradient */}
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.25)" />
        </linearGradient>
        
        {/* Sediment gradient - more prominent */}
        <linearGradient id="sedimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        
        {/* Anode healthy gradient */}
        <linearGradient id="anodeHealthyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        
        {/* Anode depleted gradient - red highlight */}
        <linearGradient id="anodeDepletedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        
        {/* Copper pipe gradient */}
        <linearGradient id="copperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        
        {/* Brass gradient for valve */}
        <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        
        {/* Heat element glow */}
        <filter id="heatGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip path for tank interior */}
        <clipPath id="tankInterior">
          <rect 
            x={tankX + 4} 
            y={tankY + 4} 
            width={tankWidth - 8} 
            height={tankHeight - 8} 
            rx="4"
          />
        </clipPath>
      </defs>

      {/* Shadow under tank */}
      <ellipse 
        cx={width / 2} 
        cy={tankY + tankHeight + 22} 
        rx="55" 
        ry="8" 
        fill="rgba(0,0,0,0.4)"
      />

      {/* Tank Base/Stand - Enhanced legs */}
      <rect 
        x={tankX + 5} 
        y={tankY + tankHeight} 
        width={tankWidth - 10} 
        height="12" 
        fill="#1f2937"
        rx="2"
      />
      {/* Left leg */}
      <rect 
        x={tankX + 12} 
        y={tankY + tankHeight + 12} 
        width="14" 
        height="10" 
        fill="#111827"
        rx="2"
      />
      <rect 
        x={tankX + 14} 
        y={tankY + tankHeight + 14} 
        width="10" 
        height="6" 
        fill="#1f2937"
        rx="1"
      />
      {/* Right leg */}
      <rect 
        x={tankX + tankWidth - 26} 
        y={tankY + tankHeight + 12} 
        width="14" 
        height="10" 
        fill="#111827"
        rx="2"
      />
      <rect 
        x={tankX + tankWidth - 24} 
        y={tankY + tankHeight + 14} 
        width="10" 
        height="6" 
        fill="#1f2937"
        rx="1"
      />

      {/* Outer Insulation Jacket */}
      <rect 
        x={tankX - 4} 
        y={tankY - 2} 
        width={tankWidth + 8} 
        height={tankHeight + 6} 
        fill="url(#jacketGradient)"
        rx="6"
        stroke="#111827"
        strokeWidth="1"
      />

      {/* Tank Top Dome */}
      <ellipse 
        cx={tankX + tankWidth / 2} 
        cy={tankY} 
        rx={tankWidth / 2 + 4} 
        ry="18" 
        fill="url(#domeGradient)"
        stroke="#1f2937"
        strokeWidth="2"
      />

      {/* Main Tank Body - Cylinder */}
      <rect 
        x={tankX} 
        y={tankY} 
        width={tankWidth} 
        height={tankHeight} 
        fill="url(#tankGradient)"
        stroke="#1f2937"
        strokeWidth="2"
      />
      
      {/* Tank highlight edge for 3D effect */}
      <rect 
        x={tankX + 3} 
        y={tankY + 5} 
        width="4" 
        height={tankHeight - 10} 
        fill="rgba(255,255,255,0.1)"
        rx="2"
      />
      
      {/* Seam lines for realism */}
      <line 
        x1={tankX} 
        y1={tankY + 40} 
        x2={tankX + tankWidth} 
        y2={tankY + 40} 
        stroke="rgba(0,0,0,0.3)" 
        strokeWidth="1"
      />
      <line 
        x1={tankX} 
        y1={tankY + tankHeight - 40} 
        x2={tankX + tankWidth} 
        y2={tankY + tankHeight - 40} 
        stroke="rgba(0,0,0,0.3)" 
        strokeWidth="1"
      />
      
      {/* Rivets on seams */}
      {[tankX + 15, tankX + 35, tankX + 55, tankX + 75, tankX + 90].map((x, i) => (
        <g key={`rivet-${i}`}>
          <circle cx={x} cy={tankY + 40} r="2.5" fill="#3d4a5c" />
          <circle cx={x} cy={tankY + 40} r="1" fill="#718096" />
          <circle cx={x} cy={tankY + tankHeight - 40} r="2.5" fill="#3d4a5c" />
          <circle cx={x} cy={tankY + tankHeight - 40} r="1" fill="#718096" />
        </g>
      ))}

      {/* Top connection nipples */}
      <g>
        {/* Left nipple (cold in) */}
        <rect x={tankX + 18} y={tankY - 20} width="14" height="12" rx="2" fill="url(#copperGradient)" />
        <ellipse cx={tankX + 25} cy={tankY - 20} rx="7" ry="3" fill="#d97706" />
        {/* Right nipple (hot out) */}
        <rect x={tankX + tankWidth - 32} y={tankY - 20} width="14" height="12" rx="2" fill="url(#copperGradient)" />
        <ellipse cx={tankX + tankWidth - 25} cy={tankY - 20} rx="7" ry="3" fill="#d97706" />
      </g>

      {/* Tank Interior (clipped) */}
      <g clipPath="url(#tankInterior)">
        {/* Water fill */}
        <rect 
          x={tankX + 4} 
          y={tankY + 4} 
          width={tankWidth - 8} 
          height={tankHeight - sedimentHeight - 8} 
          fill="url(#waterGradient)"
          className="animate-water-shimmer"
        />

        {/* Sediment Layer - Prominent */}
        <g className="animate-sediment-settle">
          <rect 
            x={tankX + 4} 
            y={tankY + tankHeight - sedimentHeight - 4} 
            width={tankWidth - 8} 
            height={sedimentHeight} 
            fill="url(#sedimentGradient)"
          />
          {/* Sediment texture particles */}
          {sedimentPercent > 10 && (
            <>
              <circle cx={tankX + 20} cy={tankY + tankHeight - sedimentHeight / 2 - 4} r="3" fill="#78350f" opacity="0.7" />
              <circle cx={tankX + 35} cy={tankY + tankHeight - sedimentHeight / 3 - 4} r="2" fill="#78350f" opacity="0.6" />
              <circle cx={tankX + 50} cy={tankY + tankHeight - sedimentHeight / 2 - 4} r="2.5" fill="#78350f" opacity="0.7" />
              <circle cx={tankX + 65} cy={tankY + tankHeight - sedimentHeight / 4 - 4} r="2" fill="#78350f" opacity="0.6" />
              <circle cx={tankX + 80} cy={tankY + tankHeight - sedimentHeight / 2 - 4} r="2.5" fill="#78350f" opacity="0.7" />
            </>
          )}
          {/* Sediment top edge highlight */}
          <line 
            x1={tankX + 4} 
            y1={tankY + tankHeight - sedimentHeight - 4} 
            x2={tankX + tankWidth - 4} 
            y2={tankY + tankHeight - sedimentHeight - 4} 
            stroke="#b45309" 
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.6"
          />
        </g>

        {/* Dip Tube (cold water inlet) */}
        <rect 
          x={tankX + 20} 
          y={tankY + 10} 
          width="6" 
          height={tankHeight * 0.75}
          fill="#4a5568"
          opacity="0.6"
        />
        <rect 
          x={tankX + 21} 
          y={tankY + 10} 
          width="2" 
          height={tankHeight * 0.75}
          fill="#718096"
          opacity="0.4"
        />

        {/* Heating Elements - show for ELECTRIC and HYBRID */}
        {!isHybrid ? (
          <g filter="url(#heatGlow)" className="animate-heat-glow">
            {/* Upper element */}
            <path 
              d={`M ${tankX + 12} ${tankY + tankHeight * 0.35} 
                  L ${tankX + 22} ${tankY + tankHeight * 0.32} 
                  L ${tankX + 32} ${tankY + tankHeight * 0.38} 
                  L ${tankX + 42} ${tankY + tankHeight * 0.32} 
                  L ${tankX + 52} ${tankY + tankHeight * 0.38} 
                  L ${tankX + 62} ${tankY + tankHeight * 0.32} 
                  L ${tankX + 72} ${tankY + tankHeight * 0.38} 
                  L ${tankX + 82} ${tankY + tankHeight * 0.32} 
                  L ${tankX + tankWidth - 12} ${tankY + tankHeight * 0.35}`}
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            {/* Lower element */}
            <path 
              d={`M ${tankX + 12} ${tankY + tankHeight * 0.65} 
                  L ${tankX + 22} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 32} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 42} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 52} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 62} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 72} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 82} ${tankY + tankHeight * 0.62} 
                  L ${tankX + tankWidth - 12} ${tankY + tankHeight * 0.65}`}
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
          </g>
        ) : (
          /* HYBRID: Show single backup element with blue/cool coloring */
          <g filter="url(#heatGlow)" opacity="0.5">
            <path 
              d={`M ${tankX + 12} ${tankY + tankHeight * 0.65} 
                  L ${tankX + 22} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 32} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 42} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 52} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 62} ${tankY + tankHeight * 0.62} 
                  L ${tankX + 72} ${tankY + tankHeight * 0.68} 
                  L ${tankX + 82} ${tankY + tankHeight * 0.62} 
                  L ${tankX + tankWidth - 12} ${tankY + tankHeight * 0.65}`}
              stroke="#60a5fa"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </g>
        )}

        {/* Anode Rod with Red Depletion */}
        <g>
          {/* Anode mounting cap */}
          <rect 
            x={tankX + tankWidth / 2 - 7} 
            y={tankY + 8} 
            width="14" 
            height="8"
            fill="#6b7280"
            rx="1"
          />
          
          {/* Depleted portion (top) - RED */}
          {anodePercent > 0 && (
            <rect 
              x={tankX + tankWidth / 2 - 5} 
              y={tankY + 18} 
              width="10" 
              height={anodeDepletedHeight}
              fill="url(#anodeDepletedGradient)"
              rx="2"
              className="animate-anode-corrode"
            />
          )}
          
          {/* Healthy portion (bottom) - Silver */}
          {anodeHealthyHeight > 0 && (
            <rect 
              x={tankX + tankWidth / 2 - 5} 
              y={tankY + 18 + anodeDepletedHeight} 
              width="10" 
              height={anodeHealthyHeight}
              fill="url(#anodeHealthyGradient)"
              rx="2"
            />
          )}
          
          {/* Corrosion pitting on depleted section */}
          {anodePercent > 30 && (
            <>
              <circle cx={tankX + tankWidth / 2 - 2} cy={tankY + 28} r="1.5" fill="#991b1b" opacity="0.7" />
              <circle cx={tankX + tankWidth / 2 + 2} cy={tankY + 38} r="1" fill="#991b1b" opacity="0.6" />
              <circle cx={tankX + tankWidth / 2} cy={tankY + 50} r="1.5" fill="#991b1b" opacity="0.7" />
            </>
          )}
        </g>

        {/* Bubbles */}
        <circle cx={tankX + 25} cy={tankY + tankHeight * 0.5} r="2" fill="rgba(255,255,255,0.25)" className="animate-bubble-rise" style={{ animationDelay: '0s' }} />
        <circle cx={tankX + 70} cy={tankY + tankHeight * 0.55} r="1.5" fill="rgba(255,255,255,0.2)" className="animate-bubble-rise" style={{ animationDelay: '0.7s' }} />
        <circle cx={tankX + 55} cy={tankY + tankHeight * 0.48} r="1" fill="rgba(255,255,255,0.15)" className="animate-bubble-rise" style={{ animationDelay: '1.2s' }} />
      </g>

      {/* Thermostat Control Box */}
      <g>
        <rect 
          x={tankX + tankWidth + 2} 
          y={tankY + tankHeight * 0.55} 
          width="18" 
          height="35" 
          rx="2" 
          fill="#1f2937"
          stroke="#374151"
          strokeWidth="1"
        />
        {/* Dial */}
        <circle 
          cx={tankX + tankWidth + 11} 
          cy={tankY + tankHeight * 0.55 + 12} 
          r="5" 
          fill="#111827"
          stroke="#4b5563"
          strokeWidth="0.5"
        />
        <line 
          x1={tankX + tankWidth + 11} 
          y1={tankY + tankHeight * 0.55 + 9} 
          x2={tankX + tankWidth + 11} 
          y2={tankY + tankHeight * 0.55 + 12} 
          stroke="#ef4444" 
          strokeWidth="1"
        />
        {/* Status LED */}
        <circle 
          cx={tankX + tankWidth + 11} 
          cy={tankY + tankHeight * 0.55 + 26} 
          r="3" 
          fill="#22c55e"
          className="animate-pulse"
        />
      </g>

      {/* Drain Valve at Bottom */}
      <g>
        <rect 
          x={tankX + tankWidth / 2 - 6} 
          y={tankY + tankHeight + 2} 
          width="12" 
          height="8" 
          rx="1" 
          fill="url(#brassGradient)"
        />
        <circle 
          cx={tankX + tankWidth / 2} 
          cy={tankY + tankHeight + 10} 
          r="4" 
          fill="#92400e"
        />
        <rect 
          x={tankX + tankWidth / 2 - 1} 
          y={tankY + tankHeight + 7} 
          width="2" 
          height="4" 
          fill="#fbbf24"
        />
      </g>

      {/* T&P Relief Valve on side */}
      <g>
        <rect 
          x={tankX - 8} 
          y={tankY + 50} 
          width="10" 
          height="6" 
          rx="1" 
          fill="url(#brassGradient)"
        />
        <rect 
          x={tankX - 10} 
          y={tankY + 56} 
          width="6" 
          height="20" 
          rx="1" 
          fill="url(#copperGradient)"
        />
      </g>

      {/* ANODE Label with line */}
      <g>
        <line 
          x1={tankX + tankWidth / 2 + 8} 
          y1={tankY + 18 + anodeFullHeight / 2} 
          x2={tankX + tankWidth + 28} 
          y2={tankY + 18 + anodeFullHeight / 2}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={tankX + tankWidth + 28} 
          cy={tankY + 18 + anodeFullHeight / 2} 
          r="3" 
          fill={anodeStatus === 'critical' ? '#ef4444' : anodeStatus === 'warning' ? '#f59e0b' : '#22c55e'}
        />
        <text 
          x={tankX + tankWidth + 35} 
          y={tankY + 18 + anodeFullHeight / 2 - 6} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="start"
        >
          ANODE
        </text>
        <text 
          x={tankX + tankWidth + 35} 
          y={tankY + 18 + anodeFullHeight / 2 + 6} 
          fill={anodeStatus === 'critical' ? '#ef4444' : anodeStatus === 'warning' ? '#f59e0b' : '#22c55e'} 
          fontSize="10" 
          fontWeight="bold"
          textAnchor="start"
          className="font-data"
        >
          {(100 - anodePercent).toFixed(0)}%
        </text>
      </g>

      {/* SEDIMENT Label with line */}
      <g>
        <line 
          x1={tankX - 8} 
          y1={tankY + tankHeight - sedimentHeight / 2 - 4} 
          x2={tankX - 25} 
          y2={tankY + tankHeight - sedimentHeight / 2 - 4}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={tankX - 25} 
          cy={tankY + tankHeight - sedimentHeight / 2 - 4} 
          r="3" 
          fill={sedimentStatus === 'critical' ? '#ef4444' : sedimentStatus === 'warning' ? '#f59e0b' : '#22c55e'}
        />
        <text 
          x={tankX - 30} 
          y={tankY + tankHeight - sedimentHeight / 2 - 10} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="end"
        >
          SEDIMENT
        </text>
        <text 
          x={tankX - 30} 
          y={tankY + tankHeight - sedimentHeight / 2 + 2} 
          fill={sedimentStatus === 'critical' ? '#ef4444' : sedimentStatus === 'warning' ? '#f59e0b' : '#22c55e'} 
          fontSize="10" 
          fontWeight="bold"
          textAnchor="end"
          className="font-data"
        >
          {sedimentLbs.toFixed(1)} lbs
        </text>
      </g>

      {/* BREACH VISUALIZATION - Subtle red glow and indicator */}
      {isBreach && (
        <>
          {/* Red glow overlay on tank */}
          <rect 
            x={tankX - 4} 
            y={tankY - 2} 
            width={tankWidth + 8} 
            height={tankHeight + 6} 
            rx="6"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            opacity="0.6"
            className="animate-pulse"
          />
          
          {/* Small water drip at bottom */}
          <g opacity="0.7">
            <path
              d={`M ${tankX + tankWidth / 2 + 15} ${tankY + tankHeight + 12} 
                  Q ${tankX + tankWidth / 2 + 18} ${tankY + tankHeight + 18} ${tankX + tankWidth / 2 + 15} ${tankY + tankHeight + 22}
                  Q ${tankX + tankWidth / 2 + 12} ${tankY + tankHeight + 18} ${tankX + tankWidth / 2 + 15} ${tankY + tankHeight + 12}`}
              fill="#3b82f6"
            />
          </g>
        </>
      )}

    </svg>
  );
}

export function ServiceHistory({ 
  calendarAge, 
  sedimentLbs, 
  shieldLife, 
  hasSoftener,
  tankCapacityGallons,
  failProb,
  sedimentRate,
  monthsToFlush,
  monthsToLockout,
  flushStatus,
  serviceHistory = [],
  autoExpand = false,
  recommendation,
  isLeaking = false,
  visualRust = false,
  // HYBRID heat pump props
  fuelType = 'GAS',
  airFilterStatus = 'CLEAN',
  isCondensateClear = true,
  compressorHealth = 85,
  hasExpansionTank,
  hasPRV
}: ServiceHistoryProps) {
  // Breach detection
  const isBreach = isLeaking || visualRust;
  const isHybrid = fuelType === 'HYBRID';
  // Check if replacement is recommended (no maintenance should be shown)
  const isReplacementRequired = recommendation?.action === 'REPLACE';
  // Default to closed - user can expand to see details
  const [isOpen, setIsOpen] = useState(false);

  // Calculate anode depletion percentage (0-100, where 100 = fully depleted)
  const maxAnodeLife = hasSoftener ? 2.5 : 6; // Years
  const anodeUsedYears = Math.max(0, maxAnodeLife - shieldLife);
  const anodeDepletionPercent = Math.min(100, (anodeUsedYears / maxAnodeLife) * 100);
  const anodeDepleted = shieldLife < 1;

  // Calculate sediment as volume percentage based on tank capacity
  const maxSedimentForTank = (tankCapacityGallons / 50) * 20;
  const sedimentPercent = Math.min(100, (sedimentLbs / maxSedimentForTank) * 100);
  const sedimentHigh = sedimentLbs > (tankCapacityGallons / 50) * 5;

  // Determine status colors
  const anodeStatus = anodeDepleted ? 'critical' : anodeDepletionPercent > 70 ? 'warning' : 'good';
  const sedimentStatus = sedimentPercent > 50 ? 'critical' : sedimentHigh ? 'warning' : 'good';

  // SAFE FLUSH LOGIC GATES
  const isFragile = failProb > 60 || calendarAge > 12;
  const isLockedOut = sedimentLbs > 15;
  const isServiceable = sedimentLbs >= 5 && sedimentLbs <= 15;
  const needsFlush = !isFragile && !isLockedOut && isServiceable;
  
  const needsAnode = shieldLife < 1 && calendarAge < 8;
  
  // HYBRID-specific service needs
  const needsFilterClean = isHybrid && airFilterStatus !== 'CLEAN';
  const needsDrainClear = isHybrid && !isCondensateClear;

  return (
    <div className="command-card mx-4">
      {/* Header - Always visible */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
        <div className={cn(
          "command-icon-sm",
          isBreach ? "bg-red-500/15 border border-red-500/30" : "command-icon-warning"
        )}>
          <Wrench className={cn("w-4 h-4", isBreach ? "text-red-400" : "text-amber-400")} />
        </div>
        <span className="font-semibold text-sm">Tank Health</span>
        {isHybrid && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            HYBRID
          </span>
        )}
        {isBreach && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse ml-auto">
            BREACH
          </span>
        )}
        {!isBreach && !isReplacementRequired && (needsFlush || needsAnode || needsFilterClean || needsDrainClear) && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">
            SERVICE DUE
          </span>
        )}
      </div>

      {/* Always Visible Content: Tank Diagram + Stats */}
      <div className="px-5 py-4">
        <div className="flex flex-col items-center">
          {/* Heat Pump Unit - Rendered above tank for HYBRID */}
          {isHybrid && (
            <div className="w-full max-w-[200px] mb-1">
              <HeatPumpUnit 
                compressorHealth={compressorHealth}
                airFilterStatus={airFilterStatus}
                isCondensateClear={isCondensateClear}
              />
            </div>
          )}
          
          <WaterHeaterDiagram 
            anodePercent={anodeDepletionPercent}
            sedimentPercent={sedimentPercent}
            anodeStatus={anodeStatus}
            sedimentStatus={sedimentStatus}
            sedimentLbs={sedimentLbs}
            isBreach={isBreach}
            isHybrid={isHybrid}
          />
          
          {/* Stats Row - Always visible */}
          <div className="flex justify-center gap-6 mt-4 w-full">
            <div className="text-center data-display px-4 py-2 flex-1">
              <div className={cn(
                "text-lg font-bold font-data",
                anodeStatus === 'critical' ? "text-red-400" : 
                anodeStatus === 'warning' ? "text-amber-400" : "text-emerald-400"
              )}>
                {shieldLife > 0 ? `${shieldLife.toFixed(1)} yr` : 'DEPLETED'}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Anode Life</div>
            </div>
            <div className="text-center data-display px-4 py-2 flex-1">
              <div className={cn(
                "text-lg font-bold font-data",
                sedimentStatus === 'critical' ? "text-red-400" : 
                sedimentStatus === 'warning' ? "text-amber-400" : "text-emerald-400"
              )}>
                {sedimentLbs.toFixed(1)} lbs
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Sediment</div>
            </div>
          </div>
          
          {/* HYBRID Status Row */}
          {isHybrid && (
            <div className="grid grid-cols-3 gap-2 mt-3 w-full">
              <div className={cn(
                "p-2 rounded-lg border text-center",
                compressorHealth >= 80 ? "bg-emerald-500/10 border-emerald-500/30" :
                compressorHealth >= 50 ? "bg-amber-500/10 border-amber-500/30" :
                "bg-red-500/10 border-red-500/30"
              )}>
                <Cpu className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Compressor</p>
                <p className={cn(
                  "text-xs font-semibold",
                  compressorHealth >= 80 ? "text-emerald-400" :
                  compressorHealth >= 50 ? "text-amber-400" : "text-red-400"
                )}>{compressorHealth}%</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg border text-center",
                airFilterStatus === 'CLEAN' ? "bg-emerald-500/10 border-emerald-500/30" :
                airFilterStatus === 'DIRTY' ? "bg-amber-500/10 border-amber-500/30" :
                "bg-red-500/10 border-red-500/30"
              )}>
                <Wind className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Air Filter</p>
                <p className={cn(
                  "text-xs font-semibold capitalize",
                  airFilterStatus === 'CLEAN' ? "text-emerald-400" :
                  airFilterStatus === 'DIRTY' ? "text-amber-400" : "text-red-400"
                )}>{airFilterStatus.toLowerCase()}</p>
              </div>
              <div className={cn(
                "p-2 rounded-lg border text-center",
                isCondensateClear ? "bg-emerald-500/10 border-emerald-500/30" :
                "bg-red-500/10 border-red-500/30"
              )}>
                <Droplets className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Drain</p>
                <p className={cn(
                  "text-xs font-semibold",
                  isCondensateClear ? "text-emerald-400" : "text-red-400"
                )}>{isCondensateClear ? 'Clear' : 'Blocked'}</p>
              </div>
            </div>
          )}

          {/* Service Recommendations - Always visible when applicable */}
          {!isReplacementRequired && (needsFlush || needsAnode || needsFilterClean || needsDrainClear) && (
            <div className="w-full mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Recommended Service</span>
              </div>
              <div className="space-y-1.5">
                {needsFlush && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Droplets className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tank flush to remove {sedimentLbs.toFixed(1)} lbs of sediment</span>
                  </div>
                )}
                {needsAnode && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span>Anode rod replacement (tank still viable)</span>
                  </div>
                )}
                {needsFilterClean && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Wind className="w-3.5 h-3.5 text-amber-400" />
                    <span>Clean or replace air filter ({airFilterStatus.toLowerCase()})</span>
                  </div>
                )}
                {needsDrainClear && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Droplets className="w-3.5 h-3.5 text-red-400" />
                    <span>Clear condensate drain (blocked)</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible: Service History & Sediment Rate */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between px-4 py-3 border-t border-border/30 hover:bg-secondary/20 transition-colors rounded-none"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Service History & Details</span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
            {/* Sediment Projection Card */}
            <div className="data-display-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="command-icon-sm">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-xs font-semibold">
                  {isReplacementRequired ? 'Current Sediment' : 'Sediment Forecast'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1.5">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-mono font-medium text-foreground">{sedimentLbs.toFixed(1)} lbs</span>
                </div>
                {!isReplacementRequired && (
                  <>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-mono text-foreground">+{sedimentRate.toFixed(2)} lbs/yr</span>
                    </div>
                    {flushStatus === 'optimal' && monthsToFlush !== null && (
                      <div className="flex justify-between pt-2 border-t border-border/30 mt-2">
                        <span>Schedule flush in:</span>
                        <span className={cn(
                          "font-mono font-medium",
                          Math.min(monthsToFlush, 36) <= 6 ? "text-amber-400" : "text-emerald-400"
                        )}>
                          {(() => {
                            const capped = Math.min(monthsToFlush, 36);
                            return capped >= 12 
                              ? `${(capped / 12).toFixed(1)} yrs` 
                              : `${capped} mo`;
                          })()}
                        </span>
                      </div>
                    )}
                    {flushStatus === 'schedule' && monthsToFlush !== null && (
                      <div className="flex justify-between pt-2 border-t border-border/30 mt-2">
                        <span className="text-amber-400">⚠ Flush recommended in:</span>
                        <span className="font-mono font-medium text-amber-400">{monthsToFlush} mo</span>
                      </div>
                    )}
                    {flushStatus === 'due' && (
                      <div className="flex justify-between pt-2 border-t border-border/30 mt-2">
                        <span className="text-amber-400 font-medium">🔧 Flush now</span>
                        <span className="font-mono text-amber-400">5-15 lb zone</span>
                      </div>
                    )}
                    {flushStatus === 'lockout' && (
                      <div className="flex justify-between pt-2 border-t border-border/30 mt-2">
                        <span className="text-red-400 font-medium">🚫 Flush unsafe</span>
                        <span className="font-mono text-red-400">&gt;15 lbs hardened</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Service History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service History</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add
                </Button>
              </div>
              
              {serviceHistory.length > 0 ? (
                <div className="space-y-2">
                  {serviceHistory.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl data-display">
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center border",
                        event.type === 'anode_replacement' ? 'bg-blue-500/15 border-blue-500/25' : 
                        event.type === 'flush' ? 'bg-amber-500/15 border-amber-500/25' : 'bg-emerald-500/15 border-emerald-500/25'
                      )}>
                        {event.type === 'anode_replacement' ? (
                          <Shield className="w-4 h-4 text-blue-400" />
                        ) : event.type === 'flush' ? (
                          <Droplets className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Wrench className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {event.type === 'anode_replacement' ? 'Anode Replaced' :
                           event.type === 'flush' ? 'Tank Flushed' : 'Inspection'}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 data-display rounded-xl">
                  <Calendar className="w-7 h-7 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground font-medium">No service records</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Add maintenance history for better tracking</p>
                </div>
              )}
            </div>

            {/* Sediment Disclaimer */}
            <p className="text-[10px] text-muted-foreground text-center italic">
              Estimates assume ~50% sediment removal per flush. Neglected tanks may retain more.
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
