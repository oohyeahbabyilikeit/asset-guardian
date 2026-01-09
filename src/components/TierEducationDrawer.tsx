import { useState } from 'react';
import { HelpCircle, Shield, Droplets, TrendingUp, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';

interface TierEducationDrawerProps {
  infrastructureIssues: InfrastructureIssue[];
  housePsi?: number;
  hardnessGPG?: number;
}

const WARRANTY_YEARS = {
  BUILDER: 6,
  STANDARD: 9,
  PROFESSIONAL: 12,
};

export function TierEducationDrawer({ 
  infrastructureIssues, 
  housePsi = 0,
  hardnessGPG = 0,
}: TierEducationDrawerProps) {
  const [open, setOpen] = useState(false);

  // Calculate bundled vs separate savings
  const separateCostTotal = infrastructureIssues.reduce((sum, issue) => {
    // Separate service calls typically cost 15-25% more
    return sum + Math.round(issue.costMax * 1.2);
  }, 0);

  const bundledCostTotal = infrastructureIssues.reduce((sum, issue) => {
    return sum + Math.round((issue.costMin + issue.costMax) / 2);
  }, 0);

  const potentialSavings = separateCostTotal - bundledCostTotal;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-auto py-1"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Why upgrade?
          <ChevronRight className="h-3 w-3" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">Understanding Your Options</DrawerTitle>
            <DrawerDescription>
              Here's why upgrading might make sense for your home
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 space-y-6">
            {/* Warranty Comparison */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Warranty Protection
              </h4>
              <div className="space-y-2">
                {Object.entries(WARRANTY_YEARS).map(([tier, years]) => (
                  <div key={tier} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={cn(
                        tier === 'STANDARD' && 'font-medium text-primary'
                      )}>
                        {tier === 'BUILDER' ? 'Good' : tier === 'STANDARD' ? 'Better' : 'Best'}
                      </span>
                      <span className="text-muted-foreground">{years} years</span>
                    </div>
                    <Progress 
                      value={(years / 12) * 100} 
                      className={cn(
                        "h-2",
                        tier === 'STANDARD' && '[&>div]:bg-primary'
                      )}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A longer warranty means years of worry-free ownership. The Better option gives you 50% more coverage than Good.
              </p>
            </div>

            {/* Infrastructure Explanations */}
            {infrastructureIssues.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Protecting Your Investment
                </h4>
                
                <div className="space-y-3">
                  {/* Water Pressure */}
                  {housePsi >= 60 && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-sm">Water Pressure: {housePsi} PSI</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {housePsi > 80 
                          ? "Your pressure exceeds safe limits. A PRV is required to protect your new unit."
                          : housePsi >= 70
                          ? "Your pressure is technically safe but on the high side. Installing a PRV now can extend your water heater's life by 2-3 years."
                          : "Moderate pressure. A PRV is optional but provides extra protection for maximum lifespan."
                        }
                      </p>
                    </div>
                  )}

                  {/* Water Hardness */}
                  {hardnessGPG > 7 && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <span className="font-medium text-sm">Water Hardness: {hardnessGPG} GPG</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {hardnessGPG > 15
                          ? "Very hard water detected. Your softener may need replacement to prevent scale buildup that can void warranties."
                          : hardnessGPG > 10
                          ? "Hard water is getting through. Servicing your softener now protects your new water heater from scale buildup."
                          : "Slightly hard water. Your softener appears to be working but may need attention soon."
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bundle Savings */}
            {potentialSavings > 100 && (
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Bundling Saves Money
                </h4>
                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Done separately later:</span>
                    <span className="line-through text-muted-foreground">${separateCostTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Bundled today:</span>
                    <span className="text-green-600 dark:text-green-400">${bundledCostTotal.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 border-t border-green-200 dark:border-green-800">
                    <div className="flex justify-between font-medium">
                      <span>Your savings:</span>
                      <span className="text-green-600 dark:text-green-400">${potentialSavings.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adding these items during installation avoids separate service calls and labor costs.
                </p>
              </div>
            )}

            {/* Time Savings */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                One Visit, Everything Done
              </h4>
              <p className="text-sm text-muted-foreground">
                Get your water heater and all infrastructure work completed in a single appointment. 
                No scheduling multiple service calls or taking additional time off work.
              </p>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Got it</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
