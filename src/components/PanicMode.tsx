import { useState } from 'react';
import { EmergencyTypeSelector, EmergencyType } from './emergency/EmergencyTypeSelector';
import { WaterLeakFlow } from './emergency/WaterLeakFlow';
import { GasEmergencyFlow } from './emergency/GasEmergencyFlow';
import { COEmergencyFlow } from './emergency/COEmergencyFlow';
import { NonUrgentIssueFlow } from './emergency/NonUrgentIssueFlow';

interface PanicModeProps {
  onBack: () => void;
}

export function PanicMode({ onBack }: PanicModeProps) {
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

  const handleBack = () => {
    if (selectedType) {
      setSelectedType(null);
    } else {
      onBack();
    }
  };

  // Route to appropriate flow based on emergency type
  if (selectedType === 'water-leak') {
    return <WaterLeakFlow onBack={handleBack} />;
  }

  if (selectedType === 'gas-smell') {
    return <GasEmergencyFlow onBack={handleBack} />;
  }

  if (selectedType === 'co-alarm') {
    return <COEmergencyFlow onBack={handleBack} />;
  }

  if (selectedType === 'no-hot-water') {
    return <NonUrgentIssueFlow issueType="no-hot-water" onBack={handleBack} />;
  }

  if (selectedType === 'other') {
    return <NonUrgentIssueFlow issueType="other" onBack={handleBack} />;
  }

  // Default: show type selector
  return (
    <EmergencyTypeSelector 
      onSelect={setSelectedType} 
      onBack={onBack}
    />
  );
}
