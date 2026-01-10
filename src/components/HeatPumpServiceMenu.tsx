import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wind, Droplets, Cpu, Thermometer, ChevronRight, AlertTriangle, Shield } from 'lucide-react';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  trigger: string;
  pitch: string;
  priority: 'urgent' | 'recommended' | 'preventive';
  icon: React.ElementType;
}

interface HeatPumpServiceMenuProps {
  filterCondition: 'clean' | 'dirty' | 'clogged';
  condensateClear: boolean;
  compressorHealth: number;
  ambientTemp: number;
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

export function HeatPumpServiceMenu({ 
  filterCondition,
  condensateClear,
  compressorHealth,
  ambientTemp,
  onSchedule,
}: HeatPumpServiceMenuProps) {
  
  // Build services list based on current conditions
  const services: ServiceItem[] = [];

  // Filter services
  if (filterCondition === 'clogged') {
    services.push({
      id: 'filter-replace',
      name: 'Air Filter Replacement',
      price: 45,
      trigger: 'Filter clogged',
      pitch: 'Your clogged filter is strangling airflow, forcing the compressor to work harder and shortening its life. Replace immediately to restore efficiency.',
      priority: 'urgent',
      icon: Wind,
    });
  } else if (filterCondition === 'dirty') {
    services.push({
      id: 'filter-clean',
      name: 'Air Filter Service',
      price: 35,
      trigger: 'Filter dirty',
      pitch: 'Your filter is collecting dust and reducing efficiency. Clean or replace to maintain optimal heat pump performance.',
      priority: 'recommended',
      icon: Wind,
    });
  }

  // Condensate services
  if (!condensateClear) {
    services.push({
      id: 'condensate-clear',
      name: 'Condensate Line Clearing',
      price: 125,
      trigger: 'Drain blocked',
      pitch: 'Blocked condensate drains cause water backup, potential leaks, and can damage the unit. Must be cleared to prevent water damage.',
      priority: 'urgent',
      icon: Droplets,
    });
  }

  // Compressor services
  if (compressorHealth < 50) {
    services.push({
      id: 'compressor-inspect',
      name: 'Compressor Inspection',
      price: 175,
      trigger: 'Compressor health < 50%',
      pitch: 'Your compressor is showing signs of wear. A professional inspection can identify issues before a complete failure occurs.',
      priority: 'urgent',
      icon: Cpu,
    });
  } else if (compressorHealth < 80) {
    services.push({
      id: 'compressor-service',
      name: 'Compressor Tune-Up',
      price: 150,
      trigger: 'Compressor health 50-80%',
      pitch: 'Routine maintenance can extend compressor life and maintain peak efficiency. Includes refrigerant check and coil cleaning.',
      priority: 'recommended',
      icon: Cpu,
    });
  }

  // Annual service
  services.push({
    id: 'annual-service',
    name: 'Annual Heat Pump Service',
    price: 199,
    trigger: 'Preventive maintenance',
    pitch: 'Comprehensive annual service includes coil cleaning, refrigerant check, electrical inspection, and efficiency optimization.',
    priority: 'preventive',
    icon: Thermometer,
  });

  if (services.length === 1 && services[0].id === 'annual-service') {
    return (
      <Card className="p-6 bg-green-500/5 border-green-500/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
            <Shield className="h-6 w-6 text-green-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">System Healthy</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your heat pump is operating within normal parameters.
          </p>
          <Button variant="outline" size="sm" onClick={() => onSchedule?.('annual-service')}>
            Schedule Annual Service
          </Button>
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
