import { useState, useMemo } from 'react';
import { ArrowLeft, Phone, User, Bell, CheckCircle2, Shield, Clock, DollarSign, Wrench, AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { submitLead, type CaptureSource } from '@/lib/leadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { topicContent, type EducationalTopic } from './EducationalDrawer';
import type { ForensicInputs } from '@/lib/opterraAlgorithm';
import type { OpterraMetrics } from '@/lib/opterraAlgorithm';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15, "Phone number is too long").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
});

export type UrgencyLevel = 'green' | 'yellow' | 'red';

interface LeadCaptureFlowProps {
  // Context for analytics
  captureSource: CaptureSource;
  captureContext?: Record<string, unknown>;
  
  // Urgency level for styling
  urgencyLevel: UrgencyLevel;
  
  // NEW: For topic selection based on algorithm findings
  inputs?: ForensicInputs;
  metrics?: OpterraMetrics;
  
  // Optional entity IDs
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
  
  // Callbacks
  onComplete: () => void;
  onBack: () => void;
}

// Select relevant educational topics based on inputs and metrics
function selectTopics(
  inputs?: ForensicInputs,
  metrics?: OpterraMetrics,
  urgencyLevel?: UrgencyLevel
): EducationalTopic[] {
  if (!inputs) {
    // Fallback topics if no inputs provided
    if (urgencyLevel === 'red') return ['tank-failure', 'failure-rate'];
    if (urgencyLevel === 'yellow') return ['aging', 'sediment'];
    return ['aging', 'anode-rod'];
  }

  const topics: { topic: EducationalTopic; priority: number }[] = [];
  const isTanklessUnit = inputs.fuelType === 'TANKLESS_GAS' || inputs.fuelType === 'TANKLESS_ELECTRIC';
  
  // Safety topics (highest priority)
  if (metrics?.failProb && metrics.failProb >= 50) {
    topics.push({ topic: 'tank-failure', priority: 100 });
  }
  
  // High failure probability
  if (metrics?.failProb && metrics.failProb >= 40) {
    topics.push({ topic: 'failure-rate', priority: 90 });
  }
  
  // Age-related
  if (inputs.calendarAge >= 8) {
    topics.push({ topic: isTanklessUnit ? 'aging-tankless' : 'aging', priority: 80 });
  }
  
  // Water quality
  if (inputs.hardnessGPG && inputs.hardnessGPG >= 7) {
    topics.push({ topic: isTanklessUnit ? 'hardness-tankless' : 'hardness', priority: 75 });
  }
  
  // Pressure issues
  if (inputs.housePsi && inputs.housePsi >= 80) {
    topics.push({ topic: 'pressure', priority: 70 });
    if (!inputs.hasPrv) {
      topics.push({ topic: 'prv', priority: 68 });
    }
  }
  
  // Thermal expansion
  if (inputs.isClosedLoop && !inputs.hasExpTank) {
    topics.push({ topic: 'thermal-expansion', priority: 65 });
  }
  
  // Maintenance-related (tank units)
  if (!isTanklessUnit) {
    if (inputs.lastFlushYearsAgo && inputs.lastFlushYearsAgo >= 3) {
      topics.push({ topic: 'sediment', priority: 60 });
    }
    if (inputs.lastAnodeReplaceYearsAgo && inputs.lastAnodeReplaceYearsAgo >= 4) {
      topics.push({ topic: 'anode-rod', priority: 55 });
    }
  }
  
  // Tankless-specific
  if (isTanklessUnit) {
    if (inputs.lastDescaleYearsAgo && inputs.lastDescaleYearsAgo >= 2) {
      topics.push({ topic: 'scale-tankless', priority: 60 });
    }
    topics.push({ topic: 'heat-exchanger', priority: 50 });
  }
  
  // Sort by priority and take top 3
  const sorted = topics.sort((a, b) => b.priority - a.priority);
  const selected = sorted.slice(0, 3).map(t => t.topic);
  
  // Ensure at least 2 topics
  if (selected.length < 2) {
    if (isTanklessUnit) {
      if (!selected.includes('aging-tankless')) selected.push('aging-tankless');
      if (!selected.includes('scale-tankless') && selected.length < 2) selected.push('scale-tankless');
    } else {
      if (!selected.includes('aging')) selected.push('aging');
      if (!selected.includes('anode-rod') && selected.length < 2) selected.push('anode-rod');
    }
  }
  
  return selected.slice(0, 3);
}

// Education card component
function EducationCard({ 
  topic, 
  isLast,
}: { 
  topic: EducationalTopic; 
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const content = topicContent[topic];
  
  if (!content) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl bg-card border border-border",
        !isLast && "mb-3"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {content.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">{content.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {content.description}
          </p>
          
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  {content.sections.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-xs font-medium text-foreground mb-1">{section.heading}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                  {content.source && (
                    <p className="text-[10px] text-muted-foreground/70 italic pt-2 border-t border-border/50">
                      {content.source}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-2 transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Learn more
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function LeadCaptureFlow({
  captureSource,
  captureContext,
  urgencyLevel,
  inputs,
  metrics,
  propertyId,
  waterHeaterId,
  contractorId,
  onComplete,
  onBack,
}: LeadCaptureFlowProps) {
  // Step state: 'education' or 'form'
  const [step, setStep] = useState<'education' | 'form'>('education');
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [optInAlerts, setOptInAlerts] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Select topics based on inputs/metrics
  const selectedTopics = useMemo(
    () => selectTopics(inputs, metrics, urgencyLevel),
    [inputs, metrics, urgencyLevel]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse({ name, phone });
    
    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'phone') fieldErrors.phone = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    // Submit to leads table
    const leadResult = await submitLead({
      customerName: result.data.name,
      customerPhone: result.data.phone,
      captureSource,
      captureContext: {
        ...captureContext,
        urgencyLevel,
        educationTopicsShown: selectedTopics,
      },
      propertyId,
      waterHeaterId,
      contractorId,
      optInAlerts,
    });

    if (!leadResult.success) {
      console.warn('[LeadCaptureFlow] Failed to save lead:', leadResult.error);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast.success("Request submitted!", {
      description: "Your technician will follow up within 24 hours."
    });
    
    setTimeout(() => {
      onComplete();
    }, 1800);
  };

  // Step header titles
  const stepTitle = step === 'education' 
    ? 'Understanding Your Water Heater' 
    : 'Get a Follow-Up Call';

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6 max-w-sm"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
            <p className="text-muted-foreground">
              Your technician will follow up within 24 hours to discuss your water heater.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center max-w-md mx-auto px-4 py-3">
          <button 
            onClick={step === 'form' ? () => setStep('education') : onBack} 
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-lg">{stepTitle}</h1>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === 'education' ? 'bg-primary' : 'bg-muted-foreground/30'
              )} />
              <div className={cn(
                "w-2 h-2 rounded-full transition-colors",
                step === 'form' ? 'bg-primary' : 'bg-muted-foreground/30'
              )} />
            </div>
          </div>
          <div className="w-9" />
        </div>
      </header>

      <div className="px-4 pt-6 pb-8 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {step === 'education' ? (
            <motion.div
              key="education"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Education intro */}
              <div className="mb-6">
                <h2 className={cn(
                  "text-xl font-bold mb-2",
                  urgencyLevel === 'red' && "text-red-500",
                  urgencyLevel === 'yellow' && "text-amber-500",
                  urgencyLevel === 'green' && "text-emerald-500",
                )}>
                  {urgencyLevel === 'red' 
                    ? 'Important Information About Your Unit' 
                    : urgencyLevel === 'yellow'
                    ? 'What You Should Know'
                    : 'Tips for a Healthy Water Heater'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Based on your water heater's profile, here's what matters most:
                </p>
              </div>

              {/* Education cards */}
              <div className="mb-6">
                {selectedTopics.map((topic, idx) => (
                  <EducationCard 
                    key={topic} 
                    topic={topic} 
                    isLast={idx === selectedTopics.length - 1}
                  />
                ))}
              </div>

              {/* Continue button */}
              <Button
                size="lg"
                className={cn(
                  "w-full h-14 text-base font-semibold rounded-xl gap-2",
                  urgencyLevel === 'red' && "bg-red-600 hover:bg-red-500",
                  urgencyLevel === 'yellow' && "bg-amber-600 hover:bg-amber-500",
                  urgencyLevel === 'green' && "bg-emerald-600 hover:bg-emerald-500",
                )}
                onClick={() => setStep('form')}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-3">
                Next: Your technician will follow up
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Form intro */}
              <div className="mb-6">
                <h2 className={cn(
                  "text-xl font-bold mb-2",
                  urgencyLevel === 'red' && "text-red-500",
                  urgencyLevel === 'yellow' && "text-amber-500",
                  urgencyLevel === 'green' && "text-emerald-500",
                )}>
                  {urgencyLevel === 'red' 
                    ? 'Get a Follow-Up Call' 
                    : urgencyLevel === 'yellow'
                    ? 'Get a Follow-Up Call'
                    : 'Schedule Your Follow-Up'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your technician will call to discuss your options and answer any questions.
                </p>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="p-5 rounded-2xl bg-card border border-border space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={cn("h-12", errors.name && 'border-destructive')}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={cn("h-12", errors.phone && 'border-destructive')}
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Checkbox
                      id="alerts"
                      checked={optInAlerts}
                      onCheckedChange={(checked) => setOptInAlerts(checked === true)}
                      className="mt-0.5"
                      disabled={isSubmitting}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="alerts" className="flex items-center gap-2 cursor-pointer text-sm">
                        <Bell className="w-4 h-4 text-primary" />
                        Unit Monitoring Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified about maintenance reminders and potential issues.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg"
                  className={cn(
                    "w-full h-14 text-base font-semibold rounded-xl",
                    urgencyLevel === 'red' && "bg-red-600 hover:bg-red-500",
                    urgencyLevel === 'yellow' && "bg-amber-600 hover:bg-amber-500",
                    urgencyLevel === 'green' && "bg-emerald-600 hover:bg-emerald-500",
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Request Callback'}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Your technician will call to go over your options. No obligation.
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
