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
    // Mock functionality - would trigger camera in real app
    alert('Photo capture would open here. In production, this saves to cloud for insurance claims.');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Emergency Header */}
      <header className="bg-status-warning text-black py-4 px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-black/70 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h1 className="text-lg font-bold uppercase tracking-wider">
              Emergency Protocol Active
            </h1>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Step 1: Stop the Water */}
        <section className="bg-slate-900 rounded-xl p-5 border-2 border-status-warning">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-status-warning text-black flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-xl font-bold text-white">STOP THE WATER</h2>
          </div>

          {/* Video Placeholder */}
          <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center border border-status-warning/30 relative overflow-hidden">
            {/* Mock AR overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-32 h-32">
                {/* Water heater simplified */}
                <rect x="60" y="40" width="80" height="120" rx="5" fill="none" stroke="#64748b" strokeWidth="2" />
                {/* Valve indicator */}
                <circle cx="50" cy="80" r="15" fill="none" stroke="#F59E0B" strokeWidth="3" className="animate-pulse" />
                {/* Arrow pointing to valve */}
                <path 
                  d="M 30 80 L 35 80 M 30 75 L 35 80 L 30 85" 
                  fill="none" 
                  stroke="#F59E0B" 
                  strokeWidth="3"
                  className="animate-pulse"
                />
                <text x="30" y="110" fill="#F59E0B" fontSize="10" fontWeight="bold">
                  VALVE
                </text>
              </svg>
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 rounded px-3 py-2">
              <p className="text-xs text-status-warning text-center">
                AR SHUT-OFF GUIDE • Loops automatically
              </p>
            </div>
          </div>

          <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-3">
            <p className="text-status-warning text-sm font-medium text-center">
              Turn the Yellow Handle <span className="font-bold">CLOCKWISE</span> until it stops.
            </p>
          </div>
        </section>

        {/* Step 2: Dispatch Help */}
        <section className="bg-slate-900 rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-status-critical text-white flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-xl font-bold text-white">DISPATCH HELP</h2>
          </div>

          <Button
            onClick={handleCall}
            size="lg"
            className="w-full h-16 bg-status-critical hover:bg-status-critical/90 text-white text-lg font-bold shadow-lg shadow-status-critical/30"
          >
            <Phone className="w-6 h-6 mr-3" />
            CALL PRIORITY EMERGENCY LINE
          </Button>

          <p className="text-center text-muted-foreground text-xs mt-3">
            "Bypasses Phone Tree. Alerts On-Call Tech."
          </p>
        </section>

        {/* Step 3: Documentation */}
        <section className="bg-slate-900 rounded-xl p-5 border border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-muted text-white flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-xl font-bold text-white">DOCUMENTATION</h2>
          </div>

          <Button
            onClick={handlePhotoCapture}
            variant="outline"
            size="lg"
            className="w-full h-14 border-border/50 hover:bg-secondary"
          >
            <Camera className="w-5 h-5 mr-3" />
            PHOTO LOG: Take picture of leak
          </Button>

          <p className="text-center text-muted-foreground text-xs mt-3">
            (Saves to Cloud for Insurance Claim)
          </p>
        </section>
      </div>

      {/* Emergency Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-status-warning/10 border-t border-status-warning/30 py-3 px-4">
        <p className="text-center text-status-warning text-xs">
          🚨 Emergency services notified of active incident
        </p>
      </div>
    </div>
  );
}
