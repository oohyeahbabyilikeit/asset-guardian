import { cn } from '@/lib/utils';
import { Phone, Clock, MapPin, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  type MockOpportunity, 
  formatTimeAgo, 
  getOpportunityTypeLabel 
} from '@/data/mockContractorData';
import { HealthScoreBadge } from './HealthScoreBadge';
import { JobComplexityBadge } from './JobComplexityBadge';

interface LeadCardProps {
  opportunity: MockOpportunity;
  onCall?: () => void;
  onViewDetails?: () => void;
  onDismiss?: () => void;
  onRemindLater?: () => void;
}

const priorityConfig = {
  critical: {
    border: 'border-l-rose-400',
    label: 'text-rose-600',
  },
  high: {
    border: 'border-l-orange-400',
    label: 'text-orange-600',
  },
  medium: {
    border: 'border-l-amber-400',
    label: 'text-amber-600',
  },
  low: {
    border: 'border-l-emerald-400',
    label: 'text-emerald-600',
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
  const typeLabel = getOpportunityTypeLabel(opportunity.opportunityType);
  
  return (
    <div className={cn(
      'rounded-lg border-l-2 border border-gray-100 bg-white p-4 transition-all duration-200',
      'hover:shadow-sm',
      config.border
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium uppercase tracking-wide', config.label)}>
              {typeLabel}
            </span>
          </div>
          
          {opportunity.customerName && (
            <h3 className="font-medium text-gray-800 truncate">
              {opportunity.customerName}
            </h3>
          )}
          
          <div className="flex items-center gap-1 text-gray-500 mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-sm truncate">{opportunity.propertyAddress}</span>
          </div>
        </div>
        
        <HealthScoreBadge score={opportunity.healthScore} />
      </div>
      
      {/* Unit Summary */}
      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
        {opportunity.unitSummary}
      </p>
      
      {/* Context */}
      <p className="text-sm text-gray-500 mt-2 italic">
        {opportunity.context}
      </p>
      
      {/* Metadata Row */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <JobComplexityBadge complexity={opportunity.jobComplexity} />
        
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{formatTimeAgo(opportunity.createdAt)}</span>
        </div>
        
        {opportunity.failProbability > 50 && (
          <span className="text-xs text-gray-500">
            {opportunity.failProbability}% fail risk
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <Button 
          size="sm" 
          onClick={onCall}
          className="gap-1.5 bg-gray-800 hover:bg-gray-700 text-white"
        >
          <Phone className="w-3.5 h-3.5" />
          Call
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onViewDetails}
          className="gap-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          Details
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        
        <div className="flex-1" />
        
        {opportunity.priority !== 'critical' && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRemindLater}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-xs"
          >
            Later
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
