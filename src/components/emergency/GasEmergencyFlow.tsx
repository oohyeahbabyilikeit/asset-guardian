import { ArrowLeft, Phone, AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface GasEmergencyFlowProps {
  onBack: () => void;
}

export function GasEmergencyFlow({ onBack }: GasEmergencyFlowProps) {
  const [isOutside, setIsOutside] = useState(false);

  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
  };

  const handleContractorCall = () => {
    window.location.href = `tel:${demoContractor.emergencyPhone.replace(/[^0-9]/g, '')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Critical alert header */}
      <header className="bg-red-500 py-4 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
              <h1 className="text-lg font-bold text-white">
                Gas Emergency
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Critical warning banner */}
      <div className="bg-red-500/20 border-b-2 border-red-500 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-400 uppercase">
                Do Not Use
              </p>
              <p className="text-xs text-red-300 mt-0.5">
                Light switches, appliances, phones, or anything that could create a spark — including this phone indoors.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-8">
        {!isOutside ? (
          <>
            {/* Step 1: Leave immediately */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl animate-pulse">
                  1
                </div>
                <h2 className="text-xl font-bold text-foreground">Leave Now</h2>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-foreground font-medium">
                  Get everyone out of the building immediately.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Don't turn lights on or off</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Don't start your car in the garage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Don't use your phone until outside</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>Leave doors open as you exit</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => setIsOutside(true)}
                size="lg"
                className="w-full h-14 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl"
              >
                I'm Outside Now
              </Button>
            </motion.div>

            {/* Greyed out next steps */}
            <div className="opacity-40 space-y-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <span className="text-muted-foreground">Call 911 from outside</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <span className="text-muted-foreground">Call gas company</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Completed step 1 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-foreground">You're outside — good!</h3>
                  <p className="text-xs text-muted-foreground">Stay at least 50 feet from the building</p>
                </div>
              </div>
            </motion.div>

            {/* Step 2: Call 911 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <h2 className="text-xl font-bold text-foreground">Call 911</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Report the gas leak. The fire department will ensure the area is safe.
              </p>

              <Button
                onClick={handleEmergencyCall}
                size="lg"
                className="w-full h-14 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl"
              >
                <Phone className="w-5 h-5 mr-3" />
                Call 911
              </Button>
            </motion.div>

            {/* Step 3: Call gas company */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border-2 border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <h2 className="text-xl font-bold text-foreground">Call Gas Company</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                They'll send someone to shut off gas at the meter and check for leaks.
              </p>

              <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Find your gas company's emergency number on your bill, or search:
                </p>
                <a 
                  href="https://www.google.com/search?q=gas+company+emergency+number+near+me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Find gas company number
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>

            {/* Step 4: Call us for repairs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <h2 className="text-lg font-semibold text-foreground">After it's safe</h2>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                Once the fire department and gas company clear the area, call us to inspect and repair your water heater.
              </p>

              <Button
                onClick={handleContractorCall}
                variant="outline"
                size="lg"
                className="w-full h-12 rounded-xl"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call {demoContractor.name}
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
