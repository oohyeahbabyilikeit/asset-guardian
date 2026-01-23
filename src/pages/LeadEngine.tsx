import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryTabs } from '@/components/contractor/CategoryTabs';
import { LeadLane } from '@/components/contractor/LeadLane';
import { SequenceOverviewPanel } from '@/components/contractor/SequenceOverviewPanel';
import { PropertyReportDrawer } from '@/components/contractor/PropertyReportDrawer';
import { SalesCoachDrawer } from '@/components/contractor/SalesCoachDrawer';
import { StartSequenceModal } from '@/components/contractor/StartSequenceModal';
import { SequenceControlDrawer } from '@/components/contractor/SequenceControlDrawer';
import { useContractorOpportunities } from '@/hooks/useContractorOpportunities';
import { 
  useNurturingSequences, 
  useToggleSequenceStatus,
  getSequenceStats,
  type NurturingSequence,
} from '@/hooks/useNurturingSequences';
import { 
  categorizeOpportunities, 
  type LeadCategory,
  type CategorizedOpportunity,
} from '@/lib/opportunityCategories';
import { type MockOpportunity } from '@/data/mockContractorData';
import { toast } from 'sonner';

export default function LeadEngine() {
  const navigate = useNavigate();
  
  // Data fetching
  const { data: opportunities = [], isLoading: oppsLoading } = useContractorOpportunities();
  const { data: sequences = [], isLoading: seqLoading } = useNurturingSequences();
  const toggleSequence = useToggleSequenceStatus();
  
  // UI state
  const [activeCategory, setActiveCategory] = useState<LeadCategory | null>(null);
  const [reportOpportunityId, setReportOpportunityId] = useState<string | null>(null);
  const [coachOpportunityId, setCoachOpportunityId] = useState<string | null>(null);
  const [returnToReportId, setReturnToReportId] = useState<string | null>(null);
  
  // Sequence UI state
  const [startSequenceOpp, setStartSequenceOpp] = useState<CategorizedOpportunity | null>(null);
  const [sequenceControlData, setSequenceControlData] = useState<{
    opportunity: CategorizedOpportunity;
    sequence: NurturingSequence;
  } | null>(null);
  
  // Categorize opportunities
  const categorized = useMemo(() => 
    categorizeOpportunities(opportunities),
    [opportunities]
  );
  
  // Build sequence lookup by opportunity ID
  const sequencesByOpp = useMemo(() => {
    const map: Record<string, NurturingSequence> = {};
    for (const seq of sequences) {
      // Keep most recent sequence per opportunity
      if (!map[seq.opportunityId] || seq.startedAt > map[seq.opportunityId].startedAt) {
        map[seq.opportunityId] = seq;
      }
    }
    return map;
  }, [sequences]);
  
  // Calculate stats
  const sequenceStats = useMemo(() => getSequenceStats(sequences), [sequences]);
  
  // Counts for category tabs
  const counts = {
    replacements: categorized.replacements.length,
    codeFixes: categorized.codeFixes.length,
    maintenance: categorized.maintenance.length,
  };
  
  const criticalCount = categorized.replacements.filter(o => o.priority === 'critical').length;
  
  // Get selected opportunity for drawers
  const reportOpportunity = useMemo(() => 
    opportunities.find(o => o.id === reportOpportunityId) || null,
    [opportunities, reportOpportunityId]
  );
  
  const coachOpportunity = useMemo(() =>
    opportunities.find(o => o.id === coachOpportunityId) || null,
    [opportunities, coachOpportunityId]
  );
  
  // Handlers
  const handleCall = (opportunity: CategorizedOpportunity) => {
    if (opportunity.customerPhone) {
      window.location.href = `tel:${opportunity.customerPhone}`;
    }
    toast.success(`Calling ${opportunity.customerName}...`);
  };
  
  const handleViewDetails = (opportunity: CategorizedOpportunity) => {
    setReportOpportunityId(opportunity.id);
  };
  
  const handleCloseReport = () => {
    setReportOpportunityId(null);
  };
  
  const handleOpenCoach = (opportunity: CategorizedOpportunity) => {
    setReturnToReportId(reportOpportunityId);
    setReportOpportunityId(null);
    setCoachOpportunityId(opportunity.id);
  };
  
  const handleCloseCoach = () => {
    setCoachOpportunityId(null);
    if (returnToReportId) {
      setReportOpportunityId(returnToReportId);
      setReturnToReportId(null);
    }
  };
  
  const handleOpenCoachFromReport = (opportunityId: string) => {
    setReturnToReportId(opportunityId);
    setReportOpportunityId(null);
    setCoachOpportunityId(opportunityId);
  };
  
  const handleToggleSequence = (sequence: NurturingSequence) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active';
    toggleSequence.mutate(
      { sequenceId: sequence.id, newStatus },
      {
        onSuccess: () => {
          toast.success(newStatus === 'paused' ? 'Sequence paused' : 'Sequence resumed');
        },
        onError: () => {
          toast.error('Failed to update sequence');
        },
      }
    );
  };
  
  const handleStartSequence = (opportunity: CategorizedOpportunity) => {
    setStartSequenceOpp(opportunity);
  };
  
  const handleOpenSequenceControl = (opportunity: CategorizedOpportunity, sequence: NurturingSequence) => {
    setSequenceControlData({ opportunity, sequence });
  };
  
  const isLoading = oppsLoading || seqLoading;
  
  // Determine which lanes to show
  const showReplacements = activeCategory === null || activeCategory === 'replacements';
  const showCodeFixes = activeCategory === null || activeCategory === 'codeFixes';
  const showMaintenance = activeCategory === null || activeCategory === 'maintenance';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Lead Engine</h1>
              <p className="text-xs text-muted-foreground">
                {counts.replacements + counts.codeFixes + counts.maintenance} active opportunities
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {criticalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {criticalCount}
              </span>
            )}
          </Button>
        </div>
        
        {/* Category Tabs */}
        <div className="px-4 pb-3">
          <CategoryTabs
            counts={counts}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground text-sm">Loading leads...</span>
          </div>
        ) : (
          <>
            {/* Lead Lanes */}
            <div className="space-y-3">
              {showReplacements && (
                <LeadLane
                  category="replacements"
                  opportunities={categorized.replacements}
                  sequences={sequencesByOpp}
                  onCall={handleCall}
                  onViewDetails={handleViewDetails}
                  onOpenCoach={handleOpenCoach}
                  onToggleSequence={handleToggleSequence}
                  onStartSequence={handleStartSequence}
                  onOpenSequenceControl={handleOpenSequenceControl}
                />
              )}
              
              {showCodeFixes && (
                <LeadLane
                  category="codeFixes"
                  opportunities={categorized.codeFixes}
                  sequences={sequencesByOpp}
                  onCall={handleCall}
                  onViewDetails={handleViewDetails}
                  onOpenCoach={handleOpenCoach}
                  onToggleSequence={handleToggleSequence}
                  onStartSequence={handleStartSequence}
                  onOpenSequenceControl={handleOpenSequenceControl}
                />
              )}
              
              {showMaintenance && (
                <LeadLane
                  category="maintenance"
                  opportunities={categorized.maintenance}
                  sequences={sequencesByOpp}
                  onCall={handleCall}
                  onViewDetails={handleViewDetails}
                  onOpenCoach={handleOpenCoach}
                  onToggleSequence={handleToggleSequence}
                  onStartSequence={handleStartSequence}
                  onOpenSequenceControl={handleOpenSequenceControl}
                />
              )}
            </div>
            
            {/* Empty State */}
            {counts.replacements + counts.codeFixes + counts.maintenance === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No active opportunities</p>
              </div>
            )}
            
            {/* Sequence Overview */}
            {sequences.length > 0 && (
              <SequenceOverviewPanel stats={sequenceStats} />
            )}
          </>
        )}
      </main>
      
      {/* Property Report Drawer */}
      <PropertyReportDrawer
        opportunity={reportOpportunity}
        open={!!reportOpportunity}
        onClose={handleCloseReport}
        onCall={() => {
          if (reportOpportunity) {
            handleCall(reportOpportunity as CategorizedOpportunity);
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
      
      {/* Start Sequence Modal */}
      {startSequenceOpp && (
        <StartSequenceModal
          open={!!startSequenceOpp}
          onClose={() => setStartSequenceOpp(null)}
          opportunityId={startSequenceOpp.id}
          customerName={startSequenceOpp.customerName}
        />
      )}
      
      {/* Sequence Control Drawer */}
      {sequenceControlData && (
        <SequenceControlDrawer
          open={!!sequenceControlData}
          onClose={() => setSequenceControlData(null)}
          sequence={sequenceControlData.sequence}
          customerName={sequenceControlData.opportunity.customerName}
          propertyAddress={sequenceControlData.opportunity.propertyAddress}
        />
      )}
    </div>
  );
}
