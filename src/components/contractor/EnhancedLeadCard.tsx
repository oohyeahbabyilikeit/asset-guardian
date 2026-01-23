import { cn } from '@/lib/utils';
import { Phone, ChevronRight, Pause, Play, Bot, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NurturingBadge } from './NurturingBadge';
import { 
  type CategorizedOpportunity, 
  getCategoryContext 
} from '@/lib/opportunityCategories';
import { type NurturingSequence } from '@/hooks/useNurturingSequences';
import { formatTimeAgo, getUnitSummary } from '@/data/mockContractorData';

interface EnhancedLeadCardProps {
  opportunity: CategorizedOpportunity;
  sequence: NurturingSequence | null;
  onCall?: () => void;
  onViewDetails?: () => void;
  onOpenCoach?: () => void;
  onToggleSequence?: () => void;
  onStartSequence?: () => void;
  onOpenSequenceControl?: () => void;
}

const categoryStyles = {
  replacements: {
    dot: 'bg-rose-500',
    border: 'border-l-rose-500/50',
  },
  codeFixes: {
    dot: 'bg-amber-500',
    border: 'border-l-amber-500/50',
  },
  maintenance: {
    dot: 'bg-sky-500',
    border: 'border-l-sky-500/50',
  },
};

export function EnhancedLeadCard({
  opportunity,
  sequence,
  onCall,
  onViewDetails,
  onOpenCoach,
  onToggleSequence,
  onStartSequence,
  onOpenSequenceControl,
}: EnhancedLeadCardProps) {
  const styles = categoryStyles[opportunity.category];
  const unitSummary = getUnitSummary(opportunity.asset);
  const categoryContext = getCategoryContext(opportunity);
  const addressShort = opportunity.propertyAddress.split(',')[0];
  
  const isSequenceActive = sequence?.status === 'active';
  const isSequencePaused = sequence?.status === 'paused';
  const hasActiveSequence = sequence && (isSequenceActive || isSequencePaused);
  
  return (
    <div className={cn(
      'rounded-lg border bg-card transition-all duration-200',
      'hover:shadow-sm hover:border-border/80',
      'border-l-2',
      styles.border
    )}>
      {/* Header Row */}
      <div className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={cn('w-2 h-2 rounded-full flex-shrink-0', styles.dot)} />
            <span className="font-medium text-foreground truncate">
              {opportunity.customerName}
            </span>
          </div>
          
          {/* Health Score */}
          <div className={cn(
            'text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0',
            opportunity.healthScore <= 30 
              ? 'bg-destructive/10 text-destructive' 
              : opportunity.healthScore <= 50 
                ? 'bg-warning/10 text-warning'
                : 'bg-emerald-500/10 text-emerald-300'
          )}>
            {opportunity.healthScore}
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground truncate pl-4">
          {addressShort}
        </p>
      </div>
      
      {/* Unit & Context Row */}
      <div className="px-3 pb-2 border-t border-border/50 pt-2">
        <p className="text-xs text-muted-foreground truncate mb-1">
          {unitSummary}
        </p>
        <p className="text-xs font-medium text-foreground/80 truncate">
          {categoryContext}
        </p>
      </div>
      
      {/* Nurturing Status */}
      <div className="px-3 pb-2 border-t border-border/50 pt-2">
        {sequence ? (
          <button 
            onClick={onOpenSequenceControl}
            className="w-full text-left hover:opacity-80 transition-opacity"
          >
            <NurturingBadge sequence={sequence} />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onStartSequence}
            className="h-7 px-2 text-xs gap-1 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
          >
            <Zap className="w-3 h-3" />
            Start Sequence
          </Button>
        )}
      </div>
      
      {/* Actions Row */}
      <div className="flex items-center gap-1.5 px-3 pb-3 pt-1 border-t border-border/50">
        <Button 
          size="sm" 
          variant="secondary"
          onClick={onCall}
          className="gap-1 h-7 px-2.5 text-xs"
        >
          <Phone className="w-3 h-3" />
          Call
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onViewDetails}
          className="gap-0.5 text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
        >
          Details
          <ChevronRight className="w-3 h-3" />
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onOpenCoach}
          className="gap-1 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 h-7 px-2 text-xs"
        >
          <Bot className="w-3 h-3" />
          Coach
        </Button>
        
        <div className="flex-1" />
        
        {/* Sequence control */}
        {hasActiveSequence && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onToggleSequence}
            className={cn(
              'h-7 px-2 text-xs gap-1',
              isSequenceActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
            )}
          >
            {isSequenceActive ? (
              <>
                <Pause className="w-3 h-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Resume
              </>
            )}
          </Button>
        )}
        
        <span className="text-[10px] text-muted-foreground">
          {formatTimeAgo(opportunity.createdAt)}
        </span>
      </div>
    </div>
  );
}
