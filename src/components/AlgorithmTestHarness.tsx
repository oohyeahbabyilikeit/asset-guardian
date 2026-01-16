import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Info, Gauge, Shield, Flame, Droplets, MapPin, Clock, Zap, Wrench, Users, Thermometer, Waves, Wind, Activity, AlertCircle, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { AlgorithmCalculationTrace } from './AlgorithmCalculationTrace';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  calculateOpterraRisk, 
  getRiskLevelInfo,
  projectFutureHealth,
  isTankless,
  type ForensicInputs, 
  type OpterraResult,
  type FuelType,
  type TempSetting,
  type LocationType,
  type AirFilterStatus,
  type InletFilterStatus,
  type FlameRodStatus,
  type VentStatus,
  type VentType,
  type ExpansionTankStatus,
  type LeakSource,
  type ConnectionType,
  type RoomVolumeType,
  type SoftenerSaltStatus,
  type UsageType,
  type SanitizerType,
} from '@/lib/opterraAlgorithm';

interface AlgorithmTestHarnessProps {
  onBack: () => void;
}

const DEFAULT_INPUTS: ForensicInputs = {
  // Age & Warranty
  calendarAge: 5,
  warrantyYears: 6,
  
  // Pressure System
  housePsi: 60,
  hasPrv: true,
  hasExpTank: true,
  expTankStatus: 'FUNCTIONAL',
  isClosedLoop: false,
  
  // Usage Calibration
  peopleCount: 3,
  usageType: 'normal',
  tankCapacity: 50,
  
  // Water Quality
  hardnessGPG: 8,
  streetHardnessGPG: undefined,
  measuredHardnessGPG: undefined,
  hasSoftener: false,
  softenerSaltStatus: undefined,
  
  // Equipment
  fuelType: 'GAS',
  ventType: 'ATMOSPHERIC',
  ventingScenario: 'SHARED_FLUE',
  tempSetting: 'NORMAL',
  hasCircPump: false,
  isAnnuallyMaintained: false,
  
  // Location
  location: 'GARAGE',
  isFinishedArea: false,
  hasDrainPan: false,
  
  // Physical Condition
  visualRust: false,
  isLeaking: false,
  leakSource: 'NONE',
  connectionType: 'DIELECTRIC',
  anodeCount: 1,
  
  // Service History
  lastAnodeReplaceYearsAgo: undefined,
  lastFlushYearsAgo: undefined,
  
  // Hybrid (Heat Pump) defaults
  airFilterStatus: 'CLEAN',
  isCondensateClear: true,
  compressorHealth: 100,
  roomVolumeType: 'OPEN',
  
  // Tankless defaults
  flowRateGPM: undefined,
  ratedFlowGPM: 9.5,
  lastDescaleYearsAgo: undefined,
  hasIsolationValves: true,
  inletWaterTemp: 55,
  scaleBuildup: 0,
  errorCodeCount: 0,
  
  // Tankless Gas
  igniterHealth: 100,
  flameRodStatus: 'GOOD',
  tanklessVentStatus: 'CLEAR',
  gasLineSize: '3/4',
  gasRunLength: 20,
  btuRating: 199000,
  
  // Tankless Electric
  elementHealth: 100,
  inletFilterStatus: 'CLEAN',
  hasRecirculationLoop: false,
};

// Test scenario presets for rapid edge-case testing
type TestScenario = {
  name: string;
  description: string;
  inputs: Partial<ForensicInputs>;
};

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Attic Time Bomb',
    description: 'Old unit in finished attic, no pan, thermal expansion risk',
    inputs: {
      calendarAge: 12,
      warrantyYears: 6,
      location: 'ATTIC',
      isFinishedArea: true,
      hasDrainPan: false,
      hasExpTank: false,
      isClosedLoop: true,
      housePsi: 80,
      hardnessGPG: 15,
      lastAnodeReplaceYearsAgo: undefined,
      lastFlushYearsAgo: undefined,
    }
  },
  {
    name: 'Zombie Expansion Tank',
    description: 'Failed expansion tank with high pressure in closed loop',
    inputs: {
      calendarAge: 8,
      hasExpTank: true,
      expTankStatus: 'WATERLOGGED',
      isClosedLoop: true,
      housePsi: 90,
      hasPrv: false,
    }
  },
  {
    name: 'Gas Starvation',
    description: 'Undersized gas line causing tankless issues',
    inputs: {
      fuelType: 'TANKLESS_GAS',
      calendarAge: 3,
      gasLineSize: '1/2',
      gasRunLength: 50,
      btuRating: 199000,
      errorCodeCount: 3,
      igniterHealth: 70,
    }
  },
  {
    name: 'Chloramine + Hard Water',
    description: 'Aggressive water chemistry accelerating corrosion',
    inputs: {
      hardnessGPG: 22,
      sanitizerType: 'CHLORAMINE',
      hasSoftener: false,
      calendarAge: 6,
      tempSetting: 'HOT',
      lastFlushYearsAgo: undefined,
    }
  },
  {
    name: 'Orphaned Flue',
    description: 'Shared flue after furnace upgrade - backdraft risk',
    inputs: {
      fuelType: 'GAS',
      ventType: 'ATMOSPHERIC',
      ventingScenario: 'ORPHANED_FLUE',
      calendarAge: 10,
    }
  },
  {
    name: 'Galvanic Nightmare',
    description: 'Copper-to-steel with no dielectric, leaking connections',
    inputs: {
      connectionType: 'DIRECT_COPPER',
      isLeaking: true,
      leakSource: 'FITTING_VALVE',
      calendarAge: 7,
      visualRust: true,
    }
  },
  {
    name: 'Hybrid Suffocation',
    description: 'Heat pump in closet with blocked airflow',
    inputs: {
      fuelType: 'HYBRID',
      calendarAge: 4,
      roomVolumeType: 'CLOSET_SEALED',
      airFilterStatus: 'CLOGGED',
      compressorHealth: 60,
      isCondensateClear: false,
    }
  },
  {
    name: 'Tankless Scale Crisis',
    description: 'Never descaled tankless in hard water area',
    inputs: {
      fuelType: 'TANKLESS_GAS',
      calendarAge: 5,
      hardnessGPG: 18,
      lastDescaleYearsAgo: undefined,
      hasIsolationValves: false,
      errorCodeCount: 2,
    }
  },
  {
    name: 'Legionella Risk',
    description: 'Low temp setting with stagnant water',
    inputs: {
      tempSetting: 'LOW',
      peopleCount: 1,
      tankCapacity: 80,
      usageType: 'light',
      calendarAge: 8,
    }
  },
  {
    name: 'Perfect Unit',
    description: 'Well-maintained premium unit with ideal conditions',
    inputs: {
      calendarAge: 2,
      warrantyYears: 12,
      hardnessGPG: 3,
      hasSoftener: true,
      softenerSaltStatus: 'OK',
      housePsi: 55,
      hasPrv: true,
      hasExpTank: true,
      expTankStatus: 'FUNCTIONAL',
      isClosedLoop: false,
      lastAnodeReplaceYearsAgo: 1,
      lastFlushYearsAgo: 0.5,
      isAnnuallyMaintained: true,
      connectionType: 'DIELECTRIC',
      visualRust: false,
      isLeaking: false,
      location: 'GARAGE',
      isFinishedArea: false,
      hasDrainPan: true,
    }
  },
];

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
  const isTanklessUnit = isTankless(inputs.fuelType);

  // =====================
  // CRITICAL ISSUES
  // =====================
  
  // Leak Detection (v7.8 Leak Source Classification)
  if (inputs.isLeaking) {
    if (inputs.leakSource === 'TANK_BODY') {
      issues.push({
        id: 'leak_tank_body',
        severity: 'critical',
        title: 'Tank Body Leak - Condemned',
        detail: 'Tank containment has failed. Replacement required immediately.',
        value: 'BREACH'
      });
    } else if (inputs.leakSource === 'FITTING_VALVE') {
      issues.push({
        id: 'leak_fitting',
        severity: 'warning',
        title: 'Fitting/Valve Leak',
        detail: 'Leak at connection point - repairable with fitting replacement.',
        value: 'REPAIRABLE'
      });
    } else if (inputs.leakSource === 'DRAIN_PAN') {
      issues.push({
        id: 'leak_drain_pan',
        severity: 'warning',
        title: 'Drain Pan Water',
        detail: 'Water in drain pan - inspect T&P relief and condensation.',
        value: 'INVESTIGATE'
      });
    } else {
      issues.push({
        id: 'leak_unknown',
        severity: 'critical',
        title: 'Active Leak Detected',
        detail: 'Source unknown - immediate investigation required.',
        value: 'BREACH'
      });
    }
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

  // Pressure Issues
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

  // Bio Age / Failure Probability
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

  // Expansion Tank Issues (v7.8 Zombie Tank Fix)
  const isClosedLoop = inputs.isClosedLoop || inputs.hasPrv;
  if (isClosedLoop) {
    if (!inputs.hasExpTank || inputs.expTankStatus === 'MISSING') {
      issues.push({
        id: 'no_exp_tank',
        severity: 'critical',
        title: 'Missing Expansion Tank',
        detail: 'Closed loop system without expansion tank causes thermal pressure spikes up to 120+ PSI.',
        value: 'MISSING'
      });
    } else if (inputs.expTankStatus === 'WATERLOGGED') {
      issues.push({
        id: 'exp_tank_waterlogged',
        severity: 'critical',
        title: 'Waterlogged Expansion Tank',
        detail: 'Expansion tank bladder has failed. Tank provides zero protection - replace immediately.',
        value: 'DEAD BLADDER'
      });
    }
  }

  // Connection Type (v7.9 Galvanic Blind Spot)
  if (inputs.connectionType === 'DIRECT_COPPER') {
    issues.push({
      id: 'galvanic_corrosion',
      severity: 'critical',
      title: 'Galvanic Corrosion Risk',
      detail: 'Direct copper-to-steel connection causes accelerated electrochemical corrosion. Install dielectric unions.',
      value: 'DIRECT COPPER'
    });
  }

  // Legionella Warning
  if (metrics.bacterialGrowthWarning) {
    issues.push({
      id: 'legionella',
      severity: 'critical',
      title: 'Legionella Risk',
      detail: 'Temperature setting below 120°F allows harmful bacteria growth. Raise to 120°F minimum.',
      value: '<120°F'
    });
  }

  // High-Risk Location without Drain Pan (v7.8 Attic Bomb)
  if ((inputs.location === 'ATTIC' || inputs.location === 'UPPER_FLOOR') && !inputs.hasDrainPan) {
    issues.push({
      id: 'no_drain_pan_attic',
      severity: 'critical',
      title: 'No Drain Pan in High-Risk Location',
      detail: `${inputs.location} installation without drain pan. Leak would cause catastrophic ceiling damage.`,
      value: 'CODE VIOLATION'
    });
  }

  // Hybrid in Sealed Closet (v7.9 Suffocation)
  if (inputs.fuelType === 'HYBRID' && inputs.roomVolumeType === 'CLOSET_SEALED') {
    issues.push({
      id: 'hybrid_suffocation',
      severity: 'critical',
      title: 'Hybrid Suffocation Risk',
      detail: 'Heat pump requires 700+ cu ft of air. Sealed closet starves compressor - efficiency drops 50%+.',
      value: 'SEALED CLOSET'
    });
  }

  // =====================
  // TANKLESS CRITICAL (v8.0 Safe Mode)
  // =====================
  if (isTanklessUnit) {
    // No Isolation Valves - Maintenance Impossible
    if (inputs.hasIsolationValves === false) {
      issues.push({
        id: 'no_isolation_valves',
        severity: 'critical',
        title: 'No Isolation Valves',
        detail: 'Unit cannot be descaled without isolation valves. Install valves or run to failure.',
        value: 'RUN TO FAIL'
      });
    }

    // Error codes indicate issues
    if ((inputs.errorCodeCount ?? 0) >= 3) {
      issues.push({
        id: 'error_codes_critical',
        severity: 'critical',
        title: 'Multiple Error Codes',
        detail: `${inputs.errorCodeCount} error codes detected. Unit may be in lockout or approaching failure.`,
        value: `${inputs.errorCodeCount} ERRORS`
      });
    } else if ((inputs.errorCodeCount ?? 0) >= 1) {
      issues.push({
        id: 'error_codes_warn',
        severity: 'warning',
        title: 'Error Codes Present',
        detail: `${inputs.errorCodeCount} error code(s) detected. Investigate and clear.`,
        value: `${inputs.errorCodeCount} ERROR(S)`
      });
    }

    // Gas Starvation (Gas Tankless only)
    if (inputs.fuelType === 'TANKLESS_GAS' && inputs.gasLineSize && inputs.btuRating) {
      const maxBtuByPipe: Record<string, number> = {
        '1/2': 120000,
        '3/4': 260000,
        '1': 500000,
      };
      const maxBtu = maxBtuByPipe[inputs.gasLineSize] || 260000;
      if (inputs.btuRating > maxBtu) {
        issues.push({
          id: 'gas_starvation',
          severity: 'critical',
          title: 'Gas Line Undersized',
          detail: `${inputs.gasLineSize}" line maxes at ${maxBtu.toLocaleString()} BTU but unit is ${inputs.btuRating.toLocaleString()} BTU. Unit will short-cycle.`,
          value: 'UNDERSIZED'
        });
      }
    }
  }

  // =====================
  // WARNING ISSUES
  // =====================
  
  if (inputs.housePsi >= 70 && inputs.housePsi <= 80) {
    issues.push({
      id: 'pressure_elevated',
      severity: 'warning',
      title: 'Elevated Pressure',
      detail: `Pressure ${inputs.housePsi} PSI is within code but elevated. PRV would reduce stress.`,
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

  // Sediment Issues (Tank units only - tankless don't accumulate sediment the same way)
  if (!isTanklessUnit) {
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
        detail: `${metrics.sedimentLbs.toFixed(1)} lbs of sediment - too hard to flush safely. Flush could cause leaks.`,
        value: `${metrics.sedimentLbs.toFixed(1)} lbs`
      });
    }
  }

  // Anode Issues (Tank units only - tankless don't have anodes)
  if (!isTanklessUnit) {
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
  }

  // Water Quality / Softener
  if (inputs.hasSoftener) {
    if (inputs.softenerSaltStatus === 'EMPTY') {
      issues.push({
        id: 'softener_empty',
        severity: 'warning',
        title: 'Softener Salt Empty',
        detail: 'Softener has no salt - running on hard water. Refill immediately.',
        value: 'EMPTY'
      });
    } else if (inputs.softenerSaltStatus === 'UNKNOWN') {
      issues.push({
        id: 'softener_unknown',
        severity: 'info',
        title: 'Softener Salt Unknown',
        detail: 'Salt level not verified - may be bridged. Check and verify operation.',
        value: 'CHECK'
      });
    } else {
      issues.push({
        id: 'softener_active',
        severity: 'info',
        title: 'Water Softener Active',
        detail: 'Softener increases conductivity, accelerating anode consumption by 2.4x.',
        value: 'ACTIVE'
      });
    }
  }

  // NEW v7.10: Chloramine Corrosion Warning
  if (inputs.sanitizerType === 'CHLORAMINE') {
    issues.push({
      id: 'chloramine_corrosion',
      severity: 'warning',
      title: 'Chloramine Water Supply',
      detail: 'Chloramine is more corrosive to brass fittings and rubber seals. Anode consumption +20%. Softener resin degrades 30-50% faster.',
      value: 'NH₂Cl'
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

  // Connection Type Warning
  if (inputs.connectionType === 'BRASS') {
    issues.push({
      id: 'brass_connection',
      severity: 'info',
      title: 'Brass Connections',
      detail: 'Brass nipples provide some galvanic protection but not as effective as dielectric unions.',
      value: 'BRASS'
    });
  }

  // Venting Scenario Warning (v7.9)
  if (inputs.ventingScenario === 'ORPHANED_FLUE') {
    issues.push({
      id: 'orphaned_flue',
      severity: 'warning',
      title: 'Orphaned Flue Detected',
      detail: 'Water heater is only appliance on masonry chimney. Replacement will require chimney liner (~$2,000).',
      value: '+$2,000'
    });
  }

  // =====================
  // HYBRID ISSUES
  // =====================
  if (inputs.fuelType === 'HYBRID') {
    if (inputs.airFilterStatus === 'CLOGGED') {
      issues.push({
        id: 'air_filter_clogged',
        severity: 'critical',
        title: 'Air Filter Clogged',
        detail: 'Clogged air filter severely restricts airflow. Compressor damage imminent.',
        value: 'CLOGGED'
      });
    } else if (inputs.airFilterStatus === 'DIRTY') {
      issues.push({
        id: 'air_filter_dirty',
        severity: 'warning',
        title: 'Air Filter Dirty',
        detail: 'Dirty air filter reduces efficiency by 10-25%. Clean or replace soon.',
        value: 'DIRTY'
      });
    }
    
    if (inputs.isCondensateClear === false) {
      issues.push({
        id: 'condensate_blocked',
        severity: 'warning',
        title: 'Condensate Drain Blocked',
        detail: 'Blocked condensate drain can cause water damage and unit shutdown.',
        value: 'BLOCKED'
      });
    }

    // Only check compressor health for Hybrid units
    if (inputs.fuelType === 'HYBRID') {
      if ((inputs.compressorHealth ?? 100) < 50) {
        issues.push({
          id: 'compressor_failing',
          severity: 'critical',
          title: 'Compressor Failing',
          detail: `Compressor health at ${inputs.compressorHealth}%. Unit will fail soon.`,
          value: `${inputs.compressorHealth}%`
        });
      } else if ((inputs.compressorHealth ?? 100) < 75) {
        issues.push({
          id: 'compressor_degraded',
          severity: 'warning',
          title: 'Compressor Degraded',
          detail: `Compressor health at ${inputs.compressorHealth}%. Efficiency reduced.`,
          value: `${inputs.compressorHealth}%`
        });
      }
    }

    if (inputs.roomVolumeType === 'CLOSET_LOUVERED') {
      issues.push({
        id: 'hybrid_louvered',
        severity: 'info',
        title: 'Louvered Closet Installation',
        detail: 'Louvered doors provide some airflow but efficiency may be reduced 10-20%.',
        value: 'LOUVERED'
      });
    }
  }

  // =====================
  // TANKLESS WARNINGS
  // =====================
  if (isTanklessUnit) {
    // Scale Buildup Warning
    if ((inputs.scaleBuildup ?? 0) >= 30 && (inputs.scaleBuildup ?? 0) < 80) {
      issues.push({
        id: 'scale_buildup',
        severity: 'warning',
        title: 'Scale Buildup Detected',
        detail: `Heat exchanger ${inputs.scaleBuildup}% blocked. Schedule descaling soon.`,
        value: `${inputs.scaleBuildup}%`
      });
    }

    // Descaling Due
    if ((inputs.lastDescaleYearsAgo ?? 0) >= 2 && inputs.hardnessGPG > 7) {
      issues.push({
        id: 'descale_due',
        severity: 'warning',
        title: 'Descaling Overdue',
        detail: `Last descale ${inputs.lastDescaleYearsAgo} years ago with hard water. Schedule maintenance.`,
        value: 'OVERDUE'
      });
    }

    // Flow Degradation
    if (inputs.flowRateGPM && inputs.ratedFlowGPM) {
      const degradation = ((inputs.ratedFlowGPM - inputs.flowRateGPM) / inputs.ratedFlowGPM) * 100;
      if (degradation >= 30) {
        issues.push({
          id: 'flow_degraded',
          severity: 'warning',
          title: 'Flow Rate Degraded',
          detail: `Flow ${inputs.flowRateGPM} GPM vs ${inputs.ratedFlowGPM} GPM rated (${degradation.toFixed(0)}% loss).`,
          value: `${degradation.toFixed(0)}% LOSS`
        });
      }
    }

    // Igniter Health
    if ((inputs.igniterHealth ?? 100) < 50 && inputs.fuelType === 'TANKLESS_GAS') {
      issues.push({
        id: 'igniter_weak',
        severity: 'warning',
        title: 'Weak Igniter',
        detail: `Igniter health at ${inputs.igniterHealth}%. May fail to light on cold starts.`,
        value: `${inputs.igniterHealth}%`
      });
    }

    // Flame Rod Worn
    if (inputs.flameRodStatus === 'WORN') {
      issues.push({
        id: 'flame_rod_worn',
        severity: 'warning',
        title: 'Flame Rod Worn',
        detail: 'Flame rod showing wear. Schedule replacement before failure.',
        value: 'WORN'
      });
    }

    // Vent Restricted
    if (inputs.tanklessVentStatus === 'RESTRICTED') {
      issues.push({
        id: 'vent_restricted',
        severity: 'warning',
        title: 'Vent Restricted',
        detail: 'Restricted vent reduces combustion efficiency and may trigger error codes.',
        value: 'RESTRICTED'
      });
    }

    // Inlet Filter
    if (inputs.inletFilterStatus === 'CLOGGED') {
      issues.push({
        id: 'inlet_filter_clogged',
        severity: 'warning',
        title: 'Inlet Filter Clogged',
        detail: 'Clogged inlet filter restricts water flow. Clean immediately.',
        value: 'CLOGGED'
      });
    } else if (inputs.inletFilterStatus === 'DIRTY') {
      issues.push({
        id: 'inlet_filter_dirty',
        severity: 'info',
        title: 'Inlet Filter Dirty',
        detail: 'Inlet filter collecting debris. Clean during next service.',
        value: 'DIRTY'
      });
    }

    // Error Codes
    if ((inputs.errorCodeCount ?? 0) >= 3) {
      issues.push({
        id: 'error_codes',
        severity: 'warning',
        title: 'Frequent Error Codes',
        detail: `${inputs.errorCodeCount} error codes logged. Unit may have underlying issues.`,
        value: `${inputs.errorCodeCount} ERRORS`
      });
    }

    // Element Health (Electric Tankless)
    if ((inputs.elementHealth ?? 100) < 50 && inputs.fuelType === 'TANKLESS_ELECTRIC') {
      issues.push({
        id: 'element_failing',
        severity: 'warning',
        title: 'Heating Element Degraded',
        detail: `Element health at ${inputs.elementHealth}%. Heating capacity reduced.`,
        value: `${inputs.elementHealth}%`
      });
    }
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

interface WaterQualityLookupResult {
  utilityName: string;
  sanitizerType: 'CHLORINE' | 'CHLORAMINE' | 'UNKNOWN';
  hardnessGPG: number;
  confidence: number;
  sourceUrl?: string;
  fromCache?: boolean;
}

export function AlgorithmTestHarness({ onBack }: AlgorithmTestHarnessProps) {
  const [inputs, setInputs] = useState<ForensicInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<OpterraResult | null>(null);
  
  // Water quality lookup state
  const [zipCode, setZipCode] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<WaterQualityLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const isTanklessUnit = isTankless(inputs.fuelType);
  const isGasTankless = inputs.fuelType === 'TANKLESS_GAS';
  const isElectricTankless = inputs.fuelType === 'TANKLESS_ELECTRIC';
  const isHybrid = inputs.fuelType === 'HYBRID';

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
    setZipCode('');
    setLookupResult(null);
    setLookupError(null);
    setSelectedScenario('');
  };

  const [selectedScenario, setSelectedScenario] = useState('');
  
  const applyScenario = (scenarioName: string) => {
    const scenario = TEST_SCENARIOS.find(s => s.name === scenarioName);
    if (scenario) {
      setInputs({ ...DEFAULT_INPUTS, ...scenario.inputs });
      setSelectedScenario(scenarioName);
    }
  };

  const updateInput = <K extends keyof ForensicInputs>(key: K, value: ForensicInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleWaterQualityLookup = async () => {
    if (zipCode.length !== 5) return;
    
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-water-quality', {
        body: { zipCode }
      });
      
      if (error) throw error;
      
      setLookupResult({
        utilityName: data.utilityName || 'Unknown Utility',
        sanitizerType: data.sanitizer || data.sanitizerType || 'UNKNOWN',
        hardnessGPG: data.hardnessGPG ?? 8,
        confidence: data.confidence ?? 0,
        sourceUrl: data.sourceUrl,
        fromCache: data.cached || data.fromCache || false,
      });
    } catch (err) {
      console.error('Water quality lookup failed:', err);
      setLookupError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLookupLoading(false);
    }
  };

  const applyLookupValues = () => {
    if (!lookupResult) return;
    updateInput('streetHardnessGPG', lookupResult.hardnessGPG);
    updateInput('hardnessGPG', lookupResult.hardnessGPG);
    // v7.11: Always apply sanitizer type from API (including UNKNOWN)
    if (lookupResult.sanitizerType) {
      updateInput('sanitizerType', lookupResult.sanitizerType);
    }
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
              <p className="text-xs text-muted-foreground">v8.0 Safe Mode Engine - Asset-First Testing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedScenario} onValueChange={applyScenario}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue placeholder="Load Scenario..." />
              </SelectTrigger>
              <SelectContent>
                {TEST_SCENARIOS.map(scenario => (
                  <SelectItem key={scenario.name} value={scenario.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{scenario.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={resetInputs}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Inputs */}
        <ScrollArea className="lg:w-96 lg:border-r border-border">
          <div className="p-4 space-y-6">
            
            {/* ==================== */}
            {/* ASSET TYPE SELECTOR - FIRST */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5" /> Select Asset Type
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'GAS', label: 'Gas Tank', icon: Flame, desc: 'Standard gas' },
                  { value: 'ELECTRIC', label: 'Electric Tank', icon: Zap, desc: 'Standard electric' },
                  { value: 'HYBRID', label: 'Heat Pump', icon: Wind, desc: 'Hybrid unit' },
                  { value: 'TANKLESS_GAS', label: 'Tankless Gas', icon: Activity, desc: 'On-demand gas' },
                  { value: 'TANKLESS_ELECTRIC', label: 'Tankless Elec', icon: Zap, desc: 'On-demand elec' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateInput('fuelType', type.value as FuelType)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all",
                      inputs.fuelType === type.value 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <type.icon className={cn("w-5 h-5 mb-1", 
                      inputs.fuelType === type.value ? "text-primary" : "text-muted-foreground")} 
                    />
                    <div className="text-sm font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.desc}</div>
                  </button>
                ))}
              </div>
              
              {/* Safe Mode Banner for Tankless */}
              {isTanklessUnit && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 mt-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-blue-600">
                      <strong>v8.0 Safe Mode:</strong> Uses exception-based logic gates:
                      <span className="font-mono ml-1">DEAD → DYING → DIRTY → HEALTHY</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Hybrid Pivot Banner */}
              {isHybrid && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mt-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-emerald-600">
                      <strong>Hybrid Pivot:</strong> Heat pumps now use Electric Tank physics (no compressor inputs needed).
                    </div>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* ==================== */}
            {/* AGE & WARRANTY */}
            {/* ==================== */}
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
                  <Label className="text-xs">
                    Warranty {isTanklessUnit && <span className="text-muted-foreground">(Heat Exchanger)</span>}
                  </Label>
                  <Select value={String(inputs.warrantyYears)} onValueChange={(v) => updateInput('warrantyYears', Number(v))}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {isTanklessUnit ? (
                        <>
                          <SelectItem value="5">5 Years (Builder)</SelectItem>
                          <SelectItem value="10">10 Years (Standard)</SelectItem>
                          <SelectItem value="12">12 Years (Premium)</SelectItem>
                          <SelectItem value="15">15 Years (Pro)</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="6">6 Years (Builder)</SelectItem>
                          <SelectItem value="9">9 Years (Standard)</SelectItem>
                          <SelectItem value="12">12 Years (Pro)</SelectItem>
                          <SelectItem value="15">15 Years (Premium)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {!isTanklessUnit && (
                  <div>
                    <Label className="text-xs">Anode Count</Label>
                    <Select value={String(inputs.anodeCount ?? 1)} onValueChange={(v) => updateInput('anodeCount', Number(v) as 1 | 2)}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Anode (Standard)</SelectItem>
                        <SelectItem value="2">2 Anodes (Pro/Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* USAGE CALIBRATION */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Usage Calibration
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">People in Household</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={inputs.peopleCount}
                    onChange={(e) => updateInput('peopleCount', Number(e.target.value))}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Usage Style</Label>
                  <Select value={inputs.usageType} onValueChange={(v) => updateInput('usageType', v as UsageType)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (Quick showers)</SelectItem>
                      <SelectItem value="normal">Normal (Average use)</SelectItem>
                      <SelectItem value="heavy">Heavy (Long showers, high demand)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isTanklessUnit && (
                  <div>
                    <Label className="text-xs">Tank Capacity (gallons)</Label>
                    <Input
                      type="number"
                      min={20}
                      max={100}
                      value={inputs.tankCapacity}
                      onChange={(e) => updateInput('tankCapacity', Number(e.target.value))}
                      className="mt-1 h-9"
                    />
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* SERVICE HISTORY */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5" /> Service History
              </h2>
              <div className="space-y-3">
                {!isTanklessUnit && (
                  <>
                    <div>
                      <Label className="text-xs">Anode Replaced (years ago)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={inputs.calendarAge}
                          value={inputs.lastAnodeReplaceYearsAgo ?? ''}
                          placeholder="Never"
                          onChange={(e) => updateInput('lastAnodeReplaceYearsAgo', e.target.value ? Number(e.target.value) : undefined)}
                          className="h-9"
                        />
                        {inputs.lastAnodeReplaceYearsAgo !== undefined && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateInput('lastAnodeReplaceYearsAgo', undefined)}
                            className="h-9 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Last Flush (years ago)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          min={0}
                          max={inputs.calendarAge}
                          value={inputs.lastFlushYearsAgo ?? ''}
                          placeholder="Never"
                          onChange={(e) => updateInput('lastFlushYearsAgo', e.target.value ? Number(e.target.value) : undefined)}
                          className="h-9"
                        />
                        {inputs.lastFlushYearsAgo !== undefined && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => updateInput('lastFlushYearsAgo', undefined)}
                            className="h-9 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-xs">Annually Maintained</Label>
                      <Switch 
                        checked={inputs.isAnnuallyMaintained ?? false} 
                        onCheckedChange={(v) => updateInput('isAnnuallyMaintained', v)} 
                      />
                    </div>
                  </>
                )}
                {isTanklessUnit && (
                  <div>
                    <Label className="text-xs">Last Descale (years ago)</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        min={0}
                        value={inputs.lastDescaleYearsAgo ?? ''}
                        placeholder="Never"
                        onChange={(e) => updateInput('lastDescaleYearsAgo', e.target.value ? Number(e.target.value) : undefined)}
                        className="h-9"
                      />
                      {inputs.lastDescaleYearsAgo !== undefined && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => updateInput('lastDescaleYearsAgo', undefined)}
                          className="h-9 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* PRESSURE SYSTEM */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Gauge className="w-3.5 h-3.5" /> Pressure System
              </h2>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">House PSI (Static)</Label>
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
                  <Label className="text-xs">Closed Loop System</Label>
                  <Switch checked={inputs.isClosedLoop} onCheckedChange={(v) => updateInput('isClosedLoop', v)} />
                </div>
                {!isTanklessUnit && (
                  <>
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-xs">Has Expansion Tank</Label>
                      <Switch checked={inputs.hasExpTank} onCheckedChange={(v) => updateInput('hasExpTank', v)} />
                    </div>
                    {inputs.hasExpTank && (
                      <div>
                        <Label className="text-xs">Expansion Tank Status</Label>
                        <Select 
                          value={inputs.expTankStatus || 'FUNCTIONAL'} 
                          onValueChange={(v) => updateInput('expTankStatus', v as ExpansionTankStatus)}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FUNCTIONAL">Functional</SelectItem>
                            <SelectItem value="WATERLOGGED">Waterlogged (Dead Bladder)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* WATER QUALITY */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Droplets className="w-3.5 h-3.5" /> Water Quality
              </h2>
              <div className="space-y-3">
                {/* ZIP Code Lookup */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
                  <Label className="text-xs font-semibold">ZIP Code Lookup</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      maxLength={5}
                      value={zipCode}
                      placeholder="Enter ZIP"
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="h-9 flex-1"
                    />
                    <Button 
                      size="sm" 
                      className="h-9"
                      disabled={zipCode.length !== 5 || lookupLoading}
                      onClick={handleWaterQualityLookup}
                    >
                      {lookupLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {lookupError && (
                    <div className="text-xs text-destructive">{lookupError}</div>
                  )}
                  
                  {lookupResult && (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Utility</span>
                        <span className="font-medium truncate max-w-[180px]">{lookupResult.utilityName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Sanitizer</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          lookupResult.sanitizerType === 'CHLORAMINE' 
                            ? 'bg-orange-500/20 text-orange-600' 
                            : lookupResult.sanitizerType === 'CHLORINE'
                            ? 'bg-emerald-500/20 text-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {lookupResult.sanitizerType || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Hardness</span>
                        <span className="font-medium">{lookupResult.hardnessGPG} GPG</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className={`font-medium ${
                          lookupResult.confidence >= 80 ? 'text-emerald-600' :
                          lookupResult.confidence >= 60 ? 'text-yellow-600' :
                          'text-destructive'
                        }`}>{lookupResult.confidence}%</span>
                      </div>
                      {lookupResult.fromCache && (
                        <div className="text-muted-foreground italic">From cache</div>
                      )}
                      {lookupResult.sanitizerType === 'CHLORAMINE' && (
                        <div className="flex items-center gap-1.5 p-2 rounded bg-orange-500/10 border border-orange-500/30 text-orange-600">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Chloramine accelerates softener resin degradation</span>
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full h-8 text-xs mt-2"
                        onClick={applyLookupValues}
                      >
                        Use These Values
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs">Street Hardness (GPG) - From API</Label>
                  <Input
                    type="number"
                    value={inputs.streetHardnessGPG ?? inputs.hardnessGPG}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateInput('streetHardnessGPG', val);
                      updateInput('hardnessGPG', val);
                    }}
                    className="mt-1 h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Measured Hardness (GPG) - Test Strip</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={inputs.measuredHardnessGPG ?? ''}
                      placeholder="Optional override"
                      onChange={(e) => updateInput('measuredHardnessGPG', e.target.value ? Number(e.target.value) : undefined)}
                      className="h-9"
                    />
                    {inputs.measuredHardnessGPG !== undefined && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => updateInput('measuredHardnessGPG', undefined)}
                        className="h-9 px-2 text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Sanitizer Type (from ZIP lookup)</Label>
                  <Select 
                    value={inputs.sanitizerType || 'UNKNOWN'} 
                    onValueChange={(v) => updateInput('sanitizerType', v as SanitizerType)}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHLORINE">Chlorine (Standard)</SelectItem>
                      <SelectItem value="CHLORAMINE">Chloramine ⚠️ (More Corrosive)</SelectItem>
                      <SelectItem value="UNKNOWN">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  {inputs.sanitizerType === 'CHLORAMINE' && (
                    <p className="text-xs text-orange-500 mt-1">
                      +20% anode consumption, accelerates softener resin degradation
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Water Softener</Label>
                  <Switch checked={inputs.hasSoftener} onCheckedChange={(v) => updateInput('hasSoftener', v)} />
                </div>
                {inputs.hasSoftener && (
                  <div>
                    <Label className="text-xs">Salt Level Status</Label>
                    <Select 
                      value={inputs.softenerSaltStatus || 'UNKNOWN'} 
                      onValueChange={(v) => updateInput('softenerSaltStatus', v as SoftenerSaltStatus)}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OK">OK - Salt Verified Full</SelectItem>
                        <SelectItem value="EMPTY">Empty - No Salt</SelectItem>
                        <SelectItem value="UNKNOWN">Unknown - Not Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* EQUIPMENT (Fuel type moved to top) */}
            {/* ==================== */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" /> Equipment Settings
              </h2>
              <div className="space-y-3">
                {!isTanklessUnit && (
                  <div>
                    <Label className="text-xs">Vent Type</Label>
                    <Select value={inputs.ventType || 'ATMOSPHERIC'} onValueChange={(v) => updateInput('ventType', v as VentType)}>
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ATMOSPHERIC">Atmospheric</SelectItem>
                        <SelectItem value="POWER_VENT">Power Vent (+$800)</SelectItem>
                        <SelectItem value="DIRECT_VENT">Direct Vent (+$600)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {inputs.fuelType === 'GAS' && (
                  <div>
                    <Label className="text-xs">Venting Scenario</Label>
                    <Select 
                      value={inputs.ventingScenario || 'SHARED_FLUE'} 
                      onValueChange={(v) => updateInput('ventingScenario', v as 'SHARED_FLUE' | 'ORPHANED_FLUE' | 'DIRECT_VENT')}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHARED_FLUE">Shared Flue (with furnace)</SelectItem>
                        <SelectItem value="ORPHANED_FLUE">Orphaned Flue (+$2,000 liner)</SelectItem>
                        <SelectItem value="DIRECT_VENT">Direct Vent (self-contained)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label className="text-xs">Temperature Setting</Label>
                  <Select value={inputs.tempSetting} onValueChange={(v) => updateInput('tempSetting', v as TempSetting)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low (&lt;120°F) ⚠️ Legionella</SelectItem>
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

            {/* ==================== */}
            {/* HYBRID / HEAT PUMP */}
            {/* ==================== */}
            {isHybrid && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Wind className="w-3.5 h-3.5" /> Heat Pump Specifics
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Air Filter Status</Label>
                      <Select 
                        value={inputs.airFilterStatus || 'CLEAN'} 
                        onValueChange={(v) => updateInput('airFilterStatus', v as AirFilterStatus)}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLEAN">Clean</SelectItem>
                          <SelectItem value="DIRTY">Dirty</SelectItem>
                          <SelectItem value="CLOGGED">Clogged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <Label className="text-xs">Condensate Drain Clear</Label>
                      <Switch 
                        checked={inputs.isCondensateClear ?? true} 
                        onCheckedChange={(v) => updateInput('isCondensateClear', v)} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Compressor Health: {inputs.compressorHealth ?? 100}%</Label>
                      <Slider 
                        value={[inputs.compressorHealth ?? 100]}
                        onValueChange={([v]) => updateInput('compressorHealth', v)}
                        min={0}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Room Volume</Label>
                      <Select 
                        value={inputs.roomVolumeType || 'OPEN'} 
                        onValueChange={(v) => updateInput('roomVolumeType', v as RoomVolumeType)}
                      >
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open Area (700+ cu ft)</SelectItem>
                          <SelectItem value="CLOSET_LOUVERED">Louvered Closet</SelectItem>
                          <SelectItem value="CLOSET_SEALED">Sealed Closet ⚠️</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ==================== */}
            {/* TANKLESS DIAGNOSTICS */}
            {/* ==================== */}
            {isTanklessUnit && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Tankless (Safe Mode)
                  </h2>
                  <div className="space-y-3">
                    <div className="p-2 rounded bg-blue-500/5 border border-blue-500/20">
                      <div className="text-[10px] font-semibold uppercase text-blue-600 mb-2">Active Inputs</div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Error Code Count</Label>
                          <Input
                            type="number"
                            min={0}
                            value={inputs.errorCodeCount ?? 0}
                            onChange={(e) => updateInput('errorCodeCount', Number(e.target.value))}
                            className="mt-1 h-9"
                          />
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <Label className="text-xs">Has Isolation Valves</Label>
                          <Switch 
                            checked={inputs.hasIsolationValves ?? true} 
                            onCheckedChange={(v) => updateInput('hasIsolationValves', v)} 
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Inlet Filter Status</Label>
                          <Select 
                            value={inputs.inletFilterStatus || 'CLEAN'} 
                            onValueChange={(v) => updateInput('inletFilterStatus', v as InletFilterStatus)}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLEAN">Clean</SelectItem>
                              <SelectItem value="DIRTY">Dirty</SelectItem>
                              <SelectItem value="CLOGGED">Clogged</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ==================== */}
            {/* GAS TANKLESS SPECIFIC */}
            {/* ==================== */}
            {isGasTankless && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-orange-500 mb-3 flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5" /> Gas Tankless (Safe Mode)
                  </h2>
                  <div className="space-y-3">
                    {/* ACTIVE INPUTS - Used by Safe Mode */}
                    <div className="p-2 rounded bg-orange-500/5 border border-orange-500/20">
                      <div className="text-[10px] font-semibold uppercase text-orange-600 mb-2">Active Inputs</div>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Vent Status</Label>
                          <Select 
                            value={inputs.tanklessVentStatus || 'CLEAR'} 
                            onValueChange={(v) => updateInput('tanklessVentStatus', v as VentStatus)}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLEAR">Clear</SelectItem>
                              <SelectItem value="RESTRICTED">Restricted</SelectItem>
                              <SelectItem value="BLOCKED">Blocked ⚠️ DEAD Gate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Gas Line Size</Label>
                          <Select 
                            value={inputs.gasLineSize || '3/4'} 
                            onValueChange={(v) => updateInput('gasLineSize', v as '1/2' | '3/4' | '1')}
                          >
                            <SelectTrigger className="mt-1 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1/2">1/2" (max 120k BTU)</SelectItem>
                              <SelectItem value="3/4">3/4" (max 260k BTU)</SelectItem>
                              <SelectItem value="1">1" (max 500k BTU)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">BTU Rating</Label>
                          <Input
                            type="number"
                            value={inputs.btuRating ?? 199000}
                            onChange={(e) => updateInput('btuRating', Number(e.target.value))}
                            className="mt-1 h-9"
                          />
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </section>
              </>
            )}

            {/* ==================== */}
            {/* ELECTRIC TANKLESS */}
            {/* ==================== */}
            {isElectricTankless && (
              <>
                <Separator />
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-500 mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Electric Tankless (Safe Mode)
                  </h2>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground italic">
                      Safe Mode uses age, error codes, and water quality only. No element-specific inputs.
                    </p>
                  </div>
                </section>
              </>
            )}

            <Separator />

            {/* ==================== */}
            {/* LOCATION */}
            {/* ==================== */}
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
                      <SelectItem value="ATTIC">Attic ⚠️ High Risk</SelectItem>
                      <SelectItem value="UPPER_FLOOR">Upper Floor ⚠️ High Risk</SelectItem>
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
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs">Has Drain Pan</Label>
                  <Switch checked={inputs.hasDrainPan ?? false} onCheckedChange={(v) => updateInput('hasDrainPan', v)} />
                </div>
              </div>
            </section>

            <Separator />

            {/* ==================== */}
            {/* PHYSICAL CONDITION */}
            {/* ==================== */}
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
                {inputs.isLeaking && (
                  <div>
                    <Label className="text-xs">Leak Source</Label>
                    <Select 
                      value={inputs.leakSource || 'NONE'} 
                      onValueChange={(v) => updateInput('leakSource', v as LeakSource)}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TANK_BODY">Tank Body ⚠️ Condemned</SelectItem>
                        <SelectItem value="FITTING_VALVE">Fitting/Valve (Repairable)</SelectItem>
                        <SelectItem value="DRAIN_PAN">Drain Pan (Investigate)</SelectItem>
                        <SelectItem value="NONE">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!isTanklessUnit && (
                  <div>
                    <Label className="text-xs">Connection Type</Label>
                    <Select 
                      value={inputs.connectionType || 'DIELECTRIC'} 
                      onValueChange={(v) => updateInput('connectionType', v as ConnectionType)}
                    >
                      <SelectTrigger className="mt-1 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DIELECTRIC">Dielectric Unions ✓</SelectItem>
                        <SelectItem value="BRASS">Brass Nipples</SelectItem>
                        <SelectItem value="DIRECT_COPPER">Direct Copper ⚠️</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                <div className="flex flex-wrap gap-2">
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
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">All Detected Issues ({issues.length})</h3>
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
                      icon={<Gauge className="w-4 h-4" />}
                      label="Effective PSI" 
                      value={`${result.metrics.effectivePsi} PSI`} 
                      status={result.metrics.effectivePsi > 100 ? 'critical' : result.metrics.effectivePsi > 80 ? 'warning' : 'ok'}
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
                    <MetricCard 
                      icon={<Activity className="w-4 h-4" />}
                      label="Health Score" 
                      value={`${result.metrics.healthScore}`} 
                      status={result.metrics.healthScore < 40 ? 'critical' : result.metrics.healthScore < 70 ? 'warning' : 'ok'}
                    />
                    <MetricCard 
                      icon={<Thermometer className="w-4 h-4" />}
                      label="Aging Rate" 
                      value={`${result.metrics.agingRate.toFixed(2)}x`} 
                      status={result.metrics.agingRate > 3 ? 'critical' : result.metrics.agingRate > 1.5 ? 'warning' : 'ok'}
                    />
                  </div>
                </div>

                {/* Tankless-Specific Metrics (Safe Mode) */}
                {isTanklessUnit && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      Tankless Safe Mode Status
                      <span className="text-[10px] font-normal text-blue-500">(v8.0)</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <MetricCard 
                        icon={<Activity className="w-4 h-4" />}
                        label="Logic Gate" 
                        value={
                          result.metrics.failProb >= 99 ? 'DEAD' :
                          result.metrics.failProb >= 70 ? 'DYING' :
                          result.metrics.descaleStatus === 'due' || result.metrics.descaleStatus === 'run_to_failure' ? 'DIRTY' :
                          'HEALTHY'
                        } 
                        status={
                          result.metrics.failProb >= 99 ? 'critical' :
                          result.metrics.failProb >= 70 ? 'warning' :
                          'ok'
                        }
                      />
                      <MetricCard 
                        icon={<Wrench className="w-4 h-4" />}
                        label="Descale Status" 
                        value={result.metrics.descaleStatus?.toUpperCase().replace('_', ' ') ?? 'OPTIMAL'} 
                        status={
                          result.metrics.descaleStatus === 'lockout' || 
                          result.metrics.descaleStatus === 'impossible' || 
                          result.metrics.descaleStatus === 'run_to_failure' ? 'critical' : 
                          result.metrics.descaleStatus === 'critical' || result.metrics.descaleStatus === 'due' ? 'warning' : 'ok'
                        }
                      />
                      <MetricCard 
                        icon={<AlertTriangle className="w-4 h-4" />}
                        label="Primary Stressor" 
                        value={result.metrics.primaryStressor || 'Normal Wear'} 
                        status={
                          result.metrics.primaryStressor?.includes('Breach') || 
                          result.metrics.primaryStressor?.includes('Obstruction') ? 'critical' :
                          result.metrics.primaryStressor?.includes('Error') ||
                          result.metrics.primaryStressor?.includes('Scale') ? 'warning' : 'ok'
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Safety Warnings */}
                {(result.metrics.bacterialGrowthWarning || (isHybrid && result.hardWaterTax.elementBurnoutRisk !== undefined && result.hardWaterTax.elementBurnoutRisk > 50)) && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-destructive">Safety Warnings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.metrics.bacterialGrowthWarning && (
                        <MetricCard 
                          icon={<AlertCircle className="w-4 h-4" />}
                          label="Legionella Risk" 
                          value="ACTIVE" 
                          status="critical"
                        />
                      )}
                      {isHybrid && result.hardWaterTax.elementBurnoutRisk !== undefined && result.hardWaterTax.elementBurnoutRisk > 50 && (
                        <MetricCard 
                          icon={<Zap className="w-4 h-4" />}
                          label="Element Burnout" 
                          value={`${result.hardWaterTax.elementBurnoutRisk}%`} 
                          status={result.hardWaterTax.elementBurnoutRisk > 75 ? 'critical' : 'warning'}
                        />
                      )}
                    </div>
                  </div>
                )}

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
                    <div className="grid grid-cols-3 gap-3 text-center">
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
                      <StressFactor 
                        label="Usage" 
                        value={result.metrics.stressFactors.usageIntensity} 
                        sublabel="Occupancy"
                      />
                      <StressFactor 
                        label="Sizing" 
                        value={result.metrics.stressFactors.undersizing} 
                        sublabel="Tank Fit"
                      />
                    </div>
                    <div className="text-center mt-3 text-xs text-muted-foreground font-mono">
                      Mechanical: {result.metrics.stressFactors.mechanical.toFixed(2)}× · Chemical: {result.metrics.stressFactors.chemical.toFixed(2)}× · Total: {result.metrics.stressFactors.total.toFixed(2)}×
                    </div>
                  </div>
                </div>

                {/* Hard Water Tax */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hard Water Tax</h3>
                  <div className={`p-4 rounded-lg border ${
                    result.hardWaterTax.recommendation === 'RECOMMEND' ? 'bg-orange-500/10 border-orange-500/30' :
                    result.hardWaterTax.recommendation === 'CONSIDER' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    result.hardWaterTax.recommendation === 'PROTECTED' ? 'bg-emerald-500/10 border-emerald-500/30' :
                    'bg-card border-border'
                  }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Hardness</div>
                        <div className="text-sm font-bold">{result.hardWaterTax.hardnessGPG} GPG</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Annual Loss</div>
                        <div className="text-sm font-bold text-destructive">${result.hardWaterTax.totalAnnualLoss}/yr</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Net Savings</div>
                        <div className={`text-sm font-bold ${result.hardWaterTax.netAnnualSavings > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          ${result.hardWaterTax.netAnnualSavings}/yr
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Payback</div>
                        <div className="text-sm font-bold">{result.hardWaterTax.paybackYears.toFixed(1)} yrs</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        result.hardWaterTax.badgeColor === 'orange' ? 'bg-orange-500/20 text-orange-600' :
                        result.hardWaterTax.badgeColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-emerald-500/20 text-emerald-600'
                      }`}>
                        {result.hardWaterTax.recommendation}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.hardWaterTax.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Forecast */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financial Forecast</h3>
                  <div className={`p-4 rounded-lg border ${
                    result.financial.budgetUrgency === 'IMMEDIATE' ? 'bg-destructive/10 border-destructive/30' :
                    result.financial.budgetUrgency === 'HIGH' ? 'bg-orange-500/10 border-orange-500/30' :
                    result.financial.budgetUrgency === 'MED' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    <div className="grid grid-cols-3 gap-3 text-center mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Target Date</div>
                        <div className={`text-sm font-bold ${
                          result.financial.budgetUrgency === 'IMMEDIATE' ? 'text-destructive' :
                          result.financial.budgetUrgency === 'HIGH' ? 'text-orange-500' :
                          'text-foreground'
                        }`}>
                          {result.financial.targetReplacementDate}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Est. Cost</div>
                        <div className="text-sm font-bold font-mono">
                          ${result.financial.estReplacementCostMin.toLocaleString()}-${result.financial.estReplacementCostMax.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Monthly Budget</div>
                        <div className={`text-sm font-bold font-mono ${
                          result.financial.budgetUrgency === 'IMMEDIATE' ? 'text-destructive' :
                          result.financial.budgetUrgency === 'HIGH' ? 'text-orange-500' :
                          'text-emerald-500'
                        }`}>
                          ${result.financial.monthlyBudget}/mo
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        result.financial.budgetUrgency === 'IMMEDIATE' ? 'bg-destructive/20 text-destructive' :
                        result.financial.budgetUrgency === 'HIGH' ? 'bg-orange-500/20 text-orange-600' :
                        result.financial.budgetUrgency === 'MED' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-emerald-500/20 text-emerald-600'
                      }`}>
                        {result.financial.budgetUrgency}
                      </div>
                      <p className="text-xs text-muted-foreground">{result.financial.recommendation}</p>
                    </div>
                    {/* Tier Info */}
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground mb-1">Current Tier: <span className="font-semibold text-foreground">{result.financial.currentTier.tierLabel}</span></div>
                      <div className="text-[10px] text-muted-foreground">
                        Like-for-like: ${result.financial.likeForLikeCost.toLocaleString()} 
                        {result.financial.upgradeTier && (
                          <> · Upgrade to {result.financial.upgradeTier.tierLabel}: ${result.financial.upgradeCost?.toLocaleString()}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculation Trace - Step-by-step breakdown */}
                <AlgorithmCalculationTrace inputs={inputs} result={result} />

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
