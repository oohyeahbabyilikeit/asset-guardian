import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MessageSquare, Mail, Phone, Check, Zap, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  useSequenceTemplates, 
  useStartSequence,
  type SequenceTemplate,
  type SequenceStep 
} from '@/hooks/useNurturingSequences';
import { toast } from 'sonner';

interface StartSequenceModalProps {
  open: boolean;
  onClose: () => void;
  opportunityId: string;
  customerName: string;
}

const actionIcons: Record<string, typeof MessageSquare> = {
  sms: MessageSquare,
  email: Mail,
  call_reminder: Phone,
};

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: SequenceTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  const steps = template.steps as SequenceStep[];
  const actionTypes = [...new Set(steps.map(s => s.action))];
  const totalDays = Math.max(...steps.map(s => s.day));
  
  // Suggested use case based on trigger type
  const useCaseMap: Record<string, string> = {
    replacement_urgent: 'Critical/High priority leads',
    code_violation: 'Safety compliance issues',
    maintenance: 'Routine maintenance reminders',
    default: 'General follow-up',
  };
  
  const useCase = useCaseMap[template.triggerType] || useCaseMap.default;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border transition-all',
        isSelected 
          ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30' 
          : 'border-border hover:border-border/80 hover:bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {isSelected && (
            <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          <span className="font-medium text-foreground">{template.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {steps.length} steps · {totalDays} days
        </span>
      </div>
      
      {/* Action types */}
      <div className="flex items-center gap-2 mb-2">
        {actionTypes.map(action => {
          const Icon = actionIcons[action] || MessageSquare;
          return (
            <span 
              key={action}
              className={cn(
                'text-xs px-1.5 py-0.5 rounded flex items-center gap-1',
                action === 'sms' && 'bg-sky-500/20 text-sky-300',
                action === 'email' && 'bg-amber-500/20 text-amber-300',
                action === 'call_reminder' && 'bg-emerald-500/20 text-emerald-300',
              )}
            >
              <Icon className="w-3 h-3" />
              {action === 'call_reminder' ? 'Call' : action.toUpperCase()}
            </span>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Best for: {useCase}
      </p>
    </button>
  );
}

function StepPreview({ steps }: { steps: SequenceStep[] }) {
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
      {steps.map((step, index) => {
        const Icon = actionIcons[step.action] || MessageSquare;
        return (
          <div 
            key={index}
            className="flex items-start gap-3 text-sm"
          >
            <div className="flex items-center gap-1 text-muted-foreground shrink-0 w-16">
              <Clock className="w-3 h-3" />
              <span className="text-xs">Day {step.day}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                <Icon className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">
                  {step.action === 'call_reminder' ? 'Call' : step.action}
                </span>
              </div>
              <p className="text-xs text-foreground/80 line-clamp-1">
                "{step.message}"
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StartSequenceModal({
  open,
  onClose,
  opportunityId,
  customerName,
}: StartSequenceModalProps) {
  const { data: templates = [], isLoading } = useSequenceTemplates();
  const startSequence = useStartSequence();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  const handleStart = async () => {
    if (!selectedTemplate) return;
    
    const steps = selectedTemplate.steps as SequenceStep[];
    
    try {
      await startSequence.mutateAsync({
        opportunityId,
        sequenceType: selectedTemplate.triggerType,
        totalSteps: steps.length,
      });
      
      toast.success(`Sequence started for ${customerName}`);
      onClose();
    } catch (error) {
      toast.error('Failed to start sequence');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            Start Nurturing Sequence
          </DialogTitle>
          <DialogDescription>
            Choose a sequence to enroll {customerName}
          </DialogDescription>
        </DialogHeader>
        
        {showPreview && selectedTemplate ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedTemplate.name}</h4>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                Back
              </Button>
            </div>
            <StepPreview steps={selectedTemplate.steps as SequenceStep[]} />
            <Button 
              className="w-full gap-2"
              onClick={handleStart}
              disabled={startSequence.isPending}
            >
              <Zap className="w-4 h-4" />
              {startSequence.isPending ? 'Starting...' : 'Start Sequence'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading templates...
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No templates available
              </div>
            ) : (
              <>
                {templates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplateId === template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              {selectedTemplate && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowPreview(true)}
                >
                  Preview Steps
                </Button>
              )}
              <Button 
                className="flex-1 gap-2"
                disabled={!selectedTemplate || startSequence.isPending}
                onClick={handleStart}
              >
                <Zap className="w-4 h-4" />
                {startSequence.isPending ? 'Starting...' : 'Start Now'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
