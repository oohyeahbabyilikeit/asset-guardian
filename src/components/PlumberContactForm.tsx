import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, User, Bell, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Please enter a valid phone number").max(15, "Phone number is too long").regex(/^[\d\s\-\(\)\+]+$/, "Please enter a valid phone number"),
});

interface PlumberContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; phone: string; optInAlerts: boolean }) => void;
}

export function PlumberContactForm({ open, onOpenChange, onSubmit }: PlumberContactFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [optInAlerts, setOptInAlerts] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
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
    setIsSubmitted(true);
    
    // Simulate submission delay then callback
    setTimeout(() => {
      onSubmit({ name: result.data.name, phone: result.data.phone, optInAlerts });
    }, 1500);
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setOptInAlerts(true);
    setErrors({});
    setIsSubmitted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl">Request Submitted!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A licensed plumber will contact you within 24 hours to discuss your water heater options.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Speak with a Plumber</DialogTitle>
              <DialogDescription>
                Enter your details and a licensed plumber will contact you to discuss your options.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
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
                  className={errors.name ? 'border-destructive' : ''}
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
                  className={errors.phone ? 'border-destructive' : ''}
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
                />
                <div className="space-y-1">
                  <Label htmlFor="alerts" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="w-4 h-4 text-primary" />
                    Unit Monitoring Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about maintenance reminders and potential issues with your water heater.
                  </p>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12 text-base font-semibold">
                Request Callback
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                By submitting, you agree to be contacted by a licensed plumber.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
