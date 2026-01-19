import { useState } from 'react';
import { ArrowLeft, Phone, User, Bell, CheckCircle2, Shield, Clock, DollarSign, Wrench, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { submitLead, type CaptureSource } from '@/lib/leadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15, "Phone number is too long").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
});

export type UrgencyLevel = 'green' | 'yellow' | 'red';

interface LeadCaptureFlowProps {
  // Context for analytics
  captureSource: CaptureSource;
  captureContext?: Record<string, unknown>;
  
  // Education content
  urgencyLevel: UrgencyLevel;
  headline?: string;
  bulletPoints?: string[];
  
  // Optional entity IDs
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
  
  // Callbacks
  onComplete: () => void;
  onBack: () => void;
}

// Default education content by urgency tier
const DEFAULT_EDUCATION: Record<UrgencyLevel, { headline: string; bullets: string[] }> = {
  green: {
    headline: "Keep Your Water Heater Running Strong",
    bullets: [
      "Regular maintenance prevents 73% of water heater failures",
      "A quick call sets up your annual service schedule",
      "Average homeowner saves $1,200 by staying ahead of repairs",
    ],
  },
  yellow: {
    headline: "Your Water Heater Needs Attention",
    bullets: [
      "Your unit shows signs of wear that accelerate failure risk",
      "Acting now can extend your water heater's life by 3-5 years",
      "A local expert can explain your best options",
    ],
  },
  red: {
    headline: "Expert Assessment Recommended",
    bullets: [
      "Your unit has elevated risk factors that need attention",
      "A licensed plumber can assess the situation and explain next steps",
      "Water damage from failure averages $4,000–$10,000 to repair",
    ],
  },
};

// CTA button text by urgency
const CTA_TEXT: Record<UrgencyLevel, string> = {
  green: "Get Maintenance Tips",
  yellow: "Speak with a Plumber",
  red: "Get Expert Advice Now",
};

// Icons for bullet points by urgency
const BULLET_ICONS: Record<UrgencyLevel, typeof Shield[]> = {
  green: [Clock, DollarSign, Shield],
  yellow: [AlertTriangle, Clock, Wrench],
  red: [AlertTriangle, Wrench, DollarSign],
};

export function LeadCaptureFlow({
  captureSource,
  captureContext,
  urgencyLevel,
  headline,
  bulletPoints,
  propertyId,
  waterHeaterId,
  contractorId,
  onComplete,
  onBack,
}: LeadCaptureFlowProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [optInAlerts, setOptInAlerts] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const content = {
    headline: headline || DEFAULT_EDUCATION[urgencyLevel].headline,
    bullets: bulletPoints || DEFAULT_EDUCATION[urgencyLevel].bullets,
  };
  
  const icons = BULLET_ICONS[urgencyLevel];

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
      },
      propertyId,
      waterHeaterId,
      contractorId,
      optInAlerts,
    });

    if (!leadResult.success) {
      console.warn('[LeadCaptureFlow] Failed to save lead:', leadResult.error);
      // Don't block user flow
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Show success briefly then complete
    toast.success("Request submitted!", {
      description: "A licensed plumber will contact you within 24 hours."
    });
    
    setTimeout(() => {
      onComplete();
    }, 1800);
  };

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
              A licensed plumber will contact you within 24 hours to discuss your water heater.
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
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-lg">Speak with a Plumber</h1>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </header>

      <div className="px-4 pt-6 pb-8 max-w-md mx-auto">
        {/* Education Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className={cn(
            "text-xl font-bold mb-4",
            urgencyLevel === 'red' && "text-red-500",
            urgencyLevel === 'yellow' && "text-amber-500",
            urgencyLevel === 'green' && "text-emerald-500",
          )}>
            {content.headline}
          </h2>
          
          <ul className="space-y-3">
            <AnimatePresence>
              {content.bullets.map((bullet, idx) => {
                const Icon = icons[idx] || Shield;
                return (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                      urgencyLevel === 'red' && "bg-red-500/10",
                      urgencyLevel === 'yellow' && "bg-amber-500/10",
                      urgencyLevel === 'green' && "bg-emerald-500/10",
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        urgencyLevel === 'red' && "text-red-500",
                        urgencyLevel === 'yellow' && "text-amber-500",
                        urgencyLevel === 'green' && "text-emerald-500",
                      )} />
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed pt-1">
                      {bullet}
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </motion.div>

        {/* Contact Form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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
            {isSubmitting ? 'Submitting...' : CTA_TEXT[urgencyLevel]}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            A licensed local plumber will call to discuss your options. No obligation.
          </p>
        </motion.form>
      </div>
    </div>
  );
}
