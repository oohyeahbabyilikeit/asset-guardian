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
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <h3 className="font-medium text-gray-700 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/?mode=technician">
          <Button 
            variant="ghost" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
          >
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-xs font-medium text-gray-600">Start Inspection</span>
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
          onClick={() => toast.info('Properties view coming soon')}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
          <span className="text-xs font-medium text-gray-600">View Properties</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
          onClick={handlePricingSetup}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-gray-500" />
          </div>
          <span className="text-xs font-medium text-gray-600">Pricing Setup</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
          onClick={handleReports}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-gray-500" />
          </div>
          <span className="text-xs font-medium text-gray-600">Reports</span>
        </Button>
      </div>
    </div>
  );
}
