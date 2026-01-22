import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadCard } from './LeadCard';
import { 
  mockOpportunities, 
  type Priority,
  type MockOpportunity 
} from '@/data/mockContractorData';
import { toast } from 'sonner';

interface OpportunityFeedProps {
  selectedPriority: Priority | null;
  onPriorityChange: (priority: Priority | null) => void;
}

export function OpportunityFeed({ selectedPriority, onPriorityChange }: OpportunityFeedProps) {
  const [opportunities, setOpportunities] = useState<MockOpportunity[]>(mockOpportunities);
  
  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities.filter(o => o.status !== 'dismissed' && o.status !== 'converted');
    
    if (selectedPriority) {
      filtered = filtered.filter(o => o.priority === selectedPriority);
    }
    
    // Sort: priority order (critical > high > medium > low), then by date (oldest first)
    const priorityOrder: Record<Priority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    
    return filtered.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }, [opportunities, selectedPriority]);

  const handleCall = (opportunity: MockOpportunity) => {
    if (opportunity.customerPhone) {
      window.location.href = `tel:${opportunity.customerPhone}`;
    }
    // Mark as contacted
    setOpportunities(prev => 
      prev.map(o => o.id === opportunity.id ? { ...o, status: 'contacted' as const } : o)
    );
    toast.success(`Calling ${opportunity.customerName}...`);
  };

  const handleViewDetails = (opportunity: MockOpportunity) => {
    // Mark as viewed
    setOpportunities(prev => 
      prev.map(o => o.id === opportunity.id && o.status === 'pending' ? { ...o, status: 'viewed' as const } : o)
    );
    toast.info('Opening details...', { description: opportunity.propertyAddress });
  };

  const handleDismiss = (opportunity: MockOpportunity) => {
    setOpportunities(prev => 
      prev.map(o => o.id === opportunity.id ? { ...o, status: 'dismissed' as const } : o)
    );
    toast.success('Lead dismissed');
  };

  const handleRemindLater = (opportunity: MockOpportunity) => {
    toast.success('Reminder set for tomorrow', { 
      description: opportunity.customerName 
    });
  };

  const priorityLabels: Record<Priority, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Service Opportunities
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({filteredOpportunities.length})
          </span>
        </h2>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              {selectedPriority ? priorityLabels[selectedPriority] : 'All'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPriorityChange(null)}>
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('critical')}>
              🔴 Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('high')}>
              🟠 High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('medium')}>
              🟡 Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('low')}>
              🟢 Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No opportunities matching this filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOpportunities.map(opportunity => (
            <LeadCard 
              key={opportunity.id} 
              opportunity={opportunity}
              onCall={() => handleCall(opportunity)}
              onViewDetails={() => handleViewDetails(opportunity)}
              onDismiss={() => handleDismiss(opportunity)}
              onRemindLater={() => handleRemindLater(opportunity)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
