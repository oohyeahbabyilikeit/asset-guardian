import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Warehouse, 
  ArrowUp, 
  ArrowDown, 
  Mountain, 
  Trees,
  AlertTriangle,
  Thermometer,
  Droplet
} from 'lucide-react';
import type { LocationCondition } from '@/types/technicianInspection';
import type { LocationType, TempSetting } from '@/lib/opterraAlgorithm';

const LOCATIONS: { value: LocationType; label: string; icon: React.ReactNode; riskNote?: string }[] = [
  { value: 'GARAGE', label: 'Garage', icon: <Warehouse className="h-5 w-5" /> },
  { value: 'BASEMENT', label: 'Basement', icon: <ArrowDown className="h-5 w-5" /> },
  { value: 'ATTIC', label: 'Attic', icon: <ArrowUp className="h-5 w-5" />, riskNote: 'High damage risk' },
  { value: 'MAIN_LIVING', label: 'Utility Closet', icon: <Home className="h-5 w-5" />, riskNote: 'Finished area' },
  { value: 'CRAWLSPACE', label: 'Crawlspace', icon: <Mountain className="h-5 w-5" /> },
  { value: 'EXTERIOR', label: 'Exterior', icon: <Trees className="h-5 w-5" /> },
];

const TEMP_SETTINGS: { value: TempSetting; label: string; temp: string; risk: string }[] = [
  { value: 'LOW', label: 'Low', temp: '~110°F', risk: 'Low stress' },
  { value: 'NORMAL', label: 'Normal', temp: '~120°F', risk: 'Standard' },
  { value: 'HOT', label: 'Hot', temp: '~140°F', risk: 'Higher wear' },
];

interface LocationStepProps {
  data: LocationCondition;
  onUpdate: (data: Partial<LocationCondition>) => void;
  onNext: () => void;
}

export function LocationStep({ data, onUpdate, onNext }: LocationStepProps) {
  const hasActiveIssue = data.isLeaking || data.visualRust;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Location & Condition</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Where is the unit installed and what's its condition?
        </p>
      </div>
      
      {/* Location Grid */}
      <div className="space-y-3">
        <Label>Installation Location</Label>
        <RadioGroup
          value={data.location}
          onValueChange={(value) => onUpdate({ location: value as LocationType })}
          className="grid grid-cols-2 gap-2"
        >
          {LOCATIONS.map((loc) => (
            <div key={loc.value}>
              <RadioGroupItem
                value={loc.value}
                id={loc.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={loc.value}
                className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
              >
                {loc.icon}
                <span className="text-sm font-medium">{loc.label}</span>
                {loc.riskNote && (
                  <Badge variant="secondary" className="text-xs">
                    {loc.riskNote}
                  </Badge>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Finished Area Toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <Label>Finished Living Area?</Label>
          <p className="text-xs text-muted-foreground">
            Leak damage potential is higher in finished spaces
          </p>
        </div>
        <Switch
          checked={data.isFinishedArea}
          onCheckedChange={(checked) => onUpdate({ isFinishedArea: checked })}
        />
      </div>
      
      {/* Temperature Setting */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-muted-foreground" />
          <Label>Temperature Dial Position</Label>
        </div>
        <RadioGroup
          value={data.tempSetting}
          onValueChange={(value) => onUpdate({ tempSetting: value as TempSetting })}
          className="grid grid-cols-3 gap-2"
        >
          {TEMP_SETTINGS.map((setting) => (
            <div key={setting.value}>
              <RadioGroupItem
                value={setting.value}
                id={`temp-${setting.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`temp-${setting.value}`}
                className="flex flex-col items-center gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer text-center"
              >
                <span className="font-medium">{setting.label}</span>
                <span className="text-xs text-muted-foreground">{setting.temp}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Visual Inspection Flags */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Visual Inspection
        </Label>
        
        <div className="space-y-2">
          {/* Rust */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-muted hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.visualRust ? 'bg-orange-500' : 'bg-muted'}`} />
              <span className="text-sm">Visible Rust / Corrosion</span>
            </div>
            <Switch
              checked={data.visualRust}
              onCheckedChange={(checked) => onUpdate({ visualRust: checked })}
            />
          </div>
          
          {/* Leaking */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-muted hover:bg-muted/50">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.isLeaking ? 'bg-red-500' : 'bg-muted'}`} />
              <div className="flex items-center gap-2">
                <Droplet className="h-4 w-4" />
                <span className="text-sm">Active Leak</span>
              </div>
            </div>
            <Switch
              checked={data.isLeaking}
              onCheckedChange={(checked) => onUpdate({ isLeaking: checked })}
            />
          </div>
        </div>
        
        {/* Critical Warning */}
        {data.isLeaking && (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Active Leak Detected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This unit may require immediate replacement. The system will flag this as critical.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Button onClick={onNext} className="w-full">
        Continue to Equipment Check
      </Button>
    </div>
  );
}
