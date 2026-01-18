import { ArrowLeft, Phone, AlertTriangle, Wind, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface COEmergencyFlowProps {
  onBack: () => void;
}

export function COEmergencyFlow({ onBack }: COEmergencyFlowProps) {
  const [isOutside, setIsOutside] = useState(false);
  const [called911, setCalled911] = useState(false);

  const handleEmergencyCall = () => {
    window.location.href = 'tel:911';
    setCalled911(true);
  };

  const handleContractorCall = () => {
    window.location.href = `tel:${demoContractor.emergencyPhone.replace(/[^0-9]/g, '')}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Critical alert header */}
      <header className="bg-red-600 py-4 px-4">
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
                Carbon Monoxide Alert
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Warning banner */}
      <div className="bg-red-600/20 border-b-2 border-red-500 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <Wind className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">
              <span className="font-bold text-red-400">Carbon monoxide is invisible and odorless.</span>
              {' '}If your CO detector is going off, treat it as a real emergency.
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-8">
        {!isOutside ? (
          <>
            {/* Step 1: Get out */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xl animate-pulse">
                  1
                </div>
                <h2 className="text-xl font-bold text-foreground">Get Everyone Outside</h2>
              </div>

              <div className="space-y-3 mb-6">
                <ul className="text-sm text-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Open windows and doors as you leave</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Get all people and pets outside</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Move away from the building — at least 50 feet</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-300">
                  <span className="font-bold">Symptoms of CO poisoning:</span> headache, dizziness, confusion, nausea. 
                  If anyone feels unwell, tell the 911 operator immediately.
                </p>
              </div>

              <Button
                onClick={() => setIsOutside(true)}
                size="lg"
                className="w-full h-14 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl"
              >
                I'm Outside with Everyone
              </Button>
            </motion.div>

            {/* Greyed out next steps */}
            <div className="opacity-40 space-y-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <span className="text-muted-foreground">Call 911</span>
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
                  <h3 className="font-semibold text-foreground">Everyone is outside</h3>
                  <p className="text-xs text-muted-foreground">Stay in fresh air until the area is cleared</p>
                </div>
              </div>
            </motion.div>

            {!called911 ? (
              /* Step 2: Call 911 */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Call 911</h2>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  The fire department will check CO levels and ensure it's safe to return.
                </p>

                <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Tell them:</span>
                    {' '}"My carbon monoxide detector is going off" and your address.
                  </p>
                </div>

                <Button
                  onClick={handleEmergencyCall}
                  size="lg"
                  className="w-full h-14 bg-red-600 hover:bg-red-500 text-white text-lg font-bold rounded-xl"
                >
                  <Phone className="w-5 h-5 mr-3" />
                  Call 911
                </Button>
              </motion.div>
            ) : (
              <>
                {/* Completed step 2 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-emerald-500/10 border-2 border-emerald-500/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                    <div>
                      <h3 className="font-semibold text-foreground">911 has been called</h3>
                      <p className="text-xs text-muted-foreground">Help is on the way</p>
                    </div>
                  </div>
                </motion.div>

                {/* While you wait */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6"
                >
                  <h3 className="font-semibold text-foreground mb-3">While you wait</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Stay outside in fresh air</li>
                    <li>• Count heads — make sure everyone is accounted for</li>
                    <li>• If anyone feels ill, let the paramedics know immediately</li>
                    <li>• Don't go back inside until fire department says it's safe</li>
                  </ul>
                </motion.div>

                {/* After it's safe */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">After it's safe</h2>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    Once cleared, call us to inspect your water heater and identify the CO source.
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
          </>
        )}
      </div>
    </div>
  );
}
