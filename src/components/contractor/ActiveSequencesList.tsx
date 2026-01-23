import { useState, useMemo } from 'react';
import { Inbox, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { type EnrichedSequence } from '@/hooks/useNurturingSequences';
import { SequenceTableRow } from './SequenceTableRow';
import { SequenceControlDrawer } from './SequenceControlDrawer';

interface ActiveSequencesListProps {
  sequences: EnrichedSequence[];
}

type SortKey = 'address' | 'sequence' | 'step' | 'status' | 'nextAction';
type SortOrder = 'asc' | 'desc';

export function ActiveSequencesList({ sequences }: ActiveSequencesListProps) {
  const [selectedSequence, setSelectedSequence] = useState<EnrichedSequence | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('nextAction');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Sort sequences
  const sortedSequences = useMemo(() => {
    return [...sequences].sort((a, b) => {
      let comparison = 0;
      
      switch (sortKey) {
        case 'address':
          comparison = a.propertyAddress.localeCompare(b.propertyAddress);
          break;
        case 'sequence':
          comparison = a.sequenceType.localeCompare(b.sequenceType);
          break;
        case 'step':
          comparison = a.currentStep - b.currentStep;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'nextAction':
          const aTime = a.nextActionAt?.getTime() ?? Infinity;
          const bTime = b.nextActionAt?.getTime() ?? Infinity;
          comparison = aTime - bTime;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sequences, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortableHeader = ({ 
    label, 
    sortKeyName, 
    className = '' 
  }: { 
    label: string; 
    sortKeyName: SortKey; 
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 font-medium text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        onClick={() => handleSort(sortKeyName)}
      >
        {label}
        <ArrowUpDown className="ml-1.5 h-3 w-3" />
      </Button>
    </TableHead>
  );

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
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <SortableHeader label="Address / Customer" sortKeyName="address" className="w-[30%]" />
              <SortableHeader label="Sequence" sortKeyName="sequence" className="w-[15%]" />
              <SortableHeader label="Current Step" sortKeyName="step" className="w-[15%]" />
              <SortableHeader label="Status" sortKeyName="status" className="w-[10%]" />
              <TableHead className="w-[8%]">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Engagement
                </span>
              </TableHead>
              <SortableHeader label="Next Touchpoint" sortKeyName="nextAction" className="w-[15%]" />
              <TableHead className="w-[7%]">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSequences.map((sequence) => (
              <SequenceTableRow
                key={sequence.id}
                sequence={sequence}
                onRowClick={() => setSelectedSequence(sequence)}
              />
            ))}
          </TableBody>
        </Table>
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
