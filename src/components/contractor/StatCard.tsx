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
    bg: 'bg-rose-50/50',
    text: 'text-rose-600/80',
    dot: 'bg-rose-400',
    selectedBg: 'bg-rose-50',
    selectedBorder: 'border-rose-200',
  },
  orange: {
    bg: 'bg-orange-50/50',
    text: 'text-orange-600/80',
    dot: 'bg-orange-400',
    selectedBg: 'bg-orange-50',
    selectedBorder: 'border-orange-200',
  },
  yellow: {
    bg: 'bg-amber-50/50',
    text: 'text-amber-600/80',
    dot: 'bg-amber-400',
    selectedBg: 'bg-amber-50',
    selectedBorder: 'border-amber-200',
  },
  green: {
    bg: 'bg-emerald-50/50',
    text: 'text-emerald-600/80',
    dot: 'bg-emerald-400',
    selectedBg: 'bg-emerald-50',
    selectedBorder: 'border-emerald-200',
  },
};

export function StatCard({ label, count, color, onClick, isSelected }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 text-center transition-all duration-200',
        'hover:shadow-sm active:scale-[0.98]',
        isSelected 
          ? `${colors.selectedBg} ${colors.selectedBorder}` 
          : `${colors.bg} border-transparent hover:border-gray-200/50`,
        onClick && 'cursor-pointer'
      )}
    >
      <div className={cn('text-xl font-semibold', colors.text)}>
        {count}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <div className={cn('w-1.5 h-1.5 rounded-full opacity-60', colors.dot)} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </button>
  );
}
