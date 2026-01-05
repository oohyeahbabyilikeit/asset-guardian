import { demoContractor } from '@/data/mockAsset';

export function DashboardHeader() {
  return (
    <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* Contractor Logo */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
          style={{ backgroundColor: demoContractor.accentColor }}
        >
          {demoContractor.name.charAt(0)}
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">
            Powered by
          </div>
          <div className="font-bold text-foreground leading-none">
            {demoContractor.name}
          </div>
        </div>
      </div>
      
      {/* User Avatar Placeholder */}
      <div className="w-8 h-8 bg-muted rounded-full border border-card shadow-sm flex items-center justify-center text-xs font-bold text-muted-foreground">
        HO
      </div>
    </header>
  );
}
