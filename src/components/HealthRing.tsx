import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HealthRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function HealthRing({ score, size = 'lg', showLabel = true, className }: HealthRingProps) {
  const sizes = {
    sm: { ring: 80, stroke: 6, text: 'text-xl' },
    md: { ring: 120, stroke: 8, text: 'text-3xl' },
    lg: { ring: 160, stroke: 10, text: 'text-5xl' },
  };
  
  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const offset = circumference - (progress / 100) * circumference;
  
  // Color based on score
  const getColors = () => {
    if (score < 30) return {
      ring: 'stroke-destructive',
      bg: 'stroke-destructive/20',
      glow: 'hsl(var(--destructive))',
      text: 'text-destructive',
      label: 'Needs Attention'
    };
    if (score < 60) return {
      ring: 'stroke-amber-500',
      bg: 'stroke-amber-500/20',
      glow: 'hsl(45 93% 47%)',
      text: 'text-amber-500',
      label: 'Fair Condition'
    };
    return {
      ring: 'stroke-emerald-500',
      bg: 'stroke-emerald-500/20',
      glow: 'hsl(160 84% 39%)',
      text: 'text-emerald-500',
      label: 'Healthy'
    };
  };
  
  const colors = getColors();
  
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: colors.glow }}
        />
        
        <svg
          width={ring}
          height={ring}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            className={colors.bg}
          />
          
          {/* Progress ring */}
          <motion.circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            className={colors.ring}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn("font-bold", text, colors.text)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {score}
          </motion.span>
          {size === 'lg' && (
            <motion.span 
              className="text-xs text-muted-foreground font-medium uppercase tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Health
            </motion.span>
          )}
        </div>
      </div>
      
      {showLabel && (
        <motion.p
          className={cn("text-sm font-medium", colors.text)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {colors.label}
        </motion.p>
      )}
    </div>
  );
}
