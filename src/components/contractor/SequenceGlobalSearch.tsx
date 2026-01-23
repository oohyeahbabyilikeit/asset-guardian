import { useState, useMemo } from 'react';
import { Search, X, StopCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  type EnrichedSequence,
  getSequenceTypeLabel,
} from '@/hooks/useNurturingSequences';
import { useStopSequence } from '@/hooks/useSequenceEvents';
import { toast } from 'sonner';

interface SequenceGlobalSearchProps {
  sequences: EnrichedSequence[];
}

export function SequenceGlobalSearch({ sequences }: SequenceGlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [stopTarget, setStopTarget] = useState<EnrichedSequence | null>(null);
  
  const stopSequence = useStopSequence();

  // Filter sequences by search query
  const filteredSequences = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return sequences
      .filter(seq => 
        seq.status === 'active' || seq.status === 'paused'
      )
      .filter(seq =>
        seq.customerName.toLowerCase().includes(lowerQuery) ||
        seq.propertyAddress.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8); // Limit results
  }, [sequences, query]);

  const handleSelect = (sequence: EnrichedSequence) => {
    setStopTarget(sequence);
    setOpen(false);
  };

  const handleConfirmStop = async () => {
    if (!stopTarget) return;
    
    try {
      await stopSequence.mutateAsync({
        sequenceId: stopTarget.id,
        reason: 'Customer booked',
      });
      toast.success(`Sequence stopped for ${stopTarget.customerName}`);
      setStopTarget(null);
      setQuery('');
    } catch (error) {
      toast.error('Failed to stop sequence');
    }
  };

  const handleClear = () => {
    setQuery('');
    setOpen(false);
  };

  return (
    <>
      <Popover open={open && filteredSequences.length > 0} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search by name or address..."
              className="pl-9 pr-8 h-9 bg-muted/50 border-border/50"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No sequences found</CommandEmpty>
              <CommandGroup heading="Active Sequences">
                {filteredSequences.map((seq) => (
                  <CommandItem
                    key={seq.id}
                    onSelect={() => handleSelect(seq)}
                    className="flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {seq.propertyAddress}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {seq.customerName}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="shrink-0 bg-violet-500/20 text-violet-300 hover:bg-rose-500/30 hover:text-rose-300 cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <StopCircle className="w-3 h-3" />
                      {getSequenceTypeLabel(seq.sequenceType).toUpperCase()}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={!!stopTarget} onOpenChange={() => setStopTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Sequence?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop all automated outreach for{' '}
              <span className="font-medium text-foreground">
                {stopTarget?.customerName}
              </span>{' '}
              at {stopTarget?.propertyAddress}.
              <br /><br />
              Use this when a customer has already booked or contacted you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStop}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={stopSequence.isPending}
            >
              {stopSequence.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <StopCircle className="w-4 h-4 mr-2" />
              )}
              Stop Sequence
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
