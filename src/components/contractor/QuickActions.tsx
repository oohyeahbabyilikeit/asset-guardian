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
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        <Link to="/?mode=technician">
          <Button 
            variant="outline" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-700">Start Inspection</span>
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
          onClick={() => toast.info('Properties view coming soon')}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">View Properties</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
          onClick={handlePricingSetup}
        >
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">Pricing Setup</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
          onClick={handleReports}
        >
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-medium text-slate-700">Reports</span>
        </Button>
      </div>
    </div>
  );
}
