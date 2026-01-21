import { useState } from 'react';
import { 
  Droplets, Shield, Flame, Filter, Wrench, Wind, 
  AlertTriangle, Gauge, Check, Phone, Lightbulb, Clock, CalendarClock, Eye
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
  recommendations: MaintenanceTask[];
  onSubmit: (selectedTasks: MaintenanceTask[]) => void;
  // PASS verdict props for "Monitor Only" state
  isPassVerdict?: boolean;
  verdictReason?: string;
  verdictTitle?: string;
  yearsRemaining?: number;
}

export function ServiceSelectionDrawer({
  open,
  onOpenChange,
  violations,
  maintenanceTasks,
  recommendations,
  onSubmit,
  isPassVerdict = false,
  verdictReason,
  verdictTitle,
  yearsRemaining = 0,
}: ServiceSelectionDrawerProps) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  
  const allTasks = [...violations, ...maintenanceTasks, ...recommendations];
  
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
      case 'lightbulb': return Lightbulb;
      default: return Droplets;
    }
  };
  
  // Check if we're showing replacement option (different styling)
  const regularMaintenanceTasks = maintenanceTasks.filter(t => t.type !== 'replacement_consult');
  const replacementTasks = maintenanceTasks.filter(t => t.type === 'replacement_consult');
  
  // If replacement is the only option, auto-select it and show simplified UI
  const isReplacementOnly = replacementTasks.length > 0 && 
                            violations.length === 0 && 
                            regularMaintenanceTasks.length === 0 &&
                            recommendations.length === 0;
  
  // PASS verdict = "Monitor Only" state - no maintenance recommended
  const isMonitorOnly = isPassVerdict && allTasks.length === 0;
  
  // Determine the message based on verdict title
  const getMonitorMessage = () => {
    if (verdictTitle?.includes('Fused') || verdictTitle?.includes('fused')) {
      return 'Servicing an older tank can risk damage to corroded fittings.';
    }
    if (verdictTitle?.includes('Fragile') || verdictTitle?.includes('fragile')) {
      return 'At this age, maintenance procedures could cause more harm than good.';
    }
    if (verdictTitle?.includes('Run to Failure') || verdictTitle?.includes('run to failure')) {
      return 'The most cost-effective approach is to run the unit until it needs replacement.';
    }
    if (verdictTitle?.includes('No Issues')) {
      return 'Everything looks good! Continue normal use and plan ahead for eventual replacement.';
    }
    return verdictReason || 'Based on our analysis, no service is recommended at this time.';
  };

  // Monitor Only State
  if (isMonitorOnly) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              Your Unit Is Stable
            </DrawerTitle>
            <p className="text-sm text-muted-foreground">
              No service is recommended right now
            </p>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-4">
            {/* Explanation Card */}
            <div className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/15">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">Why We Recommend Monitoring</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getMonitorMessage()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Timeline Card */}
            {yearsRemaining > 0 && (
              <div className="rounded-xl p-4 bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary">
                    <CalendarClock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">Plan Ahead</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {yearsRemaining <= 2 
                        ? `Your unit is approaching end of life. Consider budgeting for replacement within the next ${yearsRemaining} year${yearsRemaining === 1 ? '' : 's'}.`
                        : `Based on typical lifespan, plan for replacement in approximately ${yearsRemaining} years.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DrawerFooter className="border-t border-border">
            <p className="text-xs text-center text-muted-foreground mb-2">
              We'll be here when you need us
            </p>
            <Button 
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="w-full h-12"
              size="lg"
            >
              Got It
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Standard Service Selection State
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>
            {isReplacementOnly ? "Let's Talk Options" : 'What would you like help with?'}
          </DrawerTitle>
          <p className="text-sm text-muted-foreground">
            {isReplacementOnly 
              ? 'Your plumber can walk you through what makes sense for your situation'
              : 'Select what you\'d like to discuss'}
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
                        isSelected ? "bg-destructive text-destructive-foreground" : "bg-destructive/15 text-destructive"
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
          
          {/* Recommendations Section - Urgent Actions */}
          {recommendations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-warning uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgent Actions
              </h3>
              <div className="space-y-2">
                {recommendations.map(task => {
                  const IconComponent = getIcon(task);
                  const isSelected = selectedTypes.has(task.type);
                  return (
                    <button
                      key={task.type}
                      onClick={() => toggleTask(task.type)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        isSelected 
                          ? "border-warning bg-warning/10" 
                          : "border-warning/30 bg-warning/5 hover:bg-warning/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-warning text-warning-foreground" : "bg-warning/15 text-warning"
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

          {/* Replacement Consultation Section - Add-ons */}
          {replacementTasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-accent-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                Add-Ons
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
                          ? "border-accent bg-accent/10" 
                          : "border-accent/30 bg-accent/5 hover:bg-accent/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent-foreground"
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
                            ? "bg-warning/15 text-warning"
                            : "bg-secondary text-muted-foreground"
                      )}>
                        {isSelected ? <Check className="w-5 h-5" /> : <IconComponent className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">{task.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{task.benefit}</p>
                      </div>
                      {isOverdue && !isSelected && (
                        <span className="text-xs font-medium text-warning shrink-0">Due now</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <DrawerFooter className="border-t border-border">
          <p className="text-xs text-center text-muted-foreground mb-2">
            No obligation—just a quick conversation
          </p>
          <Button 
            onClick={handleSubmit}
            disabled={selectedTypes.size === 0}
            className="w-full gap-2 h-12"
            size="lg"
          >
            <Phone className="w-4 h-4" />
            {selectedTypes.size === 0 
              ? 'Pick what you\'d like to discuss' 
              : 'Have My Plumber Reach Out'
            }
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
