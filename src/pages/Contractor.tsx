import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </Link>
          
          <h1 className="text-lg font-bold text-foreground">Contractor Dashboard</h1>
          
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            {counts.critical > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center">
                {counts.critical}
              </span>
            )}
          </Button>
        </div>
      </header>
      
      <main className="p-4 space-y-6 pb-8">
        {/* Priority Stats */}
        <div className="grid grid-cols-4 gap-3">
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
