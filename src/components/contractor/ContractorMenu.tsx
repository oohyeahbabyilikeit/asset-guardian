import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Flame, 
  Settings, 
  BarChart3, 
  Plus, 
  RefreshCw, 
  LogOut,
  Building2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ContractorMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/contractor' },
  { label: 'Lead Engine', icon: Flame, path: '/contractor' },
  { label: 'Sequences', icon: Zap, path: '/contractor/sequences' },
  { label: 'Reports', icon: BarChart3, path: '/contractor/reports' },
  { label: 'Settings', icon: Settings, path: '/contractor/settings' },
];

const quickActions = [
  { label: 'Add Lead', icon: Plus },
  { label: 'Sync Now', icon: RefreshCw },
];

export function ContractorMenu({ open, onOpenChange }: ContractorMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleNavClick = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-72 bg-card/95 backdrop-blur-xl border-r border-white/10 p-0"
      >
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 border border-primary/30">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-base font-semibold text-foreground">
                ACME Plumbing
              </SheetTitle>
              <p className="text-xs text-muted-foreground">John Smith</p>
            </div>
          </div>
        </SheetHeader>
        
        <Separator className="bg-white/10" />
        
        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <item.icon className={cn('w-4 h-4', isActive && 'text-primary')} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <Separator className="bg-white/10 mx-3" />
        
        {/* Quick Actions */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Quick Actions
          </p>
          {quickActions.map((action) => (
            <button
              key={action.label}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          ))}
        </div>
        
        <Separator className="bg-white/10 mx-3" />
        
        {/* Logout */}
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
