import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recommendation, ActionType } from '@/lib/opterraAlgorithm';

interface ActionDockProps {
  onPanicMode: () => void;
  onFixPressure: () => void;
  onViewReport: () => void;
  onMaintenancePlan?: () => void;
  recommendation?: Recommendation;
  monthsToFlush?: number | null;
  flushStatus?: 'optimal' | 'schedule' | 'due' | 'lockout';
}

export function ActionDock({ 
  onPanicMode, 
  onFixPressure, 
  onViewReport,
  onMaintenancePlan,
  recommendation,
  monthsToFlush,
  flushStatus
}: ActionDockProps) {
  // Check if service is due soon (within 6 months) or overdue
  const isServiceDueSoon = monthsToFlush !== null && monthsToFlush !== undefined && monthsToFlush <= 6 && monthsToFlush > 0;
  const isServiceOverdue = flushStatus === 'due' || flushStatus === 'lockout' || (monthsToFlush !== null && monthsToFlush !== undefined && monthsToFlush <= 0);
  const needsServiceAttention = isServiceDueSoon || isServiceOverdue;
  
  // Dynamic CTA based on urgency tier
  const getButtonLabel = () => {
    if (!recommendation) return 'See What Others Do';
    
    // Tier 0/1 (Critical Safety) - Safety focus
    if (recommendation.badge === 'CRITICAL' as const) {
      return 'View Safety Recommendations';
    }
    
    // Tier 2C (Economic Replacement) - Planning focus, not alarming
    if (recommendation.action === 'REPLACE') {
      return 'Plan Your Upgrade';
    }
    
    // Service is overdue - soft but clear urgency
    if (isServiceOverdue) {
      return "Let's Get This Taken Care Of";
    }
    
    // Service due within 6 months - gentle nudge
    if (isServiceDueSoon) {
      return 'Time to Schedule Service';
    }
    
    // Tier 2/3 (Service) - Service focus
    if (recommendation.badge === 'SERVICE' || recommendation.action === 'REPAIR' || recommendation.action === 'UPGRADE') {
      return 'View Service Options';
    }
    
    // Tier 4 (Green) - Maintenance focus
    if (recommendation.action === 'PASS' || recommendation.badge === 'OPTIMAL') {
      return 'View Maintenance Plan';
    }
    
    return 'Explore My Options';
  };
  
  // Only apply urgent red styling to actual safety issues, not economic replacements
  const isCritical = recommendation?.badge === ('CRITICAL' as const);
  // Amber styling for service attention needed
  const isServiceUrgent = needsServiceAttention && !isCritical && recommendation?.action !== 'REPLACE';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4 safe-area-bottom"
      style={{
        boxShadow: '0 -8px 32px -8px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Gradient fade above dock */}
      <div className="absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      <div className="max-w-md mx-auto">
        {/* Primary Action with glow - enhanced for critical */}
        <Button
          onClick={onFixPressure}
          size="lg"
          className={`w-full font-bold py-4 h-auto rounded-xl active:scale-[0.98] transition-all text-base ${
            isCritical 
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
              : isServiceUrgent
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          }`}
          style={{
            boxShadow: isCritical 
              ? '0 4px 24px -4px rgba(239, 68, 68, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              : isServiceUrgent
              ? '0 4px 24px -4px rgba(217, 119, 6, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              : '0 4px 24px -4px hsl(24 95% 53% / 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
          }}
        >
          <span className="truncate">{getButtonLabel()}</span>
          <ChevronRight className="w-5 h-5 ml-2 flex-shrink-0" />
        </Button>
      </div>
      
      {/* Secondary links */}
      <div className="max-w-md mx-auto mt-3 flex items-center justify-center gap-4">
        {onMaintenancePlan && recommendation?.action !== 'REPLACE' && recommendation?.badge !== 'CRITICAL' && (
          <button 
            onClick={onMaintenancePlan}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            View Maintenance Plan
          </button>
        )}
        <button 
          onClick={onPanicMode}
          className="text-sm text-red-400 hover:text-red-300 transition-colors underline-offset-4 hover:underline"
        >
          Emergency / Report Problem
        </button>
      </div>
    </div>
  );
}
