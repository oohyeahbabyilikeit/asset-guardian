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
  // Use the displayed (rounded) value for status to avoid mismatch
  const displayRate = parseFloat(agingRate.toFixed(1));
  
  // Clamp for visual needle position (0.5x to 3.0x range)
  const minRate = 0.5;
  const maxRate = 3.0;
  const clampedRate = Math.min(Math.max(displayRate, minRate), maxRate);
  
  // Calculate needle angle for a half-circle (-90 to +90 degrees)
  const normalizedRate = (clampedRate - minRate) / (maxRate - minRate);
  const needleAngle = -90 + (normalizedRate * 180);
  
  // Color based on displayed rate
  const getColor = () => {
    if (displayRate <= 1.0) return 'hsl(142 71% 45%)'; // Green
    if (displayRate <= 1.5) return 'hsl(45 93% 47%)'; // Amber
    return 'hsl(0 84% 60%)'; // Red
  };
  
  // Status text aligned with color thresholds
  const getStatusText = () => {
    if (displayRate <= 1.0) return 'Normal';
    if (displayRate <= 1.5) return 'Elevated';
    if (displayRate <= 2.0) return 'High';
    return 'Critical';
  };

  return (
    <div className="flex flex-col items-center">
      {/* Speedometer gauge */}
      <svg width="100" height="56" viewBox="0 0 100 56" className="overflow-visible">
        {/* Background arc */}
        <path
          d="M 10 52 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Green zone (0.5x-1.0x) - first 20% of arc */}
        <path
          d="M 10 52 A 40 40 0 0 1 22 22"
          fill="none"
          stroke="hsl(142 71% 45% / 0.4)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Amber zone (1.0x-1.5x) - next 20% */}
        <path
          d="M 22 22 A 40 40 0 0 1 50 12"
          fill="none"
          stroke="hsl(45 93% 47% / 0.4)"
          strokeWidth="6"
        />
        {/* Red zone (1.5x-3.0x) - last 60% */}
        <path
          d="M 50 12 A 40 40 0 0 1 90 52"
          fill="none"
          stroke="hsl(0 84% 60% / 0.4)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        
        {/* Needle */}
        <g 
          style={{ 
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '50px 52px',
            transition: 'transform 0.5s ease-out'
          }}
        >
          <line
            x1="50"
            y1="52"
            x2="50"
            y2="18"
            stroke={getColor()}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${getColor()})` }}
          />
          <circle 
            cx="50" 
            cy="52" 
            r="4" 
            fill={getColor()}
            style={{ filter: `drop-shadow(0 0 6px ${getColor()})` }}
          />
        </g>
      </svg>
      
      {/* Rate value and status */}
      <div className="flex flex-col items-center mt-1">
        <span 
          className="text-xl font-black font-data"
          style={{ color: getColor() }}
        >
          {displayRate.toFixed(1)}x
        </span>
        <span 
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: getColor() }}
        >
          {getStatusText()}
        </span>
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
        <div className="flex items-center gap-2 mb-4 self-start">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-data">
            System Diagnostics
          </span>
        </div>

        {/* Score Ring + Aging Speedometer */}
        <div className="flex items-center justify-center gap-10 w-full mb-5">
          {/* Score Ring */}
          <div className={cn("relative rounded-full", getGlowClass())}>
            <div className="w-32 h-32 rounded-full border-[6px] border-secondary flex items-center justify-center bg-card">
              <div className="text-center">
                <span className="block text-3xl font-black text-foreground tracking-tight font-data">
                  {score}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">/ 100</span>
              </div>
            </div>
            
            {/* Colored Progress Ring */}
            <svg 
              className="absolute top-0 left-0 w-32 h-32 -rotate-90"
              style={{
                filter: `drop-shadow(0 0 10px ${getRingColor()})`,
              }}
            >
              <circle 
                cx="64" 
                cy="64" 
                r="51" 
                fill="none" 
                stroke={getRingColor()} 
                strokeWidth="6" 
                strokeDasharray={320} 
                strokeDashoffset={320 - (score / 100) * 320} 
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>

          {/* Aging Speedometer */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
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
                Industry Failure Rate
              </span>
            </div>
              <div className="text-2xl font-black text-red-400 font-data">
                {failureProbability === 'FAIL' 
                  ? 'FAIL' 
                  : `${typeof failureProbability === 'number' ? failureProbability.toFixed(1) : failureProbability}%`}
              </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {failureProbability === 'FAIL' ? 'Breach detected' : 'For similar units'}
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
      
      {/* Disclaimer */}
      <p className="text-[9px] text-muted-foreground/60 text-center mt-3">
        Statistics based on industry data for similar units. Individual results may vary.
      </p>
    </div>
  );
}
