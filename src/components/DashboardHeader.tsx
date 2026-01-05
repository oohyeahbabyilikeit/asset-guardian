import { User } from 'lucide-react';
import { demoContractor } from '@/data/mockAsset';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {demoContractor.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-status-optimal">●</span>
            <span>MONITORING ACTIVE</span>
          </div>
        </div>

        <button 
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
          aria-label="Profile"
        >
          <User className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Authorized Partner Badge */}
      <div className="px-4 pb-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Authorized Partner
        </span>
      </div>
    </header>
  );
}
