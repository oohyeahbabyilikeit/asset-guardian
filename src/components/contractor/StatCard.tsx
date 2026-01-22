import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  count: number;
  color: 'red' | 'orange' | 'yellow' | 'green';
  onClick?: () => void;
  isSelected?: boolean;
}

const colorClasses = {
  red: {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-red-600',
    dot: 'bg-red-500',
    selectedBg: 'bg-red-50',
    selectedBorder: 'border-red-300',
  },
  orange: {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-orange-600',
    dot: 'bg-orange-500',
    selectedBg: 'bg-orange-50',
    selectedBorder: 'border-orange-300',
  },
  yellow: {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    selectedBg: 'bg-amber-50',
    selectedBorder: 'border-amber-300',
  },
  green: {
    bg: 'bg-white',
    border: 'border-slate-200',
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    selectedBg: 'bg-emerald-50',
    selectedBorder: 'border-emerald-300',
  },
};

export function StatCard({ label, count, color, onClick, isSelected }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 text-center transition-all duration-200 shadow-sm',
        'hover:shadow-md active:scale-95',
        isSelected 
          ? `${colors.selectedBg} ${colors.selectedBorder}` 
          : `${colors.bg} ${colors.border} hover:border-slate-300`,
        onClick && 'cursor-pointer'
      )}
    >
      <div className={cn('text-2xl font-bold', colors.text)}>
        {count}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <div className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
        <span className="text-xs text-slate-600 font-medium">{label}</span>
      </div>
    </button>
  );
}
