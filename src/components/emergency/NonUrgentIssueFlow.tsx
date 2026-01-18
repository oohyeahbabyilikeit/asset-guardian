import { ArrowLeft, Phone, Thermometer, Zap, Flame, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { demoContractor } from '@/data/mockAsset';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NonUrgentIssueFlowProps {
  issueType: 'no-hot-water' | 'other';
  onBack: () => void;
}

export function NonUrgentIssueFlow({ issueType, onBack }: NonUrgentIssueFlowProps) {
  const [checklistCompleted, setChecklistCompleted] = useState(false);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${demoContractor.phone.replace(/[^0-9]/g, '')}`;
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const troubleshootingSteps = issueType === 'no-hot-water' ? [
    { id: 'pilot', icon: Flame, label: 'Check pilot light', detail: 'For gas units, look through the small window at the bottom. You should see a small blue flame.' },
    { id: 'breaker', icon: Zap, label: 'Check breaker', detail: 'For electric units, check your circuit breaker panel for a tripped breaker.' },
    { id: 'thermostat', icon: Thermometer, label: 'Check thermostat', detail: 'Make sure the temperature dial on the unit is set between 120-140°F.' },
  ] : [
    { id: 'visual', icon: Thermometer, label: 'Any visible leaks or damage?', detail: 'Look for water pooling, rust, or corrosion around the unit.' },
    { id: 'sounds', icon: MessageSquare, label: 'Any unusual sounds?', detail: 'Popping, rumbling, or hissing sounds can indicate issues.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-amber-400" />
              <h1 className="text-lg font-semibold text-foreground">
                {issueType === 'no-hot-water' ? 'No Hot Water' : 'Report an Issue'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-md mx-auto pb-8">
        {/* Reassurance */}
        <div className="text-center py-4">
          <h2 className="text-xl font-semibold text-foreground">
            {issueType === 'no-hot-water' ? "Let's troubleshoot" : "We're here to help"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {issueType === 'no-hot-water' 
              ? "A few quick checks before we dispatch a technician"
              : "Tell us what's going on and we'll get back to you"
            }
          </p>
        </div>

        {!formSubmitted ? (
          <>
            {/* Troubleshooting checklist */}
            {issueType === 'no-hot-water' && !checklistCompleted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Quick checks</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    These often resolve the issue without a service call
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {troubleshootingSteps.map((step) => {
                    const Icon = step.icon;
                    const isChecked = checkedItems.includes(step.id);
                    
                    return (
                      <button
                        key={step.id}
                        onClick={() => toggleCheck(step.id)}
                        className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked 
                              ? 'bg-primary border-primary' 
                              : 'border-muted-foreground/30'
                          }`}>
                            {isChecked && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className={`font-medium ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {step.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 bg-muted/30">
                  <Button
                    onClick={() => setChecklistCompleted(true)}
                    variant="outline"
                    className="w-full"
                  >
                    {checkedItems.length === troubleshootingSteps.length 
                      ? "None of these fixed it"
                      : "Skip — I need help now"
                    }
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Contact options */}
            <AnimatePresence>
              {(checklistCompleted || issueType === 'other') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Call option */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-semibold text-foreground mb-2">Call us now</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Speak to someone right away during business hours.
                    </p>
                    <Button
                      onClick={handleCall}
                      size="lg"
                      className="w-full h-12 rounded-xl"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call {demoContractor.phone}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Mon-Fri 8am-6pm, Sat 9am-2pm
                    </p>
                  </div>

                  {/* Request callback */}
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-semibold text-foreground mb-2">Request a callback</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      We'll call you back within 2 business hours.
                    </p>
                    
                    {!showContactForm ? (
                      <Button
                        onClick={() => setShowContactForm(true)}
                        variant="outline"
                        size="lg"
                        className="w-full h-12 rounded-xl"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule Callback
                      </Button>
                    ) : (
                      <CallbackForm 
                        onSubmit={() => setFormSubmitted(true)}
                        onCancel={() => setShowContactForm(false)}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          /* Success state */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Request received!
            </h3>
            <p className="text-muted-foreground mb-6">
              We'll call you back within 2 business hours to schedule a service visit.
            </p>
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Simple callback form
interface CallbackFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

function CallbackForm({ onSubmit, onCancel }: CallbackFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to the database
    console.log('Callback request:', { name, phone, notes });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <input
        type="tel"
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <textarea
        placeholder="Describe the issue (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          Request Callback
        </Button>
      </div>
    </form>
  );
}
