import { Phone, FileText, X, Check, AlertTriangle, Droplets, Gauge, Thermometer, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { type MockOpportunity, getUnitSummary } from '@/data/mockContractorData';

interface AssetDetailDrawerProps {
  opportunity: MockOpportunity | null;
  open: boolean;
  onClose: () => void;
  onCall?: () => void;
  onViewReport?: () => void;
}

const priorityConfig = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  high: {
    label: 'HIGH',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  low: {
    label: 'LOW',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

function EquipmentItem({ 
  label, 
  present, 
  warning 
}: { 
  label: string; 
  present: boolean; 
  warning?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {warning && !present && (
          <span className="text-xs text-amber-400">{warning}</span>
        )}
        {present ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Installed</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <X className="w-4 h-4" />
            <span className="text-xs">Not Present</span>
          </span>
        )}
      </div>
    </div>
  );
}

function MetricItem({ 
  icon: Icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ElementType;
  label: string; 
  value: string; 
  status?: 'normal' | 'warning' | 'critical';
}) {
  const statusColors = {
    normal: 'text-foreground',
    warning: 'text-amber-400',
    critical: 'text-red-400',
  };
  
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-sm font-medium', statusColors[status || 'normal'])}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function AssetDetailDrawer({ 
  opportunity, 
  open, 
  onClose, 
  onCall,
  onViewReport 
}: AssetDetailDrawerProps) {
  if (!opportunity) return null;
  
  const { asset, forensicInputs, priority } = opportunity;
  const config = priorityConfig[priority];
  
  // Derive status for metrics
  const psiStatus = forensicInputs.housePsi && forensicInputs.housePsi > 80 
    ? 'critical' 
    : forensicInputs.housePsi && forensicInputs.housePsi > 70 
      ? 'warning' 
      : 'normal';
      
  const hardnessStatus = (forensicInputs.measuredHardnessGPG || forensicInputs.streetHardnessGPG || forensicInputs.hardnessGPG || 0) > 15
    ? 'warning'
    : 'normal';
  
  // Check if warranty is expired
  const warrantyExpired = asset.calendarAge > asset.warrantyYears;
  
  // Health score color - dark mode optimized
  const healthColor = opportunity.healthScore <= 40 
    ? 'text-red-400' 
    : opportunity.healthScore <= 69 
      ? 'text-amber-400' 
      : 'text-emerald-400';
  
  const healthBg = opportunity.healthScore <= 40 
    ? 'bg-red-500/10' 
    : opportunity.healthScore <= 69 
      ? 'bg-amber-500/10' 
      : 'bg-emerald-500/10';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 bg-background z-10 p-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-foreground truncate">
                {opportunity.customerName || 'Unknown Customer'}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {opportunity.propertyAddress}
              </p>
              {opportunity.customerPhone && (
                <p className="text-sm text-muted-foreground/70 mt-0.5">
                  {opportunity.customerPhone}
                </p>
              )}
            </div>
            <Badge variant="outline" className={cn('flex-shrink-0', config.className)}>
              {config.label}
            </Badge>
          </div>
        </SheetHeader>
        
        <div className="p-4 space-y-5">
          {/* Unit Profile */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Unit Profile
            </h3>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {asset.brand}
                </span>
                <span className="text-sm text-muted-foreground">
                  {asset.capacity}-Gal {asset.fuelType === 'GAS' ? 'Gas' : 'Electric'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {getUnitSummary(asset)}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border mt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Serial</p>
                  <p className="text-xs font-mono text-foreground truncate">{asset.serialNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="text-xs font-mono text-foreground truncate">{asset.model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Warranty</p>
                  <p className={cn(
                    'text-xs font-medium',
                    warrantyExpired ? 'text-destructive' : 'text-foreground'
                  )}>
                    {warrantyExpired ? 'EXPIRED' : `${asset.warrantyYears - asset.calendarAge}yr remaining`}
                    {' '}({asset.warrantyYears}yr)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vent Type</p>
                  <p className="text-xs text-foreground">{asset.ventType}</p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Health Status */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Health Status
            </h3>
            <div className={cn('rounded-lg p-4 text-center', healthBg)}>
              <div className={cn('text-4xl font-bold', healthColor)}>
                {opportunity.healthScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Health Score
              </p>
              {opportunity.healthScore < 50 && (
                <div className="flex items-center justify-center gap-1.5 mt-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-medium">Elevated Failure Risk</span>
                </div>
              )}
            </div>
          </section>
          
          {/* Installed Equipment */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Installed Equipment
            </h3>
            <div className="bg-muted/50 rounded-lg px-3">
              <EquipmentItem 
                label="PRV (Pressure Reducing Valve)" 
                present={forensicInputs.hasPrv || false} 
                warning={forensicInputs.housePsi && forensicInputs.housePsi > 80 ? 'Required' : undefined}
              />
              <EquipmentItem 
                label="Expansion Tank" 
                present={forensicInputs.hasExpTank || false}
                warning={forensicInputs.isClosedLoop ? 'Required' : undefined}
              />
              <EquipmentItem 
                label="Water Softener" 
                present={forensicInputs.hasSoftener || false}
                warning={(forensicInputs.measuredHardnessGPG || forensicInputs.streetHardnessGPG || forensicInputs.hardnessGPG || 0) > 15 ? 'Recommended' : undefined}
              />
              <EquipmentItem 
                label="Recirculation Pump" 
                present={forensicInputs.hasCircPump || false}
              />
            </div>
          </section>
          
          {/* Key Readings */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Key Readings
            </h3>
            <div className="bg-muted/50 rounded-lg px-3 divide-y divide-border">
              <MetricItem 
                icon={Gauge}
                label="House PSI"
                value={forensicInputs.housePsi ? `${forensicInputs.housePsi} PSI` : 'Not measured'}
                status={psiStatus}
              />
              <MetricItem 
                icon={Droplets}
                label="Water Hardness"
                value={forensicInputs.measuredHardnessGPG 
                  ? `${forensicInputs.measuredHardnessGPG} GPG` 
                  : forensicInputs.streetHardnessGPG 
                    ? `~${forensicInputs.streetHardnessGPG} GPG (est.)` 
                    : forensicInputs.hardnessGPG
                      ? `${forensicInputs.hardnessGPG} GPG`
                      : 'Unknown'}
                status={hardnessStatus}
              />
              <MetricItem 
                icon={Thermometer}
                label="Temperature Setting"
                value={forensicInputs.tempSetting || 'Unknown'}
              />
              <MetricItem 
                icon={Building2}
                label="System Type"
                value={forensicInputs.isClosedLoop ? 'Closed Loop' : 'Open Loop'}
              />
            </div>
          </section>
          
          {/* Why Flagged */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Why Flagged
            </h3>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-sm text-foreground leading-relaxed">
                {opportunity.context}
              </p>
            </div>
          </section>
        </div>
        
        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 gap-2"
            onClick={() => {
              if (opportunity.customerPhone) {
                window.location.href = `tel:${opportunity.customerPhone}`;
              }
              onCall?.();
            }}
          >
            <Phone className="w-4 h-4" />
            Call Customer
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={onViewReport}
          >
            <FileText className="w-4 h-4" />
            View Report
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
