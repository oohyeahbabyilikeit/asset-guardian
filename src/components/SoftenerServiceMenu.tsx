import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, Droplets, RefreshCw, Shield, ChevronRight, AlertTriangle } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  trigger: string;
  pitch: string;
  priority: 'urgent' | 'recommended' | 'preventive';
  icon: React.ElementType;
}

interface SoftenerServiceMenuProps {
  services: ServiceItem[];
  onSchedule?: (serviceId: string) => void;
}

const priorityConfig = {
  urgent: {
    badge: 'Urgent',
    badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30',
    borderClass: 'border-red-500/30',
  },
  recommended: {
    badge: 'Recommended',
    badgeClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    borderClass: 'border-yellow-500/30',
  },
  preventive: {
    badge: 'Preventive',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    borderClass: 'border-border',
  },
};

const defaultServices: ServiceItem[] = [
  {
    id: 'valve-rebuild',
    name: 'Valve Rebuild',
    price: 350,
    trigger: 'Odometer > 600 cycles',
    pitch: 'Your softener transmission has shifted over 600 times. The rubber seals are rated for 600. They are likely leaking water down the drain 24/7.',
    priority: 'recommended',
    icon: Wrench,
  },
  {
    id: 'resin-detox',
    name: 'Resin Detox',
    price: 199,
    trigger: 'Resin Health 40-75%',
    pitch: 'Your resin beads are coated in city grime. A chemical detox restores factory flow rates and extends resin life.',
    priority: 'preventive',
    icon: RefreshCw,
  },
  {
    id: 'resin-rebed',
    name: 'Resin Re-Bed',
    price: 600,
    trigger: 'Resin Health < 40%',
    pitch: 'Your resin is shot. The system is burning salt but not softening water. New resin restores full capacity.',
    priority: 'urgent',
    icon: Droplets,
  },
  {
    id: 'carbon-filter',
    name: 'Carbon Pre-Filter',
    price: 299,
    trigger: 'City Water + No Carbon',
    pitch: 'City chlorine is destroying your resin twice as fast. A carbon filter blocks chlorine and doubles resin lifespan.',
    priority: 'recommended',
    icon: Shield,
  },
];

export function SoftenerServiceMenu({ 
  services = defaultServices,
  onSchedule 
}: SoftenerServiceMenuProps) {
  if (services.length === 0) {
    return (
      <Card className="p-6 bg-green-500/5 border-green-500/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
            <Shield className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No Service Needed</h3>
          <p className="text-sm text-muted-foreground">
            Your softener is operating within normal parameters.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <h3 className="font-semibold text-foreground">Recommended Services</h3>
      </div>
      
      {services.map((service) => {
        const config = priorityConfig[service.priority];
        const Icon = service.icon;
        
        return (
          <Card 
            key={service.id} 
            className={`p-4 bg-card border ${config.borderClass} hover:bg-muted/50 transition-colors`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                service.priority === 'urgent' ? 'bg-red-500/20' :
                service.priority === 'recommended' ? 'bg-yellow-500/20' :
                'bg-blue-500/20'
              }`}>
                <Icon className={`h-5 w-5 ${
                  service.priority === 'urgent' ? 'text-red-400' :
                  service.priority === 'recommended' ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">{service.name}</h4>
                  <Badge variant="outline" className={config.badgeClass}>
                    {config.badge}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground mb-2">
                  Trigger: {service.trigger}
                </p>
                
                <p className="text-sm text-foreground/80 mb-3">
                  {service.pitch}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">
                    ${service.price}
                  </span>
                  <Button 
                    size="sm" 
                    variant={service.priority === 'urgent' ? 'default' : 'outline'}
                    onClick={() => onSchedule?.(service.id)}
                    className="gap-1"
                  >
                    Schedule
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
