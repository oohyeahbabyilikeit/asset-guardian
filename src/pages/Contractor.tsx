import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/contractor/StatCard';
import { OpportunityFeed } from '@/components/contractor/OpportunityFeed';
import { PipelineOverview } from '@/components/contractor/PipelineOverview';
import { QuickActions } from '@/components/contractor/QuickActions';
import { 
  mockOpportunities, 
  getOpportunityCountsByPriority,
  type Priority 
} from '@/data/mockContractorData';

export default function Contractor() {
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  
  const counts = getOpportunityCountsByPriority(
    mockOpportunities.filter(o => o.status !== 'dismissed' && o.status !== 'converted')
  );
  
  const handlePriorityClick = (priority: Priority) => {
    setSelectedPriority(prev => prev === priority ? null : priority);
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      {/* Header - Soft, minimal */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200/60">
        <div className="flex items-center justify-between px-4 py-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-medium text-gray-700">Dashboard</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-gray-600 hover:bg-gray-100/50">
            <Bell className="w-5 h-5" />
            {counts.critical > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 text-[10px] text-white rounded-full flex items-center justify-center font-medium">
                {counts.critical}
              </span>
            )}
          </Button>
        </div>
      </header>
      
      <main className="p-4 space-y-6 pb-8 max-w-3xl mx-auto">
        {/* Priority Stats - Subtle cards */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard 
            label="Critical" 
            count={counts.critical} 
            color="red" 
            onClick={() => handlePriorityClick('critical')}
            isSelected={selectedPriority === 'critical'}
          />
          <StatCard 
            label="High" 
            count={counts.high} 
            color="orange" 
            onClick={() => handlePriorityClick('high')}
            isSelected={selectedPriority === 'high'}
          />
          <StatCard 
            label="Medium" 
            count={counts.medium} 
            color="yellow" 
            onClick={() => handlePriorityClick('medium')}
            isSelected={selectedPriority === 'medium'}
          />
          <StatCard 
            label="Low" 
            count={counts.low} 
            color="green" 
            onClick={() => handlePriorityClick('low')}
            isSelected={selectedPriority === 'low'}
          />
        </div>
        
        {/* Opportunity Feed */}
        <OpportunityFeed 
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
        />
        
        {/* Pipeline Overview */}
        <PipelineOverview />
        
        {/* Quick Actions */}
        <QuickActions />
      </main>
    </div>
  );
}
