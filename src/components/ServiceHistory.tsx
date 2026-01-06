import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Droplets, Shield, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ServiceEvent {
  id: string;
  type: 'anode_replacement' | 'flush' | 'inspection';
  date: string;
  notes?: string;
}

interface ServiceHistoryProps {
  calendarAge: number;
  sedimentLbs: number;
  shieldLife: number;
  hasSoftener: boolean;
  serviceHistory?: ServiceEvent[];
}

// Professional Water Heater SVG Diagram Component
function WaterHeaterDiagram({ 
  anodePercent, 
  sedimentPercent, 
  anodeStatus, 
  sedimentStatus 
}: { 
  anodePercent: number; 
  sedimentPercent: number;
  anodeStatus: 'good' | 'warning' | 'critical';
  sedimentStatus: 'good' | 'warning' | 'critical';
}) {
  // SVG dimensions
  const width = 200;
  const height = 280;
  const tankWidth = 120;
  const tankHeight = 200;
  const tankX = (width - tankWidth) / 2;
  const tankY = 40;
  
  // Calculated values
  const sedimentHeight = (sedimentPercent / 100) * (tankHeight * 0.6);
  const anodeLength = ((100 - anodePercent) / 100) * (tankHeight * 0.7);
  const waterLevel = tankHeight - 10;
  
  const statusColors = {
    good: { fill: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' },
    warning: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' },
    critical: { fill: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }
  };

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto max-h-[280px]"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Tank body gradient - metallic look */}
        <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="15%" stopColor="#4b5563" />
          <stop offset="50%" stopColor="#6b7280" />
          <stop offset="85%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        
        {/* Tank dome gradient */}
        <radialGradient id="domeGradient" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </radialGradient>
        
        {/* Water gradient */}
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.15)" />
          <stop offset="50%" stopColor="rgba(59, 130, 246, 0.25)" />
          <stop offset="100%" stopColor="rgba(59, 130, 246, 0.35)" />
        </linearGradient>
        
        {/* Sediment gradient */}
        <linearGradient id="sedimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="40%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
        
        {/* Anode rod gradient - metallic */}
        <linearGradient id="anodeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="50%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
        
        {/* Corroded anode gradient */}
        <linearGradient id="corrodedAnodeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="50%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        
        {/* Heat element glow */}
        <filter id="heatGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Inner shadow for tank */}
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="0" dy="2" />
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
          <feFlood floodColor="#000000" floodOpacity="0.4" />
          <feComposite in2="shadowDiff" operator="in" />
          <feComposite in2="SourceGraphic" operator="over" />
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

      {/* Tank Base/Stand */}
      <rect 
        x={tankX + 10} 
        y={tankY + tankHeight} 
        width={tankWidth - 20} 
        height="12" 
        fill="#1f2937"
        rx="2"
      />
      <rect 
        x={tankX + 20} 
        y={tankY + tankHeight + 12} 
        width="20" 
        height="8" 
        fill="#111827"
        rx="1"
      />
      <rect 
        x={tankX + tankWidth - 40} 
        y={tankY + tankHeight + 12} 
        width="20" 
        height="8" 
        fill="#111827"
        rx="1"
      />

      {/* Main Tank Body */}
      <rect 
        x={tankX} 
        y={tankY} 
        width={tankWidth} 
        height={tankHeight} 
        fill="url(#tankGradient)"
        rx="8"
        stroke="#1f2937"
        strokeWidth="2"
      />
      
      {/* Tank highlight edge */}
      <rect 
        x={tankX + 2} 
        y={tankY + 2} 
        width="4" 
        height={tankHeight - 4} 
        fill="rgba(255,255,255,0.1)"
        rx="2"
      />

      {/* Tank Interior (clipped) */}
      <g clipPath="url(#tankInterior)">
        {/* Water fill */}
        <rect 
          x={tankX + 4} 
          y={tankY + 4} 
          width={tankWidth - 8} 
          height={waterLevel} 
          fill="url(#waterGradient)"
          className="animate-water-shimmer"
        />
        
        {/* Water surface shimmer */}
        <ellipse 
          cx={tankX + tankWidth / 2} 
          cy={tankY + 15} 
          rx={tankWidth / 2 - 10} 
          ry="4" 
          fill="rgba(147, 197, 253, 0.2)"
          className="animate-water-shimmer"
        />

        {/* Sediment Layer */}
        <g className="animate-sediment-settle">
          <rect 
            x={tankX + 4} 
            y={tankY + tankHeight - sedimentHeight - 4} 
            width={tankWidth - 8} 
            height={sedimentHeight} 
            fill="url(#sedimentGradient)"
          />
          {/* Sediment texture lines */}
          {Array.from({ length: Math.ceil(sedimentPercent / 15) }).map((_, i) => (
            <line 
              key={i}
              x1={tankX + 10} 
              y1={tankY + tankHeight - sedimentHeight * (i + 1) / Math.ceil(sedimentPercent / 15) - 4}
              x2={tankX + tankWidth - 10}
              y2={tankY + tankHeight - sedimentHeight * (i + 1) / Math.ceil(sedimentPercent / 15) - 4}
              stroke="rgba(120, 53, 15, 0.5)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          ))}
          {/* Sediment particles */}
          {sedimentPercent > 20 && (
            <>
              <circle cx={tankX + 30} cy={tankY + tankHeight - sedimentHeight / 2} r="3" fill="#451a03" opacity="0.6" />
              <circle cx={tankX + 50} cy={tankY + tankHeight - sedimentHeight / 3} r="2" fill="#451a03" opacity="0.5" />
              <circle cx={tankX + 80} cy={tankY + tankHeight - sedimentHeight / 2.5} r="2.5" fill="#451a03" opacity="0.6" />
              <circle cx={tankX + 95} cy={tankY + tankHeight - sedimentHeight / 4} r="2" fill="#451a03" opacity="0.5" />
            </>
          )}
        </g>

        {/* Heating Elements */}
        <g filter="url(#heatGlow)" className="animate-heat-glow">
          {/* Upper element */}
          <line 
            x1={tankX + 15} 
            y1={tankY + tankHeight * 0.35} 
            x2={tankX + tankWidth - 15} 
            y2={tankY + tankHeight * 0.35}
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Lower element */}
          <line 
            x1={tankX + 15} 
            y1={tankY + tankHeight * 0.7} 
            x2={tankX + tankWidth - 15} 
            y2={tankY + tankHeight * 0.7}
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>

        {/* Dip Tube (cold water inlet) */}
        <rect 
          x={tankX + 25} 
          y={tankY} 
          width="6" 
          height={tankHeight * 0.8}
          fill="#374151"
          stroke="#1f2937"
          strokeWidth="1"
        />

        {/* Anode Rod */}
        <g>
          {/* Anode rod mounting hex */}
          <polygon 
            points={`${tankX + tankWidth / 2 - 8},${tankY + 2} ${tankX + tankWidth / 2 + 8},${tankY + 2} ${tankX + tankWidth / 2 + 10},${tankY + 10} ${tankX + tankWidth / 2 + 8},${tankY + 18} ${tankX + tankWidth / 2 - 8},${tankY + 18} ${tankX + tankWidth / 2 - 10},${tankY + 10}`}
            fill="#4b5563"
            stroke="#374151"
            strokeWidth="1"
          />
          
          {/* Corroded portion (top) */}
          {anodePercent > 0 && (
            <rect 
              x={tankX + tankWidth / 2 - 4} 
              y={tankY + 18} 
              width="8" 
              height={(tankHeight * 0.7) * (anodePercent / 100)}
              fill="url(#corrodedAnodeGradient)"
              className="animate-anode-corrode"
            />
          )}
          
          {/* Healthy portion (bottom) */}
          <rect 
            x={tankX + tankWidth / 2 - 4} 
            y={tankY + 18 + (tankHeight * 0.7) * (anodePercent / 100)} 
            width="8" 
            height={anodeLength}
            fill="url(#anodeGradient)"
            rx="2"
          />
          
          {/* Anode rod tip */}
          {anodeLength > 10 && (
            <ellipse 
              cx={tankX + tankWidth / 2} 
              cy={tankY + 18 + (tankHeight * 0.7)} 
              rx="4" 
              ry="2" 
              fill="#9ca3af"
            />
          )}
        </g>

        {/* Bubbles (when heating) */}
        <circle cx={tankX + 35} cy={tankY + tankHeight * 0.5} r="2" fill="rgba(255,255,255,0.3)" className="animate-bubble-rise" style={{ animationDelay: '0s' }} />
        <circle cx={tankX + 70} cy={tankY + tankHeight * 0.55} r="1.5" fill="rgba(255,255,255,0.25)" className="animate-bubble-rise" style={{ animationDelay: '0.5s' }} />
        <circle cx={tankX + 90} cy={tankY + tankHeight * 0.45} r="2" fill="rgba(255,255,255,0.3)" className="animate-bubble-rise" style={{ animationDelay: '1s' }} />
      </g>

      {/* Pipe Connections */}
      {/* Cold Water Inlet (left) */}
      <g>
        <rect x={tankX - 20} y={tankY + 15} width="25" height="14" fill="#4b5563" rx="2" />
        <rect x={tankX - 25} y={tankY + 12} width="10" height="20" fill="#374151" rx="1" />
        <text x={tankX - 35} y={tankY + 26} fill="#6b7280" fontSize="8" textAnchor="end">COLD</text>
      </g>
      
      {/* Hot Water Outlet (right) */}
      <g>
        <rect x={tankX + tankWidth - 5} y={tankY + 15} width="25" height="14" fill="#4b5563" rx="2" />
        <rect x={tankX + tankWidth + 15} y={tankY + 12} width="10" height="20" fill="#374151" rx="1" />
        <text x={tankX + tankWidth + 35} y={tankY + 26} fill="#ef4444" fontSize="8" textAnchor="start">HOT</text>
      </g>

      {/* T&P Relief Valve */}
      <g>
        <rect x={tankX + tankWidth - 2} y={tankY + 50} width="18" height="10" fill="#4b5563" rx="2" />
        <rect x={tankX + tankWidth + 14} y={tankY + 48} width="8" height="14" fill="#374151" rx="1" />
        <rect x={tankX + tankWidth + 14} y={tankY + 62} width="4" height="30" fill="#4b5563" rx="1" />
      </g>

      {/* Thermostat/Control Box */}
      <g>
        <rect x={tankX + tankWidth - 5} y={tankY + tankHeight * 0.5} width="20" height="35" fill="#1f2937" rx="3" stroke="#374151" strokeWidth="1" />
        {/* Power indicator */}
        <circle cx={tankX + tankWidth + 5} cy={tankY + tankHeight * 0.5 + 10} r="3" fill="#22c55e" opacity="0.8" />
        {/* Dial */}
        <circle cx={tankX + tankWidth + 5} cy={tankY + tankHeight * 0.5 + 25} r="6" fill="#374151" stroke="#4b5563" strokeWidth="1" />
        <line x1={tankX + tankWidth + 5} y1={tankY + tankHeight * 0.5 + 22} x2={tankX + tankWidth + 5} y2={tankY + tankHeight * 0.5 + 25} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Drain Valve */}
      <g>
        <rect x={tankX + 20} y={tankY + tankHeight - 5} width="12" height="15" fill="#374151" rx="2" />
        <circle cx={tankX + 26} cy={tankY + tankHeight + 8} r="4" fill="#4b5563" stroke="#374151" strokeWidth="1" />
      </g>

      {/* Status Indicators */}
      {/* Anode Status */}
      <g>
        <circle 
          cx={tankX + tankWidth / 2} 
          cy={tankY - 15} 
          r="8" 
          fill={statusColors[anodeStatus].fill}
          style={{ filter: `drop-shadow(0 0 6px ${statusColors[anodeStatus].glow})` }}
        />
        <text 
          x={tankX + tankWidth / 2} 
          y={tankY - 25} 
          fill="#9ca3af" 
          fontSize="8" 
          textAnchor="middle"
        >
          ANODE
        </text>
      </g>

      {/* Sediment Status */}
      <g>
        <circle 
          cx={tankX + tankWidth / 2} 
          cy={tankY + tankHeight + 30} 
          r="8" 
          fill={statusColors[sedimentStatus].fill}
          style={{ filter: `drop-shadow(0 0 6px ${statusColors[sedimentStatus].glow})` }}
        />
        <text 
          x={tankX + tankWidth / 2} 
          y={tankY + tankHeight + 48} 
          fill="#9ca3af" 
          fontSize="8" 
          textAnchor="middle"
        >
          SEDIMENT
        </text>
      </g>
    </svg>
  );
}

export function ServiceHistory({ 
  calendarAge, 
  sedimentLbs, 
  shieldLife, 
  hasSoftener,
  serviceHistory = [] 
}: ServiceHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Calculate anode depletion percentage (0-100, where 100 = fully depleted)
  const maxAnodeLife = hasSoftener ? 2.5 : 6; // Years
  const anodeUsedYears = Math.max(0, maxAnodeLife - shieldLife);
  const anodeDepletionPercent = Math.min(100, (anodeUsedYears / maxAnodeLife) * 100);
  const anodeDepleted = shieldLife < 1;

  // Calculate sediment severity (0-100)
  const maxSediment = 20; // lbs considered "full"
  const sedimentPercent = Math.min(100, (sedimentLbs / maxSediment) * 100);
  const sedimentHigh = sedimentLbs > 5;

  // Determine status colors
  const anodeStatus = anodeDepleted ? 'critical' : anodeDepletionPercent > 70 ? 'warning' : 'good';
  const sedimentStatus = sedimentPercent > 50 ? 'critical' : sedimentHigh ? 'warning' : 'good';

  // Determine next service recommendations
  const needsFlush = sedimentLbs > 5;
  const needsAnode = shieldLife < 1 && calendarAge < 8;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mx-4 overflow-hidden border-border/50 bg-card/50">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Tank Health</span>
            </div>
            <div className="flex items-center gap-2">
              {(needsFlush || needsAnode) && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  SERVICE DUE
                </span>
              )}
              {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
            {/* Professional Water Heater Diagram */}
            <div className="flex flex-col items-center">
              <WaterHeaterDiagram 
                anodePercent={anodeDepletionPercent}
                sedimentPercent={sedimentPercent}
                anodeStatus={anodeStatus}
                sedimentStatus={sedimentStatus}
              />
              
              {/* Stats Row */}
              <div className="flex justify-center gap-8 mt-4 w-full">
                <div className="text-center">
                  <div className={cn(
                    "text-lg font-bold font-data",
                    anodeStatus === 'critical' ? "text-red-400" : 
                    anodeStatus === 'warning' ? "text-amber-400" : "text-green-400"
                  )}>
                    {shieldLife > 0 ? `${shieldLife.toFixed(1)} yr` : 'DEPLETED'}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Anode Life</div>
                </div>
                <div className="text-center">
                  <div className={cn(
                    "text-lg font-bold font-data",
                    sedimentStatus === 'critical' ? "text-red-400" : 
                    sedimentStatus === 'warning' ? "text-amber-400" : "text-green-400"
                  )}>
                    {sedimentLbs.toFixed(1)} lbs
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Sediment</div>
                </div>
              </div>
            </div>

            {/* Service Recommendations */}
            {(needsFlush || needsAnode) && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-400">Recommended Service</span>
                </div>
                <div className="space-y-1.5">
                  {needsFlush && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Droplets className="w-3 h-3" />
                      <span>Tank flush to remove {sedimentLbs.toFixed(1)} lbs of sediment</span>
                    </div>
                  )}
                  {needsAnode && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>Anode rod replacement (tank still viable)</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Service History</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              {serviceHistory.length > 0 ? (
                <div className="space-y-2">
                  {serviceHistory.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        event.type === 'anode_replacement' ? 'bg-blue-500/20' : 
                        event.type === 'flush' ? 'bg-amber-500/20' : 'bg-green-500/20'
                      )}>
                        {event.type === 'anode_replacement' ? (
                          <Shield className="w-4 h-4 text-blue-400" />
                        ) : event.type === 'flush' ? (
                          <Droplets className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Wrench className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">
                          {event.type === 'anode_replacement' ? 'Anode Replaced' :
                           event.type === 'flush' ? 'Tank Flushed' : 'Inspection'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{event.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p>No service records</p>
                  <p className="text-[10px]">Add maintenance history for better tracking</p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}