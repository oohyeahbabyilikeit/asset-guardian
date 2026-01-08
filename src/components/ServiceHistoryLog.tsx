import { useState } from 'react';
import { History, Droplets, Shield, Wrench, CheckCircle2, Plus, Download, ChevronDown, User, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceEvent } from '@/types/serviceHistory';

export type { ServiceEvent };

interface ServiceHistoryLogProps {
  events: ServiceEvent[];
  onAddEvent?: () => void;
  onExportPDF?: () => void;
}

function getEventConfig(type: string) {
  switch (type) {
    case 'flush':
      return {
        icon: Droplets,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30',
        label: 'Tank Flush'
      };
    case 'anode_replacement':
      return {
        icon: Shield,
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/20',
        borderColor: 'border-amber-500/30',
        label: 'Anode Replacement'
      };
    case 'inspection':
      return {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/30',
        label: 'Annual Inspection'
      };
    case 'repair':
      return {
        icon: Wrench,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20',
        borderColor: 'border-purple-500/30',
        label: 'Repair Service'
      };
    default:
      return {
        icon: History,
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        borderColor: 'border-border',
        label: 'Service'
      };
  }
}

function formatDate(dateString: string): { full: string; relative: string } {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  let relative = '';
  if (diffDays === 0) {
    relative = 'Today';
  } else if (diffDays === 1) {
    relative = 'Yesterday';
  } else if (diffDays < 7) {
    relative = `${diffDays} days ago`;
  } else if (diffDays < 30) {
    relative = `${Math.floor(diffDays / 7)} weeks ago`;
  } else if (diffDays < 365) {
    relative = `${Math.floor(diffDays / 30)} months ago`;
  } else {
    relative = `${Math.floor(diffDays / 365)} years ago`;
  }
  
  return {
    full: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    relative
  };
}

export function ServiceHistoryLog({
  events,
  onAddEvent,
  onExportPDF
}: ServiceHistoryLogProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  
  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.type === filter);
    
  const sortedEvents = [...filteredEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const totalSpent = events.reduce((sum, e) => sum + e.cost, 0);
  const serviceCount = events.length;

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <History className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Service History</h3>
            <p className="text-[10px] text-muted-foreground">
              {serviceCount} services • ${totalSpent.toLocaleString()} total
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onExportPDF && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onExportPDF}
              className="h-8 px-2.5 text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Export
            </Button>
          )}
          {onAddEvent && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onAddEvent}
              className="h-8 px-2.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          )}
        </div>
      </div>
      
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'flush', 'anode_replacement', 'inspection', 'repair'].map((f) => {
          const config = f === 'all' 
            ? { label: 'All', color: 'text-foreground', bgColor: 'bg-muted' }
            : getEventConfig(f);
          const count = f === 'all' ? events.length : events.filter(e => e.type === f).length;
          
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                filter === f 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        {sortedEvents.length > 1 && (
          <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-border/50" />
        )}
        
        <div className="space-y-3">
          {sortedEvents.map((event, index) => {
            const config = getEventConfig(event.type);
            const dateInfo = formatDate(event.date);
            const isExpanded = expandedId === event.id;
            const healthImprovement = event.healthScoreAfter && event.healthScoreBefore 
              ? event.healthScoreAfter - event.healthScoreBefore 
              : null;
            
            return (
              <div 
                key={event.id}
                className={`relative maintenance-card`}
                style={{ '--index': index } as React.CSSProperties}
              >
                {/* Timeline node */}
                <div className={`absolute left-0 top-3 w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center border ${config.borderColor} z-10 bg-card`}>
                  <config.icon className={`w-5 h-5 ${config.color}`} />
                </div>
                
                {/* Card content */}
                <div className="ml-14 clean-card p-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">{config.label}</p>
                          {healthImprovement && healthImprovement > 0 && (
                            <span className="flex items-center gap-0.5 text-emerald-400 text-[10px] font-medium">
                              <TrendingUp className="w-3 h-3" />
                              +{healthImprovement}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateInfo.full}
                          </span>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">{dateInfo.relative}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm text-foreground">
                          ${event.cost}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-2 animate-fade-in">
                      {event.technicianName && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="w-3.5 h-3.5" />
                          <span>Technician: <span className="text-foreground">{event.technicianName}</span></span>
                        </div>
                      )}
                      
                      {event.healthScoreBefore && event.healthScoreAfter && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Health Score:</span>
                          <span className="font-mono text-red-400">{event.healthScoreBefore}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-emerald-400">{event.healthScoreAfter}</span>
                        </div>
                      )}
                      
                      {event.notes && (
                        <p className="text-xs text-muted-foreground">{event.notes}</p>
                      )}
                      
                      {event.findings && event.findings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Findings</p>
                          <ul className="space-y-1">
                            {event.findings.map((finding, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                                <span className="text-primary">•</span>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {sortedEvents.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No service history</p>
          <p className="text-[10px]">
            {filter !== 'all' ? 'Try changing the filter' : 'Services will appear here after completion'}
          </p>
        </div>
      )}
    </div>
  );
}
