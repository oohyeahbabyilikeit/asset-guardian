import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  AlertTriangle, 
  Home,
  Droplets,
  Gauge,
  Shield,
  Flame,
  MapPin,
  ChevronDown,
  Thermometer,
  Box
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LocationCondition, EquipmentChecklist, SoftenerInspection } from '@/types/technicianInspection';
import type { TempSetting, LocationType } from '@/lib/opterraAlgorithm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * ExceptionToggleStep v8.0 - "5-Minute Flow" Optimization
 * 
 * Core philosophy: "Standard Install" is ONE TAP for 80% of jobs.
 * Only flag exceptions - don't ask every question.
 * 
 * Default state (Standard Install):
 * - Location: GARAGE
 * - isFinishedArea: false
 * - visualRust: false
 * - isLeaking: false
 * - tempSetting: NORMAL
 * - hasExpTank: false
 * - hasPrv: false
 * - hasCircPump: false
 * - hasSoftener: false
 * - connectionType: DIELECTRIC
 * - hasDrainPan: false (not in risky location)
 */

interface ExceptionToggleStepProps {
  locationData: LocationCondition;
  equipmentData: EquipmentChecklist;
  softenerData: SoftenerInspection;
  onLocationUpdate: (data: Partial<LocationCondition>) => void;
  onEquipmentUpdate: (data: Partial<EquipmentChecklist>) => void;
  onSoftenerUpdate: (data: Partial<SoftenerInspection>) => void;
  onNext: () => void;
}

interface ExceptionToggle {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'location' | 'risk' | 'safety' | 'equipment';
  isActive: boolean;
  onToggle: () => void;
  variant?: 'warning' | 'danger' | 'info';
}

const LOCATION_OPTIONS: { value: LocationType; label: string; isHighRisk?: boolean }[] = [
  { value: 'GARAGE', label: 'Garage' },
  { value: 'BASEMENT', label: 'Basement' },
  { value: 'ATTIC', label: 'Attic', isHighRisk: true },
  { value: 'UPPER_FLOOR', label: 'Upper Floor', isHighRisk: true },
  { value: 'MAIN_LIVING', label: 'Utility Closet', isHighRisk: true },
  { value: 'CRAWLSPACE', label: 'Crawlspace' },
  { value: 'EXTERIOR', label: 'Exterior' },
];

const TEMP_OPTIONS: { value: TempSetting; label: string; temp: string }[] = [
  { value: 'LOW', label: 'Low', temp: '~110°F' },
  { value: 'NORMAL', label: 'Normal', temp: '~120°F' },
  { value: 'HOT', label: 'Hot', temp: '~140°F' },
];

export function ExceptionToggleStep({
  locationData,
  equipmentData,
  softenerData,
  onLocationUpdate,
  onEquipmentUpdate,
  onSoftenerUpdate,
  onNext,
}: ExceptionToggleStepProps) {
  const [showExceptions, setShowExceptions] = useState(false);
  const [standardApplied, setStandardApplied] = useState(false);

  // Check if current state matches "standard install"
  const isStandardState = 
    locationData.location === 'GARAGE' &&
    !locationData.isFinishedArea &&
    !locationData.visualRust &&
    !locationData.isLeaking &&
    locationData.tempSetting === 'NORMAL' &&
    !equipmentData.hasExpTank &&
    !equipmentData.hasPrv &&
    !equipmentData.hasCircPump &&
    !softenerData.hasSoftener;

  // Count active exceptions
  const exceptionCount = [
    locationData.location !== 'GARAGE' && locationData.location !== 'BASEMENT',
    locationData.isFinishedArea,
    locationData.visualRust,
    locationData.isLeaking,
    locationData.tempSetting === 'HOT',
    equipmentData.connectionType === 'DIRECT_COPPER',
    !equipmentData.hasExpTank && equipmentData.hasPrv, // Closed loop without protection
    softenerData.hasSoftener,
  ].filter(Boolean).length;

  const isHighRiskLocation = ['ATTIC', 'UPPER_FLOOR', 'MAIN_LIVING'].includes(locationData.location);

  // Apply standard install defaults
  const applyStandardInstall = () => {
    onLocationUpdate({
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      isLeaking: false,
      tempSetting: 'NORMAL',
    });
    onEquipmentUpdate({
      hasExpTank: false,
      hasPrv: false,
      hasCircPump: false,
      isClosedLoop: false,
      connectionType: 'DIELECTRIC',
      hasDrainPan: false,
    });
    onSoftenerUpdate({
      hasSoftener: false,
    });
    setStandardApplied(true);
    setShowExceptions(false);
  };

  // Build exception toggles
  const exceptions: ExceptionToggle[] = [
    // Location exceptions
    {
      key: 'attic',
      label: 'Attic / Upper Floor',
      description: 'Higher damage potential',
      icon: <Home className="h-4 w-4" />,
      category: 'location',
      isActive: ['ATTIC', 'UPPER_FLOOR'].includes(locationData.location),
      onToggle: () => onLocationUpdate({ 
        location: locationData.location === 'ATTIC' ? 'GARAGE' : 'ATTIC' 
      }),
      variant: 'warning',
    },
    {
      key: 'finishedArea',
      label: 'Finished Living Area',
      description: 'In conditioned space',
      icon: <Home className="h-4 w-4" />,
      category: 'location',
      isActive: !!locationData.isFinishedArea,
      onToggle: () => onLocationUpdate({ isFinishedArea: !locationData.isFinishedArea }),
      variant: 'warning',
    },
    // Risk exceptions
    {
      key: 'rust',
      label: 'Visible Rust',
      description: 'Tank corrosion signs',
      icon: <AlertTriangle className="h-4 w-4" />,
      category: 'risk',
      isActive: locationData.visualRust,
      onToggle: () => onLocationUpdate({ visualRust: !locationData.visualRust }),
      variant: 'danger',
    },
    {
      key: 'leak',
      label: 'Active Leak',
      description: 'Water at base or fittings',
      icon: <Droplets className="h-4 w-4" />,
      category: 'risk',
      isActive: locationData.isLeaking,
      onToggle: () => onLocationUpdate({ isLeaking: !locationData.isLeaking }),
      variant: 'danger',
    },
    {
      key: 'directCopper',
      label: 'Direct Copper',
      description: 'No dielectric nipples',
      icon: <Flame className="h-4 w-4" />,
      category: 'risk',
      isActive: equipmentData.connectionType === 'DIRECT_COPPER',
      onToggle: () => onEquipmentUpdate({ 
        connectionType: equipmentData.connectionType === 'DIRECT_COPPER' ? 'DIELECTRIC' : 'DIRECT_COPPER' 
      }),
      variant: 'warning',
    },
    // Safety/Equipment exceptions
    {
      key: 'noExpTank',
      label: 'Has Expansion Tank',
      description: 'Thermal protection',
      icon: <Box className="h-4 w-4" />,
      category: 'equipment',
      isActive: equipmentData.hasExpTank,
      onToggle: () => onEquipmentUpdate({ hasExpTank: !equipmentData.hasExpTank }),
    },
    {
      key: 'hasPrv',
      label: 'Has PRV',
      description: 'Pressure reducing valve',
      icon: <Gauge className="h-4 w-4" />,
      category: 'equipment',
      isActive: equipmentData.hasPrv,
      onToggle: () => onEquipmentUpdate({ hasPrv: !equipmentData.hasPrv }),
    },
    {
      key: 'hasCircPump',
      label: 'Has Recirc Pump',
      description: 'Hot water recirculation',
      icon: <Shield className="h-4 w-4" />,
      category: 'equipment',
      isActive: equipmentData.hasCircPump,
      onToggle: () => onEquipmentUpdate({ hasCircPump: !equipmentData.hasCircPump }),
    },
    // Softener
    {
      key: 'hasSoftener',
      label: 'Has Softener',
      description: 'Water treatment present',
      icon: <Droplets className="h-4 w-4" />,
      category: 'equipment',
      isActive: !!softenerData.hasSoftener,
      onToggle: () => onSoftenerUpdate({ hasSoftener: !softenerData.hasSoftener }),
      variant: 'info',
    },
  ];

  const renderExceptionButton = (exception: ExceptionToggle) => {
    const activeStyles = exception.isActive
      ? exception.variant === 'danger'
        ? 'border-red-500 bg-red-50 text-red-700'
        : exception.variant === 'warning'
        ? 'border-orange-500 bg-orange-50 text-orange-700'
        : exception.variant === 'info'
        ? 'border-blue-500 bg-blue-50 text-blue-700'
        : 'border-green-500 bg-green-50 text-green-700'
      : 'border-muted bg-card hover:border-primary/50';

    return (
      <button
        key={exception.key}
        type="button"
        onClick={exception.onToggle}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left w-full",
          activeStyles
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          exception.isActive ? "bg-current/10" : "bg-muted"
        )}>
          {exception.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{exception.label}</p>
          <p className="text-xs opacity-70">{exception.description}</p>
        </div>
        {exception.isActive && (
          <CheckCircle className="h-5 w-5 shrink-0" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Installation Check</h2>
        <p className="text-sm text-muted-foreground">
          One tap for standard installs, or flag exceptions
        </p>
      </div>

      {/* Standard Install Button - Hero CTA */}
      <button
        type="button"
        onClick={applyStandardInstall}
        className={cn(
          "w-full p-6 rounded-2xl border-2 transition-all text-left",
          standardApplied && isStandardState
            ? "border-green-500 bg-green-50"
            : "border-green-500/50 bg-gradient-to-br from-green-50 to-green-100/50 hover:border-green-500"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center",
            standardApplied && isStandardState
              ? "bg-green-500 text-white"
              : "bg-green-500/20 text-green-600"
          )}>
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800">Standard Install</h3>
            <p className="text-sm text-green-700/70 mt-0.5">
              Garage • Copper • No Leaks • No Softener
            </p>
          </div>
          {standardApplied && isStandardState && (
            <Badge className="bg-green-500 text-white">Applied</Badge>
          )}
        </div>
      </button>

      {/* Exception Toggle Section */}
      <Collapsible open={showExceptions} onOpenChange={setShowExceptions}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-muted hover:border-primary/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-foreground">Flag Exceptions</span>
              {exceptionCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {exceptionCount}
                </Badge>
              )}
            </div>
            <ChevronDown className={cn(
              "h-5 w-5 text-muted-foreground transition-transform",
              showExceptions && "rotate-180"
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-4 space-y-4">
          {/* Location Quick Select */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </Label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_OPTIONS.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => onLocationUpdate({ location: loc.value })}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    locationData.location === loc.value
                      ? loc.isHighRisk
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-primary bg-primary text-primary-foreground"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Setting */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Thermometer className="h-3.5 w-3.5" />
              Temperature Setting
            </Label>
            <div className="flex gap-2">
              {TEMP_OPTIONS.map((temp) => (
                <button
                  key={temp.value}
                  type="button"
                  onClick={() => onLocationUpdate({ tempSetting: temp.value })}
                  className={cn(
                    "flex-1 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                    locationData.tempSetting === temp.value
                      ? temp.value === 'HOT'
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-primary bg-primary text-primary-foreground"
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div>{temp.label}</div>
                  <div className="text-xs opacity-70">{temp.temp}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Exception Toggles Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Risk & Equipment Flags
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {exceptions.map(renderExceptionButton)}
            </div>
          </div>

          {/* High Risk Location Warning */}
          {isHighRiskLocation && !equipmentData.hasDrainPan && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 text-sm">Drain Pan Required</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {locationData.location} location requires a drain pan for code compliance.
                  </p>
                  <button
                    type="button"
                    onClick={() => onEquipmentUpdate({ hasDrainPan: true })}
                    className="mt-2 text-xs font-medium text-orange-700 underline hover:no-underline"
                  >
                    Mark drain pan present
                  </button>
                </div>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Active Exceptions Summary */}
      {exceptionCount > 0 && !showExceptions && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {exceptionCount} exception{exceptionCount > 1 ? 's' : ''} flagged
          </p>
          <ul className="text-xs text-amber-700 mt-1 space-y-0.5">
            {locationData.visualRust && <li>• Visible rust</li>}
            {locationData.isLeaking && <li>• Active leak</li>}
            {equipmentData.connectionType === 'DIRECT_COPPER' && <li>• Direct copper connection</li>}
            {isHighRiskLocation && <li>• High-risk location ({locationData.location})</li>}
            {softenerData.hasSoftener && <li>• Softener present</li>}
          </ul>
        </div>
      )}

      {/* Continue Button */}
      <Button 
        onClick={onNext} 
        className="w-full h-12 font-semibold"
        disabled={!locationData.tempSetting}
      >
        Continue
      </Button>
    </div>
  );
}
