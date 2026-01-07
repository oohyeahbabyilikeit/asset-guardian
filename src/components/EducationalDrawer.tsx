import { Info, X, Droplets, Gauge, Shield, ThermometerSun, Clock, Wrench } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export type EducationalTopic = 
  | 'aging' 
  | 'pressure' 
  | 'thermal-expansion' 
  | 'anode-rod' 
  | 'sediment' 
  | 'prv'
  | 'failure-rate'
  | 'hardness'
  | 'thermal'
  | 'temperature';

interface EducationalDrawerProps {
  topic: EducationalTopic;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

const topicContent: Record<EducationalTopic, {
  icon: React.ReactNode;
  title: string;
  description: string;
  sections: { heading: string; content: string }[];
  source?: string;
}> = {
  'aging': {
    icon: <Clock className="w-5 h-5" />,
    title: 'Understanding Water Heater Aging',
    description: 'How manufacturers estimate lifespan and what affects it',
    sections: [
      {
        heading: 'Expected Lifespan',
        content: 'Most tank water heaters are designed for 8-12 years of service. This varies based on water quality, usage patterns, and maintenance. Premium models with better anode protection may last 15+ years.'
      },
      {
        heading: 'Biological Age vs Calendar Age',
        content: '"Biological age" reflects actual wear on the system, not just time elapsed. A well-maintained 10-year unit may have less wear than a neglected 6-year unit. Factors like water hardness, pressure, and temperature all accelerate or slow this aging process.'
      },
      {
        heading: 'What Accelerates Aging',
        content: 'Hard water (high mineral content), high water pressure, extreme temperature settings, and infrequent maintenance all contribute to faster wear. Sediment buildup and depleted anode rods are the most common accelerators.'
      }
    ],
    source: 'Based on DOE appliance lifespan data and manufacturer specifications'
  },
  'pressure': {
    icon: <Gauge className="w-5 h-5" />,
    title: 'About Water Pressure',
    description: 'Why pressure matters for your plumbing system',
    sections: [
      {
        heading: 'Recommended Range',
        content: 'The EPA and plumbing industry recommend 40-60 PSI for residential water pressure. Pressure above 80 PSI is considered elevated and may reduce appliance lifespan.'
      },
      {
        heading: 'Effects of High Pressure',
        content: 'Sustained high pressure stresses pipe joints, valve seals, and appliance components. Water heaters, dishwashers, and washing machines are particularly sensitive. High pressure can also increase water waste.'
      },
      {
        heading: 'Pressure Regulation',
        content: 'A Pressure Reducing Valve (PRV) at your main water line can regulate incoming pressure. These typically last 7-12 years and should be inspected periodically. Many homeowners are unaware of their water pressure until problems arise.'
      }
    ],
    source: 'EPA residential plumbing guidelines'
  },
  'thermal-expansion': {
    icon: <ThermometerSun className="w-5 h-5" />,
    title: 'Thermal Expansion Explained',
    description: 'What happens when water heats up in a closed system',
    sections: [
      {
        heading: 'The Physics',
        content: 'When water heats from 50°F to 120°F, it expands by about 2%. In a 50-gallon tank, this creates roughly 1 gallon of additional volume that needs somewhere to go.'
      },
      {
        heading: 'Open vs Closed Systems',
        content: 'In older "open" systems, expanded water could flow back into the city main. Modern homes have check valves or PRVs that create "closed" systems—the expanded water has nowhere to escape, creating pressure spikes.'
      },
      {
        heading: 'Expansion Tanks',
        content: 'An expansion tank provides a cushion for this extra volume. It contains a bladder that compresses to absorb the expansion. Without one, each heating cycle creates a pressure spike that stresses the tank and T&P relief valve.'
      }
    ],
    source: 'Plumbing code requirements for closed-loop systems'
  },
  'thermal': {
    icon: <ThermometerSun className="w-5 h-5" />,
    title: 'Thermal Expansion Explained',
    description: 'What happens when water heats up in a closed system',
    sections: [
      {
        heading: 'The Physics',
        content: 'When water heats from 50°F to 120°F, it expands by about 2%. In a 50-gallon tank, this creates roughly 1 gallon of additional volume that needs somewhere to go.'
      },
      {
        heading: 'Open vs Closed Systems',
        content: 'In older "open" systems, expanded water could flow back into the city main. Modern homes have check valves or PRVs that create "closed" systems—the expanded water has nowhere to escape, creating pressure spikes.'
      },
      {
        heading: 'Expansion Tanks',
        content: 'An expansion tank provides a cushion for this extra volume. It contains a bladder that compresses to absorb the expansion. Without one, each heating cycle creates a pressure spike that stresses the tank and T&P relief valve.'
      }
    ],
    source: 'Plumbing code requirements for closed-loop systems'
  },
  'anode-rod': {
    icon: <Shield className="w-5 h-5" />,
    title: 'Anode Rod Protection',
    description: 'How your water heater protects itself from corrosion',
    sections: [
      {
        heading: 'Cathodic Protection',
        content: 'The anode rod is a "sacrificial" metal rod that corrodes instead of your tank. It attracts corrosive elements in the water, protecting the steel tank lining. This is the same principle used to protect ships and bridges.'
      },
      {
        heading: 'Depletion Timeline',
        content: 'Anode rods typically last 3-5 years in average water conditions. Hard water or water softeners can accelerate depletion to 2-3 years. Once depleted, the tank itself begins corroding.'
      },
      {
        heading: 'Inspection & Replacement',
        content: 'Checking the anode rod every 2-3 years is recommended. Replacement cost is typically $20-50 for the part, making it one of the most cost-effective maintenance items. Many homeowners are unaware this component exists.'
      }
    ],
    source: 'Water heater manufacturer maintenance guidelines'
  },
  'sediment': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Sediment Buildup',
    description: 'How minerals accumulate and affect performance',
    sections: [
      {
        heading: 'What Is Sediment?',
        content: 'Minerals dissolved in water (calcium, magnesium, iron) settle to the bottom of the tank as water heats. This is especially common in areas with hard water. Over time, this creates a layer of sedite on the tank floor.'
      },
      {
        heading: 'Effects on Performance',
        content: 'Sediment insulates the heating element from the water, reducing efficiency and increasing energy costs. In gas heaters, it can cause "rumbling" or "popping" sounds as water trapped under the sediment turns to steam.'
      },
      {
        heading: 'Prevention & Removal',
        content: 'Annual flushing (draining a few gallons from the drain valve) can remove loose sediment. Heavy buildup may require professional cleaning. Water softeners can reduce mineral content but may accelerate anode depletion.'
      }
    ],
    source: 'DOE water heater maintenance recommendations'
  },
  'hardness': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Water Hardness Explained',
    description: 'Understanding mineral content in your water',
    sections: [
      {
        heading: 'What Is Hard Water?',
        content: 'Water hardness measures dissolved calcium and magnesium content, typically in "grains per gallon" (gpg). Water above 7 gpg is considered moderately hard. Many US regions have naturally hard water from groundwater sources.'
      },
      {
        heading: 'Effects on Water Heaters',
        content: 'Hard water accelerates sediment buildup and scale formation on heating elements. This reduces efficiency, increases energy costs, and can shorten tank lifespan. Scale can also affect water flow and clog fixtures.'
      },
      {
        heading: 'Treatment Options',
        content: 'Water softeners remove minerals using ion exchange. While they reduce scale buildup, softened water accelerates anode rod depletion (2-3x faster). More frequent anode inspection is recommended with softeners.'
      }
    ],
    source: 'USGS water quality standards'
  },
  'temperature': {
    icon: <ThermometerSun className="w-5 h-5" />,
    title: 'Temperature Settings',
    description: 'How thermostat settings affect your water heater',
    sections: [
      {
        heading: 'Recommended Settings',
        content: 'Most manufacturers recommend 120°F (the "warm" or "normal" setting). This balances comfort, safety (reducing scald risk), and energy efficiency. Higher settings increase energy costs by 3-5% per 10°F.'
      },
      {
        heading: 'Effects of High Temperature',
        content: 'Settings above 120°F accelerate mineral precipitation, sediment formation, and anode consumption. Chemical reactions roughly double for every 18°F increase. This can significantly shorten tank lifespan.'
      },
      {
        heading: 'When Higher Temps Are Needed',
        content: 'Dishwashers without internal heaters may need 140°F water. Some households prefer higher temperatures for specific needs. Consider a mixing valve to maintain safe temperatures at fixtures while keeping tank temperature higher.'
      }
    ],
    source: 'DOE water heater efficiency guidelines'
  },
  'prv': {
    icon: <Wrench className="w-5 h-5" />,
    title: 'Pressure Reducing Valves (PRV)',
    description: 'How your home regulates incoming water pressure',
    sections: [
      {
        heading: 'Purpose',
        content: 'A PRV reduces high incoming water pressure from the city main to a safe level for your home plumbing. Municipal pressure can range from 80-150+ PSI, while homes are designed for 40-80 PSI.'
      },
      {
        heading: 'Lifespan & Maintenance',
        content: 'PRVs typically last 7-12 years. Signs of failure include fluctuating pressure, water hammer (banging pipes), or pressure creeping above the set point. Most PRVs are adjustable and can be set to your preferred pressure.'
      },
      {
        heading: 'When Missing',
        content: 'Homes without a PRV in high-pressure areas may experience premature appliance failure, leaky fixtures, and higher water bills. Adding a PRV is a relatively simple plumbing improvement.'
      }
    ],
    source: 'Plumbing industry standards'
  },
  'failure-rate': {
    icon: <Info className="w-5 h-5" />,
    title: 'Understanding Failure Statistics',
    description: 'How industry failure rates are calculated',
    sections: [
      {
        heading: 'What These Numbers Mean',
        content: 'Failure probability represents the statistical likelihood of significant failure based on units with similar characteristics. It\'s derived from aggregate industry data, not a prediction for your specific unit.'
      },
      {
        heading: 'Factors Considered',
        content: 'Age, installation conditions, water quality indicators, maintenance history, and environmental factors all contribute to failure rate calculations. Location (risk of water damage) affects urgency but not failure probability itself.'
      },
      {
        heading: 'Individual Variation',
        content: 'Your specific unit may perform better or worse than statistical averages. Well-maintained units often exceed expected lifespan, while units in harsh conditions may fail earlier. Regular inspection helps identify issues early.'
      }
    ],
    source: 'Aggregate data from manufacturer specs and field service records'
  }
};

export function EducationalDrawer({ topic, trigger, children, isOpen, onClose }: EducationalDrawerProps) {
  const content = topicContent[topic];
  
  const defaultTrigger = (
    <button className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
      <Info className="w-3 h-3" />
      Learn more
    </button>
  );

  // If controlled mode (isOpen/onClose provided)
  if (typeof isOpen !== 'undefined') {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {content.icon}
                </div>
                <div>
                  <DrawerTitle className="text-lg">{content.title}</DrawerTitle>
                  <DrawerDescription className="text-sm">
                    {content.description}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>
            
            <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[50vh]">
              {content.sections.map((section, index) => (
                <div key={index} className="space-y-1.5">
                  <h4 className="text-sm font-medium text-foreground">
                    {section.heading}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
              
              {content.source && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    {content.source}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Got it
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Trigger mode (original behavior)
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger || children || defaultTrigger}
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {content.icon}
              </div>
              <div>
                <DrawerTitle className="text-lg">{content.title}</DrawerTitle>
                <DrawerDescription className="text-sm">
                  {content.description}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          
          <div className="px-4 pb-6 space-y-4 overflow-y-auto max-h-[50vh]">
            {content.sections.map((section, index) => (
              <div key={index} className="space-y-1.5">
                <h4 className="text-sm font-medium text-foreground">
                  {section.heading}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            ))}
            
            {content.source && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground italic">
                  {content.source}
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-border">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Got it
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
