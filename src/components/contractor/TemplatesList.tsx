import { Mail, MessageSquare, Phone, Pencil, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type SequenceTemplate } from '@/hooks/useNurturingSequences';

interface TemplatesListProps {
  templates: SequenceTemplate[];
  onEdit: (templateId: string) => void;
  onNew: () => void;
}

function getActionIcon(action: string) {
  switch (action) {
    case 'sms':
      return MessageSquare;
    case 'email':
      return Mail;
    case 'call_reminder':
      return Phone;
    default:
      return MessageSquare;
  }
}

function getActionTypes(steps: { action: string }[]): string[] {
  const types = new Set<string>();
  steps.forEach(s => types.add(s.action));
  return Array.from(types);
}

function getTriggerDescription(triggerType: string): string {
  switch (triggerType) {
    case 'replacement_urgent':
    case 'urgent_replace':
      return 'Best for: Critical/High priority leads';
    case 'code_violation':
      return 'Best for: Safety compliance issues';
    case 'maintenance':
    case 'maintenance_reminder':
      return 'Best for: Routine maintenance';
    default:
      return `Trigger: ${triggerType.replace(/_/g, ' ')}`;
  }
}

export function TemplatesList({ templates, onEdit, onNew }: TemplatesListProps) {
  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const actionTypes = getActionTypes(template.steps);
        
        return (
          <div
            key={template.id}
            className={cn(
              'bg-card/80 backdrop-blur-sm rounded-xl border border-border/50',
              'p-4 transition-all duration-200',
              'hover:shadow-lg hover:shadow-black/10 hover:border-border',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="font-medium mb-1">{template.name}</h3>
                
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  <span>{template.steps.length} steps</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    {actionTypes.map((type) => {
                      const Icon = getActionIcon(type);
                      return (
                        <Icon 
                          key={type} 
                          className="w-3.5 h-3.5" 
                          aria-label={type}
                        />
                      );
                    })}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {getTriggerDescription(template.triggerType)}
                </p>
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(template.id)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Button>
            </div>
          </div>
        );
      })}
      
      {/* Create New Template Button */}
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed border-2 h-14 hover:border-violet-500/50 hover:bg-violet-500/5"
        onClick={onNew}
      >
        <Plus className="w-4 h-4" />
        Create New Template
      </Button>
    </div>
  );
}
