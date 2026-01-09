import { Calculator, ChevronRight, Clock, Handshake, Scale, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background gradient accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Header */}
      <div className="relative p-4 border-b border-border/50">
        <div className="max-w-md mx-auto">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Post-Inspection Report
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/10 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
                <Calculator className="w-9 h-9 text-primary" />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-2 rounded-3xl border border-primary/10 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              Your Water Heater Report Is Ready
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Your plumber uses Opterra Home — physics-based software that tells you what's actually happening with your equipment. We only recommend action when the math says it matters.
            </p>
          </div>

          {/* Trust pillars */}
          <div className="bg-gradient-to-br from-card/80 to-card/40 rounded-xl border border-border/50 p-5 space-y-4 backdrop-blur-sm">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    Physics, Not Guesswork
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Corrosion rates, thermal stress, failure probability — calculated from real data.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Scale className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    No Upsell Incentives
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Opterra Home doesn't earn more when you buy more. We recommend action only when safety, health, or economics justify it.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Handshake className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    Your Plumber, On Your Terms
                  </span>
                  <span className="text-xs text-muted-foreground">
                    When something needs attention, we'll explain why — and connect you with the pro who already knows your system.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">2 minutes to review your results</span>
          </div>

          {/* CTA */}
          <Button
            onClick={onBegin}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 shadow-lg shadow-primary/20"
          >
            View My Report
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This analysis is based on physics calculations and your plumber's inspection data. For hands-on service, your plumber is ready to help — but only when it makes sense.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
