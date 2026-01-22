import { cn } from '@/lib/utils';
import { Phone, FileText, X, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobComplexityBadge } from './JobComplexityBadge';
import { HealthScoreBadge } from './HealthScoreBadge';
import { 
  type MockOpportunity, 
  formatTimeAgo, 
  getOpportunityTypeLabel 
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
    border: 'border-l-red-500',
    bg: 'bg-white',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  high: {
    border: 'border-l-orange-500',
    bg: 'bg-white',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  medium: {
    border: 'border-l-amber-400',
    bg: 'bg-white',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  low: {
    border: 'border-l-emerald-500',
    bg: 'bg-white',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
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
  
  return (
    <div className={cn(
      'rounded-lg border-l-4 border border-slate-200 p-4 transition-all duration-200 shadow-sm',
      'hover:shadow-md',
      config.border,
      config.bg
    )}>
      {/* Header: Priority badge + Address + Health Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn('text-[10px] uppercase font-semibold', config.badge)}
            >
              {opportunity.priority}
            </Badge>
            <span className="text-xs text-slate-500">
              {getOpportunityTypeLabel(opportunity.opportunityType)}
            </span>
          </div>
          
          <h3 className="font-semibold text-slate-800 mt-1.5 truncate">
            {opportunity.customerName || 'Unknown Customer'}
          </h3>
          
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{opportunity.propertyAddress}</span>
          </div>
        </div>
        
        <HealthScoreBadge score={opportunity.healthScore} />
      </div>
      
      {/* Unit Summary */}
      <p className="text-sm text-slate-600 mt-3">
        {opportunity.unitSummary}
      </p>
      
      {/* Context / Opportunity Reason */}
      <p className="text-sm text-slate-700 mt-2 font-medium">
        {opportunity.context}
      </p>
      
      {/* Metadata Row */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <JobComplexityBadge complexity={opportunity.jobComplexity} />
        
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(opportunity.createdAt)}
        </div>
        
        {opportunity.failProbability > 30 && (
          <span className="text-xs font-medium text-red-600">
            {opportunity.failProbability}% fail risk
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <Button 
          size="sm" 
          onClick={onCall}
          className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Phone className="w-3.5 h-3.5" />
          Call
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={onViewDetails}
          className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <FileText className="w-3.5 h-3.5" />
          Details
        </Button>
        
        {opportunity.priority !== 'critical' && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onRemindLater}
            className="gap-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
          >
            <Clock className="w-3.5 h-3.5" />
            Later
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDismiss}
          className="gap-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 ml-auto"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
