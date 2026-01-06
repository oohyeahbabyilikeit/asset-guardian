import { AlertCircle, CheckCircle2, TrendingUp, MapPin, AlertTriangle, Activity, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type HealthScore as HealthScoreType } from '@/data/mockAsset';
import { getRiskLevelInfo, type RiskLevel } from '@/lib/opterraAlgorithm';

interface HealthGaugeProps {
  healthScore: HealthScoreType;
  location: string;
  riskLevel: RiskLevel;
  agingRate?: number;
}

// Aging Speedometer Component
function AgingSpeedometer({ agingRate }: { agingRate: number }) {
  // Clamp aging rate for display (0.5x to 3x range)
  const minRate = 0.5;
  const maxRate = 3;
  const clampedRate = Math.min(Math.max(agingRate, minRate), maxRate);
  
  // Calculate needle angle (-135° to +135° = 270° sweep)
  const normalizedRate = (clampedRate - minRate) / (maxRate - minRate);
  const needleAngle = -135 + (normalizedRate * 270);
  
  // Color zones
  const getZoneColor = () => {
    if (agingRate <= 1.0) return '#22C55E'; // Green - slower than normal
    if (agingRate <= 1.5) return '#F59E0B'; // Amber - slightly accelerated
    return '#EF4444'; // Red - rapid aging
  };

  const getStatusText = () => {
    if (agingRate <= 0.8) return 'Excellent';
    if (agingRate <= 1.0) return 'Normal';
    if (agingRate <= 1.5) return 'Elevated';
    if (agingRate <= 2.0) return 'High';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-16 overflow-hidden">
        {/* Background arc */}
        <svg className="absolute inset-0 w-28 h-28" viewBox="0 0 100 100">
          {/* Gauge background */}
          <path
            d="M 15 75 A 40 40 0 1 1 85 75"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Green zone (0.5x - 1.0x) */}
          <path
            d="M 15 75 A 40 40 0 0 1 28 35"
            fill="none"
            stroke="#22C55E"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Amber zone (1.0x - 1.5x) */}
          <path
            d="M 28 35 A 40 40 0 0 1 50 15"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="8"
            opacity="0.4"
          />
          {/* Red zone (1.5x - 3.0x) */}
          <path
            d="M 50 15 A 40 40 0 0 1 85 75"
            fill="none"
            stroke="#EF4444"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.4"
          />
          {/* Needle */}
          <g transform={`rotate(${needleAngle}, 50, 50)`}>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="20"
              stroke={getZoneColor()}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                filter: `drop-shadow(0 0 4px ${getZoneColor()})`,
              }}
            />
            <circle
              cx="50"
              cy="50"
              r="5"
              fill={getZoneColor()}
              style={{
                filter: `drop-shadow(0 0 6px ${getZoneColor()})`,
              }}
            />
          </g>
        </svg>
      </div>
      
      {/* Rate value */}
      <div className="text-center -mt-1">
        <span 
          className="text-xl font-black font-data"
          style={{ color: getZoneColor() }}
        >
          {agingRate.toFixed(1)}x
        </span>
        <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
}

export function HealthGauge({ healthScore, location, riskLevel, agingRate = 1.0 }: HealthGaugeProps) {
  const { score, status, failureProbability } = healthScore;
  const riskInfo = getRiskLevelInfo(riskLevel);
  
  // Calculate stroke dash offset for the ring
  const circumference = 351;
  const strokeDashoffset = circumference - (score / 100) * circumference;


  const getRingColor = () => {
    if (status === 'critical') return '#EF4444';
    if (status === 'warning') return '#F59E0B';
    return '#22C55E';
  };

  const getGlowClass = () => {
    if (status === 'critical') return 'animate-critical-pulse';
    return '';
  };

  return (
    <div className="clean-card relative overflow-hidden mx-4 mt-4 tech-corners">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      
      {/* Scan line effect for critical */}
      {status === 'critical' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-scan-line" />
        </div>
      )}
      
      {/* Radial glow background */}
      <div className={cn(
        "absolute inset-0 pointer-events-none",
        status === 'critical' && "bg-gradient-radial from-red-950/30 to-transparent",
        status === 'warning' && "bg-gradient-radial from-amber-950/30 to-transparent",
        status === 'optimal' && "bg-gradient-radial from-green-950/30 to-transparent"
      )} />

      <div className="relative flex flex-col items-center text-center">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 self-start">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-data">
            System Diagnostics
          </span>
        </div>

        {/* Score Ring + Aging Speedometer */}
        <div className="flex items-center justify-center gap-6 w-full mb-4">
          {/* Score Ring */}
          <div className={cn("relative rounded-full", getGlowClass())}>
            <div className="w-36 h-36 rounded-full border-[8px] border-secondary flex items-center justify-center bg-card">
              <div className="text-center">
                <span className="block text-4xl font-black text-foreground tracking-tight font-data">
                  {score}
                </span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            
            {/* Colored Progress Ring */}
            <svg 
              className="absolute top-0 left-0 w-36 h-36 -rotate-90"
              style={{
                filter: `drop-shadow(0 0 12px ${getRingColor()})`,
              }}
            >
              <circle 
                cx="72" 
                cy="72" 
                r="56" 
                fill="none" 
                stroke={getRingColor()} 
                strokeWidth="8" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>

          {/* Aging Speedometer */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-2">
              <Gauge className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aging Rate
              </span>
            </div>
            <AgingSpeedometer agingRate={agingRate} />
          </div>
        </div>


        {/* Risk Stats Grid */}
        <div className="w-full grid grid-cols-2 gap-3">
          {/* Failure Probability */}
          <div className="data-box data-box-critical">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Failure Risk
              </span>
            </div>
              <div className="text-2xl font-black text-red-400 font-data">
                {failureProbability === 'FAIL' 
                  ? 'FAIL' 
                  : `${typeof failureProbability === 'number' ? failureProbability.toFixed(1) : failureProbability}%`}
              </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {failureProbability === 'FAIL' ? 'Breach detected' : 'Annual probability'}
            </div>
          </div>

          {/* Location Risk Level */}
          <div className={cn(
            "data-box",
            riskLevel >= 3 ? "data-box-critical" : "data-box-warning"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={cn("w-4 h-4", riskLevel >= 3 ? "text-red-400" : "text-amber-400")} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Location Risk
              </span>
            </div>
            <div className={cn(
              "text-xl font-black font-data",
              riskLevel >= 3 ? "text-red-400" : "text-amber-400"
            )}>
              {riskInfo.label}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Damage severity
            </div>
          </div>
        </div>

        {/* Location & Context */}
        <div className="w-full mt-4 p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-start gap-2 text-left">
            <MapPin className={cn(
              "w-4 h-4 mt-0.5 shrink-0",
              riskLevel >= 3 ? "text-red-400" : "text-amber-400"
            )} />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider font-data",
                riskLevel >= 3 ? "text-red-400" : "text-amber-400"
              )}>
                {location} Installation
              </span>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {riskInfo.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
