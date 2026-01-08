import { BookOpen, ChevronRight, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeScreenProps {
  onBegin: () => void;
}

export function WelcomeScreen({ onBegin }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="max-w-md mx-auto">
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Water Heater Assessment
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="max-w-md mx-auto w-full space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
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
          <div className="bg-card/50 rounded-xl border border-border/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              What you'll learn:
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-2" />
                <span className="text-sm text-muted-foreground">
                  How your unit compares to industry norms
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-2" />
                <span className="text-sm text-muted-foreground">
                  Factors that affect equipment lifespan
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0 mt-2" />
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
            className="w-full h-12 text-base font-medium rounded-lg"
          >
            Begin Assessment
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
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
