import { Link } from 'react-router-dom';
import { ClipboardList, Building2, FileBarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface QuickActionsProps {
  compact?: boolean;
}

export function QuickActions({ compact = false }: QuickActionsProps) {
  const handleReports = () => {
    toast.info('Reports coming soon');
  };

  const actions = [
    { icon: ClipboardList, label: 'Inspect', shortLabel: 'Inspect', to: '/?mode=technician' },
    { icon: Building2, label: 'View Properties', shortLabel: 'Props', onClick: () => toast.info('Properties view coming soon') },
    { icon: FileBarChart, label: 'Reports', shortLabel: 'Reports', onClick: handleReports },
  ];

  if (compact) {
    return (
      <div className="bg-card rounded-lg border border-border p-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {actions.map((action) => 
            action.to ? (
              <Link key={action.label} to={action.to}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.shortLabel}
                </Button>
              </Link>
            ) : (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                onClick={action.onClick}
                className="w-full justify-start gap-2 h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                <action.icon className="w-3.5 h-3.5" />
                {action.shortLabel}
              </Button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium text-foreground mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <Link to="/?mode=technician">
          <Button 
            variant="ghost" 
            className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-border hover:bg-secondary hover:border-border"
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-foreground">Start Inspection</span>
          </Button>
        </Link>
        
        <Button 
          variant="ghost" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-border hover:bg-secondary hover:border-border"
          onClick={() => toast.info('Properties view coming soon')}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground">View Properties</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full h-auto py-4 flex flex-col items-center gap-2 border border-border hover:bg-secondary hover:border-border"
          onClick={handleReports}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground">Reports</span>
        </Button>
      </div>
    </div>
  );
}
