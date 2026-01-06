import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ArrowRight, Info, Battery, Gauge, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RiskDilationChartProps {
  calendarAge: number;
  biologicalAge: number;
  baselineRisk: number;
  forensicRisk: number;
  accelerationFactor: number;
  stressFactor: number;
  defenseFactor: number;
  hasSoftener: boolean;
  insight: string;
  anodeLifespan: number;
  exposureYears: number;
  nakedAgingRate: number;
}

function useAnimatedNumber(target: number, duration: number = 1000, delay: number = 0) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(target * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [started, target, duration]);

  return current;
}

export function RiskDilationChart({
  calendarAge,
  biologicalAge,
  baselineRisk,
  forensicRisk,
  accelerationFactor,
  stressFactor,
  defenseFactor,
  hasSoftener,
  insight,
  anodeLifespan,
  exposureYears,
  nakedAgingRate,
}: RiskDilationChartProps) {
  const maxAge = Math.max(20, biologicalAge + 5);
  const paperPercent = (calendarAge / maxAge) * 100;
  const bioPercent = (biologicalAge / maxAge) * 100;
  
  // Animated values
  const animatedPaperWidth = useAnimatedNumber(paperPercent, 800, 200);
  const animatedBioWidth = useAnimatedNumber(bioPercent, 1200, 600);
  const animatedForensicRisk = useAnimatedNumber(forensicRisk, 1500, 800);
  const animatedBioAge = useAnimatedNumber(biologicalAge, 1200, 600);
  const animatedNakedRate = useAnimatedNumber(nakedAgingRate, 1000, 400);

  // Calculate shield battery level (0% if exposure > 0)
  const shieldLevel = exposureYears > 0 ? 0 : Math.max(0, (1 - calendarAge / anodeLifespan) * 100);
  const yearsAgo = Math.round(exposureYears * 10) / 10;

  return (
    <TooltipProvider>
      <section className="mx-4 mb-4 space-y-4">
        {/* Protection Status Cards - Shield Battery + Rust Rate */}
        <div className="grid grid-cols-2 gap-4">
          {/* Shield Battery Card */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Battery className={cn(
                "w-5 h-5",
                shieldLevel > 0 ? "text-emerald-400" : "text-red-400"
              )} />
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Corrosion Protection
              </span>
            </div>
            
            {/* Battery Visualization */}
            <div className="relative mb-3">
              <div className="h-16 w-full bg-slate-800 rounded-lg border-2 border-slate-600 overflow-hidden relative">
                {/* Battery cap */}
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-6 bg-slate-600 rounded-r" />
                
                {/* Battery level */}
                <div 
                  className={cn(
                    "h-full transition-all duration-1000",
                    shieldLevel > 50 ? "bg-emerald-500" : 
                    shieldLevel > 20 ? "bg-amber-500" : 
                    "bg-red-500/30"
                  )}
                  style={{ width: `${Math.max(shieldLevel, 0)}%` }}
                />
                
                {/* Empty state indicator */}
                {shieldLevel === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-8 h-8 text-red-400/50" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <p className={cn(
                "text-2xl font-bold font-data",
                shieldLevel > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {Math.round(shieldLevel)}%
              </p>
              <p className={cn(
                "text-[10px] uppercase tracking-wider mt-1 px-2 py-1 rounded inline-block",
                shieldLevel > 0 
                  ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/50" 
                  : "bg-red-950/50 text-red-400 border border-red-800/50"
              )}>
                {shieldLevel > 0 
                  ? `${Math.round(anodeLifespan - calendarAge)} Years Remaining`
                  : `Expired ${yearsAgo} Years Ago`
                }
              </p>
            </div>
          </div>

          {/* Rust Rate Speedometer Card */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-amber-400" />
              <span className="text-xs uppercase tracking-widest text-slate-400">
                Deterioration Speed
              </span>
            </div>
            
            {/* Speedometer Visualization */}
            <div className="relative h-16 mb-3 flex items-end justify-center">
              {/* Speed arc background */}
              <div className="absolute bottom-0 w-full h-12 overflow-hidden">
                <div className="w-full h-24 rounded-full border-8 border-slate-700 border-t-transparent" />
              </div>
              
              {/* Speed zones */}
              <div className="absolute bottom-0 w-full h-12 overflow-hidden">
                <div className="w-full h-24 rounded-full" style={{
                  background: 'conic-gradient(from 180deg, #22c55e 0deg, #22c55e 60deg, #eab308 60deg, #eab308 120deg, #ef4444 120deg, #ef4444 180deg, transparent 180deg)'
                }} />
              </div>
              
              {/* Needle */}
              <div 
                className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
                style={{ 
                  transform: `translateX(-50%) rotate(${Math.min((animatedNakedRate / 5) * 90 - 90, 90)}deg)`,
                }}
              >
                <div className="w-1 h-10 bg-white rounded-full shadow-lg" />
                <div className="w-3 h-3 bg-white rounded-full -mt-1 -ml-1" />
              </div>
            </div>
            
            <div className="text-center">
              <p className={cn(
                "text-2xl font-bold font-data",
                nakedAgingRate <= 1 ? "text-emerald-400" : 
                nakedAgingRate <= 2 ? "text-amber-400" : "text-red-400"
              )}>
                {animatedNakedRate.toFixed(1)}x
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-1">
                {exposureYears > 0 
                  ? "Rusting at accelerated rate"
                  : "Normal aging rate"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Age Dilation Analysis */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-6">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Age Dilation Analysis
          </h3>

          <div className="space-y-6">
            {/* Paper Age Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">Paper Age</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-400 font-data">{calendarAge} Years</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 uppercase tracking-wider">
                    {calendarAge > 6 ? 'Warranty Expired' : 'Under Warranty'}
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${animatedPaperWidth}%` }}
                />
              </div>
            </div>

            {/* Biological Age Bar - Ghost Effect */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">Biological Age</span>
                      <Info className="w-3 h-3 text-slate-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-slate-800 border-slate-700">
                    <p className="text-xs">
                      Shield died after {anodeLifespan.toFixed(1)} years. Tank has been unprotected for {exposureYears.toFixed(1)} years, aging at {nakedAgingRate.toFixed(1)}x speed due to pressure ({stressFactor.toFixed(2)}x stress).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-400 font-data">
                    {animatedBioAge.toFixed(1)} Years
                  </span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded uppercase tracking-wider border",
                    biologicalAge >= 13 
                      ? "bg-red-950/80 text-red-400 border-red-800/50" 
                      : "bg-amber-950/80 text-amber-400 border-amber-800/50"
                  )}>
                    {biologicalAge >= 13 ? 'End of Life' : 'Accelerated Wear'}
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                {/* Ghost trail */}
                <div 
                  className="absolute inset-y-0 left-0 ghost-bar rounded-full"
                  style={{ width: `${Math.min(animatedBioWidth, 100)}%` }}
                />
                {/* Solid bar */}
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${Math.min(animatedBioWidth, 100)}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-red-400 to-transparent rounded-r-full" />
                </div>
                {bioPercent > 100 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 pr-2">
                    <ArrowRight className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Age scale */}
          <div className="flex justify-between mt-2 text-[10px] text-slate-500">
            <span>0</span>
            <span>7 yrs</span>
            <span>13 yrs</span>
            <span>{maxAge}+ yrs</span>
          </div>
        </div>

        {/* Probability Gap Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Standard Risk */}
            <div className="text-center flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Standard Risk</p>
              <p className="text-2xl font-bold text-slate-400 font-data">{baselineRisk}%</p>
            </div>

            {/* Arrow with Acceleration */}
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="flex items-center gap-2">
                <div className="w-12 h-px bg-gradient-to-r from-slate-600 via-red-500 to-red-500" />
                <ArrowRight className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider whitespace-nowrap">
                {accelerationFactor.toFixed(0)}x Higher Risk
              </span>
            </div>

            {/* Your Risk */}
            <div className="text-center flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your Risk</p>
              <p className={cn(
                "text-3xl font-black font-data",
                forensicRisk >= 40 ? "text-red-500 animate-pulse" : 
                forensicRisk >= 25 ? "text-amber-500" : "text-emerald-500"
              )}>
                {animatedForensicRisk.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Insight Text */}
          <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-amber-400 font-semibold">Mrs. Jones,</span> {insight}
            </p>
          </div>

          {/* Recommendation */}
          <div className="mt-4 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50">
            <p className="text-xs text-amber-300 font-medium text-center">
              {forensicRisk >= 25 
                ? "⚠️ Recommendation: Replace Anode OR Tank immediately"
                : "Recommendation: Schedule anode inspection within 6 months"
              }
            </p>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}