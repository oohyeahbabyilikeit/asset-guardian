import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Bell, CheckCircle2, Phone, User, Mail } from 'lucide-react';
import { submitNotificationRequest } from '@/lib/maintenancePricingService';

interface MaintenanceTask {
  id: string;
  label: string;
  dueDate: Date;
}

interface NotifyMeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: MaintenanceTask[];
  propertyId?: string;
  waterHeaterId?: string;
  contractorId?: string;
}

export function NotifyMeModal({
  open,
  onOpenChange,
  tasks,
  propertyId,
  waterHeaterId,
  contractorId,
}: NotifyMeModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(tasks.map((t) => t.id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (!phoneDigits || phoneDigits.length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (selectedTasks.length === 0) return;

    setIsSubmitting(true);

    // Submit a notification request for each selected task
    const submitPromises = selectedTasks.map((taskId) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return Promise.resolve({ success: true });

      return submitNotificationRequest({
        customerName: name.trim(),
        customerPhone: phone.replace(/\D/g, ''),
        customerEmail: email.trim() || undefined,
        maintenanceType: task.id,
        dueDate: task.dueDate,
        propertyId,
        waterHeaterId,
        contractorId,
      });
    });

    try {
      await Promise.all(submitPromises);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting notifications:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state when closing
    setName('');
    setPhone('');
    setEmail('');
    setSelectedTasks(tasks.map((t) => t.id));
    setErrors({});
    setIsSubmitted(false);
    onOpenChange(false);
  };

  if (isSubmitted) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <div className="flex flex-col items-center text-center py-8 px-4 pb-safe">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <DrawerTitle className="text-xl mb-2">You're All Set!</DrawerTitle>
            <DrawerDescription className="text-muted-foreground mb-6">
              Your plumber will reach out about 2 weeks before each service is due to schedule an
              appointment.
            </DrawerDescription>
            <Button onClick={handleClose} className="w-full h-12">
              Done
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto scroll-touch px-4 pb-safe">
          <DrawerHeader className="px-0">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-5 h-5 text-primary" />
              <DrawerTitle>Notify Me When Due</DrawerTitle>
            </div>
            <DrawerDescription>
              We'll have your plumber reach out 2 weeks before each service is needed.
            </DrawerDescription>
          </DrawerHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pb-6">
            {/* Name field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                Your Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                className={errors.name ? 'border-destructive' : ''}
                autoComplete="name"
                autoCapitalize="words"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            {/* Phone field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className={errors.phone ? 'border-destructive' : ''}
                autoComplete="tel"
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            {/* Email field (optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                Email <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                autoComplete="email"
              />
            </div>

            {/* Task selection */}
            {tasks.length > 1 && (
              <div className="space-y-3">
                <Label className="text-sm">Notify me about:</Label>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 min-h-[48px] touch-manipulation"
                    >
                      <Checkbox
                        id={task.id}
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <label
                        htmlFor={task.id}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {task.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting || selectedTasks.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
