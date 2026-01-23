import { useState, useMemo } from 'react';
import { Menu, FileText, Search, MapPin, Building2, AlertTriangle, Wrench, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContractorMenu } from '@/components/contractor/ContractorMenu';
import { PropertyReportDrawer } from '@/components/contractor/PropertyReportDrawer';
import { SalesCoachDrawer } from '@/components/contractor/SalesCoachDrawer';
import { HealthScoreBadge } from '@/components/contractor/HealthScoreBadge';
import { useContractorOpportunities } from '@/hooks/useContractorOpportunities';
import { cn } from '@/lib/utils';
import type { MockOpportunity, OpportunityType } from '@/data/mockContractorData';

type FilterCategory = 'all' | 'replacements' | 'codeFixes' | 'maintenance';

const FILTER_CONFIG: { id: FilterCategory; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All Properties', icon: Building2 },
  { id: 'replacements', label: 'Replacements', icon: AlertTriangle },
  { id: 'codeFixes', label: 'Code Fixes', icon: Wrench },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
];

const REPLACEMENT_TYPES: OpportunityType[] = ['replacement_urgent', 'replacement_recommended'];
const MAINTENANCE_TYPES: OpportunityType[] = ['flush_due', 'anode_due', 'descale_due', 'annual_checkup'];

function getOpportunityCategory(opp: MockOpportunity): FilterCategory {
  if (REPLACEMENT_TYPES.includes(opp.opportunityType) || opp.priority === 'critical') {
    return 'replacements';
  }
  if (opp.opportunityType === 'warranty_expiring') {
    return 'codeFixes';
  }
  if (MAINTENANCE_TYPES.includes(opp.opportunityType)) {
    return 'maintenance';
  }
  // Check forensic inputs for code fix opportunities
  const fi = opp.forensicInputs;
  if (fi) {
    const needsExpTank = !fi.hasExpTank && fi.isClosedLoop;
    const needsPrv = !fi.hasPrv && (fi.housePsi ?? 0) > 80;
    const needsSoftener = !fi.hasSoftener && (fi.hardnessGPG ?? 0) > 15;
    if (needsExpTank || needsPrv || needsSoftener) {
      return 'codeFixes';
    }
  }
  return 'maintenance';
}

function getCategoryIcon(category: FilterCategory) {
  switch (category) {
    case 'replacements':
      return AlertTriangle;
    case 'codeFixes':
      return Wrench;
    case 'maintenance':
      return Settings;
    default:
      return Building2;
  }
}

function getCategoryColor(category: FilterCategory): string {
  switch (category) {
    case 'replacements':
      return 'text-destructive';
    case 'codeFixes':
      return 'text-warning';
    case 'maintenance':
      return 'text-primary';
    default:
      return 'text-muted-foreground';
  }
}

function getCategoryBadgeStyles(category: FilterCategory): string {
  switch (category) {
    case 'replacements':
      return 'bg-destructive/20 text-destructive';
    case 'codeFixes':
      return 'bg-warning/20 text-warning';
    case 'maintenance':
      return 'bg-primary/20 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function Reports() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [reportOpportunityId, setReportOpportunityId] = useState<string | null>(null);
  const [coachOpportunityId, setCoachOpportunityId] = useState<string | null>(null);
  const [returnToReportId, setReturnToReportId] = useState<string | null>(null);
  
  const { data: opportunities = [], isLoading } = useContractorOpportunities();
  
  // Filter and search logic
  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter(o => o.status !== 'dismissed');
    
    // Apply category filter
    if (activeFilter !== 'all') {
      result = result.filter(o => getOpportunityCategory(o) === activeFilter);
    }
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        (o.customerName?.toLowerCase() || '').includes(query) ||
        o.propertyAddress.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [opportunities, activeFilter, searchQuery]);
  
  // Category counts
  const categoryCounts = useMemo(() => {
    const active = opportunities.filter(o => o.status !== 'dismissed');
    return {
      all: active.length,
      replacements: active.filter(o => getOpportunityCategory(o) === 'replacements').length,
      codeFixes: active.filter(o => getOpportunityCategory(o) === 'codeFixes').length,
      maintenance: active.filter(o => getOpportunityCategory(o) === 'maintenance').length,
    };
  }, [opportunities]);
  
  // Get selected opportunity for drawer
  const reportOpportunity = useMemo(() => 
    opportunities.find(o => o.id === reportOpportunityId) || null,
    [opportunities, reportOpportunityId]
  );
  
  const coachOpportunity = useMemo(() =>
    opportunities.find(o => o.id === coachOpportunityId) || null,
    [opportunities, coachOpportunityId]
  );
  
  // Handlers
  const handleViewReport = (opportunityId: string) => {
    setReportOpportunityId(opportunityId);
  };
  
  const handleCloseReport = () => {
    setReportOpportunityId(null);
  };
  
  const handleCall = (opportunity: MockOpportunity) => {
    if (opportunity.customerPhone) {
      window.location.href = `tel:${opportunity.customerPhone}`;
    }
  };
  
  const handleOpenCoachFromReport = (opportunityId: string) => {
    setReturnToReportId(opportunityId);
    setReportOpportunityId(null);
    setCoachOpportunityId(opportunityId);
  };
  
  const handleCloseCoach = () => {
    setCoachOpportunityId(null);
    if (returnToReportId) {
      setReportOpportunityId(returnToReportId);
      setReturnToReportId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Property Reports
              </h1>
              <p className="text-sm text-muted-foreground">
                Browse diagnostic reports for all addresses
              </p>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-border"
            />
          </div>
        </div>
        
        {/* Category Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {FILTER_CONFIG.map((filter) => {
            const count = categoryCounts[filter.id];
            const isActive = activeFilter === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isActive ? 'bg-primary/20' : 'bg-muted-foreground/10'
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </header>
      
      {/* Property List */}
      <main className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No properties found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-primary mt-2 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {filteredOpportunities.map((opp) => {
              const category = getOpportunityCategory(opp);
              const CategoryIcon = getCategoryIcon(category);
              const categoryColor = getCategoryColor(category);
              const verdictTitle = opp.opterraResult?.verdictTitle;
              
              return (
                <button
                  key={opp.id}
                  onClick={() => handleViewReport(opp.id)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border border-border bg-card',
                    'hover:border-primary/30 hover:bg-card/80 transition-all',
                    'flex items-center gap-4'
                  )}
                >
                  {/* Health Score */}
                  <div className="shrink-0">
                    <HealthScoreBadge score={opp.healthScore} />
                  </div>
                  
                  {/* Property Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground truncate">
                        {opp.propertyAddress.split(',')[0]}
                      </span>
                      <CategoryIcon className={cn('w-4 h-4 shrink-0', categoryColor)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {opp.customerName || 'Unknown'} · {opp.propertyAddress.split(',').slice(1).join(',')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{opp.asset.brand} {opp.asset.capacity}gal</span>
                      <span>·</span>
                      <span>{opp.asset.calendarAge} years old</span>
                      {verdictTitle && (
                        <>
                          <span>·</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full',
                            getCategoryBadgeStyles(category)
                          )}>
                            {verdictTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* View Button */}
                  <div className="shrink-0">
                    <span className="text-xs text-primary font-medium">
                      View Report →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Navigation Menu */}
      <ContractorMenu open={menuOpen} onOpenChange={setMenuOpen} />
      
      {/* Property Report Drawer */}
      <PropertyReportDrawer
        opportunity={reportOpportunity}
        open={!!reportOpportunity}
        onClose={handleCloseReport}
        onCall={() => {
          if (reportOpportunity) {
            handleCall(reportOpportunity);
          }
        }}
        onOpenSalesCoach={handleOpenCoachFromReport}
      />
      
      {/* Sales Coach Drawer */}
      {coachOpportunity && (
        <SalesCoachDrawer
          open={!!coachOpportunity}
          onClose={handleCloseCoach}
          opportunity={coachOpportunity}
        />
      )}
    </div>
  );
}
