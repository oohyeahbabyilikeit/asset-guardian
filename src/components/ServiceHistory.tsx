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

// Simplified Water Heater SVG Diagram Component
function WaterHeaterDiagram({ 
  anodePercent, 
  sedimentPercent, 
  anodeStatus, 
  sedimentStatus,
  sedimentLbs
}: { 
  anodePercent: number; 
  sedimentPercent: number;
  anodeStatus: 'good' | 'warning' | 'critical';
  sedimentStatus: 'good' | 'warning' | 'critical';
  sedimentLbs: number;
}) {
  // SVG dimensions
  const width = 180;
  const height = 300;
  const tankWidth = 100;
  const tankHeight = 200;
  const tankX = (width - tankWidth) / 2;
  const tankY = 50;
  
  // Calculated values
  const sedimentHeight = Math.max(8, (sedimentPercent / 100) * (tankHeight * 0.5));
  const anodeFullHeight = tankHeight * 0.7;
  const anodeDepletedHeight = (anodePercent / 100) * anodeFullHeight;
  const anodeHealthyHeight = anodeFullHeight - anodeDepletedHeight;

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-auto max-h-[300px]"
      style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))' }}
    >
      <defs>
        {/* Tank body gradient - metallic cylinder look */}
        <linearGradient id="tankGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2d3748" />
          <stop offset="20%" stopColor="#4a5568" />
          <stop offset="50%" stopColor="#718096" />
          <stop offset="80%" stopColor="#4a5568" />
          <stop offset="100%" stopColor="#2d3748" />
        </linearGradient>
        
        {/* Tank top dome */}
        <radialGradient id="domeGradient" cx="50%" cy="80%" r="100%">
          <stop offset="0%" stopColor="#718096" />
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

      {/* Tank Base/Stand */}
      <rect 
        x={tankX + 5} 
        y={tankY + tankHeight} 
        width={tankWidth - 10} 
        height="10" 
        fill="#1f2937"
        rx="2"
      />
      <rect 
        x={tankX + 15} 
        y={tankY + tankHeight + 10} 
        width="16" 
        height="6" 
        fill="#111827"
        rx="1"
      />
      <rect 
        x={tankX + tankWidth - 31} 
        y={tankY + tankHeight + 10} 
        width="16" 
        height="6" 
        fill="#111827"
        rx="1"
      />

      {/* Tank Top Dome */}
      <ellipse 
        cx={tankX + tankWidth / 2} 
        cy={tankY} 
        rx={tankWidth / 2} 
        ry="15" 
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
        width="3" 
        height={tankHeight - 10} 
        fill="rgba(255,255,255,0.08)"
        rx="1"
      />

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
              <circle cx={tankX + 25} cy={tankY + tankHeight - sedimentHeight / 2 - 4} r="3" fill="#78350f" opacity="0.7" />
              <circle cx={tankX + 45} cy={tankY + tankHeight - sedimentHeight / 3 - 4} r="2" fill="#78350f" opacity="0.6" />
              <circle cx={tankX + 65} cy={tankY + tankHeight - sedimentHeight / 2 - 4} r="2.5" fill="#78350f" opacity="0.7" />
              <circle cx={tankX + 80} cy={tankY + tankHeight - sedimentHeight / 4 - 4} r="2" fill="#78350f" opacity="0.6" />
            </>
          )}
        </g>

        {/* Heating Elements */}
        <g filter="url(#heatGlow)" className="animate-heat-glow">
          <line 
            x1={tankX + 12} 
            y1={tankY + tankHeight * 0.35} 
            x2={tankX + tankWidth - 12} 
            y2={tankY + tankHeight * 0.35}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
          <line 
            x1={tankX + 12} 
            y1={tankY + tankHeight * 0.65} 
            x2={tankX + tankWidth - 12} 
            y2={tankY + tankHeight * 0.65}
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>

        {/* Anode Rod with Red Depletion */}
        <g>
          {/* Depleted portion (top) - RED */}
          {anodePercent > 0 && (
            <rect 
              x={tankX + tankWidth / 2 - 5} 
              y={tankY + 20} 
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
              y={tankY + 20 + anodeDepletedHeight} 
              width="10" 
              height={anodeHealthyHeight}
              fill="url(#anodeHealthyGradient)"
              rx="2"
            />
          )}
        </g>

        {/* Bubbles */}
        <circle cx={tankX + 25} cy={tankY + tankHeight * 0.5} r="2" fill="rgba(255,255,255,0.25)" className="animate-bubble-rise" style={{ animationDelay: '0s' }} />
        <circle cx={tankX + 70} cy={tankY + tankHeight * 0.55} r="1.5" fill="rgba(255,255,255,0.2)" className="animate-bubble-rise" style={{ animationDelay: '0.7s' }} />
      </g>

      {/* ANODE Label with line */}
      <g>
        <line 
          x1={tankX + tankWidth / 2 + 8} 
          y1={tankY + 20 + anodeFullHeight / 2} 
          x2={tankX + tankWidth + 15} 
          y2={tankY + 20 + anodeFullHeight / 2}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={tankX + tankWidth + 15} 
          cy={tankY + 20 + anodeFullHeight / 2} 
          r="3" 
          fill={anodeStatus === 'critical' ? '#ef4444' : anodeStatus === 'warning' ? '#f59e0b' : '#22c55e'}
        />
        <text 
          x={tankX + tankWidth + 22} 
          y={tankY + 20 + anodeFullHeight / 2 - 6} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="start"
        >
          ANODE
        </text>
        <text 
          x={tankX + tankWidth + 22} 
          y={tankY + 20 + anodeFullHeight / 2 + 6} 
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
          x1={tankX - 5} 
          y1={tankY + tankHeight - sedimentHeight / 2 - 4} 
          x2={tankX - 20} 
          y2={tankY + tankHeight - sedimentHeight / 2 - 4}
          stroke="#6b7280"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle 
          cx={tankX - 20} 
          cy={tankY + tankHeight - sedimentHeight / 2 - 4} 
          r="3" 
          fill={sedimentStatus === 'critical' ? '#ef4444' : sedimentStatus === 'warning' ? '#f59e0b' : '#22c55e'}
        />
        <text 
          x={tankX - 25} 
          y={tankY + tankHeight - sedimentHeight / 2 - 10} 
          fill="#9ca3af" 
          fontSize="9" 
          fontWeight="600"
          textAnchor="end"
        >
          SEDIMENT
        </text>
        <text 
          x={tankX - 25} 
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
                sedimentLbs={sedimentLbs}
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