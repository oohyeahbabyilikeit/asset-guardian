import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Container, 
  ShieldCheck, 
  RotateCcw, 
  ArrowLeftRight,
  CircleDot,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react';
import type { EquipmentChecklist } from '@/types/technicianInspection';
import type { FuelType } from '@/lib/opterraAlgorithm';

interface EquipmentItem {
  key: keyof EquipmentChecklist;
  label: string;
  description: string;
  icon: React.ReactNode;
  recommendation?: string;
  tanklessOnly?: boolean;
}

const EQUIPMENT_ITEMS: EquipmentItem[] = [
  {
    key: 'hasExpTank',
    label: 'Expansion Tank',
    description: 'Thermal expansion protection device',
    icon: <Container className="h-5 w-5" />,
    recommendation: 'Required in closed-loop systems',
  },
  {
    key: 'hasPrv',
    label: 'PRV (Pressure Reducing Valve)',
    description: 'Regulates incoming water pressure',
    icon: <ShieldCheck className="h-5 w-5" />,
    recommendation: 'Recommended if pressure > 80 PSI',
  },
  {
    key: 'hasCircPump',
    label: 'Recirculation Pump',
    description: 'Provides instant hot water at fixtures',
    icon: <RotateCcw className="h-5 w-5" />,
  },
  {
    key: 'isClosedLoop',
    label: 'Closed Loop System',
    description: 'Check valve or backflow preventer present',
    icon: <ArrowLeftRight className="h-5 w-5" />,
    recommendation: 'Requires expansion tank if yes',
  },
  {
    key: 'hasIsolationValves',
    label: 'Isolation Valves',
    description: 'Shutoff valves for service access',
    icon: <CircleDot className="h-5 w-5" />,
    tanklessOnly: true,
  },
];

interface EquipmentStepProps {
  data: EquipmentChecklist;
  fuelType: FuelType;
  housePsi: number;
  onUpdate: (data: Partial<EquipmentChecklist>) => void;
  onNext: () => void;
}

export function EquipmentStep({ data, fuelType, housePsi, onUpdate, onNext }: EquipmentStepProps) {
  const isTankless = fuelType === 'TANKLESS_GAS' || fuelType === 'TANKLESS_ELECTRIC';
  
  // Filter items based on unit type
  const visibleItems = EQUIPMENT_ITEMS.filter(item => 
    !item.tanklessOnly || isTankless
  );
  
  // Calculate equipment score
  const equipmentScore = [
    data.hasExpTank,
    data.hasPrv,
    data.hasCircPump ? false : true, // Circ pump is optional, doesn't add to "protection"
  ].filter(Boolean).length;
  
  const needsPrv = housePsi > 80 && !data.hasPrv;
  const needsExpTank = data.isClosedLoop && !data.hasExpTank;
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Equipment Checklist</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Check for protection devices and accessories
        </p>
      </div>
      
      {/* Equipment Status Summary */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Protection Level</span>
          <Badge variant={equipmentScore >= 2 ? 'default' : 'secondary'}>
            {equipmentScore === 0 && 'Minimal'}
            {equipmentScore === 1 && 'Basic'}
            {equipmentScore >= 2 && 'Good'}
          </Badge>
        </div>
      </div>
      
      {/* Equipment Items */}
      <div className="space-y-3">
        {visibleItems.map((item) => {
          const isChecked = data[item.key] ?? false;
          const showWarning = 
            (item.key === 'hasPrv' && needsPrv) ||
            (item.key === 'hasExpTank' && needsExpTank);
          
          return (
            <div
              key={item.key}
              className={`p-4 rounded-lg border transition-colors ${
                isChecked ? 'border-primary bg-primary/5' : 'border-muted'
              } ${showWarning ? 'border-orange-300 bg-orange-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{item.label}</Label>
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => 
                        onUpdate({ [item.key]: checked } as Partial<EquipmentChecklist>)
                      }
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                  
                  {showWarning && (
                    <div className="flex items-center gap-1 mt-2 text-orange-600">
                      <HelpCircle className="h-3 w-3" />
                      <span className="text-xs">{item.recommendation}</span>
                    </div>
                  )}
                </div>
                
                <div className="ml-2">
                  {isChecked ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/30" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Warnings */}
      {(needsPrv || needsExpTank) && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-medium text-orange-800 mb-2">Recommendations</h4>
          <ul className="text-sm text-orange-700 space-y-1">
            {needsPrv && (
              <li>• PRV recommended - pressure is {housePsi} PSI (above 80)</li>
            )}
            {needsExpTank && (
              <li>• Expansion tank required for closed-loop systems</li>
            )}
          </ul>
        </div>
      )}
      
      <Button onClick={onNext} className="w-full">
        Continue to Softener Check
      </Button>
    </div>
  );
}
