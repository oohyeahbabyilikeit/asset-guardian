import { useState } from 'react';
import { ChevronDown, ChevronUp, Gauge, Thermometer, Calendar, Droplets, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';

interface QuickSimulatorProps {
  inputs: ForensicInputs;
  onInputsChange: (inputs: ForensicInputs) => void;
}

export function QuickSimulator({ inputs, onInputsChange }: QuickSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateInput = <K extends keyof ForensicInputs>(key: K, value: ForensicInputs[K]) => {
    onInputsChange({ ...inputs, [key]: value });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mx-4 overflow-hidden border-primary/20">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-between p-4 h-auto hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Quick Simulator</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{inputs.calendarAge}yr • {inputs.housePsi} PSI</span>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
            {/* Age Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Tank Age
                </Label>
                <span className="text-sm font-mono font-bold">{inputs.calendarAge} years</span>
              </div>
              <Slider
                value={[inputs.calendarAge]}
                onValueChange={([v]) => updateInput('calendarAge', v)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* PSI Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  House Pressure
                </Label>
                <span className={`text-sm font-mono font-bold ${inputs.housePsi >= 80 ? 'text-destructive' : inputs.housePsi >= 70 ? 'text-amber-500' : ''}`}>
                  {inputs.housePsi} PSI
                </span>
              </div>
              <Slider
                value={[inputs.housePsi]}
                onValueChange={([v]) => updateInput('housePsi', v)}
                min={40}
                max={140}
                step={5}
                className="w-full"
              />
            </div>

            {/* Water Hardness Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" />
                  Water Hardness
                </Label>
                <span className="text-sm font-mono font-bold">{inputs.hardnessGPG} GPG</span>
              </div>
              <Slider
                value={[inputs.hardnessGPG]}
                onValueChange={([v]) => updateInput('hardnessGPG', v)}
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            {/* Toggle Row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">
                  <Thermometer className="w-3.5 h-3.5 inline mr-1" />
                  Hot (140°F+)
                </Label>
                <Switch 
                  checked={inputs.tempSetting === 'HOT'} 
                  onCheckedChange={(v) => updateInput('tempSetting', v ? 'HOT' : 'NORMAL')} 
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">Softener</Label>
                <Switch 
                  checked={inputs.hasSoftener} 
                  onCheckedChange={(v) => updateInput('hasSoftener', v)} 
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">Circ Pump</Label>
                <Switch 
                  checked={inputs.hasCircPump} 
                  onCheckedChange={(v) => updateInput('hasCircPump', v)} 
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">Closed Loop</Label>
                <Switch 
                  checked={inputs.isClosedLoop} 
                  onCheckedChange={(v) => updateInput('isClosedLoop', v)} 
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">Exp. Tank</Label>
                <Switch 
                  checked={inputs.hasExpTank} 
                  onCheckedChange={(v) => updateInput('hasExpTank', v)} 
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <Label className="text-xs">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  PRV
                </Label>
                <Switch 
                  checked={inputs.hasPrv} 
                  onCheckedChange={(v) => updateInput('hasPrv', v)} 
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
