import { useState, useMemo } from 'react';
import { Filter, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadCard } from './LeadCard';
import { PropertyReportDrawer } from './PropertyReportDrawer';
import { SalesCoachDrawer } from './SalesCoachDrawer';
import { useContractorOpportunities } from '@/hooks/useContractorOpportunities';
import { 
  type Priority,
  type MockOpportunity 
} from '@/data/mockContractorData';
import { toast } from 'sonner';

interface OpportunityFeedProps {
  selectedPriority: Priority | null;
  onPriorityChange: (priority: Priority | null) => void;
}

export function OpportunityFeed({ selectedPriority, onPriorityChange }: OpportunityFeedProps) {
  // Fetch from database
  const { data: dbOpportunities, isLoading, error } = useContractorOpportunities();
  
  // Local state for status changes (optimistic updates for demo)
  const [localStatusOverrides, setLocalStatusOverrides] = useState<Record<string, MockOpportunity['status']>>({});
  
  // Merge DB data with local status overrides
  const opportunities = useMemo(() => {
    if (!dbOpportunities) return [];
    return dbOpportunities.map(opp => ({
      ...opp,
      status: localStatusOverrides[opp.id] || opp.status,
    }));
  }, [dbOpportunities, localStatusOverrides]);
  
  // State for Property Report
  const [reportOpportunityId, setReportOpportunityId] = useState<string | null>(null);
  
  // State for Sales Coach - separate from report
  const [salesCoachOpportunityId, setSalesCoachOpportunityId] = useState<string | null>(null);
  
  // Track which opportunity to return to after closing Sales Coach
  const [returnToReportId, setReturnToReportId] = useState<string | null>(null);
  
  // Derive selected opportunities from IDs
  const reportOpportunity = useMemo(() => 
    opportunities.find(o => o.id === reportOpportunityId) || null,
    [opportunities, reportOpportunityId]
  );
  
  const salesCoachOpportunity = useMemo(() =>
    opportunities.find(o => o.id === salesCoachOpportunityId) || null,
    [opportunities, salesCoachOpportunityId]
  );
  
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
    // Mark as contacted (local optimistic update)
    setLocalStatusOverrides(prev => ({
      ...prev,
      [opportunity.id]: 'contacted',
    }));
    toast.success(`Calling ${opportunity.customerName}...`);
  };

  const handleViewDetails = (opportunity: MockOpportunity) => {
    // Mark as viewed (local optimistic update)
    if (opportunity.status === 'pending') {
      setLocalStatusOverrides(prev => ({
        ...prev,
        [opportunity.id]: 'viewed',
      }));
    }
    // Open report drawer
    setReportOpportunityId(opportunity.id);
  };

  const handleCloseReport = () => {
    setReportOpportunityId(null);
  };

  const handleOpenSalesCoach = (opportunityId: string) => {
    // 1) Store current report ID so we can return to it
    setReturnToReportId(opportunityId);
    // 2) Close the report drawer (removes scroll lock)
    setReportOpportunityId(null);
    // 3) Open Sales Coach
    setSalesCoachOpportunityId(opportunityId);
  };

  const handleCloseSalesCoach = () => {
    // 1) Close Sales Coach
    setSalesCoachOpportunityId(null);
    // 2) Reopen the report we came from
    if (returnToReportId) {
      setReportOpportunityId(returnToReportId);
      setReturnToReportId(null);
    }
  };

  const handleDismiss = (opportunity: MockOpportunity) => {
    // Mark as dismissed (local optimistic update)
    setLocalStatusOverrides(prev => ({
      ...prev,
      [opportunity.id]: 'dismissed',
    }));
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
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem onClick={() => onPriorityChange(null)}>
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('critical')}>
              <span className="w-2 h-2 rounded-full bg-rose-500/60 mr-2" />
              Critical
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('high')}>
              <span className="w-2 h-2 rounded-full bg-orange-500/60 mr-2" />
              High
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('medium')}>
              <span className="w-2 h-2 rounded-full bg-amber-500/60 mr-2" />
              Medium
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPriorityChange('low')}>
              <span className="w-2 h-2 rounded-full bg-emerald-500/60 mr-2" />
              Low
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-card rounded-lg border border-border">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground text-sm">Loading opportunities...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-destructive text-sm">Failed to load opportunities</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
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
      
      {/* Property Report Drawer - no Sales Coach inside */}
      <PropertyReportDrawer
        opportunity={reportOpportunity}
        open={!!reportOpportunity}
        onClose={handleCloseReport}
        onCall={() => {
          if (reportOpportunity) {
            handleCall(reportOpportunity);
          }
        }}
        onOpenSalesCoach={handleOpenSalesCoach}
      />
      
      {/* Sales Coach Drawer - rendered at top level, not inside PropertyReportDrawer */}
      {salesCoachOpportunity && (
        <SalesCoachDrawer
          open={!!salesCoachOpportunity}
          onClose={handleCloseSalesCoach}
          opportunity={salesCoachOpportunity}
        />
      )}
    </div>
  );
}
