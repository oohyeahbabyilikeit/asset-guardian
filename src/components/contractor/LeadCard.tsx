import { cn } from '@/lib/utils';
import { Phone, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  type MockOpportunity, 
  formatTimeAgo 
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
  
  // Create a condensed summary
  const addressShort = opportunity.propertyAddress.split(',')[0];
  
  return (
    <div className={cn(
      'rounded-lg border border-gray-100 bg-white p-3 transition-all duration-200',
      'hover:shadow-sm hover:border-gray-200'
    )}>
      {/* Row 1: Name, Address, Health Score */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
          <span className="font-medium text-gray-800 truncate">
            {opportunity.customerName || 'Unknown'}
          </span>
          <span className="text-gray-400 text-sm truncate hidden sm:inline">
            · {addressShort}
          </span>
        </div>
        
        {/* Health Score - Inline */}
        <div className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
          opportunity.healthScore <= 30 
            ? 'bg-rose-50 text-rose-600' 
            : opportunity.healthScore <= 50 
              ? 'bg-amber-50 text-amber-600'
              : 'bg-gray-100 text-gray-600'
        )}>
          {opportunity.healthScore}
        </div>
      </div>
      
      {/* Row 2: Unit Summary + Context (combined) */}
      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
        {opportunity.unitSummary}
        {opportunity.context && (
          <span className="text-gray-400"> · {opportunity.context}</span>
        )}
      </p>
      
      {/* Row 3: Actions + Metadata */}
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          onClick={onCall}
          className="gap-1 bg-gray-800 hover:bg-gray-700 text-white h-7 px-2.5 text-xs"
        >
          <Phone className="w-3 h-3" />
          Call
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onViewDetails}
          className="gap-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-7 px-2 text-xs"
        >
          Details
          <ChevronRight className="w-3 h-3" />
        </Button>
        
        <div className="flex-1" />
        
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          {formatTimeAgo(opportunity.createdAt)}
        </span>
        
        {opportunity.priority !== 'critical' && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRemindLater}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-7 px-1.5 text-[10px]"
          >
            Later
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 h-7 w-7 p-0"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
