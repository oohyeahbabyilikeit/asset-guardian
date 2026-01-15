import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl mb-2">You're All Set!</DialogTitle>
            <DialogDescription className="text-muted-foreground mb-6">
              Your plumber will reach out about 2 weeks before each service is due to schedule an
              appointment.
            </DialogDescription>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-5 h-5 text-primary" />
            <DialogTitle>Notify Me When Due</DialogTitle>
          </div>
          <DialogDescription>
            We'll have your plumber reach out 2 weeks before each service is needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Your Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Phone field */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          {/* Email field (optional) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Email <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          {/* Task selection */}
          {tasks.length > 1 && (
            <div className="space-y-3">
              <Label>Notify me about:</Label>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50"
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
            className="w-full"
            disabled={isSubmitting || selectedTasks.length === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
