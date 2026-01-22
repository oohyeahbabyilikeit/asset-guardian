import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  FileText, 
  X, 
  Check, 
  AlertTriangle, 
  Droplets, 
  Gauge, 
  Thermometer, 
  Building2,
  Camera,
  Clock,
  Shield,
  TrendingUp,
  Wrench,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { type MockOpportunity, getUnitSummary, type ServiceHistoryEntry } from '@/data/mockContractorData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SalesCoachDrawer } from './SalesCoachDrawer';

interface PropertyReportDrawerProps {
  opportunity: MockOpportunity | null;
  open: boolean;
  onClose: () => void;
  onCall?: () => void;
  onEmail?: () => void;
}

const priorityConfig = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
  high: {
    label: 'HIGH',
    className: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  low: {
    label: 'LOW',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
};

// Photo Carousel Component
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <span className="text-xs">No photos available</span>
        </div>
      </div>
    );
  }
  
  const nextPhoto = () => setCurrentIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
      <img 
        src={photos[currentIndex]} 
        alt={`Inspection photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />
      
      {/* Photo counter badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1.5">
        <Camera className="w-3 h-3" />
        {currentIndex + 1} / {photos.length}
      </div>
      
      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button 
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {/* Thumbnail dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1">
          {photos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                idx === currentIndex ? "bg-white" : "bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Risk Metrics Card
function RiskMetricsCard({ opportunity }: { opportunity: MockOpportunity }) {
  const result = opportunity.opterraResult;
  
  // Calculate health score color
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
    <div className={cn("rounded-lg p-4", healthBg)}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn("text-4xl font-bold", healthColor)}>
          {opportunity.healthScore}
        </div>
        {result && (
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              result.verdictAction === 'REPLACE' 
                ? 'border-red-500/50 text-red-400 bg-red-500/10' 
                : result.verdictAction === 'MONITOR'
                  ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                  : 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
            )}
          >
            {result.verdictAction}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded bg-background/50">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Clock className="w-3 h-3" />
            <span className="text-xs">Bio Age</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {result?.bioAge?.toFixed(1) ?? '—'} yrs
          </div>
          <div className="text-[10px] text-muted-foreground">
            vs {opportunity.asset.calendarAge} calendar
          </div>
        </div>
        
        <div className="p-2 rounded bg-background/50">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-xs">Fail Risk</span>
          </div>
          <div className={cn(
            "text-sm font-semibold",
            opportunity.failProbability > 0.5 ? 'text-red-400' : 'text-foreground'
          )}>
            {(opportunity.failProbability * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-muted-foreground">
            12-month probability
          </div>
        </div>
        
        <div className="p-2 rounded bg-background/50">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Shield className="w-3 h-3" />
            <span className="text-xs">Shield Life</span>
          </div>
          <div className={cn(
            "text-sm font-semibold",
            (result?.shieldLife ?? 0) <= 0 ? 'text-red-400' : 'text-foreground'
          )}>
            {result?.shieldLife?.toFixed(1) ?? '—'} yrs
          </div>
          <div className="text-[10px] text-muted-foreground">
            anode protection
          </div>
        </div>
        
        <div className="p-2 rounded bg-background/50">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs">Risk Level</span>
          </div>
          <div className="text-sm font-semibold text-foreground">
            {result?.riskLevel ?? '—'} / 4
          </div>
          <div className="text-[10px] text-muted-foreground">
            severity tier
          </div>
        </div>
      </div>
    </div>
  );
}

// Equipment Checklist Item
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
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {warning && !present && (
          <span className="text-xs text-amber-400">{warning}</span>
        )}
        {present ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Yes</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <X className="w-4 h-4" />
            <span className="text-xs">No</span>
          </span>
        )}
      </div>
    </div>
  );
}

// Key Metric Item
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

// Service History Item
function ServiceHistoryItem({ event }: { event: ServiceHistoryEntry }) {
  const eventLabels: Record<ServiceHistoryEntry['eventType'], string> = {
    install: 'Installation',
    flush: 'Flush',
    anode_replace: 'Anode Replaced',
    inspection: 'Inspection',
    repair: 'Repair',
  };
  
  const eventIcons: Record<ServiceHistoryEntry['eventType'], React.ElementType> = {
    install: Building2,
    flush: Droplets,
    anode_replace: Shield,
    inspection: FileText,
    repair: Wrench,
  };
  
  const Icon = eventIcons[event.eventType];
  
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">
            {eventLabels[event.eventType]}
          </span>
          {event.cost && (
            <span className="text-xs text-muted-foreground">
              ${event.cost}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {event.eventDate.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        {event.notes && (
          <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
        )}
      </div>
    </div>
  );
}

export function PropertyReportDrawer({ 
  opportunity, 
  open, 
  onClose, 
  onCall,
  onEmail,
}: PropertyReportDrawerProps) {
  const [showSalesCoach, setShowSalesCoach] = useState(false);

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

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="sticky top-0 bg-card z-10 p-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base font-semibold text-foreground truncate">
                {opportunity.customerName || 'Unknown Customer'}
              </SheetTitle>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{opportunity.propertyAddress}</span>
              </div>
            </div>
            <Badge variant="outline" className={cn('flex-shrink-0', config.className)}>
              {config.label}
            </Badge>
          </div>
          
          {/* Contact quick actions */}
          <div className="flex items-center gap-2 mt-3">
            {opportunity.customerPhone && (
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1 gap-1.5 text-xs h-8"
                onClick={() => {
                  window.location.href = `tel:${opportunity.customerPhone}`;
                  onCall?.();
                }}
              >
                <Phone className="w-3 h-3" />
                {opportunity.customerPhone}
              </Button>
            )}
            {opportunity.customerEmail && (
              <Button 
                variant="outline" 
                size="sm"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  window.location.href = `mailto:${opportunity.customerEmail}`;
                  onEmail?.();
                }}
              >
                <Mail className="w-3 h-3" />
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-5">
            {/* Photo Gallery */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Camera className="w-3 h-3" />
                Inspection Photos
              </h3>
              <PhotoCarousel photos={opportunity.photoUrls || []} />
            </section>
            
            {/* Risk Analysis */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Risk Analysis
              </h3>
              <RiskMetricsCard opportunity={opportunity} />
            </section>
            
            {/* Unit Profile */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" />
                Unit Profile
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
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
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 mt-2">
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
                      warrantyExpired ? 'text-red-400' : 'text-foreground'
                    )}>
                      {warrantyExpired ? 'EXPIRED' : `${asset.warrantyYears - asset.calendarAge}yr remaining`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Vent Type</p>
                    <p className="text-xs text-foreground">{asset.ventType}</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Technician Notes */}
            {opportunity.inspectionNotes && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText className="w-3 h-3" />
                  Technician Notes
                </h3>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {opportunity.inspectionNotes}
                  </p>
                  {opportunity.lastInspectionDate && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      Inspected {opportunity.lastInspectionDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}
            
            {/* Installed Equipment */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Wrench className="w-3 h-3" />
                Installed Equipment
              </h3>
              <div className="bg-muted/30 rounded-lg px-3">
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
                <EquipmentItem 
                  label="Drain Pan" 
                  present={forensicInputs.hasDrainPan || false}
                  warning={forensicInputs.location === 'ATTIC' ? 'Required' : undefined}
                />
              </div>
            </section>
            
            {/* Key Readings */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Gauge className="w-3 h-3" />
                Key Readings
              </h3>
              <div className="bg-muted/30 rounded-lg px-3 divide-y divide-border/50">
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
                <MetricItem 
                  icon={User}
                  label="Household Size"
                  value={forensicInputs.peopleCount ? `${forensicInputs.peopleCount} people` : 'Unknown'}
                />
              </div>
            </section>
            
            {/* Service History */}
            {opportunity.serviceHistory && opportunity.serviceHistory.length > 0 && (
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Service History
                </h3>
                <div className="bg-muted/30 rounded-lg px-3">
                  {opportunity.serviceHistory.map((event) => (
                    <ServiceHistoryItem key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}
            
            {/* Why Flagged */}
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Why Flagged
              </h3>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-foreground leading-relaxed">
                  {opportunity.context}
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
        
        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-3">
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
            onClick={() => setShowSalesCoach(true)}
          >
            <Sparkles className="w-4 h-4" />
            Sales Coach
          </Button>
        </div>
      </SheetContent>

      {/* Sales Coach Overlay */}
      <SalesCoachDrawer
        open={showSalesCoach}
        onClose={() => setShowSalesCoach(false)}
        opportunity={opportunity}
      />
    </Sheet>
  );
}
