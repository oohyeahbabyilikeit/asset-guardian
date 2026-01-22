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
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  high: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/5',
    badge: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  medium: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/5',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  },
  low: {
    border: 'border-l-green-500',
    bg: 'bg-green-500/5',
    badge: 'bg-green-500/20 text-green-400 border-green-500/30',
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
      'rounded-lg border-l-4 border border-border p-4 transition-all duration-200',
      'hover:shadow-lg hover:shadow-primary/5',
      config.border,
      config.bg
    )}>
      {/* Header: Priority badge + Address + Health Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="outline" 
              className={cn('text-[10px] uppercase font-bold', config.badge)}
            >
              {opportunity.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getOpportunityTypeLabel(opportunity.opportunityType)}
            </span>
          </div>
          
          <h3 className="font-semibold text-foreground mt-1.5 truncate">
            {opportunity.customerName || 'Unknown Customer'}
          </h3>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{opportunity.propertyAddress}</span>
          </div>
        </div>
        
        <HealthScoreBadge score={opportunity.healthScore} />
      </div>
      
      {/* Unit Summary */}
      <p className="text-sm text-muted-foreground mt-3">
        {opportunity.unitSummary}
      </p>
      
      {/* Context / Opportunity Reason */}
      <p className="text-sm text-foreground mt-2">
        {opportunity.context}
      </p>
      
      {/* Metadata Row */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <JobComplexityBadge complexity={opportunity.jobComplexity} />
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {formatTimeAgo(opportunity.createdAt)}
        </div>
        
        {opportunity.failProbability > 30 && (
          <span className="text-xs text-red-400">
            {opportunity.failProbability}% fail risk
          </span>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <Button 
          size="sm" 
          onClick={onCall}
          className="gap-1.5"
        >
          <Phone className="w-3.5 h-3.5" />
          Call
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={onViewDetails}
          className="gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          Details
        </Button>
        
        {opportunity.priority !== 'critical' && (
          <Button 
            size="sm" 
            variant="ghost"
            onClick={onRemindLater}
            className="gap-1.5 text-muted-foreground"
          >
            <Clock className="w-3.5 h-3.5" />
            Later
          </Button>
        )}
        
        <Button 
          size="sm" 
          variant="ghost"
          onClick={onDismiss}
          className="gap-1.5 text-muted-foreground ml-auto"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
