import { Info, Droplets, Gauge, Shield, ThermometerSun, Clock, Wrench } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useEducationalContent, EducationalContext } from '@/hooks/useEducationalContent';

export type EducationalTopic = 
  | 'aging' 
  | 'aging-tankless'
  | 'pressure' 
  | 'thermal-expansion' 
  | 'anode-rod' 
  | 'sediment' 
  | 'scale-tankless'
  | 'prv'
  | 'failure-rate'
  | 'hardness'
  | 'hardness-tankless'
  | 'thermal'
  | 'temperature'
  | 'tank-failure'
  | 'heat-exchanger';

interface EducationalDrawerProps {
  topic: EducationalTopic;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  /** Optional context for LLM-generated personalized content */
  context?: EducationalContext;
}

// Exported so other components can use static content directly
export const topicContent: Record<EducationalTopic, {
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
  'aging-tankless': {
    icon: <Clock className="w-5 h-5" />,
    title: 'Understanding Tankless Water Heater Aging',
    description: 'How tankless units age differently from tank systems',
    sections: [
      {
        heading: 'Expected Lifespan',
        content: 'Tankless water heaters typically last 15-20+ years with proper maintenance. They outlast tank units because they don\'t store water continuously, reducing corrosion exposure. The heat exchanger is the critical component that determines lifespan.'
      },
      {
        heading: 'What Determines Lifespan',
        content: 'The heat exchanger\'s condition is the primary factor. Scale buildup from hard water coats the exchanger, reducing efficiency and eventually causing overheating. Regular descaling is essential—especially in hard water areas.'
      },
      {
        heading: 'What Accelerates Aging',
        content: 'Hard water (scale buildup), undersized gas lines (causing flame rollout), clogged inlet filters, and skipped descaling are the main accelerators. Unlike tank units, tankless systems don\'t have anode rods to worry about.'
      }
    ],
    source: 'Based on tankless manufacturer specifications and field service data'
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
    title: 'Anode Life',
    description: 'A special rod inside your tank that protects it from rusting.',
    sections: [
      {
        heading: '🛡️ What is it?',
        content: 'Think of it like a bodyguard for your tank. This metal rod attracts rust to itself, so your tank stays healthy.'
      },
      {
        heading: '⚠️ What happens when it runs out?',
        content: 'Once the rod is used up, rust starts eating your tank from the inside. You won\'t see it until water starts leaking onto your floor.'
      },
      {
        heading: '✅ Good news',
        content: 'Replacing it is cheap ($20-50) and can add years to your water heater\'s life. It\'s like changing the oil in your car.'
      }
    ],
    source: 'Water heater manufacturer maintenance guidelines'
  },
  'sediment': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Sediment',
    description: 'Gunk that builds up at the bottom of your tank over time.',
    sections: [
      {
        heading: '🪨 What is it?',
        content: 'Your water has tiny bits of minerals in it. When the water heats up, these bits sink to the bottom. Year after year, they pile up like sand.'
      },
      {
        heading: '⚠️ Why is it a problem?',
        content: 'Too much gunk makes your heater work harder (higher bills!). It can also overheat the bottom of your tank and cause cracks and leaks.'
      },
      {
        heading: '✅ What can be done?',
        content: 'Flushing the tank washes out the loose stuff. But if it\'s been building up for years, it may be too late—sometimes it\'s safer to leave it alone.'
      }
    ],
    source: 'DOE water heater maintenance recommendations'
  },
  'scale-tankless': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Scale Buildup in Tankless Units',
    description: 'How minerals affect your heat exchanger',
    sections: [
      {
        heading: 'What Is Scale?',
        content: 'Unlike tank sediment that settles, scale in tankless units coats the heat exchanger\'s internal passages. Hard water minerals (calcium, magnesium) precipitate out when water is rapidly heated, building up on the exchanger surfaces.'
      },
      {
        heading: 'Effects on Performance',
        content: 'Scale insulates the heat exchanger, forcing the burner to work harder and reducing hot water output. Eventually, scale can restrict flow, trigger error codes, and cause the unit to overheat and shut down. Efficiency drops significantly.'
      },
      {
        heading: 'Prevention & Removal',
        content: 'Professional descaling every 1-3 years (depending on water hardness) dissolves scale buildup. Isolation valves allow easy service access. A water softener can dramatically reduce scale formation and extend descale intervals.'
      }
    ],
    source: 'Tankless manufacturer maintenance guidelines'
  },
  'heat-exchanger': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Heat Exchanger Health',
    description: 'The critical component in tankless water heaters',
    sections: [
      {
        heading: 'What It Does',
        content: 'The heat exchanger is the core of a tankless unit—it rapidly transfers heat from the burner or element to flowing water. Unlike tanks that store hot water, tankless units heat water on-demand through this component.'
      },
      {
        heading: 'Common Problems',
        content: 'Scale buildup is the #1 issue, coating internal passages and reducing heat transfer. In gas units, flame rollout from undersized gas lines can damage the exchanger. Leaks from the exchanger indicate the unit has reached end-of-life.'
      },
      {
        heading: 'Maintenance',
        content: 'Regular descaling (every 1-3 years based on water hardness) keeps the exchanger clean. Inlet filters should be checked annually. Error codes often indicate exchanger-related issues that need professional diagnosis.'
      }
    ],
    source: 'Tankless water heater manufacturer specifications'
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
  'hardness-tankless': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Water Hardness & Tankless Units',
    description: 'How hard water affects your tankless water heater',
    sections: [
      {
        heading: 'What Is Hard Water?',
        content: 'Water hardness measures dissolved calcium and magnesium content, typically in "grains per gallon" (gpg). Water above 7 gpg is considered moderately hard. Many US regions have naturally hard water from groundwater sources.'
      },
      {
        heading: 'Effects on Tankless Units',
        content: 'Hard water causes scale to coat the heat exchanger\'s internal passages. This is more problematic than tank sediment because it directly affects heat transfer and can restrict water flow. The higher the hardness, the more frequently descaling is needed.'
      },
      {
        heading: 'Treatment Options',
        content: 'Water softeners dramatically reduce scale formation and extend descale intervals from 1-2 years to 3-5+ years. Regular descaling (with or without a softener) keeps the heat exchanger clean. Isolation valves make descaling service much easier.'
      }
    ],
    source: 'USGS water quality standards and tankless manufacturer guidelines'
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
  },
  'tank-failure': {
    icon: <Droplets className="w-5 h-5" />,
    title: 'Tank Body Leaks',
    description: 'Why a leaking tank cannot be repaired',
    sections: [
      {
        heading: 'What\'s Happening',
        content: 'When water leaks from the tank body itself (not fittings or valves), it indicates the inner steel lining has corroded through. The glass lining that protects the steel has failed, allowing water to reach and rust through the metal.'
      },
      {
        heading: 'Why It Can\'t Be Repaired',
        content: 'Unlike a fitting leak which can be tightened or replaced, a tank body breach means the structural integrity is compromised. The corrosion will continue spreading. Welding or patching is not viable due to the pressure vessel nature of the tank.'
      },
      {
        heading: 'Immediate Risks',
        content: 'A small leak can become a catastrophic rupture with little warning. A 50-gallon tank can release its entire contents in minutes, causing significant water damage. If located above living spaces or near electrical systems, the risk compounds.'
      },
      {
        heading: 'What To Do Now',
        content: 'Turn off power (breaker for electric, gas valve for gas units) and shut off the cold water supply to the tank. Place towels or a bucket to catch drips. Schedule replacement as soon as possible—this is not a situation that can wait.'
      }
    ],
    source: 'Water heater manufacturer safety guidelines'
  }
};

// Loading skeleton for drawer content
function ContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

// Content renderer (reusable for both static and dynamic content)
function DrawerContentBody({ 
  content, 
  icon, 
  isLoading 
}: { 
  content: { title: string; description: string; sections: { heading: string; content: string }[]; source?: string };
  icon: React.ReactNode;
  isLoading: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <DrawerHeader className="text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
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
        {isLoading ? (
          <ContentSkeleton />
        ) : (
          <>
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
          </>
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
  );
}

export function EducationalDrawer({ topic, trigger, children, isOpen, onClose, context }: EducationalDrawerProps) {
  // Get static content as fallback
  const staticContent = topicContent[topic];
  
  // Only fetch LLM content if context is provided and drawer is open
  const shouldFetchLLM = Boolean(context) && (isOpen === true || isOpen === undefined);
  
  const { content: llmContent, isLoading, error } = useEducationalContent({
    topic,
    context,
    enabled: shouldFetchLLM,
  });
  
  // Use LLM content if available, otherwise fallback to static
  const displayContent = llmContent || {
    title: staticContent.title,
    description: staticContent.description,
    sections: staticContent.sections,
    source: staticContent.source,
  };
  
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
          <DrawerContentBody 
            content={displayContent} 
            icon={staticContent.icon} 
            isLoading={isLoading && !llmContent} 
          />
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
        <DrawerContentBody 
          content={displayContent} 
          icon={staticContent.icon} 
          isLoading={isLoading && !llmContent} 
        />
      </DrawerContent>
    </Drawer>
  );
}
