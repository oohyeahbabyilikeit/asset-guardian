import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Info, Gauge, Shield, Flame, Droplets, MapPin, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  calculateOpterraRisk, 
  getRiskLevelInfo,
  projectFutureHealth,
  type ForensicInputs, 
  type OpterraResult,
  type FuelType,
  type TempSetting,
  type LocationType 
} from '@/lib/opterraAlgorithm';

interface AlgorithmTestHarnessProps {
  onBack: () => void;
}

const DEFAULT_INPUTS: ForensicInputs = {
  calendarAge: 5,
  housePsi: 60,
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

interface Issue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  value?: string;
}

function detectAllIssues(inputs: ForensicInputs, result: OpterraResult): Issue[] {
  const issues: Issue[] = [];
  const { metrics, verdict } = result;

  // CRITICAL ISSUES
  if (inputs.isLeaking) {
    issues.push({
      id: 'leak',
      severity: 'critical',
      title: 'Active Leak Detected',
      detail: 'Tank containment has failed. Immediate replacement required.',
      value: 'BREACH'
    });
  }

  if (inputs.visualRust) {
    issues.push({
      id: 'rust',
      severity: 'critical',
      title: 'Visual Corrosion',
      detail: 'External rust indicates internal degradation and imminent failure.',
      value: 'VISIBLE'
    });
  }

  if (inputs.housePsi > 150) {
    issues.push({
      id: 'explosion',
      severity: 'critical',
      title: 'Explosion Hazard',
      detail: `Pressure ${inputs.housePsi} PSI exceeds T&P valve capacity (150 PSI). Immediate danger.`,
      value: `${inputs.housePsi} PSI`
    });
  } else if (inputs.housePsi > 80) {
    issues.push({
      id: 'pressure_high',
      severity: 'critical',
      title: 'Critical Pressure Violation',
      detail: `House pressure ${inputs.housePsi} PSI exceeds 80 PSI code maximum. Accelerates wear by ${((metrics.stressFactors.pressure - 1) * 100).toFixed(0)}%.`,
      value: `${inputs.housePsi} PSI`
    });
  }

  if (metrics.bioAge >= 20) {
    issues.push({
      id: 'bio_age_critical',
      severity: 'critical',
      title: 'Statistical End of Life',
      detail: `Biological age ${metrics.bioAge.toFixed(1)} years exceeds safe operating threshold (20 years).`,
      value: `${metrics.bioAge.toFixed(1)} yrs`
    });
  }

  if (metrics.failProb >= 50) {
    issues.push({
      id: 'fail_prob_critical',
      severity: 'critical',
      title: 'High Failure Probability',
      detail: `${metrics.failProb.toFixed(1)}% chance of failure within 12 months. Replacement recommended.`,
      value: `${metrics.failProb.toFixed(1)}%`
    });
  }

  // Closed loop without expansion tank
  const isClosedLoop = inputs.isClosedLoop || inputs.hasPrv;
  if (isClosedLoop && !inputs.hasExpTank) {
    issues.push({
      id: 'no_exp_tank',
      severity: 'critical',
      title: 'Missing Expansion Tank',
      detail: 'Closed loop system without expansion tank causes thermal pressure spikes up to 120+ PSI.',
      value: 'MISSING'
    });
  }

  // WARNING ISSUES
  if (inputs.housePsi >= 70 && inputs.housePsi <= 80) {
    issues.push({
      id: 'pressure_elevated',
      severity: 'warning',
      title: 'Elevated Pressure',
      detail: `Pressure ${inputs.housePsi} PSI is within warranty threshold but elevated. PRV would reduce stress.`,
      value: `${inputs.housePsi} PSI`
    });
  }

  if (!inputs.hasPrv && inputs.housePsi >= 65) {
    issues.push({
      id: 'no_prv',
      severity: 'warning',
      title: 'No PRV Installed',
      detail: `With ${inputs.housePsi} PSI, a PRV would reduce plumbing strain by ~50%.`,
      value: 'NOT INSTALLED'
    });
  }

  if (inputs.hasPrv && inputs.housePsi > 75) {
    issues.push({
      id: 'prv_failed',
      severity: 'warning',
      title: 'PRV Not Regulating',
      detail: `PRV installed but pressure still ${inputs.housePsi} PSI. PRV may be failed or undersized.`,
      value: 'FAILED'
    });
  }

  if (metrics.sedimentLbs >= 5 && metrics.sedimentLbs <= 15) {
    issues.push({
      id: 'sediment_service',
      severity: 'warning',
      title: 'Sediment Buildup',
      detail: `${metrics.sedimentLbs.toFixed(1)} lbs of sediment detected. Professional flush recommended.`,
      value: `${metrics.sedimentLbs.toFixed(1)} lbs`
    });
  } else if (metrics.sedimentLbs > 15) {
    issues.push({
      id: 'sediment_lockout',
      severity: 'critical',
      title: 'Sediment Lockout',
      detail: `${metrics.sedimentLbs.toFixed(1)} lbs of sediment - too hardite flush safely. Flush could cause leaks.`,
      value: `${metrics.sedimentLbs.toFixed(1)} lbs`
    });
  }

  if (metrics.shieldLife <= 0) {
    issues.push({
      id: 'anode_depleted',
      severity: 'warning',
      title: 'Anode Rod Depleted',
      detail: 'Sacrificial anode exhausted. Tank interior now corroding directly.',
      value: 'DEPLETED'
    });
  } else if (metrics.shieldLife < 2) {
    issues.push({
      id: 'anode_low',
      severity: 'info',
      title: 'Low Anode Life',
      detail: `Approximately ${metrics.shieldLife.toFixed(1)} years of anode protection remaining.`,
      value: `${metrics.shieldLife.toFixed(1)} yrs`
    });
  }

  if (inputs.hasSoftener) {
    issues.push({
      id: 'softener',
      severity: 'warning',
      title: 'Water Softener Active',
      detail: 'Softener increases conductivity, accelerating anode consumption by 2.4x.',
      value: 'ACTIVE'
    });
  }

  if (inputs.hasCircPump) {
    issues.push({
      id: 'circ_pump',
      severity: 'info',
      title: 'Circulation Pump',
      detail: `Recirc system adds ${((metrics.stressFactors.circ - 1) * 100).toFixed(0)}% stress from continuous duty cycles.`,
      value: `${metrics.stressFactors.circ.toFixed(2)}x`
    });
  }

  if (inputs.tempSetting === 'HOT') {
    issues.push({
      id: 'temp_high',
      severity: 'warning',
      title: 'High Temperature Setting',
      detail: 'Temperature above 130°F accelerates chemical corrosion and scale formation.',
      value: '>130°F'
    });
  }

  if (metrics.bioAge > 12 && metrics.bioAge < 20) {
    issues.push({
      id: 'bio_age_warn',
      severity: 'warning',
      title: 'Aging Tank',
      detail: `Biological age ${metrics.bioAge.toFixed(1)} years. Consider proactive replacement planning.`,
      value: `${metrics.bioAge.toFixed(1)} yrs`
    });
  }

  if (inputs.calendarAge >= 10 && metrics.failProb < 50) {
    issues.push({
      id: 'calendar_age',
      severity: 'info',
      title: 'Extended Service',
      detail: `Calendar age ${inputs.calendarAge} years. Unit may be past warranty but still functional.`,
      value: `${inputs.calendarAge} yrs`
    });
  }

  // Location risk
  const riskInfo = getRiskLevelInfo(metrics.riskLevel);
  if (metrics.riskLevel >= 4) {
    issues.push({
      id: 'location_critical',
      severity: 'critical',
      title: 'High-Risk Location',
      detail: `${riskInfo.label} installation location. Failure would cause catastrophic damage.`,
      value: inputs.location
    });
  } else if (metrics.riskLevel >= 3) {
    issues.push({
      id: 'location_warn',
      severity: 'warning',
      title: 'Elevated Location Risk',
      detail: `${riskInfo.label} location increases potential damage from failure.`,
      value: inputs.location
    });
  }

  // Stress factor warning
  if (metrics.stressFactors.total >= 2 && metrics.stressFactors.total < 5) {
    issues.push({
      id: 'stress_elevated',
      severity: 'warning',
      title: 'Accelerated Aging',
      detail: `Combined stress factors aging tank at ${metrics.stressFactors.total.toFixed(2)}x normal rate.`,
      value: `${metrics.stressFactors.total.toFixed(2)}x`
    });
  } else if (metrics.stressFactors.total >= 5) {
    issues.push({
      id: 'stress_critical',
      severity: 'critical',
      title: 'Severe Stress Load',
      detail: `Tank aging at ${metrics.stressFactors.total.toFixed(2)}x normal rate. Rapid degradation occurring.`,
      value: `${metrics.stressFactors.total.toFixed(2)}x`
    });
  }

  return issues;
}

export function AlgorithmTestHarness({ onBack }: AlgorithmTestHarnessProps) {
  const [inputs, setInputs] = useState<ForensicInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<OpterraResult | null>(null);

  // Auto-run calculation on input change
  useEffect(() => {
    const calcResult = calculateOpterraRisk(inputs);
    setResult(calcResult);
  }, [inputs]);

  const issues = useMemo(() => {
    if (!result) return [];
    return detectAllIssues(inputs, result);
  }, [inputs, result]);

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const resetInputs = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const updateInput = <K extends keyof ForensicInputs>(key: K, value: ForensicInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const riskInfo = result ? getRiskLevelInfo(result.metrics.riskLevel) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">OPTERRA Test Harness</h1>
              <p className="text-xs text-muted-foreground">v6.2 Physics Engine</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={resetInputs}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Inputs */}
        <ScrollArea className="lg:w-80 lg:border-r border-border">
          <div className="p-4 space-y-6">
            {/* Core Metrics */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Age & Warranty
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Calendar Age (years)</Label>
                  <Input
                    type="number"
                    value={inputs.calendarAge}
                    onChange={(e) => updateInput('calendarAge', Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Warranty</Label>
                  <Select value={String(inputs.warrantyYears)} onValueChange={(v) => updateInput('warrantyYears', Number(v))}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Years</SelectItem>
                      <SelectItem value="9">9 Years</SelectItem>
                      <SelectItem value="12">12 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            {/* Pressure */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Pressure System
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">House PSI</Label>
                  <Input
                    type="number"
                    value={inputs.housePsi}
                    onChange={(e) => updateInput('housePsi', Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">PRV Installed</Label>
                  <Switch checked={inputs.hasPrv} onCheckedChange={(v) => updateInput('hasPrv', v)} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Expansion Tank</Label>
                  <Switch checked={inputs.hasExpTank} onCheckedChange={(v) => updateInput('hasExpTank', v)} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Closed Loop</Label>
                  <Switch checked={inputs.isClosedLoop} onCheckedChange={(v) => updateInput('isClosedLoop', v)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Water Quality */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5" /> Water Quality
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Hardness (GPG)</Label>
                  <Input
                    type="number"
                    value={inputs.hardnessGPG}
                    onChange={(e) => updateInput('hardnessGPG', Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Water Softener</Label>
                  <Switch checked={inputs.hasSoftener} onCheckedChange={(v) => updateInput('hasSoftener', v)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Equipment */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Equipment
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Fuel Type</Label>
                  <Select value={inputs.fuelType} onValueChange={(v) => updateInput('fuelType', v as FuelType)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GAS">Gas</SelectItem>
                      <SelectItem value="ELECTRIC">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Temperature</Label>
                  <Select value={inputs.tempSetting} onValueChange={(v) => updateInput('tempSetting', v as TempSetting)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low (&lt;120°F)</SelectItem>
                      <SelectItem value="NORMAL">Normal (120-130°F)</SelectItem>
                      <SelectItem value="HOT">Hot (&gt;130°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Circulation Pump</Label>
                  <Switch checked={inputs.hasCircPump} onCheckedChange={(v) => updateInput('hasCircPump', v)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Location */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> Location
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Install Location</Label>
                  <Select value={inputs.location} onValueChange={(v) => updateInput('location', v as LocationType)}>
                    <SelectTrigger className="mt-1 h-9">
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
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Finished Area</Label>
                  <Switch checked={inputs.isFinishedArea} onCheckedChange={(v) => updateInput('isFinishedArea', v)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* Physical Condition */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Physical Condition
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs text-destructive">Visual Rust</Label>
                  <Switch checked={inputs.visualRust} onCheckedChange={(v) => updateInput('visualRust', v)} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs text-destructive">Active Leak</Label>
                  <Switch checked={inputs.isLeaking ?? false} onCheckedChange={(v) => updateInput('isLeaking', v)} />
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Right Panel - Results */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {result && (
              <>
                {/* Verdict Banner */}
                <div className={`p-4 rounded-xl border-2 ${
                  result.verdict.badgeColor === 'red' ? 'bg-destructive/10 border-destructive/50' :
                  result.verdict.badgeColor === 'orange' ? 'bg-orange-500/10 border-orange-500/50' :
                  result.verdict.badgeColor === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/50' :
                  result.verdict.badgeColor === 'blue' ? 'bg-blue-500/10 border-blue-500/50' :
                  'bg-emerald-500/10 border-emerald-500/50'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-2 ${
                        result.verdict.badgeColor === 'red' ? 'bg-destructive text-destructive-foreground' :
                        result.verdict.badgeColor === 'orange' ? 'bg-orange-500 text-white' :
                        result.verdict.badgeColor === 'yellow' ? 'bg-yellow-500 text-black' :
                        result.verdict.badgeColor === 'blue' ? 'bg-blue-500 text-white' :
                        'bg-emerald-500 text-white'
                      }`}>
                        {result.verdict.action}
                      </div>
                      <h2 className="text-xl font-bold">{result.verdict.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">{result.verdict.reason}</p>
                    </div>
                    {result.verdict.urgent && (
                      <div className="shrink-0 px-3 py-1.5 rounded-full bg-destructive/20 border border-destructive/50 text-destructive text-xs font-bold">
                        URGENT
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Summary */}
                <div className="flex gap-2">
                  {criticalCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-semibold text-destructive">{criticalCount} Critical</span>
                    </div>
                  )}
                  {warningCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-semibold text-yellow-600">{warningCount} Warnings</span>
                    </div>
                  )}
                  {infoCount > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-500">{infoCount} Info</span>
                    </div>
                  )}
                  {issues.length === 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-500">No Issues Detected</span>
                    </div>
                  )}
                </div>

                {/* Issues List */}
                {issues.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Detected Issues</h3>
                    <div className="space-y-2">
                      {issues.map((issue) => (
                        <div
                          key={issue.id}
                          className={`p-3 rounded-lg border ${
                            issue.severity === 'critical' ? 'bg-destructive/5 border-destructive/30' :
                            issue.severity === 'warning' ? 'bg-yellow-500/5 border-yellow-500/30' :
                            'bg-blue-500/5 border-blue-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              {issue.severity === 'critical' ? (
                                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                              ) : issue.severity === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                              ) : (
                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <div className="font-semibold text-sm">{issue.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{issue.detail}</div>
                              </div>
                            </div>
                            {issue.value && (
                              <div className={`shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                issue.severity === 'critical' ? 'bg-destructive/20 text-destructive' :
                                issue.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-700' :
                                'bg-blue-500/20 text-blue-600'
                              }`}>
                                {issue.value}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Metrics */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Core Metrics</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MetricCard 
                      icon={<Clock className="w-4 h-4" />}
                      label="Bio Age" 
                      value={`${result.metrics.bioAge.toFixed(1)} yrs`} 
                      status={result.metrics.bioAge >= 20 ? 'critical' : result.metrics.bioAge >= 12 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<Shield className="w-4 h-4" />}
                      label="Fail Prob" 
                      value={`${result.metrics.failProb.toFixed(1)}%`} 
                      status={result.metrics.failProb >= 50 ? 'critical' : result.metrics.failProb >= 20 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<Clock className="w-4 h-4" />}
                      label="Years Left" 
                      value={`${result.metrics.yearsLeftCurrent.toFixed(1)}`} 
                      status={result.metrics.yearsLeftCurrent <= 0 ? 'critical' : result.metrics.yearsLeftCurrent <= 2 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<Droplets className="w-4 h-4" />}
                      label="Sediment" 
                      value={`${result.metrics.sedimentLbs.toFixed(1)} lbs`} 
                      status={result.metrics.sedimentLbs > 15 ? 'critical' : result.metrics.sedimentLbs >= 5 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<Shield className="w-4 h-4" />}
                      label="Shield Life" 
                      value={`${result.metrics.shieldLife.toFixed(1)} yrs`} 
                      status={result.metrics.shieldLife <= 0 ? 'critical' : result.metrics.shieldLife < 2 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<MapPin className="w-4 h-4" />}
                      label="Risk Level" 
                      value={riskInfo?.label || 'Unknown'} 
                      status={result.metrics.riskLevel >= 4 ? 'critical' : result.metrics.riskLevel >= 3 ? 'warning' : 'ok'}
                    />
                  </div>
                </div>

                {/* Stress Factors */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stress Factor Breakdown</h3>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold font-mono">
                        {result.metrics.stressFactors.total.toFixed(2)}×
                      </div>
                      <div className="text-xs text-muted-foreground">Total Aging Rate</div>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <StressFactor 
                        label="Pressure" 
                        value={result.metrics.stressFactors.pressure} 
                        sublabel="Buffer Zone"
                      />
                      <StressFactor 
                        label="Thermal" 
                        value={result.metrics.stressFactors.temp} 
                        sublabel="Arrhenius"
                      />
                      <StressFactor 
                        label="Circ" 
                        value={result.metrics.stressFactors.circ} 
                        sublabel="Duty Cycle"
                      />
                      <StressFactor 
                        label="Loop" 
                        value={result.metrics.stressFactors.loop} 
                        sublabel="Hammer"
                      />
                    </div>
                    <div className="text-center mt-3 text-xs text-muted-foreground font-mono">
                      {result.metrics.stressFactors.pressure.toFixed(2)} × {result.metrics.stressFactors.temp.toFixed(2)} × {result.metrics.stressFactors.circ.toFixed(2)} × {result.metrics.stressFactors.loop.toFixed(2)} = {result.metrics.stressFactors.total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Projections */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Future Projections</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[6, 12, 24].map((months) => {
                      const proj = projectFutureHealth(result.metrics.bioAge, result.metrics.agingRate, months);
                      return (
                        <div key={months} className="p-3 rounded-lg bg-card border border-border text-center">
                          <div className="text-xs text-muted-foreground mb-1">+{months} months</div>
                          <div className={`text-lg font-bold font-mono ${
                            proj.failProb >= 50 ? 'text-destructive' : 
                            proj.failProb >= 20 ? 'text-yellow-600' : 
                            'text-foreground'
                          }`}>
                            {proj.failProb.toFixed(0)}%
                          </div>
                          <div className="text-[10px] text-muted-foreground">fail risk</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function MetricCard({ 
  icon, 
  label, 
  value, 
  status 
}: { 
  icon: React.ReactNode;
  label: string; 
  value: string; 
  status: 'ok' | 'warning' | 'critical';
}) {
  return (
    <div className={`p-3 rounded-lg border ${
      status === 'critical' ? 'bg-destructive/10 border-destructive/30' :
      status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
      'bg-card border-border'
    }`}>
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-lg font-bold font-mono ${
        status === 'critical' ? 'text-destructive' :
        status === 'warning' ? 'text-yellow-600' :
        'text-foreground'
      }`}>
        {value}
      </div>
    </div>
  );
}

function StressFactor({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  const isElevated = value > 1.0;
  return (
    <div className={`p-2 rounded border ${isElevated ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-background border-border'}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`font-mono font-bold text-sm ${isElevated ? 'text-yellow-600' : 'text-foreground'}`}>
        {value.toFixed(2)}×
      </div>
      <div className="text-[10px] text-muted-foreground">{sublabel}</div>
    </div>
  );
}
