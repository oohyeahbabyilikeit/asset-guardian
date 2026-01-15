import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, User, Mail, Bell, CheckCircle2, FileText } from 'lucide-react';
import { z } from 'zod';
import { submitLead, markLeadCaptured } from '@/lib/leadService';
import { toast } from 'sonner';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15, "Phone number is too long").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal('')),
});

export interface SaveReportContext {
  recommendationType: 'REPLACE_NOW' | 'REPLACE_SOON' | 'MAINTAIN' | 'MONITOR';
  healthScore: number;
  bioAge: number;
  topFindings: string[];
}

interface SaveReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  onSkip: () => void;
  context: SaveReportContext;
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
}

export function SaveReportModal({ 
  open, 
  onOpenChange, 
  onComplete, 
  onSkip,
  context,
  propertyId,
  waterHeaterId,
  contractorId,
}: SaveReportModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [optInAlerts, setOptInAlerts] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse({ name, phone, email: email || undefined });
    
    if (!result.success) {
      const fieldErrors: { name?: string; phone?: string; email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'name') fieldErrors.name = err.message;
        if (err.path[0] === 'phone') fieldErrors.phone = err.message;
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    setErrors({});
    setIsSubmitting(true);
    
    const leadResult = await submitLead({
      customerName: result.data.name,
      customerPhone: result.data.phone,
      customerEmail: result.data.email || undefined,
      captureSource: 'findings_summary',
      captureContext: {
        recommendationType: context.recommendationType,
        healthScore: context.healthScore,
        bioAge: context.bioAge,
        topFindings: context.topFindings,
      },
      propertyId,
      waterHeaterId,
      contractorId,
      optInAlerts,
    });
    
    setIsSubmitting(false);
    
    if (leadResult.success) {
      markLeadCaptured('findings_summary');
      setIsSubmitted(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } else {
      toast.error('Something went wrong. Please try again.');
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setPhone('');
      setEmail('');
      setOptInAlerts(true);
      setErrors({});
      setIsSubmitted(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl">Report Saved!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You'll receive your personalized report and recommendations shortly.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <DialogTitle className="text-xl text-center">Save Your Report</DialogTitle>
              <DialogDescription className="text-center">
                Get a copy of your personalized assessment and next steps.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="save-name" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Name
                </Label>
                <Input
                  id="save-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={errors.name ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="save-phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="save-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={errors.phone ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="save-email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="save-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  id="save-alerts"
                  checked={optInAlerts}
                  onCheckedChange={(checked) => setOptInAlerts(checked === true)}
                  className="mt-0.5"
                  disabled={isSubmitting}
                />
                <div className="space-y-1">
                  <Label htmlFor="save-alerts" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="w-4 h-4 text-primary" />
                    Maintenance Reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about upcoming maintenance to extend your water heater's life.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save & Continue'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
