import { useState } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  calculateOpterraRisk, 
  type ForensicInputs, 
  type OpterraResult,
  type FuelType,
  type TempSetting,
  type LocationType 
} from '@/lib/opterraAlgorithm';

interface AlgorithmTestHarnessProps {
  onBack: () => void;
}

// Preset test scenarios
const PRESETS: Record<string, { label: string; inputs: ForensicInputs }> = {
  healthy: {
    label: '✅ Healthy Tank',
    inputs: {
      calendarAge: 5,
      psi: 60,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 8,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  dangerousPressure: {
    label: '🛑 Dangerous Pressure (140 PSI)',
    inputs: {
      calendarAge: 3,
      psi: 140,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 8,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  zombieTank: {
    label: '🧟 Zombie Tank (12yr + 95 PSI)',
    inputs: {
      calendarAge: 12,
      psi: 95,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 10,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  missingExpTank: {
    label: '⚠️ Missing Expansion Tank',
    inputs: {
      calendarAge: 4,
      psi: 65,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 8,
      hasSoftener: false,
      isClosedLoop: true,
      hasExpTank: false,
      location: 'BASEMENT',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  atticRisk: {
    label: '🏠 Attic High Risk',
    inputs: {
      calendarAge: 9,
      psi: 75,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 12,
      hasSoftener: true,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'ATTIC',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  activeLeak: {
    label: '🆘 Active Leak',
    inputs: {
      calendarAge: 8,
      psi: 70,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 10,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'BASEMENT',
      isFinishedArea: false,
      visualRust: true,
      tempSetting: 'NORMAL',
    },
  },
  sedimentLockout: {
    label: '🪨 Sediment Lockout',
    inputs: {
      calendarAge: 15,
      psi: 60,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 25,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
  youngHighPressure: {
    label: '🔧 Young Tank + PRV Needed',
    inputs: {
      calendarAge: 3,
      psi: 95,
      warrantyYears: 6,
      fuelType: 'GAS',
      hardnessGPG: 8,
      hasSoftener: false,
      isClosedLoop: false,
      hasExpTank: true,
      location: 'GARAGE',
      isFinishedArea: false,
      visualRust: false,
      tempSetting: 'NORMAL',
    },
  },
};

export function AlgorithmTestHarness({ onBack }: AlgorithmTestHarnessProps) {
  const [inputs, setInputs] = useState<ForensicInputs>(PRESETS.healthy.inputs);
  const [result, setResult] = useState<OpterraResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('healthy');

  const runCalculation = () => {
    const calcResult = calculateOpterraRisk(inputs);
    setResult(calcResult);
  };

  const loadPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setInputs(PRESETS[presetKey].inputs);
    setResult(null);
  };

  const updateInput = <K extends keyof ForensicInputs>(key: K, value: ForensicInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    setSelectedPreset('');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Algorithm Test Harness</h1>
            <p className="text-xs text-muted-foreground">Opterra v4.0 Rule Engine</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Preset Selector */}
        <Card className="p-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
            Load Preset Scenario
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant={selectedPreset === key ? 'default' : 'outline'}
                size="sm"
                className="justify-start text-xs h-auto py-2"
                onClick={() => loadPreset(key)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Input Controls */}
        <Card className="p-4 space-y-4">
          <h2 className="font-semibold text-sm uppercase tracking-wider">Forensic Inputs</h2>
          
          {/* Age & Pressure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Calendar Age (years)</Label>
              <Input
                type="number"
                value={inputs.calendarAge}
                onChange={(e) => updateInput('calendarAge', Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">PSI (Static Pressure)</Label>
              <Input
                type="number"
                value={inputs.psi}
                onChange={(e) => updateInput('psi', Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Warranty & Fuel */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Warranty Years</Label>
              <Select value={String(inputs.warrantyYears)} onValueChange={(v) => updateInput('warrantyYears', Number(v))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 Years</SelectItem>
                  <SelectItem value="9">9 Years</SelectItem>
                  <SelectItem value="12">12 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Fuel Type</Label>
              <Select value={inputs.fuelType} onValueChange={(v) => updateInput('fuelType', v as FuelType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAS">Gas</SelectItem>
                  <SelectItem value="ELECTRIC">Electric</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Water Hardness */}
          <div>
            <Label className="text-xs">Water Hardness (GPG)</Label>
            <Input
              type="number"
              value={inputs.hardnessGPG}
              onChange={(e) => updateInput('hardnessGPG', Number(e.target.value))}
              className="mt-1"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Location</Label>
              <Select value={inputs.location} onValueChange={(v) => updateInput('location', v as LocationType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATTIC">Attic</SelectItem>
                  <SelectItem value="MAIN_LIVING">Main Floor</SelectItem>
                  <SelectItem value="BASEMENT">Basement</SelectItem>
                  <SelectItem value="GARAGE">Garage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Temp Setting</Label>
              <Select value={inputs.tempSetting} onValueChange={(v) => updateInput('tempSetting', v as TempSetting)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal (&lt;130°F)</SelectItem>
                  <SelectItem value="HOT">Hot (&gt;130°F)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Boolean Toggles */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Has Water Softener</Label>
              <Switch checked={inputs.hasSoftener} onCheckedChange={(v) => updateInput('hasSoftener', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Closed Loop System</Label>
              <Switch checked={inputs.isClosedLoop} onCheckedChange={(v) => updateInput('isClosedLoop', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Has Expansion Tank</Label>
              <Switch checked={inputs.hasExpTank} onCheckedChange={(v) => updateInput('hasExpTank', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Finished Area</Label>
              <Switch checked={inputs.isFinishedArea} onCheckedChange={(v) => updateInput('isFinishedArea', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-destructive font-semibold">Visual Rust/Leak</Label>
              <Switch checked={inputs.visualRust} onCheckedChange={(v) => updateInput('visualRust', v)} />
            </div>
          </div>
        </Card>

        {/* Run Button */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={runCalculation}>
            <Play className="w-4 h-4 mr-2" />
            Run Calculation
          </Button>
          <Button variant="outline" onClick={() => loadPreset('healthy')}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Results */}
        {result && (
          <Card className="p-4 space-y-4 border-2 border-primary/30">
            <h2 className="font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Calculation Results
            </h2>

            {/* Verdict Banner */}
            <div className={`p-3 rounded-lg border ${
              result.verdict.badgeColor === 'red' ? 'bg-destructive/10 border-destructive/30' :
              result.verdict.badgeColor === 'orange' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="text-lg font-bold">{result.verdict.badgeLabel}</div>
              <div className="text-sm font-mono mt-1">{result.verdict.action}</div>
              <div className="text-xs text-muted-foreground mt-2">{result.verdict.script}</div>
            </div>

            {/* Trigger Rule */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Triggered By</div>
              <div className="font-mono text-sm">{result.verdict.triggerRule}</div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard label="Biological Age" value={result.metrics.bioAgeCapped ? '20+ yrs' : `${result.metrics.bioAge} yrs`} highlight={result.metrics.bioAge > 12} />
              <MetricCard label="Failure Prob" value={`${result.metrics.failProb}%`} highlight={result.metrics.failProb > 20} />
              <MetricCard label="Sediment Load" value={`${result.metrics.sedimentLbs} lbs`} highlight={result.metrics.sedimentLbs > 15} />
              <MetricCard label="Est. Damage" value={`$${(result.metrics.estDamage / 1000).toFixed(0)}K`} />
              <MetricCard label="Shield Life" value={`${result.metrics.shieldLife} yrs`} />
              <MetricCard label="Stress Factor" value={`${result.metrics.stress}x`} highlight={result.metrics.stress >= 10} />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Flag label="Can Repair" value={result.verdict.canRepair} />
              <Flag label="Priority Lead" value={result.verdict.isPriorityLead} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'bg-destructive/10 border-destructive/30' : 'bg-card'}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`text-lg font-bold font-mono ${highlight ? 'text-destructive' : ''}`}>{value}</div>
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <div className={`px-2 py-1 rounded-full border ${value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
      {label}: {value ? 'YES' : 'NO'}
    </div>
  );
}
