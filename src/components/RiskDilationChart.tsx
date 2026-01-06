import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ArrowRight, Info } from 'lucide-react';
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
}: RiskDilationChartProps) {
  const maxAge = Math.max(30, biologicalAge + 5);
  const paperPercent = (calendarAge / maxAge) * 100;
  const bioPercent = (biologicalAge / maxAge) * 100;
  
  // Animated values
  const animatedPaperWidth = useAnimatedNumber(paperPercent, 800, 200);
  const animatedBioWidth = useAnimatedNumber(bioPercent, 1200, 600);
  const animatedForensicRisk = useAnimatedNumber(forensicRisk, 1500, 800);
  const animatedBioAge = useAnimatedNumber(biologicalAge, 1200, 600);

  return (
    <TooltipProvider>
      <section className="mx-4 mb-4">
        {/* Ghost Bar Chart Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-700/50 p-6 mb-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                    Warranty Expired
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
                      {hasSoftener ? 'Softener' : 'Standard'} ({defenseFactor.toFixed(2)} Defense) + Pressure ({stressFactor.toFixed(2)}x Stress) = {accelerationFactor.toFixed(1)}x Aging Speed
                    </p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-red-400 font-data">
                    {animatedBioAge.toFixed(1)} Years
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950/80 text-red-400 uppercase tracking-wider border border-red-800/50">
                    Statistically Dead
                  </span>
                </div>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                {/* Ghost trail */}
                <div 
                  className="absolute inset-y-0 left-0 ghost-bar rounded-full"
                  style={{ width: `${Math.min(animatedBioWidth, 100)}%` }}
                />
                {/* Solid tip */}
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${Math.min(animatedBioWidth, 100)}%` }}
                >
                  {/* Glow effect at tip */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-red-400 to-transparent rounded-r-full" />
                </div>
                {/* Overflow indicator */}
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
            <span>10 yrs</span>
            <span>20 yrs</span>
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
                {accelerationFactor.toFixed(1)}x Acceleration
              </span>
            </div>

            {/* Your Risk */}
            <div className="text-center flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your Risk</p>
              <p className="text-3xl font-black text-red-500 font-data animate-pulse">
                {animatedForensicRisk.toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Insight Text */}
          <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="text-red-400 font-semibold">Mrs. Jones,</span> {insight}
            </p>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}
