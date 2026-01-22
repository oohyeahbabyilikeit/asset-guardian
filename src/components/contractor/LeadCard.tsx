import { cn } from '@/lib/utils';
import { Phone, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  type MockOpportunity, 
  formatTimeAgo,
  getUnitSummary 
} from '@/data/mockContractorData';

interface LeadCardProps {
  opportunity: MockOpportunity;
  onCall?: () => void;
  onViewDetails?: () => void;
  onDismiss?: () => void;
  onRemindLater?: () => void;
}

const priorityConfig = {
  critical: {
    dot: 'bg-rose-400',
  },
  high: {
    dot: 'bg-orange-400',
  },
  medium: {
    dot: 'bg-amber-400',
  },
  low: {
    dot: 'bg-emerald-400',
  },
};

export function LeadCard({ 
  opportunity, 
  onCall, 
  onViewDetails, 
  onDismiss, 
  onRemindLater 
}: LeadCardProps) {
  const config = priorityConfig[opportunity.priority];
  
  // Derive summary from actual asset data
  const unitSummary = getUnitSummary(opportunity.asset);
  
  // Create a condensed summary
  const addressShort = opportunity.propertyAddress.split(',')[0];
  
  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-3 transition-all duration-200',
      'hover:shadow-sm hover:border-border/80'
    )}>
      {/* Row 1: Name, Address, Health Score */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
          <span className="font-medium text-foreground truncate">
            {opportunity.customerName || 'Unknown'}
          </span>
          <span className="text-muted-foreground text-sm truncate hidden sm:inline">
            · {addressShort}
          </span>
        </div>
        
        {/* Health Score - Inline */}
        <div className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
          opportunity.healthScore <= 30 
            ? 'bg-destructive/10 text-destructive' 
            : opportunity.healthScore <= 50 
              ? 'bg-amber-50 text-amber-600'
              : 'bg-muted text-muted-foreground'
        )}>
          {opportunity.healthScore}
        </div>
      </div>
      
      {/* Row 2: Unit Summary + Context (combined) */}
      <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
        {unitSummary}
        {opportunity.context && (
          <span className="text-muted-foreground/70"> · {opportunity.context}</span>
        )}
      </p>
      
      {/* Row 3: Actions + Metadata */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
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
        
        <div className="flex-1" />
        
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          {formatTimeAgo(opportunity.createdAt)}
        </span>
        
        {opportunity.priority !== 'critical' && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRemindLater}
            className="text-muted-foreground hover:text-foreground h-7 px-1.5 text-[10px]"
          >
            Later
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground h-7 w-7 p-0"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
