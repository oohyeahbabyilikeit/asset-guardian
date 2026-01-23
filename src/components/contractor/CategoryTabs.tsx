import { cn } from '@/lib/utils';
import { Flame, AlertTriangle, Wrench } from 'lucide-react';
import { type LeadCategory } from '@/lib/opportunityCategories';

interface CategoryTabsProps {
  counts: {
    replacements: number;
    codeFixes: number;
    maintenance: number;
  };
  activeCategory: LeadCategory | null;
  onCategoryChange: (category: LeadCategory | null) => void;
}

const categories: { 
  key: LeadCategory; 
  label: string; 
  icon: React.ElementType;
  color: string;
  activeColor: string;
  activeBorder: string;
}[] = [
  { 
    key: 'replacements', 
    label: 'Replacements', 
    icon: Flame,
    color: 'text-rose-400/70',
    activeColor: 'bg-rose-500/20 text-rose-300',
    activeBorder: 'border-rose-500/40',
  },
  { 
    key: 'codeFixes', 
    label: 'Code Fixes', 
    icon: AlertTriangle,
    color: 'text-amber-400/70',
    activeColor: 'bg-amber-500/20 text-amber-300',
    activeBorder: 'border-amber-500/40',
  },
  { 
    key: 'maintenance', 
    label: 'Maintenance', 
    icon: Wrench,
    color: 'text-sky-400/70',
    activeColor: 'bg-sky-500/20 text-sky-300',
    activeBorder: 'border-sky-500/40',
  },
];

export function CategoryTabs({ counts, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All button */}
      <button
        onClick={() => onCategoryChange(null)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
          'border whitespace-nowrap',
          activeCategory === null
            ? 'bg-primary/20 text-primary border-primary/40 shadow-lg shadow-primary/10'
            : 'bg-card/80 text-muted-foreground border-white/5 hover:border-white/10 hover:bg-muted/50'
        )}
      >
        All
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          activeCategory === null ? 'bg-primary/30' : 'bg-muted'
        )}>
          {counts.replacements + counts.codeFixes + counts.maintenance}
        </span>
      </button>
      
      {categories.map(({ key, label, icon: Icon, color, activeColor, activeBorder }) => {
        const count = counts[key];
        const isActive = activeCategory === key;
        
        return (
          <button
            key={key}
            onClick={() => onCategoryChange(isActive ? null : key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
              'border whitespace-nowrap',
              isActive
                ? cn(activeColor, activeBorder, 'shadow-lg')
                : 'bg-card/80 text-muted-foreground border-white/5 hover:border-white/10 hover:bg-muted/50'
            )}
          >
            <Icon className={cn('w-3.5 h-3.5', isActive ? '' : color)} />
            {label}
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full',
              isActive ? 'bg-white/20' : 'bg-muted'
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
