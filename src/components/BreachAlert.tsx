import { AlertTriangle, Droplets, XCircle, Camera, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import containmentBreachImg from '@/assets/containment-breach.png';

interface BreachAlertProps {
  isLeaking?: boolean;
  visualRust?: boolean;
  leakSource?: string;
  onLearnMore?: () => void;
  className?: string;
  /** Actual inspection photo URL - if provided, shown instead of stock image */
  conditionPhotoUrl?: string;
}

/**
 * BreachAlert - A prominent, unmissable alert for critical containment failures.
 * 
 * This component renders a LARGE, attention-grabbing banner when rust or leaks
 * are detected. It explains WHY this finding is critical and what it means for
 * the health score.
 */
export function BreachAlert({ 
  isLeaking, 
  visualRust, 
  leakSource,
  onLearnMore,
  className,
  conditionPhotoUrl
}: BreachAlertProps) {
  // Don't render if no breach condition
  if (!isLeaking && !visualRust) return null;

  // Determine breach type for messaging
  const isTankBodyLeak = leakSource === 'TANK_BODY' || (isLeaking && !leakSource);
  const isMinorLeak = isLeaking && leakSource && leakSource !== 'TANK_BODY';
  
  // Get the appropriate title and description
  const getBreachInfo = () => {
    if (isTankBodyLeak) {
      return {
        icon: Droplets,
        title: 'Tank Breach Detected',
        subtitle: 'Active leak from tank body',
        description: 'Water leaking from the tank itself indicates internal corrosion has penetrated the steel liner. This is an irreversible failure requiring immediate replacement.',
        severity: 'critical' as const,
      };
    }
    if (visualRust && isLeaking) {
      return {
        icon: XCircle,
        title: 'Containment Failure',
        subtitle: 'Rust + active leak detected',
        description: 'Visible rust combined with water leakage indicates advanced corrosion. The tank has lost structural integrity and could fail catastrophically.',
        severity: 'critical' as const,
      };
    }
    if (visualRust) {
      return {
        icon: AlertTriangle,
        title: 'Corrosion Breach Detected',
        subtitle: 'Visible rust on tank exterior',
        description: 'External rust indicates the protective coating has failed. Once rust appears externally, internal corrosion is typically much worse. Failure is imminent.',
        severity: 'critical' as const,
      };
    }
    if (isMinorLeak) {
      return {
        icon: Droplets,
        title: 'Leak Detected',
        subtitle: `Source: ${leakSource?.replace(/_/g, ' ').toLowerCase()}`,
        description: 'A fitting or valve leak may be repairable, but should be addressed immediately to prevent water damage and to rule out tank failure.',
        severity: 'warning' as const,
      };
    }
    return {
      icon: AlertTriangle,
      title: 'Issue Detected',
      subtitle: 'Inspection required',
      description: 'A potential issue has been identified that requires professional evaluation.',
      severity: 'warning' as const,
    };
  };

  const breach = getBreachInfo();
  const Icon = breach.icon;
  const isCritical = breach.severity === 'critical';

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border-2",
        isCritical 
          ? "border-red-500/60 bg-gradient-to-br from-red-950/80 via-red-900/60 to-red-950/80" 
          : "border-amber-500/60 bg-gradient-to-br from-amber-950/80 via-amber-900/60 to-amber-950/80",
        className
      )}
    >
      {/* Animated pulse border effect */}
      <div className={cn(
        "absolute inset-0 rounded-xl animate-pulse",
        isCritical ? "bg-red-500/10" : "bg-amber-500/10"
      )} />
      
      {/* Top warning bar */}
      <div className={cn(
        "relative flex items-center justify-center gap-2 py-2 px-4",
        isCritical 
          ? "bg-red-500/30 border-b border-red-500/40" 
          : "bg-amber-500/30 border-b border-amber-500/40"
      )}>
        <AlertTriangle className={cn(
          "w-4 h-4 animate-pulse",
          isCritical ? "text-red-400" : "text-amber-400"
        )} />
        <span className={cn(
          "text-xs font-bold uppercase tracking-widest",
          isCritical ? "text-red-300" : "text-amber-300"
        )}>
          {isCritical ? 'Critical Finding — Health Score Capped at 3%' : 'Warning — Requires Attention'}
        </span>
        <AlertTriangle className={cn(
          "w-4 h-4 animate-pulse",
          isCritical ? "text-red-400" : "text-amber-400"
        )} />
      </div>

      {/* Main content */}
      <div className="relative p-4">
        <div className="flex gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
            isCritical 
              ? "bg-red-500/20 border border-red-500/40" 
              : "bg-amber-500/20 border border-amber-500/40"
          )}>
            <Icon className={cn(
              "w-7 h-7",
              isCritical ? "text-red-400" : "text-amber-400"
            )} />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-lg font-bold mb-0.5",
              isCritical ? "text-red-300" : "text-amber-300"
            )}>
              {breach.title}
            </h3>
            <p className={cn(
              "text-sm font-medium mb-2",
              isCritical ? "text-red-400/80" : "text-amber-400/80"
            )}>
              {breach.subtitle}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {breach.description}
            </p>
          </div>
        </div>

        {/* Evidence photo for critical breaches */}
        {isCritical && (
          <div className="mt-4 relative rounded-lg overflow-hidden border border-red-500/30">
            <img 
              src={conditionPhotoUrl || containmentBreachImg} 
              alt={conditionPhotoUrl ? "Documented evidence of tank failure" : "Example of breach evidence"} 
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs text-red-200/80">
              <Camera className="w-3 h-3" />
              <span>{conditionPhotoUrl ? "Photo from your inspection" : "Example of breach evidence"}</span>
            </div>
          </div>
        )}

        {/* What this means section */}
        {isCritical && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-300 mb-1">Why is my health score so low?</p>
                <p className="text-xs text-red-200/70">
                  Visible rust or tank leaks are <strong>definitive failure indicators</strong>. 
                  No amount of maintenance can reverse steel corrosion. The algorithm sets failure 
                  probability to 99.9%, resulting in a health score of 2-3/100.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Learn more button */}
        {onLearnMore && (
          <button
            onClick={onLearnMore}
            className={cn(
              "mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-colors",
              isCritical 
                ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30" 
                : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
            )}
          >
            <span>View Risk Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
