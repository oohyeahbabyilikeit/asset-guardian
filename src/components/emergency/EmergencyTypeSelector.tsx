import { Droplets, Flame, AlertTriangle, Thermometer, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export type EmergencyType = 'water-leak' | 'gas-smell' | 'co-alarm' | 'no-hot-water' | 'other';

interface EmergencyTypeSelectorProps {
  onSelect: (type: EmergencyType) => void;
  onBack: () => void;
}

const emergencyOptions = [
  {
    type: 'water-leak' as EmergencyType,
    icon: Droplets,
    label: 'Water Leak',
    description: 'I see water coming from the unit',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    urgency: 'urgent',
  },
  {
    type: 'gas-smell' as EmergencyType,
    icon: Flame,
    label: 'Gas Smell',
    description: 'I smell gas or rotten eggs',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    urgency: 'critical',
  },
  {
    type: 'co-alarm' as EmergencyType,
    icon: AlertTriangle,
    label: 'CO Alarm',
    description: 'My carbon monoxide detector is going off',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    urgency: 'critical',
  },
  {
    type: 'no-hot-water' as EmergencyType,
    icon: Thermometer,
    label: 'No Hot Water',
    description: 'Not urgent — I just have no hot water',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    urgency: 'normal',
  },
  {
    type: 'other' as EmergencyType,
    icon: HelpCircle,
    label: 'Other Problem',
    description: 'Something else is wrong',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    borderColor: 'border-border',
    urgency: 'normal',
  },
];

export function EmergencyTypeSelector({ onSelect, onBack }: EmergencyTypeSelectorProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border py-4 px-4">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            Report a Problem
          </h1>
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto">
        {/* Title */}
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            What's happening?
          </h2>
          <p className="text-sm text-muted-foreground">
            Select the option that best describes your situation
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {emergencyOptions.map((option, index) => {
            const Icon = option.icon;
            const isCritical = option.urgency === 'critical';
            
            return (
              <motion.button
                key={option.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(option.type)}
                className={`w-full p-4 rounded-xl border-2 ${option.borderColor} ${option.bgColor} 
                  hover:scale-[1.02] active:scale-[0.98] transition-all text-left
                  ${isCritical ? 'ring-1 ring-red-500/20' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${option.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{option.label}</h3>
                      {isCritical && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-500 text-white rounded uppercase">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Reassurance */}
        <p className="text-center text-xs text-muted-foreground mt-8 px-4">
          Don't worry — we'll guide you through the next steps based on your situation.
        </p>
      </div>
    </div>
  );
}
