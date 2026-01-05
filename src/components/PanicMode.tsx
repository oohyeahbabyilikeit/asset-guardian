import { ArrowLeft, Phone, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';

interface PanicModeProps {
  onBack: () => void;
}

export function PanicMode({ onBack }: PanicModeProps) {
  const handleCall = () => {
    window.location.href = `tel:${demoContractor.emergencyPhone.replace(/[^0-9]/g, '')}`;
  };

  const handlePhotoCapture = () => {
    alert('Photo capture would open here. In production, this saves to cloud for insurance claims.');
  };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Emergency Header */}
      <header className="bg-amber-400 text-amber-950 py-4 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-amber-900 hover:text-amber-950 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h1 className="text-lg font-bold uppercase tracking-wider">
              Emergency Protocol
            </h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* Step 1: Stop the Water */}
        <section className="bg-card rounded-2xl p-5 border-2 border-amber-400 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-xl font-bold text-foreground">Stop the Water</h2>
          </div>

          {/* Visual Guide */}
          <div className="aspect-video bg-muted rounded-xl mb-4 flex items-center justify-center border border-border relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-32 h-32">
                <rect x="60" y="40" width="80" height="120" rx="5" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground" />
                <circle cx="50" cy="80" r="15" fill="none" stroke="#F59E0B" strokeWidth="3" className="animate-pulse" />
                <path 
                  d="M 30 80 L 35 80 M 30 75 L 35 80 L 30 85" 
                  fill="none" 
                  stroke="#F59E0B" 
                  strokeWidth="3"
                  className="animate-pulse"
                />
                <text x="25" y="110" fill="#F59E0B" fontSize="10" fontWeight="bold">
                  VALVE
                </text>
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-card/90 rounded-lg px-3 py-2 border border-border">
              <p className="text-xs text-amber-700 text-center font-medium">
                AR Shut-off Guide
              </p>
            </div>
          </div>

          <div className="bg-amber-100 border border-amber-200 rounded-xl p-3">
            <p className="text-amber-800 text-sm font-medium text-center">
              Turn the valve handle <span className="font-bold">CLOCKWISE</span> until it stops.
            </p>
          </div>
        </section>

        {/* Step 2: Dispatch Help */}
        <section className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-xl font-bold text-foreground">Call for Help</h2>
          </div>

          <Button
            onClick={handleCall}
            size="lg"
            className="w-full h-16 bg-red-500 hover:bg-red-600 text-white text-lg font-bold rounded-xl shadow-lg"
          >
            <Phone className="w-6 h-6 mr-3" />
            Call Emergency Line
          </Button>

          <p className="text-center text-muted-foreground text-xs mt-3">
            Bypasses phone tree, alerts on-call tech directly
          </p>
        </section>

        {/* Step 3: Documentation */}
        <section className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-xl font-bold text-foreground">Document Damage</h2>
          </div>

          <Button
            onClick={handlePhotoCapture}
            variant="outline"
            size="lg"
            className="w-full h-14 rounded-xl"
          >
            <Camera className="w-5 h-5 mr-3" />
            Take Photo for Insurance
          </Button>

          <p className="text-center text-muted-foreground text-xs mt-3">
            Photos save to cloud for your claim
          </p>
        </section>
      </div>

      {/* Emergency Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-amber-100 border-t border-amber-200 py-3 px-4 safe-area-bottom">
        <p className="text-center text-amber-800 text-sm font-medium">
          🚨 Emergency protocol active
        </p>
      </div>
    </div>
  );
}
