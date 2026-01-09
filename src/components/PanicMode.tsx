import { ArrowLeft, Phone, Camera, Heart, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';
import { useState } from 'react';

interface PanicModeProps {
  onBack: () => void;
}

export function PanicMode({ onBack }: PanicModeProps) {
  const [step1Done, setStep1Done] = useState(false);
  const [step3Done, setStep3Done] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${demoContractor.emergencyPhone.replace(/[^0-9]/g, '')}`;
  };

  const handlePhotoCapture = () => {
    setStep3Done(true);
    alert('Photo capture would open here. In production, this saves to cloud for insurance claims.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Calming Header */}
      <header className="bg-card border-b border-border py-4 px-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">
              We're Here to Help
            </h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
        {/* Reassurance Message */}
        <div className="text-center py-4">
          <h2 className="text-xl font-semibold text-foreground mb-2">Don't worry — you've got this</h2>
          <p className="text-sm text-muted-foreground">
            Follow these simple steps and we'll take care of the rest.
          </p>
        </div>

        {/* Step 1: Stop the Water */}
        <section className={`rounded-2xl p-5 border-2 transition-all ${
          step1Done 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-primary/50 bg-card'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
              step1Done 
                ? 'bg-emerald-500 text-white' 
                : 'bg-primary text-primary-foreground'
            }`}>
              {step1Done ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Find the Shut-off Valve</h2>
          </div>

          {/* Visual Guide */}
          <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center border border-border relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-32 h-32">
                <rect x="60" y="40" width="80" height="120" rx="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <circle cx="50" cy="80" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" className="animate-pulse" />
                <path 
                  d="M 30 80 L 35 80 M 30 75 L 35 80 L 30 85" 
                  fill="none" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth="3"
                  className="animate-pulse"
                />
                <text x="25" y="110" fill="hsl(var(--primary))" fontSize="10" fontWeight="bold">
                  VALVE
                </text>
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-card/90 rounded-lg px-3 py-2 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                Usually on the cold water inlet pipe above the heater
              </p>
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-3">
            <p className="text-foreground text-sm font-medium text-center">
              Turn the valve handle <span className="font-bold">clockwise</span> until it stops
            </p>
          </div>

          {!step1Done && (
            <Button 
              onClick={() => setStep1Done(true)} 
              variant="outline" 
              className="w-full"
            >
              Done — Water is Off
            </Button>
          )}
          
          {step1Done && (
            <p className="text-center text-emerald-500 text-sm font-medium">
              ✓ Great job! You've stopped the flow.
            </p>
          )}
        </section>

        {/* Step 2: Call for Help */}
        <section className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-destructive text-white flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-lg font-semibold text-foreground">Call for Backup</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Our emergency line connects you directly to a technician — no waiting, no phone trees.
          </p>

          <Button
            onClick={handleCall}
            size="lg"
            className="w-full h-14 bg-destructive hover:bg-destructive/90 text-white text-lg font-semibold rounded-xl"
          >
            <Phone className="w-5 h-5 mr-3" />
            Call Now
          </Button>

          <p className="text-center text-muted-foreground text-xs mt-3">
            Available 24/7 — help is on the way
          </p>
        </section>

        {/* Step 3: Document */}
        <section className={`rounded-2xl p-5 border transition-all ${
          step3Done 
            ? 'border-emerald-500/50 bg-emerald-500/5' 
            : 'border-border bg-card'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              step3Done 
                ? 'bg-emerald-500 text-white' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step3Done ? <CheckCircle className="w-5 h-5" /> : '3'}
            </div>
            <h2 className="text-lg font-semibold text-foreground">Take Photos (Optional)</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Documenting the damage now helps with insurance claims later.
          </p>

          <Button
            onClick={handlePhotoCapture}
            variant="outline"
            size="lg"
            className="w-full h-12 rounded-xl"
          >
            <Camera className="w-5 h-5 mr-3" />
            Take Photos
          </Button>

          {step3Done && (
            <p className="text-center text-emerald-500 text-sm font-medium mt-3">
              ✓ Photos saved to your account
            </p>
          )}
        </section>
      </div>

      {/* Reassuring Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-4 px-4 safe-area-bottom">
        <p className="text-center text-muted-foreground text-sm">
          You're doing everything right. Help is on the way.
        </p>
      </div>
    </div>
  );
}
