import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, DollarSign, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConversionCelebrationModalProps {
  open: boolean;
  onClose: () => void;
  customerName: string;
  propertyAddress: string;
  onConfirm: (revenueUsd: number | null) => Promise<void>;
  isSubmitting: boolean;
}

export function ConversionCelebrationModal({
  open,
  onClose,
  customerName,
  propertyAddress,
  onConfirm,
  isSubmitting,
}: ConversionCelebrationModalProps) {
  const [revenue, setRevenue] = useState('');

  const handleSubmit = async () => {
    const amount = revenue ? parseFloat(revenue.replace(/[^0-9.]/g, '')) : null;
    await onConfirm(amount && !isNaN(amount) ? amount : null);
  };

  const handleSkip = async () => {
    await onConfirm(null);
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal
    const numericValue = value.replace(/[^0-9.]/g, '');
    return numericValue;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md overflow-visible">
        <AnimatePresence>
          {open && (
            <>
              {/* Confetti emojis */}
              <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl pointer-events-none"
                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              >
                <motion.span
                  animate={{ rotate: [0, -15, 15, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  🎉
                </motion.span>
                <motion.span
                  className="mx-2"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 0.4, repeat: 3, delay: 0.2 }}
                >
                  🎊
                </motion.span>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: 2, delay: 0.1 }}
                >
                  🎉
                </motion.span>
              </motion.div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <DialogHeader className="text-center pb-4">
                  <motion.div
                    className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <PartyPopper className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                  <DialogTitle className="text-2xl font-bold text-center">
                    Congratulations!
                  </DialogTitle>
                  <DialogDescription className="text-center text-base">
                    You closed the deal! 🎯
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Customer info */}
                  <div className="text-center py-2 px-4 rounded-lg bg-muted/50">
                    <p className="font-medium text-foreground">{customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyAddress.split(',')[0]}
                    </p>
                  </div>

                  {/* Revenue input */}
                  <div className="space-y-2">
                    <Label htmlFor="revenue" className="text-sm font-medium">
                      Final Sale Amount
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="revenue"
                        type="text"
                        inputMode="decimal"
                        placeholder="4,500"
                        value={revenue}
                        onChange={(e) => setRevenue(formatCurrency(e.target.value))}
                        className="pl-9 text-lg font-medium"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the final invoice amount to track your real revenue
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4" />
                      )}
                      Log Revenue & Complete
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      disabled={isSubmitting}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Skip (Don't Track)
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
