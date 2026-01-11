import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  User, 
  Clock, 
  ArrowRight,
  Flame,
  Zap,
  Droplets,
  Wind,
  AlertTriangle
} from 'lucide-react';
import type { TechnicianInspectionData } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

function getUnitTypeIcon(fuelType: FuelType) {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return <Wind className="h-5 w-5" />;
    case 'TANKLESS_ELECTRIC':
      return <Zap className="h-5 w-5" />;
    case 'HYBRID':
      return <Droplets className="h-5 w-5" />;
    case 'ELECTRIC':
      return <Zap className="h-5 w-5" />;
    default:
      return <Flame className="h-5 w-5" />;
  }
}

function getUnitTypeLabel(fuelType: FuelType): string {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return 'Tankless Gas';
    case 'TANKLESS_ELECTRIC':
      return 'Tankless Electric';
    case 'HYBRID':
      return 'Hybrid Heat Pump';
    case 'ELECTRIC':
      return 'Electric Tank';
    default:
      return 'Gas Tank';
  }
}

interface HandoffStepProps {
  data: TechnicianInspectionData;
  onComplete: () => void;
}

export function HandoffStep({ data, onComplete }: HandoffStepProps) {
  const hasIssues = data.location.isLeaking || data.location.visualRust;
  
  const summaryItems = [
    {
      label: 'Unit Type',
      value: getUnitTypeLabel(data.asset.fuelType),
      icon: getUnitTypeIcon(data.asset.fuelType),
    },
    {
      label: 'Brand',
      value: data.asset.brand || 'Unknown',
    },
    {
      label: 'Capacity',
      value: data.asset.tankCapacity 
        ? `${data.asset.tankCapacity} Gallons`
        : data.asset.ratedFlowGPM
          ? `${data.asset.ratedFlowGPM} GPM`
          : 'Unknown',
    },
    {
      label: 'Age',
      value: data.calendarAge > 0 
        ? `${data.calendarAge} years`
        : 'Unknown',
    },
    {
      label: 'Location',
      value: data.location.location,
    },
    {
      label: 'Pressure',
      value: `${data.measurements.housePsi} PSI`,
    },
    {
      label: 'Hardness',
      value: `${data.streetHardnessGPG} GPG`,
    },
    {
      label: 'Softener',
      value: data.softener.hasSoftener 
        ? `Yes (${data.softener.saltStatus || 'Unknown'})`
        : 'No',
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Inspection Complete</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ready to hand off to the homeowner
        </p>
      </div>
      
      {/* Critical Alerts */}
      {hasIssues && (
        <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Critical Issues Found</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                {data.location.isLeaking && (
                  <li>• Active leak detected</li>
                )}
                {data.location.visualRust && (
                  <li>• Visible rust/corrosion</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Card */}
      <div className="bg-muted/50 rounded-lg border p-4">
        <h3 className="font-medium mb-4 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Inspection Summary
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {summaryItems.map((item) => (
            <div key={item.label} className="flex items-start gap-2">
              {item.icon && (
                <div className="text-muted-foreground mt-0.5">
                  {item.icon}
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Equipment Status */}
      <div className="flex flex-wrap gap-2">
        {data.equipment.hasExpTank && (
          <Badge variant="secondary">Exp Tank ✓</Badge>
        )}
        {data.equipment.hasPrv && (
          <Badge variant="secondary">PRV ✓</Badge>
        )}
        {data.equipment.hasCircPump && (
          <Badge variant="secondary">Circ Pump ✓</Badge>
        )}
        {data.equipment.isClosedLoop && (
          <Badge variant="outline">Closed Loop</Badge>
        )}
      </div>
      
      {/* Handoff Instructions */}
      <div className="p-6 bg-primary/5 rounded-lg border-2 border-dashed border-primary/30">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Ready for Homeowner</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Pass the device to the homeowner to answer a few quick questions about their usage and history.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Estimated time: 2 minutes</span>
        </div>
      </div>
      
      <Button onClick={onComplete} className="w-full" size="lg">
        <span>Start Homeowner Questions</span>
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}
