import { ArrowLeft, Droplets, RefreshCw, Beaker, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SoftenerInputs, calculateSoftenerHealth } from '@/lib/softenerAlgorithm';

interface SoftenerMaintenancePlanProps {
  onBack: () => void;
  inputs: SoftenerInputs;
}

export function SoftenerMaintenancePlan({ onBack, inputs }: SoftenerMaintenancePlanProps) {
  const result = calculateSoftenerHealth(inputs);
  const { metrics, saltCalculator } = result;

  const handleReminder = (task: string) => {
    toast.success(`Reminder set for ${task}`, {
      description: "We'll notify you when it's time"
    });
  };

  const maintenanceTips = [
    {
      id: 'salt-check',
      icon: Droplets,
      title: 'Check Salt Level Monthly',
      description: 'Keep salt above the water line. Low salt = hard water breakthrough.',
      frequency: 'Monthly',
      nextDue: saltCalculator.nextRefillDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    },
    {
      id: 'brine-clean',
      icon: Beaker,
      title: 'Clean Brine Tank Yearly',
      description: 'Remove salt sludge buildup to maintain efficient regeneration cycles.',
      frequency: 'Yearly',
      nextDue: 'Schedule',
    },
    {
      id: 'resin-detox',
      icon: RefreshCw,
      title: 'Resin Cleaner Treatment',
      description: `Removes iron and mineral buildup. Current resin health: ${metrics.resinHealth}%`,
      frequency: 'Every 3-6 months',
      nextDue: metrics.resinHealth < 70 ? 'Recommended now' : 'In 3 months',
      urgent: metrics.resinHealth < 70,
    },
    {
      id: 'settings-check',
      icon: Calendar,
      title: 'Verify Regen Schedule',
      description: `Current interval: every ${metrics.regenIntervalDays} days. Adjust based on usage.`,
      frequency: 'Quarterly',
      nextDue: 'Review',
    },
  ];

  const proTips = [
    {
      title: 'Use Quality Salt',
      tip: 'Pellet or crystal salt works best. Avoid rock salt – it leaves more residue.'
    },
    {
      title: inputs.isCityWater && !inputs.hasCarbonFilter ? 'Add a Carbon Filter' : 'Protect Your Resin',
      tip: inputs.isCityWater && !inputs.hasCarbonFilter 
        ? 'Chlorine in city water degrades resin faster. A carbon pre-filter extends resin life 2-3x.'
        : 'Keep iron and chlorine away from resin to maximize its 10-15 year lifespan.'
    },
    {
      title: 'Watch for Hard Water Signs',
      tip: 'Spots on dishes, stiff laundry, or soap that won\'t lather = time to check your softener.'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-secondary rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Softener Maintenance</h1>
            <p className="text-xs text-muted-foreground">Keep your water soft & equipment healthy</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto p-4 space-y-6 pb-8">
        
        {/* Health Summary */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resin Health</p>
              <p className="text-2xl font-bold text-foreground">{metrics.resinHealth}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Salt Usage</p>
              <p className="text-lg font-semibold text-foreground">{metrics.saltUsageLbsPerMonth} lbs/mo</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Odometer: {metrics.odometer.toLocaleString()} cycles
              </span>
            </div>
          </div>
        </Card>

        {/* Maintenance Tasks */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Maintenance Schedule
          </h2>
          <div className="space-y-3">
            {maintenanceTips.map((task) => {
              const TaskIcon = task.icon;
              return (
                <Card 
                  key={task.id} 
                  className={`p-4 ${task.urgent ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      task.urgent ? 'bg-amber-500/20' : 'bg-secondary'
                    }`}>
                      <TaskIcon className={`w-5 h-5 ${task.urgent ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-foreground">{task.title}</h3>
                        {task.urgent && (
                          <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                            Attention
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{task.frequency}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={() => handleReminder(task.title)}
                        >
                          {task.nextDue === 'Schedule' || task.nextDue === 'Review' ? task.nextDue : `Due: ${task.nextDue}`}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Pro Tips */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Pro Tips
          </h2>
          <Card className="divide-y divide-border">
            {proTips.map((tip, index) => (
              <div key={index} className="p-4">
                <h3 className="font-medium text-foreground text-sm mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.tip}</p>
              </div>
            ))}
          </Card>
        </div>

        {/* Salt Refill Reminder */}
        <Card className="p-4 bg-secondary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Next Salt Refill</p>
              <p className="text-sm text-muted-foreground">
                ~{saltCalculator.daysUntilRefill} days ({saltCalculator.nextRefillDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleReminder('Salt Refill')}
            >
              Set Reminder
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
