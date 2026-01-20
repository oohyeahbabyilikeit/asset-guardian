import { useState } from 'react';
import { 
  Droplets, Shield, Flame, Filter, Wrench, Wind, 
  AlertTriangle, Gauge, Check, Phone 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { MaintenanceTask } from '@/lib/maintenanceCalculations';

interface ServiceSelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violations: MaintenanceTask[];
  maintenanceTasks: MaintenanceTask[];
  onSubmit: (selectedTasks: MaintenanceTask[]) => void;
}

export function ServiceSelectionDrawer({
  open,
  onOpenChange,
  violations,
  maintenanceTasks,
  onSubmit
}: ServiceSelectionDrawerProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  
  const allTasks = [...violations, ...maintenanceTasks];
  
  const toggleTask = (type: string) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };
  
  const selectAll = () => {
    setSelectedTypes(new Set(allTasks.map(t => t.type)));
  };
  
  const handleSubmit = () => {
    const selected = allTasks.filter(t => selectedTypes.has(t.type));
    onSubmit(selected);
    onOpenChange(false);
  };
  
  const getIcon = (task: MaintenanceTask) => {
    if (task.isInfrastructure) {
      if (task.type.includes('exp_tank')) return Droplets;
      if (task.type.includes('prv')) return Gauge;
      return AlertTriangle;
    }
    if (task.type === 'replacement_consult') return Wrench;
    switch (task.icon) {
      case 'droplets': return Droplets;
      case 'shield': return Shield;
      case 'flame': return Flame;
      case 'filter': return Filter;
      case 'valve': return Wrench;
      case 'wind': return Wind;
      case 'wrench': return Wrench;
      default: return Droplets;
    }
  };
  
  // Check if we're showing replacement option (different styling)
  const regularMaintenanceTasks = maintenanceTasks.filter(t => t.type !== 'replacement_consult');
  const replacementTasks = maintenanceTasks.filter(t => t.type === 'replacement_consult');
  
  // If replacement is the only option, auto-select it and show simplified UI
  const isReplacementOnly = replacementTasks.length > 0 && 
                            violations.length === 0 && 
                            regularMaintenanceTasks.length === 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {isReplacementOnly ? 'Replacement Recommended' : 'What would you like help with?'}
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">
            {isReplacementOnly 
              ? 'Based on our assessment, replacement is the best path forward'
              : 'Select the services you\'re interested in'}
          </p>
        </DrawerHeader>
        
        <div className="px-4 pb-4 space-y-4 overflow-y-auto">
          {/* Violations Section */}
          {violations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-destructive uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Code Violations
              </h3>
              <div className="space-y-2">
                {violations.map(task => {
                  const IconComponent = getIcon(task);
                  const isSelected = selectedTypes.has(task.type);
                  return (
                    <button
                      key={task.type}
                      onClick={() => toggleTask(task.type)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "border-destructive bg-destructive/10" 
                          : "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-destructive text-white" : "bg-destructive/15 text-destructive"
                      )}>
                        {isSelected ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{task.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.benefit}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Replacement Consultation Section - shown prominently when replacement is recommended */}
          {replacementTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5" />
                Recommended Action
              </h3>
              <div className="space-y-2">
                {replacementTasks.map(task => {
                  const IconComponent = getIcon(task);
                  const isSelected = selectedTypes.has(task.type);
                  return (
                    <button
                      key={task.type}
                      onClick={() => toggleTask(task.type)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "border-amber-500 bg-amber-500/10" 
                          : "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-amber-500 text-white" : "bg-amber-500/15 text-amber-600"
                      )}>
                        {isSelected ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{task.label}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Maintenance Tasks Section */}
          {regularMaintenanceTasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Maintenance
                </h3>
                <button 
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  Select all
                </button>
              </div>
              <div className="space-y-2">
                {regularMaintenanceTasks.map(task => {
                  const IconComponent = getIcon(task);
                  const isSelected = selectedTypes.has(task.type);
                  const isOverdue = task.urgency === 'overdue' || task.monthsUntilDue <= 0;
                  return (
                    <button
                      key={task.type}
                      onClick={() => toggleTask(task.type)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "border-primary bg-primary/10" 
                          : "border-border bg-card hover:bg-secondary/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : isOverdue 
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-secondary text-muted-foreground"
                      )}>
                        {isSelected ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{task.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.benefit}</p>
                      </div>
                      {isOverdue && !isSelected && (
                        <span className="text-xs font-medium text-amber-500 shrink-0">Due now</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <DrawerFooter className="border-t border-border">
          <Button 
            onClick={handleSubmit}
            disabled={selectedTypes.size === 0}
            className="w-full gap-2 h-12"
            size="lg"
          >
            <Phone className="w-4 h-4" />
            {selectedTypes.size === 0 
              ? 'Select services above' 
              : 'Have My Plumber Reach Out'
            }
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}