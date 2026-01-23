import { useState } from 'react';
import { Menu, Bell, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardPulseHero } from '@/components/contractor/DashboardPulseHero';
import { PipelineSummaryCard } from '@/components/contractor/PipelineSummaryCard';
import { WeeklyStatsCard } from '@/components/contractor/WeeklyStatsCard';
import { RecentActivityFeed } from '@/components/contractor/RecentActivityFeed';
import { ContractorMenu } from '@/components/contractor/ContractorMenu';
import { SequenceGlobalSearch } from '@/components/contractor/SequenceGlobalSearch';
import { useEnrichedSequences, usePulseMetrics } from '@/hooks/useNurturingSequences';

export default function LeadEngine() {
  const [menuOpen, setMenuOpen] = useState(false);
  
  const { data: sequences = [] } = useEnrichedSequences();
  const { data: metrics } = usePulseMetrics();
  
  // Active sequences for search
  const activeSequences = sequences.filter(s => s.status === 'active' || s.status === 'paused');
  
  // Critical count for notification badge
  const criticalCount = sequences.filter(s => 
    s.status === 'active' && 
    (s.sequenceType.includes('urgent') || s.sequenceType.includes('replacement'))
  ).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Menu + Company */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-foreground">ACME Plumbing</h1>
                <p className="text-xs text-muted-foreground">Dashboard</p>
              </div>
            </div>
          </div>
          
          {/* Center: Global Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <SequenceGlobalSearch sequences={sequences} />
          </div>
          
          {/* Right: Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-destructive-foreground rounded-full flex items-center justify-center font-medium">
                {criticalCount > 9 ? '9+' : criticalCount}
              </span>
            )}
          </Button>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <SequenceGlobalSearch sequences={sequences} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Pulse Hero Widget */}
        <DashboardPulseHero />
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PipelineSummaryCard />
          <WeeklyStatsCard />
        </div>
        
        {/* Activity Feed */}
        <RecentActivityFeed />
      </main>

      {/* Menu Drawer */}
      <ContractorMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </div>
  );
}
