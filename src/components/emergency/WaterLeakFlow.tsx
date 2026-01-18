import { ArrowLeft, Phone, Camera, CheckCircle, Droplets, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaterLeakFlowProps {
  onBack: () => void;
}

export function WaterLeakFlow({ onBack }: WaterLeakFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);

  const handleCall = () => {
    window.location.href = `tel:${demoContractor.emergencyPhone.replace(/[^0-9]/g, '')}`;
  };

  const completeStep = (step: number) => {
    if (step === currentStep) {
      setCurrentStep(step + 1);
      setExpandedSteps(prev => [...prev.filter(s => s !== step), step + 1]);
    }
  };

  const toggleExpand = (step: number) => {
    if (step <= currentStep) {
      setExpandedSteps(prev => 
        prev.includes(step) 
          ? prev.filter(s => s !== step)
          : [...prev, step]
      );
    }
  };

  const isStepComplete = (step: number) => step < currentStep;
  const isStepActive = (step: number) => step === currentStep;
  const isStepExpanded = (step: number) => expandedSteps.includes(step);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <header className="bg-blue-500/10 border-b border-blue-500/20 py-4 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-semibold text-foreground">
                Water Leak Emergency
              </h1>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  isStepComplete(step) 
                    ? 'bg-emerald-500' 
                    : isStepActive(step)
                    ? 'bg-blue-500'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-3 max-w-md mx-auto pb-32">
        {/* Reassurance */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h2 className="text-xl font-semibold text-foreground">
            Take a breath — you've got this
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Follow these steps and we'll take care of the rest
          </p>
        </motion.div>

        {/* Step 1: Shut off water */}
        <StepCard
          stepNumber={1}
          title="Stop the Water"
          isComplete={isStepComplete(1)}
          isActive={isStepActive(1)}
          isExpanded={isStepExpanded(1)}
          onToggle={() => toggleExpand(1)}
          onComplete={() => completeStep(1)}
          estimatedTime="30 seconds"
        >
          <div className="space-y-4">
            {/* Visual diagram */}
            <div className="relative bg-gradient-to-b from-blue-500/5 to-blue-500/10 rounded-xl p-6 border border-blue-500/20">
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 180 140" className="w-full max-w-[200px] h-auto">
                  {/* Water heater body */}
                  <rect x="50" y="30" width="80" height="100" rx="4" 
                    fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50" />
                  
                  {/* Cold water inlet pipe */}
                  <path d="M 30 50 L 50 50" stroke="currentColor" strokeWidth="3" className="text-blue-400" />
                  <path d="M 30 35 L 30 65" stroke="currentColor" strokeWidth="3" className="text-blue-400" />
                  
                  {/* Valve (highlighted) */}
                  <circle cx="30" cy="50" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
                    className="animate-pulse" />
                  <path d="M 22 50 L 38 50" stroke="hsl(var(--primary))" strokeWidth="3" />
                  
                  {/* Arrow pointing to valve */}
                  <path d="M 8 50 L 14 50 M 14 45 L 14 55 L 18 50 L 14 45" 
                    fill="hsl(var(--primary))" stroke="hsl(var(--primary))" strokeWidth="1" />
                  
                  {/* Labels */}
                  <text x="30" y="78" textAnchor="middle" fill="hsl(var(--primary))" fontSize="9" fontWeight="bold">
                    VALVE
                  </text>
                  <text x="90" y="85" textAnchor="middle" fill="currentColor" fontSize="8" className="text-muted-foreground">
                    Water Heater
                  </text>
                  
                  {/* Rotation arrow */}
                  <path d="M 50 20 A 10 10 0 1 1 40 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                  <polygon points="38,18 42,24 46,18" fill="hsl(var(--primary))" />
                  <text x="45" y="12" textAnchor="middle" fill="hsl(var(--primary))" fontSize="7" fontWeight="bold">
                    RIGHT
                  </text>
                </svg>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-foreground text-sm font-medium text-center">
                Turn the valve handle <span className="font-bold text-primary">clockwise (right)</span> until it stops
              </p>
            </div>

            {/* Alternative */}
            <p className="text-xs text-muted-foreground text-center">
              Can't find it? Look for your home's main water shutoff near the water meter.
            </p>
          </div>
        </StepCard>

        {/* Step 2: Call for help */}
        <StepCard
          stepNumber={2}
          title="Call for Help"
          isComplete={isStepComplete(2)}
          isActive={isStepActive(2)}
          isExpanded={isStepExpanded(2)}
          onToggle={() => toggleExpand(2)}
          onComplete={() => completeStep(2)}
          estimatedTime="1 minute"
          urgency="high"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Our emergency line connects you directly to a technician — no waiting, no phone trees.
            </p>

            <Button
              onClick={() => {
                handleCall();
                completeStep(2);
              }}
              size="lg"
              className="w-full h-14 bg-destructive hover:bg-destructive/90 text-white text-lg font-semibold rounded-xl"
            >
              <Phone className="w-5 h-5 mr-3" />
              Call {demoContractor.emergencyPhone}
            </Button>

            {/* What to expect */}
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                What to expect
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• A technician will answer within 60 seconds</li>
                <li>• They'll confirm your address and assess the situation</li>
                <li>• Emergency dispatch typically arrives within 2 hours</li>
              </ul>
            </div>
          </div>
        </StepCard>

        {/* Step 3: Document damage */}
        <StepCard
          stepNumber={3}
          title="Document the Damage"
          isComplete={isStepComplete(3)}
          isActive={isStepActive(3)}
          isExpanded={isStepExpanded(3)}
          onToggle={() => toggleExpand(3)}
          onComplete={() => completeStep(3)}
          estimatedTime="Optional"
          optional
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Taking photos now helps with insurance claims later. This is optional but recommended.
            </p>

            <Button
              onClick={() => {
                // In production, this would open camera/file picker
                alert('Photo capture would open here. In production, photos are saved to your account for insurance documentation.');
                completeStep(3);
              }}
              variant="outline"
              size="lg"
              className="w-full h-12 rounded-xl"
            >
              <Camera className="w-5 h-5 mr-3" />
              Take Photos
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Photos are securely stored in your account
            </p>
          </div>
        </StepCard>

        {/* Completion message */}
        <AnimatePresence>
          {currentStep > 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">You're all set!</h3>
              <p className="text-sm text-muted-foreground">
                Help is on the way. Stay calm and keep the area clear.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-4 px-4 safe-area-bottom">
        <p className="text-center text-muted-foreground text-sm max-w-md mx-auto">
          You're doing everything right. Help is on the way.
        </p>
      </div>
    </div>
  );
}

// Reusable step card component
interface StepCardProps {
  stepNumber: number;
  title: string;
  isComplete: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  estimatedTime: string;
  urgency?: 'high' | 'normal';
  optional?: boolean;
  children: React.ReactNode;
}

function StepCard({
  stepNumber,
  title,
  isComplete,
  isActive,
  isExpanded,
  onToggle,
  onComplete,
  estimatedTime,
  urgency = 'normal',
  optional = false,
  children,
}: StepCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: stepNumber * 0.1 }}
      className={`rounded-2xl border-2 overflow-hidden transition-all ${
        isComplete
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : isActive
          ? urgency === 'high'
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-primary/50 bg-card'
          : 'border-border bg-card/50 opacity-60'
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        disabled={!isComplete && !isActive}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 ${
          isComplete
            ? 'bg-emerald-500 text-white'
            : isActive
            ? urgency === 'high'
              ? 'bg-destructive text-white'
              : 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isComplete ? <CheckCircle className="w-5 h-5" /> : stepNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {optional && (
              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                Optional
              </span>
            )}
          </div>
          {isComplete && (
            <p className="text-xs text-emerald-500 font-medium">Completed ✓</p>
          )}
          {isActive && !isComplete && (
            <p className="text-xs text-muted-foreground">~{estimatedTime}</p>
          )}
        </div>
        
        {(isComplete || isActive) && (
          <div className="text-muted-foreground">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        )}
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-0">
              {children}
              
              {isActive && !isComplete && (
                <Button
                  onClick={onComplete}
                  variant="outline"
                  className="w-full mt-4"
                >
                  {optional ? 'Skip This Step' : 'Done'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
