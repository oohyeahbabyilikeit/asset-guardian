import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Recommendation, FuelType } from '@/lib/opterraAlgorithm';
import { getUnitCategory, getServiceStatus, getCTALabel } from '@/lib/unitTypeContent';

interface ActionDockProps {
  onPanicMode: () => void;
  onServiceRequest: () => void;
  onMaintenancePlan?: () => void;
  recommendation?: Recommendation;
  fuelType?: FuelType;
  // Tank-specific
  monthsToFlush?: number | null;
  flushStatus?: 'optimal' | 'schedule' | 'due' | 'lockout';
  // Tankless-specific
  monthsToDescale?: number | null;
  descaleStatus?: 'optimal' | 'schedule' | 'due' | 'lockout';
  // Hybrid-specific
  airFilterStatus?: 'CLEAN' | 'DIRTY' | 'CLOGGED';
}

export function ActionDock({ 
  onPanicMode, 
  onServiceRequest,
  onMaintenancePlan,
  recommendation,
  fuelType = 'GAS',
  monthsToFlush,
  flushStatus,
  monthsToDescale,
  descaleStatus,
  airFilterStatus,
}: ActionDockProps) {
  // Get unit-aware service status
  const serviceStatus = getServiceStatus(fuelType, {
    flushStatus,
    monthsToFlush,
    descaleStatus,
    monthsToDescale,
    airFilterStatus,
  });
  
  const { isOverdue: isServiceOverdue, isDueSoon: isServiceDueSoon } = serviceStatus;
  const needsServiceAttention = isServiceDueSoon || isServiceOverdue;
  
  // Determine which handler to use - maintenance plan for service-related CTAs
  const shouldGoToMaintenance = needsServiceAttention || 
    recommendation?.action === 'PASS' || 
    recommendation?.badge === 'OPTIMAL';
  
  const handlePrimaryClick = () => {
    if (shouldGoToMaintenance && onMaintenancePlan) {
      onMaintenancePlan();
    } else {
      onServiceRequest();
    }
  };
  
  // Dynamic CTA based on urgency tier and unit type
  const getButtonLabel = () => {
    if (!recommendation) return 'See What Others Do';
    
    // Tier 0/1 (Critical Safety) - Safety focus
    if (recommendation.badge === 'CRITICAL' as const) {
      return getCTALabel(fuelType, 'critical');
    }
    
    // Tier 2C (Economic Replacement) - Soft invitation to explore
    if (recommendation.action === 'REPLACE') {
      return getCTALabel(fuelType, 'replace');
    }
    
    // Service is overdue - unit-aware messaging
    if (isServiceOverdue) {
      return getCTALabel(fuelType, 'serviceOverdue');
    }
    
    // Service due soon - unit-aware messaging
    if (isServiceDueSoon) {
      return getCTALabel(fuelType, 'serviceDueSoon');
    }
    
    // Tier 2/3 (Service) - Service focus
    if (recommendation.badge === 'SERVICE' || recommendation.action === 'REPAIR' || recommendation.action === 'UPGRADE') {
      return getCTALabel(fuelType, 'service');
    }
    
    // Tier 4 (Green) - Maintenance focus
    if (recommendation.action === 'PASS' || recommendation.badge === 'OPTIMAL') {
      return getCTALabel(fuelType, 'optimal');
    }
    
    return getCTALabel(fuelType, 'default');
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
          onClick={handlePrimaryClick}
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
      
      {/* Secondary link - Emergency only */}
      <div className="max-w-md mx-auto mt-3 flex items-center justify-center">
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
