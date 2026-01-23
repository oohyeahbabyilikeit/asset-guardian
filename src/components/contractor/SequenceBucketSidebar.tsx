import { ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeSequenceType, type EnrichedSequence } from '@/hooks/useNurturingSequences';

export type SequenceBucket = 'all' | 'high_risk' | 'code_violation' | 'maintenance' | 'warranty';

interface SequenceBucketSidebarProps {
  sequences: EnrichedSequence[];
  activeBucket: SequenceBucket;
  onBucketChange: (bucket: SequenceBucket) => void;
}

const BUCKET_CONFIG: {
  id: SequenceBucket;
  label: string;
  matchTypes: string[];
}[] = [
  {
    id: 'all',
    label: 'All Active',
    matchTypes: [],
  },
  {
    id: 'high_risk',
    label: 'High Risk / Replace',
    matchTypes: ['replacement_urgent', 'urgent_replace'],
  },
  {
    id: 'code_violation',
    label: 'Code Violation',
    matchTypes: ['code_violation'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    matchTypes: ['maintenance', 'maintenance_reminder'],
  },
  {
    id: 'warranty',
    label: 'Warranty',
    matchTypes: ['warranty_expiring', 'warranty'],
  },
];

export function SequenceBucketSidebar({
  sequences,
  activeBucket,
  onBucketChange,
}: SequenceBucketSidebarProps) {
  // Calculate counts for each bucket
  const bucketCounts = BUCKET_CONFIG.reduce((acc, bucket) => {
    if (bucket.id === 'all') {
      acc[bucket.id] = sequences.length;
    } else {
      acc[bucket.id] = sequences.filter(seq => {
        const normalized = normalizeSequenceType(seq.sequenceType);
        return bucket.matchTypes.includes(normalized) || 
               bucket.matchTypes.includes(seq.sequenceType);
      }).length;
    }
    return acc;
  }, {} as Record<SequenceBucket, number>);

  return (
    <div className="w-56 shrink-0 hidden lg:block">
      <div className="sticky top-24 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <ListFilter className="w-3.5 h-3.5" />
          Filter by Type
        </div>

        {/* Bucket List */}
        <div className="space-y-0.5">
          {BUCKET_CONFIG.map((bucket) => {
            const count = bucketCounts[bucket.id];
            const isActive = activeBucket === bucket.id;
            
            // Hide empty buckets (except "All")
            if (count === 0 && bucket.id !== 'all') return null;

            return (
              <button
                key={bucket.id}
                onClick={() => onBucketChange(bucket.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-muted border-l-2 border-l-violet-500 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                <span className="flex items-center gap-2">
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  )}
                  {bucket.label}
                </span>
                <span className={cn(
                  'text-xs tabular-nums px-1.5 py-0.5 rounded-full',
                  isActive 
                    ? 'bg-violet-500/20 text-violet-300'
                    : 'bg-muted-foreground/10',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Filter sequences by bucket type
 */
export function filterSequencesByBucket(
  sequences: EnrichedSequence[],
  bucket: SequenceBucket,
): EnrichedSequence[] {
  if (bucket === 'all') return sequences;

  const config = BUCKET_CONFIG.find(b => b.id === bucket);
  if (!config) return sequences;

  return sequences.filter(seq => {
    const normalized = normalizeSequenceType(seq.sequenceType);
    return config.matchTypes.includes(normalized) || 
           config.matchTypes.includes(seq.sequenceType);
  });
}
