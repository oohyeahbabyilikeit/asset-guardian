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
  // Layout control - static mode for animated wrapper usage
  position?: 'fixed' | 'static';
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
  position = 'fixed',
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
  
  // Dynamic CTA based on three-tier escalation system:
  // 🔴 RED TIER: Safety critical / code violations → "View Safety Recommendations"
  // 🟡 YELLOW TIER: Maintenance, upgrades, near end-of-life → "See My Options"  
  // 🟢 GREEN TIER: Healthy, no issues → "See Maintenance Plan"
  
  const getEscalationTier = (): 'red' | 'yellow' | 'green' => {
    if (!recommendation) return 'yellow';
    
    // RED TIER: Safety critical or code violations
    if (recommendation.badge === 'CRITICAL') {
      return 'red';
    }
    
    // GREEN TIER: No issues, healthy system
    if (recommendation.action === 'PASS' && recommendation.badge === 'OPTIMAL') {
      return 'green';
    }
    
    // GREEN TIER: Maintenance monitoring with no urgent needs
    if (recommendation.action === 'PASS' && !needsServiceAttention) {
      return 'green';
    }
    
    // YELLOW TIER: Everything else (replacements, upgrades, service, overdue maintenance)
    return 'yellow';
  };
  
  const escalationTier = getEscalationTier();
  
  // Consultative CTA labels by tier
  const getButtonLabel = () => {
    if (!recommendation) return 'Speak with a Plumber';
    
    switch (escalationTier) {
      case 'red':
        return 'Get Expert Advice Now';
      case 'green':
        return 'Get Maintenance Tips';
      case 'yellow':
      default:
        return 'Speak with a Plumber';
    }
  };
  
  // Apply styling based on escalation tier
  const isRedTier = escalationTier === 'red';
  const isYellowTier = escalationTier === 'yellow';
  const isGreenTier = escalationTier === 'green';
  
  const containerClasses = position === 'fixed' 
    ? "fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border p-4 safe-area-bottom"
    : "bg-card/90 backdrop-blur-md border-t border-border p-4 safe-area-bottom";
  
  return (
    <div 
      className={containerClasses}
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
            isRedTier 
              ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
              : isYellowTier
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          style={{
            boxShadow: isRedTier 
              ? '0 4px 24px -4px rgba(239, 68, 68, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              : isYellowTier
              ? '0 4px 24px -4px rgba(217, 119, 6, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)'
              : '0 4px 24px -4px rgba(16, 185, 129, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
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
