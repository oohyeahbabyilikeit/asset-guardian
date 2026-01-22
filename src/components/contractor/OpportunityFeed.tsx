import { useState, useMemo } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadCard } from './LeadCard';
import { AssetDetailDrawer } from './AssetDetailDrawer';
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
  const [selectedOpportunity, setSelectedOpportunity] = useState<MockOpportunity | null>(null);
  
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
    // Open detail drawer
    setSelectedOpportunity(opportunity);
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
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Service Opportunities
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredOpportunities.length} leads
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1.5 text-muted-foreground hover:text-foreground h-8 text-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              {selectedPriority ? priorityLabels[selectedPriority] : 'All'}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border-border">
            <DropdownMenuItem onClick={() => onPriorityChange(null)}>
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('critical')}>
              <span className="w-2 h-2 rounded-full bg-rose-400 mr-2" />
              Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('high')}>
              <span className="w-2 h-2 rounded-full bg-orange-400 mr-2" />
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('medium')}>
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('low')}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Feed */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12 bg-background rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">No opportunities matching this filter</p>
        </div>
      ) : (
        <div className="space-y-2">
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
      
      {/* Asset Detail Drawer */}
      <AssetDetailDrawer
        opportunity={selectedOpportunity}
        open={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onCall={() => {
          if (selectedOpportunity) {
            handleCall(selectedOpportunity);
          }
        }}
      />
    </div>
  );
}
