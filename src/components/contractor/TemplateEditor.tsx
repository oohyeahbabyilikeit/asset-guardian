import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Mail, MessageSquare, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useSequenceTemplates, 
  useCreateTemplate, 
  useUpdateTemplate,
  type SequenceStep,
} from '@/hooks/useNurturingSequences';
import { toast } from 'sonner';

interface TemplateEditorProps {
  open: boolean;
  onClose: () => void;
  templateId: string | null;
}

interface EditableStep extends SequenceStep {
  id: string; // Temporary ID for React keys
}

const TRIGGER_TYPES = [
  { value: 'replacement_urgent', label: 'Urgent Replacement' },
  { value: 'code_violation', label: 'Code Violation' },
  { value: 'maintenance_reminder', label: 'Maintenance Reminder' },
  { value: 'quote_followup', label: 'Quote Follow-up' },
];

const ACTION_TYPES = [
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'call_reminder', label: 'Call Reminder', icon: Phone },
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function TemplateEditor({ open, onClose, templateId }: TemplateEditorProps) {
  const { data: templates = [] } = useSequenceTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  
  const existingTemplate = templateId 
    ? templates.find(t => t.id === templateId) 
    : null;
  
  const [name, setName] = useState('');
  const [triggerType, setTriggerType] = useState('replacement_urgent');
  const [steps, setSteps] = useState<EditableStep[]>([]);
  
  // Initialize form when template loads
  useEffect(() => {
    if (existingTemplate) {
      setName(existingTemplate.name);
      setTriggerType(existingTemplate.triggerType);
      setSteps(existingTemplate.steps.map(s => ({ ...s, id: generateId() })));
    } else {
      // Default for new template
      setName('');
      setTriggerType('replacement_urgent');
      setSteps([
        { id: generateId(), step: 1, day: 1, action: 'sms', message: 'Hi {name}, this is {company}...' },
      ]);
    }
  }, [existingTemplate, open]);
  
  const handleAddStep = () => {
    const lastStep = steps[steps.length - 1];
    const newDay = lastStep ? lastStep.day + 1 : 1;
    const newStepNum = steps.length + 1;
    
    setSteps([
      ...steps,
      { 
        id: generateId(), 
        step: newStepNum, 
        day: newDay, 
        action: 'sms', 
        message: '' 
      },
    ]);
  };
  
  const handleRemoveStep = (id: string) => {
    if (steps.length <= 1) return;
    
    const filtered = steps.filter(s => s.id !== id);
    // Renumber steps
    const renumbered = filtered.map((s, i) => ({ ...s, step: i + 1 }));
    setSteps(renumbered);
  };
  
  const handleStepChange = (
    id: string, 
    field: 'day' | 'action' | 'message', 
    value: string | number
  ) => {
    setSteps(steps.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    if (steps.some(s => !s.message.trim())) {
      toast.error('All steps must have a message');
      return;
    }
    
    // Clean steps for saving (remove temporary IDs)
    const cleanSteps: SequenceStep[] = steps.map(({ id, ...rest }) => rest);
    
    try {
      if (existingTemplate) {
        await updateTemplate.mutateAsync({
          id: existingTemplate.id,
          name,
          triggerType,
          steps: cleanSteps,
        });
        toast.success('Template updated');
      } else {
        await createTemplate.mutateAsync({
          name,
          triggerType,
          steps: cleanSteps,
        });
        toast.success('Template created');
      }
      onClose();
    } catch {
      toast.error('Failed to save template');
    }
  };
  
  const isSaving = createTemplate.isPending || updateTemplate.isPending;
  
  return (
    <Drawer open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              {existingTemplate ? 'Edit Template' : 'New Template'}
            </DrawerTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-6">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Urgent Replacement - 5 Day"
              />
            </div>
            
            {/* Trigger Type */}
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Steps */}
            <div className="space-y-3">
              <Label>Steps</Label>
              
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    'bg-muted/30 rounded-lg border border-border/50 p-3',
                    'space-y-3',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    {/* Day */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-muted-foreground">Day</span>
                      <Input
                        type="number"
                        min={1}
                        value={step.day}
                        onChange={(e) => handleStepChange(step.id, 'day', parseInt(e.target.value) || 1)}
                        className="w-16 h-8 text-center"
                      />
                    </div>
                    
                    {/* Action Type */}
                    <Select 
                      value={step.action} 
                      onValueChange={(v) => handleStepChange(step.id, 'action', v)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-3.5 h-3.5" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex-1" />
                    
                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-rose-400"
                      onClick={() => handleRemoveStep(step.id)}
                      disabled={steps.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Message */}
                  <Textarea
                    placeholder="Message content... Use {name} and {company} for personalization"
                    value={step.message}
                    onChange={(e) => handleStepChange(step.id, 'message', e.target.value)}
                    rows={2}
                    className="text-sm"
                  />
                </div>
              ))}
              
              {/* Add Step Button */}
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed"
                onClick={handleAddStep}
              >
                <Plus className="w-4 h-4" />
                Add Step
              </Button>
            </div>
          </div>
        </ScrollArea>
        
        <DrawerFooter className="border-t border-border pt-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
