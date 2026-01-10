import { useState } from 'react';
import { ChevronDown, ChevronUp, Wrench, Droplets, Shield, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ServiceEvent } from '@/types/serviceHistory';
import { InteractiveWaterHeaterDiagram } from '@/components/InteractiveWaterHeaterDiagram';
import type { FuelType, AirFilterStatus } from '@/lib/opterraAlgorithm';

interface ServiceHistoryProps {
  calendarAge: number;
  sedimentLbs: number;
  shieldLife: number;
  hasSoftener: boolean;
  tankCapacityGallons: number;
  failProb: number;  // Required for safe flush logic
  // Sediment projection metrics
  sedimentRate: number;
  monthsToFlush: number | null;
  monthsToLockout: number | null;
  flushStatus: 'optimal' | 'schedule' | 'due' | 'lockout';
  serviceHistory?: ServiceEvent[];
  autoExpand?: boolean;  // Auto-expand when score is critical
  recommendation?: { action: 'REPLACE' | 'REPAIR' | 'UPGRADE' | 'MAINTAIN' | 'PASS' | 'URGENT' };
  // Breach detection
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
  airFilterStatus,
  isCondensateClear,
  compressorHealth,
  hasExpansionTank,
  hasPRV
}: ServiceHistoryProps) {
  // Breach detection
  const isBreach = isLeaking || visualRust;
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
  // Sediment is denser than water (~2x), so we estimate max realistic sediment
  // A 50-gal tank typically holds up to ~20 lbs of sediment before serious issues
  // Scale proportionally: maxSediment = (tankCapacityGallons / 50) * 20
  const maxSedimentForTank = (tankCapacityGallons / 50) * 20;
  const sedimentPercent = Math.min(100, (sedimentLbs / maxSedimentForTank) * 100);
  const sedimentHigh = sedimentLbs > (tankCapacityGallons / 50) * 5;

  // Determine status colors
  const anodeStatus = anodeDepleted ? 'critical' : anodeDepletionPercent > 70 ? 'warning' : 'good';
  const sedimentStatus = sedimentPercent > 50 ? 'critical' : sedimentHigh ? 'warning' : 'good';

  // SAFE FLUSH LOGIC GATES
  // Prevents: "Killer Flush" (locked out), "Ghost Flush" (fragile tank)
  const isFragile = failProb > 60 || calendarAge > 12;
  const isLockedOut = sedimentLbs > 15;
  const isServiceable = sedimentLbs >= 5 && sedimentLbs <= 15;
  const needsFlush = !isFragile && !isLockedOut && isServiceable;
  
  const needsAnode = shieldLife < 1 && calendarAge < 8;

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
        {isBreach && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
            BREACH
          </span>
        )}
        {!isBreach && !isReplacementRequired && (needsFlush || needsAnode) && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-auto">
            SERVICE DUE
          </span>
        )}
      </div>

      {/* Always Visible Content: Tank Diagram + Stats */}
      <div className="px-5 py-4">
        <div className="flex flex-col items-center">
          <InteractiveWaterHeaterDiagram 
            anodePercent={anodeDepletionPercent}
            sedimentLbs={sedimentLbs}
            fuelType={fuelType}
            airFilterStatus={airFilterStatus}
            isCondensateClear={isCondensateClear}
            compressorHealth={compressorHealth}
            hasExpansionTank={hasExpansionTank}
            hasPRV={hasPRV}
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

          {/* Service Recommendations - Always visible when applicable */}
          {!isReplacementRequired && (needsFlush || needsAnode) && (
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