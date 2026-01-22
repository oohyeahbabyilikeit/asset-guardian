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
    <div className="min-h-screen bg-slate-50">
      {/* Header - Clean white with subtle shadow */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-slate-800">Service Dashboard</h1>
          </div>
          
          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-800 hover:bg-slate-100">
            <Bell className="w-5 h-5" />
            {counts.critical > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-medium">
                {counts.critical}
              </span>
            )}
          </Button>
        </div>
      </header>
      
      <main className="p-4 space-y-5 pb-8 max-w-3xl mx-auto">
        {/* Priority Stats - Clean cards */}
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
