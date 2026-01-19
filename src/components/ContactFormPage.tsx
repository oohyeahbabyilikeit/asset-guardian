import { useState } from 'react';
import { ArrowLeft, Phone, User, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { submitLead, type CaptureSource } from '@/lib/leadService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15, "Phone number is too long").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
});

export type UrgencyLevel = 'green' | 'yellow' | 'red';

interface ContactFormPageProps {
  // Context for analytics
  captureSource: CaptureSource;
  captureContext?: Record<string, unknown>;
  
  // Urgency level for styling
  urgencyLevel: UrgencyLevel;
  
  // Optional entity IDs
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
  
  // Callbacks
  onComplete: () => void;
  onBack: () => void;
}

export function ContactFormPage({
  captureSource,
  captureContext,
  urgencyLevel,
  propertyId,
  waterHeaterId,
  contractorId,
  onComplete,
  onBack,
}: ContactFormPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [optInAlerts, setOptInAlerts] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
      console.warn('[ContactFormPage] Failed to save lead:', leadResult.error);
    }

    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast.success("Request submitted!", {
      description: "Your plumber will reach out within 24 hours."
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
              Your plumber will reach out within 24 hours to discuss your water heater.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="flex items-center max-w-md mx-auto px-4 py-3">
          <button 
            onClick={onBack} 
            className="p-3 -ml-3 hover:bg-muted rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-base">Have Your Plumber Reach Out</h1>
          </div>
          <div className="w-11" />
        </div>
      </header>

      <div className="px-4 pt-6 pb-8 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Form intro */}
          <div className="mb-6">
            <h2 className={cn(
              "text-xl font-bold mb-2",
              urgencyLevel === 'red' && "text-red-500",
              urgencyLevel === 'yellow' && "text-amber-500",
              urgencyLevel === 'green' && "text-emerald-500",
            )}>
              Almost There!
            </h2>
            <p className="text-sm text-muted-foreground">
              Your plumber will reach out to discuss your options and answer any questions.
            </p>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Name
                </Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(errors.name && 'border-destructive')}
                  disabled={isSubmitting}
                  autoComplete="name"
                  autoCapitalize="words"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(errors.phone && 'border-destructive')}
                  disabled={isSubmitting}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                <Checkbox
                  id="alerts"
                  checked={optInAlerts}
                  onCheckedChange={(checked) => setOptInAlerts(checked === true)}
                  className="mt-0.5 h-5 w-5"
                  disabled={isSubmitting}
                />
                <div className="space-y-1 flex-1">
                  <Label htmlFor="alerts" className="flex items-center gap-2 cursor-pointer text-sm touch-manipulation">
                    <Bell className="w-4 h-4 text-primary" />
                    Unit Monitoring Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Get notified about maintenance reminders and potential issues.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              size="lg"
              disabled={isSubmitting}
              className={cn(
                "w-full h-14 text-base font-semibold rounded-xl",
                urgencyLevel === 'red' && "bg-red-600 hover:bg-red-500",
                urgencyLevel === 'yellow' && "bg-amber-600 hover:bg-amber-500",
                urgencyLevel === 'green' && "bg-emerald-600 hover:bg-emerald-500",
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Have My Plumber Reach Out'}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Your plumber will reach out to discuss your options. No obligation.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
