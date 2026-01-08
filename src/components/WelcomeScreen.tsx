import { BookOpen, ChevronRight, Clock, Shield, Sparkles, TrendingUp, Droplets } from 'lucide-react';
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
            Water Heater Assessment
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/10 border border-primary/25 flex items-center justify-center shadow-lg shadow-primary/10">
                <BookOpen className="w-9 h-9 text-primary" />
              </div>
              {/* Decorative ring */}
              <div className="absolute -inset-2 rounded-3xl border border-primary/10 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-bold text-foreground">
              Understanding Your Water Heater
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              This assessment helps you understand your water heater using industry data and manufacturer specifications.
            </p>
          </div>

          {/* What you'll learn */}
          <div className="bg-gradient-to-br from-card/80 to-card/40 rounded-xl border border-border/50 p-5 space-y-4 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-foreground">
              What you'll learn:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  How your unit compares to industry norms
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Droplets className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Factors that affect equipment lifespan
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-sm text-muted-foreground">
                  Options other homeowners consider
                </span>
              </li>
            </ul>
          </div>

          {/* Time estimate */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Takes about 2 minutes</span>
          </div>

          {/* CTA */}
          <Button
            onClick={onBegin}
            size="lg"
            className="w-full h-12 text-base font-medium rounded-xl bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-lg shadow-primary/20"
          >
            Begin Assessment
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg border border-border/30">
            <Shield className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This assessment is educational and not a substitute for professional inspection. Always consult a licensed plumber for specific recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
