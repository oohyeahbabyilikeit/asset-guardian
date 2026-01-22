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
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    selectedBg: 'bg-red-500/20',
    selectedBorder: 'border-red-500',
  },
  orange: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    selectedBg: 'bg-orange-500/20',
    selectedBorder: 'border-orange-500',
  },
  yellow: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    selectedBg: 'bg-yellow-500/20',
    selectedBorder: 'border-yellow-500',
  },
  green: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    selectedBg: 'bg-green-500/20',
    selectedBorder: 'border-green-500',
  },
};

export function StatCard({ label, count, color, onClick, isSelected }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg border p-3 text-center transition-all duration-200',
        'hover:scale-105 active:scale-95',
        isSelected 
          ? `${colors.selectedBg} ${colors.selectedBorder}` 
          : `${colors.bg} ${colors.border}`,
        onClick && 'cursor-pointer'
      )}
    >
      <div className={cn('text-2xl font-bold', colors.text)}>
        {count}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {label}
      </div>
    </button>
  );
}
