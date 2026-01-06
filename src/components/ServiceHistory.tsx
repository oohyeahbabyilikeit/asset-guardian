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

  // Generate visual layers for sediment
  const sedimentLayers = Math.ceil(sedimentPercent / 20); // 1-5 layers

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
            {/* Visual Tank Cross-Section */}
            <div className="flex gap-4">
              {/* Anode Rod Visualization */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Anode Rod</span>
                </div>
                <div className="relative h-32 w-full flex justify-center">
                  {/* Anode rod container */}
                  <div className="relative w-4 h-full rounded-full bg-muted/30 border border-border overflow-hidden">
                    {/* Remaining anode (from bottom up) */}
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0 transition-all duration-500 rounded-b-full",
                        anodeDepleted ? "bg-red-500/50" : anodeDepletionPercent > 70 ? "bg-amber-500/70" : "bg-zinc-400"
                      )}
                      style={{ height: `${100 - anodeDepletionPercent}%` }}
                    />
                    {/* Depleted section (corroded look) */}
                    <div 
                      className="absolute top-0 left-0 right-0 bg-gradient-to-b from-amber-900/60 via-amber-800/40 to-transparent"
                      style={{ height: `${anodeDepletionPercent}%` }}
                    />
                  </div>
                  {/* Label */}
                  <div className="absolute -bottom-1 left-0 right-0 text-center">
                    <span className={cn(
                      "text-[10px] font-bold font-data",
                      anodeDepleted ? "text-red-400" : anodeDepletionPercent > 70 ? "text-amber-400" : "text-green-400"
                    )}>
                      {shieldLife > 0 ? `${shieldLife.toFixed(1)}yr` : 'GONE'}
                    </span>
                  </div>
                </div>
                <p className={cn(
                  "text-[10px] text-center mt-2",
                  anodeDepleted ? "text-red-400" : "text-muted-foreground"
                )}>
                  {anodeDepleted ? 'Depleted' : `${(100 - anodeDepletionPercent).toFixed(0)}% remaining`}
                </p>
              </div>

              {/* Sediment Visualization */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Sediment</span>
                </div>
                <div className="relative h-32 w-full">
                  {/* Tank outline */}
                  <div className="absolute inset-x-2 inset-y-0 rounded-lg border-2 border-muted-foreground/30 bg-muted/10 overflow-hidden">
                    {/* Water */}
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent" />
                    
                    {/* Sediment layers */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                      style={{ height: `${sedimentPercent}%` }}
                    >
                      {/* Gradient layers for depth effect */}
                      <div className="absolute inset-0 bg-gradient-to-t from-amber-900 via-amber-800/80 to-amber-700/60 rounded-b-md" />
                      {/* Texture lines */}
                      {Array.from({ length: sedimentLayers }).map((_, i) => (
                        <div 
                          key={i}
                          className="absolute left-0 right-0 h-px bg-amber-950/50"
                          style={{ bottom: `${(i + 1) * 20}%` }}
                        />
                      ))}
                    </div>
                    
                    {/* Heating element indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-red-500/40 rounded-full" />
                  </div>
                  
                  {/* Label */}
                  <div className="absolute -bottom-1 left-0 right-0 text-center">
                    <span className={cn(
                      "text-[10px] font-bold font-data",
                      sedimentHigh ? "text-amber-400" : "text-green-400"
                    )}>
                      {sedimentLbs.toFixed(1)} lbs
                    </span>
                  </div>
                </div>
                <p className={cn(
                  "text-[10px] text-center mt-2",
                  sedimentHigh ? "text-amber-400" : "text-muted-foreground"
                )}>
                  {sedimentHigh ? 'Flush recommended' : 'Normal levels'}
                </p>
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