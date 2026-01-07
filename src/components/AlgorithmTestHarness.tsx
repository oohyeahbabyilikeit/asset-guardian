import { useState, useMemo } from 'react';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, ReferenceDot } from 'recharts';
import { 
  calculateOpterraRisk, 
  getRiskLevelInfo,
  type ForensicInputs, 
  type OpterraResult,
  type FuelType,
  type TempSetting,
  type LocationType 
} from '@/lib/opterraAlgorithm';

interface AlgorithmTestHarnessProps {
  onBack: () => void;
}

// Default inputs for a healthy tank
const DEFAULT_INPUTS: ForensicInputs = {
  calendarAge: 5,
  psi: 60,
  warrantyYears: 6,
  fuelType: 'GAS',
  hardnessGPG: 8,
  hasSoftener: false,
  hasCircPump: false,
  isClosedLoop: false,
  hasExpTank: true,
  hasPrv: true,
  location: 'GARAGE',
  isFinishedArea: false,
  visualRust: false,
  tempSetting: 'NORMAL',
};

// Buffer Zone Model constants (must match opterraAlgorithm.ts)
const PSI_SAFE_LIMIT = 80;    // Below this, compressive pre-stress protects the glass
const PSI_SCALAR = 20;        // Every 20 PSI over limit = 1 "Step" of damage
const PSI_QUADRATIC_EXP = 2.0; // Quadratic penalty

function generateBufferZoneCurve() {
  const points = [];
  for (let psi = 40; psi <= 150; psi += 5) {
    let stress = 1.0;
    if (psi > PSI_SAFE_LIMIT) {
      const excessPsi = psi - PSI_SAFE_LIMIT;
      const penalty = Math.pow(excessPsi / PSI_SCALAR, PSI_QUADRATIC_EXP);
      stress = 1.0 + penalty;
    }
    points.push({ psi, stress: Math.round(stress * 100) / 100 });
  }
  return points;
}

const PRESSURE_CURVE_DATA = generateBufferZoneCurve();

export function AlgorithmTestHarness({ onBack }: AlgorithmTestHarnessProps) {
  const [inputs, setInputs] = useState<ForensicInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<OpterraResult | null>(null);

  const currentPsiStress = useMemo(() => {
    let stress = 1.0;
    if (inputs.psi > PSI_SAFE_LIMIT) {
      const excessPsi = inputs.psi - PSI_SAFE_LIMIT;
      const penalty = Math.pow(excessPsi / PSI_SCALAR, PSI_QUADRATIC_EXP);
      stress = 1.0 + penalty;
    }
    return stress;
  }, [inputs.psi]);

  const runCalculation = () => {
    const calcResult = calculateOpterraRisk(inputs);
    setResult(calcResult);
  };

  const resetInputs = () => {
    setInputs(DEFAULT_INPUTS);
    setResult(null);
  };

  const updateInput = <K extends keyof ForensicInputs>(key: K, value: ForensicInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
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
            <p className="text-xs text-muted-foreground">Opterra v6.0 Physics Engine</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
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

            {/* Buffer Zone Pressure Curve Visualization */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Buffer Zone Model: Stress = 1 + ((PSI - 80) / 20)²
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PRESSURE_CURVE_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="psi" 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      label={{ value: 'PSI', position: 'bottom', fontSize: 10, offset: -5 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 'auto']}
                      label={{ value: 'Stress ×', angle: -90, position: 'insideLeft', fontSize: 10, offset: 15 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value}×`, 'Stress']}
                      labelFormatter={(label) => `${label} PSI`}
                    />
                    <ReferenceLine x={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: 'Buffer Limit', fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <ReferenceLine x={100} stroke="hsl(var(--warning))" strokeDasharray="3 3" label={{ value: 'High (2×)', fontSize: 9, fill: 'hsl(var(--warning))' }} />
                    <ReferenceLine x={120} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Critical (5×)', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
                    <Line 
                      type="monotone" 
                      dataKey="stress" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <ReferenceDot 
                      x={inputs.psi} 
                      y={Math.round(currentPsiStress * 100) / 100} 
                      r={6} 
                      fill="hsl(var(--primary))" 
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-muted-foreground mt-2">
                Current: <span className="font-mono font-bold text-foreground">{inputs.psi} PSI</span> → <span className="font-mono font-bold text-primary">{currentPsiStress.toFixed(2)}× stress</span>
                {inputs.psi <= 80 && <span className="ml-2 text-emerald-500">(Protected by glass pre-stress)</span>}
              </div>
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
                  <SelectItem value="UPPER_FLOOR">Upper Floor</SelectItem>
                  <SelectItem value="MAIN_LIVING">Main Floor</SelectItem>
                  <SelectItem value="BASEMENT">Basement</SelectItem>
                  <SelectItem value="GARAGE">Garage</SelectItem>
                  <SelectItem value="CRAWLSPACE">Crawlspace</SelectItem>
                  <SelectItem value="EXTERIOR">Exterior</SelectItem>
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
                  <SelectItem value="LOW">Low (&lt;120°F)</SelectItem>
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
              <Label className="text-xs">Has Circulation Pump</Label>
              <Switch checked={inputs.hasCircPump} onCheckedChange={(v) => updateInput('hasCircPump', v)} />
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
              <Label className="text-xs">Has PRV (Pressure Reducing Valve)</Label>
              <Switch checked={inputs.hasPrv} onCheckedChange={(v) => updateInput('hasPrv', v)} />
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
          <Button variant="outline" onClick={resetInputs}>
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
              result.verdict.badgeColor === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
              result.verdict.badgeColor === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
              'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <div className="text-lg font-bold">{result.verdict.title}</div>
              <div className="text-sm font-mono mt-1">{result.verdict.action}</div>
              <div className="text-xs text-muted-foreground mt-2">{result.verdict.reason}</div>
            </div>

            {/* Urgency Indicator */}
            {result.verdict.urgent && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                <div className="text-xs uppercase tracking-wider text-destructive font-bold">⚠️ Urgent Action Required</div>
              </div>
            )}

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard 
                label="Biological Age" 
                value={`${result.metrics.bioAge.toFixed(1)} yrs`} 
                highlight={result.metrics.bioAge > 12} 
              />
              <MetricCard label="Failure Prob" value={`${result.metrics.failProb.toFixed(1)}%`} highlight={result.metrics.failProb > 20} />
              <MetricCard label="Sediment Load" value={`${result.metrics.sedimentLbs.toFixed(1)} lbs`} highlight={result.metrics.sedimentLbs > 15} />
              <MetricCard label="Location Risk" value={getRiskLevelInfo(result.metrics.riskLevel).label} highlight={result.metrics.riskLevel >= 3} />
              <MetricCard label="Shield Life" value={`${result.metrics.shieldLife.toFixed(1)} yrs`} />
              <MetricCard label="Total Stress" value={`${result.metrics.stressFactors.total.toFixed(2)}x`} highlight={result.metrics.stressFactors.total >= 5} />
            </div>

            {/* Physics Breakdown */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Physics Breakdown (Stress = P × T × C × L)
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground">Pressure</div>
                  <div className="font-mono font-bold text-sm">{result.metrics.stressFactors.pressure.toFixed(2)}x</div>
                  <div className="text-[10px] text-muted-foreground">Buffer Zone</div>
                </div>
                <div className="p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground">Thermal</div>
                  <div className="font-mono font-bold text-sm">{result.metrics.stressFactors.temp.toFixed(1)}x</div>
                  <div className="text-[10px] text-muted-foreground">Arrhenius</div>
                </div>
                <div className="p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground">Circ</div>
                  <div className="font-mono font-bold text-sm">{result.metrics.stressFactors.circ.toFixed(1)}x</div>
                  <div className="text-[10px] text-muted-foreground">Duty Cycle</div>
                </div>
                <div className="p-2 bg-background rounded border">
                  <div className="text-xs text-muted-foreground">Loop</div>
                  <div className="font-mono font-bold text-sm">{result.metrics.stressFactors.loop.toFixed(1)}x</div>
                  <div className="text-[10px] text-muted-foreground">Hammer Effect</div>
                </div>
              </div>
            </div>

            {/* Action Flags */}
            <div className="flex flex-wrap gap-2 text-xs">
              <Flag label="Replacement Required" value={result.verdict.action === 'REPLACE'} />
              <Flag label="Urgent" value={result.verdict.urgent} />
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
