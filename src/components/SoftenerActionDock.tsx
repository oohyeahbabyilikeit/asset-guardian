import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SoftenerRecommendation } from '@/lib/softenerAlgorithm';

interface SoftenerActionDockProps {
  onServiceRequest: () => void;
  onEmergency: () => void;
  onMaintenanceTips: () => void;
  recommendation?: SoftenerRecommendation;
  hasActiveServices: boolean;
}

export function SoftenerActionDock({ 
  onServiceRequest, 
  onEmergency,
  onMaintenanceTips,
  recommendation,
  hasActiveServices
}: SoftenerActionDockProps) {
  
  // Determine urgency from recommendation
  const isCritical = recommendation?.badge === 'RESIN_FAILURE' || 
                     recommendation?.badge === 'MECHANICAL_FAILURE';
  const isServiceUrgent = recommendation?.badge === 'SEAL_WEAR' || 
                          recommendation?.badge === 'RESIN_DEGRADED';
  
  // Dynamic CTA based on urgency
  const getButtonLabel = () => {
    if (!recommendation) return 'View Service Options';
    
    // Critical failures
    if (isCritical) {
      return 'Schedule Replacement Consultation';
    }
    
    // Service needed
    if (isServiceUrgent) {
      return 'Schedule Service Visit';
    }
    
    // Has recommended services
    if (hasActiveServices) {
      return 'View Service Options';
    }
    
    // Healthy
    if (recommendation.badge === 'HEALTHY') {
      return 'View Maintenance Tips';
    }
    
    return 'Contact Your Plumber';
  };
  
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
          onClick={() => {
            // If healthy with no active services, show tips
            if (recommendation?.badge === 'HEALTHY' && !hasActiveServices) {
              onMaintenanceTips();
            } else {
              onServiceRequest();
            }
          }}
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
          onClick={onEmergency}
          className="text-sm text-red-400 hover:text-red-300 transition-colors underline-offset-4 hover:underline"
        >
          Emergency / Report Problem
        </button>
      </div>
    </div>
  );
}
