import { Link } from 'react-router-dom';
import { ClipboardList, Building2, DollarSign, FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function QuickActions() {
  const handlePricingSetup = () => {
    toast.info('Pricing setup coming soon');
  };

  const handleReports = () => {
    toast.info('Reports coming soon');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/?mode=technician">
          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2"
          >
            <ClipboardList className="w-5 h-5 text-primary" />
            <span className="text-xs">Start Inspection</span>
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2"
          onClick={() => toast.info('Properties view coming soon')}
        >
          <Building2 className="w-5 h-5 text-primary" />
          <span className="text-xs">View Properties</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2"
          onClick={handlePricingSetup}
        >
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-xs">Pricing Setup</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2"
          onClick={handleReports}
        >
          <FileBarChart className="w-5 h-5 text-primary" />
          <span className="text-xs">Reports</span>
        </Button>
      </div>
    </div>
  );
}
