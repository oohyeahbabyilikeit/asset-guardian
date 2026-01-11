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
  AlertTriangle,
  Gauge,
  MapPin,
  Calendar,
  Shield
} from 'lucide-react';
import type { TechnicianInspectionData } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

function getUnitTypeIcon(fuelType: FuelType) {
  switch (fuelType) {
    case 'TANKLESS_GAS':
      return <Wind className="h-4 w-4" />;
    case 'TANKLESS_ELECTRIC':
      return <Zap className="h-4 w-4" />;
    case 'HYBRID':
      return <Droplets className="h-4 w-4" />;
    case 'ELECTRIC':
      return <Zap className="h-4 w-4" />;
    default:
      return <Flame className="h-4 w-4" />;
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

function formatLocation(location: string): string {
  return location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

interface HandoffStepProps {
  data: TechnicianInspectionData;
  onComplete: () => void;
}

export function HandoffStep({ data, onComplete }: HandoffStepProps) {
  const hasIssues = data.location.isLeaking || data.location.visualRust;
  
  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[hsl(var(--status-optimal))]/20 text-[hsl(var(--status-optimal))] mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Inspection Complete</h2>
        <p className="text-muted-foreground mt-1">
          All equipment data has been recorded
        </p>
      </div>
      
      {/* Critical Alerts */}
      {hasIssues && (
        <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Critical Issues Found</p>
              <ul className="text-sm text-muted-foreground mt-1.5 space-y-0.5">
                {data.location.isLeaking && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    Active leak detected
                  </li>
                )}
                {data.location.visualRust && (
                  <li className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-destructive" />
                    Visible rust or corrosion
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Summary Card */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Inspection Summary
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Unit Info Row */}
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getUnitTypeIcon(data.asset.fuelType)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {data.asset.brand || 'Unknown'} {getUnitTypeLabel(data.asset.fuelType)}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.asset.tankCapacity 
                  ? `${data.asset.tankCapacity} Gallon Tank`
                  : data.asset.ratedFlowGPM
                    ? `${data.asset.ratedFlowGPM} GPM Rated`
                    : 'Capacity Unknown'}
              </p>
            </div>
            {data.calendarAge > 0 && (
              <Badge variant="secondary" className="font-mono">
                {data.calendarAge} yr
              </Badge>
            )}
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pressure</p>
                <p className="text-sm font-medium">{data.measurements.housePsi} PSI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Hardness</p>
                <p className="text-sm font-medium">{data.streetHardnessGPG} GPG</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{formatLocation(data.location.location)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/50">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Softener</p>
                <p className="text-sm font-medium">
                  {data.softener.hasSoftener ? `Yes (${data.softener.saltStatus || 'OK'})` : 'None'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Equipment Badges */}
          {(data.equipment.hasExpTank || data.equipment.hasPrv || data.equipment.hasCircPump) && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {data.equipment.hasExpTank && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  Expansion Tank
                </Badge>
              )}
              {data.equipment.hasPrv && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  PRV
                </Badge>
              )}
              {data.equipment.hasCircPump && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  <CheckCircle className="h-3 w-3 mr-1 text-[hsl(var(--status-optimal))]" />
                  Circ Pump
                </Badge>
              )}
              {data.equipment.isClosedLoop && (
                <Badge variant="outline" className="text-xs bg-muted/50">
                  Closed Loop
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Handoff CTA */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Ready for Homeowner</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Hand the device to the homeowner to answer a few quick questions about their usage habits and service history.
            </p>
            <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>About 2 minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      <Button onClick={onComplete} className="w-full h-12 text-base font-semibold" size="lg">
        <span>Start Homeowner Questions</span>
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}
