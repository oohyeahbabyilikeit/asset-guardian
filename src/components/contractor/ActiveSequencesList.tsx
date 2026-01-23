import { useState, useMemo } from 'react';
import { AlertTriangle, Calendar, CalendarClock, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type EnrichedSequence } from '@/hooks/useNurturingSequences';
import { SequenceRow } from './SequenceRow';
import { SequenceControlDrawer } from './SequenceControlDrawer';

interface ActiveSequencesListProps {
  sequences: EnrichedSequence[];
}

interface SequenceGroup {
  title: string;
  icon: React.ElementType;
  sequences: EnrichedSequence[];
  urgency: 'overdue' | 'today' | 'upcoming';
}

export function ActiveSequencesList({ sequences }: ActiveSequencesListProps) {
  const [selectedSequence, setSelectedSequence] = useState<EnrichedSequence | null>(null);
  
  // Group sequences by urgency
  const groups = useMemo((): SequenceGroup[] => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const overdue: EnrichedSequence[] = [];
    const today: EnrichedSequence[] = [];
    const upcoming: EnrichedSequence[] = [];
    
    sequences.forEach(seq => {
      if (!seq.nextActionAt) {
        upcoming.push(seq);
        return;
      }
      
      const actionTime = seq.nextActionAt.getTime();
      
      if (actionTime < todayStart.getTime()) {
        overdue.push(seq);
      } else if (actionTime < todayEnd.getTime()) {
        today.push(seq);
      } else {
        upcoming.push(seq);
      }
    });
    
    // Sort each group by next action date
    const sortByNextAction = (a: EnrichedSequence, b: EnrichedSequence) => {
      const aTime = a.nextActionAt?.getTime() || 0;
      const bTime = b.nextActionAt?.getTime() || 0;
      return aTime - bTime;
    };
    
    overdue.sort(sortByNextAction);
    today.sort(sortByNextAction);
    upcoming.sort(sortByNextAction);
    
    return [
      { title: 'Overdue', icon: AlertTriangle, sequences: overdue, urgency: 'overdue' as const },
      { title: 'Due Today', icon: Calendar, sequences: today, urgency: 'today' as const },
      { title: 'Upcoming', icon: CalendarClock, sequences: upcoming, urgency: 'upcoming' as const },
    ].filter(g => g.sequences.length > 0);
  }, [sequences]);
  
  if (sequences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No Active Sequences</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Start a nurturing sequence from a lead card to begin automated follow-up
        </p>
      </div>
    );
  }
  
  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg mb-2',
              group.urgency === 'overdue' && 'bg-rose-500/10 text-rose-400',
              group.urgency === 'today' && 'bg-amber-500/10 text-amber-400',
              group.urgency === 'upcoming' && 'bg-muted/50 text-muted-foreground',
            )}>
              <group.icon className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-wider">
                {group.title}
              </span>
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                group.urgency === 'overdue' && 'bg-rose-500/20',
                group.urgency === 'today' && 'bg-amber-500/20',
                group.urgency === 'upcoming' && 'bg-muted',
              )}>
                {group.sequences.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {group.sequences.map((sequence) => (
                <SequenceRow
                  key={sequence.id}
                  sequence={sequence}
                  customerName={sequence.customerName}
                  propertyAddress={sequence.propertyAddress}
                  urgency={group.urgency}
                  onClick={() => setSelectedSequence(sequence)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Sequence Control Drawer */}
      {selectedSequence && (
        <SequenceControlDrawer
          open={!!selectedSequence}
          onClose={() => setSelectedSequence(null)}
          sequence={selectedSequence}
          customerName={selectedSequence.customerName}
          propertyAddress={selectedSequence.propertyAddress}
        />
      )}
    </>
  );
}
