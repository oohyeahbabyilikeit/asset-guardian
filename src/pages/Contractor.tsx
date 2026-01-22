import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, LayoutDashboard, ListFilter, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TodaysSummary } from '@/components/contractor/TodaysSummary';
import { OpportunityFeed } from '@/components/contractor/OpportunityFeed';
import { PipelineOverview } from '@/components/contractor/PipelineOverview';
import { ClosesBreakdown } from '@/components/contractor/ClosesBreakdown';
import { QuickActions } from '@/components/contractor/QuickActions';
import { cn } from '@/lib/utils';
import { 
  mockOpportunities, 
  getOpportunityCountsByPriority,
  type Priority 
} from '@/data/mockContractorData';

type MobileTab = 'overview' | 'leads';

export default function Contractor() {
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('leads');
  
  const activeOpportunities = mockOpportunities.filter(o => o.status !== 'dismissed' && o.status !== 'converted');
  const counts = getOpportunityCountsByPriority(activeOpportunities);
  
  const handlePriorityClick = (priority: Priority) => {
    setSelectedPriority(prev => prev === priority ? null : priority);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-lg font-medium text-foreground">Dashboard</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-secondary">
            <Bell className="w-5 h-5" />
            {counts.critical > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500/80 text-[10px] text-white rounded-full flex items-center justify-center font-medium">
                {counts.critical}
              </span>
            )}
          </Button>
        </div>
        
        {/* Mobile Tab Bar */}
        <div className="lg:hidden flex border-t border-border">
          <button
            onClick={() => setMobileTab('overview')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'overview' 
                ? 'text-foreground border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PieChart className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => setMobileTab('leads')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
              mobileTab === 'leads' 
                ? 'text-foreground border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ListFilter className="w-4 h-4" />
            Leads
            <span className="bg-secondary text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
              {activeOpportunities.length}
            </span>
          </button>
        </div>
      </header>
      
      {/* Main Content - Two Column on Desktop */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Overview Panel (Desktop only) */}
        <aside className="hidden lg:flex w-80 flex-col border-r border-border bg-card p-4 gap-4 overflow-y-auto">
          <TodaysSummary 
            counts={counts} 
            selectedPriority={selectedPriority}
            onPriorityClick={handlePriorityClick} 
          />
          <PipelineOverview compact />
          <ClosesBreakdown compact />
          <QuickActions compact />
        </aside>
        
        {/* Mobile Content */}
        <div className="lg:hidden flex-1 overflow-y-auto">
          {mobileTab === 'overview' ? (
            <div className="p-4 space-y-4">
              <TodaysSummary 
                counts={counts} 
                selectedPriority={selectedPriority}
                onPriorityClick={handlePriorityClick} 
              />
              <PipelineOverview />
              <ClosesBreakdown />
              <QuickActions />
            </div>
          ) : (
            <OpportunityFeed 
              selectedPriority={selectedPriority}
              onPriorityChange={setSelectedPriority}
            />
          )}
        </div>
        
        {/* Right Panel - Feed (Desktop only) */}
        <div className="hidden lg:block flex-1 overflow-y-auto">
          <OpportunityFeed 
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
          />
        </div>
      </div>
    </div>
  );
}
